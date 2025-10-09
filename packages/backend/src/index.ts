import configuration from "./configuration.js";
import * as Sentry from "@sentry/node";

// Import type augmentations to extend third-party library types
import "./types/twisted-augmentation.js";

console.log("🚀 Starting Scout for LoL backend application");
console.log(`📦 Version: ${configuration.version}`);
console.log(`🔧 Environment: ${configuration.environment}`);
console.log(`🌐 Git SHA: ${configuration.gitSha}`);
console.log(`🔌 Port: ${configuration.port.toString()}`);

if (configuration.sentryDsn) {
  console.log("🔍 Initializing Sentry error tracking");
  Sentry.init({
    dsn: configuration.sentryDsn,
    environment: configuration.environment,
    release: configuration.gitSha,
  });
  console.log("✅ Sentry initialized successfully");
} else {
  console.log("⚠️  Sentry DSN not configured, error tracking disabled");
}

// Initialize metrics (must be imported early to set up metrics collection)
console.log("📊 Initializing metrics system");
import "./metrics/index.js";

// Initialize HTTP server for health checks and metrics
console.log("🌐 Starting HTTP server for health checks and metrics");
import { shutdownHttpServer } from "./http-server.js";

// Preload Arena augments once at startup; continue if it fails
console.log("🧩 Initializing Arena augments cache");
await initArenaAugmentsOnce()
  .then(() => {
    console.log("✅ Arena augments cache initialized");
  })
  .catch((e: unknown) => {
    console.warn("⚠️  Failed to initialize Arena augments cache:", e);
  });

console.log("🔌 Starting Discord bot initialization");
import "./discord/index.js";

console.log("⏰ Starting cron job scheduler");
import { startCronJobs } from "./league/cron.js";
import { initArenaAugmentsOnce } from "./league/arena/augment.js";
startCronJobs();

console.log("✅ Backend application startup complete");

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  void shutdownHttpServer().then(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  void shutdownHttpServer().then(() => {
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
  console.error("Promise:", promise);
  Sentry.captureException(reason);

  // Track unhandled errors in metrics
  import("./metrics/index.js")
    .then((metrics) => {
      metrics.unhandledErrorsTotal.inc({ error_type: "unhandled_rejection" });
    })
    .catch(() => {
      // Ignore if metrics module fails to import
    });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  Sentry.captureException(error);

  // Track unhandled errors in metrics
  import("./metrics/index.js")
    .then((metrics) => {
      metrics.unhandledErrorsTotal.inc({ error_type: "uncaught_exception" });
    })
    .catch(() => {
      // Ignore if metrics module fails to import
    });

  process.exit(1);
});
