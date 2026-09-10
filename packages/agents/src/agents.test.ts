import assert from "node:assert/strict";
import test from "node:test";
import { createProject, type EvidenceRecord } from "@founderos/core";
import { runAgent } from "./index";

test("validation agent works without paid keys", async () => {
  const project = createProject("A durable product brain that keeps evidence and decisions across the build lifecycle");
  const run = await runAgent("validation", project);
  assert.equal(run.provider, "mock");
  assert.equal(run.stage, "evidence");
  assert.match(run.output, /Evidence/);
  assert.equal(run.costUsd, 0);
});

test("agent carries evidence ids into the run", async () => {
  const project = createProject("A durable product brain that keeps evidence and decisions across the build lifecycle");
  const evidence: EvidenceRecord = { id: crypto.randomUUID(), projectId: project.id, sourceType: "manual", claim: "Users lose context", confidence: 0.8, collectedAt: new Date().toISOString(), metadata: {} };
  const run = await runAgent("product", project, { evidence: [evidence] });
  assert.deepEqual(run.evidenceIds, [evidence.id]);
});
