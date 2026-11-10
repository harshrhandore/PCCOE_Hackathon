# Workspace refinements, 2026-11-10

Implemented all seven follow-up interface improvements: compact first-screen hierarchy; plain-language explanations from fired rules; real mobile ward/map/list switching; a selected-day UTCI curve with inspectable keyboard samples; map zoom/reset and selective labels; ward-detail date switching and browser print/PDF; smaller footer and numbered severity markers.

Ward selection returns the phone to its detail panel. Date, ward and replay query parameters remain preserved. The curve retains missing-data gaps and exposes the actual sample through the existing slider/readout. Print output includes the selected ward/date, saved publication timestamp, snapshot ID, source attribution, limitations and audience-specific sourced actions. Printing uses the browser print dialog; it does not send data to an external PDF service.

Verification: production build and 8 frontend unit tests pass. 12 browser checks pass across phone and desktop, covering overview/detail accessibility, mobile reflow, ward/date continuity, brief download, calculations, replay, unavailable states and simulated approval. Additional browser checks confirmed date switching, no horizontal overflow, map zoom to 150% and reset. Printed layout was visually inspected. Reports/tests/playwright.json records the scoped run, not the entire historical suite. Scientific calculations and saved weather inputs were not changed.

The saved data can be stale; the warning remains visible. Real user testing, independent observations and native-language review still require actual participants/evidence.
