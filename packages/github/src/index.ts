export interface GitHubDeliveryClientOptions {
  token: string;
  allowedRepositories?: string[];
  allowAnyRepository?: boolean;
  apiBase?: string;
  fetcher?: typeof fetch;
}

export interface GitHubRepositoryInfo {
  fullName: string;
  defaultBranch: string;
  private: boolean;
}

export interface GitHubIssueResult {
  number: number;
  url: string;
}

export interface GitHubBranchResult {
  name: string;
  sha: string;
  existed: boolean;
}

function canonicalRepository(value: string) {
  const repository = value.trim().toLowerCase();
  if (!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/.test(repository)) throw new Error("Invalid GitHub repository name");
  return repository;
}

function encodeRef(ref: string) {
  return ref.split("/").map(encodeURIComponent).join("/");
}

export class GitHubDeliveryClient {
  private readonly token: string;
  private readonly allowedRepositories: Set<string>;
  private readonly allowAnyRepository: boolean;
  private readonly apiBase: string;
  private readonly fetcher: typeof fetch;

  constructor(options: GitHubDeliveryClientOptions) {
    if (!options.token.trim()) throw new Error("GITHUB_TOKEN is required for GitHub delivery");
    this.token = options.token.trim();
    this.allowedRepositories = new Set((options.allowedRepositories ?? []).map(canonicalRepository));
    this.allowAnyRepository = options.allowAnyRepository === true;
    this.apiBase = (options.apiBase ?? "https://api.github.com").replace(/\/$/, "");
    this.fetcher = options.fetcher ?? fetch;
  }

  static fromEnv(fetcher: typeof fetch = fetch) {
    const allowedRepositories = (process.env.FOUNDEROS_GITHUB_ALLOWED_REPOS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    return new GitHubDeliveryClient({
      token: process.env.GITHUB_TOKEN ?? "",
      allowedRepositories,
      allowAnyRepository: process.env.FOUNDEROS_GITHUB_ALLOW_ANY_REPO === "true",
      fetcher
    });
  }

  assertAllowed(repository: string) {
    const canonical = canonicalRepository(repository);
    if (!this.allowAnyRepository && !this.allowedRepositories.has(canonical)) {
      throw new Error(`Repository ${repository} is not in FOUNDEROS_GITHUB_ALLOWED_REPOS`);
    }
    return canonical;
  }

  private async request(path: string, init: RequestInit = {}) {
    const response = await this.fetcher(`${this.apiBase}${path}`, {
      ...init,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${this.token}`,
        "x-github-api-version": "2022-11-28",
        ...(init.headers ?? {})
      }
    });
    if (!response.ok) {
      const payload = await response.text().catch(() => "");
      throw new Error(`GitHub API ${response.status}: ${payload.slice(0, 500) || response.statusText}`);
    }
    return response;
  }

  async verifyRepository(repository: string): Promise<GitHubRepositoryInfo> {
    const canonical = this.assertAllowed(repository);
    const response = await this.request(`/repos/${canonical}`);
    const data = await response.json() as { full_name?: string; default_branch?: string; private?: boolean };
    return {
      fullName: data.full_name || canonical,
      defaultBranch: data.default_branch || "main",
      private: data.private === true
    };
  }

  async createIssue(repository: string, title: string, body: string): Promise<GitHubIssueResult> {
    const canonical = this.assertAllowed(repository);
    const response = await this.request(`/repos/${canonical}/issues`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: title.slice(0, 240), body })
    });
    const data = await response.json() as { number?: number; html_url?: string };
    if (!data.number || !data.html_url) throw new Error("GitHub issue response was incomplete");
    return { number: data.number, url: data.html_url };
  }

  private async getBranch(repository: string, branchName: string) {
    const canonical = this.assertAllowed(repository);
    const response = await this.request(`/repos/${canonical}/git/ref/heads/${encodeRef(branchName)}`);
    const data = await response.json() as { object?: { sha?: string } };
    const sha = data.object?.sha;
    if (!sha) throw new Error(`Unable to resolve branch ${branchName}`);
    return sha;
  }

  async createBranch(repository: string, branchName: string, baseBranch: string): Promise<GitHubBranchResult> {
    const canonical = this.assertAllowed(repository);
    const baseSha = await this.getBranch(canonical, baseBranch);
    const response = await this.fetcher(`${this.apiBase}/repos/${canonical}/git/refs`, {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
        "x-github-api-version": "2022-11-28"
      },
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha })
    });
    if (response.status === 422) {
      const existingSha = await this.getBranch(canonical, branchName);
      return { name: branchName, sha: existingSha, existed: true };
    }
    if (!response.ok) {
      const payload = await response.text().catch(() => "");
      throw new Error(`GitHub API ${response.status}: ${payload.slice(0, 500) || response.statusText}`);
    }
    const data = await response.json() as { object?: { sha?: string } };
    return { name: branchName, sha: data.object?.sha || baseSha, existed: false };
  }
}
