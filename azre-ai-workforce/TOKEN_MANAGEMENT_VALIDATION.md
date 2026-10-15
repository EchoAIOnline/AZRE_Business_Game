# Broad executive questions — token-management fix

Validated October 12, 2026 (America/New_York). No production records or Virtual Office files changed. Scheduling stays disabled.

## Root cause established from execution evidence

The failed turn was `5817d1d8-fe1a-4f4a-b2db-cb922a1bfbc3`, in conversation `2fa8a8ad-9441-4e97-aaf6-6d0b0baef9c6`. It recorded application error `TURN_USAGE_LIMIT` after 21.388 seconds. It completed one operational audit, three individual record reads and one search. The conversation contained its initial user message and error; history accumulation did not cause this failure.

The previous wrapper added `Buffer.byteLength(JSON.stringify(request)) + 2000 + 4096` for every model call to an 80,000 'token' budget. Serialized bytes were incorrectly treated as tokens, and growing tool evidence was repeatedly charged at that inflated estimate. Audit sample records had to be read again before they could be referenced, encouraging multiple growing requests. The catch path discarded usage of completed provider requests when a later application check failed, leaving original usage null.

This establishes an application accounting/retrieval failure. There was no provider context-window or rate-limit error in this failed turn. It does not establish an exact historical provider token count: that information was not captured and cannot be reconstructed reliably from the old logs.

## Changes

- `src/token-budget.js`: tokenizer-based JSON request estimates with a 512-token framing margin, explicit per-input/output/turn controls, actual provider usage for completed requests, per-request telemetry, smaller-context recovery before rejection and conservative unknown-consumption reservations. This replaces byte-as-token arithmetic. Total 80,000 per-turn and 400,000 daily limits were not raised.
- `src/retrieval.js`: summary-first targeted DealDesk reads. Exact supported server filters select In Queue, No Offer Made Yet or In Pipeline. The application paginates and aggregates before the model sees data. Broad follow-up/all-priority predicates run on the server because the authorized API lacks inequality/OR/aggregation queries. Only compact selected fields for up to three candidates plus a checked count are sent; no buyer/agent collections, notes or descriptions are loaded into model context. `nextOffset` supports subsequent candidate pages.
- `src/chat.js`: broad-question routing performs one fresh summary read before the SDK response. Its known record IDs constrain the output schema; candidate evidence is already verified, so redundant record reads are unnecessary. Normal detail/tool conversations and explicit persisted audit workflows remain available. Summary count rows are checked against complete aggregation, never asserted for partial retrieval. Large search pages narrow to a smaller page with an explicit continuation offset when needed.
- `src/context.js`: configurable selective recent history. Assistant context is compacted to summary, a small set of facts/recommendations and references; older prose is omitted while the first and recent property references are retained. Omission/recovery is recorded and shown in the UI. Full persisted history is unchanged. Omitted critical narrative must be restated, not inferred.
- Separate error categories: application `MODEL_INPUT_LIMIT`, application `TURN_USAGE_LIMIT`, provider `OPENAI_CONTEXT_LIMIT`, provider `OPENAI_RATE_LIMIT`, and existing auth/billing/outage categories. Completed provider usage survives later failures; unknown failed-call consumption retains the reservation.
- SQLite metadata records configured limits, estimated input tokens, serialized bytes (explicitly bytes), actual request usage/cache usage, request duration, tools, response sizes, retrieval pages/examined counts, context selection, recoveries and exhaustion reason. No credentials or raw request payloads are logged.

Pipeline Status remains offerDecision; Queue Status remains queueStatus. 'Pipeline priorities' is explicitly scoped to records whose Queue Status is In Pipeline. Overall priorities cover recorded deals in all queue placements. Ranking is advisory: current recorded deadlines, pending offers, response waits and underwriting. Off-market listing removal does not exclude a recorded agent-response wait. Closed/disposable test records are not treated as active priority candidates.

## Configurable limits

| Environment variable | Default |
|---|---:|
| CHAT_TURN_TOKEN_LIMIT | 80,000, unchanged |
| CHAT_DAILY_TOKEN_LIMIT | 400,000, unchanged |
| CHAT_INPUT_TOKEN_LIMIT | 16,000 per model request |
| CHAT_OUTPUT_TOKEN_LIMIT | 2,000 per model request |
| CHAT_MAX_TOOL_CALLS | 8 |
| CHAT_TOOL_RESPONSE_BYTES | 14,000 |
| CHAT_HISTORY_MESSAGES | 12 |
| CHAT_HISTORY_CHARS | 6,000 |

The `o200k_base` estimate over serialized SDK requests is an approximation, not a claim about GPT-6 Luna's exact internal tokenizer/wire framing. Provider-reported usage is authoritative; an overhead margin is used. Recovering an oversized request removes older narrative while preserving the current question, developer constraints and current tool evidence. If critical context is still too large, the explicit application limit is reported. Provider context and rate errors remain distinct.

## Final live results

All five questions succeeded sequentially in conversation `61c59747-49b4-4b3c-9944-930dece063ce`, exercising accumulating history. Model: `gpt-6-luna`. Every question used one model request and one compact summary retrieval.

| Question | Input tokens | Output tokens | Total | Time | Tool result bytes |
|---|---:|---:|---:|---:|---:|
| Priority deals in the pipeline today | 1,625 | 1,433 | 3,058 | 16.813s | 1,812 |
| Properties with no offers | 2,038 | 971 | 3,009 | 12.353s | 1,676 |
| Properties needing agent follow-up | 2,076 | 636 | 2,712 | 7.773s | 1,380 |
| Most important operational priorities | 2,616 | 1,251 | 3,867 | 13.367s | 1,790 |
| Properties currently In Queue | 2,515 | 229 | 2,744 | 4.725s | 568 |

Total: **15,390 tokens**, estimated standard text-token cost **$0.00304811**, excluding earlier development retries. Cached input: 1,108 / 1,114 / 0 / 1,099 / 0 respectively. Cost uses documented GPT-6 Luna standard pricing: https://developers.openai.com/api/docs/models/gpt-6-luna. It is an estimate, not an invoice.

Verified counts: 32 advisory candidates among 239 In Pipeline records; seven No Offer Made Yet records; two recorded follow-up candidates; 96 advisory priority candidates across 501 examined deals; 256 In Queue records. Candidate counts represent the stated ranking/filter rules, not a confirmed business obligation or comprehensive company task inventory. The initial response shows a limited set; more candidates can be requested using the summary continuation offset.

Every property-specific fact/reference passed the fresh-observation validator. Independent fresh reads then matched **45 field values across 11 distinct referenced properties**. Narrative recommendations were reviewed against the stated rules and facts; no unsupported property finding was identified. Free-text judgments still require human review.

Evidence: gitignored `data/executive-question-validation.json`, SQLite conversation/turn history and request metadata. `scripts/validate-executive-questions.js` repeats the five-question test; `scripts/verify-executive-evidence.js` checks property fields independently without printing credentials.

## Regression and remaining limits

**50 tests passed, 0 failed**, preserving Phase 1.1/1.2 tests. New cases cover executive routing, server filters/pagination, bounded fields, exact/partial counts, repeated request accounting, input recovery, completed usage on later failure, reference preservation, error classification, off-market follow-up, continuation pages and unknown provider consumption. Authenticated desktop/mobile UI loads with no script errors.

The authorized DealDesk API has no server count/aggregation/field-selection endpoint; complete summary counts therefore require bounded page reads on the application server. Full raw collections are never injected into the model. The broad operational summary ranks Deals; company-wide task/buyer/agent analysis remains available through the existing explicit workflows/tools and is not claimed by this summary. Source changes during pagination can affect point-in-time counts; this is not a transactional snapshot. Partial pages/errors are disclosed. The model's narrative can still need correction even when exact fields and IDs are validated. Tokens for incomplete provider calls may be unknown; daily reservations remain conservative.
