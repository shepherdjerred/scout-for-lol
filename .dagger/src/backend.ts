import { Directory, Container, Secret, File } from "@dagger.io/dagger";
import { getBunContainer, getBunNodeContainer } from "./base";

/**
 * Generate Prisma client for the backend (without dependencies)
 * @param baseContainer The container with dependencies already installed
 * @returns The generated Prisma client directory
 */
export function generatePrismaFromContainer(baseContainer: Container): Directory {
  return baseContainer
    .withWorkdir("/workspace/packages/backend")
    .withExec(["bun", "run", "src/database/generate.ts"])
    .withExec(["rm", "-f", "generated/client/runtime/edge-esm.cjs"])
    .directory("/workspace/packages/backend/generated");
}

/**
 * Install dependencies for the backend
 * @param workspaceSource The full workspace source directory
 * @returns The container with dependencies installed
 */
export function installBackendDeps(
  workspaceSource: Directory
): Container {
  const baseContainer = getBunContainer()
    .withExec(["apt", "update"])
    .withExec(["apt", "install", "-y", "openssl"])
    .withWorkdir("/workspace")
    .withFile("/workspace/package.json", workspaceSource.file("package.json"))
    .withFile("/workspace/bun.lock", workspaceSource.file("bun.lock"))
    .withDirectory("/workspace/packages/backend", workspaceSource.directory("packages/backend"))
    .withDirectory("/workspace/packages/data", workspaceSource.directory("packages/data"))
    .withDirectory("/workspace/packages/report", workspaceSource.directory("packages/report"))
    .withDirectory("/workspace/packages/frontend", workspaceSource.directory("packages/frontend"))
    .withWorkdir("/workspace")
    .withExec(["bun", "install", "--frozen-lockfile"]);

  return baseContainer
    .withMountedDirectory(
      "/workspace/packages/backend/generated",
      generatePrismaFromContainer(baseContainer)
    );
}

/**
 * Update the Bun lockfile
 * @param source The source directory
 * @returns The updated lockfile
 */
export function updateLockfile(source: Directory): Directory {
  return getBunContainer()
    .withMountedDirectory("/workspace", source)
    .withWorkdir("/workspace/packages/backend")
    .withExec(["bun", "install"])
    .directory("/workspace/packages/backend");
}

/**
 * Run type checking, linting, and tests for the backend
 * @param workspaceSource The full workspace source directory
 * @returns The test results
 */
export function checkBackend(
  workspaceSource: Directory
): Container {
  return installBackendDeps(workspaceSource)
    .withExec(["bun", "run", "type-check"])
    .withExec(["bun", "run", "lint"])
    .withFile(".env", workspaceSource.directory("packages/backend").file("test.env"))
    .withExec(["bun", "test"]);
}

/**
 * Build the backend Docker image
 * @param workspaceSource The full workspace source directory
 * @param version The version tag
 * @param gitSha The git SHA
 * @returns The built container
 */
export function buildBackendImage(
  workspaceSource: Directory,
  version: string,
  gitSha: string
): Container {
  return installBackendDeps(workspaceSource)
    .withEnvVariable("VERSION", version)
    .withEnvVariable("GIT_SHA", gitSha)
    .withDirectory(
      "/workspace/packages/backend/prisma",
      workspaceSource.directory("packages/backend").directory("prisma")
    )
    .withEntrypoint([
      "sh",
      "-c",
      "bun run src/database/migrate.ts && bun run src/index.ts",
    ])
    .withLabel("org.opencontainers.image.title", "scout-for-lol-backend")
    .withLabel("org.opencontainers.image.description", "Scout for LoL Discord bot backend");
}

/**
 * Publish the backend Docker image
 * @param workspaceSource The full workspace source directory
 * @param version The version tag
 * @param gitSha The git SHA
 * @param registryUsername Optional registry username for authentication
 * @param registryPassword Optional registry password for authentication
 * @returns The published image references
 */
export async function publishBackendImage(
  workspaceSource: Directory,
  version: string,
  gitSha: string,
  registryUsername?: string,
  registryPassword?: Secret
): Promise<string[]> {
  let image = buildBackendImage(
    workspaceSource,
    version,
    gitSha
  );

  // Set up registry authentication if credentials provided
  if (registryUsername && registryPassword) {
    image = image.withRegistryAuth(
      "ghcr.io",
      registryUsername,
      registryPassword
    );
  }

  const versionRef = await image.publish(
    `ghcr.io/shepherdjerred/scout-for-lol:${version}`
  );
  const shaRef = await image.publish(
    `ghcr.io/shepherdjerred/scout-for-lol:${gitSha}`
  );

  return [versionRef, shaRef];
}
