import { useQuery } from "@tanstack/react-query";
import type { Dataset } from "../data/types";
import { PageHeading, RouteLink } from "../components/Shared";

export default function Presenter({ data }: { data: Dataset }) {
  const catalog = useQuery({
    queryKey: ["replay-catalog"],
    networkMode: "always",
    queryFn: async () => {
      const r = await fetch("/data/replay/catalog.json");
      if (!r.ok) throw new Error("Replay catalog unavailable");
      return r.json() as Promise<{ id: string; start: string; end: string }[]>;
    },
  });
  const episode = catalog.data?.[0];
  const first = data.registry.wards[0];
  const params = episode
    ? {
        mode: "replay",
        episode: episode.id,
        date: episode.start,
        ward: first.id,
        t: "14",
      }
    : undefined;
  return (
    <>
      <PageHeading
        kicker="THREE-MINUTE GUIDED CASE"
        title="From heat evidence to a planning brief"
      />
      <p>
        A local planner needs to understand the conditions behind a ward's
        screening level and prepare an evidence-linked brief for review. This
        case demonstrates that task using saved historical weather, with no
        account or message delivery.
      </p>
      <ol className="case-steps">
        <li>
          <h2>Inspect a real prepared episode</h2>
          <p>
            {episode
              ? `${episode.start} to ${episode.end}, ERA5 reanalysis. This is historical replay, not an as-issued forecast or evidence of prediction accuracy.`
              : catalog.isPending
                ? "Loading the prepared episode…"
                : "Prepared replay unavailable. No substitute data are generated."}
          </p>
          {params && (
            <RouteLink className="button primary" to="/" params={params}>
              Start the historical case
            </RouteLink>
          )}
        </li>
        <li>
          <h2>Explain the classification</h2>
          <p>
            Open “Why this level”. Check the UTCI base, overnight-relief and
            persistence rules, then inspect shared-cell coverage. If every ward
            shares a category, explain that limitation rather than inventing a
            priority.
          </p>
          {params && (
            <RouteLink
              className="button"
              to={`/ward/${first.id}`}
              params={params}
            >
              Review the case ward & actions
            </RouteLink>
          )}
        </li>
        <li>
          <h2>Produce an inspectable output</h2>
          <p>
            Download the planning brief. It includes the source snapshot, rules,
            spatial limits, action wording and simulation status. Review worker
            planning for the same ward when relevant.
          </p>
        </li>
        <li>
          <h2>Separate evidence from remaining work</h2>
          <p>
            Open Methods for the classification audit and pending validation. A
            real-user comparison and local observation agreement remain to be
            collected.
          </p>
          <RouteLink className="button" to="/methods" params={params}>
            Inspect methods & evidence
          </RouteLink>
        </li>
      </ol>
      <details>
        <summary>Optional presenter tools</summary>
        <p>
          The alert walkthrough demonstrates simulated approval identities. It
          does not prove independent human approval or provider delivery.
        </p>
        <RouteLink
          className="button"
          to="/authority"
          params={{ ...params, presenter: "1" }}
        >
          Open approval walkthrough
        </RouteLink>
      </details>
    </>
  );
}
