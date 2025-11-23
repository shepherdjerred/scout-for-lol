import { Directory, Container } from "@dagger.io/dagger";
import { installWorkspaceDeps } from "./base";

/**
 * Install dependencies for the review-dev-tool package
 * @param workspaceSource The full workspace source directory
 * @returns The container with dependencies installed
 */
export function installReviewDevToolDeps(workspaceSource: Directory): Container {
  return installWorkspaceDeps(workspaceSource);
}

/**
 * Run type checking and linting for the review-dev-tool package
 * @param workspaceSource The full workspace source directory
 * @returns The check results container
 */
export function checkReviewDevTool(workspaceSource: Directory): Container {
  return installReviewDevToolDeps(workspaceSource)
    .withWorkdir("/workspace/packages/review-dev-tool")
    .withExec(["sh", "-c", "echo '🔍 [CI] Running TypeScript type checking for review-dev-tool...'"])
    .withExec(["bun", "run", "typecheck"])
    .withExec(["sh", "-c", "echo '✅ [CI] TypeScript type checking passed!'"])
    .withExec(["sh", "-c", "echo '🔍 [CI] Running ESLint for review-dev-tool...'"])
    .withExec(["bun", "run", "lint"])
    .withExec(["sh", "-c", "echo '✅ [CI] ESLint passed!'"])
    .withExec(["sh", "-c", "echo '✅ [CI] All review-dev-tool checks completed successfully!'"]);
}
