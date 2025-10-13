import { Registry, Counter, Gauge, Histogram } from "prom-client";
import configuration from "../configuration.js";

console.log("📊 Initializing Prometheus metrics");

/**
 * Custom Prometheus registry for Scout for LoL metrics
 */
export const registry = new Registry();

/**
 * Add default labels to all metrics
 */
registry.setDefaultLabels({
  service: "scout-for-lol-backend",
  version: configuration.version,
  environment: configuration.environment,
  git_sha: configuration.gitSha,
});

// =======================
// Discord Bot Metrics
// =======================

/**
 * Total number of Discord commands received
 */
export const discordCommandsTotal = new Counter({
  name: "discord_commands_total",
  help: "Total number of Discord commands received",
  labelNames: ["command", "status"] as const,
  registers: [registry],
});

/**
 * Duration of Discord command execution in seconds
 */
export const discordCommandDuration = new Histogram({
  name: "discord_command_duration_seconds",
  help: "Duration of Discord command execution in seconds",
  labelNames: ["command"] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [registry],
});

/**
 * Number of guilds the bot is currently in
 */
export const discordGuildsGauge = new Gauge({
  name: "discord_guilds",
  help: "Number of guilds the bot is currently in",
  registers: [registry],
});

/**
 * Number of users the bot can see
 */
export const discordUsersGauge = new Gauge({
  name: "discord_users",
  help: "Number of users the bot can see",
  registers: [registry],
});

/**
 * Discord WebSocket connection status (1 = connected, 0 = disconnected)
 */
export const discordConnectionStatus = new Gauge({
  name: "discord_connection_status",
  help: "Discord WebSocket connection status (1 = connected, 0 = disconnected)",
  registers: [registry],
});

/**
 * Discord WebSocket latency in milliseconds
 */
export const discordLatency = new Gauge({
  name: "discord_latency_ms",
  help: "Discord WebSocket latency in milliseconds",
  registers: [registry],
});

// =======================
// League of Legends API Metrics
// =======================

/**
 * Total number of Riot API requests
 */
export const riotApiRequestsTotal = new Counter({
  name: "riot_api_requests_total",
  help: "Total number of Riot API requests",
  labelNames: ["endpoint", "status", "region"] as const,
  registers: [registry],
});

/**
 * Duration of Riot API requests in seconds
 */
export const riotApiRequestDuration = new Histogram({
  name: "riot_api_request_duration_seconds",
  help: "Duration of Riot API requests in seconds",
  labelNames: ["endpoint", "region"] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

/**
 * Number of Riot API rate limit errors
 */
export const riotApiRateLimitErrors = new Counter({
  name: "riot_api_rate_limit_errors_total",
  help: "Total number of Riot API rate limit errors",
  labelNames: ["region"] as const,
  registers: [registry],
});

// =======================
// Database Metrics
// =======================

/**
 * Total number of database queries
 */
export const databaseQueriesTotal = new Counter({
  name: "database_queries_total",
  help: "Total number of database queries",
  labelNames: ["operation", "status"] as const,
  registers: [registry],
});

/**
 * Duration of database queries in seconds
 */
export const databaseQueryDuration = new Histogram({
  name: "database_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation"] as const,
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5],
  registers: [registry],
});

// =======================
// Report Generation Metrics
// =======================

/**
 * Total number of reports generated
 */
export const reportsGeneratedTotal = new Counter({
  name: "reports_generated_total",
  help: "Total number of reports generated",
  labelNames: ["report_type", "status"] as const,
  registers: [registry],
});

/**
 * Duration of report generation in seconds
 */
export const reportGenerationDuration = new Histogram({
  name: "report_generation_duration_seconds",
  help: "Duration of report generation in seconds",
  labelNames: ["report_type"] as const,
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
  registers: [registry],
});

// =======================
// Cron Job Metrics
// =======================

/**
 * Total number of cron job executions
 */
export const cronJobExecutionsTotal = new Counter({
  name: "cron_job_executions_total",
  help: "Total number of cron job executions",
  labelNames: ["job_name", "status"] as const,
  registers: [registry],
});

/**
 * Duration of cron job execution in seconds
 */
export const cronJobDuration = new Histogram({
  name: "cron_job_duration_seconds",
  help: "Duration of cron job execution in seconds",
  labelNames: ["job_name"] as const,
  buckets: [1, 5, 10, 30, 60, 300, 600],
  registers: [registry],
});

/**
 * Timestamp of last successful cron job execution (Unix timestamp)
 */
export const cronJobLastSuccess = new Gauge({
  name: "cron_job_last_success_timestamp",
  help: "Timestamp of last successful cron job execution (Unix timestamp)",
  labelNames: ["job_name"] as const,
  registers: [registry],
});

// =======================
// Application Metrics
// =======================

/**
 * Application uptime in seconds
 */
export const applicationUptime = new Gauge({
  name: "application_uptime_seconds",
  help: "Application uptime in seconds",
  registers: [registry],
});

/**
 * Total number of unhandled errors
 */
export const unhandledErrorsTotal = new Counter({
  name: "unhandled_errors_total",
  help: "Total number of unhandled errors",
  labelNames: ["error_type"] as const,
  registers: [registry],
});

// Track application start time for uptime calculation
const applicationStartTime = Date.now();

/**
 * Update the application uptime metric
 */
export function updateUptimeMetric(): void {
  const uptimeSeconds = (Date.now() - applicationStartTime) / 1000;
  applicationUptime.set(uptimeSeconds);
}

// Update uptime every 10 seconds
setInterval(() => {
  updateUptimeMetric();
}, 10_000);

console.log("✅ Prometheus metrics initialized successfully");

/**
 * Get all metrics as Prometheus-formatted text
 */
export async function getMetrics(): Promise<string> {
  updateUptimeMetric();
  return await registry.metrics();
}
