import * as Sentry from "@sentry/node";
import { z } from "zod";

export function logErrors(fn: () => Promise<unknown>) {
  return async () => {
    const functionName = fn.name || "anonymous";
    console.log(`🔄 Executing function: ${functionName}`);

    try {
      const startTime = Date.now();
      await fn();
      const executionTime = Date.now() - startTime;
      console.log(`✅ Function ${functionName} completed successfully in ${executionTime.toString()}ms`);
    } catch (e) {
      console.error(`❌ Function ${functionName} failed:`, e);

      // Log additional error context
      const ErrorDetailsSchema = z.object({ name: z.string(), message: z.string(), stack: z.string().optional() });
      const errorResult = ErrorDetailsSchema.safeParse(e);
      if (errorResult.success) {
        console.error(`❌ Error name: ${errorResult.data.name}`);
        console.error(`❌ Error message: ${errorResult.data.message}`);
        if (errorResult.data.stack) {
          console.error(`❌ Error stack: ${errorResult.data.stack}`);
        }
      }

      // Send to Sentry with additional context
      Sentry.captureException(e, {
        tags: {
          function: functionName,
          source: "cron-job",
        },
      });

      // Re-throw to maintain original behavior
      throw e;
    }
  };
}
