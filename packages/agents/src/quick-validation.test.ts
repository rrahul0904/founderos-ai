import assert from "node:assert/strict";
import test from "node:test";
import { QUICK_VALIDATION_MAX_CHARS, QUICK_VALIDATION_MIN_CHARS, assertQuickIdea, buildLocalQuickValidation, sanitizeDomainLabel } from "./quick-validation";

test("quick validation stays evidence-honest without hosted AI", () => {
  const result = buildLocalQuickValidation("A tool for independent plumbers who lose leads because quote follow-up is manual and slow");
  assert.equal(result.provider, "deterministic-local-v1");
  assert.equal(result.evidenceStatus.level, "hypothesis");
  assert.match(result.evidenceStatus.detail, /not verified market research/i);
  assert.ok(result.firstTest.includes("10"));
  assert.ok(result.passThreshold.includes("3 of 10"));
});

test("specific user and problem produce a test-oriented verdict", () => {
  const result = buildLocalQuickValidation("A tool for independent plumbers who lose leads because quote follow-up is manual and slow");
  assert.equal(result.verdict, "worth-testing");
  assert.match(result.likelyPayer, /plumbers/i);
});

test("generic concepts are not overclaimed", () => {
  const result = buildLocalQuickValidation("An innovative online platform that uses technology to make everyday life better for everyone");
  assert.notEqual(result.verdict, "worth-testing");
  assert.match(result.rationale, /buyer|user|problem|outcome|fuzzy|testable/i);
});

test("idea bounds are enforced", () => {
  assert.throws(() => assertQuickIdea("x".repeat(QUICK_VALIDATION_MIN_CHARS - 1)), /at least/);
  assert.throws(() => assertQuickIdea("x".repeat(QUICK_VALIDATION_MAX_CHARS + 1)), /under/);
});

test("domain labels are normalized and bounded", () => {
  assert.equal(sanitizeDomainLabel("  My Great_IDEA!!  "), "mygreatidea");
  assert.ok(sanitizeDomainLabel("a".repeat(100)).length <= 54);
});

test("name ideas are safe .com candidates and remain unchecked", () => {
  const result = buildLocalQuickValidation("A scheduling assistant for mobile dog groomers who waste time routing appointments across town");
  assert.ok(result.nameIdeas.length >= 3);
  for (const item of result.nameIdeas) {
    assert.match(item.domain, /^[a-z0-9-]+\.com$/);
    assert.equal(item.status, "unchecked");
  }
});
