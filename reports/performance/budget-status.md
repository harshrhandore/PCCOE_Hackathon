# Local production performance evidence - 8 November 2026

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
