# Phase 2 implementation status

## Implemented

- Build plans are durable project-brain artifacts stored with the project payload.
- Product/architecture context becomes ordered implementation tasks with acceptance criteria and explicit risk.
- Human approval is required before external GitHub mutation.
- GitHub delivery uses a server-side token and deny-by-default repository allowlist.
- FounderOS creates a dedicated `founderos/*` branch and never writes directly to the configured base branch.
- Branch, issue, and draft-PR creation are retry-aware/idempotent.
- Partial publication state is persisted after every GitHub issue.
- Build plans expose portable Markdown work orders.
- Durable build executions use a separate `build_executions` queue; research workers cannot claim coding work.
- The coding worker re-enforces the repository allowlist and requires explicit `BUILD_EXECUTOR_ENABLED=true`.
- Repository/work-order text is treated as untrusted model input.
- Generated changes are constrained by file-count, byte, traversal, symlink, secret-path, generated-output, and CI-workflow restrictions.
- The first sandbox strategy supports root Node.js projects.
- Dependency installation happens in a container without FounderOS/GitHub/OpenAI secrets; verification runs with network disabled, dropped Linux capabilities, no-new-privileges, CPU/memory/PID limits, and an isolated node_modules volume.
- Verification runs on a disposable copy, so test/build scripts cannot mutate the checkout that is later committed.
- Code is committed and pushed to the guarded branch only after sandbox verification passes.
- Successful executions produce a deterministic SHA-256 release-evidence manifest binding execution, plan, repository/branches, verified commit, model, changed files, verification command, and completion time.
- After verified code exists, FounderOS can open or reuse a draft pull request.
- Build execution success/failure, release evidence, and GitHub actions emit audit records in PostgreSQL mode.

## Required configuration

GitHub publication:

```bash
GITHUB_TOKEN='fine-grained-token'
FOUNDEROS_GITHUB_ALLOWED_REPOS='owner/repository,owner/another-repository'
```

Sandbox execution additionally requires PostgreSQL, OpenAI, Docker, and an explicit enable switch:

```bash
DATABASE_URL='postgres://...'
OPENAI_API_KEY='...'
BUILD_EXECUTOR_ENABLED=true
```

For local development the opt-in Compose profile is:

```bash
docker compose --profile build-executor up --build
```

The local profile mounts the Docker socket into the trusted build-worker container. Generated repository code does **not** receive that socket or any FounderOS/provider credentials. Production should run the build worker on a dedicated executor host or isolated container-runtime service rather than sharing the application host daemon.

## Explicit blocker behavior

Missing credentials, unallowlisted repositories, insufficient GitHub permissions, missing branches, unsupported repositories, invalid model patches, blocked paths, sandbox install/test/build failures, and no-diff PR attempts are represented as failures/blockers. FounderOS does not mark those operations successful.

## Still pending

- additional language/package-manager sandbox strategies beyond root Node.js
- stronger production executor isolation such as microVM/firecracker-class boundaries or a dedicated remote sandbox provider
- cryptographic signing/key management and artifact retention for the release-evidence manifest
- preview deployment adapters and browser verification
- production secret-manager integration

The executor is intentionally opt-in until those production isolation controls are chosen for a deployment environment.
