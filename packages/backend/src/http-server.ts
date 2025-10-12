import configuration from "./configuration.js";
import { getMetrics } from "./metrics/index.js";

console.log("🌐 Initializing HTTP server");

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
        console.error("❌ Error generating metrics:", error);
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
    console.error("❌ HTTP server error:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  },
});

const port = server.port?.toString() ?? "unknown";
console.log(`✅ HTTP server started on http://0.0.0.0:${port}`);
console.log(`🏥 Health check: http://0.0.0.0:${port}/ping`);
console.log(`📊 Metrics endpoint: http://0.0.0.0:${port}/metrics`);

/**
 * Gracefully shut down the HTTP server
 */
export async function shutdownHttpServer(): Promise<void> {
  console.log("🛑 Shutting down HTTP server");
  await server.stop();
  console.log("✅ HTTP server shut down successfully");
}

export default server;
