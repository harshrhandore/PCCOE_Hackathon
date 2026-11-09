import type { Dataset } from "../data/types";
import { spatialCoverage } from "../lib/planning";
import { download } from "../lib/state";

export default function EvidencePanel({ data }: { data: Dataset }) {
  const days = data.manifest.meta.dates.map((date) => {
    const rows = data.daily.filter((r) => r.date === date);
    const fired = (id: string) =>
      rows.filter((r) =>
        r.hazard_rule_fired.some(
          (rule) => rule.id === id && rule.status === "fired",
        ),
      ).length;
    return {
      date,
      wards: rows.length,
      base_ge_3: rows.filter((r) => r.base_level !== null && r.base_level >= 3)
        .length,
      final_ge_3: rows.filter(
        (r) => r.hazard_level !== null && r.hazard_level >= 3,
      ).length,
      night_modifier: fired("NIGHT_RELIEF_2"),
      persistence_modifier: fired("PERSISTENCE_3"),
      missing_hazard: rows.filter((r) => r.hazard_level === null).length,
      missing_vulnerability: rows.filter((r) => r.vulnerability === null)
        .length,
      ...spatialCoverage(rows),
    };
  });
  return (
    <section
      className="evidence-panel"
      aria-label="Evidence and evaluation status"
    >
      <p className="eyebrow">WHAT THIS BUILD DEMONSTRATES</p>
      <h2>A planning workflow with inspectable evidence.</h2>
      <p>
        HeatGuard helps a local heat-action planner inspect ward-centroid
        thermal estimates, understand rule escalation and export a source-linked
        brief. Existing IMD warnings remain the official reference. This
        prototype has no team-trained ML model or validated population-risk
        ranking.
      </p>
      <p>
        Heat mapping and warnings already exist. The prototype contribution
        being evaluated here is the local, reproducible path from thermal
        estimates and explanations to a planning brief. A comparative user study
        has not yet established an advantage.
      </p>
      <details>
        <summary>Classification and spatial-coverage audit</summary>
        <p>
          Counts are calculated from the selected saved snapshot. Escalation
          counts can overlap. They explain classifications; they do not measure
          false alarms or forecast accuracy. Shared cells are not independent
          local observations.
        </p>
        <div className="table-scroll">
          <table>
            <caption>
              Base category versus final screening level, by IST day
            </caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Wards</th>
                <th>Base ≥3</th>
                <th>Final ≥3</th>
                <th>Night modifier</th>
                <th>Persistence modifier</th>
                <th>Weather cells</th>
                <th>Missing hazard</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date}>
                  <th>{d.date}</th>
                  <td>{d.wards}</td>
                  <td>{d.base_ge_3}</td>
                  <td>{d.final_ge_3}</td>
                  <td>{d.night_modifier}</td>
                  <td>{d.persistence_modifier}</td>
                  <td>{d.cells}</td>
                  <td>{d.missing_hazard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={() =>
            download(
              "heatguard-evidence-summary.json",
              JSON.stringify(
                {
                  snapshot_id: data.manifest.snapshot_id,
                  method_version: data.manifest.meta.method_version,
                  scope:
                    "Descriptive classification and coverage audit; no forecast-skill or health-outcome claim",
                  days,
                  validation: {
                    local_observation_comparison: "not performed",
                    health_outcomes: "not evaluated",
                    user_study: "not completed",
                  },
                },
                null,
                2,
              ),
              "application/json",
            )
          }
        >
          Download evidence summary
        </button>
      </details>
      <details>
        <summary>Validation still required before operational use</summary>
        <ol>
          <li>
            Compare time-matched model estimates with independent local
            measurements and record measurement uncertainty.
          </li>
          <li>
            Evaluate published forecasts on chronologically held-out periods,
            including missed events and false alarms. Reanalysis replay is not
            forecast verification.
          </li>
          <li>
            Test the same planning task with intended users using their current
            workflow and HeatGuard; record completion time, errors and brief
            usefulness.
          </li>
          <li>
            Obtain native Hindi/Marathi and manual assistive-technology review
            before claiming complete localization or accessibility.
          </li>
        </ol>
        <p>
          The repository includes a pilot protocol, observation-comparison tool
          and blank feedback sheet. No participant results or predictive
          accuracy are invented.
        </p>
        <a href="https://github.com/harshrhandore/PCCOE_Hackathon/blob/master/docs/pilot-evaluation.md">
          Read the evaluation protocol
        </a>
      </details>
    </section>
  );
}
