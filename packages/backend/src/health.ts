import { strict as assert } from "assert";
import { z } from "zod";
import configuration from "./configuration.js";

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

  const ErrorDetailsSchema = z.object({ name: z.string(), message: z.string() });
  const errorResult = ErrorDetailsSchema.safeParse(error);
  if (errorResult.success) {
    console.error(`❌ Error name: ${errorResult.data.name}`);
    console.error(`❌ Error message: ${errorResult.data.message}`);
  }

  process.exit(1);
}
