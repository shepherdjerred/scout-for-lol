import configuration from "./configuration.js";
import * as Sentry from "@sentry/node";

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

console.log("🔌 Starting Discord bot initialization");
import "./discord/index.js";

console.log("⏰ Starting cron job scheduler");
import { startCronJobs } from "./league/cron.js";
startCronJobs();

console.log("✅ Backend application startup complete");

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
  console.error("Promise:", promise);
  Sentry.captureException(reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  Sentry.captureException(error);
  process.exit(1);
});
