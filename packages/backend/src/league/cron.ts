import { checkPostMatch } from "@scout-for-lol/backend/league/tasks/postmatch/index";
import { runLifecycleCheck } from "@scout-for-lol/backend/league/tasks/competition/lifecycle.js";
import { runDailyLeaderboardUpdate } from "@scout-for-lol/backend/league/tasks/competition/daily-update.js";
import { runPlayerPruning } from "@scout-for-lol/backend/league/tasks/cleanup/prune-players.js";
import { checkAbandonedGuilds } from "@scout-for-lol/backend/league/tasks/cleanup/abandoned-guilds.js";
import { runDataValidation } from "@scout-for-lol/backend/league/tasks/cleanup/validate-data.js";
import { client } from "@scout-for-lol/backend/discord/client.js";
import { createCronJob } from "@scout-for-lol/backend/league/cron/helpers.js";
import { createLogger } from "@scout-for-lol/backend/logger.js";

const logger = createLogger("league-cron");

export function startCronJobs() {
  logger.info("⏰ Initializing cron job scheduler");

  // check match history every minute
  logger.info("📅 Setting up match history polling job (every minute at :00)");
  createCronJob({
    schedule: "0 * * * * *",
    jobName: "post_match_check",
    task: checkPostMatch,
    logMessage: "🔍 Running post-match check task",
    timezone: "America/Los_Angeles",
    runOnInit: true,
  });

  // check competition lifecycle every 15 minutes
  logger.info("📅 Setting up competition lifecycle job (every 15 minutes)");
  createCronJob({
    schedule: "0 */15 * * * *",
    jobName: "competition_lifecycle",
    task: runLifecycleCheck,
    logMessage: "🏆 Running competition lifecycle check",
    timezone: "America/Los_Angeles",
    runOnInit: false, // Don't run on init - prevents startup notifications
    logTrigger: "Checking for competitions to start/end",
  });

  // validate data (cleanup orphaned guilds/channels) every hour
  logger.info("📅 Setting up data validation job (every hour at :00)");
  createCronJob({
    schedule: "0 0 * * * *",
    jobName: "data_validation",
    task: () => runDataValidation(client),
    logMessage: "🔍 Running data validation",
    timezone: "America/Los_Angeles",
    runOnInit: true,
  });

  // post daily leaderboard updates at midnight UTC
  logger.info("📅 Setting up daily leaderboard update job (midnight UTC)");
  createCronJob({
    schedule: "0 0 0 * * *",
    jobName: "daily_leaderboard_update",
    task: runDailyLeaderboardUpdate,
    logMessage: "📊 Running daily leaderboard update",
    timezone: "UTC",
    runOnInit: false, // Don't run on init - prevents startup notifications
    logTrigger: "Posting daily leaderboard updates for active competitions",
  });

  // prune orphaned players daily at 3 AM UTC
  logger.info("📅 Setting up daily player pruning job (3 AM UTC)");
  createCronJob({
    schedule: "0 0 3 * * *",
    jobName: "player_pruning",
    task: runPlayerPruning,
    logMessage: "🧹 Running player pruning task",
    timezone: "UTC",
    runOnInit: true,
  });

  // check for abandoned guilds daily at 4 AM UTC (after player pruning)
  logger.info("📅 Setting up abandoned guild cleanup job (4 AM UTC)");
  createCronJob({
    schedule: "0 0 4 * * *",
    jobName: "abandoned_guild_cleanup",
    task: () => checkAbandonedGuilds(client),
    logMessage: "🧹 Running abandoned guild cleanup",
    timezone: "UTC",
    runOnInit: true,
  });

  logger.info("✅ Cron jobs initialized successfully");
  logger.info(
    "📊 Match history polling (1min), competition lifecycle (15min), data validation (hourly), daily leaderboard (midnight UTC), player pruning (3AM UTC), and abandoned guild cleanup (4AM UTC) cron jobs are now active",
  );
}
