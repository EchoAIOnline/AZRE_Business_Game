# Phase 1.1 — verified live AI executive briefing

Validated October 12, 2026, America/New_York. Phase 2, additional agents and Virtual Office integration have not started.

## Accepted execution

- Execution ID: `3214f088-4983-4a76-b2d8-492cf2e04382`
- Official OpenAI Agents SDK: `@openai/agents` 0.20.0, Agent + Runner, Responses API.
- Actual configured model: `gpt-6-luna`; API execution succeeded with 2 requests.
- Provider response ID: `resp_0007c35ea1f8f53c006acd9415d75c87d298359ae5ab010ef6`
- Execution time: approximately 18.7 seconds including retrieval, audit and AI generation.
- Complete retrieval: 501 Deals, 416 Buyers, 1,891 Agents, 0 PluginTasks.
- Model input: rule findings, task review, coverage and pipeline distributions; raw buyer/agent profiles and free-text logs are not sent. Retrieved buyers/agents contribute coverage, not full model analysis of their profiles.
- SDK token usage: 63,495 input + 1,435 output = **64,930 total**, cached input 0.
- Estimated standard API cost: **$0.007067** (about 0.71 cents). Estimate excludes deployment cost and any account-specific processing premiums/cache-write charges. Not an invoice.
- Official rates checked: $0.10 input, $0.01 cached input and $0.50 output per million tokens. This run is below the long-context threshold.

Source: https://developers.openai.com/api/docs/models/gpt-6-luna

## Factual validation

The accepted model output copied every queue and pipeline aggregate correctly; the local validator independently compared all status/count keys. Queue Status (`queueStatus`) and Pipeline Status (`offerDecision`) are handled separately. Examples confirmed by fresh read-only record requests:

- `0046e9d6-12ba-425a-9d30-1213102d7531`: In Queue, Made Written Offer On Property, Sent LOI Email — review queue/communication evidence, not automatic correction.
- `1321ed85-b0be-49f9-80f3-6ab511359dfd`: In Pipeline, Listing Removed - Now Off Market, Agent Not Contacted Yet — communication mismatch.
- `35ad7db1-fb11-44a2-95bf-2154aaaef6ad`: recorded inspectionDate 2026-01-30; recommendation explicitly asks to verify current transaction status rather than asserting an active contract.
- `1cbb0b5c-1127-47d1-864d-a620fcbad175`: missing queueStatus and Available offerDecision, outside the acquisition tool's supported enum. Review legacy/JV status policy; never silently map or mutate it.

All **11 distinct property IDs referenced anywhere in the final briefing** were confirmed through authorized reads. Narrative priorities/exceptions were compared against observed fields and rule findings; no unsupported factual assertion was found in the accepted briefing. Potential duplicate is explicitly a human-review recommendation, not a confirmed identity assertion. Company actions still require human approval. Future model output can still be wrong; validation of this run is not a guarantee for future runs.

The first live model output contained an incorrect status count and was rejected during review. Its history and exports now explicitly mark failed validation. Added exact aggregate checks and reran. Live checking also uncovered a rule false positive from placeholder MLS `n/a`; placeholder values now fall back to address comparison. Records explicitly labelled disposable synthetic test data are flagged as test records and excluded from business priorities. Pipeline distributions still reflect all retrieved records, including labelled tests; the active count is a rule classification, not a confirmed live-opportunity total.

## Why zero PluginTasks

The standalone API successfully read the organization-scoped PluginTasks collection, without a status/query filter, returning an empty final page. A separate hosted MCP `search_tasks` read with `include_archived=true` also returned `records=[]`, `next_offset=null`. Archive filtering and client pagination did not cause the empty result. Source inspection confirms PluginTasks is its own table scoped by organization. Other assigned-work fields (for example contractor `assignedTasks`) are not PluginTasks and are not imported into it. The evidence establishes zero records visible to these authorized task reads; it does not establish company-wide absence of work or reveal whether tasks were never created, removed previously, or hidden by other server permissions.

## Persistence and regression tests

The accepted structured briefing, usage, cost, response ID, timing and validation metadata are in SQLite `data/operations.sqlite` and matching JSON/Markdown:

- `data/reports/3214f088-4983-4a76-b2d8-492cf2e04382.json`
- `data/reports/3214f088-4983-4a76-b2d8-492cf2e04382.md`

SQLite/JSON equality and Markdown existence were verified after recording the factual review. Reports and database remain gitignored business data.

**27 automated tests passed, 0 failed.** All four workflows retain execution/export behavior; tests also cover status API authentication, schedules disabled by default, concurrency/recovery, retrieval/pagination, queue/pipeline rules, persistent failures, actual SDK runner with simulated API outage, references, aggregates, Luna costs and live-discovered rule regressions. No model API calls are made by these tests.

## Configuration and safeguards

A configured OpenAI key was checked and successfully used without printing it. Model selection remains environment-driven. The workforce DealDesk key is blank, so the live validation script transiently used the existing authorized parent credential without copying it. For independent deployment, provide a dedicated read-only `DEALDESK_PLUGIN_API_KEY` in the workforce `.env` or secret manager. `.env` is owner-only and gitignored; never paste keys in chat, logs, source or shell arguments. API keys are created at https://platform.openai.com/api-keys.

Keep schedules disabled until explicitly enabled. The only SDK tool reads the verified audit; no mutation, shell, email, contract or financial tools are registered. Record data cannot authorize actions. Model output must use the audit tool, pass structured-output schema checks, preserve exact pipeline aggregates and reference known recommendation records. Known API configuration/authentication/billing/model/rate-limit/outage failures are sanitized. Narrative factual review is still required before relying on a new briefing.

Run `node scripts/live-validation.js` for another authorized live briefing and `node scripts/verify-artifacts.js` to check latest-successful execution persistence. Scripts never display credential values. Live generation requires configured billing/model access; a failed call is not a verified briefing.
