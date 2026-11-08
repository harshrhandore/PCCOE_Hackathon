import { Suspense, lazy, useEffect, useState } from "react";
import {
  Route,
  Routes,
  NavLink,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDataset } from "./data/client";
import { usePreferences, validatedParams, timeLabel } from "./lib/state";
import { RouteLink, Skeleton, Empty } from "./components/Shared";
import Overview from "./routes/Overview";
const Authority = lazy(() => import("./routes/Authority"));
const Methods = lazy(() => import("./routes/Methods"));
const Scenarios = lazy(() => import("./routes/Scenarios"));
const Subscribe = lazy(() => import("./routes/Subscribe"));
const Worker = lazy(() => import("./routes/Worker"));
const Status = lazy(() => import("./routes/Status"));
const WardDetail = lazy(() => import("./routes/WardDetail"));
export default function App() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const prefs = usePreferences();
  const [menu, setMenu] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const requestedMode =
    params.get("mode") === "replay"
      ? "replay"
      : params.get("mode") === "whatif"
        ? "whatif"
        : "live";
  const query = useDataset(requestedMode, params.get("episode"));
  const data = query.data;
  const state = validatedParams(
    params,
    data?.manifest.meta.dates || [],
    data?.registry.wards.map((w) => w.id) || [],
  );
  const lang =
    params.get("lang") && ["en", "hi", "mr"].includes(params.get("lang")!)
      ? params.get("lang")!
      : prefs.lang;
  useEffect(() => {
    void i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang, i18n]);
  useEffect(() => {
    const online = () => setOffline(!navigator.onLine);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  useEffect(() => {
    setMenu(false);
    document.title = `HeatGuard AI · ${location.pathname === "/" ? t("nav.overview") : location.pathname.slice(1).split("/")[0]}`;
    if (location.pathname !== "/")
      setTimeout(() => document.getElementById("page-title")?.focus(), 30);
  }, [location.pathname, t]);
  const update = (values: Record<string, string>) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [k, v] of Object.entries(values))
          v ? next.set(k, v) : next.delete(k);
        return next;
      },
      { replace: true },
    );
  const exit = () => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const k of ["mode", "episode", "scenario", "date", "t"])
        next.delete(k);
      return next;
    });
  };
  const meta = data?.manifest.meta;
  const stale =
    !!meta &&
    requestedMode === "live" &&
    Date.now() - new Date(meta.issued_at).getTime() > 21600000;
  const routes = [
    ["/", "nav.overview"],
    ["/authority", "nav.authority"],
    ["/worker", "nav.worker"],
    ["/scenarios", "nav.scenarios"],
    ["/subscribe", "nav.subscribe"],
    ["/methods", "nav.methods"],
    ["/status", "nav.status"],
  ];
  return (
    <>
      <a className="skip-link" href="#main">
        {t("common.skip")}
      </a>
      <header className="global-header">
        <div className="header-inner">
          <RouteLink to="/" className="brand">
            <img src="/icons/logo-mark.svg" width="38" height="42" alt="" />
            <span>
              <strong>
                HeatGuard <em>AI</em>
              </strong>
              <small>Predict heat. Protect people.</small>
            </span>
          </RouteLink>
          <div className="header-edition">
            <span className="eyebrow">PUNE / HEAT EARLY WARNING</span>
            <span>
              Research prototype · {meta?.model_id || "Static data first"}
            </span>
          </div>
          <div className="header-controls">
            <div
              role="group"
              aria-label={t("common.language")}
              className="language-switch"
            >
              {[
                ["en", "EN"],
                ["hi", "हिंदी"],
                ["mr", "मराठी"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  lang={key}
                  aria-pressed={lang === key}
                  onClick={() => {
                    prefs.set("lang", key);
                    update({ lang: key });
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              className="menu-button"
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-controls="main-nav"
            >
              {t("nav.menu")}
            </button>
          </div>
        </div>
        <nav
          id="main-nav"
          className={`global-nav ${menu ? "open" : ""}`}
          aria-label="Main navigation"
        >
          {routes.map(([path, key]) => (
            <NavLink
              key={path}
              end={path === "/"}
              to={`${path}${location.search}`}
            >
              {t(key)}
            </NavLink>
          ))}
          <span className="nav-edition">PCCOE GRAND CHALLENGE 2026</span>
        </nav>
      </header>
      <div className="status-region" role="status" aria-live="polite">
        {(requestedMode !== "live" || meta?.is_simulation) && (
          <div className="simulation-banner">
            <strong>SIMULATION</strong>
            <span>
              {requestedMode === "replay"
                ? `Replay · ${meta?.dates[0] || params.get("episode") || "episode unavailable"} · not a live forecast.`
                : "What-if · independent perturbation, not a new forecast."}
            </span>
            <button onClick={exit}>{t("scenario.exit")}</button>
          </div>
        )}
        {offline && (
          <div className="state-strip">
            {t(data ? "state.offline" : "state.offlineEmpty")}
          </div>
        )}
        {stale && (
          <div className="state-strip">
            {t("state.stale", { time: timeLabel(meta?.issued_at) })}
          </div>
        )}
        {data?.updateError && (
          <div className="state-strip">
            {t("state.failed")} Last verified snapshot retained.
          </div>
        )}
        {data?.diagnostic && (
          <div className="state-strip">
            Incomplete calculation · diagnostic data only. Required inputs are
            missing; live alert delivery is blocked.
          </div>
        )}
        {lang !== "en" && (
          <div className="state-strip">{t("state.translation")}</div>
        )}
      </div>
      <main
        id="main"
        className={`frame density-${location.pathname === "/authority" ? "compact" : prefs.density}`}
      >
        {query.isPending ? (
          <Skeleton />
        ) : !data ? (
          <Empty title={t("state.noForecast")}>
            <p>
              No validated snapshot could be loaded. Run the documented
              preparation pipeline; no synthetic forecast is substituted.
            </p>
            {requestedMode === "replay" && (
              <button onClick={exit}>{t("scenario.exit")}</button>
            )}
            <button onClick={() => void query.refetch()}>
              {t("common.retry")}
            </button>
            <RouteLink to="/methods">{t("nav.methods")}</RouteLink>
          </Empty>
        ) : (
          <Suspense fallback={<Skeleton />}>
            <Routes>
              <Route
                path="/"
                element={<Overview data={data} state={state} update={update} />}
              />
              <Route
                path="/ward/:id"
                element={
                  <WardDetail data={data} date={state.date} hour={state.hour} />
                }
              />
              <Route
                path="/authority"
                element={
                  <Authority
                    data={data}
                    date={state.date}
                    stale={stale}
                    offline={offline}
                  />
                }
              />
              <Route path="/methods" element={<Methods data={data} />} />
              <Route
                path="/scenarios"
                element={<Scenarios data={data} update={update} />}
              />
              <Route
                path="/subscribe"
                element={<Subscribe data={data} offline={offline} />}
              />
              <Route
                path="/worker"
                element={<Worker data={data} date={state.date} />}
              />
              <Route path="/status" element={<Status data={data} />} />
              <Route
                path="*"
                element={
                  <Empty title={t("state.notFound")}>
                    <RouteLink to="/">{t("common.returnList")}</RouteLink>
                  </Empty>
                }
              />
            </Routes>
          </Suspense>
        )}
      </main>
      <footer className="global-footer frame">
        <div>
          <strong>HeatGuard AI</strong>
          <p>
            Not just predicting heat — predicting human risk and enabling early
            action.
          </p>
          <small>
            AVCOE student team · PCCOE International Grand Challenge 2026, Pune.
            <br />
            Independent research prototype. No PMC/IMD affiliation or
            operational national alert connection.
          </small>
        </div>
        <div className="footer-sources">
          <p>
            Weather: <a href="https://open-meteo.com/">Open-Meteo</a> · derived
            calculations, CC BY 4.0
          </p>
          <p>
            Ward boundaries:{" "}
            <a href="https://github.com/datameet/Municipal_Spatial_Data/tree/master/Pune">
              DataMeet, 2022
            </a>{" "}
            · historical electoral geography
          </p>
          <RouteLink to="/methods">{t("nav.methods")} / licences</RouteLink>
          <span>
            Source {meta?.git_sha.slice(0, 12) || "unavailable"} · Data{" "}
            {meta?.data_git_sha.slice(0, 12) || "unavailable"}
          </span>
        </div>
      </footer>
    </>
  );
}
