# Verification register

> Scope update, 2026-11-08: local hosting supersedes cloud deployment and scheduling. Earlier cloud research is historical; see [current local verification](../reports/local-verification.md).

Started 2026-11-07 before implementation. Official-source access date for all entries: 2026-11-07. Retrieved-source hashes/redirects/errors are in `docs/evidence/retrievals.json`; package metadata in `npm-versions.json`. Status means the **stated implementation scope** is verified, not that the entire tier is complete. `pending` and `unavailable` explicitly block affected acceptance. Excerpts are at most 25 words per source.

## V01 ? verified

- Version/evidence: Open-Meteo forecast and pricing, accessed 2026-11-07; current HTTP response.
- Official source: https://open-meteo.com/en/docs
- Finding: Requested instantaneous GHI/direct-horizontal/diffuse/DNI, T/RH/dew-point/wind/pressure/cloud fields tested on the actual free forecast endpoint. UTC epoch seconds, Celsius, m/s, W/m? and hPa confirmed. best_match is mixed/unknown run, not an invented initialization.
- Implementation consequence: Only noncommercial educational prototype use. Terms: <10,000/day, 5,000/hour, 600/minute; monthly planning 300,000. Conservative location ? max(1,variables/10) ? max(1,days/14), one model, rounded upward. Review shared-IP/monthly usage separately. Cache, warning at 60%, stop at 80%.
- Evidence excerpt: ?You may only use the free API services for non-commercial purposes.?

## V02 ? verified

- Version/evidence: Open-Meteo archive/run docs, accessed 2026-11-07.
- Official source: https://open-meteo.com/en/docs/single-runs-api
- Finding: Corrected original pointer to /en/docs/single-runs-api. Initialization selector is run=. ECMWF IFS from March 2024; other model archives from April 2026 in retrieved docs. Continuous historical series is not a lead-time archive. Actual ERA5 48-hour instant-radiation probe succeeded.
- Implementation consequence: Use ERA5 only for reanalysis replay/baseline. No genuine historical issued-forecast training or ensemble percentage is claimed. Ensemble adapter remains disabled until selected model/member coverage is tested.
- Evidence excerpt: ?Access any individual model run by initialisation time?

## V03 ? pending

- Version/evidence: thermofeel 2.3.0 tag and pythermalcomfort 4.8.1 docs, accessed 2026-11-07.
- Official source: https://github.com/ecmwf/thermofeel/blob/2.3.0/thermofeel/thermofeel.py
- Finding: Verified actual signatures: calculate_utci(t2_k,va,mrt,td_k=None,ehPa=None), output K; dew-point inverse accepts (rh,t2_k); Liljegren full natural-wet-bulb/globe WBGT requires hPa pressure and instantaneous irradiance/solar geometry; output K. MRT needs longwave and net surface terms absent from chosen Open-Meteo endpoint. Apache-2.0 / MIT.
- Implementation consequence: Explicit C?K/hPa adapters, domain flags and wind floors. Longwave/surface estimator stays gated until documented independent arithmetic and thermal checks execute. Local urban radiation validation remains absent even after those checks.
- Evidence excerpt: ?returns UTCI [K]?

## V04 ? verified

- Version/evidence: Official IMD FAQ PDF pages 1?2,8,13?14; NWS regression; UTCI library docs, accessed 2026-11-07.
- Official source: https://mausam.imd.gov.in/pdfs/heatcolduser/FAQ_heat_wave.pdf
- Finding: Verified plains 40, hills 30, coastal 37 gates and distinct coastal departure definition; two stations/two days restriction. NWS Rothfusz regression and adjustments checked; chart 100?F/55% example checked. UTCI endpoint convention is explicit analyst dashboard mapping preserving >46 extreme.
- Implementation consequence: Implement plains badge only, never official declaration. Shade/light-wind Heat Index bands are distinct from UTCI hazard. Actual unit/reference tests still determine numerical acceptance.
- Evidence excerpt: ?at least in 2 stations in a Meteorological sub-division for at least two consecutive days?

## V05 ? verified

- Version/evidence: ETCCDI TN90p, OSHA Table 2 via web reader, CCOHS notes, accessed 2026-11-07.
- Official source: https://www.osha.gov/heat-exposure/hazards
- Finding: OSHA Table 2 confirms unacclimatized light/moderate/heavy 28/25/23 and acclimatized 30/28/26 ?C effective WBGT. CCOHS disallows treating its screening values as recovery prescriptions. TN90p is a climatic precedent, not this night-window health threshold.
- Implementation consequence: No numeric work:rest prescription. Unknown clothing requires assessment. Unknown acclimatization uses the unacclimatized reference with explicit conditions. Local 90th-percentile overnight rule is an analyst adaptation.
- Evidence excerpt: ?they are not intended to prescribe work and recovery periods.?

## V06 ? unavailable

- Version/evidence: DataMeet commit 9b4d1c2ece54cdeb6f5e8bad9ccad7844f783b17; Pune Readme and real 2022 GeoJSON, accessed 2026-11-07.
- Official source: https://github.com/datameet/Municipal_Spatial_Data/tree/master/Pune
- Finding: Real 2022 electoral dataset acquired using git after API TLS failure. Pune-specific CC BY-SA 2.5 India overrides repository default; 2022 upstream additionally MIT. Actual count derived from features; geometry validation/repairs recorded. OpenCity catalogue reachable but no redistribution-safe matched demographic/crosswalk acquired.
- Implementation consequence: Historical 2022 geography labelled everywhere. Census/slum/WorldPop/WorldCover/OSM feature integration and October-2025 boundary claim remain unverified/unavailable. No demographic zeros or invented refuges. Landsat/GEE not used.
- Evidence excerpt: ?not the Census wards?

## V07 ? pending

- Version/evidence: IMD FAQ pp.8,13?14, CAP 1.2 standard/XSD, SACHET portal, accessed 2026-11-07.
- Official source: https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html
- Finding: Correct schema URL is CAP-v1.2.xsd; the original -os.xsd pointer returned 404. Schema acquired. Action hydration/exposure/strenuous-task wording is traced to checked IMD pages. NDMA alternate PDF retrieved but scanned text not independently reviewed. SACHET portal reachable; no operational interface verified.
- Implementation consequence: Use source-bound English templates; inactive actions stay inactive. CAP Test/Exercise, restricted recipients, geocodes for complex polygons. XSD and escaping tests required before acceptance. No national connection/certification claim.
- Evidence excerpt: ?Common Alerting Protocol Version 1.2?

## V08 ? pending

- Version/evidence: Telegram API/FAQ, MDN Push, Resend pricing, accessed 2026-11-07.
- Official source: https://core.telegram.org/bots/api
- Finding: Start ownership, secret webhook header, update IDs and sendMessage response checked. FAQ: approximately 30 broadcasts/s, one/chat/s; group limit 20/min. Resend page: 3,000/month, 100/day, sender verification needed; no-card registration path not exercised.
- Implementation consequence: Telegram test allowlist only; timeouts unknown, not blind retries. No bot credentials/provider acknowledgement. Push P1/email P2 disabled; no paid broadcast or phone/SMS API.
- Evidence excerpt: ?X-Telegram-Bot-Api-Secret-Token?

## V09 ? pending

- Version/evidence: Cloudflare Pages limits, GitHub Actions schedules, OpenFreeMap, accessed 2026-11-07.
- Official source: https://developers.cloudflare.com/pages/platform/limits/
- Finding: Pages free page lists 500 builds/month, 20-minute build timeout, 20,000 files, 25 MiB/file. GitHub schedules are best effort; public scheduled workflows can disable after 60 days inactivity. OpenFreeMap public Positron style available; no API key needed.
- Implementation consequence: Separate source builds and data publication. SVG polygons remain independent of tiles. No Cloudflare account/token or GitHub remote configured: deployment/scheduler execution unverified. No card/signup path claimed tested.
- Evidence excerpt: ?The maximum file size for a single Cloudflare Pages site asset is 25 MiB.?

## V10 ? unavailable

- Version/evidence: Render free docs, accessed 2026-11-07.
- Official source: https://render.com/docs/free
- Finding: Free web services have sleep/cold starts, ephemeral local disk and monthly free instance-hour limits. Account-specific no-card eligibility and outbound access not tested. Other candidate hosts not provisioned.
- Implementation consequence: Select self-hostable FastAPI/Docker, no paid fallback. Health check reports actual readiness and does not promise to prevent suspension.
- Evidence excerpt: ?750 Free instance hours?

## V11 ? pending

- Version/evidence: Supabase changelog 2026-11-04 CLI v3; pricing/Auth/JWKS/RLS/PostGIS docs, accessed 2026-11-07.
- Official source: https://supabase.com/changelog/supabase-cli-v3
- Finding: CLI v3 local defaults/hosted confirmations checked. Pricing: 500 MB DB, pause after one week inactivity. PostGIS extension schema is qualified. JWKS issuer/audience/session validation and current private membership required; RLS and grants are independent.
- Implementation consequence: No secrets in browser; missing signing/encryption/DB config disables privileged paths. No hosted Postgres version invented. Local migration replay/advisors/real Auth checks pending because Docker/Postgres/project credentials unavailable. Neon not selected.
- Evidence excerpt: ?local stack by default?

## V12 ? verified

- Version/evidence: Official npm registry manifests, Vite/Tailwind/Radix docs, accessed 2026-11-07.
- Official source: https://vite.dev/guide/
- Finding: React/react-dom 18.3.1 pinned. Registry peer metadata confirms Query and Router accept React 18. Vite 8.3.6 supports Node >=22.12; Tailwind 4.3.5/plugin supports Vite 8. Exact dependency versions and package lock generated. Node 22.22.0 downloaded for supported execution rather than relying on host Node 25.
- Implementation consequence: Production build and TypeScript check passed. Self-hosted Newsreader/Atkinson Next/Noto Devanagari/IBM Plex Mono use actual OFL packages. Font-feature/contrast/browser tests remain separate acceptance checks.
- Evidence excerpt: ?Node.js version 20.19+, 22.12+?


## Executed verification update ? 2026-11-08 IST

- Thermal/rule/API suite: 63 passed. Decimal longwave, NREL SPA, ECMWF UTCI fixtures, >=100 valid independent pythermalcomfort combinations, NWS/CCOHS checks and CAP XSD validation executed. The estimator is enabled only as explicitly approximate; urban radiometer/health validation is absent.
- Geography: 58 real 2022 electoral polygons, zero repairs. Two actual ERA5 cells used for centroid-sampled 1991?2020 baseline. Demographic joins remain unavailable.
- Full real replay selection scanned 2021?2025; selected 2024-04-26 through 2024-04-30. Hash/join and phone browser smoke verified; no observed-record or clinical claim.
- Source and data branches pushed to the configured GitHub repository. Cloudflare deployment, production scheduling, Supabase database replay/advisors and Telegram acknowledgement remain unperformed. No Antigravity was used after the user's instruction to continue without it.
