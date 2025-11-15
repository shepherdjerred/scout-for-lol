import { dag, Container, Directory } from "@dagger.io/dagger";

/**
 * Get a base Bun container
 * @returns A Bun container with basic setup
 */
export function getBunContainer(): Container {
  return dag.container().from("oven/bun:latest").withWorkdir("/workspace");
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

  // Install system dependencies if needed (cached by layer)
  if (installOpenssl) {
    container = container.withExec(["apt", "update"]).withExec(["apt", "install", "-y", "openssl"]);
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
      .withDirectory("/workspace/eslint-rules", workspaceSource.directory("eslint-rules"))
      // Dependency files (change occasionally - separate cache layer)
      .withFile("/workspace/package.json", workspaceSource.file("package.json"))
      .withFile("/workspace/bun.lock", workspaceSource.file("bun.lock"))
      // Patches directory (needed for bun patch to work)
      .withDirectory("/workspace/patches", workspaceSource.directory("patches"))
      // Package source code (changes frequently - mounted after deps)
      .withDirectory("/workspace/packages/backend", workspaceSource.directory("packages/backend"))
      .withDirectory("/workspace/packages/data", workspaceSource.directory("packages/data"))
      .withDirectory("/workspace/packages/report", workspaceSource.directory("packages/report"))
      .withDirectory("/workspace/packages/frontend", workspaceSource.directory("packages/frontend"))
      // Install dependencies (will use cache if lockfile unchanged)
      .withExec(["bun", "install", "--frozen-lockfile"])
  );
}

/**
 * Get a Bun container with Node.js support (cached)
 * @returns A Bun container with Node.js installed
 */
export function getBunNodeContainer(): Container {
  // Cache the apt packages to speed up Node.js installation
  return dag
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
