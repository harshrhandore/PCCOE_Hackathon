import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Dataset } from "../data/types";
import { PageHeading } from "../components/Shared";
import { api } from "../data/client";
export default function Subscribe({
  data,
  offline,
}: {
  data: Dataset;
  offline: boolean;
}) {
  const { t } = useTranslation();
  const [ward, setWard] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    confirmation: { url?: string; expires_at: string };
  } | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!ward) {
      setError(t("validation.ward"));
      return;
    }
    if (!consent) {
      setError(t("validation.consent"));
      return;
    }
    setPending(true);
    try {
      setResult(
        await api("/subscriptions", {
          channel: "telegram",
          ward_id: ward,
          lang: "en",
          audience: "citizen",
          consent: true,
          consent_version: "1.0.0",
        }),
      );
    } catch {
      setError(
        "Telegram registration is unavailable. No subscription has been created. Configure the API, bot, webhook, and encryption keys.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <PageHeading
        kicker="VOLUNTARY / NO PHONE NUMBER"
        title={t("nav.subscribe")}
      />
      <div className="subscription-layout">
        <form onSubmit={(e) => void submit(e)} className="paper-form">
          <h2>One ward. Useful updates.</h2>
          <p>
            Prototype alerts use test recipients only. Telegram requires your
            Start confirmation before a subscription can activate.
          </p>
          {error && (
            <p role="alert" className="note" tabIndex={-1}>
              {error}
            </p>
          )}
          <label>
            {t("common.chooseWard")}
            <select
              value={ward}
              required
              onChange={(e) => setWard(e.target.value)}
            >
              <option value="">{t("common.chooseWard")}</option>
              {data.registry.wards.map((w) => (
                <option value={w.id} key={w.id}>
                  {w.name_en}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("common.language")}
            <select defaultValue="en">
              <option value="en">English</option>
              <option disabled>हिंदी · review pending</option>
              <option disabled>मराठी · review pending</option>
            </select>
          </label>
          <fieldset>
            <legend>Delivery channel</legend>
            <label className="checkbox-row">
              <input type="radio" name="channel" checked readOnly />
              Telegram · ownership confirmed through Start
            </label>
            <p className="provenance-text">
              Web Push: P1, not configured. Email: P2, disabled. SMS/WhatsApp:
              previews only.
            </p>
          </fieldset>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I consent to HeatGuard prototype alerts for this ward. My Telegram
              endpoint will be encrypted. I can delete all subscriptions using
              /stop.
            </span>
          </label>
          <p>
            Consent lasts at most 12 months without renewal. Unconfirmed
            registrations expire after 24 hours. Confirmation tokens expire
            within 30 minutes.
          </p>
          <button className="primary" disabled={pending || offline}>
            {pending
              ? "Preparing confirmation…"
              : offline
                ? "Connect to finish subscribing"
                : "Continue to Telegram"}
          </button>
          {result && (
            <div className="note">
              <strong>{result.status}</strong>
              {result.confirmation.url && (
                <a className="button" href={result.confirmation.url}>
                  Open Telegram and press Start
                </a>
              )}
              <p>
                Expires {result.confirmation.expires_at}. Registration is
                pending until the validated bot webhook confirms ownership.
              </p>
            </div>
          )}
        </form>
        <aside className="subscription-note">
          <p className="eyebrow">YOUR DATA</p>
          <h2>Consent comes before delivery.</h2>
          <ol>
            <li>Choose a ward and explicitly consent.</li>
            <li>Open the bot and press Start.</li>
            <li>
              Receive a test advisory only after approved delivery is
              configured.
            </li>
          </ol>
          <h3>Leave at any time</h3>
          <p>
            Send /stop to the bot to delete subscriptions across all wards and
            languages. A once-shown deletion token also authorizes browser
            deletion; an ID alone cannot delete a subscription.
          </p>
          <p>
            No names, phone numbers, health history or location history are
            collected. Hashes and encrypted endpoints are personal data.
          </p>
        </aside>
      </div>
    </>
  );
}
