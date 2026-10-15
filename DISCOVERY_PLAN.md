# AZRE virtual office — discovery and approval draft

Prepared October 8, 2026. Status: planning only; implementation is not authorized.

## Recommended first version

One browser-based office floor, three AI employees, and one connected workflow: choose an existing DealDesk deal → prepare a screening brief → screen buyers and draft outreach → prepare an operations handoff → human reviews and approves the package. Work continues on the server while the office is closed. DealDesk Hosted remains the authoritative CRM; Outlook is the business email system.

The first useful completion is an approved internal package, not an automatically sent email. Sending, offers, signing, and payments remain human actions in version one. Creating an Outlook draft or writing an approved result to DealDesk would require later implementation authorization and appropriately scoped credentials.

## Reference recording findings

Reviewed 21 visual samples across the 61.54-second recording, including its beginning, transitions, and ending. This is visual review, not an audio transcript or verification of the promoted product's backend.

| Approximate time | Observed feature | Proposed use |
|---|---|---|
| 0–9 seconds | Seated human avatars, white desks, multiple monitors, keyboards, plants; purple/pink ambient lighting and glass partitions | Three recognizable workstations with restrained working animations |
| 12–18 seconds | Angled overhead floor view, repeated glass rooms, red/orange illuminated circulation paths, visible desks and employees | Default overview that makes all three employees easy to find |
| 21–25 seconds | Corridor-level view with ceiling lights, glass rooms, and an avatar in the hallway | Optional close view or camera presets after the basic workflow works |
| 28–40 seconds | Workstation closeups, charts and text on monitors, further camera/view changes and a walking avatar | Selected employee camera focus; desk display mirrors real task stage |
| 43–59 seconds | Separate purple financial dashboard with tables, historical-return and analytics controls | Translate into a real estate task/approval panel; do not import financial claims |
| End | Phone control center appears | Recording artifact, not office design |

The clip supports office layout, lighting, avatar presence, camera changes, and dashboard presentation as visual references. It does not establish click-to-assign behavior, actual work status, durable execution, evidence inspection, approvals, or CRM integration. On-screen promotional requests and investment claims are reference content, not instructions for this project. No simulated monitor activity will count as business capability.

Provisional style: polished, game-like office with glass partitions, white furniture, muted purple ambient light and restrained red accents. Use an overhead view plus three employee camera presets first. Full free-roaming navigation, multiple floors, voice conversations, and multiplayer presence are deferred. Preserve the immersive direction while prioritizing readable work information.

## What was inspected and what works today

| Item | Evidence | Conclusion |
|---|---|---|
| EchoAIOnline/AZRE_Business_Game | GitHub metadata reports size 0; README/package requests explicitly report an empty repository | No game source to reuse yet |
| Current local workspace | Contains Git metadata and no application files at inspection | Planning starts from an empty workspace |
| Earlier local DealDesk checkout | Inspected package.json, types.ts, buyer matching, generic AI endpoint, focused plugin endpoint/migrations, and email handler | React/Vite/TypeScript, Express, Supabase, focused integration code, document/deadline fields, and SES email code exist locally; deployment parity is unverified |
| DealDesk Hosted | Successful read of one deal, one buyer-screening page, and task search | Live read capability verified; writes were not attempted |
| Other DealDesk connection | Task read returned MCP SSE 404/unavailable | Do not depend on this connection for the pilot |
| Outlook | Connected account profile successfully returned the business account | Profile access verified; mailbox reads, draft creation, sending, and unattended application access were not tested |

Local DealDesk source inspected at `/Users/asharizakar/Documents/Codex/2026-09-24/revisit-dealdesk-plugin-development-chatgpt-conversation/work/AZRE-DealDesk`. This is an earlier checkout, not proof of current production code. No secrets were read and no business records were changed.

Important reuse boundaries:

- `offerDecision` is the business pipeline stage; `status` is separate. Neither is an AI employee's execution state.
- `PluginTasks` provides business tasks with Open/Completed status; the inspected base schema is insufficient for worker leases, retries, progress, dependencies, artifacts, and approvals.
- Focused plugin code includes organization scoping, revision checks, request IDs and audit migrations. Their deployed coverage and access policies still need validation.
- The older generic `api/ai/operate.ts` accepts table/action operations behind an API key. Do not expose it directly to employees or the browser. Use restricted business operations.
- Local SES sending code is not an Outlook integration. The inspected handler does not itself show an approval gate; it is not the proposed employee send path. Deployment routing/authentication was not audited.
- Frontend and plugin buyer matching are separate implementations. Pick one authoritative, tested screening contract; do not silently mix results.

## Proposed architecture and tradeoffs

```text
Browser: 3D office + accessible task/review panels
                    |
Authenticated application API: permissions and approval rules
          |                         |
Persistent workflow tables     Scoped integration adapters
          |                    DealDesk Hosted / Outlook / files
Always-running worker
          |
Three bounded AI roles with deterministic tools and validation
```

**Browser:** React/TypeScript with Three.js through React Three Fiber, plus ordinary HTML panels for forms, evidence and approvals. This fits the inspected DealDesk frontend stack. React Three Fiber is a React renderer for Three.js; use stable compatible versions after implementation approval. [Official introduction](https://r3f.docs.pmnd.rs/getting-started/introduction). Import optimized GLB/glTF office and avatar assets; Three.js provides a glTF loader. [Loader documentation](https://threejs.org/docs/pages/GLTFLoader.html).

This gives direct browser access and reuses React skills, but requires limits on asset size, lighting complexity, and animation. A streamed high-end game engine could offer richer visuals but would introduce a separate rendering infrastructure and operational burden; it is not the smallest useful browser pilot. A plain 2D interface is cheaper and remains a fallback for accessibility or weak graphics devices.

**Backend:** Reuse DealDesk's authentication/organization model where verified, and its Supabase/Postgres environment if capacity and ownership allow. Add isolated workflow tables and a separately supervised worker process. Web/API requests enqueue work; they do not run an entire task or keep the browser open. Do not assume a short-lived hosting function is a persistent worker.

For the small pilot, use a database-backed job queue with leases, heartbeat, checkpoints, bounded retries and a scheduler. Postgres supports skipping locked rows for queue consumers. [Postgres SELECT documentation](https://www.postgresql.org/docs/current/sql-select.htm). This avoids another queue service, but makes us responsible for correct recovery and monitoring. A dedicated durable workflow service becomes attractive when workflows, timers and volume grow; select a provider only after the budget and existing hosting are known.

**AI employees:** Three role definitions, not three continuously chatting autonomous agents. Tools fetch verified data and perform calculations/matching; models summarize, explain and draft within defined steps. Each step has an input contract, allowed tools, output validation, time/token limits and a human escalation path. This is more predictable and economical than open-ended agent conversation.

**Outlook:** Initially keep outreach drafts as application artifacts and let a human send through Outlook. Later, a scoped Microsoft Graph adapter can create mailbox drafts. Draft creation uses Mail.ReadWrite; sending uses Mail.Send, so permissions and execution should be separated. [Create message](https://learn.microsoft.com/en-us/graph/api/user-post-messages?view=graph-rest-1.0), [permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference). Chat connector availability is not proof that the future application can run unattended. Verify tenant, mailbox type, consent and secure token renewal before choosing background access.

**Record ownership:** DealDesk owns deals, buyers, contacts, business deadlines and approved CRM business tasks. Workflow storage owns executions, retries, artifacts, approvals and history, referencing CRM IDs. Avoid a second editable deal database. Store only necessary, timestamped evidence snapshots with record revisions; show current CRM links. In the pilot, reconcile by reading records at task start and again before approval; evaluate webhooks later.

Reuse PluginTasks for approved operational next steps after verifying update support and CRM visibility. Add a linked workflow execution layer rather than squeezing every worker state into Open/Completed. Existing document links may be usable, but storage access and versioning are unverified.

## Employee behavior and truthful status

| Employee | Inputs | Reviewable output |
|---|---|---|
| Acquisitions | Selected deal/seller lead, source notes, company screening rules | Facts, price/repair/ARV assumptions, missing information, risks, screening conclusion and cited evidence; seller motivation is unknown unless documented |
| Dispositions | Approved screening brief, buyer buy boxes, agreed buyer-facing price | Ranked eligible buyers, mismatch/missing-data reasons, pagination coverage and personalized outreach drafts; no buyer commitment inferred |
| Operations | Approved package, CRM dates, accessible documents, company checklist | Document checklist, verified deadlines, missing deadlines, next steps and proposed owners; no invented contract dates |

Clicking an employee opens a panel with Assign task, current stage, completed steps, evidence, output versions, history, retry/cancel controls and approval actions. Select the CRM record explicitly; use structured task templates before adding unrestricted chat.

Persist states: queued → running → awaiting input or awaiting approval → approved/completed. Also support retrying, failed, rejected and canceled. Employee label and animation derive from server state: working at desk for running, review indicator for awaiting approval, blocked indicator for missing data, error indicator for failed, idle only when no active work exists. Show task title, stage and last update. Never invent completion percentages; show completed steps. If connection/heartbeat is stale, display status unknown rather than continuing to claim live work. An employee with multiple tasks shows active task plus queue count; pilot concurrency is one active task per employee.

## Permissions, approvals, history and recovery

- Owner/admin manages access; operator assigns tasks; reviewer approves within role; viewer reads authorized results. Derive organization from authenticated identity and enforce server-side permissions on every record, artifact, job and approval.
- Keep credentials server-side. Give each role only required read tools and internal artifact writes. No employee gets a generic CRM write, email-send, contract-signing or payment tool in version one.
- Approval records contain reviewer, timestamp, exact artifact version/hash, action, recipients, attachments, relevant price/terms and source revisions. Approval of a brief does not approve outreach. Any material edit invalidates approval. No self-approval by AI.
- Outbound communication, offer submission, contracts and payments require a separate human approval for the exact action. Version one leaves their execution outside the automation; a later sender must verify approval server-side immediately before acting.
- Preserve an append-only event history of assignments, tool actions, source IDs/revisions, output changes, approvals/rejections, retries, failures and any authorized CRM changes. Restrict audit deletion; record useful summaries rather than hidden model reasoning. Define retention and sensitive-data access before production.
- Retry temporary failures with bounded backoff. Persist checkpoints and lease expiry so a crashed worker can resume. Use idempotency keys for artifacts and future writes. Expired auth blocks affected jobs and requests reconnection; missing data requests input rather than making it up.
- On a CRM conflict, reread, compare changes and regenerate affected output; do not overwrite with stale data. Canceling stops future steps and does not undo completed external effects.
- Future email timeouts require reconciliation before retrying. Microsoft Graph's 202 response means accepted, not confirmed delivery; track those separately. [sendMail documentation](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0).
- Treat recording text, CRM notes, emails and document contents as untrusted source material. They cannot grant permissions or change the workflow instructions.

## Smallest real-data proof

Chosen pilot: **1251 Monroe Dr NE, Atlanta, GA 30306**, existing DealDesk ID `22999cc2-9865-4fc5-bd77-d86a8041dffa`, revision 13 at inspection. Search returned one matching record; recheck address/MLS duplicates before any future write. Current record: MLS 10848398, list price $645,000, No Offer Made Yet, Multi-Family Residential / Multi-Family strategy. It describes a duplex and explicitly notes conflicting source property-type metadata. Current MLS availability and legal use have not been independently verified.

This conflicts with the initial single-family/buildable-lot eligibility rule. Treat it as requiring eligibility and zoning/buildability resolution; do not silently relabel it. Three new-construction comp slots are populated and three renovation slots are empty. The recorded new-construction ARV is $3,420,333, but the closed-MLS qualification, radius, property characteristics and development feasibility are unverified. Repair/construction estimates, zoning and contract deadlines are missing. A successful pilot may correctly stop at a supported blocked/no-go recommendation.

The first pilot must inspect all six comp slots and propose changes with evidence; it must not fill ineligible slots merely to reach six. If renovation is inapplicable, mark that explicitly in the review artifact. Populate verified applicable fields only after separately authorized CRM writeback. No comp or underwriting fields were changed during discovery.

The sampled buyer page returned one location mismatch and one buyer with missing criteria; neither was eligible. Only two buyers were screened, so this is not a complete ranking. The matching tool uses offerPrice when positive, otherwise listPrice, and excludes unrecorded assignment fees. Define the actual buyer-facing price and how fees enter eligibility before outreach.

Pilot sequence:

1. Assign Acquisitions a review task for Monroe. Verify current MLS status, legal use, permitted strategy and qualifying closed comps from an authorized MLS source. Save source revision and a supported brief; highlight missing data. Without MLS access, report verification blocked rather than substitute a public listing for verified MLS evidence.
2. Human approves screening or requests changes. Dispositions screens every buyer page, shows completeness and price basis, then creates drafts only for eligible candidates.
3. If no eligible buyers exist, produce an honest no-match report and missing-data next steps. This is successful handling, not permission to fabricate a match. To prove an outreach draft, select a real deal with at least one independently confirmed eligible buyer.
4. Operations assembles the handoff, document checklist and verified next steps. Missing documents or deadlines remain visibly unknown.
5. Human reviews and approves the exact package. Persist outputs and approvals. Reopen the office and inspect the same task history. No CRM business changes or sends occur without later authorization.

This proves a complete internal decision-support workflow using real records. It does not prove lead ingestion, email delivery, signature handling, payment execution or unattended integration authorization. Seller intake requires inspecting the seller-lead source/schema before adding it.

## Phases and acceptance criteria

Durations below are rough effort ranges, not a quote or delivery commitment. They assume one experienced developer, lightweight existing/licensed assets, stable access and prompt reviews; phases may overlap after dependencies are met.

| Phase | Indicative effort | Milestone | Acceptance criteria |
|---|---|---|---|
| 0 — finish discovery | 2–4 working days | Approved scope, workflow and access map | Team/approvers, budget, pilot deal, scoring/pricing rules, target devices and visual direction agreed; production/code parity and integration constraints documented; implementation explicitly approved |
| 1 — workflow foundation | 4–7 days | Persistent tasks before 3D polish | Org isolation and role checks pass; task survives browser close and worker restart; retries/checkpoints/cancel work; denied actions leave records untouched; traceable event history |
| 2 — real-data vertical workflow | 5–10 days | Three-role internal package | Brief cites source fields; all buyer pages screened; no-match/missing-data paths work; Operations cites dates/docs; approval rejection/edit/regeneration works; CRM remains authoritative and sends stay unavailable |
| 3 — one-floor office | 5–10 days | Clickable visual workspace | Three selectable employees, assign/review panels, camera presets and truthful state animations; refresh/reconnect restores state; accessible 2D fallback; provisional target ≥30 fps and ≤5-second initial load on an agreed desktop/network, finalized in phase 0 |
| 4 — controlled pilot | 3–5 days | Review-ready first release | At least three real-record runs covering normal/missing-data cases, plus injected crash/auth outage/CRM conflict; zero unauthorized writes/sends; owner signs off on usefulness and measured cost |
| Later — authorized actions | Separately scoped | Outlook drafts, approved CRM writeback, possibly gated sends | Tenant/mailbox consent verified; exact-action approval tested; edits invalidate approval; duplicate/uncertain send handling verified; CRM writes use revision checks and audit history |

Offers, contracts and payments remain human-executed until each has its own reviewed integration and approval design. Multiple floors, employee voice, multiplayer and richer navigation follow only after the pilot workflow earns its place.

Budget will depend on development effort, asset fidelity, existing hosting capacity, a continuously available worker, AI usage, storage and monitoring. No provider purchases or subscriptions are proposed yet. During pilot, measure cost per completed package and set job token/time caps, concurrency limits and a monthly ceiling. Provide a firm scope/estimate only after the budget and workload answers.

## Outstanding discovery decisions

Confirmed: repository is EchoAIOnline/AZRE_Business_Game; CRM is DealDesk Hosted; business email is Outlook; Ashari Zakar is primary user and final decision-maker; pilot is 1251 Monroe Dr NE. The supplied business workflow governs the following policy map.

### AZRE business policy map

- Focus: distressed single-family homes, teardown candidates and buildable infill lots across Metro Atlanta, emphasizing Buckhead, Brookhaven, Sandy Springs and Dunwoody; luxury exits roughly $1M–$3M+. MLS listings are the primary lead source. Deduplicate in DealDesk. Prefer 1–120 DOM while allowing documented consideration of older listings; do not turn a preference into an automatic rejection.
- Renovation comps: three highest-priced qualifying renovated/pristine closed retail MLS sales, matching bed/bath counts and approximately ±300 SF. New-construction comps: three highest-priced qualifying closed retail MLS detached spec-infill sales. Prefer current calendar year, expand to rolling 12 months if needed; target one mile and document any expansion. Show all qualification criteria and sourcing dates. Selecting the highest prices alone is not sufficient justification for ARV; explain differences, adjustments and uncertainty.
- Underwriting: around 55% of supported renovation ARV, adjusted for costs/profits; teardown acquisition target 20–25% of supported retail value when justified. These are screening guidelines, not approved final formulas. Minimum AZRE profit $20,000; buyer minimum $70,000 for smaller and $100,000+ for larger deals; preferred buyer profit $150,000+. Offer generally at least $50,000 below ask. Clarify cost treatment and small/large thresholds before an automated final MAO recommendation.
- Model both A-B acquisition and B-C buyer price. Include construction/renovation, closing costs on both legs, financing/transactional funding, holding, selling expenses and AZRE spread. Calculate buyer profit from buyer all-in cost, not AZRE's offer alone. Missing costs block a firm recommendation. No financing procurement or capital commitment is authorized.
- SureCash proposed terms: as-is, 1% earnest money, 7-day due diligence, 30-day closing, proof of funds upon request and contractor walkthrough before signing where feasible. Prepare for CEO approval; verbal acceptance is not an executed contract. Attach a clearly labeled proposed-terms version to every offer draft.
- The Network matching: geography, strategy, budget, profit, construction capability, purchasing history, liquidity/verified financing and ability to meet closing dates. Existing matching does not establish all these criteria, so add an evidence checklist and reviewer qualification step. Prioritize Udi Perez and Jeanna Bonds only when verified fit and capacity support it; priority relationships do not bypass eligibility. Respect unsubscribe/do-not-contact flags.
- Preliminary buyer interest checks must be clearly labeled as pre-contract and human-approved. Formal outreach starts after verified fully executed A-B agreement; never claim under-contract status from verbal acceptance or an AI interpretation alone. B-C commitments and agreements require CEO approval.
- Operations handoff: seller/agent contacts, executed A-B, buyer and B-C when available, underwriting/comps, contractor scope, earnest money requirements/confirmation, due diligence expiration, financing, closing instructions, title/survey/permitting concerns, owners and next actions. Weissman PC is the named closing attorney; no communication has been sent.
- Timing: screen qualifying leads within 24 hours of discovery; preliminary underwriting within 24 hours of qualification; approved offer submission target within 24 hours after underwriting, subject to approval; no-response follow-up at 24–48 hours; formal buyer outreach within 24 hours of executed A-B; target buyer commitment during due diligence; monitor active transactions daily. Persist milestone start times and overdue states, with CEO escalation. Approval waits do not hide missed business targets.
- Contract timing defaults: A-B EMD generally within three business days, due diligence seven calendar days, closing thirty days from effective date; B-C EMD per agreement. Executed contract language overrides every default. Verify effective date, timezone, business-day/holiday rules and deadline counting with the transaction professional before scheduling binding deadlines. Track confirmations rather than infer payment from a task marked done.
- Growth target: four closings/month averaging at least $25,000 AZRE profit, approximately $100,000 gross transaction profit before operating expenses. This is a business target, not an AI performance promise. Later reporting must use actual CRM outcomes, not scene activity.

Version one covers existing-record research, recommended calculations, buyer screening/drafts and an operations package. Market scanning, automatic CRM updates, fully populated underwriting fields, live communications and complete transaction management are later authorized capabilities. Each milestone must label which is working, blocked or a visual demonstration.

Still needed:

1. Initially assume Ashari alone approves all pilot outputs and outreach. Confirm any additional users/reviewers, their permissions and expected concurrency.
2. Identify the authorized MLS provider/access method; clarify 55% ARV cost treatment and smaller/larger profit thresholds. Confirm daily lead volume and the underwriting expense template.
3. Resolve Monroe's multi-family classification versus eligibility; supply authorized zoning/buildability and comp evidence. Define buyer-facing price including AZRE spread and relevant transaction costs. Confirm permissions to use deal documents.
4. Which document storage, signing, calendar, SMS and accounting systems are in use? Is Outlook Microsoft 365 business, and is the mailbox individual or shared? Which integrations are already deployed?
5. What are build budget, monthly operating cap and target timeline?
6. Which desktop/mobile browsers matter, and should the office closely match the recording or use a simpler stylized treatment? Any brand colors/assets?
7. Who owns production access, security review and ongoing support, and what retention/access restrictions apply to seller/buyer information?

Approval requested after these answers: confirm the one-floor/three-employee scope, internal review-package completion point, visual direction, data boundaries, budget ceiling, and phase 1 start. Approval of this plan does not by itself authorize deployment, external communications, financial commitments or unrestricted production writes.
