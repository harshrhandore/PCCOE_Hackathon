import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { Dataset } from "../data/types";
import { PageHeading, RouteLink } from "../components/Shared";
import ScenarioComparison, {
  type ScenarioResult,
} from "../components/ScenarioComparison";
import { API_BASE } from "../data/client";

type Submission = {
  snapshot: string;
  temp: number;
  rh: number;
  wind: number;
  wardIds: string[];
};
export default function Scenarios({
  data,
  update,
  wardId,
  date,
}: {
  data: Dataset;
  update: (v: Record<string, string>) => void;
  wardId: string | null;
  date: string;
}) {
  const { t } = useTranslation();
  const catalog = useQuery({
    queryKey: ["replay-catalog"],
    networkMode: "always",
    queryFn: async () => {
      const r = await fetch("/data/replay/catalog.json");
      if (!r.ok) throw new Error("Catalog unavailable");
      return r.json() as Promise<{ id: string; start: string; end: string }[]>;
    },
  });
  const [temp, setTemp] = useState(0),
    [rh, setRh] = useState(0),
    [wind, setWind] = useState(1);
  const [scope, setScope] = useState("ward");
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [pending, setPending] = useState(false),
    [status, setStatus] = useState("");
  const baseline = data.manifest.snapshot_id;
  const ward =
    data.registry.wards.find((w) => w.id === wardId) || data.registry.wards[0];
  const wardIds =
    scope === "all" ? data.registry.wards.map((w) => w.id) : [ward.id];
  const dirty =
    !!submission &&
    (submission.temp !== temp ||
      submission.rh !== rh ||
      submission.wind !== wind ||
      submission.wardIds.join() !== wardIds.join());
  useEffect(() => {
    setResult(null);
    setSubmission(null);
    setPending(false);
    setStatus("");
  }, [baseline]);
  useEffect(() => {
    if (!submission || submission.snapshot !== baseline) return;
    const ac = new AbortController();
    setResult(null);
    setPending(true);
    setStatus("Computing thermal indices from saved inputs…");
    void fetch(`${API_BASE}/whatif`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ac.signal,
      body: JSON.stringify({
        snapshot_id: baseline,
        ward_ids: submission.wardIds,
        temperature_delta_c: submission.temp,
        relative_humidity_delta_pp: submission.rh,
        wind_multiplier: submission.wind,
        weights_mode: "default",
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Unavailable");
        return (await r.json()).data;
      })
      .then((value) => {
        if (ac.signal.aborted) return;
        if (
          value?.source_snapshot_id !== baseline ||
          !Array.isArray(value.baseline) ||
          !Array.isArray(value.scenario)
        )
          throw new Error("Invalid scenario");
        setResult(value);
        setStatus("Computed simulation. Baseline remains unchanged.");
      })
      .catch(() => {
        if (!ac.signal.aborted)
          setStatus(
            "What-if service unavailable or baseline inputs incomplete. No synthetic comparison is substituted.",
          );
      })
      .finally(() => {
        if (!ac.signal.aborted) setPending(false);
      });
    return () => ac.abort();
  }, [submission, baseline]);
  return (
    <>
      <PageHeading
        kicker="HISTORICAL EVIDENCE / CONTROLLED PERTURBATIONS"
        title={t("nav.scenarios")}
      />
      <div className="scenario-layout">
        <section className="scenario-controls">
          <h2>Inspect a historical heat episode.</h2>
          <p>
            ERA5 reanalysis supports a reproducible case study. It is not an
            as-issued forecast or a prediction-accuracy test. Selection scanned
            2021–2025 using the documented heat-spell rule.
          </p>
          {catalog.data?.length ? (
            <label>
              Prepared episode
              <select
                value={
                  data.manifest.meta.mode === "replay"
                    ? data.manifest.meta.episode?.id || catalog.data[0].id
                    : ""
                }
                onChange={(e) => {
                  const ep = catalog.data.find((x) => x.id === e.target.value);
                  if (ep)
                    update({
                      mode: "replay",
                      episode: ep.id,
                      date: ep.start,
                      t: "14",
                    });
                }}
              >
                <option value="">Choose a real episode</option>
                {catalog.data.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.start} → {ep.end}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p>
              {catalog.isPending
                ? "Loading prepared episodes…"
                : "Prepared replay unavailable."}
            </p>
          )}
          {data.manifest.meta.mode === "replay" && (
            <>
              <label>
                Replay day
                <select
                  value={date}
                  onChange={(e) => update({ date: e.target.value })}
                >
                  {data.manifest.meta.dates.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </label>
              <RouteLink className="button primary" to="/">
                Inspect this day on the overview →
              </RouteLink>
            </>
          )}
          <RouteLink to="/presenter">Follow the guided case study</RouteLink>
        </section>
        <section className="whatif-panel" aria-busy={pending}>
          <p className="eyebrow">WHAT-IF / SIMULATION</p>
          <h2>Test a change in conditions.</h2>
          <p>
            Recompute thermal indices for the selected ward. Expand to all wards
            when needed. Independent perturbations are not a physically coherent
            new weather forecast; vulnerability is unchanged.
          </p>
          <div className="form-columns">
            <label>
              Comparison scope
              <select
                aria-label="Comparison scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="ward">Selected ward</option>
                <option value="all">
                  All {data.registry.ward_count} wards
                </option>
              </select>
            </label>
            <label>
              Comparison ward
              <select
                aria-label="Comparison ward"
                value={ward.id}
                disabled={scope === "all"}
                onChange={(e) => update({ ward: e.target.value })}
              >
                {data.registry.wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name_en}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {[
            {
              name: "Air temperature change",
              unit: "°C",
              value: temp,
              set: setTemp,
              min: 0,
              max: 6,
              step: 0.5,
            },
            {
              name: "Relative humidity change",
              unit: "percentage points",
              value: rh,
              set: setRh,
              min: -30,
              max: 30,
              step: 5,
            },
            {
              name: "Wind multiplier",
              unit: "×",
              value: wind,
              set: setWind,
              min: 0,
              max: 2,
              step: 0.1,
            },
          ].map((c) => (
            <label className="scenario-slider" key={c.name}>
              <span>
                {c.name}{" "}
                <strong>
                  {c.value} {c.unit}
                </strong>
              </span>
              <input
                type="range"
                min={c.min}
                max={c.max}
                step={c.step}
                value={c.value}
                onChange={(e) => c.set(Number(e.target.value))}
              />
              <input
                aria-label={`${c.name} numeric value`}
                type="number"
                min={c.min}
                max={c.max}
                step={c.step}
                value={c.value}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (
                    Number.isFinite(value) &&
                    value >= c.min &&
                    value <= c.max
                  )
                    c.set(value);
                }}
              />
            </label>
          ))}
          <div className="button-row">
            <button
              onClick={() => {
                setTemp(0);
                setRh(0);
                setWind(1);
              }}
            >
              Reset inputs
            </button>
            <button
              className="primary"
              disabled={pending}
              onClick={() =>
                setSubmission({ snapshot: baseline, temp, rh, wind, wardIds })
              }
            >
              {pending ? "Computing…" : "Compute what-if"}
            </button>
          </div>
          <p role="status">
            {dirty
              ? "Inputs changed. Compute again to update the comparison."
              : status}
          </p>
          {result && (
            <ScenarioComparison
              result={result}
              data={data}
              pending={pending || dirty}
              selectedDate={date}
              onDateChange={(date) => update({ date })}
            />
          )}
        </section>
      </div>
    </>
  );
}
