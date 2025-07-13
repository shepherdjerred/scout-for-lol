import * as Sentry from "@sentry/node";

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
      if (e instanceof Error) {
        console.error(`❌ Error name: ${e.name}`);
        console.error(`❌ Error message: ${e.message}`);
        if (e.stack) {
          console.error(`❌ Error stack: ${e.stack}`);
        }
      }

      // Send to Sentry with additional context
      Sentry.captureException(e, {
        tags: {
          function: functionName,
          source: "cron-job"
        }
      });

      // Re-throw to maintain original behavior
      throw e;
    }
  };
}
