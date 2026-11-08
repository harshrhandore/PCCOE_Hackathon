import { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Dataset, Daily } from "../data/types";
import { PageHeading, RiskChip } from "../components/Shared";
import { number, csvCell, download } from "../lib/state";
import { api } from "../data/client";
import ServerAlerts from "../components/ServerAlerts";
import type { StaffRole } from "../data/alerts";
type LocalAlert = {
  status: "draft" | "approved" | "simulated" | "cancelled";
  revision: number;
  creator: string;
  approver?: string;
  text: string;
  digest: string;
  events: string[];
};
export default function Authority({
  data,
  date,
  stale,
  offline,
}: {
  data: Dataset;
  date: string;
  stale: boolean;
  offline: boolean;
}) {
  const { t } = useTranslation();
  const [demo, setDemo] = useState(false);
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const cache = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actor, setActor] = useState("officer");
  const [alert, setAlert] = useState<LocalAlert | null>(null);
  const [step, setStep] = useState(0);
  const [guide, setGuide] = useState<number | null>(null);
  const clearSession = useCallback(() => {
    setToken("");
    setRole("");
    setUserId("");
    setExpiresAt(0);
    setPassword("");
    cache.removeQueries({
      predicate: (q) => String(q.queryKey[0]).startsWith("staff-"),
    });
  }, [cache]);
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(clearSession, Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt, clearSession]);
  useEffect(
    () => () => {
      cache.removeQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("staff-"),
      });
    },
    [cache],
  );
  const rows = useMemo(
    () =>
      data.daily
        .filter((r) => r.date === date)
        .filter((r) => {
          const w = data.registry.wards.find((w) => w.id === r.ward_id);
          return w?.name_en
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase());
        })
        .sort(
          (a, b) =>
            (b.risk_level ?? -1) - (a.risk_level ?? -1) ||
            (b.priority_score ?? -1) - (a.priority_score ?? -1) ||
            a.ward_id.localeCompare(b.ward_id),
        ),
    [data, date, search],
  );
  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await api<{ access_token: string; expires_in: number }>(
        "/auth/login",
        {
          email,
          password,
        },
      );
      const member = await api<{ role: StaffRole; user_id: string }>(
        "/session",
        undefined,
        session.access_token,
      );
      setToken(session.access_token);
      setRole(member.role);
      setUserId(member.user_id);
      setExpiresAt(Date.now() + session.expires_in * 1000);
      setPassword("");
    } catch {
      setError(
        "Authority authentication is unavailable or this account has no current active membership. Configure Supabase Auth, JWKS and the database.",
      );
    } finally {
      setBusy(false);
    }
  }
  function select(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function exportCSV() {
    const header = [
      "ward",
      "ward_id",
      "date_IST",
      "risk_level",
      "hazard_level",
      "vulnerability",
      "priority_score",
      "peak_utci_C",
      "peak_wbgt_C",
      "night_min_C",
      "boundary_vintage",
      "issued_at_UTC",
      "model_run",
      "method_version",
      "is_simulation",
    ];
    download(
      "heatguard-bulletin.csv",
      [
        header,
        ...rows.map((r) => [
          data.registry.wards.find((w) => w.id === r.ward_id)?.name_en,
          r.ward_id,
          date,
          r.risk_level,
          r.hazard_level,
          r.vulnerability,
          r.priority_score,
          r.peak_utci,
          r.peak_wbgt,
          r.night_min_t,
          "2022",
          data.manifest.meta.issued_at,
          data.manifest.meta.model_run,
          data.manifest.meta.method_version,
          demo || data.manifest.meta.is_simulation,
        ]),
      ]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n"),
      "text/csv;charset=utf-8",
    );
  }
  async function draft() {
    setError("");
    const targeted = rows.filter((r) => selected.has(r.ward_id));
    if (!targeted.length) {
      setError("Please select at least one ward.");
      return;
    }
    const names = targeted
      .map((r) => data.registry.wards.find((w) => w.id === r.ward_id)?.name_en)
      .join("; ");
    const text = `SIMULATION — not a live forecast.\nLocal demo — no messages sent.\nHeatGuard AI · ${date}\nWards: ${names}. Boundary vintage 2022.\n${targeted.map((r) => `${r.ward_id}: risk ${r.risk_level ?? "unavailable"}, hazard ${r.hazard_level ?? "unavailable"}`).join("\n")}\nSource: Open-Meteo; thermofeel. Issued ${data.manifest.meta.issued_at}. Method ${data.manifest.meta.method_version}.\nSafety actions require the versioned source library; no arbitrary text is sent.`;
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text),
    );
    setAlert({
      status: "draft",
      revision: 1,
      creator: actor,
      text,
      digest: Array.from(new Uint8Array(hash), (v) =>
        v.toString(16).padStart(2, "0"),
      ).join(""),
      events: [`Draft r1 created by local ${actor}`],
    });
    setStep(1);
  }
  const guidance = [
    "Open the live bulletin, then select a real prepared replay in Scenarios.",
    "Jump to its computed peak and inspect the ward ranking.",
    "Open Why this level; distinguish hazard, vulnerability and risk.",
    "Compare Risk/Hazard; use weight sensitivity only when the cohort is available.",
    "Draft an Exercise preview. An independent configured approver and test recipient are required for real delivery.",
    "Open Methods validation. Missing model evaluation remains unavailable.",
    "Block API/tiles and verify the static view and boundary fallback.",
  ];
  if (!demo && !token)
    return (
      <>
        <PageHeading
          kicker="RESTRICTED WORKSPACE / TEST DELIVERY ONLY"
          title={t("nav.authority")}
        />
        <div className="authority-gate">
          <form className="paper-form" onSubmit={(e) => void signIn(e)}>
            <h2>{t("state.unauthorized")}</h2>
            <p>
              Active membership is checked server-side on every privileged
              operation. Public weather remains accessible without an account.
            </p>
            {error && (
              <p role="alert" className="note">
                {error}
              </p>
            )}
            <label>
              {t("authority.email")}
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              {t("authority.password")}
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button className="primary" disabled={busy || offline}>
              {busy ? "Checking membership…" : t("authority.signIn")}
            </button>
          </form>
          <aside>
            <p className="eyebrow">PRESENTER ACCESS</p>
            <h2>Inspect the workflow locally.</h2>
            <p>
              The local demo uses explicitly separate demo roles and simulated
              delivery. It does not authenticate an authority, contact a
              provider or replace the required server workflow.
            </p>
            <button onClick={() => setDemo(true)}>
              {t("authority.localDemo")}
            </button>
          </aside>
        </div>
      </>
    );
  return (
    <>
      <PageHeading kicker={`CONTROL ROOM · ${date}`} title={t("nav.authority")}>
        <div className="button-row">
          <button onClick={exportCSV}>{t("authority.csv")}</button>
          <button onClick={() => setGuide(0)}>Demo script</button>
          <button
            onClick={async () => {
              if (token) {
                try {
                  await api("/auth/logout", {}, token);
                } catch {
                  setError(t("authority.server.logoutFailure"));
                }
              }
              setDemo(false);
              clearSession();
              setAlert(null);
            }}
          >
            {t("authority.signOut")}
          </button>
        </div>
      </PageHeading>
      {demo && (
        <div className="simulation-banner">
          <strong>LOCAL DEMO</strong>
          <span>{t("authority.localDemo")}</span>
          <label>
            Demo identity
            <select value={actor} onChange={(e) => setActor(e.target.value)}>
              <option value="officer">Demo officer</option>
              <option value="approver">Demo approver</option>
            </select>
          </label>
        </div>
      )}
      {guide !== null && (
        <aside className="demo-guide" aria-label="Three-minute demo script">
          <strong>
            Step {guide + 1} / {guidance.length}
          </strong>
          <p>{guidance[guide]}</p>
          <div className="button-row">
            <button
              disabled={guide === 0}
              onClick={() => setGuide((i) => Math.max(0, (i ?? 0) - 1))}
            >
              Back
            </button>
            <button
              disabled={guide === guidance.length - 1}
              onClick={() =>
                setGuide((i) => Math.min(guidance.length - 1, (i ?? 0) + 1))
              }
            >
              Next
            </button>
            <button onClick={() => setGuide(null)}>Exit demo script</button>
          </div>
        </aside>
      )}
      {!demo && (
        <p>
          Authorized {role}. Production alert operations require a complete,
          fresh snapshot and configured channels.
        </p>
      )}
      {error && (
        <p role="alert" className="note">
          {error}
        </p>
      )}
      <div className="authority-tools">
        <label>
          {t("common.searchWard")}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button
          onClick={() =>
            setSelected((s) =>
              rows.every((r) => s.has(r.ward_id))
                ? new Set()
                : new Set(rows.map((r) => r.ward_id)),
            )
          }
        >
          {t("table.selectAll")} ({rows.length})
        </button>
        <strong>{selected.size} selected</strong>
      </div>
      <div className="authority-table table-scroll">
        <table>
          <caption>
            {date} IST · boundary vintage 2022 · data{" "}
            {data.manifest.meta.issued_at}
          </caption>
          <thead>
            <tr>
              <th>Select / Ward</th>
              <th>Risk</th>
              <th>Hazard</th>
              <th>Vulnerability</th>
              <th>Priority</th>
              <th>Peak UTCI °C</th>
              <th>Peak WBGT °C</th>
              <th>Night min °C</th>
              <th>IMD criteria</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ward_id}>
                <th>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={selected.has(r.ward_id)}
                      onChange={() => select(r.ward_id)}
                    />
                    {
                      data.registry.wards.find((w) => w.id === r.ward_id)
                        ?.name_en
                    }
                  </label>
                </th>
                <td>
                  <RiskChip level={r.risk_level} />
                </td>
                <td>
                  <RiskChip level={r.hazard_level} />
                </td>
                <td className="numeric">{number(r.vulnerability, 2)}</td>
                <td className="numeric">{number(r.priority_score)}</td>
                <td className="numeric">{number(r.peak_utci)}</td>
                <td className="numeric">{number(r.peak_wbgt)}</td>
                <td className="numeric">{number(r.night_min_t)}</td>
                <td>
                  {r.imd_flag.replaceAll("_", " ")}
                  <small>Indicative only</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="authority-mobile-list">
        {rows.map((r) => (
          <details key={r.ward_id}>
            <summary>
              {data.registry.wards.find((w) => w.id === r.ward_id)?.name_en}
            </summary>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={selected.has(r.ward_id)}
                onChange={() => select(r.ward_id)}
              />
              Select ward
            </label>
            <p>
              Risk {r.risk_level ?? "unavailable"} · Hazard{" "}
              {r.hazard_level ?? "unavailable"} · Priority{" "}
              {number(r.priority_score)}
            </p>
            <p>
              UTCI {number(r.peak_utci)} °C · WBGT {number(r.peak_wbgt)} °C
            </p>
          </details>
        ))}
      </div>
      {!demo ? (
        <ServerAlerts
          data={data}
          date={date}
          selected={selected}
          token={token}
          role={role as StaffRole}
          userId={userId}
          stale={stale}
          offline={offline}
          onSessionEnd={clearSession}
        />
      ) : (
        <div className="composer-layout">
          <section>
            <p className="eyebrow">ACTION QUEUE</p>
            <h2>Plan. Review. Confirm.</h2>
            <p>
              Municipal action confirmation is separate from alert approval. No
              facility is represented as an open cooling centre.
            </p>
            <p className="note">
              Sourced actions resolve to the versioned library. No LLM or
              arbitrary free text enters delivery.
            </p>
            <button
              className="primary"
              disabled={!selected.size || offline || !demo}
              onClick={() => void draft()}
            >
              {demo
                ? "Draft local Exercise preview"
                : "Use configured server alert API"}
            </button>
            {!demo && (
              <p>
                The server endpoints enforce independent approval; this
                prototype UI currently exposes local walkthrough only.
              </p>
            )}
          </section>
          <section className="alert-composer">
            <ol className="composer-steps">
              {["Audience & wards", "Preview", "Approval", "Delivery"].map(
                (s, i) => (
                  <li key={s} aria-current={step === i ? "step" : undefined}>
                    {i + 1}. {s}
                  </li>
                ),
              )}
            </ol>
            {alert ? (
              <>
                <div className="alert-status">
                  <strong>
                    {alert.status} · r{alert.revision}
                  </strong>
                  <span>Exercise / LOCAL ONLY</span>
                </div>
                <pre className="channel-preview">{alert.text}</pre>
                <p className="provenance-text">SHA-256 {alert.digest}</p>
                <div className="button-row">
                  {alert.status === "draft" && (
                    <button
                      disabled={actor !== "approver" || actor === alert.creator}
                      onClick={() => {
                        setAlert((a) =>
                          a
                            ? {
                                ...a,
                                status: "approved",
                                approver: actor,
                                events: [
                                  ...a.events,
                                  "Exact r1 digest approved by independent local approver",
                                ],
                              }
                            : null,
                        );
                        setStep(2);
                      }}
                    >
                      Approve local revision
                    </button>
                  )}
                  {alert.status === "approved" && (
                    <button
                      disabled={actor !== "approver"}
                      onClick={() => {
                        setAlert((a) =>
                          a
                            ? {
                                ...a,
                                status: "simulated",
                                events: [
                                  ...a.events,
                                  "Delivery intentionally simulated; no provider contacted",
                                ],
                              }
                            : null,
                        );
                        setStep(3);
                      }}
                    >
                      Simulate delivery
                    </button>
                  )}
                  <button
                    disabled={
                      alert.status === "simulated" ||
                      alert.status === "cancelled"
                    }
                    onClick={() =>
                      setAlert((a) =>
                        a
                          ? {
                              ...a,
                              status: "cancelled",
                              events: [...a.events, "Local alert cancelled"],
                            }
                          : null,
                      )
                    }
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      download("heatguard-local-preview.txt", alert.text)
                    }
                  >
                    Download preview
                  </button>
                </div>
                {alert.status === "draft" && (
                  <p>{t("authority.independent")}</p>
                )}
                <details>
                  <summary>Local audit walkthrough</summary>
                  <ol>
                    {alert.events.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ol>
                </details>
                <p>
                  CAP XSD-validated export is available through the authorized
                  API. Local preview does not claim a frozen server alert or
                  real delivery.
                </p>
              </>
            ) : (
              <p>
                Select wards to begin a local draft. Provider previews never
                send a message.
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
