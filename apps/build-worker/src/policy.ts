import path from "node:path";

const forbiddenRoots = [".git", ".github/workflows", "node_modules", ".next", "dist", "build"];

export function isForbiddenPath(value: string) {
  const lower = value.toLowerCase().replace(/\\/g, "/").replace(/\/$/, "");
  return forbiddenRoots.some((root) => lower === root || lower.startsWith(`${root}/`));
}

export function normalizeRelativePath(value: string) {
  const normalized = value.replace(/\\/g, "/").replace(/^\.\//, "").trim();
  if (!normalized || normalized.includes("\0") || normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized)) throw new Error(`Unsafe path: ${value}`);
  const clean = path.posix.normalize(normalized);
  if (clean === ".." || clean.startsWith("../")) throw new Error(`Path escapes repository: ${value}`);
  const lower = clean.toLowerCase();
  if (lower === ".env" || lower.startsWith(".env.") || lower.includes("credentials") || lower.includes("secrets.")) throw new Error(`Sensitive path is blocked: ${clean}`);
  if (isForbiddenPath(lower)) throw new Error(`Protected path is blocked: ${clean}`);
  return clean;
}
