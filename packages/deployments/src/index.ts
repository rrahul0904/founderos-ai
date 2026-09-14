export interface VercelPreviewClientOptions {
  token: string;
  apiBase?: string;
  fetcher?: typeof fetch;
}

export interface VercelPreviewBinding {
  teamId: string;
  projectId: string;
  commitSha: string;
  branch: string;
}

export interface VercelPreviewDeployment {
  provider: "vercel";
  deploymentId: string;
  url: string;
  state: string;
  target: string | null;
  commitSha: string;
  branch: string;
  createdAt: number | null;
}

type VercelDeployment = {
  uid?: string;
  id?: string;
  url?: string;
  state?: string;
  readyState?: string;
  target?: string | null;
  created?: number;
  createdAt?: number;
  meta?: Record<string, unknown>;
  gitSource?: Record<string, unknown>;
};

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeUrl(raw: string) {
  const value = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  const url = new URL(value);
  if (url.protocol !== "https:" || !url.hostname.toLowerCase().endsWith(".vercel.app") || url.port || url.username || url.password) {
    throw new Error(`Unexpected Vercel preview URL: ${raw}`);
  }
  return url.toString().replace(/\/$/, "");
}

function deploymentCommit(item: VercelDeployment) {
  return text(item.meta?.githubCommitSha) || text(item.gitSource?.sha);
}

function deploymentBranch(item: VercelDeployment) {
  return text(item.meta?.githubCommitRef) || text(item.gitSource?.ref);
}

export class VercelPreviewClient {
  private readonly token: string;
  private readonly apiBase: string;
  private readonly fetcher: typeof fetch;

  constructor(options: VercelPreviewClientOptions) {
    if (!options.token.trim()) throw new Error("VERCEL_TOKEN is required for preview discovery");
    this.token = options.token.trim();
    this.apiBase = (options.apiBase ?? "https://api.vercel.com").replace(/\/$/, "");
    this.fetcher = options.fetcher ?? fetch;
  }

  static fromEnv(fetcher: typeof fetch = fetch) {
    return new VercelPreviewClient({ token: process.env.VERCEL_TOKEN ?? "", fetcher });
  }

  async findExactPreview(binding: VercelPreviewBinding): Promise<VercelPreviewDeployment | null> {
    if (!/^team_[A-Za-z0-9]+$/.test(binding.teamId)) throw new Error("A valid Vercel team ID is required");
    if (!/^prj_[A-Za-z0-9]+$/.test(binding.projectId)) throw new Error("A valid Vercel project ID is required");
    if (!/^[a-f0-9]{7,64}$/i.test(binding.commitSha)) throw new Error("A valid Git commit SHA is required for preview discovery");
    if (!binding.branch.trim()) throw new Error("A Git branch is required for preview discovery");

    const query = new URLSearchParams({
      projectId: binding.projectId,
      teamId: binding.teamId,
      sha: binding.commitSha,
      branch: binding.branch,
      limit: "20"
    });
    const response = await this.fetcher(`${this.apiBase}/v7/deployments?${query.toString()}`, {
      headers: { authorization: `Bearer ${this.token}`, accept: "application/json" },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`Vercel deployment lookup failed with HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
    const payload = await response.json() as { deployments?: VercelDeployment[] };
    const exact = (payload.deployments ?? [])
      .filter((item) => deploymentCommit(item) === binding.commitSha && deploymentBranch(item) === binding.branch)
      .filter((item) => item.target !== "production")
      .sort((a, b) => Number(b.createdAt ?? b.created ?? 0) - Number(a.createdAt ?? a.created ?? 0))[0];
    if (!exact) return null;
    const id = exact.uid || exact.id;
    if (!id || !exact.url) throw new Error("Vercel returned an incomplete preview deployment record");
    return {
      provider: "vercel",
      deploymentId: id,
      url: normalizeUrl(exact.url),
      state: text(exact.readyState) || text(exact.state) || "UNKNOWN",
      target: typeof exact.target === "string" ? exact.target : null,
      commitSha: deploymentCommit(exact),
      branch: deploymentBranch(exact),
      createdAt: Number.isFinite(Number(exact.createdAt ?? exact.created)) ? Number(exact.createdAt ?? exact.created) : null
    };
  }
}
