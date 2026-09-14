import assert from "node:assert/strict";
import test from "node:test";
import { GitHubDeliveryClient } from "./index";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("denies repositories outside the allowlist", () => {
  const client = new GitHubDeliveryClient({ token: "x", allowedRepositories: ["acme/allowed"] });
  assert.throws(() => client.assertAllowed("acme/blocked"));
  assert.equal(client.assertAllowed("ACME/ALLOWED"), "acme/allowed");
});

test("creates issue through a server-side GitHub adapter", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return jsonResponse({ number: 42, html_url: "https://github.com/acme/widget/issues/42" });
  }) as typeof fetch;
  const client = new GitHubDeliveryClient({ token: "secret", allowedRepositories: ["acme/widget"], fetcher });
  const issue = await client.createIssue("acme/widget", "Implement thing", "body");
  assert.equal(issue.number, 42);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.method, "POST");
});

test("branch creation is idempotent when GitHub reports an existing ref", async () => {
  let createCalls = 0;
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/git/ref/heads/main")) return jsonResponse({ object: { sha: "base-sha" } });
    if (url.endsWith("/git/refs") && init?.method === "POST") {
      createCalls += 1;
      return jsonResponse({ message: "Reference already exists" }, 422);
    }
    if (url.includes("/git/ref/heads/founderos/task")) return jsonResponse({ object: { sha: "existing-sha" } });
    return jsonResponse({ message: "unexpected" }, 500);
  }) as typeof fetch;
  const client = new GitHubDeliveryClient({ token: "secret", allowedRepositories: ["acme/widget"], fetcher });
  const branch = await client.createBranch("acme/widget", "founderos/task", "main");
  assert.equal(createCalls, 1);
  assert.equal(branch.existed, true);
  assert.equal(branch.sha, "existing-sha");
});
