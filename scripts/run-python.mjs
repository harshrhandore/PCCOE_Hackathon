import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const interpreter = resolve(
  process.platform === "win32"
    ? ".venv/Scripts/python.exe"
    : ".venv/bin/python",
);
if (!existsSync(interpreter)) {
  console.error("Missing .venv. Run uv sync --frozen first.");
  process.exit(1);
}
const result = spawnSync(interpreter, process.argv.slice(2), {
  stdio: "inherit",
  env: process.env,
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
