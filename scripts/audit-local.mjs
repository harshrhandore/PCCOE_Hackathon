import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const target = new URL(
  process.env.HEATGUARD_TEST_BASE_URL || "http://127.0.0.1:8081/",
);
if (
  !["http:", "https:"].includes(target.protocol) ||
  !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname) ||
  target.pathname !== "/" ||
  target.search ||
  target.username ||
  target.password
)
  throw new Error(
    "The performance runner requires a loopback Overview URL without credentials or query parameters.",
  );
const directory = resolve("reports/performance");
mkdirSync(directory, { recursive: true });
const rows = [];
for (let run = 1; run <= 3; run++) {
  const path = resolve(directory, `preload-${run}.json`);
  const measured = spawnSync(
    process.execPath,
    [
      resolve("node_modules/lighthouse/cli/index.js"),
      target.href,
      "--chrome-flags=--headless=new",
      "--only-categories=performance,accessibility",
      "--output=json",
      `--output-path=${path}`,
      "--quiet",
    ],
    {
      env: {
        ...process.env,
        CHROME_PATH: process.env.CHROME_PATH || chromium.executablePath(),
      },
      encoding: "utf8",
    },
  );
  if (measured.status !== 0)
    throw new Error(`Lighthouse run ${run} failed: ${measured.stderr}`);
  const report = JSON.parse(readFileSync(path, "utf8"));
  if (report.runtimeError)
    throw new Error(`Lighthouse reported ${report.runtimeError.code}`);
  const requests = report.audits["network-requests"].details.items;
  const bytes = (predicate) =>
    requests.filter(predicate).reduce((sum, r) => sum + r.transferSize, 0);
  const isMap = (r) => /\/maplibre-gl-/.test(r.url);
  const isChart = (r) => /\/HourlyChart-/.test(r.url);
  rows.push({
    run,
    measured_at: report.fetchTime,
    performance: report.categories.performance.score * 100,
    accessibility: report.categories.accessibility.score * 100,
    lcp_ms: report.audits["largest-contentful-paint"].numericValue,
    cls: report.audits["cumulative-layout-shift"].numericValue,
    tbt_ms: report.audits["total-blocking-time"].numericValue,
    initial_js_bytes: bytes((r) => /\.js(?:\?|$)/.test(r.url) && !isMap(r)),
    font_bytes: bytes((r) => /\.woff2(?:\?|$)/.test(r.url)),
    maplibre_bytes: bytes(isMap),
    chart_bytes: bytes(isChart),
    geometry_bytes: bytes((r) => /\/wards\.geojson$/.test(r.url)),
    forecast_bytes: bytes((r) => /\/forecast\.json$/.test(r.url)),
    total_bytes: report.audits.diagnostics.details.items[0].totalByteWeight,
  });
  console.log(
    `Run ${run}: performance ${rows.at(-1).performance}, accessibility ${rows.at(-1).accessibility}, LCP ${Math.round(rows.at(-1).lcp_ms)} ms`,
  );
}
const median = (key) => rows.map((r) => r[key]).sort((a, b) => a - b)[1];
const metrics = Object.fromEntries(
  Object.keys(rows[0])
    .filter((k) => !["run", "measured_at"].includes(k))
    .map((key) => [
      key,
      {
        median: median(key),
        min: Math.min(...rows.map((r) => r[key])),
        max: Math.max(...rows.map((r) => r[key])),
      },
    ]),
);
const budgets = [
  ["performance", 85, "min"],
  ["accessibility", 95, "min"],
  ["lcp_ms", 2500, "max"],
  ["cls", 0.1, "max"],
  ["initial_js_bytes", 200000, "max"],
  ["forecast_bytes", 300000, "max"],
].map(([metric, limit, direction]) => ({
  metric,
  limit,
  actual: median(metric),
  passed:
    direction === "min" ? median(metric) >= limit : median(metric) <= limit,
}));
const sha = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
const summary = {
  target: target.href,
  generated_at: new Date().toISOString(),
  settings: JSON.parse(
    readFileSync(resolve(directory, "preload-1.json"), "utf8"),
  ).configSettings,
  html_sha256: sha("dist/index.html"),
  local_server_sha256: sha("services/api/app/web.py"),
  note: "Browser lab mobile/4G simulation, not physical Android field data. Transfer sizes include HTTP overhead. INP is unmeasured; TBT is reported separately.",
  rows,
  metrics,
  budgets,
  inp_ms: null,
  passed: budgets.every((b) => b.passed),
};
writeFileSync(
  resolve(directory, "summary.json"),
  JSON.stringify(summary, null, 2) + "\n",
);
console.log(
  summary.passed
    ? "All measured median performance budgets passed."
    : "Some measured budgets failed; see reports/performance/summary.json.",
);
if (!summary.passed) process.exitCode = 1;
