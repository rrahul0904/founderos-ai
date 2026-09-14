import assert from "node:assert/strict";
import test from "node:test";
import { VercelPreviewClient } from "./index";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("discovers only the exact non-production commit preview", async () => {
  let requested = "";
  const fetcher = (async (input: RequestInfo | URL) => {
    requested = String(input);
    return jsonResponse({ deployments: [
      { uid: "dpl_prod", url: "prod.vercel.app", target: "production", readyState: "READY", createdAt: 4, meta: { githubCommitSha: "abc1234", githubCommitRef: "founderos/task" } },
      { uid: "dpl_wrong", url: "wrong.vercel.app", target: null, readyState: "READY", createdAt: 3, meta: { githubCommitSha: "def5678", githubCommitRef: "founderos/task" } },
      { uid: "dpl_preview", url: "preview.vercel.app", target: null, readyState: "READY", createdAt: 2, meta: { githubCommitSha: "abc1234", githubCommitRef: "founderos/task" } }
    ] });
  }) as typeof fetch;
  const client = new VercelPreviewClient({ token: "secret", fetcher });
  const deployment = await client.findExactPreview({ teamId: "team_abc123", projectId: "prj_abc123", commitSha: "abc1234", branch: "founderos/task" });
  assert.equal(deployment?.deploymentId, "dpl_preview");
  assert.equal(deployment?.url, "https://preview.vercel.app");
  assert.match(requested, /sha=abc1234/);
  assert.match(requested, /branch=founderos%2Ftask/);
});

test("does not certify a deployment without exact Git metadata", async () => {
  const fetcher = (async () => jsonResponse({ deployments: [{ uid: "dpl_unknown", url: "preview.vercel.app", readyState: "READY" }] })) as typeof fetch;
  const client = new VercelPreviewClient({ token: "secret", fetcher });
  assert.equal(await client.findExactPreview({ teamId: "team_abc123", projectId: "prj_abc123", commitSha: "abc1234", branch: "founderos/task" }), null);
});

test("rejects unexpected preview hosts", async () => {
  const fetcher = (async () => jsonResponse({ deployments: [{ uid: "dpl_bad", url: "internal.example.com", readyState: "READY", meta: { githubCommitSha: "abc1234", githubCommitRef: "founderos/task" } }] })) as typeof fetch;
  const client = new VercelPreviewClient({ token: "secret", fetcher });
  await assert.rejects(() => client.findExactPreview({ teamId: "team_abc123", projectId: "prj_abc123", commitSha: "abc1234", branch: "founderos/task" }));
});
