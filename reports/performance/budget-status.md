# Local production performance evidence - 9 November 2026 IST

## Current result

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
