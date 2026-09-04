# Deployment

## Local

```bash
npm install
npm run dev
```

## Docker

```bash
docker compose up -d postgres
docker build -t founderos-ai .
docker run --rm -p 3000:3000 --env-file .env founderos-ai
```

## Vercel

Deploy `apps/web` from the monorepo or use the repository root with the Next.js workspace configuration. Keep workers outside serverless request handlers; run them in a container platform with PostgreSQL access.

## Kubernetes/cloud-neutral production

- `web`: stateless Node deployment, horizontal scaling.
- `worker`: stateless consumers, horizontal scaling based on queue depth.
- `postgres`: managed PostgreSQL or operator-managed cluster.
- `object storage`: any S3-compatible service.
- `secrets`: Kubernetes Secrets backed by a cloud/Vault secret manager.

No core domain package depends on Vercel-specific APIs.
