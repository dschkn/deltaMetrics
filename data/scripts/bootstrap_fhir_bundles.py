#!/usr/bin/env python3
"""Materialize the machine-readable HL7 FHIR R5 definition bundles.

The official `definitions.json.zip` is a bundle archive. Individual core resources
such as Patient/Observation are contained inside `profiles-resources.json`, rather
than being emitted as one standalone JSON file per resource. This script keeps the
canonical bundle files that are useful for code generation/mapping.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
import zipfile
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "open" / "fhir" / "r5"
MANIFEST = ROOT / "data" / "generated" / "materialized_files.json"
URL = "https://www.hl7.org/fhir/R5/definitions.json.zip"

WANTED = {
    "profiles-resources.json",
    "profiles-types.json",
    "profiles-others.json",
    "valuesets.json",
    "conceptmaps.json",
    "search-parameters.json",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="deltametrics-fhir-") as d:
        archive = Path(d) / "definitions.json.zip"
        response = requests.get(
            URL,
            timeout=180,
            headers={"User-Agent": "DeltaMetrics-data-bootstrap/0.1 (+https://github.com/dschkn/deltaMetrics)"},
        )
        response.raise_for_status()
        archive.write_bytes(response.content)

        copied: list[Path] = []
        available: list[str] = []
        with zipfile.ZipFile(archive) as zf:
            for member in zf.namelist():
                base = Path(member).name.lower()
                available.append(base)
                if base not in WANTED:
                    continue
                target = OUT / base
                with zf.open(member) as src, target.open("wb") as dst:
                    shutil.copyfileobj(src, dst)
                copied.append(target)

        if not any(p.name == "profiles-resources.json" for p in copied):
            candidates = sorted({n for n in available if "profile" in n or "resource" in n})[:100]
            raise RuntimeError(
                "FHIR archive did not contain profiles-resources.json. "
                f"Candidate filenames: {candidates}"
            )

    current: list[dict] = []
    if MANIFEST.exists():
        current = json.loads(MANIFEST.read_text(encoding="utf-8"))
    current = [row for row in current if row.get("source") != "HL7 FHIR R5 definition bundles"]
    for target in sorted(copied):
        current.append(
            {
                "source": "HL7 FHIR R5 definition bundles",
                "release": "5.0.0",
                "license": "CC0-1.0 for FHIR specification; third-party terminology rights excluded",
                "source_url": URL,
                "path": str(target.relative_to(ROOT)),
                "bytes": target.stat().st_size,
                "sha256": sha256(target),
            }
        )
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(current, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    (OUT / "README.md").write_text(
        "# HL7 FHIR R5 machine-readable definition bundles\n\n"
        "Materialized from the official FHIR R5 `definitions.json.zip`. "
        "Core resource StructureDefinitions (including Patient, Observation, Condition, "
        "Questionnaire, QuestionnaireResponse, DiagnosticReport, DocumentReference and "
        "MedicationStatement) live inside `profiles-resources.json`.\n\n"
        "FHIR specification content is CC0. Referenced third-party terminologies retain "
        "their own licensing terms.\n",
        encoding="utf-8",
    )
    print("FHIR bundles:", ", ".join(p.name for p in sorted(copied)))


if __name__ == "__main__":
    main()
