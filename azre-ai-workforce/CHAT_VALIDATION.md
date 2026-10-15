# Phase 1.2 — direct communication validation

Verified October 12, 2026, America/New_York. The standalone application is running locally at **http://127.0.0.1:3101**. Nothing was deployed and autonomous schedules are disabled. No additional agents or Virtual Office integration were implemented.

## Delivered

An authenticated web workspace with Operations Manager identity, new/previous conversations, persisted message history, fresh DealDesk question answering, analytical workflow tools, activity notifications, per-turn usage and sanitized errors. The existing SDK agent factory/instructions and DealDesk adapter are reused. The four Phase 1.1 workflows, reports, SQLite execution state, scheduling configuration and machine status API remain available.

New implementation: `src/chat-store.js`, `src/chat.js`, `src/chat-http.js`, `web/index.html`, `web/styles.css`, `web/app.js`, `test/chat.test.js`, local startup/validation/visual QA scripts. Extended `agent.js` with shared operating policy; `dealdesk.js` with allowlisted search filters; `server.js`, `cli.js`, `.env.example`, `package.json`, Dockerfile and documentation with chat support. Fixed deterministic SQLite ordering for tied execution timestamps in `store.js`.

## Live conversation

Conversation ID: `30852c9c-982b-4c0c-a865-e0f7e28fdea6`.

1. Read fresh property `0046e9d6-12ba-425a-9d30-1213102d7531`. Verified address, offerDecision (Made Written Offer On Property), queueStatus (In Queue), contactStatus (Sent LOI Email).
2. Follow-up reused the same property without resupplying its ID and retrieved fresh data. During narrative review, queue meaning needed clarification; precise AZRE communication definitions were added to shared agent instructions.
3. Filtered fresh Deals by offerDecision = No Offer Made Yet, offset 0, limit 3. Verified property IDs/addresses/queueStatus from returned records and disclosed next_offset 3/page-only coverage.
4. Restarted the server and signed in again. The same conversation retained six messages. A further follow-up returned to the original property, retrieved it again, correctly explained that In Queue means communication has not yet occurred under AZRE policy, and flagged its conflict with Sent LOI Email. No actions or record changes were taken. History then contained eight messages.
5. Requested a fresh pipeline review through chat. `run_operational_audit` invoked the shared workflow service, persisted audit `06e76e17-c290-47be-96fa-be7fbe82bee8`, and returned complete-retrieval coverage with qualitative priorities and advisory recommendations. The conversation then contained ten messages.

The five demonstrated turns used **gpt-6-luna**, total **29,790 SDK tokens**, estimated standard token cost **$0.00234538**, excluding earlier development retries. Per-turn usage, tool calls, response IDs and timing are stored in SQLite and the gitignored `data/phase-1.2-live-validation.json`. Earlier withheld fact-schema failures and the clarified narrative remain visible as operational history; no false claim of flawless initial output is made.

The resumed fourth turn used 5,663 input + 390 output tokens (2,679 cached input), 7.278 seconds and estimated $0.00052019. The fifth analytical turn used 11,833 input + 438 output tokens (9,977 cached), 13.728 seconds and estimated $0.00050437. Pricing comes from https://developers.openai.com/api/docs/models/gpt-6-luna, standard short-context text tokens, checked October 12, 2026. Estimates are not invoices.

## Browser verification

Installed Chrome/Playwright checked desktop (1440×1000) and mobile (390×844) layouts. Browser sign-in, new conversation, actual message submission, streamed activity and a fresh verified DealDesk answer succeeded. Two exact fact rows rendered; no client script errors or horizontal overflow were found. Screenshots: `data/chat-desktop.png`, `data/chat-mobile.png` (gitignored). The browser never received OpenAI/DealDesk credentials.

## Tests and safeguards

**38 tests passed, 0 failed**, preserving all 27 Phase 1.1 tests. Chat tests cover initialization, ownership, cookie authentication/CSRF/logout, creation/retrieval/persistence across restarts, bounded multi-turn SDK context, allowlisted tool registration/execution, exact fact checks, schema field names, API failures, concurrent conversations, daily reservations, per-request usage limits, activity, token metadata and expired-lease recovery. Existing audits continue to pass; the live chat pipeline review also verified workflow interoperability.

The agent has only read tools. User/agent ownership is enforced server-side. Sessions use hashed server-side tokens and HttpOnly/SameSite cookies. Notes/history cannot authorize writes. The structured fact schema rejects display labels as field names and compares each field/value against fresh observed records. Unverified model output is withheld. Streaming uses SDK execution and SSE activity; final text is shown after verification, rather than displaying unvalidated draft tokens.

Free-text summaries and recommendations still require judgment. The verified field/reference boundary does not mathematically prove every narrative statement. The live follow-up review exposed and corrected a queue-policy ambiguity; current instructions now explicitly preserve AZRE definitions and recommend human review of conflicting evidence.

## Access and remaining scope

Start with `npm run dev:chat` from this repository. Sign in with the dedicated `CHAT_ACCESS_PASSWORD` stored in the protected workforce `.env`. The password is intentionally not shown in chat/logs. Local startup transiently uses the existing parent DealDesk key if the workforce key is blank; configure a dedicated read-only workforce key before independent deployment. Generated `STATUS_API_TOKEN` preserves the bearer interface; chat uses separate session authentication. Both secrets remain server-side.

Local service sessions expire after eight hours. The CEO is one configured identity; this phase is not a full organization SSO/roles implementation. Context is the latest 12 non-error messages within 16,000 characters; the UI displays up to 200 recent messages while SQLite retains the rest. Older context must be restated. Daily chat token limits are separate from legacy manually initiated audit-AI calls. One SQLite host is supported; distributed deployments need shared transactional storage. Keep `SCHEDULE_ENABLED=false`; local startup additionally forces it off. No production release is part of this phase.
