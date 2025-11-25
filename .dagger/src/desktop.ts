import type { Directory, Container } from "@dagger.io/dagger";
import { dag } from "@dagger.io/dagger";

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
        "curl",
        "ca-certificates",
        "gnupg",
      ])
      // Mount Cargo cache for faster builds
      .withMountedCache("/usr/local/cargo/registry", dag.cacheVolume("cargo-registry"))
      .withMountedCache("/usr/local/cargo/git", dag.cacheVolume("cargo-git"))
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
 * @returns The container with dependencies installed
 */
export function installDesktopDeps(workspaceSource: Directory): Container {
  let container = getRustTauriContainer();

  // Install Bun for frontend dependencies
  container = installBunInRustContainer(container);

  // Mount Bun install cache
  container = container.withMountedCache("/root/.bun/install/cache", dag.cacheVolume("bun-install-cache"));

  // Set up workspace structure
  return (
    container
      .withWorkdir("/workspace")
      // Root workspace files
      .withFile("/workspace/package.json", workspaceSource.file("package.json"))
      .withFile("/workspace/bun.lock", workspaceSource.file("bun.lock"))
      .withFile("/workspace/tsconfig.json", workspaceSource.file("tsconfig.json"))
      .withFile("/workspace/tsconfig.base.json", workspaceSource.file("tsconfig.base.json"))
      .withFile("/workspace/eslint.config.ts", workspaceSource.file("eslint.config.ts"))
      .withDirectory("/workspace/eslint-rules", workspaceSource.directory("eslint-rules"))
      .withDirectory("/workspace/patches", workspaceSource.directory("patches"))
      // Desktop package
      .withDirectory("/workspace/packages/desktop", workspaceSource.directory("packages/desktop"))
      // Data package (dependency)
      .withDirectory("/workspace/packages/data", workspaceSource.directory("packages/data"))
      // Install dependencies
      .withExec(["bun", "install", "--frozen-lockfile"])
  );
}

/**
 * Run Rust formatting check
 * @param workspaceSource The full workspace source directory
 * @returns The container with fmt check results
 */
export function checkDesktopRustFmt(workspaceSource: Directory): Container {
  return installDesktopDeps(workspaceSource)
    .withWorkdir("/workspace/packages/desktop/src-tauri")
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
 * @param workspaceSource The full workspace source directory
 * @returns The container with all check results
 */
export function checkDesktop(workspaceSource: Directory): Container {
  return installDesktopDeps(workspaceSource)
    .withWorkdir("/workspace/packages/desktop")
    .withExec(["sh", "-c", "echo '🔍 [CI] Running all checks for desktop package...'"])
    .withExec(["sh", "-c", "echo '📋 TypeScript checks...'"])
    .withExec(["bun", "run", "typecheck"])
    .withExec(["bun", "run", "lint"])
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
 * @returns The container with built artifacts
 */
export function buildDesktopLinux(workspaceSource: Directory, version: string): Container {
  return installDesktopDeps(workspaceSource)
    .withEnvVariable("VERSION", version)
    .withWorkdir("/workspace/packages/desktop")
    .withExec(["sh", "-c", "echo '🏗️  [CI] Building desktop application for Linux...'"])
    .withExec(["bun", "run", "build"])
    .withExec(["sh", "-c", "echo '✅ [CI] Desktop build completed!'"]);
}

/**
 * Export desktop Linux build artifacts
 * @param workspaceSource The full workspace source directory
 * @param version The version tag
 * @returns The directory containing built artifacts
 */
export function getDesktopLinuxArtifacts(workspaceSource: Directory, version: string): Directory {
  return buildDesktopLinux(workspaceSource, version).directory(
    "/workspace/packages/desktop/src-tauri/target/release/bundle",
  );
}
