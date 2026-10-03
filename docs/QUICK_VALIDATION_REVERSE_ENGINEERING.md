# Quick Validation — Reverse-Engineering Evidence Pack

## Source manifest

Captured 2026-10-03.

- Reddit source: https://www.reddit.com/r/SideProject/s/zAJBQN1ceG
- Live product: https://sidefrog.com/
- Canonical FounderOS implementation issue: #4

## Observed behavior

The referenced product, SideFrog, provides a fast side-hustle pressure test. The observed public surface accepts an idea and presents a skeptical verdict plus who may pay, a first validation test, success criteria, risks, search directions, name ideas with live `.com` checks, and follow-on prompts. The public site also exposes educational guides and a reusable prompt kit.

The public product explicitly states that the verdict is a quick AI read rather than market research, that ideas are sent to Gemini, and that SideFrog itself does not store submitted ideas.

At capture time, the Reddit post did not expose substantive comment feedback to incorporate. That is recorded as a zero-comment/zero-feedback state rather than inferred sentiment.

## Clean-room scope

### MATCH
- One-field idea intake.
- Fast skeptical first-pass verdict.
- Likely payer/problem hypothesis.
- Cheap test and measurable success signal.
- Risk list and positioning refinement.
- Search prompts.
- Candidate `.com` names with best-effort live registry status.
- Explicit privacy/evidence caveats.

### IMPROVE
- Never represent AI output as market evidence.
- Deterministic no-key fallback for cost-free operation and testability.
- Hosted AI disabled by default and separately opt-in even when FounderOS has an OpenAI key.
- Promotion into the existing durable evidence workflow instead of keeping Quick Validation as a dead-end answer.
- Registry failures produce `unknown`, not a false availability claim.
- Concrete 7-day commitment test rather than encouragement.

### OMIT FOR SLICE 1
- SideFrog branding, mascot, visual identity, exact prose, and private prompts.
- Full guide-library/content parity.
- Mentoring/affiliate links.
- Claims about proprietary implementation details not visible in public evidence.

## Architecture

- `packages/agents/src/quick-validation.ts`: pure deterministic validator plus optional guarded hosted-AI refinement.
- `apps/web/app/api/quick-validate/route.ts`: stateless API; no project creation or database write; best-effort Verisign RDAP checks for server-generated `.com` candidates.
- `apps/web/components/quick-validator.tsx`: client flow and explicit promotion action.
- `apps/web/app/quick-validate/page.tsx`: consumer-facing route.
- Existing `/api/projects` remains the only persistence transition initiated from Quick Validation.

## Privacy and cost boundaries

- Quick Validation does not intentionally persist submitted ideas.
- No idea text is logged by the new route.
- Input is bounded to 2,000 normalized characters.
- Hosted AI requires all of `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and `QUICK_VALIDATION_HOSTED_AI=1`.
- Domain checks are limited to server-generated `.com` names and fail closed to `unknown`.

## Verification status

Local pre-push validation of the pure engine:

- strict TypeScript check: passed
- focused tests: 6/6 passed

Repository/hosted verification remains evidence-gated:

- GitHub Actions exact-head result: pending until PR run completes
- Next.js build on exact PR head: pending CI
- deployed preview URL: not yet claimed
- hosted browser UAT: not yet claimed
- production: unchanged

Do not promote this slice to preview-verified or complete until those gates are recorded.
