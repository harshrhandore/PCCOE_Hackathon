import { lazy, Suspense, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
const SourceDialog = lazy(() => import("./SourceDialog"));
import { Link, useLocation } from "react-router-dom";
import type { Level, Dataset, Daily } from "../data/types";
import { dateLabel, timeLabel, number } from "../lib/state";
export function RiskChip({ level, label }: { level: Level; label?: string }) {
  const { t } = useTranslation();
  return (
    <span className={`risk-chip level-${level ?? "unknown"}`}>
      {label && <span>{label} </span>}
      {level === null ? t("common.unavailable") : t(`level.${level}`)}
    </span>
  );
}
export function RouteLink({
  to,
  children,
  params,
  ...props
}: {
  to: string;
  children: ReactNode;
  className?: string;
  params?: Record<string, string>;
}) {
  const l = useLocation();
  const search = new URLSearchParams(l.search);
  for (const [key, value] of Object.entries(params || {}))
    value ? search.set(key, value) : search.delete(key);
  return (
    <Link to={`${to}${search.size ? `?${search}` : ""}`} {...props}>
      {children}
    </Link>
  );
}
export function SourceChip({
  data,
  field,
  children,
}: {
  data: Dataset;
  field?: Daily;
  children?: ReactNode;
}) {
  const meta = data.manifest.meta;
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() {
    setOpen(false);
    setTimeout(() => {
      if (trigger.current?.isConnected) trigger.current.focus();
    }, 0);
  }
  return (
    <>
      <button
        ref={trigger}
        className="source-chip"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {children ||
          `${meta.model_id} · ${field?.indices_quality || "model-based"} · ${timeLabel(meta.issued_at)} IST`}{" "}
        <span aria-hidden="true">↗</span>
      </button>
      {open && (
        <Suspense fallback={<p role="status">Loading source details…</p>}>
          <SourceDialog data={data} field={field} onClose={close} />
        </Suspense>
      )}
    </>
  );
}

export function Skeleton() {
  const { t } = useTranslation();
  return (
    <div
      className="skeleton-shell"
      aria-busy="true"
      aria-label={t("state.fetching")}
    >
      <div className="skeleton headline" />
      <div className="skeleton-grid">
        <div className="skeleton" />
        <div className="skeleton map" />
        <div className="skeleton" />
      </div>
      <p>{t("state.fetching")}</p>
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function PageHeading({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {kicker && <p className="eyebrow">{kicker}</p>}
        <h1 tabIndex={-1} id="page-title">
          {title}
        </h1>
      </div>
      {children}
    </header>
  );
}
export function Metrics({ row }: { row: Daily }) {
  const { t } = useTranslation();
  return (
    <dl className="metric-grid">
      {row.risk_basis !== "hazard_only" && (
        <>
          <div>
            <dt>{t("field.risk")}</dt>
            <dd>
              <RiskChip level={row.risk_level} />
            </dd>
          </div>
        </>
      )}
      <div>
        <dt>
          {row.risk_basis === "hazard_only"
            ? "Heat-stress screening"
            : t("field.hazard")}
        </dt>
        <dd>
          <RiskChip level={row.hazard_level} />
        </dd>
      </div>
      {row.vulnerability !== null && (
        <>
          <div>
            <dt>{t("field.vulnerability")}</dt>
            <dd className="numeric">
              {number(row.vulnerability, 2)}
              <span className="metric-unit"> / 1</span>
            </dd>
          </div>
        </>
      )}
      {row.priority_score !== null && (
        <>
          <div>
            <dt>{t("field.priority")}</dt>
            <dd className="numeric">
              {number(row.priority_score)}
              <span className="metric-unit"> / 100</span>
            </dd>
          </div>
        </>
      )}
    </dl>
  );
}
export function Legend({
  layer = "risk",
  data,
}: {
  layer?: string;
  data: Dataset;
}) {
  const { t } = useTranslation();
  return (
    <div className="legend">
      <p className="eyebrow">
        {layer === "vulnerability"
          ? t("field.vulnerability")
          : layer === "hazard"
            ? t("field.hazard")
            : t("field.dailyRisk")}
      </p>
      {layer === "vulnerability" ? (
        <p>{t("common.unavailable")} · complete cohort required</p>
      ) : (
        <div className="legend-levels">
          {data.methods.utci.names.map((_, i) => (
            <RiskChip key={i} level={i as Level} />
          ))}
          <RiskChip level={null} />
        </div>
      )}
    </div>
  );
}
export function DateTabs({
  data,
  date,
  onChange,
}: {
  data: Dataset;
  date: string;
  onChange: (d: string) => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <div className="date-tabs" role="group" aria-label={t("common.date")}>
      {data.manifest.meta.dates.map((d) => (
        <button key={d} aria-pressed={d === date} onClick={() => onChange(d)}>
          {dateLabel(d, i18n.language)}
        </button>
      ))}
    </div>
  );
}
export function Rules({ row, data }: { row: Daily; data: Dataset }) {
  const { t } = useTranslation();
  return (
    <details className="rule-disclosure">
      <summary>{t("detail.why")}</summary>
      <p>{t("methods.prototypeRule")}</p>
      <ol className="rule-list">
        {row.hazard_rule_fired.map((r) => (
          <li key={r.id}>
            <strong>{r.id}</strong>
            <span className="rule-status">{r.status.replace("_", " ")}</span>
            <pre>{JSON.stringify(r.inputs, null, 2)}</pre>
            <details>
              <summary>Threshold · v{r.method_version}</summary>
              <pre>{JSON.stringify(r.threshold, null, 2)}</pre>
            </details>
          </li>
        ))}
        <li>
          <strong>VULNERABILITY_TOP20</strong>
          <p>
            {row.vulnerability === null
              ? t("detail.hazardOnly")
              : t("detail.bump")}
          </p>
        </li>
      </ol>
      <SourceChip data={data} field={row} />
    </details>
  );
}
