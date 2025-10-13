import { CronJob } from "cron";
import { checkPreMatch } from "./tasks/prematch/index";
import { logErrors } from "./util";
import { checkPostMatch } from "./tasks/postmatch/index";
import { runLifecycleCheck } from "./tasks/competition/lifecycle.js";
import { runDailyLeaderboardUpdate } from "./tasks/competition/daily-update.js";
import { cronJobExecutionsTotal, cronJobDuration, cronJobLastSuccess } from "../metrics/index.js";

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
        console.log(`✅ Pre-match check completed in ${executionTime.toString()}ms`);

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
        console.log(`✅ Post-match check completed in ${executionTime.toString()}ms`);

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

  // check competition lifecycle every hour
  console.log("📅 Setting up competition lifecycle job (every hour at :00)");
  new CronJob(
    "0 0 * * * *", // Every hour at :00
    logErrors(async () => {
      const startTime = Date.now();
      const jobName = "competition_lifecycle";
      console.log("🏆 Running competition lifecycle check");

      try {
        await runLifecycleCheck();
        const executionTime = Date.now() - startTime;
        const executionTimeSeconds = executionTime / 1000;
        console.log(`✅ Competition lifecycle check completed in ${executionTime.toString()}ms`);

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

  // post daily leaderboard updates at midnight UTC
  console.log("📅 Setting up daily leaderboard update job (midnight UTC)");
  new CronJob(
    "0 0 0 * * *", // Daily at 00:00:00 UTC
    logErrors(async () => {
      const startTime = Date.now();
      const jobName = "daily_leaderboard_update";
      console.log("📊 Running daily leaderboard update");

      try {
        await runDailyLeaderboardUpdate();
        const executionTime = Date.now() - startTime;
        const executionTimeSeconds = executionTime / 1000;
        console.log(`✅ Daily leaderboard update completed in ${executionTime.toString()}ms`);

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
    "UTC", // Explicitly UTC for consistency
    undefined,
    true,
  );

  console.log("✅ Cron jobs initialized successfully");
  console.log("📊 Pre-match, post-match, competition lifecycle, and daily leaderboard cron jobs are now active");
}
