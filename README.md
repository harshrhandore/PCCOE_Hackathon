# HeatGuard AI

**No account is required for the normal app.** The Authority page opens directly into a clearly labelled local preview. Drafting, simulated approval, CSV export and simulated delivery work without signing in. This preview sends no messages and performs no staff database writes. Use `npm start` and open http://127.0.0.1:8081/.

The protected staff integration is retained only as an optional advanced workspace at `/authority/staff`; it is not needed for the local prototype. Google login is not enabled. The dedicated hosted **HeatGuard AI** Supabase project was created on the free plan, but the app has not been switched to it and no Google OAuth client was configured.

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

The local authority walkthrough sends nothing. A real local Supabase Auth/PostGIS stack now supports source-bound drafts, independent revision/digest approval, restricted CAP export, cancellation and audit records. Eight actual database/Auth integration checks passed, including migration replay and RLS; the real browser workflow also passed at phone and desktop sizes. Telegram is optional and disabled: no messages are sent. See docs/security.md and docs/privacy.md. No inbound tunnel is started automatically.

## Local staff workspace

On this Windows machine, Ubuntu is already installed in WSL. The setup command installs Docker inside that distro and verifies the pinned Supabase CLI package. It does not install Docker Desktop or create a hosted project. First setup needs internet for software and container downloads; subsequent use works locally.

```powershell
npm run db:setup
npm run db:start
npm run staff:bootstrap
npm start
```

`db:start` starts only database, Auth, gateway and Data API services, applies pending local migrations, checks loopback port bindings, configures a non-superuser application login and mirrors validated public geography/manifests. Database port: 54322; local Auth gateway: 54321; app: 8081. On Linux, install Docker first; npm ci supplies the pinned CLI and db:start uses it directly. Set HEATGUARD_WSL_DISTRO if your existing Windows distro is named differently from Ubuntu.

The bootstrap creates two explicitly labelled **local test staff accounts**, officer and approver, with separate random passwords. Open `data/raw/local/staff-credentials.json` locally to use them in the optional `/authority/staff` workspace. The default Authority preview needs neither accounts nor the database. Credentials, signing keys and service configuration stay in ignored files; do not upload them. These accounts do not represent real municipal authorities. An officer submits a draft, then a separate approver signs in to approve that exact revision. CAP download and cancellation work with Telegram disabled.

To provision your own account, run `npm run staff:create -- --email your-address@example.org --role officer` and enter a password privately when prompted. Use role approver for a second account. `npm run staff:disable -- --email your-address@example.org` revokes membership. Public signup and anonymous login are disabled.

Use `npm run db:stop` to stop this project's services while retaining its data. `db:start` resumes them. The Windows helper retains one hidden, project-owned WSL process while the stack runs; db:stop releases it. Other WSL projects are untouched. The stop/start persistence check preserved all existing alert content digests.

Run the actual database checks explicitly:

```powershell
$env:HEATGUARD_RUN_DB_TESTS='1'
.venv/Scripts/python.exe -m pytest services/api/tests/test_local_database_integration.py
$env:HEATGUARD_TEST_BASE_URL='http://127.0.0.1:8081'
npm run test:e2e
```

The migration test creates and removes only its own disposable database; it does not reset your application database. Integration-test staff accounts are disabled and their sessions revoked on teardown. Their audit evidence is retained. CI runs the same local stack and tests without hosted credentials.

## Scope

**Local hosting supersedes online-hosting requirements.** Cloud deployment, remote scheduled pipeline and keep-alive workflows have been removed. GitHub stores source and runs verification CI only. No online deployment is performed. DECISIONS.md records this override; the expanded build prompt remains historical requirements context.

See reports/local-verification.md for current evidence and remaining acceptance. Older reports retain earlier scope. P0 is not claimed complete.

Production performance can be checked with `npm run audit:local` while the app runs. The latest three mobile/4G simulations reached performance 96 median (87-97), automated accessibility 100 and LCP 0.77 seconds median (0.77-3.46 seconds). All measured median budgets passed; the LCP outlier and unmeasured INP are disclosed in reports/performance/budget-status.md. CI records the same three-run check.
