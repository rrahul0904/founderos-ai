import assert from "node:assert/strict";
import test from "node:test";
import { createProject } from "@founderos/core";
import { runAgent } from "./index";

test("validation agent works without paid keys", async () => {
  const project = createProject("A durable product brain that keeps evidence and decisions across the build lifecycle");
  const run = await runAgent("validation", project);
  assert.equal(run.provider, "mock");
  assert.equal(run.stage, "evidence");
  assert.match(run.output, /Evidence plan/);
});
