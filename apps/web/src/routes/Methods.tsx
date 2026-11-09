import { useTranslation } from "react-i18next";
import EvidencePanel from "../components/EvidencePanel";
import type { Dataset } from "../data/types";
import { PageHeading, SourceChip, RouteLink } from "../components/Shared";
export default function Methods({ data }: { data: Dataset }) {
  const { t } = useTranslation();
  const m = data.methods;
  return (
    <>
      <PageHeading
        kicker={`METHOD ${m.version} · TRANSPARENT BY DESIGN`}
        title={t("nav.methods")}
      />
      <EvidencePanel data={data} />
      <p className="method-flow">
        Weather <span>→</span> Thermal stress <span>→</span> Explainable
        screening <span>→</span> Planning brief
      </p>
      <div className="methods-layout">
        <nav aria-label="Methods contents">
          <a href="#physics">Weather & physics</a>
          <a href="#rules">Screening rules</a>
          <a href="#vulnerability">Vulnerability</a>
          <a href="#validation">Validation</a>
          <a href="#sources">Sources & licences</a>
          <a href="#limitations">Limitations</a>
        </nav>
        <article className="methods-article">
          <section id="physics">
            <p className="eyebrow">01 / WEATHER AND PHYSICS</p>
            <h2>A model forecast, with its assumptions visible.</h2>
            <p>{t("methods.nwp")}</p>
            <p>{t("methods.resolution")}</p>
            <dl className="definition-grid">
              <dt>Weather</dt>
              <dd>
                Open-Meteo · {data.manifest.meta.model_id} · source model
                initialization unavailable.
              </dd>
              <dt>UTCI</dt>
              <dd>
                thermofeel 2.3.0 · Kelvin inputs/outputs converted explicitly ·
                10 m wind, vapour pressure in hPa.
              </dd>
              <dt>WBGT</dt>
              <dd>
                Liljegren natural-wet-bulb/globe energy balance. Approximate
                outdoor estimate; confirm with a worksite assessment.
              </dd>
              <dt>Radiation</dt>
              <dd>
                {String(m.radiation.method_id)} ·{" "}
                {m.radiation.enabled
                  ? "approximate"
                  : "publication gate not passed"}
                . Longwave and reference-surface assumptions are not measured
                Pune urban radiation.
              </dd>
              <dt>Heat Index</dt>
              <dd>NWS shade/light-wind index, distinct from UTCI and WBGT.</dd>
            </dl>
            <SourceChip data={data} />
          </section>
          <section id="rules">
            <p className="eyebrow">02 / DETERMINISTIC RULES</p>
            <h2>{t("methods.prototypeRule")}</h2>
            <p>
              UTCI heat-category endpoints are evaluated before rounding. The
              dashboard’s custom levels are distinct from the thermal categories
              and official IMD warnings.
            </p>
            <table>
              <caption>Daily sampled peak UTCI and base hazard</caption>
              <thead>
                <tr>
                  <th>UTCI °C</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {m.utci.names.map((name, i) => (
                  <tr key={name}>
                    <th>
                      {i === 0
                        ? `≤ ${m.utci.upper_endpoints_c[0]}`
                        : i === 4
                          ? `> ${m.utci.upper_endpoints_c[3]}`
                          : `> ${m.utci.upper_endpoints_c[i - 1]} and ≤ ${m.utci.upper_endpoints_c[i]}`}
                    </th>
                    <td>
                      {i} {name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.entries(m.formulas).map(([key, value]) => (
              <div className="formula" key={key}>
                <span className="eyebrow">{key}</span>
                <code>{value}</code>
              </div>
            ))}
            <p>
              Night: 20:00–06:00 IST, ten complete local-hour bins. Two
              consecutive night minima strictly above their frozen 1991–2020
              local 90th percentile add one level, only at base ≥1. Three
              consecutive base levels ≥2 add one level. Unknown context stays
              unknown and blocks live alert delivery.
            </p>
            <p>
              Climatology uses a five-calendar-day window, linear quantiles,
              ≥90% complete baseline nights and a 365-day fitting calendar;
              February 29 is interpolated. UTC-hour samples stay at half-past
              IST hours. Minima and maxima are sampled hourly, not continuous
              extrema.
            </p>
            <p>
              IMD: the plains/plateau gate is Tmax ≥40 °C, heat-wave departure
              ≥4.5 °C, severe departure &gt;6.4 °C; absolute criteria ≥45 / ≥47
              °C. A ward grid cannot satisfy the official two-station, two-day
              declaration procedure. {t("detail.imdNote")}
            </p>
          </section>
          <section id="vulnerability">
            <p className="eyebrow">03 / SENSITIVITY AND CAPACITY</p>
            <h2>One comparable cohort. No invented demographics.</h2>
            <p>
              The percentile calculation uses average tied ranks. A component is
              included only when available for every ward. At least three
              informative components, ≥50% default weight coverage and
              adaptive-capacity coverage are required.
            </p>
            <p className="note">
              Weight sensitivity is unavailable until a complete spatially
              matched cohort exists. No active sensitivity control or population
              ranking is presented.
            </p>
            <details>
              <summary>Proposed vulnerability weights</summary>
              <table>
                <caption>
                  Analyst-selected weights; no health-outcome fitting
                </caption>
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {m.weights.components.map((c) => (
                    <tr key={c.id}>
                      <th>{c.id.replaceAll("_", " ")}</th>
                      <td>{`${Math.round(c.weight * 100)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
            <p className="note">
              Vulnerability and rank sensitivity unavailable: no licensed,
              spatially matched demographic/land-cover/refuge cohort has been
              acquired. Risk follows hazard only where hazard is available.
              Census 2011 wards are never joined to 2022 wards by number or
              name.
            </p>
            <p>
              Allocation priority is a ranking, never a probability of illness.
              No elderly count or measured outdoor-worker count is inferred.
            </p>
          </section>
          <section id="validation">
            <p className="eyebrow">04 / VALIDATION STATUS</p>
            <h2>{t("methods.noModel")}</h2>
            <p>
              No prediction accuracy, health benefit, probability or confidence
              band is claimed. Rule unit tests are not clinical validation.
              Genuine as-issued forecasts and chronological held-out evaluation
              are required before any ML activation.
            </p>
            <p>
              Reference checks: NWS Heat Index, CCOHS WBGT arithmetic, ECMWF
              UTCI fixtures, independent pythermalcomfort comparisons and NREL
              solar position. Consult the repository’s actual test report for
              results and skipped checks.
            </p>
            <RouteLink to="/status">View current processing status →</RouteLink>
          </section>
          <section id="sources">
            <p>
              Contains modified Copernicus Climate Change Service information
              2026. Neither the European Commission nor ECMWF is responsible for
              any use that may be made of the Copernicus information or data it
              contains. ERA5 hourly single levels, DOI 10.24381/cds.adbb2d47,
              derived through Open-Meteo.
            </p>
            <p className="eyebrow">05 / PROVENANCE AND LICENCES</p>
            <h2>Trace each number to its source.</h2>
            <ul className="source-list">
              {m.source_catalog.map((s) => (
                <li key={s.id}>
                  <a href={s.url}>{s.title} ↗</a>
                  {s.licence && <span>{s.licence}</span>}
                  {s.vintage && <span>Vintage {s.vintage}</span>}
                </li>
              ))}
            </ul>
            <p>
              2022 electoral polygons were manually traced from PMC PDF maps.
              They do not establish current administrative boundaries.
              Pune-folder CC BY-SA 2.5 India notice is retained; the 2022
              upstream additionally supplies an MIT licence. Derived geometry
              retains the source attribution and share-alike notice.
            </p>
            <p>
              Fonts: Newsreader, Atkinson Hyperlegible Next, Noto Sans/Serif
              Devanagari, SIL OFL; system monospace for numeric tables. React MIT; MapLibre
              BSD-3-Clause; thermofeel Apache-2.0; pythermalcomfort MIT. Full
              dependency inventory and redistribution notices are in the
              repository.
            </p>
            <p>
              CAP: OASIS CAP 1.2, Test/Exercise only. Standards compatibility is
              a future integration path; no national-system access is
              implemented.
            </p>
          </section>
          <section id="limitations">
            <p className="eyebrow">06 / LIMITATIONS</p>
            <h2>Evidence still to acquire.</h2>
            <ul>
              {m.limitations.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p>{t("methods.noHealth")}</p>
            <p>
              Unreviewed Hindi/Marathi safety copy cannot be externally
              delivered. Candidate refuges require owner confirmation. Local
              staff provisioning and migration replay have recorded integration
              checks; external provider delivery, local observation comparisons
              and health outcome validation remain unverified. Hosting is local
              only.
            </p>
          </section>
        </article>
      </div>
    </>
  );
}
