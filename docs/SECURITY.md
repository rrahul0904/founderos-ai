# Security model

## Implemented controls

1. Organization ID is enforced in project/evidence/job/budget/audit/build-execution boundaries.
2. Production can use `AUTH_MODE=shared-key`; dev auth refuses production unless `ALLOW_DEV_AUTH=true` is explicitly set.
3. Provider/API secrets remain server-side.
4. Research URL capture accepts only HTTP(S), rejects local/private destinations after DNS resolution, validates redirects, and limits content type/size/time.
5. Captured sources receive SHA-256 hashes and source snapshots.
6. Retrieved external content and repository content are treated as untrusted data, not tool-permission instructions.
7. Research and build executions use separate durable queues and worker processes.
8. Agent spend has daily/per-run controls and run-level usage/cost telemetry.
9. Privileged product/research/build actions emit audit events in PostgreSQL mode.
10. GitHub delivery and build execution keep tokens server-side and deny repositories outside `FOUNDEROS_GITHUB_ALLOWED_REPOS` unless an explicit development escape hatch is enabled.
11. External GitHub writes require an approved build plan and target a dedicated `founderos/*` branch rather than the base branch.
12. Generated code cannot modify `.git`, GitHub workflow files, `.env`/credential/secret paths, dependency output, or generated build-output paths through the executor patch interface.
13. Patch paths are traversal checked and both parent/target symlinks are rejected before writes; recursive directory deletion is blocked.
14. Verification runs against a disposable copy of the generated worktree, so repository test/build scripts cannot mutate the checkout that will later be committed.
15. Generated code receives no GitHub/OpenAI/FounderOS credentials. Verification has network disabled, Linux capabilities dropped, no-new-privileges, CPU/memory/PID limits, and an isolated dependency volume.
16. A commit is pushed only after sandbox verification succeeds; failed executions remain explicit and auditable.

## Production hardening still required

- Put research workers behind an outbound proxy/network policy to close DNS-rebinding/egress edge cases at the infrastructure layer.
- Replace shared-key auth with SSO/OIDC before collaborative public SaaS use.
- Use a managed secrets service for GitHub/model/provider credentials.
- Run coding execution on a dedicated executor host, remote sandbox, or stronger VM/microVM boundary. The opt-in local Compose profile's Docker-socket mount is for controlled development, not the recommended multi-tenant production topology.
- Add sandbox disk quotas and expand policies per supported language/package manager.
- Add artifact/signature retention and release evidence.
