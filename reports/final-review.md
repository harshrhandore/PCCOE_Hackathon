# Build verification checkpoint

> Scope update, 2026-11-08: local hosting supersedes cloud deployment and scheduling. Earlier evidence is retained below; see [current local verification](local-verification.md).

This is an incomplete P0 implementation, not a completed tier claim.

Verified: production web build and TypeScript; 4 Vitest state/CSV tests; 63 pytest rule, thermal-reference, API fail-closed, encryption, and CAP XSD tests; actual DataMeet 2022 geography, 58 wards, zero geometry repairs; real Open-Meteo forecast acquisition; hashed immutable diagnostic publication. Full browser results are in reports/tests/playwright.json after the current run finishes.

Resolved during verification: CAP timestamps now use signed offsets required by XSD; selected-row foreground and inline source-link underlines corrected after axe findings; zero-delta perturbation preserves raw source values; hour scrubber now selects the corresponding ribbon sample.

Remaining acceptance: full database migration replay and RLS/security integration tests, genuine staff sign-in and server-workflow UI, confirmed Telegram test delivery/ownership deletion, demographic spatial crosswalk and vulnerability cohort, all-string i18n coverage and native review, full viewport/zoom/screen-reader/colour-vision checks, three-run production Lighthouse, externally verified Cloudflare deployment and scheduled publication. No cloud credentials or authorized independent staff accounts were supplied. No deployment URL, provider acknowledgement, clinical validation or ML metrics are fabricated.

The public static prototype remains useful when the API is unavailable; diagnostic snapshots explicitly disclose missing modifiers and block operational delivery. Maps show historical 2022 electoral geography and separate hazard-only risk from missing vulnerability. Optional external tiles have an independent SVG boundary fallback. No paid service, phone-number collection or automatic alert approval is enabled.


## Specification O checklist

- **PASS** ? No purple/indigo/blue-violet gradient, gradient text, glassmorphism/blur card, neon glow, or default dark-blue/purple-accent aesthetic exists. Preserve the required Level 4 magenta only for semantic risk.
- **PASS** ? No stock shadcn styling, Tailwind default blue `#3B82F6`/`#6366F1`, or default Tailwind gray substitutes the defined palette. Headless primitives have custom visuals and complete interaction states.
- **PASS** ? No Inter/Roboto/Arial/system-ui/Poppins/Space Grotesk design font, large rounded card style, or soft card shadows exists. Use the exact typography, 2px surfaces, 3px buttons, and one overlay shadow.
- **PASS** ? No emoji, emoji-as-icon, generic “Empower/Revolutionize” hero, fake sponsor logo, testimonial, or invented impact/accuracy/user figure appears.
- **PASS** ? No grid of three identical icon cards replaces decision-led information. Keep the asymmetric bulletin/list/map/context composition.
- **PASS** ? No lorem ipsum, “John Doe,” invented ward/demo demographics, plausible-looking unlabelled sample data, fixed ward total, or fake historical event appears in a live artifact. Use true computed data or explicit simulation/fixture labels.
- **PASS** ? No decorative sun, thermometer, mascot, photograph hero, 3D blob, or ornamental illustration appears. Supply the ward-polygon/isotherm SVG identity.
- **PASS** ? No rainbow chart or decorative colour appears. Use only the specified hazard/vulnerability ramps and verdigris interaction colour; all levels have numeral/name/pattern cues.
- **PASS** ? No LLM-written advice, generative safety text, or chatbot enters the safety path. All actions resolve to versioned reviewed templates and source sections.
- **PARTIAL** ? No blank-page loading spinner exists. Every data view implements matched loading skeletons, meaningful empty/error states, visible stale and offline behaviour, and honest unknown data.
- **PARTIAL** ? No horizontal document overflow exists at 360px; no visible text is below 12px; no actionable target is below 44px; keyboard/200% text/reduced-motion paths work.
- **PASS** ? No proxy, missing cohort component, crosswalk assumption, old census vintage, radiation estimator, unknown model run, or simulation is hidden. Keep methodology and source chips one interaction away.
- **PASS** ? Hazard, vulnerability, risk, and priority have separate labels and values. “Why this level” reproduces the exact fired rules from the selected snapshot/method version.
- **PARTIAL** ? Replay/what-if banners survive routing, exports, CAP, shared images/text, alert previews, and reloads. Exiting simulation restores live data without contaminating caches or subscribers.
- **PASS** ? NWP/physics/ML claims are honest; no outcome data or model skill is invented; untrained/underperforming ML is explicitly disclosed and baseline remains available.
- **PARTIAL** ? Authority delivery requires current authorization, independent approval, exact revision/digest, valid snapshot, consented recipient, and a test allowlist. SMS/WhatsApp remain labelled preview adapters.
- **PARTIAL** ? Provider quotas/eligibility/licences were checked; no paid service/card/trial is required; no cron claims to guarantee host availability or evade provider terms.
- **PARTIAL** ? Footer/map/data/font/library notices are present; boundary vintage and actual ward count are correct; no official PMC/IMD affiliation or operational CAP connection is implied.
- **INCOMPLETE** ? The complete three-minute demo, source-data reproducibility, graceful failure cases, deployment URL, and reports are tested. Record remaining incomplete requirements plainly and do not label a tier done until its acceptance passes.

Partial/incomplete items require the concrete remaining acceptance checks listed above. No skipped result is counted as passed. Browser source-page checks use development serving while replay CPU processing runs; production mobile performance measurements remain unperformed.

The live processing candidate now validates as complete for all 58 wards with the acquired baseline; P0 overall remains incomplete for the independent integration gates above. Browser test timeout raised to 120 seconds for concurrent ERA5 processing and axe analysis; this is a test-runner allowance, not a performance acceptance change.

Real replay generated and hash/join validated: 2024-04-26 through 2024-04-30, selected by the declared full 2021?2025 city-median scan. Five consecutive qualifying days. Baseline and replay use the same method. Immutable replay input resolves through the API snapshot loader. Overall tier remains incomplete.

Static deployment artifact assembled successfully in ignored dist/. Real replay browser smoke passed at 360px: historical dates and simulation banner persisted, ward data loaded, no page errors; screenshot reports/visual/replay-phone.png. Source data checks: forecast 16,287 bytes gzip and geometry 50,532 bytes gzip; both reported honestly. No cloud URL is claimed.

Final browser suite: 10 passed, 2 deliberately skipped, 0 unexpected failures across 360/768/1280/1920 viewport projects. Authority primary paths exercised at 360 and 1280; other two authority duplicates intentionally skipped. Covered public flows include axe serious/critical assertions and no document overflow. This does not certify full WCAG, screen-reader or all-target-size acceptance.

GitHub source master and separate data branch both published. Final cloud URL remains unavailable; run npm run dev locally.
