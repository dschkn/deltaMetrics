# External source and licensing notes

This file documents the source-level legal/provenance decisions for the data bootstrap branch. It is not legal advice; when DeltaMetrics becomes a commercial/clinical product, terms should be reviewed again at that time.

## USDA FoodData Central — bundled

- Source: https://fdc.nal.usda.gov/
- Dataset: Foundation Foods, April 2026 CSV release.
- USDA states FoodData Central data are public domain and published under CC0 1.0; no permission is required for use.
- DeltaMetrics still records USDA/FoodData Central as the source for provenance.

## CDC/NCHS NHANES — analysis input, raw files not bundled

- Source: https://wwwn.cdc.gov/nchs/nhanes/
- Cycle: August 2021–August 2023.
- Terms: https://www.cdc.gov/nchs/policy/data-user-agreement.html
- NCHS public-use files may be used only for statistical reporting and analysis. Re-identification and linkage to individually identifiable data are prohibited.
- DeltaMetrics therefore downloads respondent-level XPT files only into a temporary build directory and commits aggregate statistical outputs, never participant rows.

Current selected components include demographics; alcohol, blood-pressure/cholesterol, diet, diabetes, depression, health status, medical conditions, physical activity, reproductive health, prescriptions, sleep, smoking/tobacco and weight-history questionnaires; body measurements and measured blood pressure; and laboratory panels including ferritin, CBC, standard biochemistry, folate, HbA1c, glucose, HDL, hs-CRP, insulin, total cholesterol, transferrin receptor, LDL/triglycerides, sex steroids and vitamin D.

## LOINC — prepared, login required

- Source: https://loinc.org/downloads
- Version: 2.83, released 2026-08-19.
- License: https://loinc.org/license
- The LOINC license permits commercial and non-commercial use and redistribution subject to its attribution and content conditions.
- The current complete distribution requires a free LOINC login, so credentials and the archive are not fetched automatically by this repository.

Required notice when applicable:

> This material contains content from LOINC (http://loinc.org). LOINC is copyright © Regenstrief Institute, Inc. and the Logical Observation Identifiers Names and Codes (LOINC) Committee and is available at no cost under the license at http://loinc.org/license. LOINC® is a registered United States trademark of Regenstrief Institute, Inc.

## HL7 FHIR R5 — selected core definitions bundled

- Source: https://hl7.org/fhir/R5/
- Version: 5.0.0.
- License: CC0 1.0 for the FHIR specification.
- FHIR contains/references third-party terminology content whose separate licenses are not granted by the FHIR license. DeltaMetrics should therefore treat terminology bindings (e.g. SNOMED CT, CPT, ICD, LOINC content) as separately governed.

HL7, FHIR and the FHIR flame design are registered trademarks of Health Level Seven International; use here does not imply endorsement.

## OHDSI OMOP Common Data Model 5.4 — bundled reference DDL

- Source: https://github.com/OHDSI/CommonDataModel
- Package license declared by the project: Apache License 2.0.
- DeltaMetrics bundles the PostgreSQL DDL, primary-key, constraint and index scripts as architecture/reference material.
- OMOP vocabulary downloads can include third-party vocabularies with their own terms; they are not bundled by this bootstrap.

## Reference-only sources pending redistribution review

The following may be excellent scientific/reference sources but are not copied wholesale into the repository until bulk redistribution rights are clear:

- DGE reference-values tool: https://www.dge.de/wissenschaft/referenzwerte-tool/
- CALIPER database: https://caliperproject.ca/caliper/database/
- NORIP: https://www.norip.info/
- LMU München laboratory catalogue: https://mitlabmed2.srv.med.uni-muenchen.de/php/lv/lv_start.php

## PROMIS / HealthMeasures — do not bundle into the product by default

PROMIS is useful as a model for item banks, IRT and computer-adaptive testing. Electronic/app/CAT implementations can require permission/licensing. DeltaMetrics should implement its own question bank and adaptive-selection engine unless explicit rights are obtained.
