import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Dataset, Daily, Ward } from "../data/types";
import { useHourly } from "../data/client";
import { RiskChip, Metrics, Rules, SourceChip, RouteLink } from "./Shared";
import { number, timeLabel } from "../lib/state";
import HeatRibbon from "./HeatRibbon";
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
  const hourly = useHourly(data, ward.id);
  const [audience, setAudience] = useState('citizen');
  const actions = useQuery({queryKey:['action-library'],staleTime:Infinity,queryFn:async()=>{
    const response = await fetch('/data/actions.json');
    if (!response.ok) throw new Error('Action library unavailable');
    return response.json() as Promise<{version:string;actions:{id:string;audience:string;active:boolean;levels:number[];text_en:string;source_section:string;requires_confirmation:boolean}[]}>;
  }});
  return (
    <article className={`ward-context ${full ? "full" : ""}`}>
      <header>
        <p className="eyebrow">
          PRABHAG {ward.source_ward_id} · ELECTORAL / 2022
        </p>
        <h2>{ward.name_en}</h2>
        <p>{row?.date} · Daily risk</p>
      </header>
      {row ? (
        <>
          <Metrics row={row} />
          {row.risk_basis === "hazard_only" && (
            <p className="note">{t("detail.hazardOnly")}</p>
          )}
          {row.modifier_status === "unknown" && (
            <p className="note">{t("detail.incomplete")}</p>
          )}
          <dl className="weather-values">
            <div>
              <dt>{t("field.utci")}</dt>
              <dd>
                {number(row.peak_utci)}
                <span> °C</span>
                <small>{timeLabel(row.peak_utci_time)} IST</small>
              </dd>
            </div>
            <div>
              <dt>{t("field.wbgt")}</dt>
              <dd>
                {number(row.peak_wbgt)}
                <span> °C</span>
                <small>Outdoor estimate</small>
              </dd>
            </div>
          </dl>
          <SourceChip data={data} field={row} />
          <Rules data={data} row={row} />
          <section className="night-section">
            <h3>Overnight relief</h3>
            <p>
              <strong className="numeric">{number(row.night_min_t)} °C</strong>{" "}
              sampled night minimum
            </p>
            <p>
              Threshold {number(row.night_threshold)} °C · 1991–2020 90th
              percentile
            </p>
            <p className="provenance-text">
              {row.night_period?.start.slice(0, 16).replace("T", " ")} →{" "}
              {row.night_period?.end.slice(0, 16).replace("T", " ")} IST
            </p>
          </section>
          {hourly.data ? (
            <HeatRibbon data={data} hourly={hourly.data} />
          ) : (
            <p>{t(hourly.isPending ? "state.fetching" : "state.wardFailed")}</p>
          )}
          <section>
            <h3>{t("field.imd")}</h3>
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
            <p className="provenance-text">{t("detail.imdNote")}</p>
          </section>
          <section>
            <h3>Recommended actions</h3>
            <label>Audience<select value={audience} onChange={e=>setAudience(e.target.value)}>
              <option value="citizen">Citizen / caregiver</option><option value="outdoor_worker">Outdoor worker</option><option value="authority">Authority</option><option value="school_anganwadi">School / anganwadi</option><option value="care_home">Care home</option>
            </select></label>
            <p className="provenance-text">Version {actions.data?.version || 'unavailable'} · English safety wording. Hindi/Marathi review pending.</p>
            {actions.data?.actions.filter(a=>a.active&&a.audience===audience&&row.risk_level!==null&&a.levels.includes(row.risk_level)).map(a=><div key={a.id} lang="en"><p>{a.text_en}</p>{a.requires_confirmation&&<p className="provenance-text">Owner / responsible authority confirmation required.</p>}<a href="https://mausam.imd.gov.in/pdfs/heatcolduser/FAQ_heat_wave.pdf#page=13" className="provenance-text">{a.source_section}</a></div>)}
            {(!actions.data || !actions.data.actions.some(a=>a.active&&a.audience===audience))&&<p>No verified active action is available for this audience.</p>}
            <RouteLink to="/methods">Read action sources →</RouteLink>
          </section>
          <section>
            <h3>{t("layer.refuges")}</h3>
            <p>{t("detail.refugeNote")}</p>
            <p>{t("state.noRefuges")}</p>
            <p className="provenance-text">
              OSM candidate acquisition pending; facility availability is
              unknown.
            </p>
          </section>
          <section>
            <h3>{t("field.likelihood")}</h3>
            <p>
              {t("common.unavailable")} · No calibrated ML or ensemble
              inference.
            </p>
          </section>
          {!full && (
            <RouteLink className="button wide" to={`/ward/${ward.id}`}>
              Full ward bulletin →
            </RouteLink>
          )}
        </>
      ) : (
        <p>{t("state.noForecast")}</p>
      )}
    </article>
  );
}
