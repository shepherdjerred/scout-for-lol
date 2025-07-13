import { CronJob } from "cron";
import { checkPreMatch } from "./tasks/prematch/index";
import { logErrors } from "./util";
import { checkPostMatch } from "./tasks/postmatch/index";

export function startCronJobs() {
  console.log("⏰ Initializing cron job scheduler");

  // check spectate status every minute
  console.log("📅 Setting up pre-match check job (every minute at :00)");
  new CronJob(
    "0 * * * * *",
    logErrors(async () => {
      const startTime = Date.now();
      console.log("🔍 Running pre-match check task");
      await checkPreMatch();
      const executionTime = Date.now() - startTime;
      console.log(
        `✅ Pre-match check completed in ${executionTime.toString()}ms`
      );
    }),
    undefined,
    true,
    "America/Los_Angeles",
    undefined,
    true
  );

  // check match status every minute, offset by 30 seconds
  // this helps with rate limiting and file locking, although it should be safe to run both at the same time
  console.log("📅 Setting up post-match check job (every minute at :30)");
  new CronJob(
    "30 * * * * *",
    logErrors(async () => {
      const startTime = Date.now();
      console.log("🔍 Running post-match check task");
      await checkPostMatch();
      const executionTime = Date.now() - startTime;
      console.log(
        `✅ Post-match check completed in ${executionTime.toString()}ms`
      );
    }),
    undefined,
    true,
    "America/Los_Angeles",
    undefined,
    true
  );

  console.log("✅ Cron jobs initialized successfully");
  console.log("📊 Both pre-match and post-match cron jobs are now active");
}
