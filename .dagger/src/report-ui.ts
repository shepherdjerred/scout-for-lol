import { Directory, Container } from "@dagger.io/dagger";
import { installWorkspaceDeps } from "./base";

/**
 * Install dependencies for the report-ui package
 * @param workspaceSource The full workspace source directory
 * @returns The container with dependencies installed
 */
export function installReportUiDeps(workspaceSource: Directory): Container {
  return installWorkspaceDeps(workspaceSource);
}

/**
 * Run type checking, linting, and tests for the report-ui package
 * @param workspaceSource The full workspace source directory
 * @returns The test results
 */
export function checkReportUi(workspaceSource: Directory): Container {
  return installReportUiDeps(workspaceSource)
    .withWorkdir("/workspace/packages/report-ui")
    .withExec(["sh", "-c", "echo '🔍 [CI] Running TypeScript type checking for report-ui...'"])
    .withExec(["bun", "run", "typecheck"])
    .withExec(["sh", "-c", "echo '✅ [CI] TypeScript type checking passed!'"])
    .withExec(["sh", "-c", "echo '🔍 [CI] Running ESLint for report-ui...'"])
    .withExec(["bun", "run", "lint"])
    .withExec(["sh", "-c", "echo '✅ [CI] ESLint passed!'"])
    .withExec(["sh", "-c", "echo '🧪 [CI] Running tests with coverage for report-ui...'"])
    .withExec(["bun", "run", "test:ci"])
    .withExec(["sh", "-c", "echo '✅ [CI] All report-ui checks completed successfully!'"]);
}

/**
 * Export test coverage for the report-ui package
 * @param workspaceSource The full workspace source directory
 * @returns The coverage directory
 */
export function getReportUiCoverage(workspaceSource: Directory): Directory {
  return checkReportUi(workspaceSource).directory("/workspace/packages/report-ui/coverage");
}

/**
 * Export test report for the report-ui package
 * @param workspaceSource The full workspace source directory
 * @returns The test report file
 */
export function getReportUiTestReport(workspaceSource: Directory): Directory {
  return checkReportUi(workspaceSource).directory("/workspace/packages/report-ui");
}

/**
 * Build the report-ui package
 * @param workspaceSource The full workspace source directory
 * @returns The built dist directory
 */
export function buildReportUi(workspaceSource: Directory): Directory {
  return installReportUiDeps(workspaceSource)
    .withWorkdir("/workspace/packages/report-ui")
    .withExec(["sh", "-c", "echo '🏗️  Building report-ui package...'"])
    .withExec(["bun", "run", "build"])
    .withExec(["sh", "-c", "echo '✅ [CI] report-ui build completed successfully!'"])
    .directory("/workspace/packages/report-ui/dist");
}
