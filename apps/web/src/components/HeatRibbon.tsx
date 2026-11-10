import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Dataset, Hourly } from "../data/types";
import {
  dateLabel,
  localParts,
  number,
  timeLabel,
  validatedParams,
} from "../lib/state";
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
  const selectedDate = validatedParams(params, days, []).date;
  const selectedHour = params.get("t");
  useEffect(() => {
    const day = days.indexOf(selectedDate || days[0]);
    const hour = Number(selectedHour ?? 14);
    if (day >= 0 && Number.isInteger(hour) && hour >= 0 && hour < 24)
      setIndex(day * 24 + hour);
  }, [selectedDate, selectedHour, days]);
  const cells = useMemo(() => {
    const indices = new Map<string, number>();
    hourly.time.forEach((time, index) => {
      const part = localParts(time);
      const key = `${part.date}/${part.hour}`;
      if (!indices.has(key)) indices.set(key, index);
    });
    return days.flatMap((date) =>
      Array.from({ length: 24 }, (_, hour) => {
        const i = indices.get(`${date}/${hour}`) ?? -1;
        return { date, hour, i, value: i < 0 ? null : hourly.utci[i] };
      }),
    );
  }, [days, hourly]);
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
      <h3>{selectedDate} thermal stress</h3>
      <svg
        viewBox="0 0 480 170"
        role="group"
        aria-label="Selected-day UTCI curve; inspect exact samples with the slider or data table"
      >
        {[0, 6, 12, 18, 23].map((h) => (
          <text key={h} x={30 + h * 18} y={163} fontSize="11">
            {h}:00
          </text>
        ))}
        {cells
          .filter((c) => c.date === selectedDate)
          .map((c, i, day) => {
            const values = day
              .map((d) => d.value)
              .filter((v): v is number => v !== null);
            const low = Math.min(...values) - 2,
              span = Math.max(4, Math.max(...values) - low + 2);
            const y = (v: number) => 140 - ((v - low) / span) * 120;
            const prev = day[i - 1];
            return c.value === null ? null : (
              <g
                key={c.hour}
                role="button"
                tabIndex={0}
                aria-label={`${c.hour}:00 IST bin: ${number(c.value)} degrees UTCI`}
                onClick={() => setIndex(days.indexOf(c.date) * 24 + c.hour)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIndex(days.indexOf(c.date) * 24 + c.hour);
                  }
                }}
              >
                {prev?.value != null && (
                  <line
                    x1={30 + (i - 1) * 18}
                    x2={30 + i * 18}
                    y1={y(prev.value)}
                    y2={y(c.value)}
                    stroke="var(--link)"
                    strokeWidth="2"
                  />
                )}
                <circle
                  cx={30 + i * 18}
                  cy={y(c.value)}
                  r="3"
                  fill="var(--link)"
                >
                  <title>
                    {c.hour}:00 IST: {number(c.value)} degrees UTCI
                  </title>
                </circle>
                {c.value === Math.max(...values) && (
                  <text
                    x={Math.min(390, 30 + i * 18)}
                    y={y(c.value) - 10}
                    fontSize="12"
                  >
                    Peak {number(c.value)} C
                  </text>
                )}
              </g>
            );
          })}
      </svg>
      <h3>Five-day comparison</h3>
      <p className="provenance-text">
        Hourly UTCI · °C · actual source samples, IST
      </p>
      <label className="timeline-control">
        Inspect sample · {selected.date}{" "}
        {String(selected.hour).padStart(2, "0")}:00 IST bin
        <input
          type="range"
          min="0"
          max="119"
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-label="Inspect hourly UTCI sample"
        />
      </label>
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
