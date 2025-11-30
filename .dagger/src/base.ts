import type { Container, Directory } from "@dagger.io/dagger";
import { dag } from "@dagger.io/dagger";

/**
 * Get a base Bun container
 * @returns A Bun container with basic setup
 */
export function getBunContainer(): Container {
  return dag.container().from("oven/bun:latest").withWorkdir("/workspace");
}

/**
 * Generate Prisma client once and return the generated directory.
 * This is expensive and should only be called once per CI run, then shared.
 * @param workspaceSource The full workspace source directory
 * @returns The generated Prisma client directory
 */
export function generatePrismaClient(workspaceSource: Directory): Directory {
  return installWorkspaceDeps(workspaceSource, true)
    .withWorkdir("/workspace/packages/backend")
    .withExec(["bun", "run", "generate"])
    .directory("/workspace/packages/backend/generated");
}

/**
 * Get a fully prepared workspace container with all dependencies installed and Prisma generated.
 * This is the optimized base container for running CI checks - call it once and share across all checks.
 * @param workspaceSource The full workspace source directory
 * @param prismaGenerated Optional pre-generated Prisma client directory (avoids re-generating)
 * @returns Container with deps installed and Prisma client generated
 */
export function getPreparedWorkspace(workspaceSource: Directory, prismaGenerated?: Directory): Container {
  const base = installWorkspaceDeps(workspaceSource, true);

  if (prismaGenerated) {
    // Use pre-generated Prisma client
    return base.withDirectory("/workspace/packages/backend/generated", prismaGenerated);
  }

  // Generate Prisma client (fallback for standalone usage)
  return base.withWorkdir("/workspace/packages/backend").withExec(["bun", "run", "generate"]).withWorkdir("/workspace");
}

/**
 * Install workspace dependencies with optimal caching
 * This function is shared across all packages to maximize cache reuse
 * @param workspaceSource The full workspace source directory
 * @param installOpenssl Whether to install OpenSSL (required for backend/Prisma)
 * @returns The container with all workspace dependencies installed
 */
export function installWorkspaceDeps(workspaceSource: Directory, installOpenssl = false): Container {
  let container = getBunContainer();

  // Install system dependencies if needed (with APT cache for faster subsequent runs)
  if (installOpenssl) {
    container = container
      .withMountedCache("/var/cache/apt", dag.cacheVolume("apt-cache"))
      .withMountedCache("/var/lib/apt/lists", dag.cacheVolume("apt-lists"))
      .withExec(["apt", "update"])
      .withExec(["apt", "install", "-y", "openssl"]);
  }

  // Mount Bun install cache (persists across runs)
  container = container.withMountedCache("/root/.bun/install/cache", dag.cacheVolume("bun-install-cache"));

  // Set up workspace structure
  // Order matters for caching: mount config files first (change less often),
  // then dependencies (package.json, lockfile), then source code
  return (
    container
      .withWorkdir("/workspace")
      // Config files (rarely change - good cache layer)
      .withFile("/workspace/tsconfig.json", workspaceSource.file("tsconfig.json"))
      .withFile("/workspace/tsconfig.base.json", workspaceSource.file("tsconfig.base.json"))
      .withFile("/workspace/eslint.config.ts", workspaceSource.file("eslint.config.ts"))
      .withFile("/workspace/.jscpd.json", workspaceSource.file(".jscpd.json"))
      .withDirectory("/workspace/eslint-rules", workspaceSource.directory("eslint-rules"))
      // Dependency files (change occasionally - separate cache layer)
      .withFile("/workspace/package.json", workspaceSource.file("package.json"))
      .withFile("/workspace/bun.lock", workspaceSource.file("bun.lock"))
      // Patches directory (needed for bun patch to work)
      .withDirectory("/workspace/patches", workspaceSource.directory("patches"))
      // Scripts directory (for utility scripts)
      .withDirectory("/workspace/scripts", workspaceSource.directory("scripts"))
      // Package source code (changes frequently - mounted after deps)
      .withDirectory("/workspace/packages/backend", workspaceSource.directory("packages/backend"))
      .withDirectory("/workspace/packages/data", workspaceSource.directory("packages/data"))
      .withDirectory("/workspace/packages/report", workspaceSource.directory("packages/report"))
      .withDirectory("/workspace/packages/frontend", workspaceSource.directory("packages/frontend"))
      .withDirectory("/workspace/packages/desktop", workspaceSource.directory("packages/desktop"))
      // Install dependencies (will use cache if lockfile unchanged)
      .withExec(["bun", "install", "--frozen-lockfile"])
  );
}

/**
 * Get a workspace container using mounts instead of copies.
 * More performant for read-only CI checks (typecheck, lint, test) since mounts are faster.
 * Note: Files mounted this way are NOT included in the final container image.
 * Use installWorkspaceDeps() instead if you need files in the publishable image (e.g., backend Docker image).
 * @param workspaceSource The full workspace source directory
 * @param installOpenssl Whether to install OpenSSL (required for backend/Prisma)
 * @returns Container with deps installed using mounts for better performance
 */
export function getMountedWorkspace(workspaceSource: Directory, installOpenssl = false): Container {
  let container = getBunContainer();

  // Install system dependencies if needed (with APT cache for faster subsequent runs)
  if (installOpenssl) {
    container = container
      .withMountedCache("/var/cache/apt", dag.cacheVolume("apt-cache"))
      .withMountedCache("/var/lib/apt/lists", dag.cacheVolume("apt-lists"))
      .withExec(["apt", "update"])
      .withExec(["apt", "install", "-y", "openssl"]);
  }

  // Mount Bun install cache (persists across runs)
  container = container.withMountedCache("/root/.bun/install/cache", dag.cacheVolume("bun-install-cache"));

  // Set up workspace structure using MOUNTS (faster than copies for CI checks)
  // Order matters for caching: mount config files first (change less often),
  // then dependencies (package.json, lockfile), then source code
  return (
    container
      .withWorkdir("/workspace")
      // Config files (rarely change - good cache layer)
      .withMountedFile("/workspace/tsconfig.json", workspaceSource.file("tsconfig.json"))
      .withMountedFile("/workspace/tsconfig.base.json", workspaceSource.file("tsconfig.base.json"))
      .withMountedFile("/workspace/eslint.config.ts", workspaceSource.file("eslint.config.ts"))
      .withMountedFile("/workspace/.jscpd.json", workspaceSource.file(".jscpd.json"))
      .withMountedDirectory("/workspace/eslint-rules", workspaceSource.directory("eslint-rules"))
      // Dependency files (change occasionally - separate cache layer)
      .withMountedFile("/workspace/package.json", workspaceSource.file("package.json"))
      .withMountedFile("/workspace/bun.lock", workspaceSource.file("bun.lock"))
      // Patches directory (needed for bun patch to work)
      .withMountedDirectory("/workspace/patches", workspaceSource.directory("patches"))
      // Scripts directory (for utility scripts)
      .withMountedDirectory("/workspace/scripts", workspaceSource.directory("scripts"))
      // Package source code (changes frequently - mounted after deps)
      .withMountedDirectory("/workspace/packages/backend", workspaceSource.directory("packages/backend"))
      .withMountedDirectory("/workspace/packages/data", workspaceSource.directory("packages/data"))
      .withMountedDirectory("/workspace/packages/report", workspaceSource.directory("packages/report"))
      .withMountedDirectory("/workspace/packages/frontend", workspaceSource.directory("packages/frontend"))
      .withMountedDirectory("/workspace/packages/desktop", workspaceSource.directory("packages/desktop"))
      // Install dependencies (will use cache if lockfile unchanged)
      .withExec(["bun", "install", "--frozen-lockfile"])
  );
}

/**
 * Get a fully prepared workspace container using mounts, with Prisma generated.
 * More performant for CI checks than getPreparedWorkspace() since it uses mounts.
 * @param workspaceSource The full workspace source directory
 * @param prismaGenerated Optional pre-generated Prisma client directory (avoids re-generating)
 * @returns Container with deps installed and Prisma client generated
 */
export function getPreparedMountedWorkspace(workspaceSource: Directory, prismaGenerated?: Directory): Container {
  const base = getMountedWorkspace(workspaceSource, true);

  if (prismaGenerated) {
    // Use pre-generated Prisma client (mount it since this is a mounted workspace)
    return base.withMountedDirectory("/workspace/packages/backend/generated", prismaGenerated);
  }

  // Generate Prisma client (fallback for standalone usage)
  return base.withWorkdir("/workspace/packages/backend").withExec(["bun", "run", "generate"]).withWorkdir("/workspace");
}

/**
 * Get a Bun container with Node.js support (cached)
 * @param workspaceSource Optional workspace source directory to mount
 * @returns A Bun container with Node.js installed
 */
export function getBunNodeContainer(workspaceSource?: Directory): Container {
  // Cache the apt packages to speed up Node.js installation
  let container = dag
    .container()
    .from("oven/bun:latest")
    .withWorkdir("/workspace")
    .withMountedCache("/var/cache/apt", dag.cacheVolume("apt-cache"))
    .withMountedCache("/var/lib/apt/lists", dag.cacheVolume("apt-lists"))
    .withExec(["apt", "update"])
    .withExec(["apt", "install", "-y", "curl", "ca-certificates", "gnupg"])
    .withExec(["mkdir", "-p", "/etc/apt/keyrings"])
    .withExec([
      "sh",
      "-c",
      "curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg",
    ])
    .withExec([
      "sh",
      "-c",
      'echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list',
    ])
    .withExec(["apt", "update"])
    .withExec(["apt", "install", "-y", "nodejs"])
    .withExec(["npm", "install", "-g", "npm"]);

  // If workspace source is provided, mount it
  if (workspaceSource) {
    container = container
      .withMountedCache("/root/.bun/install/cache", dag.cacheVolume("bun-install-cache"))
      .withFile("/workspace/tsconfig.json", workspaceSource.file("tsconfig.json"))
      .withFile("/workspace/tsconfig.base.json", workspaceSource.file("tsconfig.base.json"))
      .withFile("/workspace/eslint.config.ts", workspaceSource.file("eslint.config.ts"))
      .withFile("/workspace/.jscpd.json", workspaceSource.file(".jscpd.json"))
      .withDirectory("/workspace/eslint-rules", workspaceSource.directory("eslint-rules"))
      .withFile("/workspace/package.json", workspaceSource.file("package.json"))
      .withFile("/workspace/bun.lock", workspaceSource.file("bun.lock"))
      .withDirectory("/workspace/patches", workspaceSource.directory("patches"))
      .withDirectory("/workspace/scripts", workspaceSource.directory("scripts"))
      .withDirectory("/workspace/packages/backend", workspaceSource.directory("packages/backend"))
      .withDirectory("/workspace/packages/data", workspaceSource.directory("packages/data"))
      .withDirectory("/workspace/packages/report", workspaceSource.directory("packages/report"))
      .withDirectory("/workspace/packages/frontend", workspaceSource.directory("packages/frontend"))
      .withDirectory("/workspace/packages/desktop", workspaceSource.directory("packages/desktop"));
  }

  return container;
}

/**
 * Get a system container (Ubuntu) with basic tools
 * @returns An Ubuntu container with basic tools
 */
export function getSystemContainer(): Container {
  return dag.container().from("ubuntu:jammy").withWorkdir("/workspace");
}

/**
 * Get a container with GitHub CLI installed
 * @returns A container with GitHub CLI for deployment tasks
 */
export function getGitHubContainer(): Container {
  const ghVersion = "2.63.2";
  return dag
    .container()
    .from("ubuntu:noble")
    .withMountedCache("/var/cache/apt", dag.cacheVolume("apt-cache"))
    .withMountedCache("/var/lib/apt/lists", dag.cacheVolume("apt-lists"))
    .withExec(["apt", "update"])
    .withExec(["apt", "install", "-y", "git", "curl"])
    .withExec([
      "sh",
      "-c",
      `curl -L -o ghcli.deb https://github.com/cli/cli/releases/download/v${ghVersion}/gh_${ghVersion}_linux_amd64.deb`,
    ])
    .withExec(["dpkg", "-i", "ghcli.deb"])
    .withExec(["rm", "ghcli.deb"])
    .withExec(["git", "config", "--global", "user.name", "scout-for-lol"])
    .withExec(["git", "config", "--global", "user.email", "github@sjer.red"])
    .withWorkdir("/workspace");
}
