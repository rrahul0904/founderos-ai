import assert from "node:assert/strict";
import test from "node:test";
import { createReleaseEvidence } from "./release-evidence";

const base = {
  executionId: "exec-1",
  planId: "plan-1",
  repository: "acme/widget",
  branchName: "founderos/widget-1234",
  baseBranch: "main",
  commitSha: "abc123",
  model: "test-model",
  changedFiles: ["b.ts", "a.ts", "a.ts"],
  verificationCommand: "npm run verify",
  generatedAt: "2026-09-14T18:00:00.000Z"
};

test("release evidence is deterministic and canonicalizes changed files", () => {
  const first = createReleaseEvidence(base);
  const second = createReleaseEvidence({ ...base, changedFiles: ["a.ts", "b.ts"] });
  assert.equal(first.digestSha256, second.digestSha256);
  assert.deepEqual(first.changedFiles, ["a.ts", "b.ts"]);
  assert.match(first.digestSha256, /^[a-f0-9]{64}$/);
});

test("release evidence digest changes when the verified commit changes", () => {
  const first = createReleaseEvidence(base);
  const second = createReleaseEvidence({ ...base, commitSha: "def456" });
  assert.notEqual(first.digestSha256, second.digestSha256);
});
