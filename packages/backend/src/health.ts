import { strict as assert } from "assert";
import configuration from "@scout-for-lol/backend/configuration.js";
import { ErrorSchema } from "@scout-for-lol/backend/utils/errors.js";

console.log("🏥 Starting health check");
console.log(`🔍 Health check URL: http://127.0.0.1:${configuration.port.toString()}/ping`);

// health check used by Docker
try {
  const startTime = Date.now();

  const response = await fetch(`http://127.0.0.1:${configuration.port.toString()}/ping`);

  const responseTime = Date.now() - startTime;
  console.log(`📊 Health check response time: ${responseTime.toString()}ms`);
  console.log(`📋 HTTP Status: ${response.status.toString()}`);

  assert(response.ok);
  console.log("✅ Health check passed");
  process.exit(0);
} catch (error) {
  console.error("❌ Health check failed:", error);

  const errorResult = ErrorSchema.safeParse(error);
  if (errorResult.success) {
    console.error(`❌ Error message: ${errorResult.data.message}`);
  }

  process.exit(1);
}
