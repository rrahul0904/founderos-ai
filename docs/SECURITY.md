# Security model

## Implemented controls

1. Organization ID is enforced across project/evidence/jobs/budgets/audit/build/preview queues.
2. Provider/API secrets remain server-side; Vercel token is never persisted into build-plan state.
3. Retrieved pages and repository content are untrusted data, not tool-permission instructions.
4. Research, code execution, and preview browser verification use separate durable queues and worker processes.
5. GitHub build delivery is deny-by-default repository allowlisted and branch-only before review.
6. Coding patches block traversal, protected/sensitive paths, symlinks, recursive directory deletion, generated output, and GitHub workflows.
7. Coding verification runs against a disposable copy with no provider credentials; test/build verification has network disabled.
8. Vercel preview discovery requires exact verified commit SHA + guarded branch metadata and rejects `target=production`.
9. Preview browser verification accepts only HTTPS `*.vercel.app` entry URLs. Every requested host is DNS-resolved and private/local IP destinations are blocked before the request continues.
10. Browser verification fails redirects outside `vercel.app`, HTTP errors, empty rendered pages, and uncaught page errors. A screenshot digest is retained as evidence without persisting the screenshot bytes.
11. Privileged build/preview actions emit PostgreSQL audit events.

## Production hardening still required

- Enforce infrastructure-level egress policy in addition to application DNS/IP checks for research and browser workers.
- Replace shared-key auth with SSO/OIDC before collaborative public SaaS use.
- Use a managed secrets service for GitHub/model/Vercel credentials.
- Run coding execution on a dedicated remote sandbox or stronger VM/microVM boundary and add disk quotas.
- Add signed release-evidence/artifact retention and explicit production-promotion policy.
