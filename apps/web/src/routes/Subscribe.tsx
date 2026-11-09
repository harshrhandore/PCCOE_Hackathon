import type { Dataset } from "../data/types";
import { PageHeading, RouteLink } from "../components/Shared";
export default function Subscribe(_: { data: Dataset; offline: boolean }) {
  return (
    <>
      <PageHeading
        kicker="OPTIONAL INTEGRATION"
        title="Alert delivery is unavailable"
      />
      <div className="paper-form">
        <p>
          This local prototype does not register subscribers or send alerts.
          Telegram ownership confirmation and delivery have not been configured
          or verified.
        </p>
        <p>
          No personal information is requested. You can download a source-linked
          planning brief from a ward bulletin without an account.
        </p>
        <RouteLink className="button primary" to="/">
          Choose a ward
        </RouteLink>
        <RouteLink className="button" to="/authority">
          Inspect the simulated approval workflow
        </RouteLink>
      </div>
    </>
  );
}
