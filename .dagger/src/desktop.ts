import type { Directory, Container } from "@dagger.io/dagger";
import { dag } from "@dagger.io/dagger";

type DesktopTarget = "linux" | "windows-gnu";

/**
 * Get a Rust container with Tauri dependencies
 * @returns A Rust container with system dependencies for Tauri
 */
export function getRustTauriContainer(): Container {
  return (
    dag
      .container()
      .from("rust:latest")
      .withWorkdir("/workspace")
      // Install system dependencies needed for Tauri on Linux
      .withMountedCache("/var/cache/apt", dag.cacheVolume("apt-cache-rust"))
      .withMountedCache("/var/lib/apt/lists", dag.cacheVolume("apt-lists-rust"))
      .withExec(["apt", "update"])
      .withExec([
        "apt",
        "install",
        "-y",
        "libwebkit2gtk-4.1-dev",
        "libgtk-3-dev",
        "libayatana-appindicator3-dev",
        "librsvg2-dev",
        "patchelf",
        "cmake",
        "pkg-config",
        "curl",
        "ca-certificates",
        "gnupg",
        "clang", // Required for mold linker
        "mold", // Modern linker - much faster than ld
      ])
      // Mount Cargo caches for faster builds
      // - registry: Downloaded crate sources and metadata
      // - git: Git dependencies
      .withMountedCache("/usr/local/cargo/registry", dag.cacheVolume("cargo-registry"))
      .withMountedCache("/usr/local/cargo/git", dag.cacheVolume("cargo-git"))
      // Cargo build optimizations via environment variables
      .withEnvVariable("CARGO_INCREMENTAL", "1") // Enable incremental compilation
      .withEnvVariable("CARGO_BUILD_JOBS", "4") // Parallel compilation jobs
      .withEnvVariable("CARGO_NET_GIT_FETCH_WITH_CLI", "false") // Faster git fetching
      .withEnvVariable("CARGO_REGISTRIES_CRATES_IO_PROTOCOL", "sparse") // Sparse index protocol
      // Use mold linker for faster linking on Linux (x86_64)
      .withEnvVariable("CARGO_TARGET_X86_64_UNKNOWN_LINUX_GNU_LINKER", "clang")
      .withEnvVariable("RUSTFLAGS", "-C link-arg=-fuse-ld=mold")
      // Install Tauri CLI for `cargo tauri build`
      .withExec(["cargo", "install", "tauri-cli", "--locked"])
  );
}

/**
 * Install Bun in a Rust container
 * @param container The Rust container to install Bun in
 * @returns The container with Bun installed
 */
export function installBunInRustContainer(container: Container): Container {
  return container
    .withExec(["sh", "-c", "curl -fsSL https://bun.sh/install | bash"])
    .withEnvVariable("PATH", "/root/.bun/bin:$PATH", { expand: true });
}

/**
 * Install dependencies for the desktop package
 * @param workspaceSource The full workspace source directory
 * @param target Which desktop target to prepare for (linux or Windows GNU cross-compile)
 * @returns The container with dependencies installed
 */
export function installDesktopDeps(workspaceSource: Directory, target: DesktopTarget = "linux"): Container {
  let container = getRustTauriContainer();

  // Install Bun for frontend dependencies
  container = installBunInRustContainer(container);

  // Mount Bun install cache
  container = container.withMountedCache("/root/.bun/install/cache", dag.cacheVolume("bun-install-cache"));

  if (target === "windows-gnu") {
    // Dependencies for cross-compiling Windows GNU target
    container = container
      .withExec(["apt", "install", "-y", "mingw-w64", "nsis", "zip"])
      .withExec(["sh", "-c", "echo '🔧 Installing Windows GNU target for cross-compilation...'"])
      // Install target for stable toolchain (rust-toolchain.toml uses stable)
      .withExec(["rustup", "target", "add", "x86_64-pc-windows-gnu", "--toolchain", "stable"])
      .withExec(["sh", "-c", "echo '✅ Windows GNU target installed'"]);
  }

  // Set up workspace structure - include all required files like base.ts does
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
      // Scripts directory (for utility scripts like check-suppressions)
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
 * Build the desktop frontend (Vite) and return the dist directory.
 * This can be shared across multiple desktop operations to avoid rebuilding.
 * @param workspaceSource The full workspace source directory
 * @returns The built frontend dist directory
 */
export function buildDesktopFrontend(workspaceSource: Directory): Directory {
  return installDesktopDeps(workspaceSource)
    .withWorkdir("/workspace/packages/desktop")
    .withExec(["sh", "-c", "echo '🏗️  Building desktop frontend (Vite)...'"])
    .withExec(["bunx", "vite", "build"])
    .withExec(["sh", "-c", "echo '✅ Desktop frontend built successfully'"])
    .directory("/workspace/packages/desktop/dist");
}

/**
 * Run Rust formatting check
 * @param workspaceSource The full workspace source directory
 * @returns The container with fmt check results
 */
export function checkDesktopRustFmt(workspaceSource: Directory): Container {
  return installDesktopDeps(workspaceSource)
    .withWorkdir("/workspace/packages/desktop/src-tauri")
    .withMountedCache("/workspace/packages/desktop/src-tauri/target", dag.cacheVolume("rust-target-linux"))
    .withExec(["sh", "-c", "echo '🎨 [CI] Running Rust formatting check for desktop...'"])
    .withExec(["cargo", "fmt", "--", "--check"])
    .withExec(["sh", "-c", "echo '✅ [CI] Rust formatting check passed!'"]);
}

/**
 * Run Rust linting with clippy
 * @param workspaceSource The full workspace source directory
 * @returns The container with clippy results
 */
export function checkDesktopRustClippy(workspaceSource: Directory): Container {
  return installDesktopDeps(workspaceSource)
    .withWorkdir("/workspace/packages/desktop/src-tauri")
    .withMountedCache("/workspace/packages/desktop/src-tauri/target", dag.cacheVolume("rust-target-linux"))
    .withExec(["sh", "-c", "echo '🔍 [CI] Running Rust clippy for desktop...'"])
    .withExec(["cargo", "clippy", "--all-targets", "--all-features", "--", "-D", "warnings"])
    .withExec(["sh", "-c", "echo '✅ [CI] Rust clippy passed!'"]);
}

/**
 * Run Rust tests
 * @param workspaceSource The full workspace source directory
 * @returns The container with test results
 */
export function checkDesktopRustTests(workspaceSource: Directory): Container {
  return installDesktopDeps(workspaceSource)
    .withWorkdir("/workspace/packages/desktop/src-tauri")
    .withMountedCache("/workspace/packages/desktop/src-tauri/target", dag.cacheVolume("rust-target-linux"))
    .withExec(["sh", "-c", "echo '🧪 [CI] Running Rust tests for desktop...'"])
    .withExec(["cargo", "test", "--verbose"])
    .withExec(["sh", "-c", "echo '✅ [CI] Rust tests passed!'"]);
}

/**
 * Run TypeScript type checking for desktop
 * @param workspaceSource The full workspace source directory
 * @returns The container with typecheck results
 */
export function checkDesktopTypeScript(workspaceSource: Directory): Container {
  return installDesktopDeps(workspaceSource)
    .withWorkdir("/workspace/packages/desktop")
    .withExec(["sh", "-c", "echo '🔍 [CI] Running TypeScript type checking for desktop...'"])
    .withExec(["bun", "run", "typecheck"])
    .withExec(["sh", "-c", "echo '✅ [CI] TypeScript type checking passed!'"]);
}

/**
 * Run ESLint for desktop
 * @param workspaceSource The full workspace source directory
 * @returns The container with lint results
 */
export function checkDesktopLint(workspaceSource: Directory): Container {
  return installDesktopDeps(workspaceSource)
    .withWorkdir("/workspace/packages/desktop")
    .withExec(["sh", "-c", "echo '🔍 [CI] Running ESLint for desktop...'"])
    .withExec(["bun", "run", "lint"])
    .withExec(["sh", "-c", "echo '✅ [CI] ESLint passed!'"]);
}

/**
 * Run all checks for desktop (TypeScript, Rust fmt, clippy, tests)
 * This runs TypeScript and Rust checks in PARALLEL for faster execution.
 * @param workspaceSource The full workspace source directory
 * @param frontendDist Optional pre-built frontend dist directory (avoids rebuilding)
 * @returns Promise that resolves when all checks pass
 */
export async function checkDesktopParallel(workspaceSource: Directory, frontendDist?: Directory): Promise<void> {
  // Get the base container with deps installed
  const baseContainer = installDesktopDeps(workspaceSource);

  // Build frontend if not provided (needed for Rust compilation)
  const frontend = frontendDist ?? buildDesktopFrontend(workspaceSource);

  // Container with frontend for Rust checks
  const containerWithFrontend = baseContainer
    .withDirectory("/workspace/packages/desktop/dist", frontend)
    .withMountedCache("/workspace/packages/desktop/src-tauri/target", dag.cacheVolume("rust-target-linux"));

  // Run TypeScript and Rust checks in PARALLEL
  await Promise.all([
    // TypeScript checks (don't need Rust)
    baseContainer
      .withWorkdir("/workspace/packages/desktop")
      .withExec(["sh", "-c", "echo '📋 [CI] Running TypeScript checks for desktop...'"])
      .withExec(["bun", "run", "typecheck"])
      .withExec(["bun", "run", "lint"])
      .withExec(["sh", "-c", "echo '✅ [CI] TypeScript checks passed!'"])
      .sync(),

    // Rust checks (need frontend built for Tauri)
    containerWithFrontend
      .withWorkdir("/workspace/packages/desktop/src-tauri")
      .withExec(["sh", "-c", "echo '📋 [CI] Running Rust checks for desktop...'"])
      .withExec(["cargo", "fmt", "--", "--check"])
      .withExec(["cargo", "clippy", "--all-targets", "--all-features", "--", "-D", "warnings"])
      .withExec(["cargo", "test", "--verbose"])
      .withExec(["sh", "-c", "echo '✅ [CI] Rust checks passed!'"])
      .sync(),
  ]);
}

/**
 * Run all checks for desktop (TypeScript, Rust fmt, clippy, tests)
 * Sequential version that returns a container (for backwards compatibility).
 * @param workspaceSource The full workspace source directory
 * @param frontendDist Optional pre-built frontend dist directory (avoids rebuilding)
 * @returns The container with all check results
 */
export function checkDesktop(workspaceSource: Directory, frontendDist?: Directory): Container {
  let container = installDesktopDeps(workspaceSource)
    .withWorkdir("/workspace/packages/desktop")
    .withMountedCache("/workspace/packages/desktop/src-tauri/target", dag.cacheVolume("rust-target-linux"))
    .withExec(["sh", "-c", "echo '🔍 [CI] Running all checks for desktop package...'"])
    .withExec(["sh", "-c", "echo '📋 TypeScript checks...'"])
    .withExec(["bun", "run", "typecheck"])
    .withExec(["bun", "run", "lint"]);

  // Use pre-built frontend if provided, otherwise build it
  if (frontendDist) {
    container = container
      .withDirectory("/workspace/packages/desktop/dist", frontendDist)
      .withExec(["sh", "-c", "echo '📦 Using pre-built frontend...'"]);
  } else {
    container = container
      .withExec(["sh", "-c", "echo '🏗️  Building frontend for Rust compilation...'"])
      .withExec(["bun", "run", "build:frontend"]);
  }

  return container
    .withExec(["sh", "-c", "echo '📋 Rust checks...'"])
    .withWorkdir("/workspace/packages/desktop/src-tauri")
    .withExec(["cargo", "fmt", "--", "--check"])
    .withExec(["cargo", "clippy", "--all-targets", "--all-features", "--", "-D", "warnings"])
    .withExec(["cargo", "test", "--verbose"])
    .withExec(["sh", "-c", "echo '✅ [CI] All desktop checks completed successfully!'"]);
}

/**
 * Build the desktop application for Linux
 * @param workspaceSource The full workspace source directory
 * @param version The version tag
 * @param frontendDist Optional pre-built frontend dist directory (avoids rebuilding)
 * @returns The container with built artifacts
 */
export function buildDesktopLinux(workspaceSource: Directory, version: string, frontendDist?: Directory): Container {
  let container = installDesktopDeps(workspaceSource)
    .withEnvVariable("VERSION", version)
    .withWorkdir("/workspace/packages/desktop")
    .withMountedCache("/workspace/packages/desktop/src-tauri/target", dag.cacheVolume("rust-target-linux"))
    .withExec(["sh", "-c", "echo '🏗️  [CI] Building desktop application for Linux...'"]);

  // Use pre-built frontend if provided
  if (frontendDist) {
    container = container
      .withDirectory("/workspace/packages/desktop/dist", frontendDist)
      .withExec(["sh", "-c", "echo '📦 Using pre-built frontend, running Tauri build...'"])
      .withWorkdir("/workspace/packages/desktop/src-tauri")
      .withExec(["cargo", "tauri", "build"]);
  } else {
    // Build everything (frontend + Tauri)
    container = container.withExec(["bun", "run", "build"]);
  }

  // Copy artifacts from mounted cache to permanent location in container filesystem
  // This is necessary because withMountedCache is ephemeral and not accessible
  // when the container is later used to extract directories
  return container
    .withExec(["sh", "-c", "echo '📦 Copying artifacts from cache to permanent location...'"])
    .withExec([
      "sh",
      "-c",
      "mkdir -p /artifacts && cp -r /workspace/packages/desktop/src-tauri/target/release/bundle /artifacts/",
    ])
    .withExec(["sh", "-c", "echo '✅ [CI] Desktop build completed!'"]);
}

/**
 * Build the desktop application for Windows (x86_64-pc-windows-gnu)
 * @param workspaceSource The full workspace source directory
 * @param version The version tag
 * @param frontendDist Optional pre-built frontend dist directory (avoids rebuilding)
 * @returns The container with built artifacts
 */
export function buildDesktopWindowsGnu(
  workspaceSource: Directory,
  version: string,
  frontendDist?: Directory,
): Container {
  let container = installDesktopDeps(workspaceSource, "windows-gnu")
    .withEnvVariable("VERSION", version)
    .withEnvVariable("CARGO_TARGET_DIR", "/workspace/packages/desktop/src-tauri/target")
    .withEnvVariable("RUSTUP_HOME", "/usr/local/rustup")
    .withEnvVariable("CARGO_HOME", "/usr/local/cargo")
    .withEnvVariable("PATH", "/usr/local/cargo/bin:/usr/local/rustup/bin:$PATH", { expand: true })
    .withWorkdir("/workspace/packages/desktop")
    .withMountedCache("/workspace/packages/desktop/src-tauri/target", dag.cacheVolume("rust-target-windows-gnu"))
    .withExec(["sh", "-c", "echo '🏗️  [CI] Building desktop application for Windows (x86_64-pc-windows-gnu)...'"]);

  // Use pre-built frontend if provided, otherwise build it
  if (frontendDist) {
    container = container
      .withDirectory("/workspace/packages/desktop/dist", frontendDist)
      .withExec(["sh", "-c", "echo '📦 Using pre-built frontend...'"]);
  } else {
    container = container
      .withExec(["sh", "-c", "echo '📦 Building frontend first...'"])
      .withExec(["bunx", "vite", "build"]);
  }

  // Copy artifacts from mounted cache to permanent location in container filesystem
  // This is necessary because withMountedCache is ephemeral and not accessible
  // when the container is later used to extract directories
  return container
    .withExec(["sh", "-c", "echo '🦀 Building Rust application with Cargo...'"])
    .withWorkdir("/workspace/packages/desktop/src-tauri")
    .withExec(["cargo", "build", "--release", "--target", "x86_64-pc-windows-gnu"])
    .withExec([
      "sh",
      "-c",
      "echo '✅ Binary built successfully at target/x86_64-pc-windows-gnu/release/scout-for-lol-desktop.exe'",
    ])
    .withExec(["sh", "-c", "ls -lh target/x86_64-pc-windows-gnu/release/scout-for-lol-desktop.exe"])
    .withExec(["sh", "-c", "echo '📦 Copying artifacts from cache to permanent location...'"])
    .withExec([
      "sh",
      "-c",
      "mkdir -p /artifacts && cp target/x86_64-pc-windows-gnu/release/scout-for-lol-desktop.exe /artifacts/",
    ])
    .withWorkdir("/workspace/packages/desktop")
    .withExec(["sh", "-c", "echo '✅ [CI] Desktop Windows (GNU) build completed!'"]);
}

/**
 * Export desktop Linux build artifacts
 * @param workspaceSource The full workspace source directory
 * @param version The version tag
 * @returns The directory containing built artifacts
 */
export function getDesktopLinuxArtifacts(workspaceSource: Directory, version: string): Directory {
  // Artifacts are copied to /artifacts/bundle during build to persist beyond the cache mount
  return buildDesktopLinux(workspaceSource, version).directory("/artifacts/bundle");
}

/**
 * Export desktop Windows (x86_64-pc-windows-gnu) build artifacts
 * @param workspaceSource The full workspace source directory
 * @param version The version tag
 * @returns The directory containing built artifacts (exe file)
 */
export function getDesktopWindowsArtifacts(workspaceSource: Directory, version: string): Directory {
  // Artifacts are copied to /artifacts during build to persist beyond the cache mount
  return buildDesktopWindowsGnu(workspaceSource, version).directory("/artifacts");
}
