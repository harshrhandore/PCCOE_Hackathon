# HeatGuard AI

**Predict heat. Protect people.**

Ward-level heat early warning and action support for the PCCOE International Grand Challenge 2026, Pune. AVCOE student-team research prototype. No PMC/IMD affiliation or operational national alert connection.

> Not just predicting heat — predicting human risk and enabling early action.

## Current build status

Implementation is in progress. The React 18 production build, four frontend state/export tests, and 63 Python scientific/rule/API tests have passed. Actual 2022 geography contains 58 validated wards. Scientific integration tests beyond the current reference suite,  real database migration replay, authentication/provider delivery, accessibility/performance measurements and deployment are **not yet accepted**. See [verification gates](docs/verification-register.md), [decisions](DECISIONS.md), and actual evidence under `reports/`. Do not call P0 complete from UI rendering alone.

The app has an editorial Daily Bulletin interface, actual historical ward-geometry preparation, static release/hash loader, public/detail/authority/worker/scenario/subscription/Methods/status routes, shared deterministic scientific rules, a fail-closed FastAPI enhancement, prepared Supabase/PostGIS migrations and explicit unavailable adapters. The local authority walkthrough says “Local demo — no messages sent” and does not replace authenticated workflow acceptance.

## Setup

Use Node **22.22.0**, Python **3.12.10**, and uv **0.11.33**. Exact npm and hashed Python resolutions are committed.

```powershell
npm ci
uv sync --frozen
npm run typecheck
npm test
uv run python -m pytest
```

If this Windows network stalls large Python wheel downloads, `python scripts/download-wheels.py` uses TLS-verified resumable ranges from the exact lockfile URLs, verifies final SHA-256 hashes, and caches wheels under ignored `data/raw/wheels`. It needs Python's `packaging` utility. No TLS verification is disabled. Once cached, install with uv's local `--find-links` option as documented in the final build report.

## Prepare real data

```powershell
uv run python -m pipeline.prepare_wards
uv run python -m pipeline.prepare_features
# One-time baseline acquisition; uses conservative upstream quota budgeting.
uv run python -m pipeline.build_climatology
# Radiation equations/reference checks have passed; indices remain explicitly approximate and urban surface assumptions are not locally validated.
uv run python -m pipeline.publish --fetch
uv run python scripts/validate-data.py
# Full five-complete-year real ERA5 scan; never substitutes synthetic episodes.
uv run python -m pipeline.select_replay --acquire --build-year 2026
```

Boundary count is derived from the licensed 2022 electoral GeoJSON, never hard-coded. Historical geography is labelled prominently. Missing demographic/crosswalk inputs yield unavailable vulnerability, hazard-only risk and null allocation priority. Missing radiation/context never becomes reassuring Level 0. Incomplete first candidates are diagnostics, not promoted operational releases; later incomplete candidates preserve the last complete snapshot.

```powershell
npm run dev
# Separate terminal; inject server environment explicitly before starting.
npm run api
npm run build
npm run test:e2e
```

Web: http://127.0.0.1:5173/ . API: http://127.0.0.1:8000/api/v1/health . Public static views work without the API. These are local addresses, not a deployed production URL. Copy `.env.example` locally and configure only the services needed; no secrets are included. Uvicorn does not automatically load `.env` with this command: export values in the shell or use your supervisor's environment file.

## Stack and changes from the deck

Vite/React 18 replaces Next.js for a static SPA. MapLibre/OpenFreeMap replaces Mapbox/Leaflet; an independent SVG polygon map survives tile failure. Telegram test delivery and SMS preview replace paid SMS delivery; Push is P1 and email P2. FastAPI is a dynamic enhancement behind static snapshots. thermofeel physics, optional future SHAP/calibration, CAP and GitHub Actions are added. No operational ML model is claimed.

The full requirements, build order and acceptance gates remain in [the expanded build prompt](HeatGuard_AI_Expanded_Build_Prompt.md). Accounts, native-language review and actual deployment cannot be fabricated. More setup, restore/rollback and pre-demo instructions will be finalized with the measured verification report.


For this network, the fully hashed offline installation was verified with `uv pip install --no-index --find-links data/raw/wheels --require-hashes -r requirements.lock.txt` after `scripts/download-wheels.py` acquired all 56 dependency wheels. The normal `uv sync --frozen` path remains intended for a network that supports full wheel transfers.


## Restore, refresh and pre-demo checks

- Reproduce the saved public demo without upstream availability: `npm ci`, `npm run build`, then `npm run dev`. Committed validated snapshots/geometry contain no private endpoints. No PWA/offline-install acceptance is claimed.
- Refresh with `uv run python -m pipeline.publish --fetch`; validate before deploying. Publication writes immutable files first, validates hashes/joins, then atomically promotes latest.json. To roll back, select an existing release manifest only after validating every referenced file; preserve snapshots referenced by alert evidence.
- Run `npm test`, `uv run python -m pytest`, `npm run test:e2e`, and `python scripts/secret-scan.py`. Browser tests need the local web server on 127.0.0.1:5173. View actual current results in reports, including skips and limitations.
- For Cloudflare Pages: configure the account/project and scoped token in CI, update CSP connect-src for the exact API origin, build and deploy with the prepared deploy workflow. A data branch and a successful source-build artifact are prerequisites for the separate snapshot workflow. Enable HEATGUARD_PIPELINE_ENABLED only after quota/retention and publication checks. The health-check schedule is a readiness read, not a suspension workaround.
- Before an event: inspect boundary vintage/count, exact source/publication ages, modifiers and radiation flags; verify prepared replay, API/DB readiness, independently provisioned officer/approver, bot Start consent and test allowlist; validate CAP, 360/1280 flows, API-down and tile fallback, native-language review flags and exact deployed URL. Never script successful delivery when unconfigured.
- Staff provisioning and encrypted endpoint cleanup are documented in docs/security.md and docs/privacy.md. Apply migrations to a disposable Supabase/PostGIS stack, replay from empty and run RLS/advisor checks before enabling privileged workflow. No real staff users are seeded.


Prepared real replay: **26?30 April 2024**, selected from the full 2021?2025 ERA5 scan using the declared metric. Open Scenarios or `/?mode=replay&episode=era5-2024-04-26&date=2024-04-26`. Both live and replay static artifacts are committed. `dist/` contains an assembled review/deployment artifact; Cloudflare deployment and live Telegram integration remain unconfigured.


Final local verification: **63 pytest passed, 4 Vitest passed, 10 Playwright passed / 2 intentional skips**. Viewport coverage: 360, 768, 1280 and 1920 pixels. Covered public pages passed serious/critical axe assertions. These results do not replace the incomplete acceptance gates recorded in reports/final-review.md.
