#!/usr/bin/env python3
"""Build the first external-data layer for DeltaMetrics.

Policy:
- USDA Foundation Foods: materialize CSV files (CC0/public domain).
- HL7 FHIR R5: materialize selected core JSON definitions (FHIR spec is CC0;
  downstream use of referenced third-party terminologies still needs their licenses).
- OMOP CDM 5.4: materialize PostgreSQL DDL reference files (Apache-2.0 project).
- CDC/NCHS NHANES: download public-use XPT files only into a temporary directory,
  calculate aggregate statistical tables, then delete raw respondent-level data.

The NHANES outputs are exploratory population summaries, NOT clinical reference
intervals and NOT treatment rules. Survey-design-aware weighting is a later task.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
import requests


ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
OPEN = DATA / "open"
DERIVED = DATA / "derived"
GENERATED = DATA / "generated"

USER_AGENT = "DeltaMetrics-data-bootstrap/0.1 (+https://github.com/dschkn/deltaMetrics)"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

NHANES_BASE = "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles"
NHANES_RELEASE = "2021-2023"

NHANES_DATASETS: dict[str, list[str]] = {
    "demographics": ["DEMO_L"],
    "questionnaire": [
        "ALQ_L",
        "BPQ_L",
        "DBQ_L",
        "DIQ_L",
        "DPQ_L",
        "HSQ_L",
        "MCQ_L",
        "PAQ_L",
        "RHQ_L",
        "RXQ_RX_L",
        "SLQ_L",
        "SMQ_L",
        "SMQRTU_L",
        "WHQ_L",
    ],
    "examination": ["BMX_L", "BPXO_L"],
    "laboratory": [
        "ALB_CR_L",
        "BIOPRO_L",
        "CBC_L",
        "FERTIN_L",
        "FOLATE_L",
        "GHB_L",
        "GLU_L",
        "HDL_L",
        "HSCRP_L",
        "INS_L",
        "TCHOL_L",
        "TFR_L",
        "TRIGLY_L",
        "TST_L",
        "VID_L",
    ],
}

USDA_FOUNDATION_URL = (
    "https://fdc.nal.usda.gov/fdc-datasets/"
    "FoodData_Central_foundation_food_csv_2026-04-30.zip"
)

FHIR_DEFINITIONS_URL = "https://hl7.org/fhir/R5/definitions.json.zip"
FHIR_RESOURCES = {
    "patient",
    "observation",
    "condition",
    "medicationstatement",
    "questionnaire",
    "questionnaireresponse",
    "documentreference",
    "diagnosticreport",
}

OMOP_FILES = [
    "https://raw.githubusercontent.com/OHDSI/CommonDataModel/main/inst/ddl/5.4/postgresql/OMOPCDM_postgresql_5.4_ddl.sql",
    "https://raw.githubusercontent.com/OHDSI/CommonDataModel/main/inst/ddl/5.4/postgresql/OMOPCDM_postgresql_5.4_primary_keys.sql",
    "https://raw.githubusercontent.com/OHDSI/CommonDataModel/main/inst/ddl/5.4/postgresql/OMOPCDM_postgresql_5.4_constraints.sql",
    "https://raw.githubusercontent.com/OHDSI/CommonDataModel/main/inst/ddl/5.4/postgresql/OMOPCDM_postgresql_5.4_indices.sql",
]


class BootstrapError(RuntimeError):
    pass


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url: str, target: Path, *, timeout: int = 180) -> Path:
    target.parent.mkdir(parents=True, exist_ok=True)
    print(f"download: {url}")
    with SESSION.get(url, stream=True, timeout=timeout) as response:
        response.raise_for_status()
        with target.open("wb") as fh:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    fh.write(chunk)
    if target.stat().st_size == 0:
        raise BootstrapError(f"Downloaded empty file from {url}")
    return target


def clean_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def safe_filename(name: str) -> str:
    name = Path(name).name.strip().lower()
    name = re.sub(r"[^a-z0-9._-]+", "_", name)
    return name.strip("_")


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def materialize_usda(tmp: Path, manifest: list[dict]) -> None:
    out = OPEN / "usda" / "foundation_foods_2026_04"
    clean_dir(out)
    archive = download(USDA_FOUNDATION_URL, tmp / "usda_foundation.zip")

    with zipfile.ZipFile(archive) as zf:
        csv_members = [m for m in zf.namelist() if m.lower().endswith(".csv")]
        if not csv_members:
            raise BootstrapError("USDA archive contained no CSV files")
        for member in csv_members:
            filename = safe_filename(member)
            target = out / filename
            with zf.open(member) as src, target.open("wb") as dst:
                shutil.copyfileobj(src, dst)
            manifest.append(
                {
                    "source": "USDA FoodData Central Foundation Foods",
                    "release": "2026-04-30",
                    "license": "CC0-1.0 / public domain",
                    "source_url": USDA_FOUNDATION_URL,
                    "path": str(target.relative_to(ROOT)),
                    "bytes": target.stat().st_size,
                    "sha256": sha256(target),
                }
            )


def materialize_fhir(tmp: Path, manifest: list[dict]) -> None:
    out = OPEN / "fhir" / "r5"
    clean_dir(out)
    archive = download(FHIR_DEFINITIONS_URL, tmp / "fhir_r5_definitions.zip")

    copied: set[str] = set()
    with zipfile.ZipFile(archive) as zf:
        for member in zf.namelist():
            base = Path(member).name.lower()
            for resource in FHIR_RESOURCES:
                accepted = {
                    f"{resource}.profile.json",
                    f"{resource}.schema.json",
                }
                if base in accepted:
                    target = out / base
                    with zf.open(member) as src, target.open("wb") as dst:
                        shutil.copyfileobj(src, dst)
                    copied.add(resource)
                    manifest.append(
                        {
                            "source": "HL7 FHIR R5",
                            "release": "5.0.0",
                            "license": "CC0-1.0 for FHIR specification; third-party terminology rights excluded",
                            "source_url": FHIR_DEFINITIONS_URL,
                            "path": str(target.relative_to(ROOT)),
                            "bytes": target.stat().st_size,
                            "sha256": sha256(target),
                        }
                    )

    missing = sorted(FHIR_RESOURCES - copied)
    (out / "README.md").write_text(
        "# Selected HL7 FHIR R5 definitions\n\n"
        "These files are copied from the official FHIR R5 JSON definitions archive.\n"
        "FHIR specification content is CC0. Referenced third-party terminologies may have separate terms.\n\n"
        f"Requested resources: {', '.join(sorted(FHIR_RESOURCES))}.\n\n"
        f"Definitions not found as standalone files in the archive: {', '.join(missing) if missing else 'none'}.\n",
        encoding="utf-8",
    )


def materialize_omop(tmp: Path, manifest: list[dict]) -> None:
    del tmp
    out = OPEN / "omop" / "5.4"
    clean_dir(out)
    for url in OMOP_FILES:
        target = out / Path(url).name
        download(url, target)
        manifest.append(
            {
                "source": "OHDSI OMOP CommonDataModel",
                "release": "5.4",
                "license": "Apache-2.0",
                "source_url": url,
                "path": str(target.relative_to(ROOT)),
                "bytes": target.stat().st_size,
                "sha256": sha256(target),
            }
        )


def age_band(age: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(age, errors="coerce")
    return pd.cut(
        numeric,
        bins=[-np.inf, 12, 18, 30, 40, 50, 60, 70, 80, np.inf],
        labels=["0-11", "12-17", "18-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80+"],
        right=False,
    ).astype("string")


def load_xpt(path: Path) -> pd.DataFrame:
    frame = pd.read_sas(path, format="xport", encoding="utf-8")
    frame.columns = [str(c) for c in frame.columns]
    return frame


def add_demo(frame: pd.DataFrame, demo: pd.DataFrame) -> pd.DataFrame:
    columns = [c for c in ["SEQN", "RIAGENDR", "RIDAGEYR", "WTINT2YR", "WTMEC2YR", "SDMVSTRA", "SDMVPSU"] if c in demo.columns]
    merged = frame.merge(demo[columns], on="SEQN", how="left", suffixes=("", "_DEMO"))
    merged["sex"] = pd.to_numeric(merged.get("RIAGENDR"), errors="coerce").map({1: "male", 2: "female"}).fillna("unknown")
    merged["age_band"] = age_band(merged.get("RIDAGEYR", pd.Series(index=merged.index, dtype=float)))
    return merged


def numeric_summary(dataset: str, frame: pd.DataFrame) -> list[dict]:
    rows: list[dict] = []
    excluded = {
        "SEQN",
        "RIAGENDR",
        "RIDAGEYR",
        "WTINT2YR",
        "WTMEC2YR",
        "SDMVSTRA",
        "SDMVPSU",
    }
    for variable in frame.columns:
        if variable in excluded or variable in {"sex", "age_band"}:
            continue
        values = pd.to_numeric(frame[variable], errors="coerce")
        valid_all = values.dropna()
        if len(valid_all) < 30 or valid_all.nunique() < 3:
            continue
        # Avoid treating obvious categorical codes as continuous distributions.
        if valid_all.nunique() <= 10 and np.allclose(valid_all % 1, 0):
            continue

        work = frame[["sex", "age_band"]].copy()
        work["value"] = values
        work = work.dropna(subset=["value", "age_band"])
        for (sex, band), group in work.groupby(["sex", "age_band"], observed=True):
            x = group["value"].dropna().astype(float)
            if len(x) < 20:
                continue
            q = x.quantile([0.05, 0.10, 0.25, 0.50, 0.75, 0.90, 0.95])
            rows.append(
                {
                    "release": NHANES_RELEASE,
                    "dataset": dataset,
                    "variable": variable,
                    "sex": sex,
                    "age_band": band,
                    "n": int(len(x)),
                    "mean": float(x.mean()),
                    "std": float(x.std(ddof=1)) if len(x) > 1 else math.nan,
                    "p05": float(q.loc[0.05]),
                    "p10": float(q.loc[0.10]),
                    "p25": float(q.loc[0.25]),
                    "p50": float(q.loc[0.50]),
                    "p75": float(q.loc[0.75]),
                    "p90": float(q.loc[0.90]),
                    "p95": float(q.loc[0.95]),
                    "analysis_status": "exploratory_unweighted_not_clinical_reference",
                }
            )
    return rows


def categorical_frequencies(dataset: str, frame: pd.DataFrame) -> list[dict]:
    rows: list[dict] = []
    excluded = {
        "SEQN",
        "RIAGENDR",
        "RIDAGEYR",
        "WTINT2YR",
        "WTMEC2YR",
        "SDMVSTRA",
        "SDMVPSU",
        "sex",
        "age_band",
    }
    for variable in frame.columns:
        if variable in excluded:
            continue
        series = frame[variable]
        non_null = series.dropna()
        unique = non_null.nunique(dropna=True)
        # Free-text/high-cardinality fields (e.g. medication names) are intentionally excluded.
        if unique == 0 or unique > 50:
            continue
        work = frame[["sex", "age_band"]].copy()
        work["value"] = series.astype("string")
        work = work.dropna(subset=["value", "age_band"])
        for (sex, band), group in work.groupby(["sex", "age_band"], observed=True):
            total = len(group)
            if total < 20:
                continue
            counts = group["value"].value_counts(dropna=False)
            for value, count in counts.items():
                rows.append(
                    {
                        "release": NHANES_RELEASE,
                        "dataset": dataset,
                        "variable": variable,
                        "sex": sex,
                        "age_band": band,
                        "value": value,
                        "count": int(count),
                        "proportion": float(count / total),
                        "analysis_status": "exploratory_unweighted_not_clinical_reference",
                    }
                )
    return rows


def materialize_nhanes(tmp: Path, manifest: list[dict]) -> None:
    out = DERIVED / "nhanes" / "2021_2023"
    clean_dir(out)
    raw_dir = tmp / "nhanes_raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    catalog_rows: list[dict] = []
    paths: dict[str, Path] = {}
    for component, datasets in NHANES_DATASETS.items():
        for dataset in datasets:
            url = f"{NHANES_BASE}/{dataset}.xpt"
            path = download(url, raw_dir / f"{dataset}.xpt")
            paths[dataset] = path
            catalog_rows.append(
                {
                    "release": NHANES_RELEASE,
                    "component": component,
                    "dataset": dataset,
                    "data_url": url,
                    "documentation_url": f"{NHANES_BASE}/{dataset}.htm",
                    "raw_committed": False,
                }
            )

    demo = load_xpt(paths["DEMO_L"])
    measurement_rows: list[dict] = []
    frequency_rows: list[dict] = []

    for component in ("laboratory", "examination"):
        for dataset in NHANES_DATASETS[component]:
            frame = add_demo(load_xpt(paths[dataset]), demo)
            measurement_rows.extend(numeric_summary(dataset, frame))

    for dataset in NHANES_DATASETS["questionnaire"]:
        frame = add_demo(load_xpt(paths[dataset]), demo)
        frequency_rows.extend(categorical_frequencies(dataset, frame))

    catalog = pd.DataFrame(catalog_rows)
    measurements = pd.DataFrame(measurement_rows)
    frequencies = pd.DataFrame(frequency_rows)

    catalog_path = out / "dataset_catalog.csv"
    measurement_path = out / "measurement_distributions_exploratory.csv"
    frequency_path = out / "questionnaire_frequencies_exploratory.csv"
    catalog.to_csv(catalog_path, index=False)
    measurements.to_csv(measurement_path, index=False)
    frequencies.to_csv(frequency_path, index=False)

    readme = out / "README.md"
    readme.write_text(
        "# NHANES 2021–2023 derived tables\n\n"
        "These files are derived from NCHS/CDC public-use NHANES datasets. Raw respondent-level XPT files are downloaded only during the build and are not committed here.\n\n"
        "**Important:** the current distributions/frequencies are exploratory and unweighted. They are not clinical reference intervals, diagnostic thresholds, or treatment guidance. NHANES has a complex survey design and some components require component/subsample-specific weights. A later analytics step must implement the official survey-design rules before inferential use.\n\n"
        "NCHS Data User Agreement: https://www.cdc.gov/nchs/policy/data-user-agreement.html\n",
        encoding="utf-8",
    )

    for target in [catalog_path, measurement_path, frequency_path, readme]:
        manifest.append(
            {
                "source": "CDC/NCHS NHANES public-use data (derived statistical output)",
                "release": NHANES_RELEASE,
                "terms": "NCHS Data User Agreement; statistical analysis/reporting only; no re-identification",
                "source_url": "https://wwwn.cdc.gov/nchs/nhanes/",
                "path": str(target.relative_to(ROOT)),
                "bytes": target.stat().st_size,
                "sha256": sha256(target),
            }
        )


def main() -> int:
    OPEN.mkdir(parents=True, exist_ok=True)
    DERIVED.mkdir(parents=True, exist_ok=True)
    GENERATED.mkdir(parents=True, exist_ok=True)
    manifest: list[dict] = []

    with tempfile.TemporaryDirectory(prefix="deltametrics-data-") as temp:
        tmp = Path(temp)
        materialize_usda(tmp, manifest)
        materialize_fhir(tmp, manifest)
        materialize_omop(tmp, manifest)
        materialize_nhanes(tmp, manifest)

    write_json(GENERATED / "materialized_files.json", manifest)
    print(f"materialized {len(manifest)} files")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"bootstrap failed: {exc}", file=sys.stderr)
        raise
