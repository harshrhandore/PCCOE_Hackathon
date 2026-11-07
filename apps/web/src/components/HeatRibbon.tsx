import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Dataset, Hourly } from "../data/types";
import { dateLabel, localParts, number, timeLabel } from "../lib/state";
export default function HeatRibbon({
  data,
  hourly,
}: {
  data: Dataset;
  hourly: Hourly;
}) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const days = data.manifest.meta.dates;
  const [params] = useSearchParams();
  const selectedDate = params.get('date');
  const selectedHour = params.get('t');
  useEffect(() => {
    const day = days.indexOf(selectedDate || days[0]);
    const hour = Number(selectedHour ?? 14);
    if (day >= 0 && Number.isInteger(hour) && hour >= 0 && hour < 24) setIndex(day * 24 + hour);
  }, [selectedDate, selectedHour, days]);
  const cells = days.flatMap((date) =>
    Array.from({ length: 24 }, (_, hour) => {
      const i = hourly.time.findIndex((time) => {
        const p = localParts(time);
        return p.date === date && p.hour === hour;
      });
      return { date, hour, i, value: i < 0 ? null : hourly.utci[i] };
    }),
  );
  const selected = cells[index];
  const category = (v: number | null) =>
    v === null
      ? "unknown"
      : String(
          data.methods.utci.upper_endpoints_c.findIndex((x) => v <= x) < 0
            ? 4
            : data.methods.utci.upper_endpoints_c.findIndex((x) => v <= x),
        );
  return (
    <section className="heat-ribbon">
      <h3>Five days, hour by hour</h3>
      <p className="provenance-text">
        Hourly UTCI · °C · actual source samples, IST
      </p>
      <div className="ribbon-axis">
        <span />
        {[0, 6, 12, 18].map((h) => (
          <span key={h}>{String(h).padStart(2, "0")}</span>
        ))}
      </div>
      <div
        className="ribbon-grid"
        role="slider"
        tabIndex={0}
        aria-label="Hourly UTCI timeline"
        aria-valuemin={0}
        aria-valuemax={119}
        aria-valuenow={index}
        aria-valuetext={`${selected.date}, ${selected.hour}:00 bin, ${selected.value === null ? t("common.unavailable") : number(selected.value) + " degrees Celsius"}`}
        onKeyDown={(e) => {
          const deltas: Record<string, number> = {
            ArrowRight: 1,
            ArrowLeft: -1,
            ArrowUp: -24,
            ArrowDown: 24,
            PageUp: -6,
            PageDown: 6,
          };
          if (e.key in deltas) {
            e.preventDefault();
            setIndex((i) => Math.max(0, Math.min(119, i + deltas[e.key])));
          }
          if (e.key === "Home") {
            e.preventDefault();
            setIndex(0);
          }
          if (e.key === "End") {
            e.preventDefault();
            setIndex(119);
          }
        }}
      >
        {days.map((d, di) => (
          <div className="ribbon-row" key={d}>
            <span>{dateLabel(d).split(",")[0]}</span>
            <div>
              {cells.slice(di * 24, di * 24 + 24).map((c, hi) => (
                <span
                  key={hi}
                  className={`ribbon-cell level-${category(c.value)} ${di * 24 + hi === index ? "active" : ""}`}
                  title={`${d} ${c.hour}:00 bin · ${number(c.value)} °C`}
                  onPointerDown={() => setIndex(di * 24 + hi)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="ribbon-readout">
        {selected.date} ·{" "}
        {selected.i >= 0
          ? timeLabel(hourly.time[selected.i])
          : `${selected.hour}:00`}{" "}
        IST · UTCI {number(selected.value)} °C
      </p>
      <details>
        <summary>{t("chart.showTable")}</summary>
        <div className="table-scroll">
          <table>
            <caption>
              Actual sample instants and calculated thermal indices
            </caption>
            <thead>
              <tr>
                <th>Time (IST)</th>
                <th>UTCI °C</th>
                <th>WBGT °C</th>
              </tr>
            </thead>
            <tbody>
              {cells
                .filter((c) => c.i >= 0)
                .map((c) => (
                  <tr key={c.date + c.hour}>
                    <th>
                      {c.date} {timeLabel(hourly.time[c.i])}
                    </th>
                    <td>{number(c.value)}</td>
                    <td>{number(hourly.wbgt[c.i])}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
