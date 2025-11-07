import { Directory, Container } from "@dagger.io/dagger";
import { installWorkspaceDeps } from "./base";

/**
 * Install dependencies for the report package
 * @param workspaceSource The full workspace source directory
 * @returns The container with dependencies installed
 */
export function installReportDeps(workspaceSource: Directory): Container {
  return installWorkspaceDeps(workspaceSource);
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
    .withExec(["bun", "run", "typecheck"])
    .withExec(["sh", "-c", "echo '✅ [CI] TypeScript type checking passed!'"])
    .withExec(["sh", "-c", "echo '🔍 [CI] Running ESLint for report...'"])
    .withExec(["bun", "run", "lint"])
    .withExec(["sh", "-c", "echo '✅ [CI] ESLint passed!'"])
    .withExec(["sh", "-c", "echo '🧪 [CI] Running tests with coverage for report...'"])
    .withExec(["bun", "run", "test:ci"])
    .withExec(["sh", "-c", "echo '✅ [CI] All report checks completed successfully!'"]);
}

/**
 * Export test coverage for the report package
 * @param workspaceSource The full workspace source directory
 * @returns The coverage directory
 */
export function getReportCoverage(workspaceSource: Directory): Directory {
  return checkReport(workspaceSource).directory("/workspace/packages/report/coverage");
}

/**
 * Export test report for the report package
 * @param workspaceSource The full workspace source directory
 * @returns The test report file
 */
export function getReportTestReport(workspaceSource: Directory): Directory {
  return checkReport(workspaceSource).directory("/workspace/packages/report");
}
