import { CronJob } from "cron";
import { logErrors } from "./util";
import { checkPostMatch } from "./tasks/postmatch/index";
import { runLifecycleCheck } from "./tasks/competition/lifecycle.js";
import { runDailyLeaderboardUpdate } from "./tasks/competition/daily-update.js";
import { runPlayerPruning } from "./tasks/cleanup/prune-players.js";
import { checkAbandonedGuilds } from "./tasks/cleanup/abandoned-guilds.js";
import { cronJobExecutionsTotal, cronJobDuration, cronJobLastSuccess } from "../metrics/index.js";
import client from "../discord/client.js";

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
    "📊 Match history polling, competition lifecycle, daily leaderboard, player pruning, and abandoned guild cleanup cron jobs are now active",
  );
}
