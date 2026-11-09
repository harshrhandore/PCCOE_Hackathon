import type { Dataset, Daily, Ward } from "../data/types";
import { number } from "./state";

export function spatialCoverage(rows: Daily[]) {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const grid = row.source_grid;
    if (
      !grid ||
      !Number.isFinite(grid.latitude) ||
      !Number.isFinite(grid.longitude)
    )
      continue;
    const key = `${grid.latitude},${grid.longitude}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  return { cells: groups.size, largestGroup: Math.max(0, ...groups.values()) };
}

export function snapshotAge(data: Dataset, now = Date.now()) {
  return (now - Date.parse(data.manifest.meta.issued_at)) / 3600000;
}

export function planningBrief(
  data: Dataset,
  ward: Ward,
  row: Daily,
  actions: string[],
  now = Date.now(),
) {
  const meta = data.manifest.meta;
  const mode =
    meta.mode === "replay"
      ? "SIMULATION / HISTORICAL REPLAY — not a live forecast"
      : meta.is_simulation || meta.mode === "whatif"
        ? "SIMULATION / WHAT-IF — not a live forecast"
        : "PROTOTYPE / SAVED MODEL FORECAST";
  return [
    "HEATGUARD — LOCAL PLANNING BRIEF",
    mode,
    `Ward: ${ward.name_en} (${ward.id}); historical boundary ${ward.boundary_version}.`,
    `Planning date: ${row.date} IST. Publication: ${meta.issued_at}.`,
    ...(meta.mode === "live"
      ? [
          `Snapshot age at export: ${number(snapshotAge(data, now))} hours; ${snapshotAge(data, now) < 0 ? "future publication timestamp — verify source and local clock" : snapshotAge(data, now) > 6 ? "STALE — refresh and verify before time-sensitive decisions" : "within the six-hour freshness window"}.`,
        ]
      : []),
    `Heat-stress screening: ${row.hazard_level ?? "unavailable"}; base ${row.base_level ?? "unavailable"}. Risk basis: ${row.risk_basis}.`,
    `Peak UTCI ${number(row.peak_utci)} °C; outdoor WBGT ${number(row.peak_wbgt)} °C; sampled night minimum ${number(row.night_min_t)} °C.`,
    `Rule explanations: ${row.hazard_rule_fired.map((r) => `${r.id}: ${r.status}`).join("; ")}.`,
    `Upstream weather grid: ${row.source_grid.latitude}, ${row.source_grid.longitude}. Ward centroid sampling does not resolve street-level exposure.`,
    ...(row.risk_basis === "hazard_only"
      ? [
          "Population vulnerability and allocation priority unavailable. This is a weather-screening brief, not a population-risk ranking.",
        ]
      : []),
    "ACTIONS FOR LOCAL REVIEW",
    ...actions,
    "Confirm worksite conditions and responsible-owner capacity before acting. This document is not an official warning, approval or delivery receipt.",
    "No trained team ML model, illness probability or measured health benefit is claimed. Radiation and derived thermal indices are approximate.",
    `Sources: Open-Meteo weather; thermofeel calculations; DataMeet historical 2022 ward geography. Method ${meta.method_version}.`,
    `Snapshot: ${data.manifest.snapshot_id}. Sources and action wording: https://mausam.imd.gov.in/pdfs/heatcolduser/FAQ_heat_wave.pdf`,
  ].join("\n\n");
}
