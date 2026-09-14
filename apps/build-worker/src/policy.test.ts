import assert from "node:assert/strict";
import test from "node:test";
import { isForbiddenPath, normalizeRelativePath } from "./policy";

test("normalizes safe repository paths", () => {
  assert.equal(normalizeRelativePath("./src/components/app.tsx"), "src/components/app.tsx");
  assert.equal(normalizeRelativePath("src\\lib\\value.ts"), "src/lib/value.ts");
});

test("blocks traversal and absolute paths", () => {
  assert.throws(() => normalizeRelativePath("../outside.txt"));
  assert.throws(() => normalizeRelativePath("/etc/passwd"));
  assert.throws(() => normalizeRelativePath("C:/secrets.txt"));
});

test("blocks sensitive and protected execution paths", () => {
  for (const blocked of [".env", ".env.production", ".git/config", ".git", ".github/workflows/ci.yml", ".github/workflows", "node_modules/pkg/index.js", "dist/app.js", "build/output.js", "service-credentials.json", "prod-secrets.json"]) {
    assert.throws(() => normalizeRelativePath(blocked), blocked);
  }
  assert.equal(isForbiddenPath("src/build/widget.ts"), false);
});
