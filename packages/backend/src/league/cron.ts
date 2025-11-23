import { CronJob } from "cron";
import { logErrors } from "@scout-for-lol/backend/league/util";
import { checkPostMatch } from "@scout-for-lol/backend/league/tasks/postmatch/index";
import { runLifecycleCheck } from "@scout-for-lol/backend/league/tasks/competition/lifecycle.js";
import { runDailyLeaderboardUpdate } from "@scout-for-lol/backend/league/tasks/competition/daily-update.js";
import { runPlayerPruning } from "@scout-for-lol/backend/league/tasks/cleanup/prune-players.js";
import { checkAbandonedGuilds } from "@scout-for-lol/backend/league/tasks/cleanup/abandoned-guilds.js";
import { runDataValidation } from "@scout-for-lol/backend/league/tasks/cleanup/validate-data.js";
import { cronJobExecutionsTotal, cronJobDuration, cronJobLastSuccess } from "@scout-for-lol/backend/metrics/index.js";
import client from "@scout-for-lol/backend/discord/client.js";
import { logCronTrigger } from "@scout-for-lol/backend/utils/notification-logger.js";

export function startCronJobs() {
  console.log("⏰ Initializing cron job scheduler");

  // PRE-MATCH CHECK REMOVED
  // The Spectator API has been deprecated by Riot Games
  // We can no longer detect games in real-time
  // Match detection now happens via post-match history polling

  // check match history every minute
  console.log("📅 Setting up match history polling job (every minute at :00)");
  new CronJob(
    "0 * * * * *",
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

  // check competition lifecycle every 15 minutes
  console.log("📅 Setting up competition lifecycle job (every 15 minutes)");
  new CronJob(
    "0 */15 * * * *", // Every 15 minutes
    logErrors(async () => {
      const startTime = Date.now();
      const jobName = "competition_lifecycle";
      console.log("🏆 Running competition lifecycle check");
      logCronTrigger(jobName, "Checking for competitions to start/end");

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
    false, // Don't run on init - prevents startup notifications
  );

  // validate data (cleanup orphaned guilds/channels) every hour
  console.log("📅 Setting up data validation job (every hour at :00)");
  new CronJob(
    "0 0 * * * *", // Every hour at :00
    logErrors(async () => {
      const startTime = Date.now();
      const jobName = "data_validation";
      console.log("🔍 Running data validation");

      try {
        await runDataValidation(client);
        const executionTime = Date.now() - startTime;
        const executionTimeSeconds = executionTime / 1000;
        console.log(`✅ Data validation completed in ${executionTime.toString()}ms`);

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
      logCronTrigger(jobName, "Posting daily leaderboard updates for active competitions");

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
    false, // Don't run on init - prevents startup notifications
  );

  // prune orphaned players daily at 3 AM UTC
  console.log("📅 Setting up daily player pruning job (3 AM UTC)");
  new CronJob(
    "0 0 3 * * *", // Daily at 03:00:00 UTC
    logErrors(async () => {
      const startTime = Date.now();
      const jobName = "player_pruning";
      console.log("🧹 Running player pruning task");

      try {
        await runPlayerPruning();
        const executionTime = Date.now() - startTime;
        const executionTimeSeconds = executionTime / 1000;
        console.log(`✅ Player pruning completed in ${executionTime.toString()}ms`);

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

  // check for abandoned guilds daily at 4 AM UTC (after player pruning)
  console.log("📅 Setting up abandoned guild cleanup job (4 AM UTC)");
  new CronJob(
    "0 0 4 * * *", // Daily at 04:00:00 UTC
    logErrors(async () => {
      const startTime = Date.now();
      const jobName = "abandoned_guild_cleanup";
      console.log("🧹 Running abandoned guild cleanup");

      try {
        await checkAbandonedGuilds(client);
        const executionTime = Date.now() - startTime;
        const executionTimeSeconds = executionTime / 1000;
        console.log(`✅ Abandoned guild cleanup completed in ${executionTime.toString()}ms`);

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
  console.log(
    "📊 Match history polling (1min), competition lifecycle (15min), data validation (hourly), daily leaderboard (midnight UTC), player pruning (3AM UTC), and abandoned guild cleanup (4AM UTC) cron jobs are now active",
  );
}
