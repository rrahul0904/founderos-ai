# RedEyes FounderOS URL / Idea Analyzer — Reverse-Engineering Dossier

Status: **RESEARCH + CONTRACTS COMPLETE; IMPLEMENTATION NOT YET CLAIMED**

Canonical destination: `rrahul0904/founderos-ai`

Source issue: #6

Stacked dependency: draft PR #5 / `feat/quick-validation-sidefrog`

Captured: 2026-10-08

## 1. Source identification

Primary public source:

- Reddit post: `https://www.reddit.com/r/micro_saas/comments/1vkzrzg/built_an_early_mvp_that_analyzes_any_saas_url_and/`
- User-supplied short link: `https://www.reddit.com/r/micro_saas/s/OEhzXdn1EU`
- Claimed product console: `https://founderos.redeyesstudio.com/`

Attribution visible in the Reddit page: `RedEyesOfficialSt`.

The linked console could not be reliably fetched by the current research environment. Therefore this dossier treats the Reddit post as first-party public behavior evidence and does **not** infer unseen UI, backend architecture, model provider, pricing, persistence, scraping implementation, or deployment behavior.

## 2. Evidence ledger

### E1 — first-party Reddit product claim

Observed description:

1. user enters a SaaS URL **or** raw idea;
2. URL mode scrapes basic site data;
3. output includes an overview of ICP, value proposition, and revenue model;
4. output includes competitors and market gaps;
5. output includes a four-week MVP roadmap;
6. output includes an investor-style critique and score;
7. output includes starter landing-page copy.

Evidence class: `first-party-public`.

Confidence: high for the stated product claim; runtime parity remains unverified.

### E2 — Reddit feedback

The only visible reply in the captured discussion is launch/distribution advice. It does not provide meaningful product usability, correctness, reliability, or willingness-to-pay feedback.

Evidence class: `community`.

Implication: do not invent user pain points from the thread. Usability acceptance criteria must come from the observable workflow and known failure modes until real user feedback exists.

### E3 — current FounderOS implementation

Our current FounderOS is already an evidence-first product operating system with durable project/evidence context and guarded build delivery. The repository explicitly distinguishes implemented behavior from unimplemented sandboxed execution / preview verification.

Evidence class: `owned-implementation`.

Implication: this donor should be mapped into existing FounderOS rather than creating a duplicate product.

### E4 — existing Quick Validation work

Issue #4 / draft PR #5 already adds a no-save Quick Validation mode with deterministic local fallback, optional hosted AI, explicit evidence labeling, and an explicit promotion path into durable FounderOS.

Evidence class: `owned-implementation`.

Implication: this donor delta should extend that surface rather than create another validator stack.

## 3. Workflow reconstruction

### URL input path

`public URL → safe fetch → bounded HTML extraction → observed facts → inference/research pipeline → structured report`

Expected report sections:

1. Overview
2. Competition / gaps
3. Four-week MVP roadmap
4. Investor critique
5. Landing-page copy

### Raw idea path

`raw idea → normalize → infer hypotheses → optional external research → structured report`

The important distinction is that URL mode can produce **observed source-page facts**, while raw-idea mode begins almost entirely as **hypothesis** until research is performed.

### Promotion path

`quick analysis → explicit user action → durable FounderOS project/evidence graph`

No implicit persistence in the quick path.

## 4. Capability decomposition

### Intake

- idea detection and normalization
- URL validation and canonicalization
- safe public fetch
- extraction of title, description, headings, readable text, pricing cues, CTA cues

### Analysis

- ICP hypothesis
- value-proposition hypothesis
- revenue-model hypothesis
- competitor research or clearly labeled competitor hypotheses
- market-gap synthesis
- four-week execution roadmap
- investor-style critique rubric
- landing-copy generation

### Evidence / provenance

Every claim must have one of three statuses:

- `observed` — directly extracted from the submitted page/input;
- `inferred` — model/rule-derived hypothesis;
- `researched` — supported by an external source URL captured during research.

This classification is mandatory because a marketing website is not independent proof of its own claims.

## 5. Failure-mode decomposition

### Network / fetch safety

- SSRF into loopback/private/link-local/cloud-metadata ranges
- DNS rebinding / redirect escape
- credential-bearing URLs
- redirect loops
- giant responses / decompression bombs
- unsupported binary content
- slowloris/timeouts
- JavaScript-only pages with little server-rendered content

### LLM / prompt safety

- prompt injection in page text
- instruction-like copy overriding system behavior
- hidden text attempting tool invocation
- quoted page claims converted into false independent facts

### Product truthfulness

- fabricated competitor names
- fabricated market gaps
- fabricated pricing / traction / revenue
- investor score presented as objective or predictive
- roadmap that is generic feature padding rather than testable weekly outcomes
- landing copy copied too closely from source page

### Product architecture

- duplicate storage model for quick analysis
- automatic persistence without consent
- parallel research pipeline diverging from FounderOS evidence contracts

## 6. Competitive comparison

### ValidatorAI

Current public positioning includes startup idea scoring, customer clarity, market/competition analysis, market viability, and next-step guidance. It competes strongly on speed and breadth of initial validation.

Relevant differentiation for FounderOS:

- evidence provenance rather than opaque scoring alone;
- promotion from quick analysis into a durable project brain;
- implementation/deployment lifecycle after validation.

### Buildpad

Current public positioning centers on an AI cofounder that carries project context, performs research/validation, and continues through an ongoing roadmap rather than ending at a one-shot report.

Relevant differentiation for FounderOS:

- explicit observed/inferred/researched claim states;
- guarded action/execution layer;
- exact verification receipts and deploy/learn lifecycle.

### Same-name public FounderOS project

A separate public FounderOS hackathon page/repository describes multi-agent market, competitor, ICP, MVP, landing-copy, and investor analysis. The feature overlap is notable, but identity/provenance with the RedEyes product is unverified.

Boundary: do not use that repository as donor source code. Treat it as market/context evidence only unless provenance is independently proven.

## 7. Canonicalization decision

Decision: **MAP EXISTING**.

Canonical product: FounderOS.

Reasoning:

- existing FounderOS already owns founder intelligence from idea through build/deploy/learn;
- Quick Validation is already the correct no-save entry surface;
- the donor adds a useful **URL analyzer / SaaS teardown** capability plus report sections;
- creating another product would fragment evidence, agents, persistence, and promotion semantics.

## 8. Product boundary

### Build

A `Quick Analysis` mode within the existing Quick Validation experience.

Inputs:

- `idea`
- `url`

Outputs:

- Overview
- Competition / gaps
- 4-week MVP plan
- Investor critique
- Landing copy
- Evidence status / source list

### Do not build in first slice

- autonomous crawling of whole domains
- authenticated/private-site scraping
- browser automation
- contact/lead scraping
- financial forecasting presented as fact
- automatic email/outreach
- production deployment changes

## 9. Behavior contracts

### Input contract

```ts
type QuickAnalysisInput =
  | { mode: "idea"; idea: string }
  | { mode: "url"; url: string };
```

Rules:

- normalized idea length: 20–4,000 chars;
- URL: http/https only;
- no username/password URL authority;
- no localhost, loopback, private, link-local, metadata, or reserved destinations;
- redirect chain revalidated hop-by-hop;
- explicit rejection for unsupported schemes.

### Extracted-page contract

```ts
interface PageSnapshot {
  finalUrl: string;
  fetchedAt: string;
  title?: string;
  description?: string;
  headings: string[];
  readableText: string;
  contentSha256: string;
  truncated: boolean;
}
```

Caps:

- timeout: bounded;
- redirects: bounded;
- body bytes: bounded;
- text chars: bounded;
- HTML only in first slice.

### Claim contract

```ts
type ClaimState = "observed" | "inferred" | "researched";

interface AnalysisClaim {
  text: string;
  state: ClaimState;
  sourceUrls: string[];
  confidence: "low" | "medium" | "high";
}
```

### Four-week roadmap contract

Exactly four items:

```ts
interface RoadmapWeek {
  week: 1 | 2 | 3 | 4;
  outcome: string;
  tasks: string[];
  experiment: string;
  successSignal: string;
}
```

### Investor critique contract

The score is a **heuristic**, not investment advice and not a probability of success.

Dimensions should be explicit and auditable, e.g.:

- customer specificity
- problem severity evidence
- differentiation
- monetization clarity
- distribution feasibility
- execution complexity

Unknowns reduce confidence; they must not be silently filled with fabricated values.

### Landing-copy contract

Generated output should include:

- headline
- subheadline
- three value points
- primary CTA

It must be newly generated from the analysis and must not reproduce donor/source-page copy verbatim except short factual product terms when necessary.

## 10. Acceptance tests

Minimum deterministic tests:

1. accepts valid idea mode;
2. accepts valid public URL mode;
3. rejects malformed URL;
4. rejects `file:`, `ftp:`, `data:` and other unsupported schemes;
5. rejects loopback and localhost;
6. rejects RFC1918/private ranges;
7. rejects link-local / cloud metadata targets;
8. revalidates redirects;
9. rejects credential-bearing URLs;
10. caps response bytes;
11. caps extraction length;
12. strips script/style content;
13. treats prompt-like page text as untrusted data;
14. never labels unsupported competitor claims as `researched`;
15. always returns exactly four roadmap weeks;
16. investor score includes assumptions/unknowns;
17. quick analysis does not persist a project;
18. promotion uses the existing FounderOS project/evidence workflow.

Verification gates before any completion claim:

- typecheck
- focused unit tests
- full repo tests
- Next build
- exact-head GitHub Actions
- preview deployment at same SHA
- browser UAT at same SHA
- recovery / bad-input UAT

## 11. Implementation sequence

### Slice A — deterministic contracts + safe URL intake

- schemas/types
- URL validator
- bounded fetch/extract service
- deterministic local result generator
- negative tests

### Slice B — UI integration

- add `Idea | URL` mode to Quick Validation
- five report sections
- evidence badges
- explicit promote-to-project action

### Slice C — evidence-backed research

- route competitor/market research through existing FounderOS research/evidence path
- attach source URLs
- never downgrade `unknown` into an invented fact

### Slice D — hosted model enhancement

- optional provider path behind explicit spend gate
- strict structured parsing
- deterministic fallback on failure

### Slice E — certification

- exact-head CI
- preview
- browser UAT
- tracker update from receipts only

## 12. Current truth

As of this dossier commit:

- source identification: done;
- evidence collection: done for the accessible public sources;
- workflow reconstruction: done;
- capability/failure-mode decomposition: done;
- feedback analysis: done (limited thread feedback);
- competitive/donor audit: done;
- canonical boundary: done;
- behavior contracts: done;
- acceptance tests: specified;
- implementation: **not yet claimed for this donor delta**;
- hosted/browser certification: **not started**;
- production: unchanged.
