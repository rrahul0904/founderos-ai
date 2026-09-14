# Phase 2 implementation status

## Implemented

- Durable project build plans, human approval, allowlisted GitHub branch/issue delivery, and draft PR handoff.
- Separate durable build-execution queue and opt-in sandboxed Node coding worker.
- Generated patches are path/size bounded; protected, credential, workflow, generated-output and symlink paths are blocked.
- Dependency install and verification run without FounderOS/GitHub/OpenAI credentials; verification uses a disposable checkout copy and no network.
- Verified code is pushed only after sandbox checks pass.
- Deterministic SHA-256 release-evidence manifests bind the verified commit and execution evidence.
- Vercel preview discovery requires explicit team/project binding and an exact match on the verified Git commit SHA and guarded branch; production deployments are never accepted as previews.
- Browser verification uses a separate durable queue and Playwright worker. The entry URL must be HTTPS `*.vercel.app`; every browser request is checked against DNS/private-address rules.
- Browser reports capture HTTP status, final URL, title, visible-body length, console errors, uncaught page errors, timestamp, and a screenshot SHA-256 in the durable report.
- Browser pass requires a 2xx/3xx response, visible rendered content, no uncaught page errors, and no redirect outside `vercel.app`.

## Required configuration

GitHub delivery requires `GITHUB_TOKEN` + `FOUNDEROS_GITHUB_ALLOWED_REPOS`. Sandbox execution requires PostgreSQL, OpenAI, Docker, and `BUILD_EXECUTOR_ENABLED=true`.

Vercel preview discovery requires:
```bash
VERCEL_TOKEN='server-side-vercel-token'
```

Browser verification requires PostgreSQL and the opt-in worker:
```bash
PREVIEW_VERIFY_ENABLED=true
docker compose --profile preview-verifier up --build
```

The target Vercel project must already exist and be connected to the repository/branch workflow that produces previews. FounderOS deliberately does not silently create or bind arbitrary Vercel projects.

## Still pending

- Production promotion adapter / approval policy after preview verification.
- Preview verification for providers other than Vercel.
- Production microVM/remote coding sandbox isolation and executor disk quotas.
- Additional language/package-manager coding executors.
- Cryptographic signing + artifact retention for release evidence.
- Managed secret-store integration.
