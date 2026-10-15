# Phase 1.3A — named employees and shared chat

## Employees and shared implementation

Ryan Oliver is the existing Operations Manager under the unchanged immutable ID `azre-operations-manager`. No second Operations Manager was created. Existing conversations, audit workflows, SQLite execution records, reporting, corporate identity and read-only DealDesk tools remain available. Marcus Vance is the Acquisitions Manager under `azre-acquisitions-manager`; he reports operationally to Ryan with CEO oversight. Both use the official installed OpenAI Agents SDK and the same bounded ChatService, identity provider, knowledge service, authentication and accounting infrastructure.

`config/agents.json` owns each employee's name, role, mention handle, status, instructions, tool allowlist and knowledge role. `src/agent-registry.js` validates unique identities and exposes immutable runtime records. The human CEO has a separate actor ID and is never invoked as an AI. The registry supplies sidebar entries and shared team context; adding an employee requires a reviewed registry/permission entry, not a second application implementation. Agent-specific instructions are applied when the existing SDK agent is cloned for an employee.

## Conversations, migration and permissions

Each private conversation belongs to a human owner and immutable employee ID. Agent-bound store views reject another employee's private conversation before retrieving history or starting a turn. An authenticated CEO can navigate both employees' private histories; neither model can query the other's private messages. Existing Operations Manager IDs and history remain unchanged. Additive SQLite migrations introduce sender IDs, turn employee IDs and read cursors; legacy assistant records are attributed to Ryan without rewriting their content. Usage and execution metadata include the responsible employee. Daily reservations remain shared across the CEO's employees, avoiding a doubled API allowance; all existing input/output/tool/history limits remain intact.

The sidebar always orders AZRE General Chat, Ryan, then Marcus. Private histories filter by employee, with current selection, initials and unread indicators. The CEO footer reads Founder & CEO. General Chat has persistent human/employee messages, sender labels, timestamps, safe Markdown, autocomplete and explicit activity states. Human text is preserved as the original string; safe display markup is generated on the server.

Mention routing resolves registered handles to immutable IDs, case-insensitively, and deduplicates repeated mentions. A CEO message with `@Ryan` or `@Marcus` invokes only those employees, once each, sequentially. `@Ashari` references the human. Unmentioned messages persist without an API call. Generated AI replies never enter mention routing, so there are no autonomous conversation loops or peer task delegation. Public General Chat context is distinct from private conversations. Busy-group guards and existing execution leases prevent overlapping replies from the same local application instance.

## Marcus's authorized analysis

Marcus receives read-only Deals and Buyers lookup/search, operational summaries and a read-only acquisition analysis tool. He does not receive Ryan's audit-execution tool, contact/task-directory reads, production writes, offers, contracts, funds or communications. Shared knowledge is bound to the acquisitions view; lender and financial documents remain denied. Approved comparable-sale requirements are recorded in the current standards file and exposed through the shared policy service.

The acquisition tool fetches one actual property, captures factual fields, and calculates renovation ARV × 40% and new-construction ARV × 20%–25% only when positive recorded ARVs exist. Verified derived numeric metrics are inserted into the ordinary evidence validator, not fabricated by the model. Recorded costs are distinguished from missing financing, transaction/holding and buyer-profit assumptions. Buyer profiles can be read and compared with property attributes, but a CRM “verified” label is never sufficient financial verification.

**Remaining comparable limitation:** the application has no authorized independent MLS sales feed. Existing DealDesk comparable slots are retrievable candidates; the app cannot independently establish closed on-market retail MLS status, condition/spec-infill classification, sale recency, distance or matching attributes solely from those slots. The live analysis explicitly reports that limitation and never pads three unverified candidates into three verified sales. Connecting a licensed, authorized sales source is still needed for independent comparable discovery and verification. Neither a complete construction budget nor validated transaction profit is claimed.

## Files

Created: `config/agents.json`, `src/agent-registry.js`, `src/workforce-chat.js`, `src/acquisitions.js`, `src/group-markdown.js`, `test/workforce.test.js`, `scripts/validate-workforce.js`, `scripts/check-workforce-ui.js`, this document.

Modified: `src/chat-store.js`, `src/chat-http.js`, `src/chat.js`, `src/cli.js`, `src/agent.js`, `src/knowledge-agent.js`, `src/knowledge-service.js`, `src/identity-agent.js`, `src/presentation.js`, `web/index.html`, `web/app.js`, `web/styles.css`, `policies/current-operating-standards.md`, `policies/corporate-identity-record.md`. The existing SDK-name assertion in `test/core.test.js` was updated from the old title to Ryan Oliver; the test still verifies the unchanged read-only audit tool and structured output. None of the 77 preexisting tests were removed or weakened.

## Security and scope

No production deployment, Obsidian source changes, DealDesk record modifications, Virtual Office changes, external communications or agent-to-agent delegation occurred. Local dev startup continues to force scheduling off. Browser sessions, CSRF checks, user ownership, tool limits and token accounting remain enforced. API credentials stay on the server.
