# Privacy notice — research prototype, version 1.0.0

Public weather does not require an account or geolocation. Manually selected ward, density and UI language may be stored on the device; no health data or location history is collected. Current UI does not request geolocation.

Optional Telegram registration needs ward, audience, language, consent and Start ownership confirmation. No names or phone numbers are requested. Endpoint lookup uses keyed HMAC-SHA256; deliverable endpoints use AES-256-GCM with independent 32-byte keys and versioned associated data. Hashed and encrypted identifiers remain personal data. Authority account IDs are restricted to membership and audit purposes.

Prototype retention policy: confirmation tokens at most 30 minutes; pending registrations 24 hours; consent renewed within 12 months; valid deletion within 24 hours; delivery diagnostics 30 days; sanitized authority/audit evidence 180 days; payload-free operational logs 7 days. Implementation cleanup must be scheduled before external subscriptions are enabled. Immutable public snapshot evidence referenced by alerts is retained separately from recipient data.

Send `/stop` in the same private Telegram chat to delete all ward/language subscriptions, encrypted endpoints and pending delivery eligibility. Browser deletion requires a high-entropy token; an ID alone never suffices. Once-only browser deletion-token delivery is not yet wired; `/stop` is the available ownership path once the configured integration is tested. No Push/email subscriptions are enabled.

The self-hosted API logs no request payloads; reverse-proxy log/backup policies depend on the actual host. No promise of instantaneous encrypted-backup erasure is made. There are no analytics or tracking cookies. No claim of DPDP legal compliance is made; a real deployment needs an applicable official legal review.
