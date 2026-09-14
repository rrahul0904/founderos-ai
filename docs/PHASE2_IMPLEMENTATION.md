# Phase 2 implementation status

## Implemented in this slice

- Build plans are durable project-brain artifacts stored with the project payload.
- Product/architecture context is converted into six ordered implementation tasks with acceptance criteria and explicit risk.
- A human approval gate is required before any external GitHub mutation.
- GitHub delivery uses a server-side token and deny-by-default repository allowlist.
- Target repositories are verified before publication.
- FounderOS creates a dedicated `founderos/*` branch and never writes directly to the configured base branch.
- Branch creation is retry-safe when the branch already exists.
- Implementation issues use deterministic plan/task titles and are looked up before creation so publication can resume without intentionally duplicating issues.
- Partial publication state is persisted after every GitHub issue.
- Build plans expose a portable Markdown work order for a coding agent or human operator.
- Build publication advances the project lifecycle to `build` and emits audit events in PostgreSQL mode.
- Tests cover build-plan generation/approval, repository allowlisting, issue reuse, and branch idempotency.

## Required external configuration

GitHub publication requires:

```bash
GITHUB_TOKEN='fine-grained-token'
FOUNDEROS_GITHUB_ALLOWED_REPOS='owner/repository,owner/another-repository'
```

The token must be able to read repository metadata and create branches and issues in each allowlisted repository. Keep the token server-side. `FOUNDEROS_GITHUB_ALLOW_ANY_REPO=true` exists only as an explicit development escape hatch and is not the recommended production setting.

## Blockers converted into explicit product state

Missing/invalid GitHub credentials, an unallowlisted repository, insufficient permissions, a missing base branch, or a GitHub API failure does not get represented as success. The build plan becomes `blocked`, preserves its error, and can be retried after the external dependency is fixed.

## Deliberately not claimed complete

This slice is the build **delivery control plane**, not an arbitrary-code executor. The following remain follow-on work:

- isolated/sandboxed coding-agent execution
- repository checkout, patch generation, code commits, and automated pull-request creation
- branch test execution and signed release-evidence manifests
- preview deployment adapters and browser verification
- production secret manager integration

Those capabilities should build on the approval, allowlist, audit, idempotency, and branch boundaries introduced here rather than bypassing them.
