import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Dataset, Daily, Level } from "../data/types";
import {
  PageHeading,
  RiskChip,
  Legend,
  DateTabs,
  SourceChip,
} from "../components/Shared";
import WardContext from "../components/WardContext";
import { number, timeLabel, usePreferences } from "../lib/state";
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
  const highest = Math.max(-1, ...rows.map((r) => r.risk_level ?? -1));
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
  const peak = rows
    .filter((r) => r.peak_utci !== null)
    .sort((a, b) => (b.peak_utci ?? -100) - (a.peak_utci ?? -100))[0];
  return (
    <>
      <div className="edition-line">
        <span>THE DAILY BULLETIN</span>
        <span>NEAR-REAL-TIME, MODEL-BASED</span>
        <span>{data.manifest.meta.dates[0]} / IST</span>
      </div>
      <PageHeading kicker="HEAT OUTLOOK · PUNE" title={t("nav.overview")}>
        <div className="issue-box">
          <span className="eyebrow">{t("overview.highest")}</span>
          <div
            className={`highest-value level-${highest < 0 ? "unknown" : highest}`}
          >
            <span>{highest < 0 ? "—" : highest}</span>
            <strong>
              {highest < 0
                ? t("common.unavailable")
                : data.methods.utci.names[highest]}
            </strong>
          </div>
        </div>
      </PageHeading>
      <div className="bulletin-sentence">
        <p>
          {unknown === rows.length
            ? "Required inputs are incomplete. Heat risk remains unavailable."
            : severe > 0
              ? `${severe} of ${data.registry.ward_count} wards reach Level 3 or above.`
              : t("overview.lowHeadline")}{" "}
          <span>{t("overview.unknown", { count: unknown })}</span>
        </p>
        <SourceChip data={data} />
      </div>
      <section className="outlook-strip" aria-label="Ward risk distribution">
        {counts.map((n, i) => (
          <div key={i} className={`outlook-count level-${i}`}>
            <span>{t(`level.${i}`)}</span>
            <strong className="numeric">{n}</strong>
          </div>
        ))}
        <div className="outlook-count unknown">
          <span>{t("common.unknown")}</span>
          <strong className="numeric">{unknown}</strong>
        </div>
      </section>
      <DateTabs
        data={data}
        date={state.date}
        onChange={(date) => update({ date })}
      />
      <div className="overview-toolbar">
        <div className="layer-control" role="group" aria-label="Map layer">
          {["risk", "hazard", "vulnerability", "refuges"].map((layer) => (
            <button
              key={layer}
              aria-pressed={state.layer === layer}
              onClick={() => update({ layer })}
            >
              {t(layer === "refuges" ? "layer.refuges" : `field.${layer}`)}
            </button>
          ))}
        </div>
        <label className="time-control">
          {t("common.hour")}{" "}
          <strong className="numeric">
            {String(state.hour).padStart(2, "0")}:00–
            {String(state.hour).padStart(2, "0")}:59 IST
          </strong>
          <input
            type="range"
            min="0"
            max="23"
            value={state.hour}
            onChange={(e) => update({ t: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "PageUp" || e.key === "PageDown") {
                e.preventDefault();
                update({
                  t: String(
                    Math.max(
                      0,
                      Math.min(23, state.hour + (e.key === "PageUp" ? 6 : -6)),
                    ),
                  ),
                });
              }
            }}
          />
        </label>
      </div>
      <p className="map-time-note">
        Map fill: selected day’s{" "}
        {state.layer === "hazard"
          ? "hazard"
          : state.layer === "vulnerability"
            ? "relative vulnerability"
            : "daily risk"}
        . Hour selection changes the detail timeline, not daily risk.{" "}
        {peak && `City peak sample ${timeLabel(peak.peak_utci_time)} IST.`}
      </p>
      <a href="#ward-list" className="mobile-list-link button">
        {t("common.showList")}
      </a>
      <div className="overview-grid">
        <section
          className="ward-ranking"
          id="ward-list"
          aria-label="Ward ranking"
        >
          <div className="ranking-heading">
            <h2>Ward watch</h2>
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
              <option value="risk">{t("sort.risk")}</option>
              <option value="priority">{t("sort.priority")}</option>
              <option value="name">{t("sort.name")}</option>
            </select>
          </label>
          <div className="ward-list">
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
                    <RiskChip level={row?.risk_level ?? null} />
                  </button>
                );
              })
            ) : (
              <p>{t("state.noSearch")}</p>
            )}
          </div>
          <p className="provenance-text">
            Priority incomplete where vulnerability is unavailable. Boundary
            vintage: 2022.
          </p>
        </section>
        <div className="map-column">
          <Suspense fallback={<div className="skeleton map" />}>
            <WardMap
              data={data}
              rows={rows}
              selected={selected?.id || null}
              layer={state.layer}
              onSelect={select}
            />
          </Suspense>
          <Legend data={data} layer={state.layer} />
          <div className="map-annotation">
            <span className="eyebrow">READ THE MAP</span>
            <p>
              Hazard describes weather stress. Vulnerability describes relative
              sensitivity and capacity. Risk combines them. Priority ranks
              resource allocation; it is not illness probability.
            </p>
          </div>
        </div>
        {selected && (
          <WardContext
            data={data}
            ward={selected}
            row={byId.get(selected.id)}
          />
        )}
      </div>
    </>
  );
}
