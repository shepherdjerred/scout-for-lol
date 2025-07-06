import { Directory, Container, Secret } from "@dagger.io/dagger";
import { getBunContainer, getBunNodeContainer } from "./base";

/**
 * Generate Prisma client for the backend
 * @param source The source directory
 * @returns The generated Prisma client directory
 */
export function generatePrisma(source: Directory): Directory {
  return getBunNodeContainer()
    .withExec(["apt", "install", "-y", "openssl"])
    .withMountedDirectory("/workspace", source)
    .withDirectory("/workspace/packages/backend", source)
    .withWorkdir("/workspace/packages/backend")
    .withExec(["bun", "run", "src/database/generate.ts"])
    .withExec(["rm", "-f", "generated/client/runtime/edge-esm.cjs"])
    .directory("/workspace/packages/backend/generated");
}

/**
 * Install dependencies for the backend
 * @param source The source directory
 * @param dataSource The data package source
 * @param reportSource The report package source
 * @returns The container with dependencies installed
 */
export function installBackendDeps(
  source: Directory,
  dataSource: Directory,
  reportSource: Directory
): Container {
  return getBunContainer()
    .withExec(["apt", "update"])
    .withExec(["apt", "install", "-y", "openssl"])
    .withWorkdir("/workspace/packages/backend")
    .withDirectory("/workspace/packages/data/src", dataSource)
    .withDirectory("/workspace/packages/report/src", reportSource)
    .withMountedDirectory(
      "/workspace/packages/backend/generated",
      generatePrisma(source)
    )
    .withDirectory("/workspace/packages/backend", source)
    .withWorkdir("/workspace/packages/backend")
    .withExec(["bun", "install", "--frozen-lockfile"]);
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
 * @param source The source directory
 * @param dataSource The data package source
 * @param reportSource The report package source
 * @returns The test results
 */
export function checkBackend(
  source: Directory,
  dataSource: Directory,
  reportSource: Directory
): Container {
  return installBackendDeps(source, dataSource, reportSource)
    .withExec(["bun", "run", "type-check"])
    .withExec(["bun", "run", "lint"])
    .withFile(".env", source.file("test.env"))
    .withExec(["bun", "test"]);
}

/**
 * Build the backend Docker image
 * @param source The source directory
 * @param dataSource The data package source
 * @param reportSource The report package source
 * @param version The version tag
 * @param gitSha The git SHA
 * @returns The built container
 */
export function buildBackendImage(
  source: Directory,
  dataSource: Directory,
  reportSource: Directory,
  version: string,
  gitSha: string
): Container {
  return installBackendDeps(source, dataSource, reportSource)
    .withEnvVariable("VERSION", version)
    .withEnvVariable("GIT_SHA", gitSha)
    .withDirectory(
      "/workspace/packages/backend/prisma",
      source.directory("prisma")
    )
    .withEntrypoint([
      "sh",
      "-c",
      "bun run src/database/migrate.ts && bun run src/index.ts",
    ])
    .withExec([
      "healthcheck",
      "--interval=30s",
      "--timeout=5s",
      "--start-period=5s",
      "--retries=3",
      "CMD",
      "bun run /workspace/packages/backend/src/health.ts || exit 1",
    ]);
}

/**
 * Publish the backend Docker image
 * @param source The source directory
 * @param dataSource The data package source
 * @param reportSource The report package source
 * @param version The version tag
 * @param gitSha The git SHA
 * @param registryUsername Optional registry username for authentication
 * @param registryPassword Optional registry password for authentication
 * @returns The published image references
 */
export async function publishBackendImage(
  source: Directory,
  dataSource: Directory,
  reportSource: Directory,
  version: string,
  gitSha: string,
  registryUsername?: string,
  registryPassword?: Secret
): Promise<string[]> {
  let image = buildBackendImage(
    source,
    dataSource,
    reportSource,
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
