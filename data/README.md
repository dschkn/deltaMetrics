# DeltaMetrics data layer

This branch bootstraps the external data layer for DeltaMetrics.

The goal is not to turn the repository into a warehouse of random medical files. The goal is to make every external source reproducible, licensed, attributable, versioned, and ready for later ingestion into the Spring/PostgreSQL backend.

## What is included

### Open data that may be materialized in this branch

- **USDA FoodData Central / Foundation Foods (April 2026)** — food and nutrient tables. USDA states that FoodData Central data are public domain and published under CC0 1.0.
- **HL7 FHIR R5 core resource definitions** — selected machine-readable resource profiles useful for the future DeltaMetrics observation model. The FHIR specification is CC0; third-party terminologies referenced by FHIR keep their own licenses.
- **OMOP CDM 5.4 PostgreSQL DDL** — database-model reference files from OHDSI CommonDataModel (Apache License 2.0).

### Public-use data used only as an analysis input

- **CDC/NCHS NHANES 2021–2023** — demographics, questionnaires, examination and laboratory datasets. The bootstrap script downloads public-use XPT files from CDC temporarily and produces aggregate statistical tables. Raw respondent-level NHANES files are intentionally **not committed** to this public repository. NCHS public-use data are restricted to statistical analysis/reporting and prohibit re-identification or linkage to identifiable data.

### Sources prepared but not bundled

- **LOINC 2.83** — suitable for commercial and non-commercial use with attribution, but the current complete ZIP requires a free LOINC account/login. The project therefore records the version and integration target but does not automate unauthenticated redistribution.
- **DGE reference values** — machine-readable export exists, but redistribution rights need to be clarified before bundling.
- **CALIPER, NORIP, LMU München reference ranges** — useful reference sources; no sufficiently clear open bulk-redistribution license has been established for this repository.
- **PROMIS** — useful conceptual reference for adaptive questionnaires, but app/CAT integration has licensing/permission requirements. DeltaMetrics should build its own question bank and adaptive-selection logic.

## Directory layout

```text
data/
  README.md
  SOURCES.md
  sources.yml
  scripts/
    bootstrap_open_data.py
  open/
    usda/          # CC0 food/nutrient tables
    fhir/          # selected CC0 FHIR resource definitions
    omop/          # Apache-2.0 OMOP PostgreSQL DDL
  derived/
    nhanes/        # aggregate statistical outputs, not respondent-level data
  restricted/
    README.md      # instructions/pointers for sources requiring login or permission
```

## NHANES output philosophy

NHANES is a nationally representative survey, not a clinical reference-range authority. The first generated tables are exploratory population summaries only. They must never be presented as diagnosis, treatment advice, or laboratory reference intervals.

The bootstrap initially computes age/sex-stratified descriptive distributions and questionnaire response frequencies. A later analytics sprint should make the calculations survey-design aware (component-specific weights, strata and PSU handling) before they are used for serious inference.

## Rebuild

The source manifest lives in `data/sources.yml` and the reproducible downloader/ETL is `data/scripts/bootstrap_open_data.py`.

The GitHub Actions workflow on this branch can regenerate the open and derived files from their canonical sources.

## Safety / provenance rule

Every future derived health rule should retain provenance:

```text
source -> source version -> raw variable/code -> transformation version -> derived statistic/rule
```

This is deliberate: DeltaMetrics should be able to explain where a claim came from instead of becoming an opaque collection of "health facts".
