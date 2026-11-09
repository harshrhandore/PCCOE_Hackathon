# Local production performance evidence - 9 November 2026 IST

## Planner workflow - current result

The final planner build passes all six measured median budgets. Three mobile/4G lab runs recorded performance **100 median (97-100)**, automated accessibility **100**, LCP **0.786 s median (0.785-2.532 s)**, CLS **0 median** (maximum 0.012) and TBT **62 ms median**. One LCP run was slightly above the individual 2.5-second target; median budgets passed. These are shared-Windows-host browser lab measurements, not physical-device or field guarantees. INP remains unmeasured.

| Run | Performance | Automated accessibility | LCP (s) | CLS | TBT (ms) |
| --- | --- | --- | --- | --- | --- |
| 1 | 97 | 100 | 2.532 | 0.012047 | 90.5 |
| 2 | 100 | 100 | 0.785 | 0.000000 | 62.0 |
| 3 | 100 | 100 | 0.786 | 0.000000 | 29.5 |

Initial JavaScript: **123,849 transferred bytes**; fonts **48,834 bytes**; total **217,626 bytes**. The forecast budget conservatively counts the entire **34,108-byte HTML document**, which includes forecast, registry, methods and markup. It does not report the embedded forecast as zero transferred bytes.

The local server includes only the three public planning files in a non-executable JSON block, checking their original SHA-256 hashes and escaping markup. The browser rechecks the same original bytes before using them, then runs normal schema/version/ward-join validation. It consumes this initial block once; later refreshes use the ordinary fresh-manifest and checked-fetch path. Prepared replay is selected server-side without substituting live data for invalid episodes. Private paths, mismatched filenames and altered files are excluded. Critical asset hints begin font/style/module downloads while the embedded data arrives. Unicode-ranged font styles prevent inappropriate fallback downloads; preview-language resources, source dialogs and hourly details load on demand.

Map geometry and the ranked list render when viewed or keyboard-focused. The initial selector retains all 58 validated wards; browser checks explicitly load all 58 list rows and SVG features, inspect hourly data and test source-dialog Escape/focus restoration. The loaded view passes serious/critical axe assertions, and a separate initial deferred-state check reported no selected-WCAG-tag violations. Initial automated scores do not certify every interaction or manual accessibility requirement.

The first planner audit failed at **65 median**, LCP **4.091 s median** and **410,278 transferred bytes**; `planner-before-summary.json` and `planner-before-1.json` preserve that checkpoint. Other development runs showed cold-load variance, leading to the first-response data/asset changes. Final `preload-1.json` through `preload-3.json` and summary.json retain every final measurement and budget comparison. The earlier stale build often measured a warning banner as LCP; it is not an equivalent measure of current planning-content readiness. No weather inputs, thresholds, coverage checks or simulation labels were changed to improve a score.

Local interaction sample: one-ward what-if **185-1,080 ms** (three distinct inputs; median **186 ms**), all-ward **1,264 ms** (one input, 290 daily rows). The first sample may include initial calculation/cache setup. This is a small running-server sample, not a guaranteed cold-start or field result. At 360×800, the review action is at **544 px** and the preview draft action at **593 px**, versus the reviewed draft action's previous **4,320 px**. `../planning-interaction-check.json` records raw timings and the matching HTML hash. A separate deliberate-503 transport check confirms failed computation removes the previous comparison instead of presenting it as current.

## Earlier startup-hint result

The latest three runs pass all six **median** budgets. Production localhost, Lighthouse 13.6.0, Playwright Chromium, default mobile/4G simulation, 412x823 viewport and 4x CPU slowdown. Exact settings, individual runs, budget comparisons and build/server hashes are in summary.json; raw reports are preload-1.json, preload-2.json and preload-3.json.

| Run | Performance | Automated accessibility | LCP (s) | CLS | TBT (ms) |
| --- | --- | --- | --- | --- | --- |
| 1 | 96 | 100 | 0.766 | 0.000094 | 225 |
| 2 | 87 | 100 | 3.458 | 0.060254 | 231 |
| 3 | 97 | 100 | 0.766 | 0.000094 | 207 |

Median performance **96**, range **87-97**; automated accessibility **100**; median LCP **0.766 s**, range **0.766-3.458 s**; median CLS **0.000094**. One run exceeded the individual 2.5-second LCP target. This is a measured lab result with visible variability, not a physical-device or field guarantee. INP remains unmeasured; TBT is a separate lab metric.

Initial JavaScript transferred **155,239 bytes**, forecast **19,305 bytes**, fonts **139,090 bytes**, boundary geometry **51,338 bytes**, total **405,962 bytes**, including HTTP overhead. Initial MapLibre/chart transfer is zero because they remain lazy; build gzip estimates are about 288 KB for MapLibre and 80 KB for the hourly chart, recorded in reports/build.log. Required ward tables, geometry, warning states and accessibility content remain present.

The HTML starts the manifest and main fonts early. The local server supplies fresh, mode-specific preload hints for forecast, geography registry and methods from the currently selected manifest. These update after data refresh without a frontend rebuild. Browser checks observed one request per resource and all 58 ward rows. Mutable manifests always revalidate; immutable payloads retain long caching. Existing manifest/schema/hash validation remains active. Malformed replay parameters now show an error instead of loading live data as replay.

Run `npm run audit:local` with the app running to reproduce all three measurements and check the six median budgets. CI runs the same command after browser verification. Reports below retain earlier measurements for comparison.

## Earlier checkpoint, before startup hints

Current forecast: 16,309 bytes gzip (300 KB budget passed). Boundaries: 50,532 bytes gzip, reported separately. The local server negotiates gzip; final audits transferred 404,874 bytes total per page load. MapLibre and chart chunks are lazy. Build sizes are in reports/build.log.

Lighthouse 13.6.0 ran against http://127.0.0.1:8081/ using a built React SPA and FastAPI. Default mobile simulation: 412x823 viewport, 4x CPU slowdown, 150 ms RTT and 1638.4 Kbps throughput. Chromium came from the installed Playwright browser. No upload or online hosting was used.

| Run | Performance | Automated accessibility | LCP (s) | CLS | TBT (ms) |
| --- | --- | --- | --- | --- | --- |
| 1 | 69 | 100 | 3.428 | 0.000103 | 1064 |
| 2 | 68 | 100 | 3.729 | 0 | 980 |
| 3 | 70 | 100 | 3.435 | 0.000070 | 991 |

Performance median 69, range 68-70: **85 target not met**. Automated accessibility median 100: numeric 95 target met for this page, with no claim of full WCAG or native review. Median LCP 3.435 s; median TBT 991 ms. INP has not been measured. This is emulation on a shared Windows computer, not real Android field data.

Raw reports: local-1.json, local-2.json, local-3.json in this directory. before-timeline-fix.json preserves the first diagnostic run (performance 45, 25,270 ms TBT). The hourly timeline now indexes timestamps once and reuses formatters. Gzip reduces raw transfer from roughly 1.63 MB to 0.405 MB. Remaining long tasks and load dependencies still require work to meet the performance gate.

Reproduce with CHROME_PATH set to an installed Chromium binary:

```powershell
node node_modules/lighthouse/cli/index.js http://127.0.0.1:8081/ --chrome-flags='--headless=new' --only-categories=performance,accessibility --output=json --output-path=reports/performance/local-repeat.json --quiet
```

Keyboard screen-reader review, 200% text and colour-vision simulations remain incomplete. Browser functional timings are not performance acceptance measurements.
