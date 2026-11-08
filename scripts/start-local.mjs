import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const interpreter = resolve(
  process.platform === "win32"
    ? ".venv/Scripts/python.exe"
    : ".venv/bin/python",
);
if (!existsSync(interpreter)) {
  console.error(
    "The Python environment is missing. Run npm ci and uv sync --frozen first.",
  );
  process.exit(1);
}
const result = spawnSync(
  interpreter,
  ["scripts/local.py", ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env },
);
if (result.error)
  console.error(
    "Could not start the local Python process:",
    result.error.message,
  );
process.exit(result.status ?? 1);
