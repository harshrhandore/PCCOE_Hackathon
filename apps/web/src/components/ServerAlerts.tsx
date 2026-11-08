import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, ApiError, API_BASE } from "../data/client";
import type { Dataset } from "../data/types";
import type {
  ActionTemplate,
  DraftInput,
  ServerAlert,
  StaffRole,
} from "../data/alerts";
import { download } from "../lib/state";

export default function ServerAlerts({
  data,
  date,
  selected,
  token,
  role,
  userId,
  stale,
  offline,
  onSessionEnd,
}: {
  data: Dataset;
  date: string;
  selected: Set<string>;
  token: string;
  role: StaffRole;
  userId: string;
  stale: boolean;
  offline: boolean;
  onSessionEnd: () => void;
}) {
  const { t } = useTranslation();
  const cache = useQueryClient();
  const [audience, setAudience] = useState("citizen");
  const [actionIds, setActionIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mutationKey = useRef<{ body: string; key: string } | null>(null);
  const draftRef = useRef<DraftInput | null>(null);
  const live = useQuery({
    queryKey: ["staff-session", userId],
    queryFn: () =>
      api<{ role: StaffRole; user_id: string }>("/session", undefined, token),
    retry: false,
    refetchInterval: 30000,
  });
  const queue = useQuery({
    queryKey: ["staff-alerts", userId],
    queryFn: () => api<{ items: ServerAlert[] }>("/alerts", undefined, token),
    retry: false,
    refetchInterval: 15000,
  });
  const detail = useQuery({
    queryKey: ["staff-alert-detail", userId, activeId],
    enabled: !!activeId,
    queryFn: () =>
      api<{ alert: ServerAlert }>(`/alerts/${activeId}`, undefined, token),
    retry: false,
  });
  const audit = useQuery({
    queryKey: ["staff-audit", userId, activeId],
    enabled: !!activeId,
    queryFn: () =>
      api<{
        items: {
          event: string;
          created_at: string;
          after_state: Record<string, unknown>;
        }[];
      }>(`/alerts/${activeId}/audit`, undefined, token),
    retry: false,
  });
  const actions = useQuery({
    queryKey: ["action-library"],
    queryFn: async () => {
      const r = await fetch("/data/actions.json");
      if (!r.ok) throw new Error();
      return r.json() as Promise<{
        version: string;
        actions: ActionTemplate[];
      }>;
    },
    staleTime: Infinity,
  });
  const alert = detail.data?.alert;
  const currentRole = live.data?.role || role;
  const sessionReady = !!live.data && !live.isError;
  const rows = data.daily.filter(
    (r) => r.date === date && selected.has(r.ward_id),
  );
  const known =
    rows.length === selected.size &&
    rows.length > 0 &&
    rows.every(
      (r) => r.risk_level !== null && r.modifier_status === "complete",
    );
  const highest = known ? Math.max(...rows.map((r) => r.risk_level!)) : null;
  const applicable =
    actions.data?.actions.filter(
      (a) =>
        a.active &&
        a.audience === audience &&
        highest !== null &&
        a.levels.includes(highest),
    ) || [];
  const selectedActions = actionIds.filter((id) =>
    applicable.some((a) => a.id === id),
  );
  const canWrite =
    sessionReady &&
    ["officer", "approver"].includes(currentRole) &&
    !offline &&
    !busy;
  const sourceUnsafe =
    (!data.manifest.meta.is_simulation && stale) ||
    data.manifest.meta.publication_health !== "complete";
  useEffect(() => {
    for (const err of [live.error, queue.error, detail.error, audit.error])
      if (err instanceof ApiError && [401, 403].includes(err.status)) {
        onSessionEnd();
        break;
      }
  }, [live.error, queue.error, detail.error, audit.error, onSessionEnd]);

  async function perform(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      if (e instanceof ApiError && [401, 403].includes(e.status)) {
        setError(t(e.messageKey));
        if (e.code === "UNAUTHENTICATED") onSessionEnd();
      } else setError(t(e instanceof ApiError ? e.messageKey : "state.waking"));
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ["staff-alerts", userId] }),
      cache.invalidateQueries({ queryKey: ["staff-alert-detail", userId] }),
      cache.invalidateQueries({ queryKey: ["staff-audit", userId] }),
    ]);
  }
  function input(): DraftInput {
    if (!known || highest === null || !selectedActions.length)
      throw new Error("invalid-draft");
    return {
      snapshot_id: data.manifest.snapshot_id,
      ward_ids: [...selected].sort(),
      risk_level: highest,
      audience,
      languages: ["en"],
      action_ids: selectedActions,
      onset: `${date}T00:00:00+05:30`,
      expires: new Date(Date.now() + 24 * 3600000).toISOString(),
    };
  }
  function requestKey(body: unknown) {
    const key = JSON.stringify(body);
    if (mutationKey.current?.body !== key)
      mutationKey.current = { body: key, key: crypto.randomUUID() };
    return mutationKey.current.key;
  }
  async function createDraft() {
    const previous = draftRef.current;
    const body = input();
    // Keep the same payload/key after an ambiguous network result. A new target set
    // gets a fresh key, while explicit revision updates use the server's revision.
    if (
      !previous ||
      JSON.stringify({ ...previous, expires: "" }) !==
        JSON.stringify({ ...body, expires: "" })
    )
      draftRef.current = body;
    const stable = draftRef.current!;
    const key = requestKey(stable);
    let value: { alert: ServerAlert };
    try {
      value = await api<{ alert: ServerAlert }>(
        "/alerts/draft",
        stable,
        token,
        "POST",
        key,
      );
    } catch (e) {
      if (e instanceof ApiError) {
        draftRef.current = null;
        mutationKey.current = null;
      }
      throw e;
    }
    setActiveId(value.alert.id);
    draftRef.current = null;
    mutationKey.current = null;
    await refresh();
    setNotice(t("authority.server.created"));
  }
  async function mutate(kind: "approve" | "send" | "cancel") {
    if (!alert) return;
    const body =
      kind === "approve"
        ? {
            expected_revision: alert.revision,
            content_sha256: alert.content_sha256,
          }
        : kind === "send"
          ? { expected_revision: alert.revision, delivery_mode: "test" }
          : { expected_revision: alert.revision, reason_code: "withdrawn" };
    await api(
      `/alerts/${alert.id}/${kind}`,
      body,
      token,
      "POST",
      requestKey({ id: alert.id, kind, ...body }),
    );
    await refresh();
    setNotice(t(`authority.server.${kind}Result`));
  }
  async function revise() {
    if (!alert) return;
    const body = input();
    await api(
      `/alerts/${alert.id}`,
      {
        expected_revision: alert.revision,
        ward_ids: body.ward_ids,
        languages: body.languages,
        action_ids: body.action_ids,
        onset: body.onset,
        expires: body.expires,
      },
      token,
      "PATCH",
    );
    await refresh();
    setNotice(t("authority.server.revised"));
  }
  async function capDownload() {
    if (!alert) return;
    const response = await fetch(`${API_BASE}/alerts/${alert.id}/cap.xml`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) {
      const v = await response.json();
      throw new ApiError(
        v.error?.code,
        response.status,
        v.error?.message_key || "state.waking",
      );
    }
    download(
      `heatguard-${alert.id}-r${alert.revision}.xml`,
      await response.text(),
      "application/cap+xml",
    );
  }
  const alertUnsafe =
    alert &&
    (Date.parse(alert.expires_at) <= Date.now() ||
      !Number.isFinite(Date.parse(alert.expires_at)) ||
      (!alert.is_simulation &&
        (!Number.isFinite(Date.parse(alert.content.snapshot_issued_at)) ||
          Date.now() - Date.parse(alert.content.snapshot_issued_at) >
            21600000)));
  return (
    <section
      className="server-workspace"
      aria-label={t("authority.server.workspace")}
    >
      <h2>{t("authority.server.workspace")}</h2>
      <p>{t("authority.server.role", { role: currentRole })}</p>
      {(error || live.isError || queue.isError || detail.isError) && (
        <p role="alert" className="note">
          {error || t("state.waking")}
        </p>
      )}
      <p role="status">{busy ? t("authority.server.pending") : notice}</p>
      <div className="composer-layout">
        <section>
          <h3>{t("authority.server.audience")}</h3>
          <label>
            {t("common.audience")}
            <select
              value={audience}
              onChange={(e) => {
                setAudience(e.target.value);
                setActionIds([]);
              }}
              disabled={!canWrite}
            >
              {[
                "citizen",
                "outdoor_worker",
                "authority",
                "school_anganwadi",
                "care_home",
              ].map((a) => (
                <option key={a} value={a}>
                  {t(
                    {
                      citizen: "audience.citizen",
                      outdoor_worker: "audience.worker",
                      authority: "audience.authority",
                      school_anganwadi: "audience.school",
                      care_home: "audience.careHome",
                    }[a]!,
                  )}
                </option>
              ))}
            </select>
          </label>
          <p>
            {t("table.selected", { count: selected.size })} · {date} ·{" "}
            {t("authority.server.level", {
              level: highest ?? t("common.unavailable"),
            })}
          </p>
          <p className="provenance-text">{t("authority.server.english")}</p>
          <fieldset>
            <legend>{t("authority.server.actions")}</legend>
            {applicable.map((a) => (
              <label key={a.id} className="checkbox-row" lang="en">
                <input
                  type="checkbox"
                  disabled={!canWrite}
                  checked={selectedActions.includes(a.id)}
                  onChange={(e) =>
                    setActionIds((ids) =>
                      e.target.checked
                        ? [...ids, a.id]
                        : ids.filter((id) => id !== a.id),
                    )
                  }
                />
                <span>
                  {a.text_en}
                  <small>
                    {a.source_section}
                    {a.requires_confirmation
                      ? " · " + t("authority.server.confirmation")
                      : ""}
                  </small>
                </span>
              </label>
            ))}
            {!applicable.length && <p>{t("authority.server.noAction")}</p>}
          </fieldset>
          <p>{t("authority.server.expiry")}</p>
          {sourceUnsafe && <p className="note">{t("authority.staleBlock")}</p>}
          <div className="button-row">
            <button
              className="primary"
              disabled={
                !canWrite || !known || !selectedActions.length || sourceUnsafe
              }
              onClick={() => void perform(createDraft)}
            >
              {t("authority.submit")}
            </button>
            {alert?.status === "draft" && (
              <button
                disabled={
                  !canWrite || !known || !selectedActions.length || sourceUnsafe
                }
                onClick={() => void perform(revise)}
              >
                {t("authority.server.revise")}
              </button>
            )}
          </div>
          <h3>{t("authority.server.queue")}</h3>
          <button
            disabled={busy || offline}
            onClick={() => void perform(refresh)}
          >
            {t("common.retry")}
          </button>
          {queue.isPending ? (
            <p>{t("authority.server.loading")}</p>
          ) : !queue.data?.items.length ? (
            <p>{t("state.noAlerts")}</p>
          ) : (
            <ul className="server-alert-list">
              {queue.data.items.map((a) => (
                <li key={a.id}>
                  <button
                    aria-pressed={activeId === a.id}
                    onClick={() => setActiveId(a.id)}
                  >
                    {a.cap_status} · {a.status} · r{a.revision}
                    <small>{a.id}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="alert-composer">
          <h3>{t("authority.preview")}</h3>
          {!alert ? (
            <p>{t("authority.server.choose")}</p>
          ) : (
            <>
              <p>
                <strong>
                  {alert.status} · r{alert.revision} · {alert.cap_status}
                </strong>
              </p>
              <div className="simulation-banner">
                <strong>{alert.is_simulation ? "SIMULATION" : "TEST"}</strong>
                <span>{t("authority.server.restricted")}</span>
              </div>
              <pre className="channel-preview" lang="en">
                {alert.content.text}
              </pre>
              <p className="provenance-text">SHA-256 {alert.content_sha256}</p>
              <p>{t("authority.server.expires", { time: alert.expires_at })}</p>
              <div className="button-row">
                <button
                  disabled={!sessionReady || busy || offline}
                  onClick={() => void perform(capDownload)}
                >
                  {t("authority.cap")}
                </button>
                {alert.status === "draft" && (
                  <button
                    disabled={
                      !sessionReady ||
                      currentRole !== "approver" ||
                      alert.created_by === userId ||
                      busy ||
                      offline ||
                      !!alertUnsafe
                    }
                    onClick={() => void perform(() => mutate("approve"))}
                  >
                    {t("authority.approve")}
                  </button>
                )}
                {alert.status === "approved" && (
                  <button
                    disabled={
                      !sessionReady ||
                      currentRole !== "approver" ||
                      busy ||
                      offline ||
                      (alert.delivery_summary?.unknown || 0) > 0 ||
                      (alert.delivery_summary?.sending || 0) > 0 ||
                      !!alertUnsafe
                    }
                    onClick={() => void perform(() => mutate("send"))}
                  >
                    {t("authority.sendTest")}
                  </button>
                )}
                {["draft", "approved"].includes(alert.status) && (
                  <button
                    disabled={
                      !sessionReady ||
                      busy ||
                      offline ||
                      !(
                        currentRole === "approver" ||
                        (currentRole === "officer" &&
                          alert.status === "draft" &&
                          alert.created_by === userId)
                      )
                    }
                    onClick={() => void perform(() => mutate("cancel"))}
                  >
                    {t("authority.cancelAlert")}
                  </button>
                )}
              </div>
              {alert.created_by === userId && alert.status === "draft" && (
                <p>{t("authority.independent")}</p>
              )}
              {!!alertUnsafe && (
                <p className="note">{t("authority.staleBlock")}</p>
              )}
              <h3>{t("authority.server.deliveries")}</h3>
              <p>{t("authority.server.unknown")}</p>
              <dl>
                {Object.entries(alert.delivery_summary || {}).map(
                  ([status, count]) => (
                    <div key={status}>
                      <dt>{status}</dt>
                      <dd>{count}</dd>
                    </div>
                  ),
                )}
              </dl>
              <details>
                <summary>{t("authority.audit")}</summary>
                {audit.isError ? (
                  <p>{t("state.waking")}</p>
                ) : (
                  <ol>
                    {audit.data?.items.map((event, i) => (
                      <li key={i}>
                        {event.event} · {event.created_at}
                        <pre>{JSON.stringify(event.after_state, null, 2)}</pre>
                      </li>
                    ))}
                  </ol>
                )}
              </details>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
