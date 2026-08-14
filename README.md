# DeltaMetrics

Longitudinal health metrics tracker for medical test results, reference ranges, and body composition data.

DeltaMetrics turns medical reports collected over time into a searchable matrix: indicators run vertically, result dates run horizontally, and every value keeps its unit, reference range, and source document.

## Current prototype

- searchable longitudinal results matrix
- reference-range status highlighting
- indicator history and trend charts
- source document library
- editable indicator and category catalog
- body-composition measurements
- profile and prototype sign-in flow
- responsive desktop and mobile layouts

All values, dates, documents, and profile fields currently committed to the repository are fictional demo fixtures.

## Demo access

```text
username: demo
password: demo1234
```

This is a client-side UI prototype, not production authentication.

## Technology

- React 19
- TypeScript
- Next.js-compatible Vinext runtime
- Vite
- Cloudflare Workers-compatible frontend build
- GitHub Actions build validation

## Run locally

Requirements: Node.js 22.13+ and npm.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Production validation:

```bash
npm test
```

## Branch workflow

- `main` — production-ready code and the future CI/CD deployment source
- `developments` — active development branch
- feature branches — created from `developments`
- pull requests — merged into `main` after review and checks

Direct application development should happen in `developments`. Production deployment will run only after changes reach `main`.

## Planned server architecture

The next stage will introduce:

- Java and Spring Boot REST API
- self-hosted Supabase infrastructure
- PostgreSQL as the source of truth
- server-side users, password hashes, sessions, and authorization
- Supabase Storage or equivalent private object storage for source documents
- database migrations for schema only
- OpenAPI documentation
- unit and integration tests
- Docker Compose for local and server environments
- GitHub Actions deployment workflow triggered only from `main`
- deployment on the project owner's server

The normalized data model will follow this direction:

```text
user → profile → report → observation → indicator → unit → reference rule
                           └──────────── source document
```

## Data and secret policy

Real medical data must never be committed to git, included in frontend bundles, stored in repository fixtures, or printed in CI logs.

The repository may contain:

- database schema and migrations
- synthetic demo fixtures
- tests using synthetic data
- `.env.example` files containing variable names only

The server will contain:

- real user profiles
- medical observations and dates
- password hashes and sessions
- private source documents
- encrypted deployment secrets

GitHub Actions will receive only the deployment credentials required to publish an application build. Database and Supabase service credentials will remain server-side.

## Medical disclaimer

DeltaMetrics organizes and visualizes supplied data. It does not diagnose conditions, prescribe treatment, or replace a qualified medical professional.

## Status

Version `0.1.0`: frontend prototype, pre-backend.
