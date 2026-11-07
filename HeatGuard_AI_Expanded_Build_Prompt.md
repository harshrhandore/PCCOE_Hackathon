# HeatGuard AI — self-contained build prompt

Build specification version: 2.0. Specification date: 2026-11-07.

Treat this document as the complete handoff to the coding agent. Do not require the original master prompt, slide deck, or conversation. Build the product, repository, reproducible data pipeline, tests, documentation, and deployment described below. Preserve the decisions in this document; record justified changes in `DECISIONS.md`.

## A. Role & non-negotiables for the coding agent

Act as a senior product designer and staff full-stack/ML engineer experienced in public-health early-warning systems and data-dense civic dashboards.

Build **HeatGuard AI** for the PCCOE International Grand Challenge 2026 in Pune, India, for a five-person undergraduate B.Tech team from AVCOE. Plan for one programmer. Make P0 demo-complete before adding P1. Optimize for impact, feasibility, innovation, and a working, inspectable demonstration.

Use the exact tagline **“Predict heat. Protect people.”** Keep the exact innovation statement **“Not just predicting heat — predicting human risk and enabling early action.”** Never reproduce the deck's mistaken “Predict people” conclusion.

1. Use the stack in D and the visual tokens in G. Do not replace them with an easier template.
2. Use permanently free service tiers or self-hostable software. Never require payment details, trials, promotional credits, or a paid standard merely to complete P0.
3. Treat every **VERIFY** item as a mandatory implementation gate. Consult current official documentation before writing code against it; record URL, access date, relevant version, finding, and implementation consequence in `docs/verification-register.md`.
4. Do not treat this specification's dated research as a substitute for that gate. External services, APIs, licences, and libraries change.
5. Do not invent statistics, accuracy, users, testimonials, ward counts, demographic values, episode dates, facility availability, or impact figures.
6. Use measured or computed data, explicitly labelled proxies, or clearly marked simulations. Keep `null` distinct from zero and unknown risk distinct from Low.
7. Generate safety recommendations from a versioned, cited rule library. Never use LLM-generated advice or a chatbot in the safety path.
8. Keep hazard, vulnerability, risk, and resource-allocation priority separate and explain each in one interaction.
9. Serve static snapshots first. Keep public views usable when the API, database, or basemap is unavailable.
10. Display the source, issue time, vintage, quality flags, and simulation state alongside the quantities they qualify.
11. Require human approval before delivery. Use test delivery for the hackathon. Do not imply affiliation with, authorization by, or delivery through PMC, IMD, or India's national alerting platform.
12. Do not ask clarifying questions. State assumptions, make reversible choices, and continue. If a dependency is unavailable, implement the adapter, honest unavailable state, and documented recovery path; do not fake a completed integration.
13. Deliver a working repository and evidence. Do not mark tests, deployment, data acquisition, or native-language review complete unless actually performed.

### A.1 Assumptions and conflict resolutions

Maintain these assumptions in `DECISIONS.md`, with columns `id`, `decision`, `reason`, `evidence`, `tier`, `review_status`.

| ID | Adopt this decision |
|---|---|
| A01 | Pilot only Pune Municipal Corporation wards/prabhags. Discover the actual count from the chosen boundary manifest; never hard-code 41 or another count. |
| A02 | Use one internally consistent, licensed boundary vintage. A historical DataMeet set is acceptable if current boundaries are unavailable; display its year prominently. Verify the reported October 2025 ward changes against PMC publications before describing them as fact. |
| A03 | Do not join 2011 census wards to later wards by number or name alone. Use documented spatial crosswalks or retain historical geography. Mark area-weighted transfers as proxies. |
| A04 | Display five local calendar days, with 24 hourly cells per day, in `Asia/Kolkata`. Fetch additional preceding/following hours for complete nights and persistence. Store UTC instants. |
| A05 | Use NWP for weather, physics for thermal stress, and optional ML for post-processing. Do not claim an operational ML model exists in P0. |
| A06 | Use the local climatological 90th-percentile night minimum as the provisional overnight-relief threshold. This is an analyst adaptation, not a Pune health-outcome threshold. Apply the safeguard and exact definition in C.3. |
| A07 | Do not introduce a second arbitrary WBGT-to-hazard ladder. Show WBGT in the daily explanation and worker guidance; the deterministic city hazard formula uses UTCI plus the two specified modifiers. |
| A08 | Treat missing longwave radiation as a scientific input gap. Obtain it from an open source or implement and cite a published estimator, labelling the resulting MRT/UTCI/WBGT as approximate. Never silently assume MRT equals air temperature in sunlight. |
| A09 | Preserve hashed handles for lookup, but add encrypted delivery endpoints because hashes cannot be used to deliver messages. Do not retain names or phone numbers. |
| A10 | Implement minimum role checks and immutable approval workflow in P0 because P0 includes delivery. Treat P1 Auth/RLS depth as expanded provisioning, account management, and automated policy coverage, not permission to expose P0 operations. |
| A11 | Use CAP `Test` for live-weather prototype alerts and `Exercise` for replay/what-if. Do not emit `Actual` without a separately authorized operational deployment. |
| A12 | Provide “safe hours” as lower-exposure planning guidance with conditions, never a guarantee. Do not turn an occupational screening table into a prescriptive work:rest schedule if its source disallows that use. |
| A13 | Use a data branch with deployment of a combined source-and-data artifact. Do not trigger eight full source builds per day merely to distribute snapshots. |
| A14 | Limit keep-alive jobs to documented health checks. Do not promise that pings prevent host suspension, override free-tier policy, or provide an SLA. |
| A15 | Retain all requested features in their original tiers. Permit fully labelled fixture mode for local UI development, but do not substitute synthetic wards or an invented episode for the P0 real-data replay. |

### A.2 Verification register

Start the register before coding. Give each item `pending`, `verified`, `unavailable`, or `superseded`; include an evidence excerpt of at most 25 quoted words per source. Preserve all original VERIFY obligations below.

| Gate | Verify using official sources before implementation |
|---|---|
| V01 | Open-Meteo free-use eligibility, attribution, request accounting, location/variable multipliers, minute/hour/day/month limits, model coverage, units, radiation conventions, and exact parameter names. |
| V02 | Forecast, Historical Weather, Historical Forecast, Single Runs/Previous Runs, and Ensemble API capabilities; per-model start dates; access to genuine 1–5-day lead-time forecasts. |
| V03 | thermofeel and pythermalcomfort releases, signatures, Kelvin/Celsius conventions, humidity/vapour-pressure units, validity domains, radiation inputs, WBGT method, licences, and cross-validation comparability. |
| V04 | UTCI classification endpoints; NWS Heat Index formula and shading assumptions; IMD plains/coastal/hill criteria and declaration restrictions. |
| V05 | Local night-relief rationale; WBGT workload, acclimatization, clothing, exposure duration, and permitted use of any ISO 7243/ACGIH/NIOSH-derived table. |
| V06 | Census, OpenCity, slum data, WorldPop, DataMeet, OSM, ESA WorldCover, and optional Landsat/GEE availability, licences, geography, joins, vintages, and redistribution conditions. |
| V07 | NDMA/IMD action wording and page/section references; CAP 1.2 XSD; official evidence for India's CAP integration story. |
| V08 | Telegram consent/Start requirements, webhook validation, rate limits; Push API support; Resend free daily/monthly allowance, sender/domain requirements, and no-card availability. |
| V09 | Cloudflare Pages build/deployment/file limits; GitHub Actions public-repo schedule/permissions/inactivity rules; OpenFreeMap usage conditions and fallback options. |
| V10 | Render/Hugging Face Spaces/Koyeb current free hosting and no-card availability; sleeping, outbound networking, ephemeral disk, quotas. |
| V11 | Supabase free quotas and pause rules, Auth/JWKS validation, PostGIS install schema, supported Postgres, RLS, client keys, CLI changes; Neon only as a documented fallback. |
| V12 | React 18 compatibility with chosen Vite, Tailwind v4, headless primitives, chart packages, font packages/axes, and tabular numerals. |

Use the official links in N as the starting point. Where no usable free data or valid method exists, make absence visible and explain the blocked acceptance criterion; never silently weaken it.

## B. Product definition, personas, user journeys

Build a ward-level heat-risk early-warning and action-support system. Keep the core flow visible on Methods: **Data → Thermal stress → Vulnerability → Risk → Alert → Action**.

Define hazard as physiological weather stress, vulnerability as relative sensitivity/exposure/lack of adaptive capacity, and risk as hazard adjusted by the transparent vulnerability rule. Define priority as an allocation ranking, not a probability of illness.

| Persona | Decision | Primary screen | Successful journey |
|---|---|---|---|
| Ward health officer / municipal control room | Where, when, and how to allocate resources | Authority console, compact desktop | Select date → sort priority → inspect cause → select wards → draft sourced action → independent approval → test delivery/CAP export. |
| Citizen / caregiver | How dangerous tomorrow is nearby and what to do | Overview and ward detail, phone | Search ward → read level and timing → open “Why this level” → read actions → inspect candidate refuge → subscribe voluntarily. |
| Outdoor worker, including rider/vendor/construction worker | When workload should be reduced | Worker view, phone | Choose ward and workload → inspect hourly WBGT and lower-exposure windows → read applicability conditions and sourced rest guidance → share. |
| Judge/demo presenter | Whether the system works and is scientifically honest | Replay and Methods | Replay real computed episode → compare hazard/vulnerability → draft test alert → inspect CAP → review actual validation status. |

Use routes `/`, `/ward/:id`, `/authority`, `/worker`, `/scenarios`, `/subscribe`, `/methods`, and `/status`. Preserve selected `date`, `t`, `ward`, `layer`, `lang`, and `mode` in validated query parameters. Use `mode=live|replay|whatif`; include `episode` or `scenario` when applicable. Reject invalid IDs with a real not-found view and a route back to the ward list.

Choose English as initial language, Comfortable density for public views, Compact for authority, Risk as default layer, and the latest complete forecast day as default date. Persist language, density, and a manually selected ward locally; never require geolocation. Provide optional one-time geolocation only after a labelled button press, resolve to a ward locally, and discard coordinates.

Show the event/team in About/footer text without inventing sponsor logos. Keep the main application about decisions, not promotional feature cards.

## C. Methodology: formulas, thresholds, citations

### C.1 Scientific implementation contract

Keep executable rules in `pipeline/heatguard_core/`, shared by scheduled processing, replay, API what-if, and model label generation. Generate `methods.json` from these exact configs. Do not maintain parallel handwritten thresholds in React.

Use named numeric fields with units in schemas: air temperature, dew point, MRT, UTCI, WBGT, Heat Index, and minimum temperature in °C; RH in percent; wind in m/s; radiation in W/m²; timestamps as ISO 8601 UTC; geometry EPSG:4326. Keep raw responses and source units for traceability. Do not round before category evaluation; display temperatures to one decimal and vulnerability to two decimals.

Implement unit adapters around thermofeel. Explicitly convert `T_K = T_C + 273.15`, `T_F = 1.8*T_C + 32`, `T_C = (T_F-32)/1.8`, and kilometres/hour to m/s by division by 3.6. Verify which installed functions return Kelvin. Add plausibility checks that catch a Kelvin result presented as Celsius.

Compute hourly per representative ward centroid: `t2m`, `rh`, `dew_point`, `wind`, `mrt`, `utci`, `wbgt`, `heat_index`. Retain supporting radiation, solar geometry, source grid coordinates/elevation, method IDs, approximation flags, and index validity flags. Compute the night minimum once per ward-night, then reference it from daily records.

### C.2 Thermal indices

Use thermofeel as primary implementation and pythermalcomfort as an independent check where both implement the same quantity. Verify the signatures in their versioned documentation. thermofeel's documented UTCI inputs include Kelvin air/MRT/dew-point or vapour pressure and 10 m wind; do not pass RH to a vapour-pressure argument. [thermofeel UTCI documentation](https://thermofeel.readthedocs.io/en/2.3.0/guide/utci/)

Derive solar position for each centroid and radiation interval using a validated open-source algorithm; pin its library and record its licence. Use the midpoint of a past-hour averaged radiation interval, not an unmatched instantaneous zenith angle. If using instantaneous radiation variables, use the corresponding instant consistently.

Map global horizontal/direct-horizontal/diffuse/direct-normal irradiance explicitly. Check `GHI ≈ direct_horizontal + diffuse_horizontal` within a documented measurement/model tolerance; do not treat direct-horizontal irradiance as DNI. At night, zero shortwave terms within floating-point tolerance and preserve longwave exchange.

Supply thermofeel's required downwelling/net shortwave, downwelling/net longwave, direct radiation, and solar geometry with documented signs. The listed Open-Meteo shortwave fields alone do not provide every documented MRT input. [thermofeel MRT requirements](https://thermofeel.readthedocs.io/en/2.1.5/guide/mrt.html)

Implement the missing-radiation path in this order:

1. Check whether the verified chosen open model endpoint exposes the required fields under the allowed free-use terms.
2. If available, acquire consistent downwelling/net longwave and surface terms for the same valid times and model run.
3. Otherwise implement a published, open, independently checked longwave/surface-radiation estimator. Record its exact equation, coefficients, units, assumptions, uncertainty, citation, validity domain, and test vectors before using it. Mark `radiation_method=estimated`, `is_proxy=true`, and `indices_quality=approximate` through every downstream record.
4. Require `docs/methods/radiation.md` and the verification gate to pass before publishing approximate live indices. Do not invent a coefficient or use missing radiation as zero. Permit unavailable indices while acquiring evidence; do not claim the P0 pipeline is complete in that state.
5. Keep the same estimator/method version for live, replay, and what-if comparisons, or show an explicit methodology change warning.

Use full outdoor WBGT supported by the chosen library, not a simplified temperature-and-humidity approximation masquerading as measured occupational WBGT. Preserve the interpretation `WBGT_sun = 0.7*T_natural_wetbulb + 0.2*T_globe + 0.1*T_air`; `WBGT_shade = 0.7*T_natural_wetbulb + 0.3*T_globe`. Do not substitute psychrometric wet-bulb for natural wet-bulb without identifying the approximation. [CCOHS WBGT method](https://www.ccohs.ca/oshanswers/phys_agents/heat/heat_control.html)

Calculate NWS Heat Index via the verified thermofeel method with NWS regression/adjustments and documented applicability. Label it as a shade/light-wind index. Use `apparent_temperature` only as a comparison field, not as UTCI, WBGT, Heat Index, or model validation truth. Use these published labels, and document the continuous boundary convention: below 80 °F outside warning bands; `[80,90)` Caution; `[90,103)` Extreme caution; `[103,125)` Danger; `>=125` Extreme danger. Explain that published whole-degree charts list Danger as 103–124 °F. [NWS Heat Index chart and equation](https://www.weather.gov/ama/heatindex)

Keep UTCI's heat categories and the dashboard's Level names distinct. Adopt the following explicit endpoint convention, preserving the published >46 °C extreme boundary; verify against the selected primary reference before coding:

| Peak UTCI x, °C | Thermal category | Base hazard | Dashboard name |
|---|---|---|---|
| x <= 26 | Below moderate heat stress | 0 | Low |
| 26 < x <= 32 | Moderate heat stress | 1 | Watch |
| 32 < x <= 38 | Strong heat stress | 2 | Elevated |
| 38 < x <= 46 | Very strong heat stress | 3 | Severe |
| x > 46 | Extreme heat stress | 4 | Extreme |

Use `null`, never Level 0, for an invalid UTCI. Preserve the library's cold-stress category where applicable and state that HeatGuard's heat scale does not assess cold safety.

For the P1 worker screening config, start from the public OSHA table adapted from NIOSH: unacclimatized Light/Moderate/Heavy limits 28/25/23 °C effective WBGT; acclimatized limits 30/28/26 °C. Verify these values and assumptions before activation, and flag `WBGT >= limit` as reaching the screening threshold. Use ordinary lightweight work clothing adjustment 0 °C only when explicitly selected/applicable; unknown protective clothing must trigger assessment-required, not a reassuring result. These screening values do not specify work:rest minutes. Keep a separate sourced schedule adapter and do not invent continuous-work permission or rest fractions from this three-row table. [OSHA heat-hazard table](https://www.osha.gov/heat-exposure/hazards)

### C.3 Daily hazard and overnight relief

Define day D as `[D 00:00, D+1 00:00)` IST. Define the following night N(D) as `[D 20:00, D+1 06:00)` IST, containing ten local-hour bins, 20 through 05. Preserve actual source instants: a UTC-hourly series occurs at half-past local hours in India, so samples may be 20:30 through 05:30 rather than whole local hours. Show the date span so the next-morning assignment is unambiguous.

Assign each valid source sample to its containing local-hour bin for the 24-cell ribbon without shifting the instant or inventing interpolation. Use the actual instant for peak labels/solar geometry and the interval membership for daily/night calculations. If a source truly returns whole local hours, retain that grid and document it. Do not merge differently aligned time axes without an explicit tested resampling method. Require one valid hourly sample per expected bin for completeness; mark the metric as sampled hourly minimum/maximum, not continuous-time extrema.

Compute these fields:

```text
base[D] = category(max hourly UTCI on D)
night_min[D] = min(t2m over N(D))
hot_night[D] = night_min[D] > night_threshold[D]
night_bonus[D] = 1 if hot_night[D-1] and hot_night[D] else 0
persistence_bonus[D] = 1 if base[D-2] >= 2 and base[D-1] >= 2 and base[D] >= 2 else 0
hazard[D] = min(4, base[D] + night_bonus[D] + persistence_bonus[D])
```

Do not recursively count already boosted hazard in persistence. Count consecutive base-level days and nights, not arbitrary nonconsecutive matches. Fetch two preceding days and one following morning. Mark preceding context as forecast, recent model estimate, or reanalysis; never call it observed without observations. Propagate unknown context as `modifier_status=unknown`, not false. Display an incomplete modifier warning and block live delivery based on an incomplete hazard calculation.

For the provisional night threshold, compute the 90th percentile of night minima in a five-calendar-day window centered on D across 1991–2020. Use NumPy's documented linear quantile convention and at least 90% complete baseline nights. Use a 365-day climatological calendar, excluding February 29 from baseline fitting; interpolate February 29 from February 28 and March 1. Freeze this baseline for a snapshot. Tie a night minimum equal to the threshold to no bonus.

Require `base[D] >= 1` before applying the night bonus, so a relatively warm November night with no heat stress cannot by itself create a heat warning. Record this safeguard as an explicit analyst adaptation. Make `night_percentile=0.90`, `night_window_days=5`, `night_min_base=1`, `night_consecutive=2`, and `persistence_days=3` configurable. Label percentile-based overnight escalation as **“Prototype rule — not locally health-validated.”** Use ETCCDI's TN90p as a climatological precedent, not a validated health cutoff; its published daily-minimum definition and baseline are not identical to this product's night window and baseline. [ETCCDI definitions](https://etccdi.pacificclimate.org/list_27_indices.shtml)

Store fired rules with stable IDs `UTCI_BASE`, `NIGHT_RELIEF_2`, `PERSISTENCE_3`, `VULNERABILITY_TOP20`; include input values, comparators, thresholds, date spans, and config version. Always expose both fired and unevaluable rules. Include peak WBGT and workload flags in the explanation without adding an undocumented WBGT bonus.

### C.4 Indicative IMD badge

For Pune, use the plains/plateau gate `Tmax >=40 °C`. Preserve configurable hills `>=30 °C` and coastal `>=37 °C` for future geography, but implement coastal departure rules only after verifying their distinct definition.

Compute normal Tmax from the ward-area 1991–2020 reanalysis baseline using the same local-calendar-day definition as forecast Tmax. Prefer polygon-area aggregation of intersecting grid cells; if using centroid sampling, label it as a ward-area-normal proxy. Document any five-day smoothing and use it identically across years. Never substitute an annual mean temperature for a daily maximum normal.

For Pune, evaluate in descending order:

```text
if Tmax >=47: severe_heat_wave
elif Tmax >=45: heat_wave
elif normal is missing: unknown_departure
elif Tmax <40: no
elif Tmax-normal >6.4: severe_heat_wave
elif Tmax-normal >=4.5: heat_wave
else: no
```

Retain an `absolute_criterion` result even if normals are absent. Show **“Indicative — not an official IMD declaration.”** State that a ward-grid calculation cannot satisfy the official station-network declaration procedure: at least two stations in a meteorological subdivision for at least two consecutive days. Explain why substantial humid-heat stress below 40 °C can coexist with a “No” IMD badge. Do not call HeatGuard's custom levels IMD warnings. [IMD FAQ](https://mausam.imd.gov.in/pdfs/heatcolduser/FAQ_heat_wave.pdf), [IMD warning-services brochure](https://mausam.imd.gov.in/imd_latest/contents/pdf/pubbrochures/Heat%20Wave%20Warning%20Services.pdf)

### C.5 Vulnerability and priority

Use exposure, sensitivity, and lack of adaptive capacity as the explanatory framing. Build an initial six-component config; treat all weights as analyst choices, not fitted health-outcome coefficients:

| Component | Raw quantity | Default weight | Direction and qualification |
|---|---|---|---|
| population_density | Persons / land area km² | .20 | Higher = more vulnerable; census 2011 unless verified alternative. |
| slum_share | Slum population / total population | .20 | Higher = more vulnerable; matched vintage/geography required. |
| children_share | Age 0–6 / total population | .15 | Higher = more vulnerable; Census PCA. |
| outdoor_work_proxy | `(main_other_workers + marginal_other_workers) / (total_main_workers + total_marginal_workers)` from verified disjoint Census fields | .15 | Higher = more exposed; “other workers” is not a measured outdoor-worker count. Keep zero-denominator/missing fields unknown; never double-count marginal workers. |
| cooling_distance | Distance to nearest candidate refuge | .15 | Higher = lower adaptive capacity; OSM candidate and accessibility limitations. |
| low_green_cover | 1 - green-cover fraction | .15 | Higher = greater exposure; land-cover proxy, not measured air temperature. |

For nonmissing component j with n matched wards and average tied rank r (ascending), calculate `p_j=(r-1)/(n-1)` for n>1. If n=1, mark the component uninformative and exclude it. When all raw values tie, the formula yields .5 for n>1; display “No between-ward variation.” Compute `V=sum(w_j*p_j)/sum(w_j)` using only components present for **every ward in that comparison cohort**. Do not renormalize weights differently for different wards and then rank them as comparable.

Use OSM construction/market land-use as an optional separately labelled work-exposure feature, not an unweighted extra secretly mixed into the default census ratio. Add it only with a new config version defining its raw quantity, percentile, weight, join, and sensitivity result; preserve the default component weighting unless the documented alternative is selected.

Require at least three informative, fully joined components spanning at least sensitivity/exposure and adaptive-capacity proxies, and at least .50 of the configured default weight coverage. Otherwise return vulnerability unavailable, keep hazard visible, and withhold vulnerability risk adjustments. Report omitted components, cohort size, weight coverage, vintage, source, and proxy status. Do not fabricate elderly 60+ data from PCA; use a separately documented proxy or omit it. Compare optional WorldPop estimates with Census, not as interchangeable official counts.

Offer Methods controls `Default weights` and `Equal weights`. Use equal weights over the same complete component set and frozen ward cohort. Show rank movement and Spearman correlation computed from actual ranks; never promise stability. Treat changed weights as a scenario with a simulation banner and never mutate the published baseline.

Define vulnerability's top quintile by the linear 0.80 quantile of V across the fixed cohort. Set `top_quintile = V>=q80` only if `max(V)>min(V)`; include ties even if more than 20% of wards qualify and disclose the actual count. Never select top wards by string order to break vulnerability ties.

Compute `bump=1` only when `top_quintile` and `hazard>=2`; compute `risk=min(4,hazard+bump)`. If vulnerability is unavailable, expose `risk=hazard`, `risk_basis=hazard_only`, and the missing vulnerability warning rather than implying full adjustment.

Compute allocation `priority_score = 100*(hazard/4)*(0.5+0.5*V)` when V exists. Display to one decimal as **“Allocation priority (prototype)”**; this is not an illness probability. Use `null` for missing V and place these wards in an explicit “Priority incomplete” group. Sort by risk descending, priority descending, peak UTCI descending, stable ward ID ascending; permit independent column sorting.

### C.6 ML post-processing and uncertainty — P1

Acquire reanalysis labels and genuine as-issued forecast features for lead days 1–5. Historical Forecast API continuous series stitches early forecast hours; it is not sufficient evidence of a particular forecast lead. Use verified Single Runs/Previous Runs archives or omit unavailable lead-time experiments. Store `forecast_reference_time`, `available_at`, `valid_time`, model ID, and `lead_hours`. Never manufacture historical forecasts from ERA5 or use forecast data issued after the prediction cutoff. [Open-Meteo archive distinction](https://open-meteo.com/en/docs/historical-forecast-api)

Use XGBoost multiclass with scikit-learn calibration and SHAP; permit LightGBM only with a documented reason. Start with seed 42, max depth 3, 200 trees, learning rate .05, subsample .8, colsample .8, L2=5; tune only in chronological training/validation folds. Keep early stopping outside the test split.

Use forecast T/RH/wind/radiation and computed UTCI/WBGT; lead time; `sin(2*pi*doy/365.2425)` and cosine; climatological anomalies; preceding hot-day counters; night minimum; ensemble spread if genuinely available. Compute all features using information available at issue time. Keep spatially correlated ward copies in the same time fold and report unique weather cells as well as ward samples.

Label realised hazard with the exact versioned rule engine on reanalysis; call it “reanalysis-derived class,” not observed illness. Fit baseline climatology only from the fixed baseline, not future test outcomes.

Use train through 2022, validate 2023, test 2024–2025 only if genuine archives support those years and model consistency. Otherwise shift to the earliest available training block, subsequent validation block, and latest untouched complete test block; require an explicit split manifest, time-ordered folds, and a five-day purge gap at boundaries. Do not report unsupported historical coverage.

Calibrate on held-out time folds: isotonic only if sample support is adequate, otherwise sigmoid/Platt-style one-vs-rest probabilities normalized to sum to one. Show raw and calibrated multiclass Brier `mean(sum_k(p_k-y_k)^2)`, per-class precision/recall/support, confusion matrix, macro F1, reliability diagram, lead-day metrics, and exact dates. Show unsupported classes as “insufficient support,” not perfect scores.

Compare against deterministic raw-NWP→rules on identical held-out records. Use the ML model as primary only after lower held-out Brier and no material worsening in Level >=3 recall under a predeclared tolerance of .02 absolute; otherwise ship the rule baseline and say so. Do not display accuracy/benefit claims until tests produce them. Keep this selection rule an analyst policy.

Map top three SHAP feature contributions to plain-language labels, preserve sign/class/units/reference background, and distinguish model explanations from fired rules. Do not label an inferred humidity effect as a causal finding.

For ensemble likelihood, recompute the same rules per valid complete member, then calculate `p_ge_3=count(risk>=3)/valid_members`; disclose member count, model, and issue time. Use Low `<.33`, Medium `[.33,.67)`, High `>=.67` as labelled communication bands, not calibrated clinical probabilities. Distinguish ensemble proportion from ML class probability; never combine them without a defined method. Show “Not available” in P0 rather than a fabricated percentage.

### C.7 Actions, provenance, and honesty

Create `config/actions.v1.json` with `id`, `version`, `levels`, `audience`, `context`, `text_en`, `text_hi`, `text_mr`, `translation_status`, `source_id`, `source_section`, `requires_confirmation`, and `active`. Use audiences `authority`, `citizen`, `outdoor_worker`, `school_anganwadi`, `care_home`.

Map Level 0 to routine preparation; 1 to awareness; 2 to prepared services and reducing peak exposure; 3 to targeted response; 4 to highest prototype escalation and official-guidance referral. Draw exact action wording from checked NDMA/IMD guidance: water access, exposure reduction, rescheduling strenuous tasks, additional rest, readiness of healthcare, school timing review, and outreach to vulnerable people. Require facility-owner confirmation before an action says a refuge is open. Never convert a candidate OSM POI into an official cooling centre.

Show **“Near-real-time, model-based”** and **“Ward-level risk on grid-resolution weather.”** Explain model cells are kilometre-scale (often approximately 2–11 km for selected suitable forecast models, but report the actual model's documented resolution; reanalysis may be coarser). Do not perturb ward temperatures randomly to make a map look varied. Most P0 ward differences may arise from vulnerability rather than weather.

Use provenance `{source_id,url,retrieved_at,issued_at,valid_time,vintage,licence,is_proxy,quality_flags,method_version}`. Render a compact chip beside each number or shared numerical group, opening exact field-level provenance. Include “Future integration: PMC/State health surveillance data.” Do not claim access to an open ward heat-illness dataset or clinical validation.

## D. Stack, versions, repository, environment, deployment

### D.1 Preserve this stack

| Layer | Required implementation | Version policy |
|---|---|---|
| Frontend | Vite, React 18, TypeScript SPA; React Router; TanStack Query; Zustand for UI-only state; i18next with ICU | Pin React/react-dom 18.3.1; verify compatible current stable versions of other packages and pin exact versions. Do not upgrade to React 19 merely because a starter defaults to it. |
| Styling and behaviour | Tailwind CSS v4 token plumbing; handwritten component CSS; Radix UI or React Aria headless primitives | Pin Tailwind 4.x; choose Radix consistently for dialog/select/menu and style every state. |
| Charts | Observable Plot and D3 annotations; optional uPlot for dense hourly lines | Lazy-load charts; implement SVG table sparklines without a heavy chart for each row. |
| Map | MapLibre GL JS; OpenFreeMap vector tiles | Lazy-load MapLibre. Keep offline polygon rendering independent of external styles. |
| API | Python 3.12, FastAPI, Pydantic v2, Uvicorn | Pin exact compatible patches in a hashed lockfile after verification. |
| Scheduled pipeline | Python, NumPy, pandas, GeoPandas, Shapely, rasterio, Overpass/osmnx | Run offline geo preparation separately from three-hourly weather runs. |
| Indices | thermofeel primary; pythermalcomfort validation | Evaluate thermofeel 2.3.0 and pythermalcomfort 4.8.1 against official versioned docs; use verified exact pins, not unverified function signatures. |
| ML | scikit-learn, XGBoost, SHAP, optional MAPIE | Use exact pins and artifact metadata. Do not install ML in the P0 API unless needed. |
| DB/auth | Supabase Postgres + PostGIS + Auth + RLS | Verify current hosted version and client API. Never expose service-role credentials. |
| Hosting | Cloudflare Pages static app/data; self-hostable FastAPI; eligible free API host if verified | Do not choose a paid route to avoid sleep. Prefer explicit waking/degraded states. |
| Delivery | Telegram; Web Push P1; email P2; SMS/WhatsApp adapter stubs and SMS simulator | No billable provider or phone-number collection in P0. |
| Fonts | Self-hosted `@fontsource` Newsreader, Atkinson Hyperlegible Next, Noto Devanagari; optional numeric font | Verify package names, axes, coverage, OFL notices, and tabular figures. |
| Tests | pytest, Vitest, Playwright, axe-core, Lighthouse CI | Pin versions and browser binaries in CI. |

Use Node.js 22 LTS compatibility as the initial toolchain target; verify chosen Vite's supported Node versions, then commit `.node-version` with an exact supported patch. Use npm workspaces and `package-lock.json`; use `uv` or pip-tools with a committed Python lockfile. Add `docs/dependencies.md` listing actual resolved versions and licences. Do not claim the candidate versions are latest.

Report these deck changes in README: Next.js→Vite static SPA; Mapbox/Leaflet→MapLibre/OpenFreeMap; SMS delivery→Telegram/Push/email with SMS preview; FastAPI→dynamic enhancement behind static data; additions of thermofeel, SHAP/calibration, CAP, and GitHub Actions.

### D.2 Repository tree

```text
apps/web/
  src/{app,routes,components,features,data,i18n,styles,lib}/
  public/{fonts,icons,data}/
  tests/{unit,e2e,visual}/
  vite.config.ts
services/api/
  app/{main,auth,contracts,routes,alerts,channels,storage}/
  tests/
pipeline/
  heatguard_core/{units,thermal,hazard,imd,vulnerability,risk,provenance}/
  {fetch_forecast,prepare_wards,prepare_features,build_climatology,select_replay,publish}.py
  tests/{fixtures,unit,integration}/
ml/{features,train,calibrate,evaluate,explain}.py
ml/artifacts/manifest.json
config/{city,methods.v1,weights.v1,actions.v1,sources}.json
data/{raw,processed,replay,fixtures}/
schemas/{snapshot.schema,methods.schema,actions.schema}.json
supabase/{config.toml,migrations,seed.sql,tests}/
docs/{methods.md,verification-register.md,dependencies.md,data-sources.md,openapi.yaml}/
docs/methods/{radiation,climatology,vulnerability,validation}.md
reports/{tests,accessibility,performance,visual}/
scripts/{dev,build-demo,validate-data,assemble-deploy}/
.github/workflows/{ci,pipeline,keep-alive,deploy}.yml
.env.example
.gitignore
README.md
DECISIONS.md
THIRD_PARTY_NOTICES.md
```

Keep executable data generators, cited fixtures, and lockfiles in source control. Keep secrets, large raw weather archives, unsanitized subscriptions, and fitted models over the repository's justified size budget out of public Git. Commit small replay summaries and manifests, not hundreds of megabytes of raw rasters.

### D.3 Environment variables

Provide `.env.example` with harmless defaults or empty secret values and a comment for each variable:

```dotenv
# Browser-visible values only
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_DATA_BASE_URL=/data
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_APP_ORIGIN=http://localhost:5173
VITE_ENABLE_DEMO=true
VITE_VAPID_PUBLIC_KEY=
# Server / pipeline only; NEVER prefix these with VITE_
APP_ENV=development
API_ALLOWED_ORIGINS=http://localhost:5173
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_JWKS_URL=
SUPABASE_JWT_ISSUER=
SUPABASE_JWT_AUDIENCE=authenticated
DELIVERY_MODE=test
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_TEST_CHAT_IDS=
HANDLE_HMAC_KEY=
HANDLE_ENCRYPTION_KEY=
DELETION_TOKEN_HMAC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
RESEND_API_KEY=
EMAIL_FROM=
PIPELINE_DATA_DIR=./data
OPEN_METEO_FORECAST_URL=https://api.open-meteo.com/v1/forecast
OPEN_METEO_ARCHIVE_URL=https://archive-api.open-meteo.com/v1/archive
FORECAST_MODEL=best_match
CITY_TIMEZONE=Asia/Kolkata
SNAPSHOT_STALE_SECONDS=21600
ENABLE_ML=false
ENABLE_EMAIL=false
```

Specify `SUPABASE_SECRET_KEY` as the current secret-key mechanism or explicitly documented legacy service-role equivalent, never a browser key. Use secret storage in GitHub Actions and the API host. Generate independent cryptographic keys with documented lengths; use AES-256-GCM for endpoints and HMAC-SHA256 for lookup. Never ship the example file as a configured secret file. Restrict outbound API destinations to configured trusted sources.

### D.4 Deployment and operations

1. Verify all V gates needed by P0 and record unresolved items before selecting providers.
2. Install pinned Node/Python dependencies; expose `npm ci`, `npm run dev`, `npm run build`, `npm run test`, `npm run test:e2e`, and `python -m pytest` as documented commands.
3. Initialize local Supabase/PostGIS and migrations using the installed CLI's `--help`; create migration files with `supabase migration new`, iterate locally, run advisors, and verify migration replay. Check current CLI target semantics before any remote command. The November 2026 CLI v3 changelog changes default targets and hosted confirmation handling. [Supabase CLI change](https://supabase.com/changelog/supabase-cli-v3)
4. Create the free hosted project only if available without payment details; configure authorities out of band. Keep ordinary readers anonymous to the database and consume public static snapshots.
5. Complete one-off geometry/features/climatology/replay preparation; validate and commit redistribution-safe outputs and source manifests.
6. Produce the first current snapshot locally. Build the SPA with a validated snapshot manifest and same-origin static data.
7. Deploy the build directory to Cloudflare Pages. Verify SPA fallback, `/ward/:id` deep links, MIME types, compression, security headers, asset cache headers, and both preview and production base URLs. Never claim a deployment URL unless it resolves to the built app.
8. Configure GitHub Actions to run `17 */3 * * *` UTC and `workflow_dispatch`. Use concurrency `heatguard-pipeline` with no overlapping publications, explicit job timeout 25 minutes, minimal permissions, and pinned action commits.
9. Publish snapshots to a data branch. Assemble a deploy artifact from source revision plus validated data revision and run direct static deployment, or use a verified equivalent free workflow. Separate data updates from source builds. Treat the original Cloudflare “500 builds/month” statement as VERIFY, not a perpetual allowance.
10. Host FastAPI on a verified no-card free service or self-host it. Expose `/health`; do not add business logic to Pages merely to hide API sleep. On startup, fail closed for missing signing/encryption/auth configuration and serve non-sensitive health diagnostics.
11. Configure CORS to exact origins, JWT issuer/audience/JWKS validation, Telegram webhook secret, HTTPS, and delivery test allowlist. Do not use wildcard credentialed CORS.
12. Add a low-frequency daily health check `43 5 * * *` UTC; perform real API/DB reads, respect host terms, and report failures without promising to defeat suspension. Use pre-demo warming for the actual event.
13. Configure CI: dependency install → lint/type checks → rule/API/data tests → web build → 360/1280 e2e → axe → Lighthouse/size budgets → artifact retention. Do not give pull-request workflows production secrets.
14. Keep previous two validated releases for rollback. Promote the manifest last. Show deployed app git SHA and data git SHA separately.

Use initial operational budget warnings at 60% and publication stop/review at 80% of a verified quota. Supabase's research-time free plan lists 500 MB database and inactivity pausing; use that only as a dated planning reference and keep raw historical weather outside it. [Supabase free-plan details](https://supabase.com/pricing)

## E. Data pipeline: sources, endpoints, schedule, cache, failures

### E.1 Geography and demographic preparation

Create a `city.json` with `city_id=pune_pmc`, timezone, configured ward manifest, model selection, map extent computed from polygons, and attribution references. Derive map centre from geometry; do not use invented polygon shapes. Use EPSG:4326 interchange and an appropriate local metric CRS, such as verified UTM zone 43N (EPSG:32643), for area/distance operations.

Download licensed ward boundaries from DataMeet/PMC. Save original source URL, retrieval time, SHA-256, boundary year, definition (electoral prabhag vs administrative ward), and source ward IDs. Validate polygons, explain repairs, and generate an ID `pune-{boundary_year}-{source_id}`. Never present historic ward IDs as current without qualification. Calculate area geodesically or in the selected metric projection. Retain true geometric centroid; if it lies outside the polygon, use a representative interior point for weather and label its point method.

Acquire census population, slum share, and children from verified OpenCity/Census sources; keep dataset-specific licences rather than assuming all OpenCity uploads are public domain. Save a crosswalk with source-target weights and population preservation checks. For area redistribution, require weights to sum to 1 within `1e-6` for every covered source polygon; show uncovered area and population coverage. Do not infer demographic zeros from absent rows.

Use WorldPop only as an optional labelled gridded estimate, ESA WorldCover/OSM for green/built-up fractions, and optional Landsat 8/9/GEE LST anomaly in P2. Verify GEE noncommercial eligibility/signup and export permission; precompute a static CSV once. Never treat LST as air temperature or directly add it to NWP without a validated adjustment model.

Fetch OSM candidates from Overpass offline, cache for 30 days, and avoid repeated live queries from the browser. Query only the computed PMC envelope with hospitals, community centres, libraries, drinking-water points, malls, and relevant metro stations; inspect official tag documentation before writing the exact selector. A starter query shape is:

```overpass
[out:json][timeout:60];
(
  nwr[amenity~"^(hospital|community_centre|library|drinking_water)$"]({{south}},{{west}},{{north}},{{east}});
  nwr[shop=mall]({{south}},{{west}},{{north}},{{east}});
  nwr[railway=station][station=subway]({{south}},{{west}},{{north}},{{east}});
);
out center tags;
```

Resolve ways/relations consistently, clip to the study area plus a justified nearby search buffer, deduplicate by OSM type/id, and retain unknown opening hours/access as unknown. Derive walking distance from a verified OSM walk graph offline if available; otherwise show straight-line distance explicitly and never label it walking distance. Store routing graph date and accessibility caveats. Label every candidate **“Candidate refuges from OpenStreetMap — not official PMC cooling centres.”**

### E.2 Forecast request and time windows

Issue server-side batched centroid requests only. Construct `latitude` and `longitude` lists in matching stable ward order and maintain index→ward mapping. Deduplicate identical requests or grid cells where verified, but preserve the per-ward association. Do not equate the number of HTTP requests with the provider's billable/limited call accounting.

Use this request template after V01 confirms its parameter names and availability:

```text
GET https://api.open-meteo.com/v1/forecast
  ?latitude={comma-separated-latitudes}
  &longitude={comma-separated-longitudes}
  &hourly=temperature_2m,relative_humidity_2m,dew_point_2m,wind_speed_10m,shortwave_radiation,direct_radiation,diffuse_radiation,direct_normal_irradiance,cloud_cover,apparent_temperature
  &temperature_unit=celsius
  &wind_speed_unit=ms
  &timezone=UTC
  &timeformat=unixtime
  &past_days=2
  &forecast_days=7
  &models={verified-model-id}
```

Keep the selected model explicit in the publication manifest. Allow `best_match` initially, but expose that model-source attribution and actual initialization time may be mixed/unavailable; do not fabricate a 00Z run. Add required radiation fields only after verifying availability. Fetch enough horizon to cover five displayed IST days plus night context; trim by actual UTC instants rather than assuming UTC midnight matches IST midnight.

Show `issued_at` as the snapshot publication time; store `fetched_at` separately. Store `model_run=null` when unknown and render “Model run unavailable.” Never infer initialization from HTTP fetch time or scheduled cron hour. Use actual upstream model metadata when available.

Budget calls using the provider's verified multi-location and variable accounting. The research-time noncommercial terms specify fewer than 10,000 calls/day, 5,000/hour, and 600/minute, with a monthly limit also listed; recheck before implementation and stay comfortably below every applicable limit. [Open-Meteo terms](https://open-meteo.com/en/terms)

### E.3 Climatology, archives, and replay preparation

Use `https://archive-api.open-meteo.com/v1/archive` with verified `latitude`, `longitude`, `start_date`, `end_date`, `hourly`, `models=era5` or supported `era5_land`, and consistent UTC/unit options. Verify per-variable coverage and resolution; do not describe ERA5-Land as covering all years back to 1940 merely because ERA5 does. Chunk long periods by location/year, throttle within accounting limits, and cache raw responses keyed by normalized request and source model.

Build 1991–2020 daily Tmax normals and night-minimum percentile thresholds. Record valid years, coverage, missingness, quantile algorithm, leap-day treatment, model, spatial aggregation, and method version. Do not fill missing normals using contemporary forecasts.

Scan the last five **complete calendar years** preceding demo/build year. For a 2026 build, scan 2021–2025, not incomplete 2026. Acquire Pune-centre history first for inexpensive candidate screening, then all ward data for candidate episodes. Use the exact episode selection in K and retain candidate scores. Do not call a replay the city's hottest observed episode: it is selected from specified reanalysis coverage by a declared metric.

For ML, use the current officially documented historical/single-run/previous-run endpoint, with a verified model initialization selector and horizon. Put the exact supported request in the register before coding it. Do not invent an `issue_time` parameter the API may not support. For ensemble data, verify `https://ensemble-api.open-meteo.com/v1/ensemble`, model IDs, members, variable completeness, units, and run metadata before enabling likelihood.

### E.4 Scheduled computation and atomic publication

Implement the following ordered pipeline and save `run_report.json` with start/end, source health, quota estimates, counts, warnings, and failure stage:

1. Load immutable config, ward manifest, feature cohort, climatology, and optional approved ML artifact; compute their checksums.
2. Fetch/cache raw forecast batches; validate statuses, timestamps, units, and schema before computation.
3. Normalize units/time; compute solar geometry/MRT/UTCI/WBGT/HI with quality flags.
4. Calculate daily base, overnight/persistence rules, IMD badge, and daily statistics.
5. Join vulnerability on versioned ward IDs and compute risk/priority.
6. Optionally run verified ML/ensemble inference without replacing the selected baseline silently.
7. Generate `forecast.json`, `wards.geojson`, `bulletin.json`, `meta.json`, and `methods.json` under an immutable `releases/{snapshot_id}/` directory.
8. Validate cross-file IDs/counts/config versions, missingness, geometries, and the complete source-period horizon. Compress and calculate file hashes.
9. Publish files first, then replace `latest.json` manifest atomically. Never let a new manifest reference missing or partly written files.
10. Optionally create **drafts only** in the alert queue; never approve or send from the scheduler. Deduplicate by ward set/date/risk/method/snapshot ID.

Make output deterministic given raw inputs, `issued_at` as an explicit run argument, config, seed, and git SHA. Use sorted keys/records and stable floating-point serialization. Keep model training outside scheduled runs.

Use `snapshot_id={UTC-issue-compact}-{short-content-hash}` and schema version `1.0.0`. Keep hourly arrays columnar with one time axis and a field/units dictionary; do not repeat provenance strings for every value. Put geometry in a separate cacheable file and avoid duplicating it per hour. Enforce <=300 KB gzipped per initial overview snapshot payload; lazy-load ward-hour details/replay files if necessary and report total scenario transfer separately.

### E.5 Cache and failure contract

| Resource/failure | Required behaviour |
|---|---|
| Raw forecast cache | Key by endpoint/model/coordinates/variables/time range/units. Reuse within 3-hour source refresh; retain sanitized raw inputs for reproducibility. |
| Immutable release files | `Cache-Control: public,max-age=31536000,immutable`; content-address or version filenames. |
| latest.json | `max-age=60,must-revalidate`, ETag. Validate manifest and SHA-256 before adopting. |
| HTML/service worker | Revalidate; never permanently cache mutable HTML. |
| 429 | Honor Retry-After; exponential backoff with jitter at nominal 2, 4, 8, 16, 32 seconds, max 5 attempts and job budget. |
| 5xx/network timeout | 10-second connect and 60-second read timeout; same bounded backoff; cap concurrency at 2 batches until verified safe. |
| 4xx schema/parameter error | Stop and report; do not retry invalid requests repeatedly. |
| Any essential ward/hour absent | Keep last complete snapshot; do not replace the whole publication with a partial reassuring view. Diagnostics can show partial results separately. |
| New snapshot corrupt/hash mismatch | Reject it, retain last good release, show update failure and last-known-good time. |
| No last-known-good data | Show explicit unavailable state, no risk numeral or synthetic map values. Offer downloaded real replay only if available and labelled. |
| Snapshot age >6 hours | Mark stale using `now-issued_at>21600` seconds; keep exact timestamp, source age, and unavailable model run visible. |
| Underlying model run older than expected | Show source-specific age warning even if the pipeline republished recently. Do not let a new publication time conceal old upstream data. |
| API asleep/unavailable | Retain read-only static views; disable mutations with the waking/error message. Retry health with bounded 2/4/8/16-second polling for at most 60 seconds. |
| Tiles/style unavailable | Render cached ward polygons with a blank basemap; preserve list selection and attribution. |
| Database paused | Show service unavailable, keep cached public data, require successful DB readiness before alert workflow. |

Keep an explicit publication health status. Report both time since publication and time since upstream initialization where known. Test these paths in L.

## F. Database schema and API contracts

### F.1 SQL DDL

Use the following as the required logical schema. Verify extension placement against the current Supabase project; qualify PostGIS functions/types with its installed schema. Keep secrets and authorization membership in an **unexposed** schema. Create migrations through the verified CLI, apply to a disposable local database, inspect advisors, and replay them from empty before marking the DDL verified. Do not claim this printed DDL has already been executed.

```sql
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated, service_role;

create table app_private.authority_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer','officer','approver')),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table app_private.authority_members enable row level security;
grant select, insert, update, delete on app_private.authority_members to service_role;

-- Use SECURITY DEFINER only for this narrowly scoped private membership lookup.
-- Check the caller via auth.uid(); accept no caller-supplied identity or role.
create function app_private.current_authority_role() returns text
language sql stable security definer set search_path = '' as $$
  select m.role from app_private.authority_members m
  where m.user_id = (select auth.uid()) and m.active;
$$;
revoke all on function app_private.current_authority_role() from public;
grant execute on function app_private.current_authority_role() to authenticated;

create table public.wards (
  id text primary key,
  boundary_version text not null,
  source_ward_id text not null,
  name_en text not null,
  name_mr text,
  geom extensions.geometry(MultiPolygon,4326) not null,
  centroid extensions.geometry(Point,4326) not null,
  weather_point extensions.geometry(Point,4326) not null,
  weather_point_method text not null,
  area_km2 double precision not null check (area_km2 > 0),
  admin_ward_office text,
  provenance jsonb not null,
  unique(boundary_version,source_ward_id),
  check (extensions.st_isvalid(geom))
);
create index wards_geom_gix on public.wards using gist(geom);

create table public.ward_features (
  ward_id text not null references public.wards(id),
  feature_version text not null,
  component text not null,
  raw_value double precision,
  unit text not null,
  percentile double precision check (percentile between 0 and 1),
  data_vintage text not null,
  source text not null,
  is_proxy boolean not null,
  weight double precision not null check (weight >= 0),
  cohort_id text not null,
  provenance jsonb not null,
  primary key(ward_id,feature_version,component)
);

create table public.snapshots (
  id text primary key,
  issued_at timestamptz not null,
  fetched_at timestamptz not null,
  model_run timestamptz,
  model_id text not null,
  data_vintage jsonb not null,
  git_sha text not null,
  schema_version text not null,
  method_version text not null,
  boundary_version text not null,
  is_simulation boolean not null,
  mode text not null check(mode in ('live','replay','whatif')),
  source_snapshot_id text references public.snapshots(id),
  manifest jsonb not null,
  check (is_simulation = (mode <> 'live'))
);

create table public.forecast_hourly (
  snapshot_id text not null references public.snapshots(id) on delete cascade,
  ward_id text not null references public.wards(id),
  valid_time timestamptz not null,
  issue_time timestamptz not null,
  model_run timestamptz,
  t2m double precision,
  rh double precision check(rh between 0 and 100),
  dew_point double precision,
  wind double precision check(wind >= 0),
  mrt double precision,
  utci double precision,
  wbgt double precision,
  heat_index double precision,
  supporting_fields jsonb not null default '{}'::jsonb,
  quality_flags jsonb not null default '[]'::jsonb,
  provenance jsonb not null,
  primary key(snapshot_id,ward_id,valid_time)
);
create index forecast_time_idx on public.forecast_hourly(ward_id,valid_time);

create table public.ward_daily (
  snapshot_id text not null references public.snapshots(id) on delete cascade,
  ward_id text not null references public.wards(id),
  date date not null,
  lead_days smallint not null,
  base_level smallint check(base_level between 0 and 4),
  hazard_level smallint check(hazard_level between 0 and 4),
  hazard_rule_fired jsonb not null,
  vulnerability double precision check(vulnerability between 0 and 1),
  vulnerability_percentile double precision check(vulnerability_percentile between 0 and 1),
  vulnerability_coverage double precision check(vulnerability_coverage between 0 and 1),
  top_quintile boolean,
  risk_level smallint check(risk_level between 0 and 4),
  risk_basis text not null check(risk_basis in ('hazard_only','vulnerability_adjusted','unavailable')),
  priority_score double precision check(priority_score between 0 and 100),
  peak_utci double precision,
  peak_wbgt double precision,
  tmax double precision,
  night_min_t double precision,
  night_threshold double precision,
  imd_flag text not null check(imd_flag in ('no','heat_wave','severe_heat_wave','unknown_departure')),
  p_ge_3 double precision check(p_ge_3 between 0 and 1),
  probability_method text,
  drivers jsonb not null default '[]'::jsonb,
  completeness jsonb not null,
  primary key(snapshot_id,ward_id,date),
  check (risk_level is null or hazard_level is not null),
  check (risk_level is null or risk_level >= hazard_level)
);
create index ward_daily_rank_idx on public.ward_daily(snapshot_id,date,risk_level desc,priority_score desc);

create table public.actions (
  id text not null,
  version text not null,
  risk_level smallint not null check(risk_level between 0 and 4),
  audience text not null check(audience in ('authority','citizen','outdoor_worker','school_anganwadi','care_home')),
  context jsonb not null default '{}'::jsonb,
  text_en text not null,
  text_hi text,
  text_mr text,
  translation_status text not null default 'needs_native_review',
  source jsonb not null,
  active boolean not null default true,
  primary key(id,version,risk_level,audience)
);

create table public.refuges (
  id text primary key,
  osm_type text not null,
  osm_id bigint not null,
  name text,
  category text not null,
  point extensions.geometry(Point,4326) not null,
  access_status text not null default 'unknown',
  opening_hours text,
  verified_cooling_centre boolean not null default false,
  provenance jsonb not null,
  unique(osm_type,osm_id)
);
create index refuge_point_gix on public.refuges using gist(point);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  snapshot_id text not null references public.snapshots(id),
  ward_ids text[] not null check(cardinality(ward_ids)>0),
  risk_level smallint not null check(risk_level between 0 and 4),
  audience text not null check(audience in ('authority','citizen','outdoor_worker','school_anganwadi','care_home')),
  languages text[] not null,
  status text not null default 'draft' check(status in ('draft','approved','sent','cancelled')),
  cap_status text not null check(cap_status in ('Test','Exercise')),
  revision integer not null default 1 check(revision>0),
  content jsonb not null,
  content_sha256 text not null,
  cap_xml text,
  action_version text not null,
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approval_revision integer,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  sent_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz not null,
  is_simulation boolean not null,
  idempotency_key text not null unique,
  check (expires_at>created_at),
  check (approved_by is null or approved_by<>created_by),
  check (status not in ('approved','sent') or
    (approved_by is not null and approved_at is not null and approval_revision=revision)),
  check (status<>'sent' or sent_at is not null)
);
create index alerts_status_idx on public.alerts(status,created_at desc);
create table public.alert_wards (
  alert_id uuid not null references public.alerts(id) on delete cascade,
  ward_id text not null references public.wards(id),
  primary key(alert_id,ward_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  channel text not null check(channel in ('telegram','web_push','email')),
  handle_hash text not null,
  ward_id text not null references public.wards(id),
  lang text not null check(lang in ('en','hi','mr')),
  audience text not null check(audience in ('citizen','outdoor_worker','school_anganwadi','care_home')),
  consent_at timestamptz not null,
  consent_version text not null,
  consent_expires_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(channel,handle_hash,ward_id,lang,audience)
);
create table app_private.subscription_secrets (
  subscription_id uuid primary key references public.subscriptions(id) on delete cascade,
  endpoint_ciphertext bytea not null,
  encryption_key_version text not null,
  deletion_token_hash text not null unique
);
alter table app_private.subscription_secrets enable row level security;
grant select,insert,update,delete on app_private.subscription_secrets to service_role;

create table public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts(id),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  channel text not null check(channel in ('telegram','web_push','email','sms_simulator')),
  recipient_key text not null,
  revision integer not null,
  status text not null check(status in ('pending','sending','succeeded','failed','unknown','simulated')),
  attempts smallint not null default 0,
  provider_message_id text,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(alert_id,channel,recipient_key,revision)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  event text not null,
  entity_type text not null,
  entity_id text not null,
  before_state jsonb,
  after_state jsonb,
  request_id uuid not null,
  created_at timestamptz not null default now()
);
create index audit_entity_idx on public.audit_log(entity_type,entity_id,created_at);

-- Enable RLS on every exposed table. Avoid broad authenticated write grants.
do $$ declare n text; begin
  foreach n in array array['wards','ward_features','snapshots','forecast_hourly',
    'ward_daily','actions','refuges','alerts','alert_wards','subscriptions',
    'alert_deliveries','audit_log'] loop
    execute format('alter table public.%I enable row level security',n);
    execute format('revoke all on public.%I from anon, authenticated',n);
  end loop;
  foreach n in array array['wards','ward_features','snapshots','forecast_hourly',
    'ward_daily','actions','refuges'] loop
    execute format('grant select on public.%I to anon, authenticated',n);
    execute format('create policy public_read on public.%I for select to anon, authenticated using (true)',n);
  end loop;
  foreach n in array array['alerts','alert_wards','alert_deliveries','audit_log'] loop
    execute format('grant select on public.%I to authenticated',n);
    execute format('create policy staff_read on public.%I for select to authenticated using ((select app_private.current_authority_role()) in (''viewer'',''officer'',''approver''))',n);
  end loop;
end $$;

grant select,insert,update,delete on public.wards,public.ward_features,
  public.snapshots,public.forecast_hourly,public.ward_daily,public.actions,
  public.refuges,public.alerts,public.alert_wards,public.subscriptions,
  public.alert_deliveries to service_role;
grant select,insert on public.audit_log to service_role;
grant usage,select on sequence public.audit_log_id_seq to service_role;
revoke update,delete,truncate on public.audit_log from service_role;
```

Validate all numeric data in Pydantic and before SQL insertion, rejecting NaN/infinity explicitly; PostgreSQL floating-point range checks alone are not a substitute. Validate lengths, language values, ward sets, and JSON object schemas server-side. Add SQL triggers to enforce immutable audit rows even for accidentally elevated application writes; restrict actual application credentials from schema ownership.

Keep `alerts.ward_ids` synchronized with `alert_wards` in one transaction; enforce with a deferred constraint trigger, and validate no duplicate IDs. Preserve array order only for display, not identity. Enforce allowed alert transitions in a database trigger or a single restricted transaction function, with no general frontend update permission. Do not expose that function publicly as an unrestricted SECURITY DEFINER RPC.

Keep historical hourly data primarily in static/Parquet archives. Mirror at most the last two live releases and selected demo summaries to Supabase; do not let routine retention delete snapshots referenced by alerts. Retain referenced metadata and compact evidence while expiring unneeded hourly rows. Monitor DB size before 80% of quota. Do not delete original public snapshots required to reproduce an approved alert.

### F.2 Authorization and workflow invariants

Validate JWT signature using trusted JWKS, issuer, audience, expiry, and session requirements; read current `authority_members` for privileged operations so removed membership is effective promptly. Never authorize from user-editable `user_metadata`. RLS adds defence for direct reads; service-role API writes bypass RLS, so enforce authorization explicitly on every write. [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)

| Operation | Permission |
|---|---|
| Static public data / methods / health / replay | Public, rate limited where dynamic. |
| Authority table | Public ward data; auth-gated authority workspace and alert queue. |
| Read drafts, delivery/audit summaries | Active viewer, officer, or approver; exclude recipient endpoints. |
| Create/edit draft | Active officer or approver. |
| Approve | Active approver, different user from creator, current exact revision. |
| Send | Active approver with approved current revision; default test allowlist only. |
| Cancel | Officer creator for draft, or approver for approved; no deletion of audit evidence. |
| Subscribe | Public with per-channel ownership confirmation and explicit consent. |
| Delete subscription | Verified `/stop`, authenticated channel ownership, or one-time high-entropy deletion token. Never an ID alone. |

For approve/send/cancel, lock the alert row, verify `expected_revision`, check expiry/simulation/snapshot validity, mutate, and append audit in one transaction. A stale revision returns 409. Do not permit editing approved content; cancellation followed by a new linked draft requires new approval. Make approval bind to canonical content digest, target set, action version, language templates, expiry, source snapshot, and revision.

Implement outbox delivery records within the send transaction. Do not claim exactly-once delivery for providers without idempotency. If a network timeout leaves provider acceptance unknown, record `unknown`, show it, and do not blindly resend. Treat `sent` as all intended jobs successfully delivered or intentionally simulated; partial failures remain approved with delivery summary. Prevent parallel send requests using idempotency keys and unique delivery constraints.

### F.3 Shared JSON and OpenAPI rules

Implement `/api/v1`; generate `docs/openapi.yaml` from checked Pydantic models and expose the same schema in dev. Use snake_case JSON fields, UUIDs for mutations, UTC ISO timestamps with `Z`, local dates as `YYYY-MM-DD`, pagination `limit` default 50/max 200 and opaque `cursor`, and `Idempotency-Key` headers for mutations that create or send.

Envelope every JSON response, including errors:

```json
{
  "data": {},
  "meta": {
    "snapshot_id": "fixture-contract-only",
    "issued_at": "2025-05-01T00:30:00Z",
    "model_run": null,
    "data_vintage": {"weather":"contract fixture", "boundaries":"fixture"},
    "git_sha": "contract-example-only",
    "is_simulation": true,
    "mode": "replay",
    "schema_version": "1.0.0",
    "method_version": "1.0.0",
    "timezone": "Asia/Kolkata",
    "quality_flags": ["SYNTHETIC_CONTRACT_EXAMPLE"]
  }
}
```

Treat every literal ID, date, value, or geometry in API examples in F as a **synthetic contract fixture**, never seed it as real Pune data. Replace it with actual computed provenance in production. Allow `issued_at`, `snapshot_id`, and `model_run` to be null on health/errors unrelated to a snapshot. Return `data:null` plus `error:{code,message_key,details,retryable,request_id}` for errors. Never include provider secrets or delivery endpoints in `details`.

Use codes `WARD_NOT_FOUND` (404), `INVALID_INPUT` (422), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `REVISION_CONFLICT` (409), `RATE_LIMITED` (429 with Retry-After), `STALE_SNAPSHOT` (409 on unsafe mutations), `SNAPSHOT_UNAVAILABLE` (503), `SERVICE_WAKING` (503), and `DEPENDENCY_UNAVAILABLE` (503). Limit JSON bodies to 64 KB; bound ward selections to the current registry count, string lengths to their documented template needs, and the simulation cache to 100 scenarios/process with one-hour expiry.

Use `X-Request-ID`, ETag on static-compatible GETs, explicit request timeouts, no-store on personal/authority responses, and generated typed frontend clients. For XML downloads preserve CAP XML as XML, not a JSON wrapper; include metadata in CAP parameters and `X-HeatGuard-Snapshot-ID`, `X-HeatGuard-Is-Simulation`, and `X-HeatGuard-Issued-At` headers. Return an enveloped JSON error if XML generation fails.

### F.4 Public read API

| Method/path | Query/request | Response `data` shape |
|---|---|---|
| GET `/wards` | `boundary_version?`, `include_geometry=false`, `limit`, `cursor` | `{items:[{id,name_en,name_mr,boundary_version,area_km2,centroid:[lon,lat],provenance}],next_cursor,total}`; use separate GeoJSON download by default. |
| GET `/wards/{id}` | `snapshot_id?`, `date?`, `t?` | `{ward,daily,hourly,vulnerability_components,refuges,actions,provenance}`; return 404 for unmatched boundary ID. |
| GET `/forecast` | `date` required, `snapshot_id?`, `ward_id?`, `mode?` | `{date,wards:[Daily],counts_by_level:[n0,n1,n2,n3,n4],unknown_count}`; verify count sum equals registry count. |
| GET `/bulletin/latest` | `snapshot_id?`, `lang=en` | `{bulletin_id,headline_key,headline_args,period,start,end,peak_window,counts_by_level,unknown_count,highest_level,actions,source_ids}`. |
| GET `/replay/{episode_id}` | `ward_id?`, `date?` | `{episode:{id,start,end,selection_score,selection_method,baseline_years},manifest,forecast,comparison}`; always simulation metadata. |
| GET `/methods` | `version?` | `{formulas,thresholds,weights,actions_version,source_catalog,validation,limitations,changelog}` generated from config, with no invented metrics. |
| GET `/health` | `readiness=false` | `{status:"ok|degraded|waking",api,db,pipeline,snapshot_age_seconds,sources}`; report no credentials, host internals, or recipient counts. |

Define `Daily` as the serializable form of `ward_daily` plus `ward_id`, peak UTCI/WBGT hours, time window, rule inputs, sources, data completeness, and optional likelihood. Use a UTC time axis and field arrays for hourly records. Example result fragment:

```json
{
  "ward_id":"fixture-ward-a",
  "date":"2025-05-01",
  "base_level":2,
  "hazard_level":3,
  "vulnerability":0.84,
  "top_quintile":true,
  "risk_level":4,
  "risk_basis":"vulnerability_adjusted",
  "priority_score":69.0,
  "peak_utci":37.2,
  "peak_wbgt":29.1,
  "night_min_t":27.5,
  "night_threshold":26.8,
  "hazard_rule_fired":["UTCI_BASE","NIGHT_RELIEF_2"],
  "imd_flag":"no",
  "p_ge_3":null,
  "completeness":{"hourly":true,"night_context":true,"persistence_context":true},
  "quality_flags":["SYNTHETIC_CONTRACT_EXAMPLE"]
}
```

Do not use the fixture's .84 to infer its percentile; real top-quintile status must be computed from the full cohort. The example priority follows C.5 exactly: `100*(3/4)*(.5+.5*.84)=69`.

### F.5 What-if API

Accept only immutable known source snapshots, not arbitrary remote URLs or client-supplied baseline weather. Apply deltas to **all required context hours** before recomputing derived quantities, daily rules, IMD, and risk. Keep vulnerability unchanged unless the separate weights scenario is selected.

```text
POST /api/v1/whatif
Content-Type: application/json
```

```json
{
  "snapshot_id":"fixture-contract-only",
  "ward_ids":["fixture-ward-a"],
  "temperature_delta_c":2.0,
  "relative_humidity_delta_pp":10.0,
  "wind_multiplier":0.75,
  "weights_mode":"default"
}
```

Validate temperature delta `[0,6]`, RH delta `[-30,30]` percentage points, wind multiplier `[0,2]`, and weights `default|equal`. Clamp changed RH to `[0,100]` and record clamp counts; recalculate dew point from modified T/RH using the verified inverse humidity relation. Recompute radiation estimates dependent on T/RH consistently while retaining source cloud/shortwave; label this as a nonphysical independent-perturbation scenario, not a new weather forecast. Handle low winds via the verified UTCI domain policy, preserving original wind and adjustment flags.

Return 200 `{scenario_id,source_snapshot_id,applied_deltas,clamp_counts,baseline,scenario,comparison,expires_at}` under the envelope with `is_simulation=true`, `mode=whatif`; echo its content hash. Return 422 for invalid range/IDs, 503 for missing inputs. Do not store identifiable scenario users. Hash normalized inputs for cache/deduplication. Debounce the browser by 300 ms and cancel obsolete requests. Provide the same computation locally through the Python CLI for offline preparation; do not fake offline live API results.

### F.6 Subscription API and channel confirmation

`POST /subscriptions` accepts `{channel,ward_id,lang,audience,consent:true,consent_version,endpoint?}`. For Telegram, return a short-lived 128-bit-or-stronger opaque registration token and deep link; do not accept an unverified client-provided chat ID. Complete registration only when a validated webhook receives `/start <token>` from the consenting chat. For Push, require a valid browser subscription structure and HTTPS permission initiated by the user. For email, confirm ownership by expiring confirmation link before activation; keep email disabled until its free route is verified.

Return 202 `{subscription_id,status:"pending_confirmation",confirmation:{type,url?,expires_at},deletion_token?}` with no recipient echo. After ownership confirmation return confirmed state and a once-shown high-entropy deletion token. Keep deletion tokens out of server logs and referrers. Do not put tokens in analytics or public URLs persisted by the app.

`DELETE /subscriptions/{id}` requires `Authorization: Bearer {deletion-token}` or authenticated same-channel ownership; return 200 `{deleted:true}` and normal metadata. Make repeated authorized deletion idempotent without revealing other subscriptions. Add verified Telegram webhook `/integrations/telegram/webhook` with secret-header validation and event deduplication. `/stop` must delete every subscription and encrypted endpoint for that chat across wards/languages, not merely mute it. Limit registration attempts per IP/session and handle ownership challenges without making subscription lists public.

### F.7 Alert API and export

| Method/path | Request | Success `data` |
|---|---|---|
| GET `/alerts` | `status?`, `date?`, `limit`, `cursor`; staff JWT | `{items:[AlertSummary],next_cursor}`. |
| POST `/alerts/draft` | `{snapshot_id,ward_ids,risk_level,audience,languages,action_ids,onset,expires}` + Idempotency-Key | 201 `{alert,channel_previews,cap_preview_url}`. Generate text from approved templates; validate level against selected ward data and keep per-ward levels if mixed. |
| PATCH `/alerts/{id}` | `{expected_revision,ward_ids?,languages?,action_ids?,onset?,expires?}` | 200 `{alert}` with incremented revision; draft only. |
| POST `/alerts/{id}/approve` | `{expected_revision,content_sha256}` | 200 `{alert,audit_event_id}`; independent approver required. |
| POST `/alerts/{id}/send` | `{expected_revision,delivery_mode:"test"}` + Idempotency-Key | 202 `{alert_id,status,deliveries:{pending,succeeded,failed,unknown,simulated}}`. |
| POST `/alerts/{id}/cancel` | `{expected_revision,reason_code}` | 200 `{alert,audit_event_id}`; preserve original record. |
| GET `/alerts/{id}/cap.xml` | Staff JWT; `download=true` | `application/cap+xml`, sanitized attachment name `heatguard-{id}-r{revision}.xml`. |
| GET `/alerts/{id}/audit` | Staff JWT | `{items:[{event,actor_role,revision,created_at,content_sha256}]}` without subscription secrets. |

Define `AlertSummary={id,status,revision,ward_ids,risk_level,audience,languages,onset,expires_at,created_at,approved_at,sent_at,is_simulation,cap_status,delivery_summary}`. Add full content and provenance only in authorized alert detail/composer state. Never accept arbitrary action text or arbitrary channel handles in a send request.

Validate stale (>6h), expired, incomplete, superseded, unreviewed-language, or changed-revision alerts before approval/send. Require regeneration for live stale alerts. Permit immutable historical replay input for Exercise previews only; never treat its old timestamp as a live current forecast. Keep simulation deliveries confined to explicit demo recipients; exclude normal subscriber lists.

Implement an `AlertChannel` interface with `preview(alert,lang)`, `validate_recipient`, `send(approved_payload,recipient,idempotency_key)`, and `delivery_status`. Telegram sends only to chats that pressed Start and consented. Push sends only to permissioned subscriptions. Email stays disabled without a configured verified sender. SMS/WhatsApp return preview/simulated status and never contact a provider. Display SMS character count and encoding/segment estimate; Unicode Devanagari segmentation differs from GSM-7. Verify segment sizes before exposing precise segment counts.

### F.8 CAP 1.2 contract

Generate CAP from the **frozen approved content**, not current mutable weather. Validate against the official XSD and test XML escaping and disabled external-entity parsing. Use `urn:oasis:names:tc:emergency:cap:1.2`; include identifier, team-owned sender identifier, sent timestamp with UTC offset, status `Test|Exercise`, msgType `Alert`, scope `Restricted` with a restriction explaining prototype/test recipients, and language-specific `info` blocks. Map risk 0/1→Minor, 2→Moderate, 3→Severe, 4→Extreme as an explicit prototype mapping. Set certainty to `Possible` or `Likely` only when justified by forecast probability; never use `Observed` for a model forecast. Set urgency from onset, not colour. [OASIS CAP 1.2](https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html)

Include event “Heat stress advisory — HeatGuard prototype,” onset/expiry, audience, headline, description, instructions, source link, category `Met`, and ward areas. For CAP polygons output `latitude,longitude`, unlike GeoJSON's longitude-first coordinates; close the ring. Represent MultiPolygons as separate polygon elements/areas as permitted by XSD; handle holes/large geometries with a documented compliant simplification or explicit geocodes, not invalid coordinate strings. Put ward ID/boundary version in `geocode` and hazard/vulnerability/risk/snapshot/method/is_simulation in `parameter` elements. Identify the team as sender; do not use “PMC official” or invent an authorized identifier. Explain national CAP compatibility as a standards integration path only after V07 verification; no operational connection is implemented.

## G. Design system: “The Daily Bulletin”

Build a modern meteorological bulletin crossed with a survey map: warm paper, green-tinted ink, exact numerals, editorial serif hierarchy, thin rules, compact information. Take principles from NWS/CDC HeatRisk's restrained severity scale and IMD's institutional register; use Linear/Plausible-style restraint and sparse numeric hierarchy without copying their interfaces. Make decisions and source evidence prominent.

### G.1 CSS tokens

Define every semantic token centrally; do not scatter arbitrary hex, spacing, radius, duration, or font values through components. Use these exact base values:

```css
@import "tailwindcss";
:root {
  color-scheme: light;
  --paper-0: #F3F1EA;
  --paper-1: #FBFAF6;
  --paper-2: #E9E6DB;
  --rule: #D3CFC1;
  --rule-strong: #A9A593;
  --ink-0: #16201E;
  --ink-1: #3C4642;
  --ink-2: #5E6762;
  --ink-3: #8B918A;
  --verdigris-100: #D4E6E1;
  --verdigris-600: #1E6B62;
  --verdigris-700: #165249;
  --risk-0: #CFE0CC;
  --risk-1: #EBC65B;
  --risk-2: #E08A2E;
  --risk-3: #BF3A24;
  --risk-4: #5E1646;
  --risk-text-0: var(--ink-0);
  --risk-text-1: var(--ink-0);
  --risk-text-2: var(--ink-0);
  --risk-text-3: #FFFFFF;
  --risk-text-4: #FFFFFF;
  --vulnerability-0: #E9EBEE;
  --vulnerability-1: #C5CCD6;
  --vulnerability-2: #94A3B6;
  --vulnerability-3: #5E7390;
  --vulnerability-4: #2E4262;
  --map-water: #CFDCDA;
  --map-land: #EDEBE2;
  --control-border: var(--ink-2);
  --link: var(--verdigris-600);
  --selected-bg: var(--verdigris-100);
  --error-text: var(--ink-0);
  --disabled-text: var(--ink-3);
  --font-headline: "Newsreader", "Noto Serif Devanagari", serif;
  --font-body: "Atkinson Hyperlegible Next", "Atkinson Hyperlegible", "Noto Sans Devanagari", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
  --text-xs: 12px; --leading-xs: 16px;
  --text-sm: 14px; --leading-sm: 20px;
  --text-base: 16px; --leading-base: 24px;
  --text-lg: 18px; --leading-lg: 26px;
  --text-h4: 22px; --leading-h4: 28px;
  --text-h3: 32px; --leading-h3: 36px;
  --text-h2: 48px; --leading-h2: 50px;
  --text-risk: 88px; --leading-risk: 84px;
  --label-tracking: .06em;
  --weight-regular: 400;
  --weight-strong: 600;
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --radius-surface: 2px;
  --radius-control: 2px;
  --radius-button: 3px;
  --border-thin: 1px;
  --border-focus: 2px;
  --focus-offset: 2px;
  --focus-colour: var(--verdigris-600);
  --focus-offset-colour: var(--paper-0);
  --shadow-overlay: 0 8px 24px rgba(22,32,30,.12);
  --duration-fast: 150ms;
  --duration-normal: 220ms;
  --duration-map: 600ms;
  --ease-out: cubic-bezier(.2,.8,.2,1);
  --target-min: 44px;
  --row-comfortable: 56px;
  --row-compact: 44px;
  --header-height: 72px;
  --bulletin-min-height: 40px;
  --list-width: 320px;
  --detail-width: 400px;
  --frame-max: 1840px;
  --layer-base: 0;
  --layer-sticky: 10;
  --layer-sheet: 20;
  --layer-popover: 30;
  --layer-modal: 40;
  --layer-toast: 50;
  --map-fill-opacity: .8;
  --map-other-opacity: .55;
  --map-stroke: 1px;
  --map-stroke-hover: 1.5px;
  --map-stroke-selected: 2.5px;
}
[lang="hi"], [lang="mr"] {
  --font-headline: "Noto Serif Devanagari", serif;
  --font-body: "Noto Sans Devanagari", sans-serif;
}
:focus-visible {
  outline: var(--border-focus) solid var(--focus-colour);
  outline-offset: var(--focus-offset);
}
@media (prefers-reduced-motion: reduce) {
  :root { --duration-fast: 0ms; --duration-normal: 0ms; --duration-map: 0ms; }
}
```

Map Tailwind theme aliases to these CSS properties. Use handwritten CSS for tables, map panes, charts, sheets, and state treatments. Derive hover tints with `color-mix()` and provide base-colour fallbacks; never introduce default Tailwind gray/blue values.

Use `--ink-3` only for decorative/disabled content, never active body text. Use `--rule` for nonessential separators, not the only boundary of a form control; use `--control-border` where 3:1 is necessary. Verify focus indication against adjacent backgrounds, adding a paper outer ring when needed. Keep the original palette rather than “fixing” contrast by substituting unrelated hues.

### G.2 Risk and map grammar

| Level | Name | Fill/text | Non-colour pattern | Small explanatory IMD-colour correspondence |
|---|---|---|---|---|
| 0 | Low | risk-0 / ink-0 | None | Green — no warning |
| 1 | Watch | risk-1 / ink-0 | None | Yellow — be aware |
| 2 | Elevated | risk-2 / ink-0 | 1px dots on 6px tile | Orange — be prepared |
| 3 | Severe | risk-3 / white | 1px 45° lines every 6px | Red — take action |
| 4 | Extreme | risk-4 / white | Cross-hatch at ±45°, 8px tile | Beyond IMD four-colour scheme |

Always render the numeral and name in chips and legends. Label these IMD correspondences as colour vocabulary only; never imply the custom level is an official IMD warning. Use CSS patterns for chips and actual MapLibre pattern sprites for map fills. Preserve readable labels by placing text on a solid portion of the chip. Use a distinct neutral hatch plus “Unavailable” for missing data, never risk-0.

Use the separate slate-blue ramp for vulnerability quintiles. In the legend explain that rank is relative to the current PMC cohort and not probability. For the hazard layer retain the risk ramp with the legend title “Hazard”; never silently leave the title “Risk.” Cooling-refuge symbols must distinguish candidate type and unknown availability.

Use OpenFreeMap's verified Positron or Bright style as a starting point, desaturate, remove POI clutter, and harmonize water/land tokens. Verify style glyph/font support; MapLibre vector glyphs may require separate hosted assets and cannot simply use a CSS font stack. If self-hosted glyphs cannot be generated within scope, keep licensed readable source glyphs with a documented exception and attribution.

Use .80 polygon fill, 1px paper border, 1.5px ink hover, and 2.5px selected outline. Dim other wards to .55 on selection. Add pattern overlays at levels 2–4. Keep map controls as rectangular 44px targets. Make the list the full keyboard-equivalent interface; disable scroll zoom until the user explicitly engages the map and provide “Return to ward list.”

Implement tile-failure fallback as the same ward source on a local blank style with no external glyph dependency, or an SVG polygon projection with accessible list. Retain selected ward, time, legend, and source attribution. Add a cached legal snapshot or raster basemap only if its licence permits caching. Do not bulk-download OSM's public tile service.

### G.3 Typography, shape, motion, logo

Use Newsreader for headlines and the single 88/84 risk numeral, Atkinson Hyperlegible Next for UI/body, Noto Serif/Sans Devanagari for hi/mr. Use tabular lining figures for tables/charts. Verify numeric feature support; if absent, use Spline Sans Mono or IBM Plex Mono only in numeric columns. Use mono otherwise only for IDs, timestamps, and coordinates. Use a maximum of two weights per family per screen, generally 400/600. Self-host Latin and Devanagari subsets and preload only necessary above-fold fonts.

Use 12px uppercase labels with .06em tracking. Resolve the original 11–12px label suggestion in favour of the stricter no-text-below-12px rule. Use 32/36 headlines on 360/768px, 48/50 on desktop, 22/28 section headings, 16/24 body, 14/20 compact tables, and 12/16 provenance. Do not clip Devanagari matras or force Latin line-height on translated content; increase line-height only as needed and record the locale token.

Use surfaces/control radius 2px, button radius 3px, no pill buttons and no card shadows. Allow only the defined overlay shadow. Separate information through rules, paper levels, spacing, weight, and position. Use asymmetric zones rather than identical cards. Do not use Inter, Roboto, Arial, system-ui, Poppins, or Space Grotesk as the design font.

Prefer text controls to icons. If needed, use one consistent 1.5px line icon set, no emoji. Create the logo as an SVG ward-polygon with one isotherm contour and a Newsreader wordmark. Provide a standalone accessible `logo.svg`, `logo-mark.svg`, and plain monochrome mark. Do not add a sun, thermometer, mascot, photograph hero, 3D blob, or illustrative texture.

Use 150–220ms ease-out for selection/drawer updates, <=600ms map flyTo, and a brief numeric tick only after updates. Do not animate the initial data paint. Disable all optional motion and replay autoplay under reduced-motion. Do not use parallax, confetti, decorative loops, or animated gradients.

### G.4 Component contracts and states

| Component | Geometry and required behaviour |
|---|---|
| BulletinHeader | 40px minimum, 1px rules above/below, 12/16 uppercase; `BULLETIN No. {computed_id} · ISSUED {time} IST · MODEL RUN {run_or_unavailable} · PUNE MUNICIPAL CORPORATION AREA`; identify HeatGuard/team as publisher nearby. Wrap whole segments on mobile. |
| RiskNumeral | One 88/84 serif numeral per overview, adjacent 18/26 level name and 12/16 “Highest ward risk”; use a dash with unavailable text for unknown. Avoid several oversized KPI tiles. |
| LevelChip | Rectangular 2px radius, minimum visual height 24px, 12/16 text and 6px/8px padding; make its clickable wrapper at least 44px. Show numeral, name, and applicable pattern. |
| WardList | 320px desktop column; search input 44px; 56px public/44px compact rows with name, level, peak time, and small sparkline. Stable keyed selection, sorting announcement, and no unexplained ordinal change. |
| WardMap | Lazy MapLibre surface with local ward source, risk/hazard/vulnerability/refuge layers, complete numeric/pattern legend, preserved attribution, selected/time state, accessible list equivalent, and tile-failure blank-style fallback. |
| TimeScrubber | Five labelled day tabs, visible hourly ticks every hour and major labels at 00/06/12/18, 44px thumb target; slider Arrow ±1h, Page ±6h, Home/End period bounds. Show selected IST timestamp and distinguish daily-risk fill from selected-hour stress. |
| HeatRibbon | Five rows ×24 cells, day labels plus 00/06/12/18 axis, gap 1px; minimum 8px cell width at 360px. Use one roving focus cell, full text/table alternative, peak-hour annotation, and accessible tooltip. Do not require each cell to be an individual tiny touch target. |
| DriverBars | At most three model drivers, signed zero axis and direct labels. For P0 show rule explanations instead of invented SHAP bars. Add textual values/thresholds and a detail disclosure. |
| ProvenanceChip | 12/16 source + issue/vintage + Proxy if applicable; 44px interactive parent; Enter/Space opens field-specific details. Do not hide vintage in hover-only tooltip. |
| FreshnessChip | Exact issue time plus Fresh/Stale/Offline text. Use no green dot alone. Open issue/fetch/model-run details. |
| SimulationBanner | Persistent full-width bordered strip, uppercase SIMULATION, mode/source dates, exit button >=44px. Keep visible in exports/previews. Do not dismiss while simulation remains active. |
| SegmentedLevelBar | 20px graphic height plus labelled counts, each segment width proportional to actual count; include unknown outside five levels. Provide a list and total in accessible text. |
| DataTable | Sticky header below actual global header height, 44px compact rows, row/column headers, right-aligned numeric columns, aria-sort buttons and deterministic ties. On narrow screens show an accessible field-detail list rather than horizontal document overflow. |
| Drawer/BottomSheet | Desktop 400px context panel, full-screen mobile modal detail with focus trap/return. Mobile map sheet snaps to 88px, 50dvh, and `calc(100dvh - 112px)`; include three labelled snap buttons as a drag alternative. |
| AlertComposer | Four explicit steps: Audience and wards → Preview → Approval → Delivery. Keep status/revision/content digest visible. Disable with reason until prerequisites pass; never send on preview or approval. |
| ChannelPreview | Plain-text Telegram, Push, email where enabled, SMS simulator, and CAP tabs. Show language, test/simulation label, ward/period, byte/character count where relevant, and exact frozen text. |
| LanguageSwitch | EN / हिंदी / मराठी, active language programmatically indicated, 44px targets, no flags. Preserve route/time/ward on switch. |
| EmptyState/ErrorState/StaleState | Use reserved final-layout regions, specific explanation/action/source time; errors are separate from risk severity. No “Oops,” exclamation marks, or unbounded spinner. |

Build buttons with default/hover/pressed/focus/disabled/pending states. Use ink/verdigris for errors and validation text rather than hazard colours that might be mistaken for a forecast change. Keep labels persistent above fields; use placeholders only as examples. Show inline errors connected with `aria-describedby` and a focusable form error summary. Pending buttons retain text plus progress description; prevent double submission without losing keyboard focus.

Use directly labelled lines, light grid rules, no chart border boxes, no 3D/pie/donut. Build ward ranking as a Cleveland dot plot when visualized, plus five-day UTCI-peak sparklines in rows. Use thin uncertainty bands when available and the categorical Likelihood label with detail percentage. Do not use rainbow palettes or default Recharts/Chart.js styling.

## H. Screen-by-screen implementation

### H.1 Global layout and state model

Use border-box sizing, `min-width:0` on grid children, responsive SVG/canvas sizing, and wrapping localized strings. Make all viewport heights safe with `dvh` and scrollable content regions. Reserve 16px phone, 24px tablet/desktop, and 40px wide-screen gutters. Never require document-level horizontal scrolling at 360px.

| Viewport | Global frame and navigation |
|---|---|
| 360px | Content width 328px with 16px gutters. Header minimum 72px with wordmark/language and secondary freshness row. Use a 44px Menu button for route list, not a horizontally clipped nav. Bulletin wraps. Map-first content uses normal page scroll plus managed sheet. |
| 768px | Content width 720px, 24px gutters. Header 72px; navigation may wrap into a second row. Overview list 280px +16px gap+424px map; detail becomes modal. |
| 1280px | Content width 1232px. Header 72px. Overview columns 320px +16px gap+480px map+16px gap+400px detail. When context closes, give its width to map. |
| 1920px | Max frame 1840px, centered with 40px gutters. Overview 320px +24px gap+1072px map+24px gap+400px detail. Avoid stretching text lines; cap prose at 72ch. |

Implement a shared state machine with `idle/loading/ready/empty/error`, plus independent `stale/offline/simulation` flags. Offline does not imply data is fresh; stale and simulation may coexist. Keep last valid data while revalidating, mark it, and avoid announcing the entire page repeatedly. Render a skeleton matching the final header/list/map/detail layout on first load; do not paint a reassuring risk level during loading.

Keep a skip link, main landmark, one h1, named navigation, persistent status area, route title announcements, and focus restoration. Put the simulation banner above the bulletin and keep it sticky when necessary. Make the page title deterministic from data. Derive `severe_count=count(risk>=3)` and `highest=max(known risk)`; never hard-code “9 of 41 wards.” Say how many wards are unknown in the same summary. Compute peak window from highest stress hours, not a fixed 14:00–16:00.

### H.2 Overview — `/`, “Today in Pune”

At 360px, put the 32/36 editorial sentence, single risk numeral/name, compact level counts, and day selection above a map of at least 320px height. Put ranking and selected detail in the three-snap sheet. Ensure the peek sheet does not cover attribution, map controls, or selected information. Expose a “Show ward list” button before the map.

At 768px, use the two-zone layout in H.1, a 480px minimum map height, and modal ward detail. At 1280/1920px, use the three zones, map minimum 560px high, scrollable ranking, and contextual detail aligned to the map top. Keep the headline above all three, not squeezed into the 320px list.

Provide layer controls Risk/Hazard/Vulnerability/Cooling refuges, date tabs, time slider, ward search, and sort Risk/Priority/Name. Ward selection updates the URL and shared selection, highlights geometry, scrolls the selected list item into view, and opens context. Hour scrubbing updates hourly stress and refuge context; daily-risk map fill remains the selected local day's daily risk, explicitly labelled “Daily risk.” Do not imply daily risk changes every hour. Permit a separate explicitly labelled “Hourly UTCI” detail overlay, not a silent method switch.

| State | Overview presentation |
|---|---|
| Loading | Headline-width skeleton, blank numeric placeholder, skeleton ranking rows, paper map silhouette, source status “Fetching forecast.” |
| Empty | “No forecast is available for this period.” If data exists but no high wards, show real low-level distribution and “No wards are at Level 3 or above in this period.” |
| Error | Keep layout; show retry and last-good timestamp if present. Do not paint unknown wards green. |
| Stale | Global delayed-data strip and stale chips; maintain map/list with last-good data. |
| Offline | “Offline. Showing the last saved forecast.” If no saved data, provide explicit unavailable view; map uses cached/blank style. |

Keyboard: search in natural tab order; list rows are links/buttons, Enter selects, Escape closes modal context, slider uses specified keys. Do not intercept browser page navigation keys outside focused widgets. Provide a list equivalent to every clickable map feature.

### H.3 Ward detail — `/ward/:id?t=`

Show ward name and boundary vintage; then three separate labelled values Risk, Hazard, Vulnerability, with source chips and any `hazard_only` warning. Add “Why this level,” fired/unknown rules, peak UTCI and WBGT/time, night minimum/threshold/date span, five-day heat ribbon, vulnerability raw/percentile/weight breakdown, candidate refuges, audience actions, and full provenance. Add likelihood only if available, otherwise a named unavailable state.

At 360px use a full-page 328px content stack with 24px section spacing; at 768px use a 640px-max dialog/page and two 308px value groups where they fit; at 1280px use the 400px overview drawer or a 960px standalone page; at 1920px keep prose <=72ch and use a 1040px standalone two-column layout. Do not cram a full desktop chart into a narrow drawer. Preserve list/map selection on close.

Refuge rows contain name/type, candidate label, known/unknown opening status, distance mode, dataset age, and external map link. Do not say “nearest open cooling centre” without confirmed opening/cooling status. Provide audience tabs Citizen/Outdoor worker/Authority/School/Care home with source labels and no personalized medical diagnosis.

Use loading section skeletons, empty “No candidate refuges are mapped nearby,” error “Ward details could not be loaded” with cached-summary fallback, stale field/group chips, and offline “Saved ward details” with missing sections clearly unavailable. Deep-link failures show invalid ward/boundary explanation. Keep focus on the detail heading after user-initiated navigation, and restore it to the originating row when closing a modal.

### H.4 Authority console — `/authority`

Gate the workspace with auth and current membership. Show a sign-in form, access-denied state, and service-waking state before displaying restricted alert/audit data. A browser-only demo authority workspace may demonstrate state transitions locally but must say “Local demo — no messages sent” and cannot stand in for the real P0 authenticated workflow.

At 360px show a segmented workspace selector Wards/Actions/Alerts/Export and ward detail rows with Risk/Hazard/Priority plus expandable remaining fields. At 768px use a compact primary table with configurable column visibility and an alerts section beneath; at 1280px use full-width table with action queue and composer below/in a 400px drawer; at 1920px use a 1200px table/queue plus a 616px composer separated by 24px inside the 1840px frame. Never create document horizontal scroll; permit an explicitly labelled internally scrollable table only above phone width with a persistent accessible field alternative.

Keep columns: Ward, Risk, Hazard, Vulnerability, Priority, Peak UTCI, Peak WBGT, Night min, Indicative IMD badge, 5-day sparkline. Use sticky header, caption, aria-sort, selection count, ward search, risk/date filters, and “Select all filtered wards” with explicit scope. Row controls stay >=44px even in compact density. Show an unsorted header's role and one active sort direction.

Build an action queue of “what / where / when / responsible audience / source / confirmation required.” Drafting an alert is separate from confirming an actual municipal action. Composer flow: select wards/date/audience/languages → source-bound text previews → submit draft → independent approval → explicit Send test alert. Show draft/approved/sent/cancelled timeline, revision, creators/approvers, expiry, delivery results, and audit. Disable real delivery for stale/unknown data and unreviewed language; explain why.

Export CSV with explicit units, boundary vintage, issue/model/source time, method version, and simulation fields. Prevent formula injection for user/source text beginning with `=`, `+`, `-`, or `@`. CAP export is P0; printable bulletin/PDF is P1 using print CSS, not paid rendering. Print on A4 portrait with 12mm margins, 12px minimum text, repeated table headings, monochrome-readable patterns, source footnotes, and visible simulation status on every page.

Use table/composer skeletons; empty “No alerts match these filters”; error retry within the failed workspace; stale banner disables live approval/send while reads remain; offline blocks mutations and leaves cached public table/local previews. Preserve unsent draft inputs locally only if they contain no delivery endpoints and clearly mark them unsubmitted.

### H.5 Outdoor worker — `/worker`, P1

At 360px use a single 328px column, 32/36 current guidance, 22/28 key value, 18/26 hourly instructions, and workload/ward controls >=44px. At 768px use a 640px maximum column; at 1280px use a 720px timeline +320px assumptions panel separated by 24px; at 1920px cap this workspace at 1120px rather than stretching type.

Require ward and Light/Moderate/Heavy workload. Provide acclimatization “Unknown / Not acclimatized / Acclimatized” with Unknown default, plus a conspicuous clothing/worksite assumption. Show estimated outdoor WBGT by hour, lower-exposure windows, sourced screening status, and a site-verification instruction. Define a contiguous lower-exposure window as at least two valid hourly points under the selected verified workload screening threshold; label this a planning heuristic.

Preserve the requested work:rest feature, but gate numeric prescriptions on a verified source explicitly permitting that use with applicable clothing/acclimatization/rest environment. Current CCOHS screening-table notes say those screening values are not intended to prescribe recovery periods; do not interpolate them into invented minutes. If no suitable openly usable schedule is verified, show “Work:rest schedule requires a worksite assessment” and explain the unmet feature rather than inventing limits. Keep a cited schedule dataset adapter ready; do not claim numeric schedule acceptance has passed.

Use verified public NIOSH/OSHA workload screening thresholds only for screening. Do not equate model-based outdoor WBGT with a worksite meter. Treat unknown acclimatization conservatively using the verified unacclimatized screening reference and explicitly state the assumption. Do not retain worker health details.

Provide Share text/image with ward, date, assumptions, source, issue time, simulation label, and no location history. Use skeleton hourly rows; empty “No lower-exposure window meets this screening rule”; error/unavailable WBGT with no “safe” badge; stale and offline flags on all shared output. Never label missing hours safe. [OSHA workload screening](https://www.osha.gov/heat-exposure/hazards), [CCOHS applicability notes](https://www.ccohs.ca/oshanswers/phys_agents/heat/heat_control.html)

### H.6 Scenario Replay & What-if — `/scenarios`

At 360px stack mode tabs, persistent simulation strip, 44px episode selector, source/date/selection explanation, sliders, comparison summary, then map/list link. At 768px use 280px controls +16px gap+424px comparison; at 1280px use 320px controls +24px gap+888px map/summary; at 1920px use 360px controls +24px gap+1456px comparison area with bounded prose.

Use replay episodes actually generated in K. Show ERA5/ERA5-Land dates and method, not a hand-selected severity claim. Provide day/hour scrub, Play/Pause/Reset, speed 1×/2×, Today vs scenario switch, and “Open this scenario on overview.” Pause on route change, tab hidden, or reduced motion preference.

Use what-if sliders Temperature +0..6 °C step .5, RH -30..30 percentage points step 5, Wind multiplier 0..2 step .1; give paired number inputs and Reset. Debounce 300ms, show a pending computation state retaining prior result, and make comparison quantities explicitly risk/ward-count changes computed from the two datasets. Cancel obsolete responses so a slow request cannot overwrite newer inputs.

Use episode/slider skeletons; empty “No real replay episode has been prepared” and instructions to the pipeline; error retains baseline plus failed scenario state; stale live baseline remains labelled; offline permits cached replay but shows “What-if computation is unavailable offline” unless a precomputed matching scenario is cached and identified. Never relabel a fixture as ERA5 replay.

### H.7 Subscribe — `/subscribe`

At 360px use one full-width column; at 768px cap form at 560px; at 1280px use 560px form +24px gap+400px preview; at 1920px cap total width at 984px. Use ward/language/audience, channel selection, plain consent, channel-specific confirmation, test-message button after ownership confirmation, and deletion instructions. Generate Telegram QR locally from the verified deep link; include its text equivalent and expiry.

Request Push permission only on its named button, never on page load. Show unsupported/denied permission recovery instructions. Hide no failed channel behind a fake success. Keep email marked disabled/coming later unless enabled with a verified free sender. Do not collect name/phone. Require checkbox plus valid selection before registration. Show awaiting Start/ownership confirmation; use clear success only after webhook/confirmation actually completes.

Use form skeleton on configuration load, empty “No delivery channel is configured” with previews, error inline plus focusable summary, stale warning about the data being subscribed to, and offline “Connect to finish subscribing.” Keep pending form selections without storing endpoint secrets in localStorage.

### H.8 Methods & Data — `/methods`

Treat this as a primary trust screen. At 360px use 328px accordions plus a contents disclosure; at 768px use a 720px single column; at 1280px use a 216px sticky contents +24px gap+808px article; at 1920px cap article at 920px and contents at 240px with 32px gap.

Show NWP/physics/ML separation, exact configs/formulas, UTCI/IMD boundaries, night-rule assumption, vulnerability values/weights/omissions, cohort and vintage, data resolution, sources/licences, absence of health outcomes, candidate-refuge limitations, ML baseline comparison or “ML not trained,” genuine metrics/split dates, radiation approximations, uncertainty definition, changelog, and attribution. Pull values from the exact `methods.json`/`GET /methods` version used by the selected snapshot.

Offer equal/default weight sensitivity analysis as a labelled simulation without changing live data. Display computed rank changes and correlation only when data exists. Make citation links descriptive, not raw footnote numbers alone. Clearly state municipality-scale production use needs a checked data licence route if Open-Meteo free terms do not cover it.

Use heading/table skeletons; empty “Validation results are not available yet”; error falls back to bundled versioned methods with a mismatch warning; stale explains method/data ages independently; offline keeps cached citations as link text without pretending remote references are available.

### H.9 System status — `/status`, P1

Use a 328px stack at 360px, 720px at 768px, and a <=1040px status table at 1280/1920px. Show last successful/failed pipeline run, last snapshot publication/source age, API waking/ready/down, database availability, weather-source health, map-source fallback, and version. Show exact times and bounded retry, not invented uptime percentages or an SLA.

Use skeleton status rows; empty “No pipeline run has been recorded”; error “Status could not be checked”; stale last-check time; offline cached status explicitly dated. Never expose credentials, endpoints containing tokens, private user counts, database connection strings, or stack traces.

## I. Copy deck: English, Hindi, Marathi

### I.1 Catalogue rules

Create `en.json`, `hi.json`, and `mr.json`, grouped by the keys below. Treat **every Hindi and Marathi string in this document as “needs native-speaker review.”** Store that status at catalogue and safety-template level, display it on translation previews, and require review signoff before external hi/mr alert delivery. Public P1 translated pages may show the review banner; never silently present machine translations as approved official advice. Keep English fallback per key, announce fallback language where mixed safety text is displayed, and do not fall back silently in a sent alert.

Use ICU placeholders without altering their identifiers during translation. Format dates, time, numbers, and plurals with `Intl` and `Asia/Kolkata`. Use actual derived values for all placeholders, escape source/ward text, and do not concatenate sentence fragments. Keep the exact English brand tagline in the logo lockup; translations below may accompany it as explanatory text.

Use the following complete baseline catalogue. Add any implementation-specific string to all three catalogues before shipping; forbid hard-coded user-facing strings outside it except source names, units, enum IDs, and attributed quotations. Reuse shared strings where identical. Translation status applies to every hi/mr cell, including seemingly simple labels.

### I.2 Navigation, controls, and field labels

| Key | English | Hindi — needs native-speaker review | Marathi — needs native-speaker review |
|---|---|---|---|
| brand.tagline | Predict heat. Protect people. | गर्मी का पूर्वानुमान। लोगों की सुरक्षा। | उष्णतेचा अंदाज. लोकांचे संरक्षण. |
| nav.overview | Today in Pune | आज पुणे में | आज पुण्यात |
| nav.authority | Authority console | प्राधिकरण कार्यस्थल | प्राधिकरण कार्यक्षेत्र |
| nav.worker | Outdoor work | बाहर काम | मैदानी काम |
| nav.scenarios | Scenario Replay & What-if | पिछली घटना और संभावित स्थिति | मागील घटना व संभाव्य परिस्थिती |
| nav.subscribe | Subscribe | सूचनाएँ पाएँ | सूचना मिळवा |
| nav.methods | Methods & Data | पद्धति और डेटा | पद्धती आणि डेटा |
| nav.status | System status | सिस्टम की स्थिति | प्रणालीची स्थिती |
| nav.menu | Menu | मेन्यू | मेनू |
| common.skip | Skip to main content | मुख्य सामग्री पर जाएँ | मुख्य मजकुराकडे जा |
| common.close | Close | बंद करें | बंद करा |
| common.cancel | Cancel | रद्द करें | रद्द करा |
| common.retry | Try again | फिर कोशिश करें | पुन्हा प्रयत्न करा |
| common.reset | Reset | रीसेट करें | रीसेट करा |
| common.apply | Apply | लागू करें | लागू करा |
| common.continue | Continue | आगे बढ़ें | पुढे जा |
| common.back | Back | पीछे | मागे |
| common.download | Download | डाउनलोड करें | डाउनलोड करा |
| common.share | Share | साझा करें | शेअर करा |
| common.searchWard | Search for a ward | प्रभाग खोजें | प्रभाग शोधा |
| common.chooseWard | Choose a ward | प्रभाग चुनें | प्रभाग निवडा |
| common.showList | Show ward list | प्रभाग सूची दिखाएँ | प्रभाग सूची दाखवा |
| common.returnList | Return to ward list | प्रभाग सूची पर लौटें | प्रभाग सूचीकडे परत जा |
| common.details | View details | विवरण देखें | तपशील पाहा |
| common.date | Date | तारीख | तारीख |
| common.hour | Hour | घंटा | तास |
| common.language | Language | भाषा | भाषा |
| common.audience | Audience | लक्षित समूह | लक्ष्य गट |
| common.source | Source | स्रोत | स्रोत |
| common.vintage | Data vintage | डेटा का वर्ष | डेटाचे वर्ष |
| common.proxy | Proxy | परोक्ष अनुमान | अप्रत्यक्ष अंदाज |
| common.unavailable | Not available | उपलब्ध नहीं | उपलब्ध नाही |
| common.unknown | Unknown | अज्ञात | अज्ञात |
| common.comfortable | Comfortable density | सामान्य घनत्व | सामान्य मांडणी |
| common.compact | Compact density | सघन घनत्व | संक्षिप्त मांडणी |
| level.0 | 0 Low | 0 कम | 0 कमी |
| level.1 | 1 Watch | 1 सतर्क रहें | 1 लक्ष ठेवा |
| level.2 | 2 Elevated | 2 बढ़ा हुआ | 2 वाढलेला |
| level.3 | 3 Severe | 3 गंभीर | 3 गंभीर |
| level.4 | 4 Extreme | 4 अत्यधिक | 4 अतितीव्र |
| field.ward | Ward | प्रभाग | प्रभाग |
| field.risk | Risk | जोखिम | जोखीम |
| field.hazard | Hazard | मौसमी खतरा | हवामानाचा धोका |
| field.vulnerability | Vulnerability | संवेदनशीलता | असुरक्षितता |
| field.priority | Allocation priority (prototype) | संसाधन प्राथमिकता (प्रोटोटाइप) | संसाधन प्राधान्य (प्रायोगिक) |
| field.utci | Peak UTCI | अधिकतम UTCI | कमाल UTCI |
| field.wbgt | Peak WBGT | अधिकतम WBGT | कमाल WBGT |
| field.night | Night minimum | रात का न्यूनतम तापमान | रात्रीचे किमान तापमान |
| field.imd | Indicative IMD criteria | सांकेतिक IMD मानदंड | सूचक IMD निकष |
| field.likelihood | Likelihood of Level 3 or above | स्तर 3 या अधिक की संभावना | स्तर 3 किंवा अधिकची शक्यता |
| field.dailyRisk | Daily risk | दैनिक जोखिम | दैनंदिन जोखीम |
| field.hourlyStress | Hourly thermal stress | प्रति घंटा तापीय तनाव | तासानुसार उष्णतेचा ताण |
| layer.refuges | Cooling refuges | ठंडक के संभावित स्थान | गारव्यासाठी संभाव्य ठिकाणे |
| sort.risk | Sort by risk | जोखिम के अनुसार क्रम | जोखमीनुसार क्रम |
| sort.priority | Sort by priority | प्राथमिकता के अनुसार क्रम | प्राधान्यानुसार क्रम |
| sort.name | Sort by name | नाम के अनुसार क्रम | नावानुसार क्रम |
| audience.citizen | Citizen / caregiver | नागरिक / देखभालकर्ता | नागरिक / काळजीवाहक |
| audience.worker | Outdoor worker | बाहर काम करने वाला | मैदानी कामगार |
| audience.authority | Authority | प्राधिकरण | प्राधिकरण |
| audience.school | School / anganwadi | विद्यालय / आंगनवाड़ी | शाळा / अंगणवाडी |
| audience.careHome | Care home | देखभाल केंद्र | देखभाल केंद्र |

### I.3 Data explanations, statuses, and empty/error copy

| Key | English | Hindi — needs native-speaker review | Marathi — needs native-speaker review |
|---|---|---|---|
| overview.highest | Highest ward risk | सबसे अधिक प्रभाग जोखिम | सर्वाधिक प्रभाग जोखीम |
| overview.headline | {severity} heat risk is expected in {count} of {total} wards on {day}, peaking {window}. | {day} को {total} में से {count} प्रभागों में {severity} गर्मी का जोखिम; चरम समय {window}। | {day} रोजी {total} पैकी {count} प्रभागांत {severity} उष्णतेची जोखीम; सर्वोच्च वेळ {window}. |
| overview.lowHeadline | No wards are at Level 3 or above in this period. | इस अवधि में कोई प्रभाग स्तर 3 या उससे ऊपर नहीं है। | या काळात कोणताही प्रभाग स्तर 3 किंवा त्याहून अधिक नाही. |
| overview.unknown | Risk is unavailable for {count} wards. | {count} प्रभागों का जोखिम उपलब्ध नहीं है। | {count} प्रभागांची जोखीम उपलब्ध नाही. |
| detail.why | Why this level | यह स्तर क्यों | हा स्तर का |
| detail.base | Peak UTCI is {value} °C: {category}. | अधिकतम UTCI {value} °C है: {category}। | कमाल UTCI {value} °C आहे: {category}. |
| detail.nights | Night temperatures exceed the local threshold for 2 consecutive nights. | लगातार 2 रातों में तापमान स्थानीय सीमा से ऊपर है। | सलग 2 रात्री तापमान स्थानिक मर्यादेपेक्षा जास्त आहे. |
| detail.persistence | Strong heat stress persists for at least 3 consecutive days. | तीव्र तापीय तनाव लगातार कम से कम 3 दिन बना रहता है। | तीव्र उष्णतेचा ताण किमान सलग 3 दिवस टिकतो. |
| detail.bump | High relative vulnerability adds one level when hazard is at least Level 2. | मौसमी खतरा कम से कम स्तर 2 होने पर अधिक सापेक्ष संवेदनशीलता एक स्तर बढ़ाती है। | हवामानाचा धोका किमान स्तर 2 असल्यास जास्त सापेक्ष असुरक्षिततेमुळे एक स्तर वाढतो. |
| detail.hazardOnly | Vulnerability is unavailable. Risk currently follows hazard only. | संवेदनशीलता उपलब्ध नहीं है। जोखिम अभी केवल मौसमी खतरे पर आधारित है। | असुरक्षिततेचा डेटा उपलब्ध नाही. जोखीम सध्या फक्त हवामानाच्या धोक्यावर आधारित आहे. |
| detail.incomplete | Some rule inputs are missing. This result cannot be used to send a live alert. | कुछ नियमों के इनपुट नहीं हैं। इस परिणाम से लाइव चेतावनी नहीं भेजी जा सकती। | काही नियमांचा डेटा नाही. या निकालावरून थेट इशारा पाठवता येत नाही. |
| detail.imdNote | Indicative — not an official IMD declaration. | सांकेतिक — IMD की आधिकारिक घोषणा नहीं। | सूचक — IMD ची अधिकृत घोषणा नाही. |
| detail.refugeNote | Candidate refuges from OpenStreetMap — not official PMC cooling centres. | OpenStreetMap के संभावित आश्रय — PMC के आधिकारिक शीतलन केंद्र नहीं। | OpenStreetMap वरील संभाव्य आश्रय — PMC ची अधिकृत शीतल केंद्रे नाहीत. |
| detail.walking | Estimated walking distance: {distance}. | अनुमानित पैदल दूरी: {distance}। | अंदाजे चालण्याचे अंतर: {distance}. |
| detail.straight | Straight-line distance: {distance}. Walking route not verified. | सीधी दूरी: {distance}। पैदल रास्ता सत्यापित नहीं है। | सरळ रेषेतील अंतर: {distance}. चालण्याचा मार्ग पडताळलेला नाही. |
| detail.openingUnknown | Opening hours and access are not confirmed. | खुलने का समय और प्रवेश की पुष्टि नहीं है। | उघडण्याची वेळ आणि प्रवेश निश्चित नाही. |
| state.fetching | Fetching forecast. | पूर्वानुमान प्राप्त किया जा रहा है। | अंदाज मिळवत आहे. |
| state.noForecast | No forecast is available for this period. | इस अवधि का पूर्वानुमान उपलब्ध नहीं है। | या काळाचा अंदाज उपलब्ध नाही. |
| state.noSearch | No wards match this search. | खोज से कोई प्रभाग नहीं मिला। | शोधाशी जुळणारा प्रभाग नाही. |
| state.noRefuges | No candidate refuges are mapped nearby. | पास में कोई संभावित आश्रय मानचित्र पर दर्ज नहीं है। | जवळपास संभाव्य आश्रय नकाशावर नोंदलेले नाहीत. |
| state.noAlerts | No alerts match these filters. | इन फ़िल्टर से कोई चेतावनी नहीं मिली। | या गाळण्यांशी जुळणारे इशारे नाहीत. |
| state.noReplay | No real replay episode has been prepared. | पिछली वास्तविक घटना का डेटा तैयार नहीं है। | मागील वास्तविक घटनेचा डेटा तयार नाही. |
| state.failed | Forecast could not be updated. Try again. | पूर्वानुमान अपडेट नहीं हो सका। फिर कोशिश करें। | अंदाज अद्ययावत करता आला नाही. पुन्हा प्रयत्न करा. |
| state.wardFailed | Ward details could not be loaded. | प्रभाग का विवरण नहीं खुल सका। | प्रभागाचा तपशील उघडता आला नाही. |
| state.stale | Forecast last updated {time} IST. New data is delayed. Showing the last available forecast. | पूर्वानुमान का अंतिम अपडेट {time} IST। नया डेटा देर से आ रहा है। अंतिम उपलब्ध पूर्वानुमान दिखाया जा रहा है। | अंदाज शेवटचा {time} IST वाजता अद्ययावत झाला. नवीन डेटाला विलंब आहे. शेवटचा उपलब्ध अंदाज दाखवत आहोत. |
| state.offline | Offline. Showing the last saved forecast. | ऑफलाइन। अंतिम सहेजा हुआ पूर्वानुमान दिखाया जा रहा है। | ऑफलाइन. शेवटचा जतन केलेला अंदाज दाखवत आहोत. |
| state.offlineEmpty | Offline. No forecast is saved on this device. | ऑफलाइन। इस डिवाइस पर पूर्वानुमान सहेजा नहीं गया है। | ऑफलाइन. या उपकरणावर अंदाज जतन केलेला नाही. |
| state.waking | Starting the alert service. This can take up to a minute. | चेतावनी सेवा शुरू हो रही है। इसमें एक मिनट लग सकता है। | इशारा सेवा सुरू होत आहे. यास एक मिनिट लागू शकतो. |
| state.tileFallback | Basemap unavailable. Ward boundaries and the ward list remain available. | आधार मानचित्र उपलब्ध नहीं है। प्रभाग सीमाएँ और सूची उपलब्ध हैं। | मूळ नकाशा उपलब्ध नाही. प्रभाग सीमा आणि सूची उपलब्ध आहेत. |
| state.unauthorized | Sign in with an authorized authority account. | अधिकृत प्राधिकरण खाते से साइन इन करें। | अधिकृत प्राधिकरण खात्याने साइन इन करा. |
| state.forbidden | This account cannot perform this action. | इस खाते को इस कार्य की अनुमति नहीं है। | या खात्याला ही कृती करण्याची परवानगी नाही. |
| state.notFound | This ward is not in the selected boundary set. | यह प्रभाग चुने गए सीमा डेटा में नहीं है। | हा प्रभाग निवडलेल्या सीमा संचात नाही. |
| state.noMetrics | Validation results are not available yet. | सत्यापन परिणाम अभी उपलब्ध नहीं हैं। | पडताळणीचे निकाल अजून उपलब्ध नाहीत. |
| state.translation | Hindi and Marathi text needs native-speaker review. | हिंदी और मराठी पाठ की मातृभाषी समीक्षक से समीक्षा आवश्यक है। | हिंदी आणि मराठी मजकुराचे मातृभाषिकाकडून पुनरावलोकन आवश्यक आहे. |
| freshness.label | Data fresh as of {time} IST · model run {run}. | डेटा {time} IST तक अद्यतन · मॉडल रन {run}। | डेटा {time} IST पर्यंत अद्ययावत · मॉडेल रन {run}. |
| freshness.noRun | Model run unavailable | मॉडल रन उपलब्ध नहीं | मॉडेल रन उपलब्ध नाही |
| methods.prototypeRule | Prototype rule — not locally health-validated. | प्रोटोटाइप नियम — स्थानीय स्वास्थ्य डेटा से सत्यापित नहीं। | प्रायोगिक नियम — स्थानिक आरोग्य डेटावर पडताळलेला नाही. |
| methods.nwp | Weather forecasts come from numerical weather models. Thermal stress is calculated using physics. ML post-processing is optional. | मौसम पूर्वानुमान संख्यात्मक मॉडलों से आते हैं। तापीय तनाव की गणना भौतिकी से होती है। ML बाद का वैकल्पिक चरण है। | हवामानाचा अंदाज संख्यात्मक मॉडेलमधून येतो. उष्णतेचा ताण भौतिकशास्त्रावरून मोजला जातो. ML हा नंतरचा ऐच्छिक टप्पा आहे. |
| methods.resolution | Ward-level risk on grid-resolution weather. These are model estimates, not local sensor readings. | ग्रिड-स्तर के मौसम पर प्रभाग-स्तर का जोखिम। ये मॉडल अनुमान हैं, स्थानीय सेंसर रीडिंग नहीं। | ग्रिडच्या हवामानावर आधारित प्रभागस्तरीय जोखीम. हे मॉडेलचे अंदाज आहेत, स्थानिक सेन्सरची मोजमापे नाहीत. |
| methods.noHealth | Future integration: PMC/State health surveillance data. | भविष्य का एकीकरण: PMC/राज्य स्वास्थ्य निगरानी डेटा। | भविष्यातील जोडणी: PMC/राज्य आरोग्य निगराणी डेटा. |
| methods.defaultWeights | Default weights | मूल भार | मूळ भार |
| methods.equalWeights | Equal weights | समान भार | समान भार |
| methods.noModel | ML not trained. The rule-based baseline is active. | ML प्रशिक्षित नहीं है। नियम-आधारित पद्धति सक्रिय है। | ML प्रशिक्षित नाही. नियमांवर आधारित पद्धत सक्रिय आहे. |

Use ICU variants for singular/plural headline and unknown counts, not the literal plural English line for one ward. Store severity-specific translated adjectives in separate complete template variants where grammar requires it. Translate thermal category names separately from Level names: No heat stress / Moderate / Strong / Very strong / Extreme, each flagged for native review. Do not translate scientific acronym UTCI/WBGT/IMD into an invented acronym.

### I.4 Authority, simulation, subscription, and worker copy

| Key | English | Hindi — needs native-speaker review | Marathi — needs native-speaker review |
|---|---|---|---|
| authority.signIn | Sign in | साइन इन करें | साइन इन करा |
| authority.signOut | Sign out | साइन आउट करें | साइन आउट करा |
| authority.email | Authority email | प्राधिकरण ईमेल | प्राधिकरण ईमेल |
| authority.password | Password | पासवर्ड | संकेतशब्द |
| authority.actions | Action queue | कार्य सूची | कृती सूची |
| authority.draft | Draft alert | चेतावनी का मसौदा | इशाऱ्याचा मसुदा |
| authority.preview | Preview channels | चैनल पूर्वावलोकन | माध्यमांचे पूर्वावलोकन |
| authority.submit | Submit for approval | अनुमोदन के लिए भेजें | मंजुरीसाठी सादर करा |
| authority.approve | Approve this revision | इस संस्करण को अनुमोदित करें | या आवृत्तीला मंजुरी द्या |
| authority.sendTest | Send test alert | परीक्षण चेतावनी भेजें | चाचणी इशारा पाठवा |
| authority.cancelAlert | Cancel alert | चेतावनी रद्द करें | इशारा रद्द करा |
| authority.audit | Audit log | लेखा-परीक्षा रिकॉर्ड | लेखापरीक्षण नोंद |
| authority.export | Export bulletin | बुलेटिन निर्यात करें | बुलेटिन निर्यात करा |
| authority.csv | Download CSV | CSV डाउनलोड करें | CSV डाउनलोड करा |
| authority.cap | Download CAP XML | CAP XML डाउनलोड करें | CAP XML डाउनलोड करा |
| authority.print | Print bulletin / Save PDF | बुलेटिन प्रिंट करें / PDF सहेजें | बुलेटिन छापा / PDF जतन करा |
| authority.draftStatus | Draft | मसौदा | मसुदा |
| authority.approvedStatus | Approved | अनुमोदित | मंजूर |
| authority.sentStatus | Sent | भेजा गया | पाठवला |
| authority.cancelledStatus | Cancelled | रद्द | रद्द |
| authority.independent | A different approver must approve this alert. | दूसरे अनुमोदक को इस चेतावनी का अनुमोदन करना होगा। | वेगळ्या मंजूरकर्त्याने या इशाऱ्याला मंजुरी द्यावी. |
| authority.changed | This draft changed. Review the latest revision before approval. | मसौदा बदल गया है। अनुमोदन से पहले नवीनतम संस्करण देखें। | मसुदा बदलला आहे. मंजुरीपूर्वी नवीन आवृत्ती पाहा. |
| authority.staleBlock | Update the forecast and regenerate this alert before sending. | भेजने से पहले पूर्वानुमान अपडेट कर चेतावनी फिर बनाएँ। | पाठवण्यापूर्वी अंदाज अद्ययावत करून इशारा पुन्हा तयार करा. |
| authority.localDemo | Local demo — no messages sent. | स्थानीय डेमो — संदेश नहीं भेजे गए। | स्थानिक प्रात्यक्षिक — संदेश पाठवलेले नाहीत. |
| authority.deliveryUnknown | Delivery status is unknown. Check before retrying. | संदेश पहुँचने की स्थिति अज्ञात है। फिर भेजने से पहले जाँचें। | संदेश पोहोचल्याची स्थिती अज्ञात आहे. पुन्हा पाठवण्यापूर्वी तपासा. |
| channel.telegram | Telegram | Telegram | Telegram |
| channel.push | Web Push | वेब पुश | वेब पुश |
| channel.email | Email | ईमेल | ईमेल |
| channel.sms | SMS preview — simulator only | SMS पूर्वावलोकन — केवल सिम्युलेटर | SMS पूर्वावलोकन — फक्त अनुकरण |
| channel.whatsapp | WhatsApp — roadmap | WhatsApp — भविष्य की योजना | WhatsApp — पुढील योजना |
| scenario.live | Live forecast | वर्तमान पूर्वानुमान | सध्याचा अंदाज |
| scenario.replay | Scenario Replay | पिछली घटना | मागील घटना |
| scenario.whatif | What-if | संभावित स्थिति | संभाव्य परिस्थिती |
| scenario.replayBanner | SIMULATION — replay of {dates}. Not a live forecast. | सिम्युलेशन — {dates} की घटना। वर्तमान पूर्वानुमान नहीं। | अनुकरण — {dates} मधील घटना. हा सध्याचा अंदाज नाही. |
| scenario.whatifBanner | SIMULATION — changed weather inputs. Not a weather forecast. | सिम्युलेशन — मौसम इनपुट बदले गए हैं। यह मौसम पूर्वानुमान नहीं है। | अनुकरण — हवामानाचा इनपुट बदलला आहे. हा हवामानाचा अंदाज नाही. |
| scenario.exit | Exit simulation | सिम्युलेशन से बाहर जाएँ | अनुकरणातून बाहेर पडा |
| scenario.compare | Compare: today vs scenario | तुलना: आज और संभावित स्थिति | तुलना: आज आणि संभाव्य परिस्थिती |
| scenario.temperature | Temperature change (°C) | तापमान में बदलाव (°C) | तापमानातील बदल (°C) |
| scenario.humidity | Humidity change (percentage points) | आर्द्रता में बदलाव (प्रतिशत अंक) | आर्द्रतेतील बदल (टक्केवारी गुण) |
| scenario.wind | Wind multiplier | हवा का गुणक | वाऱ्याचा गुणक |
| scenario.play | Play | चलाएँ | सुरू करा |
| scenario.pause | Pause | रोकें | थांबवा |
| scenario.demo | Demo script | डेमो क्रम | प्रात्यक्षिक क्रम |
| scenario.offline | What-if computation is unavailable offline. | ऑफलाइन संभावित स्थिति की गणना उपलब्ध नहीं है। | ऑफलाइन संभाव्य परिस्थितीची गणना उपलब्ध नाही. |
| subscribe.consent | I agree to receive HeatGuard alerts for my selected ward, language, and audience. I can stop at any time. No name or phone number is required. | मैं चुने गए प्रभाग, भाषा और समूह के लिए HeatGuard सूचनाएँ पाने की सहमति देता/देती हूँ। कभी भी बंद कर सकता/सकती हूँ। नाम या फोन नंबर आवश्यक नहीं है। | मी निवडलेल्या प्रभाग, भाषा आणि गटासाठी HeatGuard सूचना मिळण्यास संमती देतो/देते. कधीही थांबवू शकतो/शकते. नाव किंवा फोन क्रमांक आवश्यक नाही. |
| subscribe.start | Open Telegram and press Start to confirm. | पुष्टि के लिए Telegram खोलें और Start दबाएँ। | पुष्टीसाठी Telegram उघडा आणि Start दाबा. |
| subscribe.push | Enable alerts on this device | इस डिवाइस पर सूचनाएँ सक्षम करें | या उपकरणावर सूचना सुरू करा |
| subscribe.pending | Waiting for channel confirmation. | चैनल पुष्टि की प्रतीक्षा है। | माध्यमाच्या पुष्टीची प्रतीक्षा आहे. |
| subscribe.success | Subscription confirmed for {ward}. | {ward} के लिए सदस्यता की पुष्टि हुई। | {ward} साठी सदस्यता निश्चित झाली. |
| subscribe.stop | Send /stop to the Telegram bot to delete your subscriptions. | सदस्यताएँ मिटाने के लिए Telegram बॉट को /stop भेजें। | सदस्यता हटवण्यासाठी Telegram बॉटला /stop पाठवा. |
| subscribe.delete | Delete my subscription | मेरी सदस्यता मिटाएँ | माझी सदस्यता हटवा |
| subscribe.deleted | Your subscription and delivery details have been deleted. | आपकी सदस्यता और संदेश पहुँचाने का विवरण मिटा दिया गया है। | तुमची सदस्यता आणि संदेश वितरणाचे तपशील हटवले आहेत. |
| subscribe.test | Send me a test message | मुझे परीक्षण संदेश भेजें | मला चाचणी संदेश पाठवा |
| subscribe.offline | Connect to finish subscribing. | सदस्यता पूरी करने के लिए इंटरनेट से जुड़ें। | सदस्यता पूर्ण करण्यासाठी इंटरनेटशी जोडा. |
| subscribe.disabled | No delivery channel is configured. | संदेश भेजने का चैनल कॉन्फ़िगर नहीं है। | संदेश पाठवण्याचे माध्यम जोडलेले नाही. |
| worker.workload | Workload | काम का भार | कामाचा भार |
| worker.light | Light | हल्का | हलके |
| worker.moderate | Moderate | मध्यम | मध्यम |
| worker.heavy | Heavy | भारी | जड |
| worker.acclimatized | Acclimatized | गर्मी के अभ्यस्त | उष्णतेची सवय असलेले |
| worker.unacclimatized | Not acclimatized | गर्मी के अभ्यस्त नहीं | उष्णतेची सवय नसलेले |
| worker.hours | Lower-exposure hours today | आज कम जोखिम वाले घंटे | आज कमी संपर्काचे तास |
| worker.noWindow | No lower-exposure window meets this screening rule. | इस जाँच नियम के अनुसार कम जोखिम वाली अवधि नहीं मिली। | या तपासणी नियमानुसार कमी संपर्काचा कालावधी नाही. |
| worker.assessment | Work:rest schedule requires a worksite assessment. | काम और विश्राम का समय तय करने के लिए कार्यस्थल का आकलन आवश्यक है। | काम व विश्रांतीचे वेळापत्रक ठरवण्यासाठी कार्यस्थळाचे मूल्यमापन आवश्यक आहे. |
| worker.limits | Model estimates support planning. Confirm conditions at the worksite; no hour is guaranteed safe. | मॉडल अनुमान योजना में मदद करते हैं। कार्यस्थल की स्थिति जाँचें; किसी घंटे की सुरक्षा की गारंटी नहीं है। | मॉडेलचे अंदाज नियोजनासाठी आहेत. कार्यस्थळाची स्थिती तपासा; कोणताही तास सुरक्षित असल्याची हमी नाही. |

Add localized validation keys for required ward/consent/invalid date/out-of-range slider/expired confirmation/denied Push/email not configured; localize their full sentences with the same review flag. Use error code→message-key mapping, not raw server exception text. Use “Please choose a ward,” “Consent is required,” “Enter a value from {min} to {max},” and “This confirmation link has expired. Start again” as the English sources.

### I.5 Versioned action copy and alert templates

Use these action types as concise English starting wording; attach the exact verified NDMA/IMD source section to each before activation. Translate each safety action in hi/mr and mark it pending native review; do not activate unreviewed delivery translations.

| ID / audience | English action | Hindi — needs native-speaker review | Marathi — needs native-speaker review |
|---|---|---|---|
| citizen_water / citizen | Keep drinking water available. Follow any fluid advice given by your clinician. | पीने का पानी उपलब्ध रखें। अपने चिकित्सक की तरल संबंधी सलाह मानें। | पिण्याचे पाणी उपलब्ध ठेवा. डॉक्टरांनी दिलेला द्रवपदार्थांविषयीचा सल्ला पाळा. |
| citizen_exposure / citizen | Reduce direct-sun exposure during {window}. | {window} के दौरान सीधे सूर्य के संपर्क को कम करें। | {window} दरम्यान थेट उन्हातील संपर्क कमी करा. |
| worker_shift / outdoor_worker | Plan strenuous tasks for cooler hours and arrange shaded breaks. | कठिन काम ठंडे समय में रखें और छाया में विश्राम की व्यवस्था करें। | श्रमाची कामे थंड वेळेत ठेवा आणि सावलीत विश्रांतीची व्यवस्था करा. |
| authority_water / authority | Check drinking-water access in {wards} before {start}. | {start} से पहले {wards} में पीने के पानी की उपलब्धता जाँचें। | {start} पूर्वी {wards} येथे पिण्याच्या पाण्याची उपलब्धता तपासा. |
| authority_refuge / authority | Confirm staffed cooling spaces in {wards} for {window}. | {window} के लिए {wards} में कर्मचारियों सहित ठंडक वाले स्थानों की पुष्टि करें। | {window} साठी {wards} येथे कर्मचारी असलेल्या गारव्याच्या जागांची खात्री करा. |
| authority_health / authority | Review heat-response readiness with local health services. | स्थानीय स्वास्थ्य सेवाओं के साथ गर्मी से निपटने की तैयारी की समीक्षा करें। | स्थानिक आरोग्य सेवांसोबत उष्णता प्रतिसादाच्या तयारीचा आढावा घ्या. |
| school_timing / school_anganwadi | Review outdoor activity timings and drinking-water access. | बाहरी गतिविधियों के समय और पीने के पानी की उपलब्धता की समीक्षा करें। | मैदानी उपक्रमांच्या वेळा आणि पिण्याच्या पाण्याची उपलब्धता तपासा. |
| care_outreach / care_home | Check residents' cooling access and follow the care plan. | निवासियों की ठंडक तक पहुँच जाँचें और देखभाल योजना का पालन करें। | रहिवाशांना गारवा मिळतो का ते तपासा आणि काळजी योजनेचे पालन करा. |

Use a risk-level template with variables, never a generative sentence:

```text
English:
{TEST_OR_SIMULATION_PREFIX}
HeatGuard AI — Level {level}: {level_name}
Where: {ward_names}. When: {start_ist}–{end_ist}.
At higher risk: {audience_label}.
Do now: {approved_action_sentences}
Why: {approved_rule_summary}
Source: {source_short_titles}. Issued {issued_at_ist}.
{indicative_imd_note_if_present}
Details: {public_ward_or_scenario_link}
Stop: {channel_stop_instruction}
```

```text
Hindi — needs native-speaker review:
{TEST_OR_SIMULATION_PREFIX}
HeatGuard AI — स्तर {level}: {level_name}
स्थान: {ward_names}। समय: {start_ist}–{end_ist}।
अधिक जोखिम वाला समूह: {audience_label}।
अभी करें: {approved_action_sentences}
कारण: {approved_rule_summary}
स्रोत: {source_short_titles}। जारी: {issued_at_ist}।
{indicative_imd_note_if_present}
विवरण: {public_ward_or_scenario_link}
बंद करें: {channel_stop_instruction}
```

```text
Marathi — needs native-speaker review:
{TEST_OR_SIMULATION_PREFIX}
HeatGuard AI — स्तर {level}: {level_name}
ठिकाण: {ward_names}. वेळ: {start_ist}–{end_ist}.
अधिक जोखीम असलेला गट: {audience_label}.
आता करा: {approved_action_sentences}
कारण: {approved_rule_summary}
स्रोत: {source_short_titles}. जारी: {issued_at_ist}.
{indicative_imd_note_if_present}
तपशील: {public_ward_or_scenario_link}
थांबवा: {channel_stop_instruction}
```

Use `TEST — prototype advisory.` for test live-weather delivery and `SIMULATION — not a live forecast.` for replay/what-if; translate and review these prefixes. Preserve the prefix in every channel, subject, image, printed page, and CAP info. For SMS preview use the deterministic short form `{prefix} HeatGuard L{level} {ward}. {window} IST. {action}. {link}`; allow multiple segments rather than truncating safety meaning silently. For Push use title `{prefix} HeatGuard: {ward} · Level {level}` and a body with when/action; show full details on click. For Telegram escape formatting characters or use plain text, not unescaped Markdown/HTML.

Keep the public copy at roughly Grade 6–8. Do not use “Oops,” “Welcome back,” “Empower,” “Revolutionize,” exclamation marks, fake testimonials, or blanket assurances of safety. Cite the action source next to every recommendation, with the full section link in detail.

### I.6 Validation, remaining enums, and assistive text

| Key | English | Hindi — needs native-speaker review | Marathi — needs native-speaker review |
|---|---|---|---|
| validation.ward | Please choose a ward. | कृपया प्रभाग चुनें। | कृपया प्रभाग निवडा. |
| validation.consent | Consent is required. | सहमति आवश्यक है। | संमती आवश्यक आहे. |
| validation.range | Enter a value from {min} to {max}. | {min} से {max} के बीच मान दर्ज करें। | {min} ते {max} मधील मूल्य भरा. |
| validation.date | Choose a date in the available period. | उपलब्ध अवधि की तारीख चुनें। | उपलब्ध काळातील तारीख निवडा. |
| validation.expired | This confirmation link has expired. Start again. | पुष्टि लिंक की समय-सीमा समाप्त हो गई है। फिर शुरू करें। | पुष्टी दुव्याची मुदत संपली आहे. पुन्हा सुरू करा. |
| validation.pushDenied | Notifications are blocked in this browser. Change the permission in browser settings to subscribe. | इस ब्राउज़र में सूचनाएँ बंद हैं। सदस्यता के लिए ब्राउज़र सेटिंग में अनुमति बदलें। | या ब्राउझरमध्ये सूचना बंद आहेत. सदस्यतेसाठी ब्राउझर सेटिंगमधील परवानगी बदला. |
| validation.pushUnsupported | This browser does not support Web Push. Choose another channel. | यह ब्राउज़र वेब पुश का समर्थन नहीं करता। दूसरा चैनल चुनें। | हा ब्राउझर वेब पुशला समर्थन देत नाही. दुसरे माध्यम निवडा. |
| validation.emailDisabled | Email delivery is not configured. | ईमेल भेजने की सुविधा कॉन्फ़िगर नहीं है। | ईमेल वितरणाची व्यवस्था जोडलेली नाही. |
| validation.signIn | Sign-in failed. Check your details and try again. | साइन इन नहीं हुआ। विवरण जाँचकर फिर कोशिश करें। | साइन इन झाले नाही. तपशील तपासून पुन्हा प्रयत्न करा. |
| validation.tooMany | Too many requests. Try again in {seconds} seconds. | बहुत अधिक अनुरोध हैं। {seconds} सेकंड बाद फिर कोशिश करें। | खूप विनंत्या आल्या आहेत. {seconds} सेकंदांनी पुन्हा प्रयत्न करा. |
| validation.summary | Review the highlighted fields. | चिह्नित फ़ील्ड जाँचें। | दर्शवलेली क्षेत्रे तपासा. |
| imd.no | Criteria not met | मानदंड पूरे नहीं हुए | निकष पूर्ण नाहीत |
| imd.heat | Heat-wave criteria met | लू के मानदंड पूरे हुए | उष्णतेच्या लाटेचे निकष पूर्ण |
| imd.severe | Severe heat-wave criteria met | गंभीर लू के मानदंड पूरे हुए | तीव्र उष्णतेच्या लाटेचे निकष पूर्ण |
| imd.unknown | Departure criterion unavailable | सामान्य से अंतर का मानदंड उपलब्ध नहीं | सामान्य तापमानापासून फरकाचा निकष उपलब्ध नाही |
| probability.low | Low likelihood | कम संभावना | कमी शक्यता |
| probability.medium | Medium likelihood | मध्यम संभावना | मध्यम शक्यता |
| probability.high | High likelihood | अधिक संभावना | जास्त शक्यता |
| thermal.below | Below moderate heat stress | मध्यम से कम तापीय तनाव | मध्यमपेक्षा कमी उष्णतेचा ताण |
| thermal.moderate | Moderate heat stress | मध्यम तापीय तनाव | मध्यम उष्णतेचा ताण |
| thermal.strong | Strong heat stress | तीव्र तापीय तनाव | तीव्र उष्णतेचा ताण |
| thermal.veryStrong | Very strong heat stress | बहुत तीव्र तापीय तनाव | अतितीव्र उष्णतेचा ताण |
| thermal.extreme | Extreme heat stress | अत्यधिक तापीय तनाव | अत्यंत तीव्र उष्णतेचा ताण |
| hi.caution | Caution | सावधानी | काळजी घ्या |
| hi.extremeCaution | Extreme caution | अत्यधिक सावधानी | विशेष काळजी घ्या |
| hi.danger | Danger | खतरा | धोका |
| hi.extremeDanger | Extreme danger | अत्यधिक खतरा | अत्यंत धोका |
| feature.density | Population density | जनसंख्या घनत्व | लोकसंख्येची घनता |
| feature.slum | Slum population share | झुग्गी आबादी का अनुपात | झोपडपट्टीतील लोकसंख्येचे प्रमाण |
| feature.children | Children aged 0–6 | 0–6 वर्ष के बच्चे | 0–6 वर्षांची मुले |
| feature.work | Outdoor-work exposure proxy | बाहरी काम का परोक्ष अनुमान | मैदानी कामाचा अप्रत्यक्ष अंदाज |
| feature.cooling | Distance to a candidate refuge | संभावित आश्रय की दूरी | संभाव्य आश्रयापर्यंतचे अंतर |
| feature.green | Low green cover | कम हरित आवरण | कमी हरित आच्छादन |
| feature.raw | Raw value | मूल मान | मूळ मूल्य |
| feature.percentile | Relative percentile | सापेक्ष प्रतिशतक | सापेक्ष शततमक |
| feature.weight | Weight | भार | भार |
| feature.noVariation | No between-ward variation | प्रभागों के बीच अंतर नहीं | प्रभागांमध्ये फरक नाही |
| table.selectAll | Select all filtered wards | फ़िल्टर किए गए सभी प्रभाग चुनें | गाळलेले सर्व प्रभाग निवडा |
| table.selected | {count} wards selected | {count} प्रभाग चुने गए | {count} प्रभाग निवडले |
| table.riskFilter | Filter by risk level | जोखिम स्तर से फ़िल्टर करें | जोखीम स्तरानुसार गाळा |
| table.columns | Choose columns | कॉलम चुनें | स्तंभ निवडा |
| sheet.peek | Show summary | सारांश दिखाएँ | सारांश दाखवा |
| sheet.half | Show half-height list | आधी ऊँचाई में सूची दिखाएँ | अर्ध्या उंचीची सूची दाखवा |
| sheet.full | Show full list | पूरी सूची दिखाएँ | पूर्ण सूची दाखवा |
| chart.peak | Peak at {time} IST | चरम समय {time} IST | सर्वोच्च वेळ {time} IST |
| chart.showTable | Show data table | डेटा तालिका दिखाएँ | डेटाचा तक्ता दाखवा |
| chart.selected | {ward}, {time} IST, {metric}: {value} | {ward}, {time} IST, {metric}: {value} | {ward}, {time} IST, {metric}: {value} |
| demo.next | Next step | अगला चरण | पुढील पायरी |
| demo.previous | Previous step | पिछला चरण | मागील पायरी |
| demo.exit | Exit demo script | डेमो क्रम बंद करें | प्रात्यक्षिक क्रम बंद करा |
| status.ready | Ready | तैयार | तयार |
| status.degraded | Degraded service | सीमित सेवा | मर्यादित सेवा |
| status.down | Unavailable | अनुपलब्ध | अनुपलब्ध |
| status.lastRun | Last pipeline run | अंतिम डेटा प्रक्रिया | शेवटची डेटा प्रक्रिया |
| status.age | Snapshot age | डेटा स्नैपशॉट की आयु | डेटा स्नॅपशॉटचे वय |
| status.noRun | No pipeline run has been recorded. | डेटा प्रक्रिया का रिकॉर्ड नहीं है। | डेटा प्रक्रियेची नोंद नाही. |
| status.error | Status could not be checked. | स्थिति जाँची नहीं जा सकी। | स्थिती तपासता आली नाही. |
| source.estimated | Approximate thermal indices | अनुमानित तापीय सूचकांक | अंदाजित उष्णता निर्देशांक |
| source.grid | Weather model grid | मौसम मॉडल ग्रिड | हवामान मॉडेल ग्रिड |
| source.saved | Saved ward details | सहेजा गया प्रभाग विवरण | जतन केलेला प्रभाग तपशील |
| export.simulation | SIMULATION — prototype output | सिम्युलेशन — प्रोटोटाइप आउटपुट | अनुकरण — प्रायोगिक निकाल |

Implement singular/plural variants for selected counts and time intervals using ICU, especially English's one/other distinction. Use review metadata rather than appending a long review note inside every button; keep the locale-wide warning and per-alert approval gate visible. Use catalogue keys for all assistive text and status messages, not just visible headings.

## J. Accessibility, i18n, performance, privacy acceptance

### J.1 Accessibility and localization

1. Meet WCAG 2.2 AA: body contrast >=4.5:1, large text/UI graphics >=3:1, visible focus, non-colour severity, logical order, landmarks/headings, and no keyboard traps.
2. Test every text/background pair, including patterned chips, map labels, selected/disabled controls, warnings, and chart annotations. Keep disabled text distinguishable without making it the only explanation of a blocked action.
3. Run deuteranopia, protanopia, and tritanopia simulations and greyscale captures of all five levels, map, chips, legend, and vulnerability ramp. Include numeric/name/pattern alternatives.
4. Keep every actionable target >=44×44 CSS px. Allow smaller chart cells only as part of a large parent control with equivalent text navigation, not as required tiny targets.
5. Test 200% text resize and 400% browser zoom/reflow at desktop equivalent width without clipped controls or missing content; enforce no document horizontal overflow at 360px.
6. Provide a keyboard path to every map selection through the list, every slider through keys/numeric input, every drag sheet through snap buttons, and every tooltip through focus/click.
7. Use `aria-live=polite` for meaningful selected-date/data updates. Reserve assertive live announcements for a newly received Level >=3 alert, not every map scrub. Deduplicate announcements.
8. Use correct modal focus trap, initial focus, Escape, return focus, and background inert handling. Do not trap focus in a passive desktop context pane.
9. Respect reduced motion for map transitions, numeric updates, chart animation, sheet movement, and replay. Pause autoplay for hidden tabs.
10. Use `en`, `hi`, `mr`, ICU plurals, `lang` on the document and mixed-language spans, self-hosted Devanagari fonts, localized units/date/time, and full placeholder preservation tests.
11. Test native-language expansion with 40% pseudo-localization and actual Devanagari. Do not split grapheme clusters or strip matras in SMS counting, truncation, canvas sharing, or search normalization.
12. Record native-speaker review status, reviewer consented identifier, date, template version, and source version. Block external delivery for pending safety strings. Do not fabricate reviewer signoff.

### J.2 Performance and offline budgets

Measure production builds on a mid-range Android profile with 4G throttling, recording browser/device/CPU/network settings and measurement date. Target Overview LCP <=2.5 seconds, initial JS <=200 KB gzipped excluding the lazy MapLibre chunk, initial snapshot <=300 KB gzipped, Lighthouse mobile Performance >=85 and Accessibility >=95. Report the separate MapLibre/font/chart transfer cost so exclusion is transparent. Target CLS <=.1 and INP <=200ms where measurable.

Lazy-load MapLibre after the useful headline/list shell, route-split authority/scenario charts, use stable dimensions and local font loading, and do not bundle ML dependencies into the browser. Limit the displayed hourly series to the selected ward and preload only the next likely day. Prefer compact arrays and frozen provenance dictionaries over repeated strings.

Implement service-worker shell + last-good snapshot caching in P1. In P0 keep versioned in-memory/session-safe fallback and a reproducible offline demonstration using a locally served build and real cached artifacts; do not claim installable offline PWA acceptance before service-worker tests pass. Validate schema/hash before cache replacement, keep prior release until promotion, allow manual clear-cache, and never cache auth endpoints, tokens, subscription bodies, recipient endpoints, or private alert/audit responses.

Measure Lighthouse on ready stable data, not a skeleton that hides missing work. Run three consistent measurements and report median, range, asset sizes, and any failed budget. Do not optimize by deleting required map/table/accessibility content.

### J.3 Privacy, retention, and operational security

Apply data minimization inspired by India's DPDP requirements; verify current applicable legal duties through official sources before claiming legal compliance. Treat hashed and encrypted identifiers as personal data, not anonymous data. Collect only channel endpoint, ward, language, audience, and consent/confirmation metadata; no names, phone numbers, medical history, or tracking cookies.

Use keyed HMAC lookup and authenticated encryption for deliverable handles/endpoints, separate key versions, separate secret storage, and no raw endpoints in logs/audit. Return deletion tokens once and retain only their keyed digest. Use TLS, strict CORS, bounded input validation/rate limiting, safe XML handling, and a Content Security Policy tailored to actual map/glyph/worker endpoints. Add CSP incrementally with explicit allowed sources; do not claim `unsafe-eval` is required without evidence.

Use least privilege and RLS on every exposed table, even where public read is intentional. Authorize current membership server-side. Do not let a viewer approve, a creator self-approve, an anonymous session impersonate staff, or a client forge role metadata. Keep service-role/DB credentials out of frontend bundles, screenshots, deployed source maps, logs, and repo history.

Use these prototype retention defaults as analyst policy, recorded in the privacy notice: pending unconfirmed registrations 24h; unused confirmation tokens <=30min; active subscriptions until deletion or 12 months without renewed consent; deletion within 24h of valid request, including endpoint secrets/caches/pending deliveries; delivery diagnostics 30 days; sanitized authority/audit records 180 days; logs without payloads 7 days. Keep a legitimate authority audit minimum without retaining deleted recipient handles; replace delivery recipient correlation with a non-identifying per-alert token. Explain encrypted backup purge limits based on the actual host rather than promising instant deletion from all backups.

Implement `/stop`, browser deletion, Push unsubscribe, and email unsubscribe. Purge endpoint secrets transactionally; prevent queued deliveries after deletion by rechecking subscription existence/consent before sending. Store authority account IDs only as needed for audit, not public personal profiles. Provide `docs/privacy.md`, `docs/security.md`, and a secret-scanning CI check.

### J.4 Resilience acceptance

Demonstrate usable public headline/ranking/detail from static data with FastAPI unavailable; cached ward polygons with external tiles blocked; last-good release after weather failure; explicit corrupt-snapshot rejection; visible stale state after six hours; and a no-data state if no valid source exists. Do not disguise cached data as a current model run. Keep every selected mode's banner through deep links, exports, browser reloads, and shares.

## K. Demo mode and scenario replay

### K.1 Reproducible episode selection

Run one selection script on the last five complete calendar years of verified ERA5/ERA5-Land data for the fixed geography. Save the selection manifest, source coverage, and all candidate scores. Use the same thermal method, climatology, vulnerability cohort, and risk rules as live, with source-kind metadata changed appropriately.

Define a candidate as a five-consecutive-day window with complete hourly index input and context. Compute each ward's daily UTCI peak and WBGT peak. Score each window lexicographically by:

1. Maximum consecutive days within the window for which the city-median daily UTCI peak has base>=2.
2. Sum over its five days of `max(0, city_median_peak_UTCI -32)`.
3. Maximum city-median daily peak WBGT.
4. Earliest start date as a deterministic final tie break.

Require at least three consecutive qualifying days for the primary heat episode. If none qualifies, select the best complete window but label “Highest-scoring available window; no three-day qualifying spell,” not “severe heatwave.” Keep the highest-scoring nonoverlapping window per year as optional additional episodes, max five. Do not select on vulnerability alone or choose a visually dramatic hand-made series.

Persist `data/replay/{episode_id}/{manifest,forecast,bulletin,meta}.json` and reusable geometry/feature references. Include five displayed days, two preceding days, and following-morning context in underlying inputs. Record `is_simulation=true`, `mode=replay`, dates, source model, retrieval time, and exact selection metric. Do not stamp the historical model valid time as the current live issue time; separate replay artifact generation and historical data period.

### K.2 Replay and comparison behaviour

Use the same selectors/engine for live and replay. Keep `SIMULATION — replay of {dates}. Not a live forecast.` visible on every screen. Default playback to paused and first episode day; offer jump-to-peak based on computed maximum risk/UTCI. Advance one hour every 1000ms at 1× and every 500ms at 2×; no animation guarantee of real elapsed weather. Pause when focus leaves playback controls for complex interactions, browser tab hides, route changes, or reduced motion is on.

Store replay mode/episode/time in URL; preserve it when opening a ward, authority draft, Methods, or share. Exit returns to the latest live snapshot without retaining simulated values in live caches. Compare today vs replay by relative day index D0..D4, explicitly displaying their different calendar dates and source kind; do not imply simultaneous weather.

For what-if, apply the validated F.5 transforms and show baseline/source date, deltas, clamp counts, and the limitation that independent perturbations are not physically coherent new NWP runs. Weight sensitivity is also a scenario. Keep all simulation alert delivery in Exercise/test allowlist mode and leave ordinary subscriber lists untouched.

### K.3 Three-minute guided demo

Implement an optional “Demo script” overlay, hidden by default in the authority workspace and enabled explicitly by presenter control. Do not auto-launch it for ordinary public users. Provide Next/Back/Exit, text-equivalent steps, and keyboard focus without obscuring the data being described.

| Time | Step | Required evidence |
|---|---|---|
| 0:00–0:25 | Open Overview on live November data, then choose real replay. | Benign live data is allowed; banner and historical dates are obvious. |
| 0:25–0:45 | Jump to the computed peak day/hour. | Actual ranking and headline counts update together. |
| 0:45–1:10 | Open worst ward and “Why this level.” | Show UTCI, modifiers, hazard separately from vulnerability/risk, with vintage/proxy flags. |
| 1:10–1:30 | Toggle Risk/Hazard and default/equal vulnerability weights. | Demonstrate actual computed changes, including no change if the data produces none. |
| 1:30–2:20 | Draft an Exercise alert, use independent preconfigured approver, view CAP/Telegram/SMS simulator, send only allowed test recipient if configured. | Audit/revision/status and real provider acknowledgement or explicit unavailable/simulated status. |
| 2:20–2:45 | Open Methods validation. | Real metrics and baseline comparison, or honest “ML not trained” and deterministic rule-test evidence. |
| 2:45–3:00 | Disconnect API/tiles in prepared demo environment. | Static data and fallback geometry remain usable with offline/degraded labels. |

Do not script successful delivery if no provider is configured. Let the overlay explain the missing integration and keep previews functional. Do not create fabricated metrics to satisfy the final demo step.

### K.4 Pre-demo README checklist

- Confirm selected boundary year, actual ward count, join completeness, all proxy/vintage chips, and source attribution.
- Rebuild a current live snapshot and inspect issue/source/model-run ages; verify no unknown required indices.
- Generate and validate the real replay manifest and peak selection; cache its small artifacts legally.
- Wake Supabase if paused and check current authority membership for officer and independent approver.
- Warm FastAPI, verify `/health` readiness and what-if, and check its cold-start message once.
- Confirm Telegram bot username/token/webhook; press Start in the consented test chat; test a labelled test message.
- Confirm `DELIVERY_MODE=test`, recipient allowlist, no ordinary-user simulation delivery, and SMS simulator label.
- Cache permitted tiles/style or verify blank-basemap polygon fallback; test API down, tiles down, stale, and offline states.
- Validate CAP XML against XSD, source CRS→CAP coordinate order, XML escaping, and visible Exercise status.
- Verify 360px and 1280px flows, keyboard path, contrast, native review flags, and language fonts.
- Confirm deployment URL, source/data git SHAs, fallback artifact, no secrets, and reports with actual pass/fail status.

## L. Test plan and reference vectors

### L.1 Evidence and test organization

Use pytest for shared physics/rules/API, Vitest for frontend transforms/state, Playwright for end-to-end workflows, axe-core for serious accessibility errors, and Lighthouse CI for budgets. Test behaviours and scientific boundaries, not snapshots that merely mirror implementation. Do not loosen assertions until green without a documented scientific reason.

Store every external reference fixture with `{source_url,source_version,retrieved_at,inputs,input_units,expected,expected_units,tolerance,rounding,notes}`. Keep generated formula fixtures labelled “derived test vector,” distinct from published observations. Keep synthetic IDs/data under `data/fixtures/` and make production publication reject their quality flag. Do not use unit tests as fabricated model validation metrics.

### L.2 Published thermal reference checks

Use these primary-source vectors and verify the current source text before copying them into fixtures:

| Index | Inputs | Expected | Acceptance/source |
|---|---|---|---|
| NWS Heat Index | T=100 °F; RH=55% | 124 °F on the published whole-degree chart | Within 1.5 °F of the chart after documented rounding; regression exactness tests use independently computed unrounded coefficients. [NWS example](https://www.weather.gov/ama/heatindex) |
| Outdoor WBGT algebra | Natural wet-bulb 24 °C; globe 42 °C; dry-bulb 40 °C | 29.2 °C | Absolute tolerance 1e-9 for formula arithmetic, using source's inputs. [CCOHS worked example](https://www.ccohs.ca/oshanswers/phys_agents/heat/heat_control.html) |
| WBGT weighted mean | .5h at25 °C, 1h at27 °C, .5h at28 °C | 26.75 °C, derived from published inputs | Test `sum(t*T)/sum(t)` to 1e-9; label output as independently calculated, not a quoted observation. [CCOHS example inputs](https://www.ccohs.ca/oshanswers/phys_agents/heat/heat_control.html) |
| UTCI | Acquire documented published UTCI reference-table/test inputs | Freeze exact source values after retrieval | Do not invent a reference number. Add >=10 valid points covering heat classes plus invalid-domain cases from official UTCI/library reference data before thermal acceptance. [UTCI method](https://thermofeel.readthedocs.io/en/2.3.0/guide/utci/) |

Cross-check thermofeel UTCI against pythermalcomfort on at least 100 fixed valid combinations with the same air/MRT/RH/v10, units, domain policy, and rounding disabled. Require <=.2 °C absolute difference initially; investigate every exceedance and document verified method differences rather than increasing tolerance globally. Test Celsius↔Kelvin and hPa↔kPa paths independently. [pythermalcomfort model documentation](https://pythermalcomfort.readthedocs.io/en/latest/documentation/models.html)

For WBGT, compare identical natural-wet-bulb/globe/dry-bulb components when possible. Do not demand equality between different wet-bulb/globe estimation algorithms; document component uncertainty separately and require <=.2 °C only for equivalent implementations. Obtain published method-specific MRT/solar geometry reference vectors, not an array produced by the same function under test.

Test night, zero shortwave, high/low humidity, radiation missing, very low wind, invalid UTCI domain, all-null daily series, and Kelvin-looking outputs. Preserve original and adjusted winds if the official UTCI approximation clamps to a domain minimum; flag it, never silently reinterpret wind. Verify no NaN/infinity reaches JSON.

### L.3 Deterministic rule vectors

Use these **synthetic rule fixtures**, never public weather claims. Build complete valid inputs for each modifier, rather than bypassing it with a hard-coded output:

| Test | Expected |
|---|---|
| UTCI peaks 25.9,26,26.0001,32,32.0001,38,38.0001,46,46.0001 | Base 0,0,1,1,2,2,3,3,4 using C.2's explicit convention. |
| Base2; two complete nights strictly above own thresholds; no persistence | Hazard3 with `NIGHT_RELIEF_2`. |
| Base2; one night equal to threshold | No night bonus. |
| Base2 sequence [2,2,2]; nights below threshold | Hazard3 on third day. |
| Sequence [2,1,2] | No persistence bonus. |
| Base3 plus both bonuses | Hazard4, cap applied and both drivers retained. |
| Base0 plus two warm relative nights | Hazard0 due to the explicit C.3 safeguard. |
| Missing prior night | Unknown modifier warning; live send blocked; no fabricated zero input. |
| Hazard1, top quintile true | Risk1. |
| Hazard2, top quintile true | Risk3. |
| Hazard3, top quintile false | Risk3. |
| Hazard4, top quintile true | Risk4. |
| Missing V, hazard2 | Risk2, `hazard_only`, allocation priority null. |
| Hazard3, V=.84 | Priority69.0; do not conflate with a probability. |
| All V values equal | No top-quintile bump; show no variation. |
| Tied ranks, changed input row order | Same percentiles, top-quintile set, and deterministic display tie ordering. |

Test IMD plains boundaries explicitly, with departures computed from exact synthetic normals and without premature rounding:

| Tmax °C | Departure °C | Expected |
|---|---|---|
| 39.999 | 8 | no |
| 40 | 4.499 | no |
| 40 | 4.5 | heat_wave |
| 42 | 6.4 | heat_wave |
| 42 | 6.4001 | severe_heat_wave |
| 44.999 | 0 | no |
| 45 | 0 | heat_wave |
| 46.999 | 0 | heat_wave |
| 47 | 0 | severe_heat_wave |
| 45 | normal missing | heat_wave via absolute criterion |
| 41 | normal missing | unknown_departure |

Test optional hills/coastal separately after verifying their official definitions; do not assume the plains formula fully generalizes. Keep the indicative disclaimer present for every badge including “No.”

### L.4 Data, security, API, and channel tests

- Validate Pydantic/JSON schemas, array lengths, chronological unique timestamps, correct IST local days/nights, complete 120 display hours per ward, context coverage, null policy, units, valid CRS, polygon validity, and coordinate order.
- Require 100% ward-ID joins for included features, forecasts, daily records, and geometry; report and block incomplete publication. Verify area crosswalk weights, preserved source population totals, no double counting of overlapping polygons, and legitimate demographic ranges.
- Verify manifest hashes, schema/method/boundary versions, count totals, risk>=hazard, no fabricated model run, fixture rejection, deterministic reruns, and invalid new release rollback.
- Apply migrations from empty Postgres/PostGIS. Run DB advisors and tests for public reads, protected tables, anonymous/staff isolation, role removal, self-approval rejection, immutable audits, and absence of unauthorized writes.
- Test JWT expiry/wrong audience/wrong issuer/forged signature, user_metadata role forgery, missing current membership, and browser bundle secret scanning.
- Test 409 stale revision, double approval/send, expired alert, live stale-snapshot block, Exercise-only simulation previews, immutable approved digest, atomic audit insertion, and outbox retry/unknown acceptance.
- Validate CAP against XSD, escaping, multilingual blocks, source IDs, polygon closure, lon/lat→lat/lon conversion, MultiPolygon handling, timestamps/status/scope, and no Actual emissions.
- Mock Telegram success/429/timeout/403; test validated webhook, duplicate updates, Start required, stop deletion, consent confirmation, endpoint encryption, no raw handle logs, and subscriber deletion before queued delivery.
- Test registration rate limits, deletion-token authorization, idempotent deletion, pending expiry, all-ward `/stop`, and no ability to enumerate subscriptions by UUID.
- Test what-if bounds, zero deltas reproducing baseline to <=1e-6 numerical tolerance, dew-point consistency, context recomputation, humidity clamp counts, stale response cancellation, scenario-only storage, and persistent simulation flags.

### L.5 ML checks — P1

Require chronological split manifest, available-at cutoff checks, five-day purge gap, no ward copies across time folds, independent calibration/test sets, no future reanalysis features, reproducible seed, class support, actual metrics and baseline on identical records, reliability plot, and per-lead evaluation. Bootstrap uncertainty by contiguous time blocks rather than treating every ward-hour as independent. Verify probability sum≈1, nonnegative probabilities, and p_ge_3 in [0,1].

Review SHAP features for leakage and plain-language mapping. Expect physical direction only in controlled synthetic comparisons where the model/metric supports that assumption; do not assert UTCI/WBGT or model SHAP is globally monotonic under all humidity/wind/radiation combinations. If ML fails the predeclared comparison, test that baseline remains primary and the Methods message says so.

### L.6 End-to-end, visual, accessibility, and resilience

Run Playwright at 360×800, 768×1024, 1280×800, and 1920×1080. Require the complete public demo path at 360 and authority path at 1280, with smoke coverage at 768/1920. Use prepared officer/approver test identities, not real users or unsolicited messages. Disable external sending in automated tests.

Cover: load snapshot → change day/hour → list/map selection → deep-link refresh → read why-level → change layers → real replay → what-if → persistent banner → authority draft → independent approve → simulated delivery → CAP download → Methods → exit simulation → subscribe confirmation/deletion with mocked channels. Verify no synthetic fixture in a published live artifact.

Assert zero critical/serious axe violations, readable 200% text, no horizontal document overflow at 360, all actionable targets >=44px, visible focus, no traps, exact dialog focus return, controls accessible by name, and reduced-motion behaviour. Perform manual screen-reader checks with NVDA or an available equivalent and record exactly what was tested; automation alone does not certify WCAG.

Capture regression screenshots for Overview, detail, authority, all five legend patterns, unavailable state, Devanagari, stale/offline/simulation banners, and print bulletin. Use stable real replay fixtures for visual consistency with sensitive data absent. Check clipping, direct labels, map attribution, legend/title consistency, and typography.

Run Lighthouse budgets in J on a production build. Block API and tile domains separately; inject forecast 429, missing radiation, corrupt manifest, bad checksum, interrupted publication, database pause, model-run null, and >6h age. Require useful fallback or honest no-data state in every case. Store reports under `reports/`, with command, environment, actual status, skipped reason, and remaining issue; do not record unexecuted tests as passed.

## M. Build order by priority and definition of done

### M.1 P0 — demo-complete core

Build vertically in this order, integrating a usable screen with real data as early as possible:

1. **Foundation:** create the monorepo, pinned environment, schema contracts, token CSS, exact fonts/logo, routing, source/assumption register, and honest fixture mode for development only.
2. **Geography and vulnerability:** acquire real licensed ward geometry and centroids, label boundary year, establish census/feature crosswalks, compute the complete-cohort vulnerability index, and show omissions/proxies/vintage.
3. **Weather and physics:** implement verified server-side Open-Meteo fetch, unit normalization, radiation-method gate, thermofeel indices, independent reference checks, climatology, daily hazard/IMD/risk/priority, and provenance.
4. **Publication:** write deterministic immutable static snapshots, validate joins/hashes/sizes, promote last, retain rollback, and expose delayed-data/unavailable states.
5. **Public decision flow:** implement Overview map/list/real counts/bulletin/editorial headline, time scrubber, five-day heat ribbon, deep-link ward details, fired rules, candidate refuges, and actions from verified source templates.
6. **Authority and alerts:** implement compact ward table, action queue, minimum Supabase Auth/membership/RLS, immutable revisions, independent approval, audit, CAP XML download, Telegram test adapter, and SMS simulator. Keep providers unconfigured honestly when secrets are unavailable.
7. **November demo:** generate a real ERA5 replay from the declared selection script, add persistent simulation and peak scrubbing, build API what-if with consistent computation, and wire the guided path and comparison.
8. **Trust and deployment:** finish Methods & Data, source licences, assumptions/deck changes, error/stale/offline-degraded states, README/pre-demo instructions, Cloudflare Pages deployment, three-hourly Actions pipeline, health-check workflow, and CI evidence.

Mark P0 done only when all of the following are true:

- A new developer can clone the repository, install from locks, configure `.env.example`, generate/validate data, start web/API, and follow README without private conversation context.
- All real geometry IDs and included feature joins are complete; boundaries and demographics show their actual years; no hard-coded ward count exists.
- Forecast indices are computed with verified units/radiation methods and labelled approximations; core reference/rule/boundary tests pass.
- At least one algorithmically selected real historical episode loads through the same calculation/selector path as live and is plainly a simulation.
- Overview, ward detail, authority table, actions, what-if, and Methods work with actual validated data, not fake dashboard values.
- Alert draft/approve/send-test permissions, audit, frozen content, CAP XSD, Telegram consent/test evidence or explicit unavailable status, and SMS preview are implemented. An unconfigured Telegram delivery is an openly recorded incomplete P0 integration, not a pass.
- Static views remain usable with the API unavailable; polygons remain with tiles blocked; last-good/stale/corrupt/no-data paths are verified.
- Applicable J/L budgets and accessibility checks pass for P0 features; the offline PWA criterion remains explicitly P1, with P0's narrower fallback claim recorded.
- The deployed static URL is actually tested, scheduled publication runs successfully, and reports contain real outcomes. If account/network constraints prevent deployment, report that deliverable as blocked with prepared deploy artifacts; do not fabricate a URL or claim complete P0.
- All O checklist items pass or have explicit justified limitations that prevent calling the affected feature complete.

### M.2 P1 — scientific depth and broader access

Add chronological forecast-post-processing ML with held-out calibration, real baseline comparison, SHAP explanations, and optional quantile temperature bands. Use MAPIE or a verified quantile model only with correct time-series calibration and explicit interval coverage evaluation; do not invent uncertainty bands. Add ensemble likelihood, Hindi/Marathi UI and reviewed safety templates, PWA/service-worker offline and Web Push, Outdoor Worker view, System status, expanded Supabase Auth/roles/RLS administration and tests, and printable PDF bulletin.

Mark P1 done feature by feature only after:

- Genuine issued-forecast archives support the claimed lead times, ML metrics/splits are reproducible, and the configured baseline/model selection rule is enforced.
- Calibrated probabilities and ensemble likelihood are distinguished, SHAP drivers have faithful labels, and unsupported classes/interval coverage limitations are visible.
- hi/mr placeholder/layout tests pass; native review is evidenced before external safety delivery, otherwise show pending review and retain that acceptance item incomplete.
- The installed PWA opens offline with the last verified snapshot and correct banners; private data is excluded from caches; Push opt-in/unsubscribe is tested.
- Worker screening/work:rest guidance follows a verified usable source with applicable conditions. If only screening is defensible, report numeric work:rest as incomplete, not a fabricated feature.
- Authority provisioning, revoked role/session handling, RLS tests, status checks, and A4 print output pass their specific acceptance criteria.
- The full relevant J/L suite and O checklist pass for each shipped P1 feature.

### M.3 P2 — polish and expansion

Add precomputed Landsat LST exposure adjustment only after validating how it affects air-temperature/thermal-risk estimates; keep raw LST and adjustment separate. Add optional control-room dark theme, self-hosted Protomaps PMTiles, email digests on a verified permanent free tier, and additional cities through configuration.

For dark mode start from `--paper-0:#0F1412`, `--paper-1:#171E1B`, `--rule:#2A332F`, `--ink-0:#E8E6DD`; derive the remaining tokens and hazard lightness deliberately, retest contrast/patterns, and never merely invert colours. Retain the light default. Document self-hosted tile build/storage limits and glyph/attribution licences. Avoid map-load billing services.

Mark P2 done only when the added feature has source/assumption documentation, no hidden paid dependency, applicable scientific validation/security checks, responsive visual verification, and the full affected J/L/O acceptance. Keep incomplete P1 requirements visible rather than burying them under polish.

### M.4 Required repository and handoff deliverables

Produce the working monorepo, README setup/troubleshooting/pre-demo checklist, `docs/methods.md`, generated versioned Methods JSON, `.env.example`, source manifests, migrations and seed scripts, seed-data generation commands, exact lockfiles, OpenAPI document/typed client, pipeline/keep-alive/CI/deploy workflows, replay artifacts, deployed static URL if actually deployed, reports, and `DECISIONS.md` recording every assumption/deviation.

Include `docs/verification-register.md`, `docs/data-sources.md`, `docs/dependencies.md`, `docs/privacy.md`, `docs/security.md`, and `THIRD_PARTY_NOTICES.md`. Document restore/rollback, forecast refresh, bot consent, staff provisioning, cleanup, and how to reproduce the demo without live API availability.

Finish the coding-agent handoff with: what works, what was tested and results, actual URL/versions, unresolved items with impact, source/credential prerequisites, and exact commands to continue. Never claim a tier is fully achieved merely because its UI renders.

## N. Attribution, licensing, and official reference catalogue

### N.1 Attribution requirements

Show a concise footer attribution on every public data/map page, with detailed source, licence, vintage, and method notices on Methods. Keep map-provider attribution visible even under a bottom sheet. Preserve licences and required notices in source distributions and static data exports.

| Asset/source | Required treatment |
|---|---|
| Open-Meteo weather | Credit Open-Meteo.com with a direct link, CC BY 4.0, model/source information, and changes/computation notice. Keep API access terms separate from the data licence; free API access is noncommercial under the checked terms. |
| ERA5/ERA5-Land | Include the current required Copernicus/C3S acknowledgement and disclaimer, dataset title/DOI/version where available, and a notice that HeatGuard calculations modify/derive the source data. VERIFY exact standard wording rather than paraphrasing a mandatory notice. |
| Basemap | Credit OpenFreeMap and © OpenStreetMap contributors, link OSM copyright/ODbL, preserve any additional style/glyph attribution. |
| Ward boundaries | Identify DataMeet/PMC source, exact boundary year, electoral/admin definition, source licence, transformations, and crosswalk. VERIFY DataMeet's actual licence before redistribution. |
| Census/slum data | Credit Census of India and actual OpenCity dataset publisher; show 2011 where applicable and verify dataset-level licence. Do not treat “open” as public-domain proof. |
| WorldPop / ESA / Landsat / GEE | Add only if used; record exact dataset/version/licence, processing date and proxy status. Check Earth Engine eligibility and exported-data terms separately. |
| thermofeel | Preserve Apache-2.0 notice; cite Brimicombe et al., 2022, SoftwareX, with bibliographic details verified from its repository/paper. |
| pythermalcomfort | Preserve verified MIT notice; cite Tartarini & Schiavon, 2020, with checked publication details. |
| MapLibre GL JS | Preserve BSD-3-Clause notice and dependency notices for the resolved version. |
| Fonts | Preserve each actual SIL OFL or applicable font licence; credit Newsreader, Atkinson Hyperlegible Next/fallback, Noto Devanagari, and any numeric font actually shipped. |
| Other libraries | Generate an inventory from lockfiles, check licence compatibility, include notices for React/Vite/FastAPI/Plot/D3/Radix/ML/geo libraries actually included. |
| Methods/actions | Cite IMD, NDMA, UTCI/WBGT references, NWS Heat Index, and HeatRisk conceptual precedent. Separate imported standard thresholds from HeatGuard analyst rules. |
| CAP | Cite OASIS CAP 1.2; preserve applicable specification notices when redistributing the schema or excerpts. Do not imply certification or national-system access. |

Use a footer such as **“Weather: Open-Meteo · Reanalysis: Copernicus C3S · Map: OpenFreeMap / © OpenStreetMap contributors · Ward boundaries: {source}, {year} · Methods & licences”**, rendering only sources actually used and linking each label. Include the correct detailed notices in Methods/exports, not just this abbreviated example.

### N.2 Official source links and verification status

Use the following primary-source entry points. Treat links marked **recheck** as pointers to consult, not already verified evidence of a particular limit, signature, or licence. Recheck all of them at implementation time even if researched for this prompt. Record redirects or inaccessible URLs and substitute current official pages, not third-party blog summaries.

| Reference | Official URL | Handoff status |
|---|---|---|
| Open-Meteo forecast parameters | https://open-meteo.com/en/docs | Research consulted; reverify chosen model/variables. |
| Open-Meteo terms/access limits | https://open-meteo.com/en/terms | Research consulted 2026-11-07; mutable. |
| Open-Meteo reanalysis | https://open-meteo.com/en/docs/historical-weather-api | Recheck coverage, model and radiation fields. |
| Historical Forecast distinction | https://open-meteo.com/en/docs/historical-forecast-api | Research consulted; explicitly differentiates stitched series and individual runs. |
| Single/Previous Runs | Follow official links from the historical-forecast page | Recheck exact endpoints/init selectors; do not guess. |
| Ensemble API | https://open-meteo.com/en/docs/ensemble-api | Recheck models, member count, variables and limits. |
| thermofeel source/releases | https://github.com/ecmwf/thermofeel | Research consulted; verify installed release and notice. |
| thermofeel UTCI/method | https://thermofeel.readthedocs.io/en/2.3.0/guide/utci/ | Research consulted; match installed version. |
| thermofeel MRT inputs | https://thermofeel.readthedocs.io/en/2.1.5/guide/mrt.html | Research consulted; older version, reverify current API. |
| pythermalcomfort | https://pythermalcomfort.readthedocs.io/en/latest/documentation/models.html | Research consulted; latest URL is mutable. |
| UTCI operational procedure | https://doi.org/10.1007/s00484-011-0454-1 | Primary paper linked by thermofeel; retrieve and verify before using reference vectors. |
| MRT method | https://doi.org/10.1007/s00484-020-01900-5 | Primary paper linked by thermofeel; retrieve for estimator/method evidence. |
| NWS Heat Index chart/equation | https://www.weather.gov/ama/heatindex | Research consulted; chart vector included in L. |
| NWS full Heat Index regression | https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml | Fetch was blocked during prompt research; verify official equation/adjustments before coding. |
| NWS HeatRisk conceptual precedent | https://www.wpc.ncep.noaa.gov/heatrisk/ | Recheck; do not claim equivalence or import unseen health thresholds. |
| IMD Heat Wave FAQ | https://mausam.imd.gov.in/pdfs/heatcolduser/FAQ_heat_wave.pdf | Research consulted; verify full declaration/coastal details. |
| IMD Heat Wave Warning Services | https://mausam.imd.gov.in/imd_latest/contents/pdf/pubbrochures/Heat%20Wave%20Warning%20Services.pdf | Research consulted for terrain gates and thresholds. |
| NDMA heat-wave guidance | https://nidm.gov.in/PDF/pubs/NDMA/27.pdf | Research consulted for action types; verify edition/page and current guidance. |
| Maharashtra heat action plan | https://sdma.maharashtra.gov.in/en/heat-wave-action-plan/ | Official context consulted; recheck applicability. |
| ETCCDI climate indices | https://etccdi.pacificclimate.org/list_27_indices.shtml | Research consulted for percentile-night precedent; product adaptation is explicit. |
| OSHA workload screening | https://www.osha.gov/heat-exposure/hazards | Research consulted; not a complete work:rest prescription. |
| CCOHS WBGT/limits | https://www.ccohs.ca/oshanswers/phys_agents/heat/heat_control.html | Research consulted; screening/non-prescriptive limitation must be respected. |
| CAP 1.2 spec and XSD | https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html | Research consulted; retrieve linked XSD and validate generated XML. |
| India CAP/SACHET integration | https://sachet.ndma.gov.in/ | Recheck official architecture; no operational connection implied. |
| DataMeet municipal geometry | https://github.com/datameet/Municipal_Spatial_Data | Recheck exact Pune dataset path, vintage, licence and PMC alignment. |
| OpenCity dataset catalogue | https://data.opencity.in/ | Recheck exact Pune census/slum datasets and individual licences. |
| Census official source | https://censusindia.gov.in/ | Recheck source tables and age/worker-category availability. |
| OSM licence/attribution | https://www.openstreetmap.org/copyright | Recheck terms and attribution wording. |
| Overpass tags/query documentation | https://wiki.openstreetmap.org/wiki/Overpass_API | Community-maintained project docs; recheck instance policy. |
| WorldPop | https://www.worldpop.org/ | Recheck dataset version/licence and gridded proxy qualifications. |
| ESA WorldCover | https://esa-worldcover.org/ | Recheck year, class codes, resolution, licence. |
| Earth Engine noncommercial rules | https://developers.google.com/earth-engine/guides/access | Recheck eligibility, registration and no-card path before optional use. |
| OpenFreeMap | https://openfreemap.org/ | Recheck tile styles, service terms, limits and caching. |
| Cloudflare Pages limits | https://developers.cloudflare.com/pages/platform/limits/ | Recheck all build/deploy/file limits and no-card path. |
| GitHub scheduled workflows | https://docs.github.com/en/actions | Recheck public-repo quota, schedule delay/inactivity rules, token permissions. |
| Render free instances | https://render.com/docs/free | Recheck current sleep/quota/no-card requirements; alternatives need their own official verification. |
| Supabase pricing | https://supabase.com/pricing | Research consulted; free quotas and pause policy mutable. |
| Supabase RLS | https://supabase.com/docs/guides/database/postgres/row-level-security | Research consulted; verify grants/exposed schemas as well as policies. |
| Supabase changelog | https://supabase.com/changelog.md | Research fetched through HTTP after web reader could not parse Markdown. Check relevant breaking changes. |
| Supabase CLI v3 | https://supabase.com/changelog/supabase-cli-v3 | Research consulted; verify pinned CLI flags/targeting via --help. |
| Telegram Bot API | https://core.telegram.org/bots/api | Recheck Start requirement, webhook secret and rate-limit handling. |
| Web Push | https://developer.mozilla.org/en-US/docs/Web/API/Push_API | Platform documentation; recheck supported browsers/permission behaviour and primary standards where needed. |
| Resend | https://resend.com/pricing | Recheck free daily/monthly quotas, verified sender/domain and no-card availability before enabling. |
| Google Fonts source/licences | https://github.com/google/fonts | Recheck each actual font's licence/axes; inspect @fontsource packages independently. |

Do not copy the original approximate free-tier figures into a factual marketing claim. Keep current verified facts in the register, preserve the free/self-hostable requirement, and document if an originally proposed provider no longer qualifies. Prefer self-hosting or an honest unavailable adapter over a paid upgrade.

## O. Final self-review against generic generated-interface tells

Run this checklist after implementation and after every significant visual change. Capture evidence in `reports/final-review.md`; include viewport screenshots, source/config references, and actual test results. Treat every item as pass/fail with a concrete fix for failures.

- [ ] No purple/indigo/blue-violet gradient, gradient text, glassmorphism/blur card, neon glow, or default dark-blue/purple-accent aesthetic exists. Preserve the required Level 4 magenta only for semantic risk.
- [ ] No stock shadcn styling, Tailwind default blue `#3B82F6`/`#6366F1`, or default Tailwind gray substitutes the defined palette. Headless primitives have custom visuals and complete interaction states.
- [ ] No Inter/Roboto/Arial/system-ui/Poppins/Space Grotesk design font, large rounded card style, or soft card shadows exists. Use the exact typography, 2px surfaces, 3px buttons, and one overlay shadow.
- [ ] No emoji, emoji-as-icon, generic “Empower/Revolutionize” hero, fake sponsor logo, testimonial, or invented impact/accuracy/user figure appears.
- [ ] No grid of three identical icon cards replaces decision-led information. Keep the asymmetric bulletin/list/map/context composition.
- [ ] No lorem ipsum, “John Doe,” invented ward/demo demographics, plausible-looking unlabelled sample data, fixed ward total, or fake historical event appears in a live artifact. Use true computed data or explicit simulation/fixture labels.
- [ ] No decorative sun, thermometer, mascot, photograph hero, 3D blob, or ornamental illustration appears. Supply the ward-polygon/isotherm SVG identity.
- [ ] No rainbow chart or decorative colour appears. Use only the specified hazard/vulnerability ramps and verdigris interaction colour; all levels have numeral/name/pattern cues.
- [ ] No LLM-written advice, generative safety text, or chatbot enters the safety path. All actions resolve to versioned reviewed templates and source sections.
- [ ] No blank-page loading spinner exists. Every data view implements matched loading skeletons, meaningful empty/error states, visible stale and offline behaviour, and honest unknown data.
- [ ] No horizontal document overflow exists at 360px; no visible text is below 12px; no actionable target is below 44px; keyboard/200% text/reduced-motion paths work.
- [ ] No proxy, missing cohort component, crosswalk assumption, old census vintage, radiation estimator, unknown model run, or simulation is hidden. Keep methodology and source chips one interaction away.
- [ ] Hazard, vulnerability, risk, and priority have separate labels and values. “Why this level” reproduces the exact fired rules from the selected snapshot/method version.
- [ ] Replay/what-if banners survive routing, exports, CAP, shared images/text, alert previews, and reloads. Exiting simulation restores live data without contaminating caches or subscribers.
- [ ] NWP/physics/ML claims are honest; no outcome data or model skill is invented; untrained/underperforming ML is explicitly disclosed and baseline remains available.
- [ ] Authority delivery requires current authorization, independent approval, exact revision/digest, valid snapshot, consented recipient, and a test allowlist. SMS/WhatsApp remain labelled preview adapters.
- [ ] Provider quotas/eligibility/licences were checked; no paid service/card/trial is required; no cron claims to guarantee host availability or evade provider terms.
- [ ] Footer/map/data/font/library notices are present; boundary vintage and actual ward count are correct; no official PMC/IMD affiliation or operational CAP connection is implied.
- [ ] The complete three-minute demo, source-data reproducibility, graceful failure cases, deployment URL, and reports are tested. Record remaining incomplete requirements plainly and do not label a tier done until its acceptance passes.

Build the P0 slice first, verify it end to end, and continue into P1/P2 only while preserving its reproducibility, honesty, accessibility, and distinctive Daily Bulletin design.
