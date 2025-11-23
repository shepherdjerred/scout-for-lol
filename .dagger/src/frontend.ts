import { Directory, Container, Secret, dag } from "@dagger.io/dagger";
import { installWorkspaceDeps } from "@scout-for-lol/.dagger/src/base";

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
 * @returns The check results container
 */
export function checkFrontend(workspaceSource: Directory): Container {
  return installFrontendDeps(workspaceSource)
    .withWorkdir("/workspace/packages/frontend")
    .withExec(["sh", "-c", "echo '🔍 [CI] Running TypeScript type checking for frontend...'"])
    .withExec(["bun", "run", "typecheck"])
    .withExec(["sh", "-c", "echo '✅ [CI] TypeScript type checking passed!'"])
    .withExec(["sh", "-c", "echo '🔍 [CI] Running ESLint for frontend...'"])
    .withExec(["bun", "run", "lint"])
    .withExec(["sh", "-c", "echo '✅ [CI] ESLint passed!'"])
    .withExec(["sh", "-c", "echo '✅ [CI] All frontend checks completed successfully!'"]);
}

/**
 * Build the frontend for production
 * @param workspaceSource The full workspace source directory
 * @returns The built dist directory
 */
export function buildFrontend(workspaceSource: Directory): Directory {
  const container = installFrontendDeps(workspaceSource)
    .withWorkdir("/workspace/packages/frontend")
    .withExec(["sh", "-c", "echo '🏗️  [CI] Building frontend for production...'"])
    .withExec(["bun", "run", "build"])
    .withExec(["sh", "-c", "echo '✅ [CI] Frontend build completed successfully!'"]);

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

  // Use Node.js container for wrangler (official tool from Cloudflare)
  const deployContainer = dag
    .container()
    .from("node:lts-slim")
    .withDirectory("/workspace/dist", distDir)
    .withSecretVariable("CLOUDFLARE_ACCOUNT_ID", options.cloudflare.accountId)
    .withSecretVariable("CLOUDFLARE_API_TOKEN", options.cloudflare.apiToken)
    .withExec(["sh", "-c", `echo '🚀 [CI] Deploying frontend to Cloudflare Pages (branch: ${options.branch})...'`])
    .withExec([
      "npx",
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
