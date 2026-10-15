# AZRE AI Workforce — Phase 1

Standalone Node 24 JavaScript application using the official OpenAI Agents SDK. Nothing in the Virtual Office or DealDesk applications is changed. DealDesk remains authoritative. No production writes, external messages, financial commitments or contracts are possible through registered tools.

## Architecture and created files

- `src/dealdesk.js`: authenticated read-only adapter for the existing authorized `/api/ai/plugin` API; strict endpoint, response size limits, bounded pagination, transient retries, timeout and sanitized errors.
- `src/audit.js`: deterministic queue/pipeline checks, configurable-in-code required fields, missing information, duplicates, offer/underwriting/follow-up/deadline findings, task ordering and Markdown reports.
- `src/agent.js`: official SDK Agent, Runner, structured executive briefing, read audit tool, tracing controls and future delegation result contract.
- `src/store.js`: SQLite execution history, reports, errors, fenced workflow leases and scheduler slot deduplication.
- `src/service.js`: shared workflow executor, JSON/Markdown artifacts and persistent recommendations.
- `src/server.js`: protected status/history/latest-report/errors endpoints, manual execution endpoints and disabled-by-default timezone-aware scheduling.
- `src/cli.js`: manual audits, live connection verification and always-on service.
- `test/core.test.js`: synthetic/mocked safety and behavior tests.
- `package.json`, lockfile, `.env.example`, `.gitignore`, `Dockerfile`: independent dependencies/configuration/deployment.

The four workflows use a common complete retrieval/audit engine. They label report intent without hiding cross-department findings. Future departmental agents can implement `delegationResult`; none are instantiated in Phase 1.

## Installation and configuration

```sh
cd '/Users/asharizakar/Documents/ChatGPT/AZRE Business Game/azre-ai-workforce'
npm ci
cp .env.example .env
```

Set `OPENAI_API_KEY` (OpenAI API billing is separate from ChatGPT), `OPENAI_MODEL` to a structured-output/tool-capable model available to your project, `DEALDESK_PLUGIN_API_KEY` to an authorized **read-only** service credential, and `STATUS_API_TOKEN` to a random secret of at least 32 characters. Credentials are server-only, never printed. The existing office credential is not copied into this application. OAuth credentials used by a connected chat are not automatically available to an independent server; obtain a dedicated API credential from the existing DealDesk administrator. Authentication failures stop that collection; token rotation is managed by the deployment secret store.

`STATE_DB` and `REPORT_DIR` must be on persistent storage. Keep `SCHEDULE_ENABLED=false` until deliberately enabled. Optional `AUDIT_CRON` (8am) and `BRIEFING_CRON` (5pm) use America/New_York including DST. `HOST` defaults to loopback, `PORT` to 3101. `TRACING_ENABLED=true` enables SDK tracing with sensitive trace data excluded. SDK model requests use the SDK's provider retry behavior; integration transient errors retry twice. Workflow budget is 120 seconds, SDK maximum 5 turns, integration call budget 15 seconds.

## Run and test

```sh
npm test
npm run live:read
npm run audit
node --env-file-if-exists=.env src/cli.js run pipeline-review
node --env-file-if-exists=.env src/cli.js run task-review
node --env-file-if-exists=.env src/cli.js run executive-briefing
node --env-file-if-exists=.env src/cli.js run daily-audit --rules-only
npm start
```

`live:read` reads one record from each collection, prints coverage only, and does not modify records. `--rules-only` produces a clearly labeled deterministic audit without OpenAI; it is not a successful AI briefing. CLI exits nonzero when retrieval or AI generation fails. Review JSON/Markdown under `data/reports`, or SQLite run rows for execution logs. No authoritative property replica or retrieved raw records are persisted; report findings and task summaries contain limited business information and require restricted disk access.

## Protected application interface

All routes require `Authorization: Bearer <STATUS_API_TOKEN>`:

- GET `/status`: real state, current workflows, last execution, coarse task progress.
- GET `/history`: most recent 100 executions.
- GET `/reports/latest`: latest execution report (can be null while running).
- GET `/errors`: failed execution summaries.
- POST `/workflows/daily-audit`, `/workflows/pipeline-review`, `/workflows/task-review`, `/workflows/executive-briefing`: manually execute and return report. Duplicate workflow returns 409.

No CORS or public unauthenticated routes. Use a TLS reverse proxy and network restrictions for remote access; never expose an unencrypted public bearer-token endpoint. The future Virtual Office may consume these endpoints after separate integration work.

## Deployment, scheduling and recovery

Deploy to an always-on server/container with Node 24, a process supervisor/restart policy, secrets injected at runtime and a durable volume. Example: build this directory as Docker context, mount a restricted volume at `/app/data`, inject `.env` through the platform secret manager, and publish port 3101 behind authenticated TLS infrastructure. Docker binds 0.0.0.0 within the container. Scheduler runs inside the service, so laptop uptime is not assumed.

SQLite uses WAL and transactional locks. Multiple processes sharing the same local SQLite disk cannot start the same workflow concurrently. Leases last 150 seconds, exceeding the 120-second execution budget. Expired owners are fenced from completion; the next run marks abandoned execution Error. Schedule slots prevent duplicate minute dispatch across processes; failures are recorded and retry at the next scheduled run or manually. Missed schedules while offline are not replayed. Use one service instance on one local durable disk; distributed replicas or network filesystems need a shared transactional database/queue before expansion. Back up reports and SQLite through SQLite's backup tooling, set retention/access policies appropriate to business data.

## Business rules and limits

`offerDecision` is Pipeline Status; `queueStatus` is In Queue / In Pipeline; `pipelineType` is a derived pipeline identity. Structured sent-message/contact status or a recorded contact date counts as documented communication. Attached agent never does. Free-text logs remain evidence for human review, not automatic proof. No queue correction is executed. Required baseline fields: address, propertyType, listingType, offerDecision, queueStatus. Additional company policies should be configured after review.

Facts in deterministic findings refer to observed field values. Findings and AI actions are recommendations requiring human review. Notes and descriptions are untrusted; the model receives bounded audit findings, not raw logs. Prompt rules are defense in depth, while absence of mutation/communication tools enforces the action boundary. AI narrative is advisory and may need correction; recommended record IDs are locally validated. Partial retrieval is always disclosed. Reports do not claim unseen records are complete.

Pending buyer responses cannot be reliably inferred without a documented response field. Closing dates are not assumed from `closedDate`, which denotes an actual close. Reports flag missing transaction information, but a dedicated scheduled closing/deadline schema and departmental assignment rules need company confirmation. Dates without times are treated as end-of-day New York; invalid task dates are flagged blocked. Potential duplicate matching uses recorded MLS or normalized address, not a fuzzy identity assertion. `match_buyers` is available in hosted MCP but is not duplicated; Phase 1 flags disposition review rather than claiming buyer-fit analysis.

## Validation and next phase

Read the accompanying `VALIDATION.md` for actual test and live integration results. Successful mock tests are not proof of successful live OpenAI execution. Next phase: configure dedicated credentials, validate a live SDK-generated briefing, review AZRE policy thresholds and deadline fields, deploy with schedules still disabled, then explicitly enable schedules. Add departmental agents only after approval/delegation contracts are accepted. Virtual Office connection remains future work.

Official SDK agent/tool/structured-output documentation: https://developers.openai.com/api/docs/guides/agents/define-agents

## Phase 1.1 validation

See `LIVE_AI_VALIDATION.md` for secure credential setup, current live execution status, test results, and the Phase 2 gate. AI report metadata now includes GPT-6 Luna standard token cost estimates and configured model, API status, provider token usage when available, and a documented cost estimate for GPT-4.1 mini. Known API failures are sanitized into distinct configuration/authentication/rate-limit/unavailability/timeout codes. A successful briefing must actually use the audit tool and pass record-reference validation; narrative factual review remains required.

Live validation can use `node scripts/live-validation.js`, which reads the workforce configuration and, if needed, transiently uses the authorized parent DealDesk credential. It never copies credentials. `node scripts/verify-artifacts.js` checks the latest successful briefing, aggregate accuracy and SQLite/JSON equality. `LIVE_AI_VALIDATION.md` records the accepted execution and remaining limits.

## Phase 1.2 — direct communication

Open the standalone workspace at **http://127.0.0.1:3101**. Start from this directory with `npm run dev:chat`. Sign in using `CHAT_ACCESS_PASSWORD` in the protected `.env` (open it locally; never print or share credentials). A dedicated random chat password was prepared locally. `STATUS_API_TOKEN` remains the bearer credential for the pre-existing machine API. OpenAI and DealDesk keys never reach the browser. New conversations, prior conversation selection and message history are stored in the same SQLite database, separate from workflow reports.

`dev:chat` loads workforce `.env` and transiently uses the parent office's DealDesk credential if the standalone key is blank. It **forces scheduling off**. `npm start` requires independently configured `DEALDESK_PLUGIN_API_KEY`, `CHAT_ACCESS_PASSWORD` (12+ characters), and `STATUS_API_TOKEN` (32+ characters); scheduling remains controlled by the existing disabled-by-default setting. Neither command deploys anything. Restart the local service after configuration edits.

### Chat architecture and endpoints

- `src/chat-store.js` extends the existing Store without changing its workflow tables. It stores agent/user-scoped conversations, messages, turn metadata, activity, expiring hashed login sessions, daily token reservations, and fenced conversation locks.
- `src/chat.js` clones the existing Operations Manager configuration with shared operating instructions and a conversational output schema. It uses the official SDK streaming runner. Tools call the existing authorized DealDesk adapter or shared four-workflow service; no new agent or custom agent loop is introduced.
- `src/chat-http.js` provides password sign-in, HttpOnly/SameSite cookies, logout revocation, server-side ownership checks, same-origin checks, request-body limits and login throttling.
- `web/` is a dependency-free, responsive interface with safe text rendering, conversations, verified field rows, advisory recommendations, activity and per-turn usage.

All chat data routes require a valid server session:

- POST `/auth/login` with JSON `{password}`; GET `/auth/session`; POST `/auth/logout`.
- GET/POST `/chat/conversations` lists/creates the authenticated user's conversations.
- GET `/chat/conversations/:id` returns recent history and turn metadata.
- GET `/chat/conversations/:id/turns` returns executions.
- POST `/chat/conversations/:id/messages` with JSON `{message}` sends a turn over SSE.
- GET `/chat/status` returns recent conversational activity; existing GET `/status` also includes chat activity.

POST requests require `Content-Type: application/json`, `X-AZRE-Request: 1`, and a matching Origin when sent by a browser. Caller-supplied user IDs are not accepted. The local account is the CEO identity from `CHAT_USER_ID` (default `ceo`), not a general multi-user identity provider. Only `azre-operations-manager` is registered; future agents can use separate identity/conversation scopes after authorization.

### Fresh evidence and conversation context

`search_dealdesk` reads one bounded page using actual fields/filters, `get_dealdesk_record` reads a known ID, and `run_operational_audit` executes one of the existing four workflows in rules-only mode, persists that report and returns complete-retrieval counts with limited samples. The conversational SDK generates the explanation; it does not run a second nested paid AI briefing. Tools disclose page/sample limits and integration failures. Ask to continue with `next_offset` or request an audit for collection-wide coverage. Agent and buyer reads include available recorded profiles, not inferred suitability or outreach.

For every fact row, record/table/field/value must exactly match fresh tool observations. JSON-quoted strings are normalized only when they match the exact recorded string. Recommendation references must be retrieved this turn. UUID references elsewhere are checked against retrieved records and this turn's verified audit execution IDs. Notes are untrusted input; a record cannot change authorization. Free-text summaries and recommendations remain model judgments and require review; field validation is not a general guarantee against every narrative hallucination.

Full message history persists, but only the most recent 12 non-error messages within 16,000 characters are supplied as model context. No full tool response history or complete conversation is automatically resent. Retained assistant messages use the SDK's structured input format. If a question refers to older context outside this window, restate it. The UI retrieves the latest 200 messages per selected conversation; the database retains older messages for operational review. Access/retention/backups must reflect that conversations can contain sensitive business data.

SSE streams real agent activity while the SDK executes. The final structured reply is displayed only after fact/reference checks, so unvalidated partial model text is not shown. On reload, select the conversation to retrieve the persisted answer. A dropped browser connection does not repeat the model call or lose an execution already running on the server.

### Usage limits and recovery

Defaults: `CHAT_TURN_TOKEN_LIMIT=80000`, `CHAT_DAILY_TOKEN_LIMIT=400000` per CEO/New York calendar day, `CHAT_MAX_CONCURRENT=2`, 5 SDK model turns, 8 tool calls, 2,000 maximum output tokens per model request, 120-second timeout. Environment limits must be positive integers. The model wrapper reserves a conservative byte-based prompt/output allowance **before each request** and prevents requests above the per-turn allowance. Actual SDK aggregate usage is saved after completion. Daily reservations are transactional across workers on the same SQLite disk; failed calls with unavailable provider usage retain their reservation rather than being treated as free. These limits bound chat tokens; existing manually invoked audit AI calls retain their Phase 1.1 execution controls and are not charged against this chat ledger.

The existing usage helper records model/input/output/cached tokens, response ID, estimated verified standard text-token cost, elapsed seconds and sanitized tool call history for each chat turn. Unknown model pricing produces a null cost. No invoice-level claim is made; processing premiums and special cache charges may differ. Use OpenAI project budget/rate controls as an additional account-wide boundary.

A second request in the same conversation receives a conflict; different conversations can proceed up to configured capacity. Expired turns become Error at recovery and stale owners cannot commit replies. History can survive restarts; sessions expire after eight hours and can be revoked with logout. For deployment, configure TLS, `COOKIE_SECURE=true`, isolated secrets/storage and external authentication as appropriate; this phase only runs locally and schedules remain off.

### Validation

See `CHAT_VALIDATION.md` for the actual live conversation and final test results. `scripts/live-chat-validation.js` exercises authenticated multi-turn HTTP/SSE, fresh property/filter reads and persistence, without printing credential values. `scripts/preview-chat.js` is optional local visual QA using bundled Playwright and installed Chrome; it is not a runtime dependency. Preserve the existing 27 Phase 1.1 tests alongside the new chat tests.

## Broad-question retrieval and token management

The summary-first path now answers priority, no-offer, follow-up and queue-count questions without resending large audit evidence through repeated model/tool calls. See `TOKEN_MANAGEMENT_VALIDATION.md` for the observed failure, corrected accounting, final live results and limits. It supersedes Phase 1.2's original byte-based budget description. Default total turn/daily budgets are unchanged. Configure `CHAT_INPUT_TOKEN_LIMIT`, `CHAT_OUTPUT_TOKEN_LIMIT`, `CHAT_MAX_TOOL_CALLS`, `CHAT_TOOL_RESPONSE_BYTES`, `CHAT_HISTORY_MESSAGES` and `CHAT_HISTORY_CHARS` using `.env.example`, then restart the local service.

Exact summary counts appear as validated `Summary` fact rows. Broad replies show up to three record candidates and an explicit scope; ask for `get_operational_summary` continuation at the returned `nextOffset` to see more. Detail requests still use normal fresh read tools. Full audit workflows continue to persist reports independently. Conversation selection/recovery details and per-model-request usage are included in turn metadata; older history is kept in SQLite rather than silently deleted.

### Corporate knowledge (Phase 1.2.3)

The Operations Manager can search an explicitly authorized part of the local AZG Knowledge Base. See [KNOWLEDGE_INTEGRATION.md](KNOWLEDGE_INTEGRATION.md) for scope, approved sources, exclusions, local PDF OCR, incremental indexing, information authority and security limitations. Corporate knowledge never substitutes for live DealDesk records.

### Corporate identity reliability (Phase 1.2.4)

See [IDENTITY_RELIABILITY.md](IDENTITY_RELIABILITY.md) for the reproduced CEO retrieval failure, versioned identity configuration, explicit document authority classifications, provenance validation and live consistency evidence. Identity records are not operating policies. CEO, founder, ownership and departmental responsibilities remain distinct.
