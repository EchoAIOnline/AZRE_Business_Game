# Phase 1.2.3 — local corporate knowledge

The existing Operations Manager now has an optional read-only corporate knowledge route and official Agents SDK `search_corporate_knowledge` function tool. Existing DealDesk workflows and their exact record validation remain separate and unchanged. Corporate conversations use the same authenticated API, bounded history, token accounting, daily reservations and SQLite conversation persistence.

## Authorized source scope

Vault discovered from Obsidian configuration (not guessed):
`/Users/asharizakar/Desktop/Zakarian Desktop/Projects/Obsidian AI/AZG Knowledge Base`

Scope: `Ashari Zakar Real Estate`. Exact document allowlist and CEO approval/transfer authorization are in `config/knowledge.json`. Eleven selected documents include the corporate overview, company bio, acquisitions playbook/buy box/outline, agent relationship system, wholetailing strategy reference, marketing overview, DealDesk overview, Purchase Terms PDF and full Playbook PDF. Source originals are never modified.

Excluded: all other vault folders, Private Lenders, Deals, buyer research/dossiers, Basic Information (banking/wiring), deal stories, research transcripts, Administration/assets and unlisted documents. Following an Obsidian link does not authorize or ingest its target. Sensitive-content and instruction-like-content checks additionally exclude matching selected files. These heuristics supplement the explicit allowlist; they do not prove every future document free of confidential information.

CEO approved corporate policy documents and separately authorized selected nonconfidential excerpts to the configured OpenAI API on October 14, 2026. Draft outlines and external research/strategy references retain lower authority. Unresolved discrepancies in acquisition criteria, spread floors and exit strategies are explicitly reported; timestamps never determine the winner. Live DealDesk governs operational facts. Established application configuration governs Queue Status/Pipeline Status semantics.

## Local index and retrieval

`src/knowledge.js` stores document hashes, titles, paths, authority, approval metadata, Obsidian links/frontmatter and bounded page/chunk text in local SQLite FTS5 (`data/knowledge.sqlite`, owner-only permissions). Searches combine keyword relevance with curated conceptual expansion. This is a lightweight local hybrid; it is not a neural embedding model. No embedding API or cloud index is enabled.

Incremental sync hashes allowlisted documents before each knowledge request, updates changed files, removes missing/revoked sources and fails closed on extraction/access errors. Real paths and allowlists prevent traversal, symlink escape and access to unrelated folders. Each search returns at most five chunks and approximately ten KB, within existing tool/input limits. Full documents are not sent to OpenAI.

PDF text extraction uses local pdfjs-dist with scripting/evaluation disabled. Both actual selected PDFs are scans; macOS Vision OCR extracts their page text locally. Build the helper with `swiftc scripts/extract-pdf.swift -o data/pdf-ocr`; `KNOWLEDGE_OCR_BINARY` optionally specifies its path. A platform without this helper can extract text PDFs but cannot index scans. OCR can misread characters: verify original pages before consequential use. No OCR service receives files.

Run `node --env-file-if-exists=.env src/cli.js knowledge-index` from the app folder to rebuild/sync; repeat runs reuse unchanged content. `KNOWLEDGE_ENABLED=true`, `KNOWLEDGE_CONFIG`, `KNOWLEDGE_DB` select local configuration. Source approval and API excerpt authorization are separate; the latter must be explicitly true or external knowledge answers fail closed. External embeddings fail closed if enabled: adding a provider requires separate authorization and implementation.

## Grounding and security

Corporate answers select exact contiguous quotations from retrieved excerpts. Server validation rejects unknown source IDs and altered quotations. The UI renders safe Markdown with original paths, page numbers, authority and collapsed supporting evidence. The model's coverage/interpretation summary is advisory; quotation validation is not proof of every free-text assertion. Documents are untrusted data, never instructions. This route exposes only local read-only search, not arbitrary filesystem access, commands or outbound tools.

The agent must disclose missing knowledge instead of inventing buyer-verification procedures, construction formulas or lending policies. Private lending files remain unavailable. A difference between approved sources requires CEO review rather than a fabricated unified policy.

## Extension and cloud readiness

Extraction adapters accept additional extensions, but new documents must be explicitly added to the allowlist after authorization. Selected books can be added this way; no book or unrelated business folder is currently ingested. Cloud synchronization is deliberately not implemented: deploy approved scope manifests and encrypted, tenant-isolated indexes with authentication, retention and revocation controls before exporting any source content. Local absolute vault paths are configuration, not a cloud mount.

## Validation

See `data/knowledge-validation.json` for actual live questions, source excerpts, usage, elapsed time and persisted turn IDs. Automated tests cover incremental updates/deletion, source IDs and exact quotation rejection, authority/conflicts, concept retrieval, PDF adapters, sensitive/injection exclusions, revoked access, traversal/symlink escape and disabled external embeddings. Existing authentication, status API, audit reporting and token-budget suites remain part of `npm test`.

### Verified result — October 14, 2026

All eight requested questions completed using gpt-6-luna. Final eight-question run consumed 42,755 tokens, 63.78 seconds combined, estimated $0.005238 API cost. Every turn is persisted in the existing SQLite conversation store. Both actual scanned PDFs contributed page-cited answers. A further SureCash validation confirmed contract-timing conflicts are explicitly flagged (7,202 tokens, 10.533 seconds, cost recorded in data/knowledge-followup-validation.json). Earlier development retries are additional API consumption and are not included in these final-run totals.

Automated suite: 70 tests passed, zero failed. Local indexing: eleven documents, zero extraction errors; unchanged files reused on subsequent sync. Corporate questions correctly acknowledge missing detailed buyer-verification checks and a separate new-construction formula, rather than fabricate them. Current buy box and contract terms require CEO resolution of the documented contradictions. Neural embeddings and cloud synchronization are extension points, not implemented capabilities.

## Approved operating standards and shared platform service — October 14, 2026

`policies/current-operating-standards.md` records the CEO's current acquisition targets (renovation 40% ARV; teardown/new construction 20–25% ARV), on-market Metro Atlanta focus, default SureCash terms (1% EMD, seven-day due diligence, 30-day closing, as-is), communication ownership, and meaningful-communication queue rules. Percentages are preliminary screening targets, not construction budgets or complete underwriting. Defaults allow negotiated exceptions. The CEO did not establish a universal EMD delivery deadline or redefine the seven days as business days; older conflicting deadlines must not be imported. Contradictory Obsidian sources remain unchanged and flagged for review. Earlier validation findings describing missing construction screening percentages or unresolved current defaults are superseded by this approved policy; missing detailed budgets and buyer procedures remain missing.

`PlatformKnowledgeService` owns shared retrieval and the current policy independently of Operations Manager. The application creates it at the composition boundary; chat receives only its server-assigned operations department view. Future departments receive distinct views: acquisitions, dispositions, marketing, transactions and accounting. Document permissions are applied before ranking and returned snippets; unknown departments fail closed. Current policy sections have their own departmental permissions. Private lender, banking, financial and personal sources remain denied for all configured roles. No new agents, outbound permissions or cloud synchronization were added. Departmental responsibility is a policy statement, not authority to send communications in this read-only application.

Covered normative questions use only current-policy quotations; older supporting sources cannot replace the canonical standards. Broader process questions may cite supporting procedures for subjects the policy does not supersede. Ordinary operational chat also receives the small department-permitted current policy context through the shared service, within existing model budgets. The shared index remains local and read-only toward source files. Approval of additional confidential sources requires a separately reviewed scope and permission change.

Current-policy validation: one live gpt-6-luna answer quoted all four approved sections correctly (3,095 tokens, 7.178 seconds). Persisted evidence: `data/current-policy-validation.json` and the existing conversation SQLite store. Full suite after this change: 72 passed, zero failed. Conflict registry now records the canonical policy and retains the contradictory source paths for review; historical validation artifacts describe the policy state at their execution time.

Phase 1.2.4 supersedes the earlier folder-wide authority assignment: explicit per-document classifications now distinguish corporate identity, operating policy, reference and historical documents. The biography is a corporate identity record, not an operating policy. See `IDENTITY_RELIABILITY.md`. CEO/founder are verified separately through direct confirmations; the CEO is not Acquisitions Manager. Shared identity context is source-validated on each use, not inferred from prior AI prose.
