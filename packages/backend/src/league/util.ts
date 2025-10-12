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
      console.log(
        `✅ Function ${functionName} completed successfully in ${executionTime.toString()}ms`,
      );
    } catch (e) {
      console.error(`❌ Function ${functionName} failed:`, e);

      // Log additional error context
      if (z.instanceof(Error).safeParse(e).success) {
        const err = e as Error;
        console.error(`❌ Error name: ${err.name}`);
        console.error(`❌ Error message: ${err.message}`);
        if (err.stack) {
          console.error(`❌ Error stack: ${err.stack}`);
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
