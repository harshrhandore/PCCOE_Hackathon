# HeatGuard pilot and validation protocol

Status: protocol and tools prepared; no participant study, local measurement comparison, forecast skill or health benefit has been established. Blank templates contain no evidence.

## Decision and contribution to test

Primary user: a local heat-action planner working at a local computer. Task: inspect one ward and day, explain its heat-stress classification, identify an applicable sourced action, and export a planning brief with source and uncertainty information. HeatGuard complements official information; it does not issue an official warning or infer population risk from missing demographic inputs.

Heat mapping, heat warnings and municipal cooling tools already exist. The proposed contribution is the inspectable local workflow connecting thermal estimates, night/persistence explanations, historical cases and a shareable brief. Evaluate that contribution against a user's current process rather than claiming first-of-kind prediction.

Comparators: [IMD district warnings and impact-based forecasts](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2287608), [WRI Cool Cities Lab](https://coolcities.wri.org/). These have different scopes; their existence does not establish equivalence or superiority of either workflow.

## Formative user comparison

Recruit 5-8 consenting intended users where feasible, including local planners or people responsible for outdoor-work planning. Students can identify usability problems but cannot substitute for evidence of municipal adoption. Use anonymous participant codes and no health histories or contact details in feedback files. Keep consent records and raw feedback outside Git, under ignored `data/raw/pilot/`.

Use the same prepared historical case and question in both workflows: explain the selected day's classification, identify a sourced action, name an uncertainty, and prepare a brief. The comparison workflow should be the participant's actual process, recorded with its available data and tools. Alternate task order to reduce learning effects. Record task time, completion, critical errors, correctness of explanation and usefulness rating in `docs/templates/pilot-feedback.csv`. Ask what information would change their decision. Do not instruct participants to make real safety decisions from the prototype.

Before collecting results, define success as: completing the task with no critical interpretation error, correctly identifying historical/saved data and uncertainty, and producing a traceable brief. Compare paired times and errors, report all participants and withdrawals, and describe the sample's limitations. A small convenience study supports formative usability findings, not representative adoption or health-effect claims. Do not tune the success definition after seeing results.

## Independent reference agreement

Copy `docs/templates/observations.csv` into ignored `data/raw/pilot/`. Record exact timezone-aware measurement timestamps, the historical ward ID, units, instrument/reference source, exposure/measurement method and permission reference. Supported variables are `air_temperature` (`degC`), `relative_humidity` (`%`) and `reference_wbgt` (`degC`). A reference WBGT needs documented suitable instrumentation and comparable exposure; computed UTCI is not a directly measured thermometer reading. Review calibration, uncertainty, location/grid mismatch, missingness and independence before interpreting agreement.

Run from the repository root:

```powershell
.venv/Scripts/python.exe -m scripts.evaluate_observations --snapshot-id ACTUAL_SNAPSHOT_ID --observations data/raw/pilot/observations.csv --output data/raw/pilot/agreement.json
```

The tool verifies the committed snapshot hashes, requires exact sample instants and units, rejects duplicated or non-finite input, and reports matched/unmatched samples, bias, MAE and RMSE by variable. It does not interpolate references or fill missing measurements. Review shared weather cells before treating pairs as independent. Output retains reference metadata; publish only a reviewed, appropriately licensed summary with no personal information.

These are descriptive agreement metrics. Publication-to-valid-time lead is recorded but is not the weather model's issue lead. Reanalysis replay, historical context hours and mixed/unknown model runs do not establish as-issued forecast skill.

## Forecast and escalation validation

Acquire immutable genuine as-issued forecasts and independent reference observations over multiple heat and non-heat periods. Predeclare event definitions, measurement comparability and chronological train/validation/test boundaries. Freeze thresholds before the held-out period. Compare base UTCI classification with the night/persistence escalation rules; report hit, miss and false-alarm counts plus event prevalence, lead times, missingness and spatial dependence. Do not tune or replace existing published rules to make the demonstration look more varied.

The in-app classification audit reports base/final categories, rule firings and shared cells. It explains today's output; without observations it cannot estimate false alarms. Collect local radiation/site observations before claiming urban thermal precision. Health-outcome validation requires a separate appropriate study and is outside this prototype pilot.

## Accessibility and language review

Record keyboard-only completion, visible focus, 200% text/zoom, screen-reader reading and control names, colour-independent interpretation and touch-target use on an actual phone. Have native Hindi and Marathi reviewers assess terms, units, dates and source-linked action wording. Record the exact strings and build reviewed. Automated accessibility scores do not replace these checks. The interface labels translations as previews and keeps reviewed-source English action text visible.

## Demo and refresh

Use `/presenter` to open the real 26-30 April 2024 reanalysis case, inspect rules and shared-cell coverage, and export a simulation-labelled brief. A historical replay is legitimate when explicitly labelled. For current saved forecasts, run `npm run local:refresh`, validate the result and inspect its actual issue date. Keep stale warnings when a refresh is unavailable. Local-only hosting remains the deployment scope.
