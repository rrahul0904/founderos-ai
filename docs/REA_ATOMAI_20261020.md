# REA 2026-10-20 — AtomAI reference → FounderOS Founder Intelligence

## Evidence and licensing
- Reddit: https://www.reddit.com/r/SideProject/comments/1xar7u7/got_tired_of_reexplaining_my_startup_to_chatgpt/
- Product: https://www.atomailab.com/
- Intake: https://github.com/rrahul0904/agent-work-os/issues/320
- Implementation: https://github.com/rrahul0904/founderos-ai/issues/8
- Snapshot: public site and discussion inspected on 2026-10-20. No upstream code audit or license grant; use feature observations **only**.
- Avoid importing proprietary code, screenshots, styles, names, sample quotes, pricing, or customer content.

## Routing decision
**EXTENSION / clean-room capability donor**. Existing owned `founderos-ai` is an evidence-first idea→build→learn product brain. AtomAI's memory, customer signals, founder pivot gates and execution planning directly extend that owner. `foundersignal-ai` is a separate prospect discovery business, and `agent-work-os` is governance/orchestration. No standalone repo.

## Public capabilities versus our implementation
| Reference capability | Owner feature | Branch status | Honest limitation |
|---|---|---|---|
| Persistent company file | FounderIntel profile in Project JSON/Postgres project payload | Implemented | Single-owner auth currently, no org roles |
| Verbatim interview ledger | Redacted customer signals linked to stored interview evidence | Implemented | Manual entry only; no call transcription or consent workflow |
| Founder-controlled updates | Explicit profile save | Implemented | Full versioned approval history remains P1 |
| 30-day pivot threshold | Numeric dated rule + deterministic evaluation | Implemented | No automated pivot; operator review mandatory |
| Daily replan | Signal-linked deterministic priorities | Implemented | Not model-generated or scheduled |
| Specialists | Six review-only markdown draft modes | Implemented | Templates based on founder context, not web-verified research/AI |
| SSE Rust/Axum streaming | N/A | Not implemented | No value in replacing existing Next.js API until measured |
| Multi-tenant isolation | Existing organization-scoped project lookups | Reused | Auth/RBAC and RLS hardening remain P1 |
| Secret redaction | Common token/email patterns prior to save | Partial | Regex is not DLP; needs broader enterprise-grade scanning |
| Trials / billing | N/A | Not implemented | Not a P0 goal; pricing claims from reference aren't borrowed |

## Product workflow
```
Founder-created project / organization
  → explicit profile edit (scrub and save)
  → manual verbatim customer quote (redact, evidence record, signal ID)
  → threshold goal (founder-approved)
  → dated pivot evaluation (tracking | achieved | review)
  → daily deterministic plan (with evidence IDs)
  → select specialist → read/export Markdown draft → manual approval
```
No autonomous prospect outreach, integration credentials, external billing, live-data search or irreversibly executed task.

## API
Authenticated GET/POST `/api/projects/:id/intelligence`; POST JSON always includes `revision`.
- `{action:"profile",profile:{buyer,endUser,offer,pricing,competitors,constraints},revision}`
- `{action:"signal",kind:"pain"|"objection"|"positive",persona,source,quote,revision}`
- `{action:"rule",rule:{metric,threshold,current,deadline:"YYYY-MM-DD",fallback},revision}`
- `{action:"replan",revision}`
- `{action:"complete",id,complete:boolean,revision}`
- `{action:"artifact",kind:"gtm"|"competitor"|"financial"|"research"|"fundraising"|"brainstorm",revision}`
GET/POST refuse an unauthorized/unknown project. POST refuses unsupported actions, invalid signal/rule inputs and stale client revision; database revision checks use a project row lock and commit evidence in the same transaction. The POST artifact flow is read-only.

## UI
Navigate to `/projects/:id/intelligence` from a project workspace. Edit the company file, log and review quotes, configure and review pivot rule, replan today's move list, complete a move, and copy review-only specialist deliverables.

## Verification
Run `npm run verify` (workspace type checks, node tests, Next.js production build). The root `npm test` includes `packages/core/src/founder-intelligence.test.ts`. Tests cover redaction, reviewed profile edits, evidence IDs, rule deadlines, missed threshold review, plan tasks and invalid input. **Do not mark release complete from branch commits alone.** Record GitHub Actions run SHA/result, actual Postgres migration success, HTTP authorization/tenant tests, and browser UX receipts before promotion.

## P1 production hardening and acceptance gates
1. PostgreSQL project-row locking now atomically commits a signal and its state revision; add load/race tests for mixed project writers. Other project update paths still use whole-payload upserts and could overwrite concurrent founder-memory updates.
2. Multi-user RBAC, Postgres RLS, hardened CSRF/session/SSO, organization invite and scoped audit.
3. Data retention and removal, interview consent model, stronger secrets/PII redaction, tenant leak tests, encryption and backup restoration.
4. Source document upload and retrievable evidence citation with robust RAG, model prompt-injection tests.
5. Retrieval-backed specialist evidence with no invented sources, provider budgets, streaming if useful.
6. End-to-end Playwright from onboarding to durable replay; rate limits; Web Vitals and monitoring.
7. Explicit approvals for outreach/CRM/calendar write operations. No unchecked autonomous external actions.
8. Stage and exact-SHA preview through approved deployment pipeline; keep merge and production promotion gated.
