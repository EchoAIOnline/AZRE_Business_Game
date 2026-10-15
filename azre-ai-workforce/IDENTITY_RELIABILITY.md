# Phase 1.2.4 — diagnosis before implementation

On October 14, 2026 the exact pair was executed against the existing authenticated chat before implementation. `Who is Ashari Zakar?` routed to corporate search and cited the bio. `Who is the CEO of AZRE?` did not route to corporate search (`isKnowledgeQuestion` omitted CEO/title/reporting/acronym variants), used no tools and returned a CEO answer without corporate source validation. Thus the reported refusal is not deterministic after a successful preceding answer: retained generated narrative can mask the retrieval defect. The recorded pair did not refuse, but did reproduce inconsistent routing and provenance. This is not a model context-window or token-budget failure.

Index inspection independently confirmed that the company bio was marked `approved-policy`. `KnowledgeIndex.sync` promoted every non-draft/nonhistorical allowlisted file whenever the folder-wide approval object existed. Neither frontmatter nor document-specific policy authority was required. This incorrectly conflated approval to use a source with authority to govern operations.

Identity content is duplicated in the generic agent and presentation prompts but neither reliably supplies a validated CEO name. `selectHistory` keeps assistant narrative but omits its corporate source provenance. Normal DealDesk validation verifies record facts, not arbitrary corporate statements in prose. Therefore a CEO answer inferred from prior prose is not evidence validation. Search ranking also gives the biography a boost for literal `who is ashari`/`what is azre`, not equivalent CEO/title questions. No index outage was observed in the successful first question.

Baseline evidence: `data/identity-baseline-pair.json` and `data/identity-root-cause.json`. Source authority was inspected directly in local knowledge SQLite. These findings were recorded before changing the implementation.

A fresh conversation executed the CEO question first and reproduced the reported refusal exactly: “The CEO’s name isn’t specified in the information I have.” No knowledge tool was used; input was only 2,393 tokens, excluding token limits as the cause. This baseline is saved in `data/identity-root-cause.json`.

## Implemented architecture

`config/corporate-identity.json` is the single versioned identity configuration. `CorporateIdentityProvider` validates underlying documents and exact approval statements on each use, supplies compact context, maps equivalent wording to typed identity fields and preserves source hashes/provenance. `policies/corporate-identity-record.md` transparently records the CEO's direct confirmation that he is CEO and founder and is **not** the Acquisitions Manager. It is a corporate identity approval record, not an operating policy or an invented Obsidian citation. The approved specification supplies company nomenclature, business and reporting configuration. The real Obsidian bio corroborates CEO identity. Headquarters designation and ownership remain requiring verification; founder and CEO do not imply ownership.

The shared platform service exposes this provider to departmental views. Essential identity is injected into operational and corporate conversations, with no broad vault retrieval needed. Identity questions use the existing Operations Manager SDK agent with typed field selection; server rendering only uses freshly source-validated values. Prior AI answers never establish identity. Missing or altered sources fail closed; conflicting CEO assertions require review. The same verified source supports different wording through semantic intent/field mapping without relaxing record or quotation validation.

Index authority now uses explicit per-document classifications. The biography and corporate overview are identity records, operating rules come from the separately approved standards file, supporting documents are references, and strategy research is historical. Folder location and permission to index no longer promote a document to policy authority. Authority configuration is included in incremental fingerprints. Old saved answers remain intact; their old blanket authority label is identified as a legacy classification in the UI rather than presented as current approval.

## Modified files

New: `config/corporate-identity.json`, `policies/corporate-identity-record.md`, `src/corporate-identity.js`, `src/identity-agent.js`, `test/corporate-identity.test.js`, `scripts/diagnose-identity.js`, `scripts/validate-identity.js`, this document.

Updated: `config/knowledge.json`, `src/knowledge.js`, `src/knowledge-service.js`, `src/knowledge-agent.js`, `src/chat.js`, `src/agent.js`, `src/presentation.js`, `web/app.js`, `test/knowledge.test.js`. Company facts were removed from duplicate prompt text in favor of the shared provider.

Limitations: a compact versioned configuration requires reviewed edits for future personnel changes. Missing sources and conflicting leadership statements are exposed rather than guessed. Semantic intent rules cover tested identity aliases, not every possible language. Corporate knowledge remains read-only, departmental permissions and external-excerpt authorization remain enforced, and no agents or production integrations were added.

## Final verification — October 14, 2026

77 automated tests passed, zero failed. Thirteen live answers across three conversations and different question orders passed typed-field/source validation, including exact aliases, bare CEO follow-up, founder, reporting, company identity, and CEO-not-Acquisitions-Manager. A final authenticated check on the restarted application also passed. All CEO answers preserve the real authorized Obsidian biography as corroborating provenance. The actual refreshed index classifies that biography as corporate-identity-record; eleven allowlisted documents synced with no errors.

Model: gpt-6-luna. Fourteen final live validation answers totaled 16,865 tokens, 23.787 seconds combined, estimated API cost $0.00126105 using the application's configured standard-text pricing estimate. These figures exclude baseline diagnosis and development retries and are not an invoice. Evidence: data/identity-consistency-validation.json and data/identity-smoke-validation.json; each turn also persists in SQLite. Existing tests retain token-budget, authentication, audit/export, schedule and status-API coverage.

Authorized-source security is preserved: no vault source edits, no production writes, no external communications, no new agents and no Virtual Office changes. The current headquarters designation, ownership and the identity of the Acquisitions Manager remain unverified; no roles are inferred from CEO/founder status.
