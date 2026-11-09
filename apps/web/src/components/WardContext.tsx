import { useTranslation } from "react-i18next";
import { lazy, Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Dataset, Daily, Ward } from "../data/types";
import { useHourly } from "../data/client";
import { Metrics, Rules, SourceChip, RouteLink } from "./Shared";
import { number, timeLabel, download } from "../lib/state";
import { planningBrief } from "../lib/planning";
const HeatRibbon = lazy(() => import("./HeatRibbon"));

type Action = {
  id: string;
  audience: string;
  active: boolean;
  levels: number[];
  text_en: string;
  source_section: string;
  requires_confirmation: boolean;
};
export default function WardContext({
  data,
  ward,
  row,
  full = false,
}: {
  data: Dataset;
  ward: Ward;
  row: Daily | undefined;
  full?: boolean;
}) {
  const { t } = useTranslation();
  const [hourlyOpen, setHourlyOpen] = useState(full);
  const hourly = useHourly(data, hourlyOpen ? ward.id : undefined);
  const [audience, setAudience] = useState("authority");
  const actions = useQuery({
    queryKey: ["action-library"],
    enabled: full,
    staleTime: Infinity,
    queryFn: async () => {
      const response = await fetch("/data/actions.json");
      if (!response.ok) throw new Error("Action library unavailable");
      return response.json() as Promise<{ version: string; actions: Action[] }>;
    },
  });
  const applicable =
    actions.data?.actions.filter(
      (a) =>
        a.active &&
        a.audience === audience &&
        row?.risk_level !== null &&
        row?.risk_level !== undefined &&
        a.levels.includes(row.risk_level),
    ) || [];
  const peers = data.daily.filter(
    (r) =>
      r.date === row?.date &&
      r.source_grid.latitude === row?.source_grid.latitude &&
      r.source_grid.longitude === row?.source_grid.longitude,
  ).length;
  return (
    <article className={`ward-context ${full ? "full" : ""}`}>
      {!full && (
        <header>
          <p className="eyebrow">
            PRABHAG {ward.source_ward_id} · ELECTORAL / 2022
          </p>
          <h2>{ward.name_en}</h2>
          <p>{row?.date} · daily heat-stress screening</p>
        </header>
      )}
      {row ? (
        <>
          <Metrics row={row} />
          <div className="weather-values">
            <p>
              <strong>{number(row.peak_utci)} °C</strong>
              <br />
              Peak UTCI · {timeLabel(row.peak_utci_time)} IST
            </p>
            <p>
              <strong>{number(row.peak_wbgt)} °C</strong>
              <br />
              Outdoor WBGT estimate
            </p>
          </div>
          <Rules data={data} row={row} />
          {row.risk_basis === "hazard_only" && (
            <p className="note">
              Weather hazard only. Population vulnerability and allocation
              priority are unavailable; this level is not a probability of
              illness.
            </p>
          )}
          {row.modifier_status === "unknown" && (
            <p className="note">{t("detail.incomplete")}</p>
          )}
          {full && (
            <section className="brief-actions" aria-label="Planning brief">
              <h3>Actions for local review</h3>
              <label>
                Audience
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                >
                  <option value="authority">Local heat-action planner</option>
                  <option value="citizen">Citizen / caregiver</option>
                  <option value="outdoor_worker">Outdoor worker</option>
                  <option value="school_anganwadi">School / anganwadi</option>
                  <option value="care_home">Care home</option>
                </select>
              </label>
              <p className="provenance-text">
                Sourced English wording · library{" "}
                {actions.data?.version || "unavailable"}. Confirm
                responsible-owner capacity before acting.
              </p>
              {applicable.map((a) => (
                <div key={a.id} lang="en">
                  <p>{a.text_en}</p>
                  {a.requires_confirmation && (
                    <small>Responsible-owner confirmation required.</small>
                  )}
                  <a
                    className="provenance-text"
                    href="https://mausam.imd.gov.in/pdfs/heatcolduser/FAQ_heat_wave.pdf#page=13"
                  >
                    {a.source_section}
                  </a>
                </div>
              ))}
              {!applicable.length && (
                <p>
                  {actions.isPending
                    ? "Loading sourced actions…"
                    : "No verified active action is available for this audience and level."}
                </p>
              )}
              <div className="button-row">
                <button
                  className="primary"
                  disabled={!actions.data}
                  onClick={() =>
                    download(
                      "heatguard-planning-brief.txt",
                      planningBrief(data, ward, row, [
                        `Audience: ${audience}; action library ${actions.data?.version}.`,
                        ...(applicable.length
                          ? applicable.map(
                              (a) =>
                                `${a.text_en} [${a.source_section}]${a.requires_confirmation ? " Responsible-owner confirmation required." : ""}`,
                            )
                          : [
                              "No verified active action is available for this audience and level.",
                            ]),
                      ]),
                    )
                  }
                >
                  Download planning brief
                </button>
                <RouteLink
                  className="button"
                  to="/worker"
                  params={{ ward: ward.id, date: row.date }}
                >
                  Plan outdoor work →
                </RouteLink>
              </div>
            </section>
          )}
          {!full && (
            <RouteLink
              className="button wide"
              to={`/ward/${ward.id}`}
              params={{ ward: ward.id, date: row.date }}
            >
              Full ward bulletin →
            </RouteLink>
          )}
          <details className="spatial-evidence">
            <summary>Spatial coverage & limits</summary>
            <p>
              {peers} ward{peers === 1 ? "" : "s"} share{peers === 1 ? "s" : ""}{" "}
              this upstream weather cell: {row.source_grid.latitude},{" "}
              {row.source_grid.longitude}. Sampling representative ward
              centroids does not measure street-level or individual exposure.
            </p>
            <p>
              Historical 2022 electoral boundaries. Radiation and derived
              indices are approximate. No team-trained ML model or validated
              health benefit is claimed.
            </p>
            <SourceChip data={data} field={row} />
            <RouteLink to="/methods">Methods, evidence & validation</RouteLink>
          </details>
          <details className="night-section">
            <summary>Overnight relief & official-warning distinction</summary>
            <p>
              <strong>{number(row.night_min_t)} °C</strong> sampled night
              minimum; threshold {number(row.night_threshold)} °C · 1991–2020
              90th percentile.
            </p>
            <p className="provenance-text">
              {row.night_period?.start.slice(0, 16).replace("T", " ")} →{" "}
              {row.night_period?.end.slice(0, 16).replace("T", " ")} IST
            </p>
            <p>
              {t(
                row.imd_flag === "no"
                  ? "imd.no"
                  : row.imd_flag === "heat_wave"
                    ? "imd.heat"
                    : row.imd_flag === "severe_heat_wave"
                      ? "imd.severe"
                      : "imd.unknown",
              )}
            </p>
            <p>{t("detail.imdNote")}</p>
          </details>
          <details
            open={hourlyOpen}
            onToggle={(event) => setHourlyOpen(event.currentTarget.open)}
          >
            <summary>Hour-by-hour thermal estimates</summary>
            {hourlyOpen &&
              (hourly.data ? (
                <Suspense fallback={<p>Preparing hourly timeline…</p>}>
                  <HeatRibbon data={data} hourly={hourly.data} />
                </Suspense>
              ) : (
                <p>
                  {t(hourly.isPending ? "state.fetching" : "state.wardFailed")}
                </p>
              ))}
          </details>
        </>
      ) : (
        <p>{t("state.noForecast")}</p>
      )}
    </article>
  );
}
