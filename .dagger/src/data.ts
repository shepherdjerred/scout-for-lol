import { Directory, Container } from "@dagger.io/dagger";
import { getBunContainer } from "./base";

/**
 * Install dependencies for the data package
 * @param workspaceSource The full workspace source directory
 * @returns The container with dependencies installed
 */
export function installDataDeps(workspaceSource: Directory): Container {
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
    .withExec(["sh", "-c", "echo '✅ [CI] All data checks completed successfully!'"]);
  // Note: Tests are commented out in the original Earthfile
  // .withExec(["bun", "test"]);
}
