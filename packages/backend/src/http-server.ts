import configuration from "@scout-for-lol/backend/configuration.js";
import { getMetrics } from "@scout-for-lol/backend/metrics/index.js";
import * as Sentry from "@sentry/node";
import { createLogger } from "@scout-for-lol/backend/logger.js";

const logger = createLogger("http-server");

logger.info("🌐 Initializing HTTP server");

/**
 * Simple HTTP server for health checks and metrics using Bun's native server
 */
const server = Bun.serve({
  port: configuration.port,
  hostname: "0.0.0.0",
  async fetch(request) {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/ping") {
      return new Response("pong", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // Metrics endpoint for Prometheus
    if (url.pathname === "/metrics") {
      try {
        const metrics = await getMetrics();
        return new Response(metrics, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
          },
        });
      } catch (error) {
        logger.error("❌ Error generating metrics:", error);
        Sentry.captureException(error, { tags: { source: "http-server-metrics" } });
        return new Response("Internal Server Error", {
          status: 500,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }
    }

    // 404 for all other routes
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  },
  error(error) {
    logger.error("❌ HTTP server error:", error);
    Sentry.captureException(error, { tags: { source: "http-server" } });
    return new Response("Internal Server Error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  },
});

const port = server.port?.toString() ?? "unknown";
logger.info(`✅ HTTP server started on http://0.0.0.0:${port}`);
logger.info(`🏥 Health check: http://0.0.0.0:${port}/ping`);
logger.info(`📊 Metrics endpoint: http://0.0.0.0:${port}/metrics`);

/**
 * Gracefully shut down the HTTP server
 */
export async function shutdownHttpServer(): Promise<void> {
  logger.info("🛑 Shutting down HTTP server");
  await server.stop();
  logger.info("✅ HTTP server shut down successfully");
}
