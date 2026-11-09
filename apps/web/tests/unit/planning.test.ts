import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import type { Dataset } from "../../src/data/types";
import { planningBrief, spatialCoverage } from "../../src/lib/planning";

// Real saved weather for export integrity checks. Altered mode metadata below
// is a test fixture only and is never published as weather or validation data.
const read = (path: string) =>
  JSON.parse(readFileSync(`public/data/${path}`, "utf8"));
const manifest = read("latest.json");
const data: Dataset = {
  manifest,
  registry: read(manifest.files["geography.json"].url),
  daily: read(manifest.files["forecast.json"].url).daily,
  methods: read(manifest.files["methods.json"].url),
  diagnostic: false,
};
const ward = data.registry.wards[0],
  row = data.daily.find((r) => r.ward_id === ward.id)!;

describe("source-linked planning exports", () => {
  it("retains snapshot, rule, spatial and missing-population limits in stale exports", () => {
    const text = planningBrief(
      data,
      ward,
      row,
      ["Synthetic instruction for export transport test."],
      Date.parse(manifest.meta.issued_at) + 7 * 3600000,
    );
    expect(text).toContain("STALE");
    expect(text).toContain(manifest.snapshot_id);
    expect(text).toContain(row.hazard_rule_fired[0].id);
    expect(text).toContain(String(row.source_grid.latitude));
    expect(text).toContain("not a population-risk ranking");
  });
  it("labels replay and what-if exports explicitly and rejects future-time freshness claims", () => {
    for (const mode of ["replay", "whatif"] as const) {
      const simulation = {
        ...data,
        manifest: {
          ...manifest,
          meta: { ...manifest.meta, mode, is_simulation: true },
        },
      };
      expect(planningBrief(simulation, ward, row, [])).toContain("SIMULATION");
      expect(planningBrief(simulation, ward, row, [])).toContain(
        "not a live forecast",
      );
    }
    expect(
      planningBrief(
        data,
        ward,
        row,
        [],
        Date.parse(manifest.meta.issued_at) - 3600000,
      ),
    ).toContain("future publication timestamp");
  });
  it("counts shared cells rather than presenting wards as independent locations", () => {
    const shared = [row, { ...row, ward_id: "synthetic-duplicate-location" }];
    expect(spatialCoverage(shared)).toEqual({ cells: 1, largestGroup: 2 });
  });
});
