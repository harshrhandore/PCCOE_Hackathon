import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Dataset } from "../data/types";
import { PageHeading, RouteLink, Empty } from "../components/Shared";
type Episode = {
  id: string;
  start: string;
  end: string;
  selection_method: string;
};
export default function Scenarios({
  data,
  update,
  offline,
}: {
  data: Dataset;
  update: (v: Record<string, string>) => void;
  offline: boolean;
}) {
  const { t } = useTranslation();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [temp, setTemp] = useState(0);
  const [rh, setRh] = useState(0);
  const [wind, setWind] = useState(1);
  const [result, setResult] = useState<unknown>(null);
  const [status, setStatus] = useState("");
  const [playing, setPlaying] = useState(false);
  const [hour, setHour] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [requested, setRequested] = useState(false);
  const baseline = data.manifest.snapshot_id;
  useEffect(() => {
    const ac = new AbortController();
    void fetch("/data/replay/catalog.json", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then(setEpisodes)
      .catch(() => {});
    return () => ac.abort();
  }, []);
  useEffect(() => {
    if (!requested) return;
    const ac = new AbortController();
    const timer = setTimeout(() => {
      if (offline) {
        setStatus("What-if computation is unavailable offline.");
        return;
      }
      setStatus("Computing scenario…");
      void fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/whatif`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snapshot_id: baseline,
            ward_ids: data.registry.wards.map((w) => w.id),
            temperature_delta_c: temp,
            relative_humidity_delta_pp: rh,
            wind_multiplier: wind,
            weights_mode: "default",
          }),
          signal: ac.signal,
        },
      )
        .then(async (r) => {
          const value = await r.json();
          if (!r.ok) throw new Error();
          return value.data;
        })
        .then((v) => {
          setResult(v);
          setStatus("Computed simulation. Baseline remains unchanged.");
        })
        .catch(() => {
          if (!ac.signal.aborted)
            setStatus(
              "What-if service unavailable or baseline inputs incomplete. No synthetic comparison is substituted.",
            );
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [temp, rh, wind, requested, offline, baseline, data.registry.wards]);
  useEffect(() => {
    if (!playing) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      setPlaying(false);
      return;
    }
    const timer = setInterval(
      () => setHour((h) => (h >= 119 ? (setPlaying(false), 119) : h + 1)),
      1000 / speed,
    );
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", pause);
    };
  }, [playing, speed]);
  return (
    <>
      <PageHeading
        kicker="REPLAY / CONTROLLED PERTURBATIONS"
        title={t("nav.scenarios")}
      />
      <div className="scenario-layout">
        <section className="scenario-controls">
          <h2>A historical episode, selected by a rule.</h2>
          <p>
            Replay scans the five complete years preceding the build year.
            Selection ranks consecutive strong-heat days, UTCI exceedance, WBGT
            and earliest date. It is not a claim about the hottest observed
            episode.
          </p>
          {episodes.length ? (
            <label>
              Prepared episode
              <select
                defaultValue=""
                onChange={(e) => {
                  const ep = episodes.find((x) => x.id === e.target.value);
                  if (ep)
                    update({
                      mode: "replay",
                      episode: ep.id,
                      date: ep.start,
                      t: "0",
                    });
                }}
              >
                <option value="">Choose a real episode</option>
                {episodes.map((e) => (
                  <option value={e.id} key={e.id}>
                    {e.start} → {e.end}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Empty title={t("state.noReplay")}>
              <p>
                Run{" "}
                <code>uv run python -m pipeline.select_replay --acquire</code>.
                Missing data is never replaced by an invented episode.
              </p>
            </Empty>
          )}
          {data.manifest.meta.mode === "replay" && (
            <>
              <div className="button-row">
                <button onClick={() => setPlaying(!playing)}>
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  onClick={() => {
                    setHour(0);
                    setPlaying(false);
                  }}
                >
                  Reset
                </button>
                <button onClick={() => setSpeed(speed === 1 ? 2 : 1)}>
                  {speed}×
                </button>
              </div>
              <label>
                Replay hour {hour}
                <input
                  type="range"
                  min="0"
                  max="119"
                  value={hour}
                  onChange={(e) => {
                    setPlaying(false);
                    setHour(Number(e.target.value));
                  }}
                />
              </label>
              <button
                onClick={() =>
                  update({
                    date: data.manifest.meta.dates[Math.floor(hour / 24)],
                    t: String(hour % 24),
                  })
                }
              >
                Apply time to overview
              </button>
              <RouteLink to="/">Open replay on overview →</RouteLink>
            </>
          )}
        </section>
        <section className="whatif-panel">
          <p className="eyebrow">WHAT-IF / SIMULATION</p>
          <h2>
            Change the conditions.
            <br />
            Keep the assumptions visible.
          </h2>
          <p>
            Independent perturbations are not a physically coherent new weather
            forecast. All context hours are recomputed. Vulnerability remains
            fixed.
          </p>
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
                onChange={(e) => {
                  c.set(Number(e.target.value));
                  setRequested(true);
                }}
              />
              <input
                aria-label={`${c.name} numeric value`}
                type="number"
                min={c.min}
                max={c.max}
                step={c.step}
                value={c.value}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n >= c.min && n <= c.max) {
                    c.set(n);
                    setRequested(true);
                  }
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
                setRequested(true);
              }}
            >
              Reset inputs
            </button>
            <button
              className="primary"
              disabled={offline}
              onClick={() => setRequested(true)}
            >
              Compute what-if
            </button>
          </div>
          <p role="status">{status}</p>
          {result !== null && (
            <div className="scenario-result">
              <strong>SIMULATION — not a live forecast.</strong>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
