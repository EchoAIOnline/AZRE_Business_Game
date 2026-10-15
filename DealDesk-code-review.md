# DealDesk code review

Reviewed 2026-10-09, branch main, commit fb4bb972fb9a9e7427495f7f82dd26e6b8d27cb8.

## Assessment

The app covers a substantial real-estate workflow: MLS/off-market/JV pipelines, buyer matching, contacts, offers, photos, campaigns, calendar, and AI integrations. Preserve those workflows and improve the implementation incrementally. Reliability and authorization should come before expanding the feature set or redesigning every screen.

The scoped MCP integration is a useful foundation: its isolated tests exercise organization boundaries, authentication, conflict checks, idempotency, audit rollback, and reversible archive behavior. The browser app does not consistently use equivalent guarantees.

## Highest-priority findings

1. **P1 — Anonymous callers can reach email and paid-provider routes.** `api/send-email.ts:48-104` validates method and payload but never verifies an application session or organization. It accepts caller-supplied recipients and sender and invokes the server's SES credentials. The Express version in `server.ts:204` has the same problem; Zillow and Gemini routes similarly lack authentication. Configured deployments could be abused for sending or provider spend. Verify session and membership before calling providers, constrain sender identities, validate request schemas, and enforce quotas/rate limits. Deployment-level protection was not inspected.

2. **P1 — A pipeline change can permanently lose a deal.** `App.tsx:1462-1469` deletes the source Deals/JVDeals row before saving the destination. If the destination save fails, the source is already gone. The boolean delete result is also ignored, so deletion failures can produce duplicate records instead. Move the record through an atomic database transaction with organization and revision checks. Longer term, consider one Deals table with a pipeline field after a carefully planned migration.

3. **P1 — Failed persistence can appear successful.** `services/api.ts:392-449` strips unknown columns, retries, and puts unsaved values back into the returned object. Missing tables and network failures can also return successful-looking payloads. Separately, `App.tsx:1542-1545` swallows save errors and returns null; `components/Deals/EditDealModal.tsx:858-874` treats that resolved result as completion and updates its clean baseline; `components/Shared/AutoSave.tsx:37-39` then shows Changes Saved. Propagate structured failures, keep drafts dirty until confirmed persistence, and offer retry. An explicit demo mode can simulate saves, but production should never do so.

4. **P1 — Campaign scheduling sends immediately.** `components/LOIBlastCampaignManager.tsx:361-375` sets final status to scheduled when send_at exists, then executes the same immediate send loop. A scheduled campaign can already have contacted its recipients. Persist a scheduled job and let a server worker send when due, with timezone handling, cancellation, and idempotent delivery.

5. **P1 — Delivery logs falsely mark failures as sent.** The SES endpoint returns `{ status, results: [{ email, status, messageId/error }] }` in `api/send-email.ts:91-104`. The campaign client reads sent_count, error_count, and errors at `components/LOIBlastCampaignManager.tsx:381-396`. A partially failed batch therefore has zero counters and every recipient logged as sent. Use one shared response schema, count actual per-recipient outcomes, and retain durable provider IDs. Add a mixed-success contract test before changing this path.

6. **P1 — Organization boundaries are weakened by fallback behavior.** `services/api.ts:289-301` retries an unscoped read for the master organization when the organization column is unavailable; `services/api.ts:392-425` can strip organization_id during saves. Users/Integrations can also be loaded without an organization. The checked-in schema leaves core RLS setup commented out (`supabase_schema.sql:258-265`), and the organization migration adds columns without membership policies. This does not prove the live database lacks RLS: inspect live policies and role grants before claiming a production exposure. Remove unscoped fallbacks and enforce identity-derived membership in the database/server.

7. **P1 — Legacy AI endpoint has unrestricted database authority.** `api/ai/operate.ts:19-77` uses a service-role key and accepts arbitrary table names, payloads, and filters, including deletes. A shared API-key check is present, but organization scope, field allowlists, expected revisions, and operation limits are absent. Empty match objects also pass the truthiness check. Retire this endpoint or reduce it to explicitly scoped domain operations, using the existing MCP handlers as the reference.

8. **P1 — Provider credential is embedded in public source.** A BrightData credential-shaped literal is present in `api/zillow-data.ts:12`, `server.ts:86`, and `.env.example`. Its validity was not tested. Revoke/rotate if real, remove all fallbacks, and scan tracked files/history. Restrict the browser-visible Maps key by origin and API; browser Maps keys are not automatically secrets.

## Other concrete issues

- **P2 — Frontend concurrent edits can overwrite each other.** `services/api.ts:384` upserts without an expected revision; `App.tsx:1437` sends a complete stale record. Revision-incrementing triggers help detect changes for MCP clients but do not reject stale browser writes. Two editors can silently replace each other's fields/history. Use patch operations with expected revisions and show a reconciliation screen on conflict.
- **P2 — Archived records remain visible/editable in the frontend.** `services/api.ts:262` selects all records without filtering pluginArchivedAt; direct browser upserts also do not reject archived targets. This disagrees with the MCP archive contract. Share the same archive semantics across both interfaces and provide an explicit restore view.
- **P2 — Local startup can render a blank page.** Reproduced in the browser: `components/Auth/OAuthConsent.tsx:6` constructs its Supabase client at module import, and `index.tsx` eagerly imports it even on `/`. Missing settings throw before the login page renders. Initialize only when needed and show a configuration error. With dummy localhost settings, the login page renders correctly.
- **P2 — Outlook connection is shared across users in the Express server.** `server.ts:287-353` stores tokens in process-global variables and serves mailbox routes without verifying an app session. OAuth also lacks a state check. This can mix mailboxes between users on a configured shared server, and tokens disappear on restart. Store encrypted tokens by user/organization, bind OAuth state to the session, refresh tokens, and authorize every mailbox read. This Express implementation is separate from the Vercel function layout; deployment parity needs testing.
- **P2 — Dashboard trends describe the wrong time event.** `components/Dashboard/Dashboard.tsx:40-81` buckets by createdAt then checks today's stage. A deal created months ago but closed this week is excluded from this week's closed trend. Use stage-transition timestamps or closing dates and label creation-based charts accordingly.

## How I would improve the product

- Make the dashboard a daily work queue: overdue follow-ups, offers awaiting a reply, inspection/EMD/closing deadlines, stale deals, and assigned owners. Add clear next actions from each row.
- Simplify the deal editor around Overview, Underwriting, Contacts, Documents, and Activity. Keep the key financial summary and save status visible. Consolidate duplicate fields and use consistent date/currency inputs.
- Add a dense table view alongside deal cards, with saved filters, sortable columns, and safe bulk actions. Use URLs for filter/detail state so a teammate can open the same view.
- Make buyer matching explainable: show which requirements match, which fail, and which lack data. Consolidate the separate browser and integration matching implementations into shared domain rules.
- Make AI comps verifiable: include source URLs, actual distance, sold-date checks, verification status, and reasons for inclusion/exclusion. `api/gemini/comps.ts:21` requests highest-priced 2026 comps and returns no provenance; that can bias the proposed ARV. Separate candidate discovery from verified underwriting inputs and require review before using them in an offer.
- Queue imports, photo work, and campaigns on the server with progress, cancellation, retries, and durable results. Browser closure should not determine whether business work completes.

## Implementation approach

1. Stabilize saves, atomic pipeline moves, campaign scheduling/delivery, and provider-route authorization. Preserve current screens while fixing the contracts underneath them.
2. Establish shared typed domain schemas, organization membership policies, patch/revision semantics, archive behavior, and one auditable mutation service used by the app and MCP.
3. Split the 2,487-line App and 3,031-line deal editor by workflow. Consolidate overlapping Zustand stores and matching logic. Replace loose any payloads with generated database types and validated request schemas.
4. Improve startup and responsiveness: lazy-load feature routes, fetch only the active view, use ordered server pagination/search, and compile Tailwind at build time. Initial data loading currently fetches nine tables serially. The production JS bundle is approximately 2.57 MB / 705 KB gzip.
5. Establish reproducible builds and CI: select one authoritative lockfile/package manager, run clean install + typecheck + build + isolated integration tests, and add meaningful browser tests for failed saves, two-editor conflicts, pipeline moves, archive visibility, scheduled campaigns, and mixed email outcomes. Move exploratory and potentially production-mutating scripts out of the normal test surface.

## Validation and limits

- npm ci failed because package.json and the root package-lock.json disagree.
- Installed dependencies using npm install --ignore-scripts --package-lock=false; no source or lockfile edits.
- npm run lint passed (TypeScript checking; not an ESLint check).
- npm run build passed, with a large-chunk warning and missing /index.css warning.
- All 42 isolated plugin tests passed after enabling localhost test-server networking. They use embedded PostgreSQL fixtures; no live database mutation tests were run.
- Ran the local UI: first reproduced the missing-Supabase blank page, then viewed the login page with dummy localhost database settings. Authenticated workflows were reviewed from source, not claimed as browser-tested.
- No production records, messages, credentials, schema, or deployments were changed. Live RLS, provider-key validity, and deployed endpoint protection remain unverified.
