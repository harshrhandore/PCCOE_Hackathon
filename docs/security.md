# Security and operational boundaries

Public pages use same-origin validated static files. Browser code receives no database secret, Telegram token, delivery endpoint or private audit data. Route/query IDs are validated; source snapshots are immutable and SHA-256 checked. CSV text is formula-escaped. XML uses lxml with entities/network/DTD loading disabled; CAP uses Test/Exercise and geocodes, never Actual.

Privileged API calls validate ES256/RS256 JWKS signatures, issuer, audience, expiry and session ID; anonymous sessions are rejected. Membership and session presence are read from the database, rechecked within mutation transactions; user_metadata is never trusted. Revoked/removed membership is effective on the next privileged call. Database errors fail closed. No development header can impersonate staff.

Supabase RLS covers every exposed table; grants are separate from policies. Secrets and membership live in unexposed app_private. Backend service credentials bypass RLS and therefore require server role checks on every mutation. Draft/approve/send use exact revision, content digest and row locks. Independent approval is mandatory. Deferred ward-set constraints, transition triggers and immutable audit triggers are prepared. These migrations must be replayed and tested in a real disposable PostGIS database before claiming production readiness.

Telegram uses explicit consent, private-chat Start, expiring opaque tokens, secret webhook header, update deduplication and a test recipient allowlist. Outbox uniqueness prevents duplicate application jobs. Provider timeouts are unknown acceptance and are never automatically resent. No exactly-once delivery is claimed. Ordinary subscribers are excluded from simulation delivery because all current sending is allowlisted test mode.

Limits: JSON body ≤64 KB; bounded IDs/strings/ranges; per-IP 120 requests/minute; scenario LRU ≤100, expiry one hour. This process-local limiter is not a distributed production defence. CORS accepts configured exact origins only. Update static `_headers` connect-src to an explicitly trusted deployed API origin; never use wildcard credentialed CORS. No secrets should appear in URL/query logs.

Use a narrowly privileged application database role rather than a schema owner. Read-only health is available when credentials are missing, while mutation adapters remain disabled. Current lack of cloud credentials, database provisioning and provider integration is visible in the UI and acceptance report.
