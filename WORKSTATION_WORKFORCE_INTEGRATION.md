# CEO workstation — AI Workforce integration

Implemented October 15, 2026. The existing CEO computer interaction opens the existing dashboard. Two independent destinations were added: **AI Workforce Chat** and **Task Delegation**. **Desk Overview** returns to the executive dashboard; closing the workstation returns to the office.

## Integration

Both screens embed the existing application through `/workforce/` on the office origin. Vite development and preview forward this namespace to the existing service at `http://127.0.0.1:3101`; `WORKFORCE_PROXY_URL` is a server-side override. No new agent, execution service, task schema, conversation database, or API key is introduced.

Chat retains General Chat, Ryan and Marcus private conversations, @mention routing, and the existing execution workflow. Task Delegation reuses the existing Operations Command Center, including creation, assignment, priorities, states, execution attempts, evidence/results, human review/correction, cancellation, approval records and monitoring. These controls retain their existing permissions and limitations; an approval record does not execute external business actions.

Workforce sign-in is shared between both embedded screens. The existing office sign-in remains separate. Sessions are still HttpOnly, SameSite=Strict cookies; credentials are neither embedded in URLs nor sent through parent-window messages. On the local 127.0.0.1 deployment the standalone and embedded surfaces also share the workforce session cookie. Other hostnames may require a separate sign-in while still using the same records.

Only explicitly embedded HTML uses `frame-ancestors 'self'`. Standalone pages retain `frame-ancestors 'none'`. Other CSP directives, same-origin mutation checks, required request headers, authentication, ownership checks, employee permissions and read-only CRM restrictions are preserved. No CORS wildcard, arbitrary frame ancestor, or browser-stored credential was added. The office origin is therefore a trusted UI surface for the existing workforce service.

Assets and API requests preserve the proxy namespace, including streamed chat responses. Chat polls stored messages every five seconds while visible and idle, without replacing an active local AI turn or draft. Last-selected conversation survives iframe refresh in session storage; actual messages remain in the existing SQLite database. Switching destinations hides mounted frames, preserving ongoing requests. Background tasks continue independently of these frames.

A six-second connection probe and fifteen-second availability refresh display a recovery screen instead of a blank iframe. Recovery instructs the user to restart the existing background service and retry. Failed checks do not delete conversations or tasks.

## Deployment boundary

This integration is configured and verified for the local office and its existing local workforce service. A static `dist` upload alone does not provide a reverse proxy. A future hosted deployment must route `/workforce/*` to its authorized existing workforce service, stripping the prefix, preserving the original Host and Origin, forwarding cookies, keeping Cache-Control/no-store and CSP headers, and streaming responses without buffering. Do not rewrite an untrusted Origin to bypass the service check. HTTPS hosting requires secure workforce cookies (`COOKIE_SECURE=true`). A cloud host cannot reach this Mac's loopback address. No public deployment or new cloud workforce instance was created.

## Files

- `src/components/WorkstationDashboard.tsx`: two destinations; existing navigation retained.
- `src/components/WorkforcePanel.tsx`: persistent embedded surfaces, health status and recovery.
- `src/index.css`: frame sizing and narrow workstation chrome fixes.
- `vite.config.ts`, `.env.example`: same-origin proxy configuration.
- `azre-ai-workforce/src/chat-http.js`: safe health probe, explicit same-origin embedded HTML mode, prefixed assets.
- `azre-ai-workforce/web/app.js`: prefixed requests, synchronization and last-selected conversation recovery.
- `azre-ai-workforce/web/operations.js`: prefixed requests and authenticated task-return navigation.
- `azre-ai-workforce/web/styles.css`, `web/operations.css`: embedded destination styling.
- `azre-ai-workforce/test/workstation-embedding.test.js`: framing, unchanged standalone policy, authentication and probe tests.
- `azre-ai-workforce/scripts/validate-workstation-integration.js`: real computer-click/browser integration validation.

The 3D environment, furniture, camera behavior, avatars and animations were not edited for this integration. No production DealDesk records were modified. Validation messages and clearly named canceled internal assignments are retained as history.

## Verification

- Workforce regression suite: **121 passed, 0 failed**, including two new embedding/security tests.
- Existing Virtual Office suite: **13 test files passed, 0 failed**.
- Type check and production build passed. Existing large 3D bundle warning remains nonblocking.
- Live browser integration: **passed**, including both message directions, one canceled validation task, desktop/mobile sizing, connection recovery and cross-origin rejection.
- Refresh persistence: selected General Chat and its messages, plus existing task records, survived refresh of their embedded destinations. Evidence: `azre-ai-workforce/data/workstation-refresh-validation.json`.
- Browser results: see `azre-ai-workforce/data/workstation-integration-validation.json` for final pass/fail evidence. Its checks cover the actual CEO computer click, both screens, shared authentication, registry, mentions, bidirectional persisted messages, shared task creation/cancellation, desktop/mobile geometry, Desk Overview, outage recovery, reopening history, return to office, and cross-origin rejection.

This validation sends stored-only General Chat messages without @mentions; it adds no model API cost. Existing automated delegation and agent-routing regression tests exercise the unchanged execution paths. It does not claim a new live model invocation or approval of any real business action.
