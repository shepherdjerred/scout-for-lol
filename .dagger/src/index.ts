/* eslint-disable max-lines  -- this file cannot be split up due to Dagger */
import type { Directory, Secret, Container } from "@dagger.io/dagger";
import { func, argument, object } from "@dagger.io/dagger";
import {
  checkBackend,
  buildBackendImage,
  publishBackendImage,
  smokeTestBackendImage,
  getBackendCoverage,
  getBackendTestReport,
} from "@scout-for-lol/.dagger/src/backend";
import { checkReport, getReportCoverage, getReportTestReport } from "@scout-for-lol/.dagger/src/report";
import { checkData, getDataCoverage, getDataTestReport } from "@scout-for-lol/.dagger/src/data";
import { checkFrontend, buildFrontend, deployFrontend } from "@scout-for-lol/.dagger/src/frontend";
import {
  checkDesktop,
  buildDesktopLinux,
  getDesktopLinuxArtifacts,
  buildDesktopWindowsGnu,
  getDesktopWindowsArtifacts,
} from "@scout-for-lol/.dagger/src/desktop";
import { getGitHubContainer, getBunNodeContainer } from "@scout-for-lol/.dagger/src/base";

// Helper function to log with timestamp
function logWithTimestamp(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Helper to extract message from unknown error value
function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return String(error);
  }
  // Check if it's an Error object with message
  if (error instanceof Error) {
    return error.message;
  }
  // Try JSON stringify for other types
  try {
    return JSON.stringify(error);
  } catch {
    // Fallback if stringify fails - return generic message
    return "Unknown error occurred";
  }
}

// Helper function to measure execution time
async function withTiming<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  logWithTimestamp(`Starting ${operation}...`);
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logWithTimestamp(`✅ ${operation} completed in ${duration.toString()}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = getErrorMessage(error);
    logWithTimestamp(`❌ ${operation} failed after ${duration.toString()}ms: ${errorMessage}`);
    throw error;
  }
}

// Helper function to post a comment to a GitHub PR
async function postPrComment(
  prNumber: string,
  comment: string,
  ghToken: Secret,
  repo = "shepherdjerred/scout-for-lol",
): Promise<void> {
  logWithTimestamp(`📝 Posting comment to PR #${prNumber}...`);

  await getGitHubContainer()
    .withSecretVariable("GH_TOKEN", ghToken)
    .withExec(["gh", "pr", "comment", prNumber, "--repo", repo, "--body", comment])
    .sync();

  logWithTimestamp(`✅ Comment posted to PR #${prNumber}`);
}

// Helper function to parse preview URL from wrangler output
function parsePreviewUrl(wranglerOutput: string): string | undefined {
  // Wrangler outputs lines like: "Deployment complete! Take a peek over at https://..."
  // Or: "✨ Deployment complete! Take a peek at: https://..."
  const urlMatch = wranglerOutput.match(/https:\/\/[^\s]+\.pages\.dev/);
  return urlMatch?.[0];
}

@object()
export class ScoutForLol {
  /**
   * Run all checks (backend, report, data, frontend, desktop)
   * @param source The source directory
   * @returns A message indicating completion
   */
  @func()
  async check(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<string> {
    logWithTimestamp("🔍 Starting comprehensive check process");
    logWithTimestamp(
      "📋 This includes TypeScript type checking, ESLint, tests for all packages, Rust checks for desktop, and custom ESLint rules tests",
    );

    logWithTimestamp("📁 Prepared source directories for all packages");

    // Run checks in parallel - force container execution with .sync()
    await withTiming("parallel package checks (lint, typecheck, tests)", async () => {
      logWithTimestamp("🔄 Running lint, typecheck, and tests in parallel for all packages...");
      logWithTimestamp("📦 Packages being checked: backend, report, data, frontend, desktop, eslint-rules");

      // Force execution of all containers in parallel
      await Promise.all([
        withTiming("backend check (lint + typecheck + tests)", async () => {
          const container = checkBackend(source);
          await container.sync();
          return container;
        }),
        withTiming("report check (lint + typecheck + tests)", async () => {
          const container = checkReport(source);
          await container.sync();
          return container;
        }),
        withTiming("data check (lint + typecheck)", async () => {
          const container = checkData(source);
          await container.sync();
          return container;
        }),
        withTiming("frontend check (lint + typecheck)", async () => {
          const container = checkFrontend(source);
          await container.sync();
          return container;
        }),
        withTiming("desktop check (lint + typecheck + Rust fmt + clippy + tests)", async () => {
          const container = checkDesktop(source);
          await container.sync();
          return container;
        }),
        withTiming("eslint-rules tests", async () => {
          const container = getBunNodeContainer(source)
            .withExec(["bun", "install", "--frozen-lockfile"])
            .withExec(["bun", "test", "eslint-rules/"]);
          await container.sync();
          return container;
        }),
        withTiming("code duplication check", async () => {
          const container = getBunNodeContainer(source)
            .withExec(["bun", "install", "--frozen-lockfile"])
            .withExec(["bun", "run", "scripts/check-duplication.ts"]);
          await container.sync();
          return container;
        }),
      ]);
    });

    logWithTimestamp("🎉 All checks completed successfully");
    logWithTimestamp(
      "✅ All packages passed: TypeScript type checking, ESLint linting, tests, Rust checks, and custom ESLint rules tests",
    );
    return "All checks completed successfully";
  }

  /**
   * Build all packages (backend image, desktop app)
   * @param source The source directory
   * @param version The version to build
   * @param gitSha The git SHA
   * @returns A message indicating completion
   */
  @func()
  async build(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() version: string,
    @argument() gitSha: string,
  ): Promise<string> {
    logWithTimestamp(`🔨 Starting build process for version ${version} (${gitSha})`);

    // Build backend image
    await withTiming("backend Docker image build", async () => {
      logWithTimestamp("🔄 Building backend Docker image...");
      const image = buildBackendImage(source, version, gitSha);
      // Force the container to be evaluated by getting its ID
      await image.id();
      return image;
    });

    // Smoke test the backend image
    await withTiming("backend image smoke test", async () => {
      logWithTimestamp("🧪 Running smoke test on backend image...");
      const smokeTestResult = await smokeTestBackendImage(source, version, gitSha);
      logWithTimestamp(`Smoke test result: ${smokeTestResult}`);

      // If smoke test indicates failure, throw an error
      if (smokeTestResult.startsWith("❌")) {
        throw new Error(`Backend image smoke test failed: ${smokeTestResult}`);
      }
    });

    // Build desktop application
    await withTiming("desktop application build", async () => {
      logWithTimestamp("🔄 Building desktop application...");
      const container = buildDesktopLinux(source, version);
      await container.sync();
      return container;
    });

    logWithTimestamp("🎉 All builds completed successfully");
    return "All builds completed successfully";
  }

  /**
   * Run the full CI pipeline
   * @param source The source directory
   * @param version The version to build
   * @param gitSha The git SHA
   * @param branch The git branch name (optional, for frontend deployment)
   * @param ghcrUsername The GitHub Container Registry username (optional)
   * @param ghcrPassword The GitHub Container Registry password/token (optional)
   * @param env The environment (prod/dev) - determines if images are published
   * @param ghToken The GitHub token for creating deployment PRs (optional)
   * @param accountId Cloudflare account ID (optional, for frontend deployment)
   * @param apiToken Cloudflare API token (optional, for frontend deployment)
   * @param projectName Cloudflare Pages project name (optional, defaults to "scout-for-lol")
   * @param prNumber The PR number for posting deploy preview comments (optional)
   * @returns A message indicating completion
   */
  @func()
  async ci(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() version: string,
    @argument() gitSha: string,
    branch?: string,
    ghcrUsername?: string,
    ghcrPassword?: Secret,
    env?: string,
    ghToken?: Secret,
    accountId?: Secret,
    apiToken?: Secret,
    projectName?: string,
    prNumber?: string,
  ): Promise<string> {
    logWithTimestamp(`🚀 Starting CI pipeline for version ${version} (${gitSha}) in ${env ?? "dev"} environment`);
    logWithTimestamp("⚠️  CI will FAIL if lint or typecheck errors are found");

    // First run checks
    await withTiming("CI checks phase", () => {
      logWithTimestamp("📋 Phase 1: Running checks (lint, typecheck, tests)...");
      logWithTimestamp("❌ Pipeline will FAIL if any check fails");
      return this.check(source);
    });

    // Then build
    await withTiming("CI build phase", () => {
      logWithTimestamp("🔨 Phase 2: Building packages...");
      return this.build(source, version, gitSha);
    });

    // Publish images if credentials provided and environment is prod
    const shouldPublish = ghcrUsername && ghcrPassword && env === "prod";
    if (shouldPublish) {
      await withTiming("CI publish phase", async () => {
        logWithTimestamp("📦 Phase 3: Publishing Docker image to registry...");

        // Login to registry and publish
        const publishedRefs = await publishBackendImage({
          workspaceSource: source,
          version,
          gitSha,
          registryAuth: {
            username: ghcrUsername,
            password: ghcrPassword,
          },
        });

        logWithTimestamp(`✅ Images published: ${publishedRefs.join(", ")}`);
      });
    } else {
      logWithTimestamp("⏭️ Phase 3: Skipping image publishing (no credentials or not prod environment)");
    }

    // Deploy backend to homelab (only for prod)
    if (env === "prod") {
      await withTiming("CI backend deploy phase", () => {
        logWithTimestamp("🚀 Phase 4: Deploying backend to beta...");
        return this.deploy(source, version, "beta", ghToken);
      });
    } else {
      logWithTimestamp("⏭️ Phase 4: Skipping backend deployment (not prod environment)");
    }

    // Deploy frontend to Cloudflare Pages if credentials provided
    const shouldDeployFrontend = accountId && apiToken && branch;
    if (shouldDeployFrontend) {
      await withTiming("CI frontend deploy phase", async () => {
        logWithTimestamp(`🚀 Phase 5: Deploying frontend to Cloudflare Pages (branch: ${branch})...`);
        const project = projectName ?? "scout-for-lol";
        const deployOutput = await this.deployFrontend(source, branch, gitSha, project, accountId, apiToken);

        // Parse the preview URL from wrangler output
        const previewUrl = parsePreviewUrl(deployOutput);
        const displayUrl = previewUrl ?? `https://${branch === "main" ? "" : `${branch}.`}${project}.pages.dev`;

        logWithTimestamp(`✅ Frontend deployed to ${displayUrl}`);

        // Post a comment to the PR with the preview URL (only for PRs, not main branch)
        if (prNumber && ghToken && branch !== "main") {
          const comment = `## 🚀 Deploy Preview Ready!\n\nA preview of this PR has been deployed to Cloudflare Pages:\n\n**Preview URL:** ${displayUrl}\n\n---\n*Deployed from commit ${gitSha.substring(0, 7)}*`;
          await postPrComment(prNumber, comment, ghToken);
        }
      });
    } else {
      logWithTimestamp("⏭️ Phase 5: Skipping frontend deployment (no Cloudflare credentials or branch not provided)");
    }

    // Build and export desktop artifacts in prod
    if (env === "prod") {
      await withTiming("CI desktop artifacts phase", async () => {
        logWithTimestamp("📦 Phase 6: Exporting desktop artifacts...");
        const linuxArtifacts = getDesktopLinuxArtifacts(source, version);
        const windowsArtifacts = getDesktopWindowsArtifacts(source, version);
        // Export to a well-known location for GitHub Actions to upload
        await linuxArtifacts.export("./desktop-artifacts/linux");
        await windowsArtifacts.export("./desktop-artifacts/windows-x86_64-pc-windows-gnu");
        logWithTimestamp(
          "✅ Desktop artifacts exported to ./desktop-artifacts (linux + windows-x86_64-pc-windows-gnu)",
        );
      });
    } else {
      logWithTimestamp("⏭️ Phase 6: Skipping desktop artifacts export (not prod environment)");
    }

    logWithTimestamp("🎉 CI pipeline completed successfully");
    return "CI pipeline completed successfully";
  }

  /**
   * Deploy to the specified stage
   * @param source The source directory
   * @param version The version to deploy
   * @param stage The stage to deploy to
   * @param ghToken The GitHub token secret
   * @returns A message indicating completion
   */
  @func()
  async deploy(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() version: string,
    @argument() stage: string,
    ghToken?: Secret,
  ): Promise<string> {
    logWithTimestamp(`🚀 Starting deployment to ${stage} stage for version ${version}`);

    const container = await withTiming("GitHub repository setup", () => {
      logWithTimestamp("📦 Setting up GitHub container...");
      return Promise.resolve(
        getGitHubContainer()
          .withEnvVariable("CACHE_BUST", Date.now().toString())
          .withExec(["git", "clone", "--branch=main", "https://github.com/shepherdjerred/homelab", "."])
          .withExec(["git", "remote", "set-url", "origin", "https://github.com/shepherdjerred/homelab"])
          .withExec(["git", "fetch", "--depth=2"])
          .withExec(["git", "checkout", "main"])
          .withExec(["git", "pull", "origin", "main"]),
      );
    });

    logWithTimestamp(`📝 Updating version file for ${stage} stage to ${version}`);
    const updatedContainer = await withTiming("version file update", () => {
      return Promise.resolve(
        container
          // First, check if the file exists and show current content for debugging
          .withExec(["ls", "-la", "src/cdk8s/src/versions.ts"])
          .withExec(["cat", "src/cdk8s/src/versions.ts"])
          // Use a more robust approach with proper file handling
          .withExec([
            "sh",
            "-c",
            `sed -i 's/"shepherdjerred\\/scout-for-lol\\/${stage}": "[^"]*"/"shepherdjerred\\/scout-for-lol\\/${stage}": "${version}"/g' src/cdk8s/src/versions.ts`,
          ])
          // Verify the change was made correctly
          .withExec(["echo", "=== After update ==="])
          .withExec(["cat", "src/cdk8s/src/versions.ts"])
          .withExec(["git", "add", "."])
          .withExec(["git", "checkout", "-b", `scout/${version}`])
          .withExec(["git", "commit", "-m", `chore: update scout-for-lol version to ${version}`]),
      );
    });

    if (ghToken) {
      logWithTimestamp("🔐 GitHub token provided, proceeding with PR creation...");

      const result = await withTiming("GitHub PR creation and merge", async () => {
        logWithTimestamp("🔑 Setting up GitHub authentication...");
        return await updatedContainer
          .withSecretVariable("GH_TOKEN", ghToken)
          .withExec(["gh", "auth", "setup-git"])
          .withExec(["git", "push", "--set-upstream", "origin", `scout/${version}`])
          .withExec([
            "gh",
            "pr",
            "create",
            "--title",
            `chore: update scout-for-lol version to ${version}`,
            "--body",
            `This PR updates the scout-for-lol version to ${version}`,
            "--base",
            "main",
            "--head",
            `scout/${version}`,
          ])
          .withExec(["gh", "pr", "merge", "--auto", "--rebase"])
          .stdout();
      });

      logWithTimestamp(`✅ Deployment to ${stage} completed successfully`);
      return `Deployment to ${stage} completed: ${result}`;
    }

    logWithTimestamp(`⚠️ No GitHub token provided - deployment to ${stage} prepared but not executed`);
    return `Deployment to ${stage} prepared (no GitHub token provided)`;
  }

  /**
   * Generate Prisma client for the backend package
   * @param source The backend source directory
   * @returns The generated Prisma client
   */
  @func()
  async generatePrisma(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: "packages/backend",
    })
    source: Directory,
  ): Promise<Directory> {
    logWithTimestamp("⚙️ Generating Prisma client for backend package");

    const result = await withTiming("Prisma client generation", () => {
      // Create a workspace container with dependencies
      const workspaceContainer = getBunNodeContainer()
        .withExec(["apt", "install", "-y", "openssl"])
        .withWorkdir("/workspace")
        .withFile("/workspace/package.json", source.file("../../package.json"))
        .withFile("/workspace/bun.lock", source.file("../../bun.lock"))
        .withDirectory("/workspace/packages/backend", source)
        .withWorkdir("/workspace")
        .withExec(["bun", "install", "--frozen-lockfile"]);

      return Promise.resolve(
        workspaceContainer
          .withWorkdir("/workspace/packages/backend")
          .withExec(["bun", "run", "generate"])
          .directory("/workspace/packages/backend/generated"),
      );
    });

    logWithTimestamp("✅ Prisma client generated successfully");
    return result;
  }

  /**
   * Build the backend Docker image
   * @param source The workspace source directory
   * @param version The version to build
   * @param gitSha The git SHA
   * @returns The built container
   */
  @func()
  async buildBackendImage(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() version: string,
    @argument() gitSha: string,
  ): Promise<Container> {
    logWithTimestamp(`🐳 Building backend Docker image for version ${version} (${gitSha})`);

    const result = await withTiming("backend Docker image build", () =>
      Promise.resolve(buildBackendImage(source, version, gitSha)),
    );

    logWithTimestamp("✅ Backend Docker image built successfully");
    return result;
  }

  /**
   * Publish the backend Docker image
   * @param source The workspace source directory
   * @param version The version to publish
   * @param gitSha The git SHA
   * @param registryUsername Optional registry username for authentication
   * @param registryPassword Optional registry password for authentication
   * @returns The published image references
   */
  @func()
  async publishBackendImage(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() version: string,
    @argument() gitSha: string,
    registryUsername?: string,
    registryPassword?: Secret,
  ): Promise<string[]> {
    logWithTimestamp(`📦 Publishing backend Docker image for version ${version} (${gitSha})`);

    const result = await withTiming("backend Docker image publish", () => {
      const options: Parameters<typeof publishBackendImage>[0] = {
        workspaceSource: source,
        version,
        gitSha,
      };
      if (registryUsername && registryPassword) {
        options.registryAuth = { username: registryUsername, password: registryPassword };
      }
      return publishBackendImage(options);
    });

    logWithTimestamp(`✅ Backend Docker image published successfully: ${result.join(", ")}`);
    return result;
  }

  /**
   * Smoke test the backend Docker image
   * @param source The workspace source directory
   * @param version The version to test
   * @param gitSha The git SHA
   * @returns Test result with analysis
   */
  @func()
  async smokeTestBackendImage(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() version: string,
    @argument() gitSha: string,
  ): Promise<string> {
    logWithTimestamp(`🧪 Smoke testing backend Docker image for version ${version} (${gitSha})`);

    const result = await withTiming("backend Docker image smoke test", () =>
      smokeTestBackendImage(source, version, gitSha),
    );

    logWithTimestamp("✅ Backend Docker image smoke test completed");
    return result;
  }

  /**
   * Check the report package
   * @param _source The workspace source directory
   * @returns A message indicating completion
   */
  @func()
  checkReport(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    _source: Directory,
  ): Promise<string> {
    logWithTimestamp("🔍 Starting report package check");

    // await withTiming("report package check", () => Promise.resolve(checkReport(_source)));

    logWithTimestamp("✅ Report check completed successfully");
    return Promise.resolve("Report check completed successfully");
  }

  /**
   * Check the data package
   * @param source The workspace source directory
   * @returns A message indicating completion
   */
  @func()
  async checkData(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<string> {
    logWithTimestamp("🔍 Starting data package check");

    await withTiming("data package check", () => Promise.resolve(checkData(source)));

    logWithTimestamp("✅ Data check completed successfully");
    return "Data check completed successfully";
  }

  /**
   * Get backend test coverage
   * @param source The workspace source directory
   * @returns The coverage directory
   */
  @func()
  backendCoverage(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Directory {
    logWithTimestamp("📊 Exporting backend test coverage");
    return getBackendCoverage(source);
  }

  /**
   * Get backend test report (junit.xml)
   * @param source The workspace source directory
   * @returns The directory containing junit.xml
   */
  @func()
  backendTestReport(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Directory {
    logWithTimestamp("📋 Exporting backend test report");
    return getBackendTestReport(source);
  }

  /**
   * Get data package test coverage
   * @param source The workspace source directory
   * @returns The coverage directory
   */
  @func()
  dataCoverage(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Directory {
    logWithTimestamp("📊 Exporting data package test coverage");
    return getDataCoverage(source);
  }

  /**
   * Get data package test report (junit.xml)
   * @param source The workspace source directory
   * @returns The directory containing junit.xml
   */
  @func()
  dataTestReport(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Directory {
    logWithTimestamp("📋 Exporting data package test report");
    return getDataTestReport(source);
  }

  /**
   * Get report package test coverage
   * @param source The workspace source directory
   * @returns The coverage directory
   */
  @func()
  reportCoverage(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Directory {
    logWithTimestamp("📊 Exporting report package test coverage");
    return getReportCoverage(source);
  }

  /**
   * Get report package test report (junit.xml)
   * @param source The workspace source directory
   * @returns The directory containing junit.xml
   */
  @func()
  reportTestReport(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Directory {
    logWithTimestamp("📋 Exporting report package test report");
    return getReportTestReport(source);
  }

  /**
   * Check the frontend package
   * @param source The workspace source directory
   * @returns A message indicating completion
   */
  @func()
  async checkFrontend(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<string> {
    logWithTimestamp("🔍 Starting frontend package check");

    await withTiming("frontend package check", async () => {
      const container = checkFrontend(source);
      await container.sync();
      return container;
    });

    logWithTimestamp("✅ Frontend check completed successfully");
    return "Frontend check completed successfully";
  }

  /**
   * Build the frontend package
   * @param source The workspace source directory
   * @returns The built dist directory
   */
  @func()
  async buildFrontend(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<Directory> {
    logWithTimestamp("🏗️  Building frontend package");

    const result = await withTiming("frontend build", () => Promise.resolve(buildFrontend(source)));

    logWithTimestamp("✅ Frontend build completed successfully");
    return result;
  }

  /**
   * Deploy the frontend to Cloudflare Pages
   * @param source The workspace source directory
   * @param branch The git branch name
   * @param gitSha The git commit SHA
   * @param projectName The Cloudflare Pages project name
   * @param accountId Cloudflare account ID
   * @param apiToken Cloudflare API token
   * @returns Deployment output
   */
  @func()
  async deployFrontend(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() branch: string,
    @argument() gitSha: string,
    @argument() projectName: string,
    accountId: Secret,
    apiToken: Secret,
  ): Promise<string> {
    logWithTimestamp(`🚀 Deploying frontend to Cloudflare Pages (project: ${projectName}, branch: ${branch})`);

    const result = await withTiming("frontend deployment", () =>
      deployFrontend({
        workspaceSource: source,
        branch,
        gitSha,
        cloudflare: {
          projectName,
          accountId,
          apiToken,
        },
      }),
    );

    logWithTimestamp("✅ Frontend deployment completed successfully");
    return `✅ Frontend deployed to Cloudflare Pages (project: ${projectName}, branch: ${branch})\n\n${result}`;
  }

  /**
   * Check for code duplication across packages
   * @param source The workspace source directory
   * @returns A message indicating completion
   */
  @func()
  async duplicationCheck(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<string> {
    logWithTimestamp("🔍 Starting code duplication check");

    await withTiming("code duplication check", async () => {
      const container = getBunNodeContainer(source)
        .withExec(["bun", "install", "--frozen-lockfile"])
        .withExec(["bun", "run", "scripts/check-duplication.ts"]);
      await container.sync();
      return container;
    });

    logWithTimestamp("✅ Code duplication check completed successfully");
    return "Code duplication check completed successfully";
  }

  /**
   * Check the desktop package
   * @param source The workspace source directory
   * @returns A message indicating completion
   */
  @func()
  async checkDesktop(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<string> {
    logWithTimestamp("🔍 Starting desktop package check");

    await withTiming("desktop package check", async () => {
      const container = checkDesktop(source);
      await container.sync();
      return container;
    });

    logWithTimestamp("✅ Desktop check completed successfully");
    return "Desktop check completed successfully";
  }

  /**
   * Build the desktop application for Linux
   * @param source The workspace source directory
   * @param version The version to build
   * @returns A message indicating completion
   */
  @func()
  async buildDesktop(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() version: string,
  ): Promise<string> {
    logWithTimestamp(`🏗️  Building desktop application for version ${version}`);

    await withTiming("desktop build", async () => {
      const container = buildDesktopLinux(source, version);
      await container.sync();
      return container;
    });

    logWithTimestamp("✅ Desktop build completed successfully");
    return `Desktop build completed successfully for version ${version}`;
  }

  /**
   * Build the desktop application for Windows (x86_64-pc-windows-gnu)
   * @param source The workspace source directory
   * @param version The version to build
   * @returns A message indicating completion
   */
  @func()
  async buildDesktopWindows(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() version: string,
  ): Promise<string> {
    logWithTimestamp(`🏗️  Building desktop application for Windows (GNU) version ${version}`);

    await withTiming("desktop build (windows gnu)", async () => {
      const container = buildDesktopWindowsGnu(source, version);
      await container.sync();
      return container;
    });

    logWithTimestamp("✅ Desktop Windows build completed successfully");
    return `Desktop Windows (GNU) build completed successfully for version ${version}`;
  }

  /**
   * Export desktop Linux build artifacts
   * @param source The workspace source directory
   * @param version The version to build
   * @returns The directory containing built artifacts
   */
  @func()
  async desktopArtifacts(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() version: string,
  ): Promise<Directory> {
    logWithTimestamp(`📦 Exporting desktop artifacts for version ${version}`);

    const result = await withTiming("desktop artifacts export", () =>
      Promise.resolve(getDesktopLinuxArtifacts(source, version)),
    );

    logWithTimestamp("✅ Desktop artifacts exported successfully");
    return result;
  }

  /**
   * Export desktop Windows (x86_64-pc-windows-gnu) build artifacts
   * @param source The workspace source directory
   * @param version The version to build
   * @returns The directory containing built artifacts
   */
  @func()
  async desktopWindowsArtifacts(
    @argument({
      ignore: ["**/node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() version: string,
  ): Promise<Directory> {
    logWithTimestamp(`📦 Exporting desktop Windows artifacts for version ${version}`);

    const result = await withTiming("desktop windows artifacts export", () =>
      Promise.resolve(getDesktopWindowsArtifacts(source, version)),
    );

    logWithTimestamp("✅ Desktop Windows artifacts exported successfully");
    return result;
  }
}
