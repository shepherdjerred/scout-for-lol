import { strict as assert } from "assert";
import configuration from "./configuration.js";

console.log("🏥 Starting health check");
console.log(
  `🔍 Health check URL: http://127.0.0.1:${configuration.port.toString()}/ping`
);

// health check used by Docker
try {
  const startTime = Date.now();

  const response = await fetch(
    `http://127.0.0.1:${configuration.port.toString()}/ping`
  );

  const responseTime = Date.now() - startTime;
  console.log(`📊 Health check response time: ${responseTime.toString()}ms`);
  console.log(`📋 HTTP Status: ${response.status.toString()}`);

  assert(response.ok);
  console.log("✅ Health check passed");
  process.exit(0);
} catch (error) {
  console.error("❌ Health check failed:", error);

  if (error instanceof Error) {
    console.error(`❌ Error name: ${error.name}`);
    console.error(`❌ Error message: ${error.message}`);
  }

  process.exit(1);
}
