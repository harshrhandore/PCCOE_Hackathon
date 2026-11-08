import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const mode = process.argv[2];
const tools = {
  e2e: ["@playwright/test/cli.js", "test"],
  unit: ["vitest/vitest.mjs", "run", "tests/unit"],
};
if (!(mode in tools)) {
  console.error("Choose e2e or unit.");
  process.exit(1);
}
const [entry, ...args] = tools[mode];
const result = spawnSync(
  process.execPath,
  [resolve("node_modules", entry), ...args, ...process.argv.slice(3)],
  { cwd: resolve("apps/web"), stdio: "inherit", env: process.env },
);
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
