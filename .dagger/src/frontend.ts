import type { Directory, Container, Secret } from "@dagger.io/dagger";
import { dag } from "@dagger.io/dagger";
import { installWorkspaceDeps, getPreparedWorkspace } from "@scout-for-lol/.dagger/src/base";

/**
 * Install dependencies for the frontend package
 * @param workspaceSource The full workspace source directory
 * @returns The container with dependencies installed
 */
export function installFrontendDeps(workspaceSource: Directory): Container {
  return installWorkspaceDeps(workspaceSource);
}

/**
 * Run type checking and linting for the frontend package
 * @param workspaceSource The full workspace source directory
 * @param preparedWorkspace Optional pre-prepared container (with deps already installed)
 * @returns The check results container
 */
export function checkFrontend(workspaceSource: Directory, preparedWorkspace?: Container): Container {
  const base = preparedWorkspace ?? getPreparedWorkspace(workspaceSource);
  return base
    .withWorkdir("/workspace/packages/frontend")
    .withExec(["bun", "run", "typecheck"])
    .withExec(["bun", "run", "lint"]);
}

/**
 * Build the frontend for production
 * @param workspaceSource The full workspace source directory
 * @param preparedWorkspace Optional pre-prepared container (with deps already installed)
 * @returns The built dist directory
 */
export function buildFrontend(workspaceSource: Directory, preparedWorkspace?: Container): Directory {
  const base = preparedWorkspace ?? getPreparedWorkspace(workspaceSource);
  const container = base.withWorkdir("/workspace/packages/frontend").withExec(["bun", "run", "build"]);

  return container.directory("/workspace/packages/frontend/dist");
}

type DeployFrontendOptions = {
  workspaceSource: Directory;
  branch: string;
  gitSha: string;
  cloudflare: {
    projectName: string;
    accountId: Secret;
    apiToken: Secret;
  };
};

/**
 * Deploy the frontend to Cloudflare Pages
 * @param options Deployment options including workspace source, branch, git SHA, and Cloudflare credentials
 * @returns Deployment output
 */
export async function deployFrontend(options: DeployFrontendOptions): Promise<string> {
  const distDir = buildFrontend(options.workspaceSource);

  // Use Bun container for wrangler
  const deployContainer = dag
    .container()
    .from("oven/bun:latest")
    .withDirectory("/workspace/dist", distDir)
    .withSecretVariable("CLOUDFLARE_ACCOUNT_ID", options.cloudflare.accountId)
    .withSecretVariable("CLOUDFLARE_API_TOKEN", options.cloudflare.apiToken)
    .withExec(["sh", "-c", `echo '🚀 [CI] Deploying frontend to Cloudflare Pages (branch: ${options.branch})...'`])
    .withExec([
      "bunx",
      "wrangler@latest",
      "pages",
      "deploy",
      "/workspace/dist",
      `--project-name=${options.cloudflare.projectName}`,
      `--branch=${options.branch}`,
      `--commit-hash=${options.gitSha}`,
    ]);

  const output = await deployContainer.stdout();
  return output;
}
