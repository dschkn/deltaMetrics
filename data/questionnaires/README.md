# DeltaMetrics questionnaire library

This directory contains versioned questionnaire definitions, schedules, scoring metadata and evidence-backed laboratory triggers.

## Included instruments

| ID | Role | Default cadence | Distribution status |
| --- | --- | --- | --- |
| `who5-2024-en` | Validated well-being screen | Every 14 days | Exact WHO English text; CC BY-NC-SA 3.0 IGO |
| `phq4-2009-en` | Validated anxiety/depression screen | Every 30 days or after a low WHO-5 | Exact English text; PHQ/GAD released without copyright restriction |
| `dm-global-10-v1-ru` | Broad health profile | Every 30 days | DeltaMetrics-authored; not PROMIS |
| `dm-distress-14-v1-ru` | Triggered symptom detail | Triggered only | DeltaMetrics-authored; not HADS |
| `dm-daily-check-in-v1-ru` | Personal longitudinal diary | Daily | DeltaMetrics-authored; not a clinical scale |

PROMIS Global-10 and HADS item text is intentionally absent. HealthMeasures requires prior written approval for app integration and public redistribution of PROMIS instruments. HADS is a licensed GL Assessment instrument. Source and rights records live in `evidence/sources.json`.

## Scheduling

`scheduling-rules.json` defines routine cadence and score/diary triggers. `lab-trigger-rules.json` defines conservative laboratory triggers. The executable selector and WHO-5/PHQ-4 scoring functions are in `app/questionnaire-engine.ts`.

Rules follow these constraints:

- validated instruments are always administered in full and are never rotated;
- a lab result can schedule symptom questions but cannot generate a psychiatric score;
- a falling value still inside its source-specific reference range does not trigger screening merely because it fell;
- ferritin is interpreted differently when inflammation or infection is independently known;
- missing answers are missing data, never zero;
- every screen can be declined or postponed;
- no result generates treatment, supplement, dose or diagnostic advice.

## Translation status

The exact distributable WHO-5 and PHQ-4 source forms are currently stored in English. Do not label a project translation as an official Russian validation. Add a Russian form only when its exact version, provenance and redistribution status are recorded.

## Product language

The UI should use `пользователь`, not `пациент`, unless DeltaMetrics is deployed inside a clinical relationship. Clinical instruments remain labelled as screening tools.
