import { useState, lazy, Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Dataset } from "../data/types";
import { PageHeading, SourceChip } from "../components/Shared";
import { useHourly } from "../data/client";
import { localParts, number, timeLabel, download } from "../lib/state";
const HourlyChart = lazy(() => import("../components/HourlyChart"));
export default function Worker({
  data,
  date,
}: {
  data: Dataset;
  date: string;
}) {
  const { t } = useTranslation();
  const [ward, setWard] = useState(data.registry.wards[0]?.id);
  const [load, setLoad] = useState("moderate");
  const [accl, setAccl] = useState("unknown");
  const [clothing, setClothing] = useState("unknown");
  const h = useHourly(data, ward);
  const limit = (
    accl === "yes"
      ? data.methods.worker_screening.acclimatized
      : data.methods.worker_screening.unacclimatized
  )[load];
  const points = useMemo(
    () =>
      h.data
        ? h.data.time
            .map((time, i) => ({
              time,
              hour: localParts(time).hour,
              date: localParts(time).date,
              value: h.data!.wbgt[i],
            }))
            .filter((x) => x.date === date)
        : [],
    [h.data, date],
  );
  const valid = points.filter(
    (x): x is typeof x & { value: number } => x.value !== null,
  );
  const windows: string[] = [];
  let current: typeof valid = [];
  for (const p of valid) {
    if (
      p.value < limit &&
      clothing === "ordinary" &&
      (!current.length || p.hour === current[current.length - 1].hour + 1)
    )
      current.push(p);
    else {
      if (current.length >= 2)
        windows.push(
          `${timeLabel(current[0].time)}–${timeLabel(current[current.length - 1].time)}`,
        );
      current = p.value < limit && clothing === "ordinary" ? [p] : [];
    }
  }
  if (current.length >= 2)
    windows.push(
      `${timeLabel(current[0].time)}–${timeLabel(current[current.length - 1].time)}`,
    );
  return (
    <>
      <PageHeading
        kicker="OUTDOOR WORK / PLANNING SCREEN"
        title={t("nav.worker")}
      />
      <div className="worker-layout">
        <section>
          <div className="form-columns">
            <label>
              {t("common.chooseWard")}
              <select value={ward} onChange={(e) => setWard(e.target.value)}>
                {data.registry.wards.map((w) => (
                  <option value={w.id} key={w.id}>
                    {w.name_en}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Workload
              <select value={load} onChange={(e) => setLoad(e.target.value)}>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </label>
            <label>
              Acclimatization
              <select value={accl} onChange={(e) => setAccl(e.target.value)}>
                <option value="unknown">Unknown</option>
                <option value="no">Not acclimatized</option>
                <option value="yes">Acclimatized</option>
              </select>
            </label>
            <label>
              Clothing / PPE
              <select
                value={clothing}
                onChange={(e) => setClothing(e.target.value)}
              >
                <option value="unknown">Unknown / protective clothing</option>
                <option value="ordinary">
                  Ordinary lightweight work clothing
                </option>
              </select>
            </label>
          </div>
          <div className="worker-guidance">
            <p className="eyebrow">{t("worker.hours")}</p>
            <h2>
              {clothing === "unknown"
                ? "Worksite assessment required"
                : windows.length
                  ? windows.join(" / ") + " IST"
                  : t("worker.noWindow")}
            </h2>
            <p>{t("worker.limits")}</p>
            {accl === "unknown" && (
              <p>
                Unknown acclimatization: the unacclimatized screening reference
                is used.
              </p>
            )}
          </div>
          <SourceChip data={data} />
          {valid.length ? (
            <Suspense fallback={<p>Preparing hourly chart…</p>}>
              <HourlyChart points={valid} />
            </Suspense>
          ) : (
            <p>Outdoor WBGT is unavailable.</p>
          )}
          <details>
            <summary>{t("chart.showTable")}</summary>
            <table>
              <caption>
                {date} · sampled outdoor WBGT, not worksite measurements
              </caption>
              <thead>
                <tr>
                  <th>Sample, IST</th>
                  <th>WBGT °C</th>
                  <th>Screening</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.time}>
                    <th>{timeLabel(p.time)}</th>
                    <td>{number(p.value)}</td>
                    <td>
                      {clothing === "unknown" || p.value === null
                        ? "Assessment required"
                        : p.value >= limit
                          ? "Threshold reached"
                          : "Below threshold · conditions apply"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
          <button
            onClick={() =>
              download(
                "heatguard-work-planning.txt",
                `${data.manifest.meta.is_simulation ? "SIMULATION — not a live forecast." : "TEST — prototype planning."}\n${data.registry.wards.find((w) => w.id === ward)?.name_en}\n${date}. Workload ${load}; acclimatization ${accl}; clothing ${clothing}.\n${windows.length ? windows.join(" / ") + " IST" : "No eligible lower-exposure window."}\nWork:rest schedule requires a worksite assessment. No hour is guaranteed safe.\nIssued ${data.manifest.meta.issued_at}. Source: OSHA Table 2; Open-Meteo, thermofeel. Boundary 2022.`,
              )
            }
          >
            Share planning text
          </button>
        </section>
        <aside className="assumptions-panel">
          <p className="eyebrow">APPLICABILITY</p>
          <h2>Screening is the start of an assessment.</h2>
          <p>
            Effective WBGT screening reference: <strong>{limit} °C</strong> for
            the selected workload/acclimatization. “Reached” means ≥ limit. The
            zero clothing adjustment applies only to the explicitly selected
            ordinary clothing.
          </p>
          <p>
            Lower-exposure windows require at least two consecutive valid hourly
            points below the selected screening threshold. This is an analyst
            planning heuristic, not continuous-work permission.
          </p>
          <h3>{t("worker.assessment")}</h3>
          <p>
            The CCOHS screening table is not intended to prescribe work and
            recovery periods. Numeric work:rest schedules remain unavailable
            pending a usable source and site assessment.
          </p>
          <a href="https://www.osha.gov/heat-exposure/hazards">
            OSHA Table 2: workload screening ↗
          </a>
          <a href="https://www.ccohs.ca/oshanswers/phys_agents/heat/heat_control.html">
            CCOHS: applicability and control measures ↗
          </a>
        </aside>
      </div>
    </>
  );
}
