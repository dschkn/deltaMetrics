# Sources not automatically bundled

This directory documents sources that need credentials, explicit permission, or a clearer redistribution grant before their complete datasets are stored in the repository.

## LOINC 2.83

Current complete archive: `Loinc_2.83.zip` (released 2026-08-19).

The license permits broad use/redistribution with conditions, but the official complete download requires a free LOINC account. Do not commit usernames/passwords or session cookies.

When we are ready to ingest it:

1. Create/sign in to a free account at https://loinc.org/.
2. Download the current complete release from https://loinc.org/downloads.
3. Verify the release/version and included license.
4. Import the LOINC Table into a dedicated terminology schema in PostgreSQL.
5. Preserve `LOINC_NUM`, display/name fields, status, version and any `EXTERNAL_COPYRIGHT_NOTICE` required by third-party content.
6. Expose the required LOINC attribution in DeltaMetrics terms/about pages.

## DGE / CALIPER / NORIP / LMU München

These are currently treated as reference sources. Before copying bulk tables into a distributable DeltaMetrics build, obtain or verify explicit redistribution terms.

## PROMIS

Do not copy an item bank into DeltaMetrics by default. We will use the CAT/IRT architecture idea and write a DeltaMetrics-owned adaptive question bank unless separate permission is obtained.
