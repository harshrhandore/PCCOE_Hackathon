# HeatGuard AI — Master Prompt (v1, to be expanded)

---

## 0. INSTRUCTIONS TO THE AI READING THIS DOCUMENT

You are acting as a **senior product designer + staff full-stack/ML engineer** with experience in public-health early-warning systems and data-dense civic dashboards.

**Your task:** expand this document into ONE self-contained, exhaustively detailed **build prompt** that will be handed to an AI coding agent. That agent will NOT see this document, the original slide deck, or this conversation, so your output must carry every decision, number, token, schema and rule it needs.

**Rules for your expansion**

1. **Preserve every decision below.** You may deepen, specify and sharpen. You may not simplify, swap the palette, swap the stack, or "modernize" anything into a generic look.
2. **No paid services, no credit card, no trial credits.** Every tool must have a permanent free tier or be self-hostable. If you propose anything not listed here, justify its free-tier limits.
3. Items marked **(VERIFY)** must be checked by the coding agent against current official docs *before* coding against them. Put that instruction into your output.
4. **Do not invent statistics, accuracy figures, user counts, testimonials or "impact numbers".** Everything shown in the UI is either computed from real data, clearly labelled as a proxy/assumption, or clearly labelled as a simulation.
5. Do not ask me questions. Where something is ambiguous, state your assumption in an "Assumptions" section and continue.
6. Organise your output with the following sections, each as detailed as needed (think hundreds of lines in total, with exact values, not adjectives):
   - A. Role & non-negotiables for the coding agent
   - B. Product definition, personas, user journeys
   - C. Methodology (formulas, thresholds, citations to cite in-app)
   - D. Stack, versions, repo tree, environment variables, deployment steps
   - E. Data pipeline (sources, endpoints, query parameters, schedules, caching, failure handling)
   - F. Database schema (SQL DDL) and API contracts (OpenAPI-style request/response JSON)
   - G. Design system (CSS custom properties for every token, type scale, spacing, component specs, states)
   - H. Screen-by-screen specs (layout at 360 / 768 / 1280 / 1920 px, components, states: loading/empty/error/stale/offline, interactions, keyboard behaviour)
   - I. Copy deck (all UI text, alert templates, empty/error messages) in English, with Hindi and Marathi translations flagged "needs native-speaker review"
   - J. Accessibility, i18n, performance, privacy requirements with measurable acceptance criteria
   - K. Demo mode / scenario replay specification
   - L. Test plan (unit tests with reference vectors, data validation, e2e, Lighthouse/axe budgets)
   - M. Build order in priority tiers (P0 / P1 / P2) with a definition of done for each
   - N. Attribution/licensing checklist
   - O. A final self-review checklist the coding agent must run against "AI-slop tells" (Section 7.10 below)
7. Write in imperative voice addressed to the coding agent ("Build…", "Never…").

---

## 1. CONTEXT

- **Event:** PCCOE International Grand Challenge 2026, Pune, India. Hackathon-style, judged on impact, feasibility, innovation, working demo.
- **Team:** 5 undergraduate B.Tech students (AVCOE). One programmer builds the prototype, so scope must be tiered and the P0 slice must be demo-complete on its own.
- **Project name:** HeatGuard AI. Tagline to use everywhere: **"Predict heat. Protect people."** (The deck's conclusion slide wrongly says "Predict people". Fix it.)
- **Deck's one-line idea:** An AI-powered system that predicts heatwaves, computes a human thermal stress index, assesses who is most vulnerable, and issues early-warning, ward-level, action-oriented alerts to citizens and authorities.
- **Core innovation (quote from deck, keep it):** "Not just predicting heat — predicting human risk and enabling early action."
- **Pilot geography:** Pune Municipal Corporation (PMC) wards (prabhags). Chosen because the event is in Pune and open ward-level data exists.
- **Timing problem (important):** The build and likely the demo happen in November, outside the Indian heat season (IMD heatwave season is roughly March–June). A live forecast will look benign. Therefore the product must ship with a first-class **Scenario Replay** mode (replay a real past heat episode from ERA5 data) and a **What-if** mode. See Section 10.

---

## 2. PRODUCT DEFINITION (CORRECTED AND SHARPENED FROM THE DECK)

### 2.1 Separate three things the deck blurs together

| Concept | Meaning | Who it informs |
|---|---|---|
| **Hazard** | How physiologically stressful the weather is (from UTCI / WBGT / Heat Index, night-time relief, duration) | Everyone |
| **Vulnerability** | How badly a ward's people would be hurt at a given hazard (elderly, outdoor workers, slums/crowding, cooling access, green cover) | Authorities (allocation) |
| **Risk (shown on the map)** | Hazard adjusted by vulnerability, by a transparent rule | Map, alerts |

Never show a single unexplained "AI score". Every level must be traceable to inputs in one tap ("Why is this Level 3?").

### 2.2 Personas

1. **Ward health officer / municipal control room (primary buyer-user).** Needs: ranked wards, what to do where and when, ready-to-approve alerts, daily bulletin export. Desktop-first, dense UI.
2. **Citizen / caregiver (public).** Needs: "Is it dangerous where I live tomorrow, what do I do, where is the nearest place to cool down." Phone-first, low bandwidth, Marathi/Hindi/English.
3. **Outdoor worker (delivery rider, construction, street vendor).** Needs: safe-hours guidance by workload using WBGT. Phone-first, minimal text, large type.

### 2.3 Core flow

Data → Thermal stress → Vulnerability → Risk → Alert → Action. (Same as the deck's CORE FLOW.)

### 2.4 What the product is NOT

Not a chatbot. Not an LLM-advice generator. **Action recommendations are rule-based and mapped to NDMA/IMD heat-wave guidance, each with a source label.** No generative text in the safety path.

---

## 3. METHODOLOGY (IMPLEMENT EXACTLY; SHOW IT IN-APP ON A "METHODS & DATA" PAGE)

### 3.1 Honest framing of the "AI" (fixes a deck weakness)

The deck implies ML forecasts heat 3–5 days ahead. A model trained only on history will not beat numerical weather prediction (NWP). So:

- **Forecast of weather = NWP** (Open-Meteo, which serves open national-weather-service models such as GFS/ICON/ECMWF-open data). Free, no key, non-commercial use, data licensed CC BY 4.0 (attribution required), 16-day hourly forecast. (VERIFY current terms, daily call limit and variable names.)
- **Thermal stress = physics** (validated libraries; see 3.2).
- **ML's job = post-processing and risk classification**: learn the mapping from *forecast* conditions at lead times of 1–5 days to *realised* thermal-stress class, correct systematic forecast bias for Pune, output calibrated class probabilities, and explain drivers (SHAP). State this plainly on the Methods page. It is more defensible in front of judges.

### 3.2 Thermal indices (compute hourly per ward centroid)

Use **`thermofeel`** (ECMWF, Apache-2.0; UTCI, WBGT, Heat Index variants, MRT) as the primary implementation. Cross-validate against **`pythermalcomfort`** (MIT; UTCI, Heat Index, WBGT) in unit tests. (VERIFY current function signatures and units before coding.)

Inputs from Open-Meteo hourly: `temperature_2m`, `relative_humidity_2m`, `dew_point_2m`, `wind_speed_10m`, `shortwave_radiation`, `direct_radiation`, `diffuse_radiation`, `direct_normal_irradiance`, `cloud_cover`, `apparent_temperature` (for comparison only). (VERIFY exact variable names.) Derive mean radiant temperature (MRT) from radiation + solar geometry per thermofeel's documented method; derive WBGT from MRT; derive UTCI from T, MRT, wind, RH.

Outputs per ward-hour: `t2m`, `rh`, `wind`, `mrt`, `utci`, `wbgt`, `heat_index`, `night_min_t` (per night).

Reference category thresholds (VERIFY against primary sources and cite them in the app):
- **UTCI** heat-stress categories (°C): 26–32 moderate, 32–38 strong, 38–46 very strong, >46 extreme.
- **NWS Heat Index** (°F): 80–90 caution, 90–103 extreme caution, 103–124 danger, ≥125 extreme danger.
- **WBGT**: use ISO 7243 / ACGIH-style workload-dependent reference limits. Expose **workload (light / moderate / heavy)** as a selectable input in the Outdoor Worker view, and show "safe work : rest" guidance derived from the cited standard. Do not invent limits.

### 3.3 Hazard level (0–4) — rule-based, deterministic, per ward-day

Define hazard from: daily peak UTCI category, peak WBGT, **night-time minimum temperature (lack of overnight relief)**, and **consecutive-day persistence**. Recommended structure (the agent must tune and document it, and keep it in one config file):

- Base level from peak UTCI category (moderate → 1, strong → 2, very strong → 3, extreme → 4; below moderate → 0).
- +1 if night minimum stays above a configurable threshold (default to be justified from literature; VERIFY) for ≥2 consecutive nights.
- +1 if ≥3 consecutive days at base level ≥2. Cap at 4.
- Always show which rule fired.

This mirrors the design logic of the US NWS/CDC HeatRisk index (temperature unusualness, duration, nighttime relief, health relevance), which scores 0–4 from green to magenta and is built from local climatology plus health data. We adapt the *idea*, not the thresholds.

### 3.4 Parallel "IMD criteria" badge (speaks the authorities' language)

Compute, from forecast daily max temperature and a ward-area climatological normal (ERA5 1991–2020 daily normal), whether **IMD heat-wave criteria** are indicatively met, and show it as a badge next to our own level:

- Heat wave considered only when station max ≥ **40 °C (plains)**, ≥ 37 °C (coastal), ≥ 30 °C (hills).
- Departure from normal **4.5–6.4 °C → heat wave**; **> 6.4 °C → severe heat wave**.
- Or by absolute max: **≥ 45 °C heat wave; ≥ 47 °C severe**.
- IMD declares when criteria hold at ≥2 stations in a sub-division for ≥2 consecutive days. We have no station network, so label our badge **"Indicative — not an official IMD declaration."** (VERIFY against IMD's official FAQ.)

Pune is a plains/plateau city that often peaks below 40 °C, so the IMD badge will often be "No" even when humid-heat stress is real. Explain this on the Methods page; it is exactly the gap the deck's "beyond temperature" innovation claims to fill.

### 3.5 Vulnerability index (0–1 per ward, transparent)

Use the standard exposure / sensitivity / adaptive-capacity framing. Every component is a percentile rank within PMC, with weights in a config file and a **sensitivity toggle** on the Methods page (equal weights vs default weights) so judges can see the ranking is not fragile.

Candidate components and **open** sources (VERIFY availability, licence, ward-ID joins):
- Population density and total population: Census 2011 ward-wise data (OpenCity.in, public domain) — **data vintage 2011; label it**; optionally WorldPop gridded estimates aggregated to wards as a newer proxy.
- Slum population share by prabhag (OpenCity.in).
- Children 0–6 share (Census PCA). Elderly 60+ is **not** in PCA ward tables; if unavailable, use a labelled proxy or omit rather than fabricate.
- Outdoor-work exposure: proxy from worker-category shares in Census PCA ("other workers", marginal workers) plus OSM land-use (construction, markets). Label as proxy.
- Cooling access: distance to nearest refuge from OpenStreetMap via Overpass (hospitals, community centres, libraries, metro stations, malls, drinking-water points). Label: "Candidate refuges from OpenStreetMap — not official PMC cooling centres."
- Heat exposure modifiers: green cover / built-up fraction (OSM or ESA WorldCover); optional land-surface-temperature anomaly from Landsat 8/9 via Google Earth Engine (free for non-commercial use, requires signup) **pre-computed once offline** into a static CSV. (VERIFY GEE terms.)

**There is no open ward-level heat-illness or hospital dataset for Pune.** The deck's "Historical Health / Heat" data source must be removed from claims. Replace with: "Future integration: PMC/State health surveillance data".

### 3.6 Risk level shown on the map

`risk_level = min(4, hazard_level + bump)` where `bump = 1` if the ward's vulnerability is in the top quintile **and** `hazard_level ≥ 2`, else 0. Always display hazard, vulnerability and risk as three separate fields; the Authority table can sort by any of them and has a distinct **"Priority"** column (vulnerability-weighted) for resource allocation.

### 3.7 ML layer (P1, but design the P0 schema for it)

- **Data:** ERA5 / ERA5-Land hourly via the Open-Meteo Historical Weather API (reanalysis, 1940→present, free non-commercial) for climatology and "realised" labels; Open-Meteo **Historical Forecast API** (archived forecasts; starts 2022 for many models, VERIFY) for features as issued at lead times 1–5 days.
- **Label:** realised hazard class computed from reanalysis with the same rules as 3.3.
- **Features:** forecast T/RH/wind/radiation, forecast UTCI/WBGT, lead time, day-of-year (cyclical), anomaly vs climatology, consecutive-hot-day counters, night-min forecast, forecast spread if ensemble is available.
- **Model:** XGBoost (or LightGBM) multiclass, strong regularisation (small data), plus isotonic/Platt calibration. Optional quantile model for a temperature band.
- **Validation:** strictly **time-based split** (e.g., train ≤2022, validate 2023, test 2024–2025 — adjust to data availability). Report per-class precision/recall, confusion matrix, Brier score, reliability diagram, and compare against the **rule-based baseline (raw NWP → rules)**. If ML does not beat baseline, say so on the Methods page and ship the baseline as primary. Honest beats flashy.
- **Explainability:** SHAP values per ward-day; map each feature to a plain-language driver sentence ("Night-time temperatures stay high", "Humidity is high so sweat does not cool you"). Show top 3 drivers.
- **Uncertainty (P1):** use the Open-Meteo **Ensemble API** (VERIFY) to compute the probability of reaching ≥ Level 3 and show it as "Likelihood" (e.g., Low / Medium / High with the underlying percentage in the detail view).

### 3.8 Action library (rule-based, sourced)

A versioned JSON file mapping `(risk_level, audience, context)` → actions. Audiences: authority, citizen, outdoor worker, school/anganwadi, care home. Examples of action *types* (the agent writes the exact wording and cites NDMA Heat Wave Guidelines / IMD advisories for each; VERIFY wording): open cooling refuges, extend water points, shift outdoor work away from the hottest hours, adjust school timings, hospital readiness, targeted outreach to elderly. Each action carries a `source` field shown in the UI.

### 3.9 Alerts

- Severity = risk level. Alerts are **drafted by the system, approved by a human** (draft → approved → sent). Full audit log.
- Generate each alert as a **CAP 1.2 (Common Alerting Protocol) XML** payload downloadable from the authority console (India's national alerting platform is CAP-based; VERIFY). This is a free, standards-based integration story for judges.
- Free delivery channels in the prototype: **Telegram bot** (free; users must press Start first — the bot cannot cold-message), **Web Push (PWA)**, **email via a free tier** (e.g., Resend ~100/day; VERIFY). **SMS and WhatsApp are roadmap items**: implement an `AlertChannel` interface and a visible **"SMS preview" simulator** that renders exactly what would be sent, without sending.
- Subscriptions store only: channel handle (e.g., Telegram chat_id), ward, language, audience group, consent timestamp. No phone numbers, no names. `/stop` deletes everything.

### 3.10 Honesty rules (the UI must enforce these)

- "Near-real-time, model-based" — never "real-time sensor data".
- "Ward-level risk on grid-resolution weather" — weather inputs come from ~2–11 km model cells; ward differences in hazard come from land-surface adjustment (P2) and, mainly, vulnerability and exposure. Say so on Methods.
- Every number has a **provenance chip** (source, issue time, vintage). Every proxy is labelled "Proxy". Every simulated view carries a persistent **SIMULATION** banner.
- Always show "Data fresh as of HH:MM IST · model run XXZ". If stale (>6 h), switch the page to a visible stale state.

---

## 4. TECH STACK — 100% FREE (WITH CHANGE LOG VS THE DECK)

| Layer | Deck | **Use this** | Why / free-tier facts to respect |
|---|---|---|---|
| Frontend | React / Next.js | **Vite + React 18 + TypeScript SPA** (static build), React Router, TanStack Query, Zustand (UI state only), i18next | No SSR needed for a dashboard; static hosting is free and has no cold start. Next.js can still work but Vercel's free plan is limited to non-commercial use. |
| Styling | — | **Tailwind CSS v4 used only as a token plumbing layer + hand-written component CSS**; **Radix UI / React Aria primitives (headless)** | **Do not ship stock shadcn/ui or Tailwind defaults.** They are the #1 visual tell of generated UIs. Headless behaviour, fully custom visuals. |
| Charts | — | **Observable Plot + D3 (custom annotations)**; uPlot for the dense hourly series if needed | Avoid default Recharts/Chart.js look. |
| Map | Leaflet / Mapbox | **MapLibre GL JS + OpenFreeMap vector tiles** (no API key, no registration). Optionally self-host with Protomaps PMTiles later. | Mapbox GL v2+ is proprietary and billed per map load. MapLibre is the open BSD fork. OpenFreeMap's public service is free but "as-is", so add a raster/blank-basemap fallback and a cached snapshot. |
| Backend API | Python + FastAPI | **FastAPI** (keep) — only for what must be dynamic: what-if, subscriptions, alert workflow, CAP export | Free hosts that sleep (e.g., Render free spins down after ~15 min idle with a 30 s+ cold start) → design the frontend to work from static JSON and treat the API as progressive enhancement; add keep-warm cron + "waking server" UI state. (VERIFY current host limits; alternatives: Hugging Face Spaces, Koyeb.) |
| Scheduled compute | — | **GitHub Actions cron** (public repo) running the Python pipeline every 3 h → writes versioned JSON/GeoJSON snapshots | Zero-cost scheduler; the site stays fast because data is precomputed. |
| Static data hosting | — | **Cloudflare Pages** for the app (unlimited bandwidth, 500 builds/month on free), snapshots committed to a `data` branch or stored in free object storage | VERIFY current limits. |
| Database | PostgreSQL + PostGIS | **Supabase free (Postgres + PostGIS + Auth + Row-Level Security)** for: wards registry, subscriptions, alert drafts/approvals, audit log | Free tier ≈ 500 MB DB, 50k MAU auth, but **projects pause after ~1 week of inactivity**: add a GitHub Actions keep-alive ping and a pre-demo checklist item. Fallback: Neon free Postgres. |
| Geo preprocessing | — | **GeoPandas, Shapely, rasterio, osmnx/Overpass** in `/pipeline` (offline, run once) | All open. |
| Thermal indices | Heat Index, WBGT, UTCI | **thermofeel** (primary) + **pythermalcomfort** (cross-check) | Peer-reviewed, open-source. |
| ML | Scikit-learn / XGBoost | **scikit-learn, XGBoost/LightGBM, SHAP, MAPIE or scikit calibration** | Adds explainability (promised in deck) and calibration. |
| Alerts | SMS / Email / App API | **Telegram Bot API + Web Push (PWA) + email free tier**; SMS/WhatsApp as stubbed adapters + simulator | SMS in India has per-message cost and sender registration; Telegram is free. |
| Auth (authority console) | — | **Supabase Auth**, roles: `viewer`, `officer`, `approver` | Free. |
| Weather data | "Weather & Forecast" | **Open-Meteo** (forecast, ensemble, historical, historical-forecast) | Free for non-commercial use, no key, CC BY 4.0 attribution. A commercial deployment would require a paid plan or a different data route — note in Methods. |
| i18n | — | **i18next** with `en`, `hi`, `mr` | Alerts in local languages are a real adoption lever. |
| Fonts | — | **Self-hosted via `@fontsource`** (no CDN) | Offline-safe for demos, faster. |
| Testing | — | pytest, Vitest, Playwright, axe-core, Lighthouse CI | Free. |

**Stack deviations to report back to the team:** (1) Next.js → Vite SPA; (2) Mapbox/Leaflet → MapLibre + OpenFreeMap; (3) SMS → Telegram + Web Push + email, with SMS simulator; (4) FastAPI demoted from "everything" to "dynamic extras" with precomputed static data; (5) Added thermofeel, SHAP, calibration, CAP export, GitHub Actions pipeline.

---

## 5. ARCHITECTURE AND PIPELINE

```
GitHub Actions cron (every 3h)                    One-off offline prep (run once, commit outputs)
  1 fetch Open-Meteo forecast for ward centroids    A ward polygons + centroids (PMC GeoJSON)
  2 compute MRT/UTCI/WBGT/HI (thermofeel)           B census/slum/OSM/WorldPop features → ward_features.csv
  3 hazard rules + IMD badge                        C ERA5 climatology + normals per ward → climatology.parquet
  4 ML inference (if model present)                 D ERA5 replay episodes → replay/*.json
  5 vulnerability join → risk                       E model training → model.json + calibration + SHAP background
  6 write snapshots: forecast.json, wards.geojson,
    bulletin.json, meta.json (issue time, model run)
  7 (optional) POST drafts to Supabase alert queue
         │
         ▼
 Cloudflare Pages (static app + /data/*.json)  ◄──  FastAPI (what-if, subscribe, alerts, CAP)  ◄──  Supabase
         │
         ▼
 Browser: loads snapshots first, then enhances via API; service worker caches last good snapshot (offline-first)
```

Requirements:
- **One ward centroid query per ward** (batch coordinates; respect Open-Meteo fair use; cache; back off on 429/5xx; never call the API from the browser for ward data).
- **Last-known-good**: if the pipeline fails, the app serves the previous snapshot with a stale banner.
- **Deterministic**: pipeline output for a given input snapshot must be reproducible (seeded, versioned config, git SHA stamped into `meta.json`).
- **Repo tree** (agent to refine): `apps/web`, `services/api`, `pipeline`, `ml`, `data/{raw,processed,replay}`, `docs/methods`, `.github/workflows`.

---

## 6. DATA MODEL AND API (AGENT WRITES FULL DDL + OPENAPI; THESE ARE REQUIRED ENTITIES)

Tables: `wards` (id, name_en, name_mr, geom, centroid, area_km2, admin_ward_office), `ward_features` (ward_id, each vulnerability component raw + percentile, data_vintage, source, is_proxy), `forecast_hourly` (ward_id, valid_time, issue_time, model_run, t2m, rh, wind, mrt, utci, wbgt, heat_index), `ward_daily` (ward_id, date, lead_days, hazard_level, hazard_rule_fired, vulnerability, risk_level, p_ge_3 nullable, imd_flag, drivers jsonb), `actions` (id, version, risk_level, audience, text_en/hi/mr, source), `alerts` (id, ward_ids, risk_level, status draft|approved|sent|cancelled, cap_xml, created_by, approved_by, timestamps), `subscriptions` (id, channel, handle_hash, ward_id, lang, audience, consent_at), `audit_log`.

Endpoints (all versioned `/api/v1`): `GET /wards`, `GET /wards/{id}`, `GET /forecast?date=`, `GET /bulletin/latest`, `POST /whatif` (deltas for temp/humidity/wind), `GET /replay/{episode_id}`, `POST /subscriptions`, `DELETE /subscriptions/{id}`, `GET /alerts`, `POST /alerts/draft`, `POST /alerts/{id}/approve`, `GET /alerts/{id}/cap.xml`, `GET /methods` (thresholds + citations as JSON so the Methods page and tests share one source of truth), `GET /health`.

Every response includes `meta: { issued_at, model_run, data_vintage, git_sha, is_simulation }`.

---

## 7. DESIGN DIRECTION — DISTINCTIVE, NOT GENERIC

### 7.1 Concept: "The Daily Bulletin"

The product should feel like a **modern meteorological bulletin crossed with a survey map** — trustworthy, calm, precise — not a startup SaaS template. Reference *principles* (not looks) from: NWS/CDC HeatRisk (restrained 5-level colour scale), IMD bulletins (institutional register authorities already trust), Linear/Plausible-style restraint in dashboards (typography does the hierarchy work), Stripe-style sparse numerals. Dashboards research consistently says: start from the decisions users make, keep a restrained palette, use colour for meaning not decoration.

**Signature elements (use sparingly, they are the identity):**
- A **bulletin header**: small-caps line like `BULLETIN No. 312 · ISSUED 06:00 IST · MODEL RUN 00Z · PUNE MUNICIPAL CORPORATION` with hairline rules above and below. Real, computed values.
- One large editorial sentence as the page's headline, generated deterministically from data: *"Severe heat is expected in 9 of 41 wards on Thursday, peaking 14:00–16:00."* (ward count from data; never hard-code.)
- An almanac-style **time scrubber** with tick marks per hour and day boundaries.
- **Heat ribbon**: a 5-day × 24-hour strip (small-multiple heatmap) coloured by stress category.

### 7.2 Colour tokens (final — do not substitute)

Light theme is default. Define as CSS custom properties on `:root`; define tints with `color-mix()` or OKLCH. Verify every text/background pair ≥ WCAG AA (4.5:1 body, 3:1 large/UI) and run a colour-blindness simulation (deuteranopia, protanopia, tritanopia).

Neutrals (warm paper + green-tinted ink):
- `--paper-0: #F3F1EA` app background
- `--paper-1: #FBFAF6` raised surface
- `--paper-2: #E9E6DB` sunken wells / table zebra
- `--rule: #D3CFC1` hairlines; `--rule-strong: #A9A593`
- `--ink-0: #16201E` primary text
- `--ink-1: #3C4642` strong secondary
- `--ink-2: #5E6762` secondary text (do not go lighter for text)
- `--ink-3: #8B918A` decorative/disabled only (never body text)

Brand / interaction (cool, deliberately **outside** the hazard hues so UI chrome is never confused with risk):
- `--verdigris-100: #D4E6E1`, `--verdigris-600: #1E6B62` (links, selection, primary action), `--verdigris-700: #165249` (hover/pressed)
- Focus ring: 2 px `--verdigris-600` with 2 px `--paper-0` offset.

**Risk ramp (sequential, luminance-ordered, 0–4):**

| Level | Name | Hex | Text on it | IMD colour it corresponds to (show as small label) | Pattern (non-colour cue) |
|---|---|---|---|---|---|
| 0 | Low | `#CFE0CC` | ink-0 | Green — no warning | none |
| 1 | Watch | `#EBC65B` | ink-0 | Yellow — be aware | none |
| 2 | Elevated | `#E08A2E` | ink-0 | Orange — be prepared | thin dots |
| 3 | Severe | `#BF3A24` | white | Red — take action | thin diagonal lines |
| 4 | Extreme | `#5E1646` | white | (beyond IMD 4-colour scheme; emergency) | cross-hatch |

Always show the **numeral and name** alongside colour. Never rely on colour alone.

Secondary sequential ramp for the **Vulnerability** layer (slate-blue, not warm, so it cannot be mistaken for risk): `#E9EBEE · #C5CCD6 · #94A3B6 · #5E7390 · #2E4262`.

Optional dark theme ("control room", P2): `--paper-0 #0F1412`, `--paper-1 #171E1B`, `--rule #2A332F`, `--ink-0 #E8E6DD`; re-derive the risk ramp lightness for dark and re-test contrast.

### 7.3 Typography (all free, self-hosted)

- **Headlines & the big numeral:** *Newsreader* (variable, optical-size axis; editorial serif). Devanagari headlines: *Noto Serif Devanagari*.
- **UI & body:** *Atkinson Hyperlegible Next* (designed for legibility; fallback *Atkinson Hyperlegible*) (VERIFY availability/axes). Devanagari UI: *Noto Sans Devanagari*.
- **Numerals in tables/charts:** `font-variant-numeric: tabular-nums lining-nums`. If the UI font lacks tabular figures, set numeric columns in *Spline Sans Mono* or *IBM Plex Mono* (VERIFY). Use monospace **only** for timestamps, coordinates, IDs — not as a blanket "techy" look.
- **Banned:** Inter, Roboto, Arial, system-ui as the design font, Poppins, Space Grotesk.
- **Scale (px/line-height):** 12/16 · 14/20 · 16/24 (base) · 18/26 · 22/28 (serif) · 32/36 (serif) · 48/50 (serif) · 88/84 (serif, only the single headline risk numeral). Small-caps label style: 11–12 px, uppercase, +0.06em tracking, `--ink-2`.
- Hierarchy through **weight, size and position, not colour**. Max two weights per family on a screen.

### 7.4 Shape, space, elevation

- 4 px spacing grid. Data surfaces and controls: **radius 2 px** (buttons 3 px). No `rounded-2xl`. No pill buttons. Tags are rectangular.
- **No shadows on cards.** Separate with hairline rules and paper layering. One popover/drawer shadow only: `0 8px 24px rgba(22,32,30,.12)`.
- Layout is **asymmetric and information-led**; not a grid of identical cards. Avoid "3 feature cards with icons" patterns entirely.
- Density modes: Comfortable (public) / Compact (authority).

### 7.5 Iconography and imagery

- Prefer **words over icons**. When icons are needed, use one consistent line set (1.5 px stroke) and custom SVG for map markers and the logo mark. **No emoji anywhere.** No stock sun/thermometer illustrations, no cartoon mascots, no photo hero. The deck's thermometer and sun imagery must not appear.
- Logo: wordmark in Newsreader with a minimal mark derived from a **ward-polygon + isotherm contour** shape. Provide SVG.

### 7.6 Data-visualisation rules

- Direct labels on lines; legends only where unavoidable. Thin rules, light grids, no chart borders, no 3D, no pie/donut.
- Ward ranking = **dot plot** (Cleveland), not bar charts; sparklines in table rows (5-day UTCI peak).
- **Heat ribbon** per ward (see 7.1). Annotate the peak hour in-chart.
- Drivers = diverging horizontal bars with plain-language labels.
- Uncertainty is shown, not hidden: bands or a "Likelihood" label.
- Numbers update with a subtle tick transition; never animate on first paint if `prefers-reduced-motion`.

### 7.7 Map styling

- Base: OpenFreeMap vector style (e.g., *positron* or *bright*) **desaturated further**, POI clutter removed, labels in the UI font stack where possible. Water `#CFDCDA`, land `#EDEBE2` (tune to harmonise with `--paper-0`).
- Ward choropleth: fill = risk ramp at ~0.80 opacity, 1 px `--paper-0` stroke; hover raises stroke to 1.5 px `--ink-0`; selected ward 2.5 px `--ink-0` + others dim to 0.55.
- Patterns for levels 2–4 via sprite/pattern fills so the map is readable in greyscale.
- Layer switcher: Risk · Hazard · Vulnerability · Cooling refuges. Time scrubber drives all layers.
- Keyboard-accessible equivalent: the ranked ward list (Section 8). The map is never the only way to reach data.

### 7.8 Motion

150–220 ms ease-out for state changes; map `flyTo` for ward selection (≤600 ms); drawer slides. No parallax, no confetti, no looping decorative animation. Respect `prefers-reduced-motion`.

### 7.9 Voice and microcopy

Calm, plain, imperative, specific. No exclamation marks, no "Oops", no "Welcome back!". Examples:
- Empty: "No wards are at Level 3 or above in this period."
- Stale: "Forecast last updated 08:00 IST. New data is delayed. Showing the last available forecast."
- Waking API: "Starting the alert service. This can take up to a minute."
- Action: "Open cooling refuges in Ward 12 and Ward 27 from 11:00 on Thursday."
- Explain: "Why Level 3: night temperatures stay above the threshold for 2 nights, and humidity is high."
Reading level ≈ Grade 6–8 for public text. Every alert includes *what, where, when, who is at risk, what to do*.

### 7.10 HARD "NEVER" LIST (AI-SLOP TELLS) — THE FINAL SELF-REVIEW MUST CHECK EVERY ITEM

1. No purple/indigo/blue-violet gradients, no gradient text, no glassmorphism/blur cards, no neon glow, no dark-blue-with-purple-accent default.
2. No stock shadcn/Tailwind default blue (#3B82F6/#6366F1), no default Tailwind grays.
3. No Inter + big rounded cards + soft shadow combination. No identical radius on everything.
4. No emoji or emoji-as-icons. No generic hero with "Empower…/Revolutionize…" copy.
5. No grid of three identical icon cards. No fake logos, testimonials, or stats like "99.9% accuracy", "10k users".
6. No lorem ipsum, no placeholder names like "John Doe", no sample data that looks real but is invented — use real computed data or clearly labelled simulation.
7. No decorative sun/thermometer illustrations or 3D blobs.
8. No rainbow charts; no more than the defined ramps; no colour used decoratively.
9. No LLM-written advice in the safety path; no chatbot widget.
10. No "Loading…" spinners on a blank page — use skeletons that match final layout; every data view has loading / empty / error / stale / offline states.
11. No horizontal scroll at 360 px; no text below 12 px; no tap target below 44 px.
12. No unlabeled proxies or undeclared assumptions.

---

## 8. SCREENS AND COMPONENTS (AGENT EXPANDS EACH TO PIXEL-LEVEL SPEC)

Global: top bar with wordmark, language switch (EN/हिं/मरा), "Simulation" status chip when applicable, data-freshness chip; bulletin header strip beneath. Breakpoints 360 / 768 / 1280 / 1920.

1. **Overview ("Today in Pune")** — map-first. Headline sentence (7.1), the single big risk numeral for the city's worst ward, count of wards by level (a segmented bar, not a chart library default), the time scrubber, choropleth map. **Mobile:** map with a draggable bottom sheet (3 snap points: peek / half / full) holding ranking list and ward detail. **Desktop:** three zones — ranked ward list (left, 320 px), map (centre, fluid), contextual detail (right, 400 px, collapsible).
2. **Ward detail** (drawer/page, deep-linkable `/ward/:id?t=`): risk level + hazard + vulnerability as three labelled values; heat ribbon (5 days × 24 h); drivers ("Why this level") with plain-language text; vulnerability breakdown with proxy/vintage chips; nearest candidate refuges with walking distance; actions by audience; provenance panel; likelihood (P1).
3. **Authority console** (auth required; compact density): sortable/filterable ward table (sticky header, keyboard navigable, column set: Ward, Risk, Hazard, Vulnerability, Priority, Peak UTCI, Peak WBGT, Night min, IMD badge, 5-day sparkline); **Action queue** (what to do where/when, with source citations); **Alert composer** (select wards/level/audience → live previews per channel and language → submit for approval → approve → send; status timeline; audit log); **Bulletin export** (print stylesheet → PDF, CSV, CAP XML).
4. **Outdoor worker view** (public, mobile-first, very large type): choose workload (light/moderate/heavy) and ward; show **safe hours today** and recommended work:rest by hour using WBGT thresholds; one-line instruction; share as image/text.
5. **Scenario Replay & What-if** (public + authority): choose a past heat episode (auto-selected from ERA5 as the hottest multi-day spell in the last 5 years for Pune — script picks it, no hand-picked claims) or drag sliders (+0–6 °C, ±RH, wind) on today's forecast. Persistent **SIMULATION** banner and chip; scrubber plays through days; ranking changes visibly. Add "Compare: today vs scenario" toggle.
6. **Subscribe**: Telegram deep link + QR, Web Push opt-in, email; choose ward, language, audience; consent text in plain language; test message; `/stop` instructions.
7. **Methods & Data** (the trust page; treat as a first-class screen): formulas, thresholds with citations, data sources with licences and vintages, validation metrics (real, from the test split, with baseline comparison), limitations (Section 3.10), changelog, attribution. Pull thresholds from `GET /methods` so docs and code cannot drift.
8. **System status** (small): last pipeline run, snapshot age, API health, data source health.

Required component inventory: BulletinHeader, RiskNumeral, LevelChip (numeral+name+pattern), WardMap, WardList, TimeScrubber, HeatRibbon, DriverBars, ProvenanceChip, FreshnessChip, SimulationBanner, SegmentedLevelBar, DataTable, Drawer/BottomSheet, AlertComposer, ChannelPreview, LanguageSwitch, EmptyState/ErrorState/StaleState.

---

## 9. ACCESSIBILITY, I18N, PERFORMANCE, PRIVACY (WITH BUDGETS)

- **WCAG 2.2 AA**: contrast per 7.2, visible focus, full keyboard operation, skip links, `aria-live="polite"` for data updates and `assertive` only for new Level ≥3 alerts, accessible names on all map controls, table alternative for the map, `prefers-reduced-motion`, text resize to 200% without loss.
- **i18n**: `en`, `hi`, `mr`; ICU plurals; Devanagari fonts self-hosted; number/date formatting via `Intl` with `Asia/Kolkata`; alert templates localised; flag machine-translated strings for native review.
- **Performance** (mid-range Android, 4G throttling): LCP ≤ 2.5 s on Overview, initial JS ≤ 200 KB gzipped excluding MapLibre (lazy-load the map chunk), snapshots ≤ 300 KB gzipped, Lighthouse mobile Performance ≥ 85, Accessibility ≥ 95. Service worker caches shell + last snapshot; app opens offline with an offline banner.
- **Privacy**: Indian DPDP-style minimal data. Hash chat IDs at rest, no tracking/analytics cookies, consent text and deletion path (`/stop`, "Delete my subscription" button). Authority console actions are audit-logged.
- **Resilience**: basemap tile failure → blank-basemap fallback with ward polygons still rendering; Open-Meteo failure → last snapshot + stale state; API cold start → static data still works.

---

## 10. DEMO MODE AND SCENARIO REPLAY (CRITICAL FOR A NOVEMBER DEMO)

- Ship `data/replay/*.json` generated by the pipeline from ERA5 / ERA5-Land for the hottest multi-day spells for Pune in recent years (script chooses by computed UTCI/WBGT peaks and consecutive days; document the selection rule).
- Replay runs the **same code path** as live (same thermal indices, same rules, same ML if present) so it demonstrates the real system, not a mock. Banner: "SIMULATION — replay of <dates>. Not a live forecast."
- Offer a one-click **"Demo script"** overlay (authority-hidden, public-optional) with a 3-minute guided path: (1) Overview → (2) scrub to the peak day → (3) open the worst ward → (4) "Why this level" → (5) vulnerability vs hazard → (6) draft an alert → approve → view CAP + Telegram + SMS-simulator previews → (7) Methods page validation metrics.
- Include a **pre-demo checklist** in the README: wake Supabase, warm the API, verify snapshot freshness, cache tiles, test Telegram bot, offline fallback test.

---

## 11. TESTING AND VALIDATION

- **Unit tests for indices** using published reference values (UTCI reference tables, NWS Heat Index chart points, thermofeel/pythermalcomfort cross-check within a stated tolerance). Do not invent reference values; cite their source in the test file.
- **Rule tests**: table-driven tests for hazard rules, the IMD criteria check (include boundary cases at 40/45/47 °C and 4.5/6.4 °C departures) and the risk bump rule.
- **Data validation**: schema checks (pydantic/pandera), ward ID join completeness, no NaN in outputs, CRS checks (EPSG:4326), polygon validity.
- **ML**: time-split metrics, calibration plot, comparison against the rule baseline, SHAP sanity checks (monotonic where physically expected).
- **Frontend**: Vitest for logic, Playwright e2e for the demo path at 360 px and 1280 px, axe-core zero critical/serious violations, Lighthouse CI budgets (Section 9), visual regression of the risk legend (patterns + contrast).
- **Resilience tests**: kill the API (static still works), corrupt a snapshot (falls back), block tiles (fallback basemap).

---

## 12. BUILD ORDER AND PRIORITY TIERS

**P0 — demo-complete core (must ship):** ward geometry + centroids → pipeline (Open-Meteo fetch, thermofeel indices) → hazard rules + IMD badge → vulnerability index (clearly-labelled proxies) → risk → static snapshots → Overview map + ranking + ward detail + heat ribbon → Authority table → alert draft/approve with **CAP XML + Telegram + SMS simulator** → Scenario Replay + What-if → Methods page → bulletin header/typography/palette implemented exactly as specified → Cloudflare Pages deploy + GitHub Actions cron.

**P1 — depth:** ML post-processing with calibration + SHAP drivers; ensemble-based Likelihood; Hindi/Marathi; PWA offline + Web Push; Outdoor Worker view; system status page; Supabase auth roles + RLS; printable PDF bulletin.

**P2 — polish:** Landsat land-surface-temperature adjustment for ward-level hazard differences; dark theme; Protomaps self-hosted tiles; email digests; additional cities via config.

Definition of done per tier = all acceptance criteria in Sections 9 and 11 for the features in that tier plus the Section 7.10 review.

---

## 13. ATTRIBUTION AND LICENCE CHECKLIST (SHOW IN APP FOOTER + METHODS PAGE)

- Weather data: Open-Meteo.com (CC BY 4.0) with link; ERA5/ERA5-Land contains modified Copernicus Climate Change Service information (add the standard Copernicus notice; VERIFY wording).
- Basemap: OpenFreeMap, © OpenStreetMap contributors (ODbL).
- Ward boundaries: DataMeet Pune ward maps (VERIFY licence and boundary vintage; PMC's final ward structure was re-announced in October 2025 with changes to some wards — confirm which boundary set you use and label its year). Census 2011 ward-wise data and slum data via OpenCity.in (public domain; label 2011 vintage).
- Libraries: thermofeel (Apache-2.0, cite Brimicombe et al. 2022, SoftwareX), pythermalcomfort (MIT, cite Tartarini & Schiavon 2020), MapLibre (BSD-3), plus licences of all fonts (SIL OFL).
- Methodological references to cite on the Methods page: NDMA Guidelines on Heat Wave management, IMD heat-wave criteria, NWS/CDC HeatRisk (conceptual precedent), UTCI/WBGT standards (VERIFY exact citations).

---

## 14. KNOWN LIMITATIONS TO STATE PLAINLY IN THE PRODUCT

1. Weather is model-based at kilometre-scale grid resolution; not station or sensor data.
2. Vulnerability inputs are partly proxies and partly 2011 census vintage; no open ward-level heat-illness data exists for Pune.
3. Candidate cooling refuges are from OpenStreetMap, not an official PMC list.
4. IMD badge is indicative only.
5. Free-tier infrastructure can sleep or pause; the app degrades gracefully to cached data.
6. Open-Meteo's free tier is for non-commercial use; production deployment by a municipality would require a licensed data route.

---

## 15. DELIVERABLES THE CODING AGENT MUST PRODUCE

Working repository (monorepo per Section 5), README with setup + pre-demo checklist, `docs/methods.md`, `.env.example`, GitHub Actions workflows (pipeline cron, keep-alive, CI), seed data generation scripts, deployed static site URL, test reports, and a short `DECISIONS.md` recording every assumption and every deviation from this document.
