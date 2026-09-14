import { createHash } from "node:crypto";

export interface ReleaseEvidenceInput {
  executionId: string;
  planId: string;
  repository: string;
  branchName: string;
  baseBranch: string;
  commitSha: string;
  model: string;
  changedFiles: string[];
  verificationCommand: string;
  generatedAt?: string;
}

export function createReleaseEvidence(input: ReleaseEvidenceInput) {
  const manifest = {
    version: 1 as const,
    executionId: input.executionId,
    planId: input.planId,
    repository: input.repository,
    branchName: input.branchName,
    baseBranch: input.baseBranch,
    commitSha: input.commitSha,
    model: input.model,
    changedFiles: [...new Set(input.changedFiles)].sort(),
    verificationCommand: input.verificationCommand,
    generatedAt: input.generatedAt ?? new Date().toISOString()
  };
  const digestSha256 = createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
  return { ...manifest, digestSha256 };
}
