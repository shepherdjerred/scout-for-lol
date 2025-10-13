import { Directory, Container } from "@dagger.io/dagger";
import { getBunContainer } from "./base";

/**
 * Install dependencies for the report package
 * @param workspaceSource The full workspace source directory
 * @returns The container with dependencies installed
 */
export function installReportDeps(workspaceSource: Directory): Container {
  return getBunContainer()
    .withWorkdir("/workspace")
    .withFile("/workspace/package.json", workspaceSource.file("package.json"))
    .withFile("/workspace/bun.lock", workspaceSource.file("bun.lock"))
    .withFile("/workspace/eslint.config.ts", workspaceSource.file("eslint.config.ts"))
    .withFile("/workspace/tsconfig.json", workspaceSource.file("tsconfig.json"))
    .withFile("/workspace/tsconfig.base.json", workspaceSource.file("tsconfig.base.json"))
    .withDirectory("/workspace/eslint-rules", workspaceSource.directory("eslint-rules"))
    .withDirectory("/workspace/packages/backend", workspaceSource.directory("packages/backend"))
    .withDirectory("/workspace/packages/data", workspaceSource.directory("packages/data"))
    .withDirectory("/workspace/packages/report", workspaceSource.directory("packages/report"))
    .withDirectory("/workspace/packages/frontend", workspaceSource.directory("packages/frontend"))
    .withWorkdir("/workspace")
    .withExec(["bun", "install", "--frozen-lockfile"]);
}

/**
 * Run type checking, linting, and tests for the report package
 * @param workspaceSource The full workspace source directory
 * @returns The test results
 */
export function checkReport(workspaceSource: Directory): Container {
  return installReportDeps(workspaceSource)
    .withWorkdir("/workspace/packages/report")
    .withExec(["sh", "-c", "echo '🔍 [CI] Running TypeScript type checking for report...'"])
    .withExec(["bunx", "--bun", "tsc", "--noEmit"])
    .withExec(["sh", "-c", "echo '✅ [CI] TypeScript type checking passed!'"])
    .withExec(["sh", "-c", "echo '🔍 [CI] Running ESLint for report...'"])
    .withExec(["bunx", "eslint", "src"])
    .withExec(["sh", "-c", "echo '✅ [CI] ESLint passed!'"])
    .withExec(["sh", "-c", "echo '🧪 [CI] Running tests for report...'"])
    .withExec(["bun", "test"])
    .withExec(["sh", "-c", "echo '✅ [CI] All report checks completed successfully!'"]);
}
