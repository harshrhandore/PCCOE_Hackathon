import { useTranslation } from "react-i18next";
import type { Daily, Dataset } from "../data/types";
import { RiskChip } from "./Shared";
import { dateLabel, number, download } from "../lib/state";

export interface ScenarioResult {
  scenario_id: string;
  source_snapshot_id: string;
  expires_at: string;
  content_sha256: string;
  applied_deltas: {
    temperature_delta_c: number;
    relative_humidity_delta_pp: number;
    wind_multiplier: number;
  };
  clamp_counts: { rh: number };
  baseline: Daily[];
  scenario: Daily[];
}
export default function ScenarioComparison({
  result,
  data,
  pending,
  selectedDate,
  onDateChange,
}: {
  result: ScenarioResult;
  data: Dataset;
  pending: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
}) {
  const { t } = useTranslation();
  const date = data.manifest.meta.dates.includes(selectedDate)
    ? selectedDate
    : data.manifest.meta.dates[0];
  const baseline = result.baseline.filter((r) => r.date === date);
  const scenario = result.scenario.filter((r) => r.date === date);
  const lookup = new Map(baseline.map((r) => [r.ward_id, r]));
  const changed = scenario.filter(
    (r) => lookup.get(r.ward_id)?.risk_level !== r.risk_level,
  ).length;
  const unknown = scenario.filter((r) => r.risk_level === null).length;
  const severe = (rows: Daily[]) =>
    rows.filter((r) => r.risk_level !== null && r.risk_level >= 3).length;
  const deltas = result.applied_deltas;
  function share() {
    download(
      "heatguard-whatif.txt",
      [
        "SIMULATION — not a live forecast.",
        `Source snapshot: ${result.source_snapshot_id}`,
        `Selected day: ${date}. Boundary 2022.`,
        `Applied: T +${deltas.temperature_delta_c} °C, RH ${deltas.relative_humidity_delta_pp} percentage points, wind ×${deltas.wind_multiplier}.`,
        `Baseline Level >=3 wards: ${severe(baseline)}. Scenario Level >=3 wards: ${severe(scenario)}. Changed risk: ${changed}. Unknown: ${unknown}.`,
        "Independent perturbations are not a physically coherent new NWP forecast. Vulnerability is unchanged.",
        `Clamped RH values: ${result.clamp_counts.rh}. Method ${data.manifest.meta.method_version}.`,
        `Source publication: ${data.manifest.meta.issued_at}. Scenario expires ${result.expires_at}.`,
        `Content SHA-256: ${result.content_sha256}`,
      ].join("\n"),
    );
  }
  return (
    <section className="scenario-result" aria-busy={pending}>
      <div className="simulation-banner">
        <strong>SIMULATION</strong>
        <span>{t("scenario.compare.notForecast")}</span>
      </div>
      <h3>{t("scenario.compare.title")}</h3>
      {pending && <p role="status">{t("scenario.compare.previous")}</p>}
      <p>
        {t("scenario.compare.inputs", {
          temperature: deltas.temperature_delta_c,
          humidity: deltas.relative_humidity_delta_pp,
          wind: deltas.wind_multiplier,
        })}
      </p>
      <label>
        {t("common.date")}
        <select value={date} onChange={(e) => onDateChange(e.target.value)}>
          {data.manifest.meta.dates.map((d) => (
            <option key={d} value={d}>
              {dateLabel(d)}
            </option>
          ))}
        </select>
      </label>
      <dl className="metric-grid">
        <div>
          <dt>{t("scenario.compare.baseline")}</dt>
          <dd>
            {severe(baseline)} / {baseline.length}
          </dd>
        </div>
        <div>
          <dt>{t("scenario.compare.scenario")}</dt>
          <dd>
            {severe(scenario)} / {scenario.length}
          </dd>
        </div>
        <div>
          <dt>{t("scenario.compare.changed")}</dt>
          <dd>{changed}</dd>
        </div>
        <div>
          <dt>{t("common.unknown")}</dt>
          <dd>{unknown}</dd>
        </div>
      </dl>
      <p className="provenance-text">
        {t("scenario.compare.clamps", { count: result.clamp_counts.rh })} ·{" "}
        {t("scenario.compare.fixed")}
      </p>
      <div className="table-scroll">
        <table>
          <caption>{t("scenario.compare.caption", { date })}</caption>
          <thead>
            <tr>
              <th>{t("field.ward")}</th>
              <th>{t("scenario.compare.before")}</th>
              <th>{t("scenario.compare.after")}</th>
              <th>{t("scenario.compare.utci")}</th>
            </tr>
          </thead>
          <tbody>
            {scenario.map((row) => {
              const old = lookup.get(row.ward_id);
              return (
                <tr key={row.ward_id}>
                  <th scope="row">
                    {data.registry.wards.find((w) => w.id === row.ward_id)
                      ?.name_en || row.ward_id}
                  </th>
                  <td>
                    <RiskChip level={old?.risk_level ?? null} />
                  </td>
                  <td>
                    <RiskChip level={row.risk_level} />
                  </td>
                  <td className="numeric">
                    {old?.peak_utci === null ||
                    old?.peak_utci === undefined ||
                    row.peak_utci === null
                      ? "—"
                      : number(row.peak_utci - old.peak_utci)}{" "}
                    °C
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={share}>{t("common.share")}</button>
      <details>
        <summary>{t("common.source")}</summary>
        <p>
          {result.source_snapshot_id} · {result.scenario_id}
        </p>
        <p>{t("scenario.compare.expires", { time: result.expires_at })}</p>
        <p className="provenance-text">SHA-256 {result.content_sha256}</p>
      </details>
    </section>
  );
}
