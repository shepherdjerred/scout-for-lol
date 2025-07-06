import { CronJob } from "cron";
import { checkPreMatch } from "./tasks/prematch/index";
import { logErrors } from "./util";
import { checkPostMatch } from "./tasks/postmatch/index";

export function startCronJobs() {
  // check spectate status every minute
  new CronJob(
    "0 * * * * *",
    logErrors(checkPreMatch),
    undefined,
    true,
    "America/Los_Angeles",
    undefined,
    true,
  );

  // check match status every minute, offset by 30 seconds
  // this helps with rate limiting and file locking, although it should be safe to run both at the same time
  new CronJob(
    "30 * * * * *",
    logErrors(checkPostMatch),
    undefined,
    true,
    "America/Los_Angeles",
    undefined,
    true,
  );
}
