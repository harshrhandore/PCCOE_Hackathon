# HeatGuard AI

**Predict heat. Protect people.**

Ward-level heat early warning and action support for the PCCOE International Grand Challenge 2026, Pune. AVCOE student-team research prototype. No PMC/IMD affiliation or operational national alert connection.

> Not just predicting heat — predicting human risk and enabling early action.

## Current build status

Implementation is in progress. The React 18 production build, four frontend state/export tests, and 63 Python scientific/rule/API tests have passed. Actual 2022 geography contains 58 validated wards. Scientific integration tests, acquisition of a complete baseline/replay, real database migration replay, authentication/provider delivery, accessibility/performance measurements and deployment are **not yet accepted**. See [verification gates](docs/verification-register.md), [decisions](DECISIONS.md), and actual evidence under `reports/`. Do not call P0 complete from UI rendering alone.

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
