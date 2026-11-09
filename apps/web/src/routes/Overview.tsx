import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Dataset } from "../data/types";
import { RiskChip, Legend, DateTabs, SourceChip } from "../components/Shared";
import WardContext from "../components/WardContext";
import DeferredContent from "../components/DeferredContent";
import { number, usePreferences } from "../lib/state";
import { spatialCoverage } from "../lib/planning";
const WardMap = lazy(() => import("../components/WardMap"));
type State = {
  mode: string;
  date: string;
  hour: number;
  ward: string | null;
  layer: string;
  lang: string;
};
export default function Overview({
  data,
  state,
  update,
}: {
  data: Dataset;
  state: State;
  update: (v: Record<string, string>) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("risk");
  const prefs = usePreferences();
  const rows = useMemo(
    () => data.daily.filter((r) => r.date === state.date),
    [data.daily, state.date],
  );
  const byId = useMemo(() => new Map(rows.map((r) => [r.ward_id, r])), [rows]);
  const counts = Array.from(
    { length: 5 },
    (_, i) => rows.filter((r) => r.risk_level === i).length,
  );
  const unknown = rows.filter((r) => r.risk_level === null).length;
  const severe = counts[3] + counts[4];
  const selected =
    data.registry.wards.find((w) => w.id === state.ward) ||
    data.registry.wards.find((w) => w.id === prefs.ward) ||
    data.registry.wards[0];
  const select = (ward: string) => {
    prefs.set("ward", ward);
    update({ ward });
  };
  const filtered = data.registry.wards
    .filter((w) =>
      `${w.name_en} ${w.name_mr || ""} ${w.source_ward_id}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) => {
      const x = byId.get(a.id),
        y = byId.get(b.id);
      return sort === "name"
        ? a.name_en.localeCompare(b.name_en)
        : sort === "priority"
          ? (y?.priority_score ?? -1) - (x?.priority_score ?? -1) ||
            a.id.localeCompare(b.id)
          : (y?.risk_level ?? -1) - (x?.risk_level ?? -1) ||
            (y?.priority_score ?? -1) - (x?.priority_score ?? -1) ||
            (y?.peak_utci ?? -100) - (x?.peak_utci ?? -100) ||
            a.id.localeCompare(b.id);
    });
  const adjusted = rows.some((r) => r.risk_basis === "vulnerability_adjusted");
  const layer = adjusted && state.layer === "risk" ? "risk" : "hazard";
  const coverage = spatialCoverage(rows);
  const uniform =
    rows.length > 0 &&
    rows.every((r) => r.hazard_level === rows[0].hazard_level);
  return (
    <>
      <header className="workspace-heading">
        <div>
          <p className="workspace-location">Pune · 58 electoral wards</p>
          <h1 id="page-title" tabIndex={-1}>
            {t("nav.overview")}
          </h1>
        </div>
        <SourceChip data={data}>
          Saved estimates · source &amp; update time
        </SourceChip>
      </header>
      <div className="workspace-controls">
        <label className="ward-picker">
          Planning ward
          <select
            aria-label="Planning ward"
            value={selected?.id || ""}
            onChange={(e) => select(e.target.value)}
          >
            {data.registry.wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name_en}
              </option>
            ))}
          </select>
        </label>
        <DateTabs
          data={data}
          date={state.date}
          onChange={(date) => update({ date })}
        />
      </div>
      <div className="city-summary">
        <p>
          {unknown === rows.length ? (
            "Required inputs are incomplete. Heat-stress screening is unavailable."
          ) : severe > 0 ? (
            <>
              <strong>
                {severe} of {data.registry.ward_count}
              </strong>{" "}
              wards reach Level 3 or above.
            </>
          ) : (
            t("overview.lowHeadline")
          )}
        </p>
        <details className="overview-distribution">
          <summary>Citywide category counts</summary>
          <div className="outlook-strip">
            {counts.map((n, i) => (
              <div key={i} className={`outlook-count level-${i}`}>
                <span>{t(`level.${i}`)}</span>
                <strong>{n}</strong>
              </div>
            ))}
            <div className="outlook-count unknown">
              <span>Unknown</span>
              <strong>{unknown}</strong>
            </div>
          </div>
        </details>
      </div>
      {adjusted && (
        <div className="layer-control" role="group" aria-label="Map layer">
          {["hazard", "risk"].map((value) => (
            <button
              key={value}
              aria-pressed={layer === value}
              onClick={() => update({ layer: value })}
            >
              {t(`field.${value}`)}
            </button>
          ))}
        </div>
      )}
      {uniform && (
        <p className="note">
          All wards share the same daily category. Within-category weather
          differences are screening information, not a validated
          resource-allocation ranking.
        </p>
      )}
      <nav className="workspace-jumps" aria-label="Workspace sections">
        <a href="#selected-ward">Selected ward</a>
        <a href="#city-map">City map</a>
        <a href="#ward-list">All wards</a>
      </nav>
      <div className="overview-grid">
        <section
          className="ward-ranking"
          id="ward-list"
          aria-label="Ward ranking"
        >
          <div className="ranking-heading">
            <h2>All wards</h2>
            <span>{data.registry.ward_count} wards</span>
          </div>
          <label className="search-field">
            {t("common.searchWard")}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or prabhag number"
              type="search"
            />
          </label>
          <label className="sort-field">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="risk">Heat level, then peak UTCI</option>
              <option
                value="priority"
                disabled={!rows.some((r) => r.priority_score !== null)}
              >
                {t("sort.priority")}
                {!rows.some((r) => r.priority_score !== null)
                  ? " · unavailable"
                  : ""}
              </option>
              <option value="name">{t("sort.name")}</option>
            </select>
          </label>
          <div className="ward-list">
            <DeferredContent
              label="Ward list"
              height={460}
              render={() => (
                <>
                  {filtered.length ? (
                    filtered.map((w) => {
                      const row = byId.get(w.id);
                      return (
                        <button
                          key={w.id}
                          className={`ward-row ${selected?.id === w.id ? "selected" : ""}`}
                          aria-pressed={selected?.id === w.id}
                          onClick={() => select(w.id)}
                        >
                          <span className="ward-index">
                            {w.source_ward_id.padStart(2, "0")}
                          </span>
                          <span className="ward-name">
                            <strong>{w.name_en}</strong>
                            <small>Peak UTCI {number(row?.peak_utci)} °C</small>
                          </span>
                          <span className="ward-level">
                            <RiskChip level={row?.risk_level ?? null} />
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p>{t("state.noSearch")}</p>
                  )}
                </>
              )}
            />
          </div>
          <p className="provenance-text">
            Weather screening order only. Small model differences do not
            establish different health outcomes. Boundary vintage: 2022.
          </p>
        </section>
        <div className="map-column" id="city-map">
          <DeferredContent
            label="Ward map"
            height={540}
            render={() => (
              <>
                <Suspense fallback={<div className="skeleton map" />}>
                  <WardMap
                    data={data}
                    rows={rows}
                    selected={selected?.id || null}
                    layer={layer}
                    onSelect={select}
                  />
                </Suspense>
                <Legend data={data} layer={layer} />
              </>
            )}
          />
          <div className="map-annotation">
            <span className="eyebrow">READ THE MAP</span>
            <p>
              {coverage.cells} upstream weather cells represent {rows.length}{" "}
              wards; up to {coverage.largestGroup} wards share a cell. The map
              uses representative centroids and historical 2022 boundaries. It
              does not resolve street-level exposure.
            </p>
          </div>
        </div>
        {selected && (
          <div className="selected-ward-panel" id="selected-ward">
            <WardContext
              data={data}
              ward={selected}
              row={byId.get(selected.id)}
            />
          </div>
        )}
      </div>
    </>
  );
}
