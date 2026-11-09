# Local hosting checkpoint - 8 November 2026

## No-login checkpoint - 9 November 2026 IST

The default Authority page now opens directly into the local preview. No account, Google OAuth configuration or database is required for its draft, simulated independent approval, simulated delivery, CSV export and reset flow. Browser checks at 360 and 1280 pixels confirmed that no login controls appear and no Auth, session or staff-alert API requests occur during this flow. The preview sends no messages and makes no staff database writes. Its approval identities are simulated, not authenticated people.

The optional authenticated integration remains at `/authority/staff`, with the existing backend authorization and approval guards. Direct local deep links and real staff browser flows passed there. Google OAuth work was cancelled before activation. A dedicated free-plan hosted Supabase project was created before the scope change, but the running app still uses its existing local configuration; hosted data migration and Google provider setup were not performed.

Current verification: **111 pytest passed, zero skipped**, including the eight opt-in local Auth/PostGIS checks; **24 Playwright passed, 8 deliberate duplicate-viewport skips**, zero unexpected failures or flaky results; TypeScript, production build, **4 Vitest checks**, public data validation and the bounded credential-pattern scan passed. Evidence: `tests/pytest.xml`, `tests/playwright.json`, `pytest.log`, `local-browser-run.log`, `build.log` and updated Authority screenshots. The saved complete live release remains `20261108T104546Z-da2088ccf5d2`; this change does not refresh weather, and stale-data warnings remain active. Earlier checkpoints below are historical.

## Startup performance checkpoint - 9 November 2026 IST

Current evidence: **111 pytest passed**, including actual local Auth/PostGIS integration; **24 Playwright passed, 8 deliberate duplicate-viewport skips**; production build, TypeScript and 4 Vitest checks passed. The added checks cover refreshed/replay-specific resource hints, private-path rejection and malformed replay URLs. Current successful logs and machine-readable results are retained under reports/.

Three production mobile/4G runs: performance **96 median (87-97)**, automated accessibility **100**, LCP **0.766 s median (0.766-3.458 s)**, CLS **0.000094 median**, initial JavaScript **155,239 transferred bytes**, forecast **19,305 bytes**. All six measured median budgets passed. One LCP run remained above 2.5 seconds; the range and raw reports are preserved, and INP remains unmeasured. See performance/summary.json and performance/budget-status.md. This is browser emulation, not a physical Android or full accessibility certification.

Startup now overlaps source-bound public data and font transfers with application loading. Server hints follow the live manifest or selected replay, including after refresh. Each resource was fetched once; the full ward list and hash validation remain active. Mutable manifests revalidate on every use. A replay URL without a valid episode fails honestly and can return to live mode.

The local database/staff workflow and measured median performance gates are complete for this prototype. Remaining acceptance centres on valid demographic/crosswalk data, native-language/manual accessibility review, local urban radiation and clinical/ML validation. Telegram stays optional and disabled. Earlier checkpoint text below is historical.

## Superseding local database checkpoint

The remaining local Auth/PostGIS work is now implemented and verified. Existing Ubuntu WSL runs Docker 29.1.3 and the pinned Supabase CLI 3.0.0. Services are PostgreSQL 17.11 (image 17.11.0.011), PostGIS 3.3.7, GoTrue 2.197.0, PostgREST 16.5 and Kong 2.8.1. Only loopback ports 54321/54322 are published. No hosted project or tunnel was created.

- **110 pytest passed**, including 8 opt-in tests against the real local Auth/PostGIS stack and 11 new claim/local-target checks. The normal database-independent run skips those 8 integration checks unless HEATGUARD_RUN_DB_TESTS=1. Evidence: reports/tests/pytest.xml and reports/tests/local-database.xml.
- **20 Playwright passed, 8 deliberate duplicate-viewport skips**. Two passing flows use actual local staff sign-in, database-backed drafts, independent approval, Exercise CAP download and cancellation. External browser requests are blocked during those flows and Telegram is disabled. Other server-contract tests remain explicitly mocked. Evidence: reports/tests/playwright.json and reports/local-browser-run.log.
- TypeScript, production build, 4 Vitest checks, public release validation and the expanded bounded credential-pattern scan passed. npm audit reports zero findings after pinning patched basic-ftp 6.2.6 in the development toolchain.
- All three migrations replayed successfully in a fresh disposable database using the actual Supabase Auth schema and PostGIS. Database privileges, revoked-session RLS, missing-membership rejection, viewer write denial, immutable audit, deferred ward-set checks and approved-content freezing were exercised. Equivalent expiry timezone offsets preserve approval bindings.
- A stop/start cycle retained all 10 then-existing alert records with identical IDs/statuses/revisions/content digests. The db:setup, db:start, db:configure, db:status and db:stop paths executed successfully. A project-owned hidden WSL keeper prevents idle distro suspension while the stack is active.
- Two explicit local test staff accounts have separate random passwords in ignored data/raw/local/staff-credentials.json. They are technical test identities, with no real municipal affiliation or identity verification. Test passwords were rotated during QA; sign-in now clears the password field immediately, including failures. No credential-bearing error snapshots are published.
- Fresh complete live release: 20261108T104546Z-da2088ccf5d2. Saved data still becomes stale after six hours; startup never silently fetches weather. Historical replay remains 26-30 April 2024.

Telegram is an optional extension, not a blocker for core local acceptance. Remaining work is the mobile performance target, valid demographic/crosswalk inputs, native-language and manual accessibility review, local urban radiation and clinical/ML validation. Earlier evidence below is historical and does not negate the completed local database checks. P0 is not claimed complete overall.

The user changed the target to local-only hosting. Cloud deployment, remote weather schedules and keep-alive jobs are removed. GitHub remains source control and verification CI. No online deployment was performed.

## Implemented

- `npm start` builds and serves the SPA, saved public data and FastAPI together at http://127.0.0.1:8081/. It binds only to loopback. Port selection, prerequisite checks, saved-data validation and root .env loading are included. Weather refresh is explicit.
- Local deep links work. Source paths, .env, traversal attempts and unknown API/asset paths return real errors. Static assets do not consume API quotas; API rate limiting remains enabled.
- Local responses use gzip with encoding negotiation. Browser hash checks operate on the exact decompressed source bytes. The hourly timeline indexes each timestamp once and reuses date formatters; it no longer repeatedly scans and formats every source hour for every cell.
- Saved what-if calculations use immutable weather-input bundles verified against the source snapshot digest. Zero deltas reproduce all daily indices and modifiers. The forecast request now includes three preceding UTC days so the first IST forecast day retains complete persistence context after UTC midnight.
- What-if UI shows applied inputs, baseline comparison, dates, changed/unknown values, clamps, provenance and simulation-labelled sharing. Abandoned requests cannot replace newer results. Browser internet status does not disable a reachable local calculation endpoint.
- Staff UI supports a protected queue, source-bound drafting, revision, independent exact-digest approval, CAP download, cancellation, audit and test delivery summaries. Tokens remain in memory; logout, expiry and rejected membership clear protected state.
- Delivery claims are persisted before provider handoff. Ambiguous outcomes are not blindly retried. Provider timeout/invalid responses remain unknown. Local database integration and concurrency have not been exercised against a real PostGIS server.

## Evidence

- Python: **91 passed**, including scientific reference checks, CAP XSD, workflow guards, provider outcomes, saved-bundle corruption and local serving/quota isolation. `reports/tests/pytest.xml` is the machine-readable result. One upstream TestClient deprecation warning remains.
- Frontend: **4 Vitest passed**, TypeScript and production build passed. Public data validation and bounded credential-pattern scan passed.
- Browser: **18 passed, 6 deliberate duplicate-viewport skips**, zero unexpected failures at 360/768/1280/1920 pixels. Covered public pages passed serious/critical axe assertions and document-overflow checks. External-network blocking checks exercised saved bulletin, real local what-if and replay in every viewport. The final build passed **4 additional local checks**, including the browser offline event, after enabling local reads regardless of internet status. These keep localhost available and do not emulate a stopped server. See `reports/tests/playwright.json`, `reports/local-browser-run.log` and `reports/final-local-smoke.log`.
- Authority browser contracts use explicitly labelled mocked accounts and provider responses; they do not establish real database, Auth or Telegram acceptance.
- Real data: 58 validated 2022 electoral wards; current saved complete live release `20261108T042450Z-34fcbf31b149`; replay 26-30 April 2024 selected from the full 2021-2025 ERA5 scan. Forecast and replay source bundles contain public weather and ward IDs only.
- Production localhost Lighthouse 13.6.0, three mobile/4G simulation runs: performance **69 median (68-70)**, automated accessibility **100 in all three**; median LCP **3.435 seconds**, CLS range **0-0.000103**, median TBT **991 ms**. Transfer was **404,874 bytes** per run. The 85 performance target remains unmet; lab TBT is not a measured INP. See [performance evidence](performance/budget-status.md). Scores are browser lab measurements on this Windows computer, not physical Android field results.

## Remaining acceptance

Real local Supabase Auth/PostGIS provisioning, migration replay/RLS/security tests, independent staff sign-in, Telegram ownership/consent/deletion and provider acknowledgement remain unverified. No usable database server binaries or Docker runtime were found; no hosted project is required or provisioned as a fallback. The public dashboard, replay and what-if do not depend on these integrations.

Matched demographic/crosswalk inputs and complete vulnerability cohorts are unavailable. The mobile performance target, native Hindi/Marathi review, remaining string coverage, full screen-reader/zoom/target-size/colour-vision checks, local urban radiation validation and clinical/ML validation remain incomplete. Missing values, approximation flags and simulation labels remain visible. P0 is not claimed complete.

Earlier reports retain historical cloud scope. This checkpoint and README supersede those deployment requirements. Browser external-network blocking tests keep loopback access available; they do not claim browser-without-server or PWA support.
