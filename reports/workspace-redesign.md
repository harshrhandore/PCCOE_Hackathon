# HeatGuard planning workspace redesign

The overview now connects the ward selector, date controls, city map and selected-ward panel in one workspace. The large editorial headline, city severity numeral, repeated temperature summary and workflow slogan have been removed. The shared visual system uses sans-serif headings, neutral surfaces and a blue interaction accent. Heat colours remain reserved for severity. The header and favicon share a simple monogram.

Desktop uses a searchable ward list, larger map and selected-ward panel. On phone the selected ward comes first, with section links to the map and all wards. Compact severity patterns in list rows retain accessible full labels. All 58 wards remain available, including keyboard-triggered deferred sections.

The ward panel places the review action directly beneath its heading. The detailed page pairs thermal conditions and hourly samples with audience-specific sourced actions and brief export. Technical rules and raw inputs are behind a methods disclosure; weather-only screening and missing population-risk assessment remain visible. Source provenance, stale-data warnings and historical-boundary limits remain available.

## Verification

- TypeScript and production build passed.
- 8 frontend unit checks passed.
- 18 browser checks passed; 6 intentional duplicate-viewport skips. Scope: overview, ward detail, no-account brief export, ward/date continuity, selected-ward calculation, evidence/replay, simulation and unavailable states.
- Overview and detail have no serious/critical automated WCAG findings at 360, 768, 1280 and 1920 pixels. This does not certify manual screen-reader or native-language review.
- Additional rendered checks at 1440x1000 and 360x800: no detail horizontal overflow or browser exceptions. Review action begins at 600 and 742 pixels respectively. See workspace-layout.json.
- Final screenshots: visual/workspace-desktop.png, visual/workspace-phone.png, visual/workspace-brief-desktop.png, visual/workspace-brief-phone.png.
- Backend/scientific calculations and public weather data were not modified. Earlier Lighthouse results describe the earlier build; performance was not re-audited for this visual pass. Unused serif imports and preload were removed.

The saved weather snapshot is still dated 2026-11-09; the visible stale-data notice is intentional. This redesign does not add field observations or claim completed user validation.
