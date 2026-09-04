# Security model

## Required production controls

1. Add authentication and tenant-scoped authorization before multi-user deployment.
2. Keep model/API tokens server-side only.
3. Treat researched pages, repository content and uploaded documents as untrusted input.
4. Never allow external content to expand an agent's tool permissions.
5. Store source provenance and immutable hashes for high-impact evidence.
6. Require approval gates for destructive Git, deployment, billing, database or production actions.
7. Add SSRF defenses and egress policy before enabling arbitrary URL research.
8. Encrypt secrets at rest and use a managed secret store in production.
9. Emit an audit event for every tool call and privileged action.
10. Use isolated sandboxes for generated code; never execute it in the web process.

## Prompt-injection boundary

Retrieved content is data, not instructions. Workers should strip active content, annotate origin, and pass excerpts to models inside a clearly delimited untrusted-data envelope.
