import { CronJob } from "cron";
import { checkPreMatch } from "./tasks/prematch/index";
import { logErrors } from "./util";
import { checkPostMatch } from "./tasks/postmatch/index";
import {
  cronJobExecutionsTotal,
  cronJobDuration,
  cronJobLastSuccess,
} from "../metrics/index.js";

export function startCronJobs() {
  console.log("⏰ Initializing cron job scheduler");

  // check spectate status every minute
  console.log("📅 Setting up pre-match check job (every minute at :00)");
  new CronJob(
    "0 * * * * *",
    logErrors(async () => {
      const startTime = Date.now();
      const jobName = "pre_match_check";
      console.log("🔍 Running pre-match check task");

      try {
        await checkPreMatch();
        const executionTime = Date.now() - startTime;
        const executionTimeSeconds = executionTime / 1000;
        console.log(
          `✅ Pre-match check completed in ${executionTime.toString()}ms`,
        );

        // Record successful execution metrics
        cronJobExecutionsTotal.inc({ job_name: jobName, status: "success" });
        cronJobDuration.observe({ job_name: jobName }, executionTimeSeconds);
        cronJobLastSuccess.set({ job_name: jobName }, Date.now() / 1000);
      } catch (error) {
        const executionTime = Date.now() - startTime;
        const executionTimeSeconds = executionTime / 1000;

        // Record failed execution metrics
        cronJobExecutionsTotal.inc({ job_name: jobName, status: "error" });
        cronJobDuration.observe({ job_name: jobName }, executionTimeSeconds);
        throw error;
      }
    }),
    undefined,
    true,
    "America/Los_Angeles",
    undefined,
    true,
  );

  // check match status every minute, offset by 30 seconds
  // this helps with rate limiting and file locking, although it should be safe to run both at the same time
  console.log("📅 Setting up post-match check job (every minute at :30)");
  new CronJob(
    "30 * * * * *",
    logErrors(async () => {
      const startTime = Date.now();
      const jobName = "post_match_check";
      console.log("🔍 Running post-match check task");

      try {
        await checkPostMatch();
        const executionTime = Date.now() - startTime;
        const executionTimeSeconds = executionTime / 1000;
        console.log(
          `✅ Post-match check completed in ${executionTime.toString()}ms`,
        );

        // Record successful execution metrics
        cronJobExecutionsTotal.inc({ job_name: jobName, status: "success" });
        cronJobDuration.observe({ job_name: jobName }, executionTimeSeconds);
        cronJobLastSuccess.set({ job_name: jobName }, Date.now() / 1000);
      } catch (error) {
        const executionTime = Date.now() - startTime;
        const executionTimeSeconds = executionTime / 1000;

        // Record failed execution metrics
        cronJobExecutionsTotal.inc({ job_name: jobName, status: "error" });
        cronJobDuration.observe({ job_name: jobName }, executionTimeSeconds);
        throw error;
      }
    }),
    undefined,
    true,
    "America/Los_Angeles",
    undefined,
    true,
  );

  console.log("✅ Cron jobs initialized successfully");
  console.log("📊 Both pre-match and post-match cron jobs are now active");
}
