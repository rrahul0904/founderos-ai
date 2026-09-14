import assert from "node:assert/strict";
import test from "node:test";
import { createProject } from "@founderos/core";
import { approveBuildPlan, generateBuildPlan, normalizeRepository, renderTaskIssueBody, renderWorkOrder } from "./index";

test("normalizes GitHub repository references", () => {
  assert.equal(normalizeRepository("https://github.com/acme/widget.git"), "acme/widget");
  assert.throws(() => normalizeRepository("not-a-repo"));
});

test("generates an approval-gated six-task build plan", () => {
  const project = createProject("A product brain that turns evidence into guarded implementation work");
  const plan = generateBuildPlan(project, { repository: "acme/widget", objective: "Ship guarded build execution" });
  assert.equal(plan.status, "draft");
  assert.equal(plan.tasks.length, 6);
  assert.match(plan.branchName, /^founderos\//);
  assert.match(renderTaskIssueBody(plan, plan.tasks[0]), /Acceptance criteria/);
  assert.match(renderWorkOrder(plan), /FounderOS work order/);
});

test("approval records actor and timestamp", () => {
  const project = createProject("A product brain that keeps evidence attached to implementation");
  const plan = generateBuildPlan(project, { repository: "acme/widget" });
  const approved = approveBuildPlan(plan, "user-123");
  assert.equal(approved.status, "approved");
  assert.equal(approved.approvedBy, "user-123");
  assert.ok(approved.approvedAt);
});
