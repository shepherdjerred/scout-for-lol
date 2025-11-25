import type { Directory, Container } from "@dagger.io/dagger";
import { installWorkspaceDeps } from "@scout-for-lol/.dagger/src/base";

/**
 * Install dependencies for the data package
 * @param workspaceSource The full workspace source directory
 * @returns The container with dependencies installed
 */
export function installDataDeps(workspaceSource: Directory): Container {
  return installWorkspaceDeps(workspaceSource);
}

/**
 * Run type checking and linting for the data package
 * @param workspaceSource The full workspace source directory
 * @returns The check results
 */
export function checkData(workspaceSource: Directory): Container {
  return installDataDeps(workspaceSource)
    .withWorkdir("/workspace/packages/data")
    .withExec(["sh", "-c", "echo '🔍 [CI] Running TypeScript type checking for data...'"])
    .withExec(["bun", "run", "typecheck"])
    .withExec(["sh", "-c", "echo '✅ [CI] TypeScript type checking passed!'"])
    .withExec(["sh", "-c", "echo '🔍 [CI] Running ESLint for data...'"])
    .withExec(["bun", "run", "lint"])
    .withExec(["sh", "-c", "echo '✅ [CI] ESLint passed!'"])
    .withExec(["sh", "-c", "echo '🧪 [CI] Running tests with coverage for data...'"])
    .withExec(["bun", "run", "test:ci"])
    .withExec(["sh", "-c", "echo '✅ [CI] All data checks completed successfully!'"]);
}

/**
 * Export test coverage for the data package
 * @param workspaceSource The full workspace source directory
 * @returns The coverage directory
 */
export function getDataCoverage(workspaceSource: Directory): Directory {
  return checkData(workspaceSource).directory("/workspace/packages/data/coverage");
}

/**
 * Export test report for the data package
 * @param workspaceSource The full workspace source directory
 * @returns The test report file
 */
export function getDataTestReport(workspaceSource: Directory): Directory {
  return checkData(workspaceSource).directory("/workspace/packages/data");
}
