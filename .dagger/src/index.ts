/* eslint-disable max-lines */
import { func, argument, Directory, object, Secret, Container } from "@dagger.io/dagger";
import {
  checkBackend,
  buildBackendImage,
  publishBackendImage,
  smokeTestBackendImage,
  getBackendCoverage,
  getBackendTestReport,
} from "./backend";
import { checkReport, getReportCoverage, getReportTestReport } from "./report";
import { checkData, getDataCoverage, getDataTestReport } from "./data";
import { checkFrontend, buildFrontend, deployFrontend } from "./frontend";
import { getGitHubContainer, getBunNodeContainer } from "./base";

// Helper function to log with timestamp
function logWithTimestamp(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
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
    logWithTimestamp(
      `❌ ${operation} failed after ${duration.toString()}ms: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

@object()
export class ScoutForLol {
  /**
   * Run all checks (backend, report, data, frontend)
   * @param source The source directory
   * @returns A message indicating completion
   */
  @func()
  async check(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<string> {
    logWithTimestamp("🔍 Starting comprehensive check process");
    logWithTimestamp("📋 This includes TypeScript type checking, ESLint, and tests for all packages");

    logWithTimestamp("📁 Prepared source directories for all packages");

    // Run checks in parallel - force container execution with .sync()
    await withTiming("parallel package checks (lint, typecheck, tests)", async () => {
      logWithTimestamp("🔄 Running lint, typecheck, and tests in parallel for all packages...");
      logWithTimestamp("📦 Packages being checked: backend, report, data, frontend");

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
      ]);
    });

    logWithTimestamp("🎉 All checks completed successfully");
    logWithTimestamp("✅ All packages passed: TypeScript type checking, ESLint linting, and tests");
    return "All checks completed successfully";
  }

  /**
   * Build all packages (backend image, report npm package)
   * @param source The source directory
   * @param version The version to build
   * @param gitSha The git SHA
   * @returns A message indicating completion
   */
  @func()
  async build(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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

    logWithTimestamp("🎉 Backend image built successfully");
    return "Backend image built successfully";
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
   * @returns A message indicating completion
   */
  @func()
  async ci(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
        const publishedRefs = await publishBackendImage(source, version, gitSha, ghcrUsername, ghcrPassword);

        logWithTimestamp(`✅ Images published: ${publishedRefs.join(", ")}`);
      });
    } else {
      logWithTimestamp("⏭️ Phase 3: Skipping image publishing (no credentials or not prod environment)");
    }

    // Deploy backend to homelab
    const deployStage = env === "prod" ? "beta" : "dev";
    await withTiming("CI backend deploy phase", () => {
      logWithTimestamp(`🚀 Phase 4: Deploying backend to ${deployStage}...`);
      return this.deploy(source, version, deployStage, ghToken);
    });

    // Deploy frontend to Cloudflare Pages if credentials provided
    const shouldDeployFrontend = accountId && apiToken && branch;
    if (shouldDeployFrontend) {
      await withTiming("CI frontend deploy phase", async () => {
        logWithTimestamp(`🚀 Phase 5: Deploying frontend to Cloudflare Pages (branch: ${branch})...`);
        const project = projectName ?? "scout-for-lol";
        await this.deployFrontend(source, branch, gitSha, project, accountId, apiToken);
        logWithTimestamp(
          `✅ Frontend deployed to https://${branch === "main" ? "" : `${branch}.`}${project}.pages.dev`,
        );
      });
    } else {
      logWithTimestamp("⏭️ Phase 5: Skipping frontend deployment (no Cloudflare credentials or branch not provided)");
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() version: string,
    @argument() gitSha: string,
    registryUsername?: string,
    registryPassword?: Secret,
  ): Promise<string[]> {
    logWithTimestamp(`📦 Publishing backend Docker image for version ${version} (${gitSha})`);

    const result = await withTiming("backend Docker image publish", () =>
      publishBackendImage(source, version, gitSha, registryUsername, registryPassword),
    );

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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
   * @param source The workspace source directory
   * @returns A message indicating completion
   */
  @func()
  async checkReport(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<string> {
    logWithTimestamp("🔍 Starting report package check");

    await withTiming("report package check", () => Promise.resolve(checkReport(source)));

    logWithTimestamp("✅ Report check completed successfully");
    return "Report check completed successfully";
  }

  /**
   * Check the data package
   * @param source The workspace source directory
   * @returns A message indicating completion
   */
  @func()
  async checkData(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
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
      deployFrontend(source, branch, gitSha, projectName, accountId, apiToken),
    );

    logWithTimestamp("✅ Frontend deployment completed successfully");
    return `✅ Frontend deployed to Cloudflare Pages (project: ${projectName}, branch: ${branch})\n\n${result}`;
  }
}
