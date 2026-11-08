# HeatGuard AI

**Predict heat. Protect people.** Ward-level heat early-warning research prototype for Pune, AVCOE student team, PCCOE International Grand Challenge 2026. No PMC/IMD affiliation or operational national alert connection.

## Local setup

Use Node **22.22.0**, Python **3.12.10**, and uv **0.11.33**. From the repository root:

```powershell
npm ci
uv sync --frozen
npm run local:check
npm start
```

Open **http://127.0.0.1:8081/**. The command builds and serves the frontend and API together, bound only to this computer. Keep the terminal running; Ctrl+C stops it. No cloud account or database is needed for the saved public dashboard, replay and what-if calculations. Starting the app does not fetch weather.

Reuse a build with `npm start -- --no-build`. Choose another port with `npm start -- --port 8082`. Port 8080 is occupied by another service on this computer.

First installation needs internet. If large wheel downloads stall, `python scripts/download-wheels.py` (requires Python packaging) resumes TLS-verified transfers and checks exact lockfile hashes. After caching, this installation was verified:

```powershell
uv pip install --no-index --find-links data/raw/wheels --require-hashes -r requirements.lock.txt
```

Saved weather, geography, climatology and compact input bundles are committed. Optional external tiles have an independent SVG ward fallback. This is a local server, with no PWA or browser-without-server claim. Fresh weather and optional Telegram delivery need internet.

## Refresh and development

Run `npm run local:refresh` explicitly, then `npm run data:validate`. A running local server reads refreshed snapshots without a JavaScript rebuild. Publication writes immutable files, validates hashes and joins, then atomically promotes latest.json. Incomplete candidates preserve the last complete release. Inspect source ages, stale warnings and approximation flags before use.

Development uses `npm run dev` and `npm run api` in separate terminals: Vite on 5173 proxies /api to the loopback API on 8000. Normal local hosting uses 8081 and same-origin /api/v1. Copy .env.example to .env only for optional configuration. `npm start` loads it without logging values; the separate development API expects exported shell variables. Never put secrets in VITE_ values.

```powershell
npm run typecheck
npm test
.venv/Scripts/python.exe -m pytest --junitxml=reports/tests/pytest.xml
npm run build
.venv/Scripts/python.exe scripts/validate-data.py
.venv/Scripts/python.exe scripts/secret-scan.py
# With npm start running:
$env:HEATGUARD_TEST_BASE_URL='http://127.0.0.1:8081'
npm run test:e2e
```

On Linux use .venv/bin/python or uv run python. The legacy-named scripts/assemble-deploy.py assembles a local artifact and uploads nothing.

## Behavior and limits

React 18/Vite and FastAPI share deterministic thermofeel/pythermalcomfort rules. The public dashboard, ward details, Methods, worker screening, historical replay, local authority walkthrough and what-if comparison are available. Real 2022 DataMeet electoral geography contains 58 wards and is labelled historical. The 1991-2020 ERA5 baseline uses two actual source cells. Prepared replay: **26-30 April 2024**, selected from the full 2021-2025 ERA5 scan. Open `/?mode=replay&episode=era5-2024-04-26&date=2024-04-26`.

Missing matched demographics remain unavailable: vulnerability and priority are null, with hazard-only risk. Radiation and derived indices remain approximate, without local urban or clinical validation. No trained ML model or invented skill is claimed. Native Hindi/Marathi review is pending; newer strings use English fallback.

The local authority walkthrough sends nothing. The real staff UI supports source-bound drafts, independent revision/digest approval, restricted CAP export, cancellation and delivery outcomes. It requires a separately configured local Supabase Auth/PostGIS stack, staff provisioning, migration/RLS verification and optional test-only Telegram credentials. Those real integrations remain unaccepted. No usable local database server or Docker runtime was found at this checkpoint; missing configuration fails closed. See docs/security.md and docs/privacy.md. No inbound tunnel is started automatically.

## Scope

**Local hosting supersedes online-hosting requirements.** Cloud deployment, remote scheduled pipeline and keep-alive workflows have been removed. GitHub stores source and runs verification CI only. No online deployment is performed. DECISIONS.md records this override; the expanded build prompt remains historical requirements context.

See reports/local-verification.md for current evidence and remaining acceptance. Older reports retain earlier scope. P0 is not claimed complete.
