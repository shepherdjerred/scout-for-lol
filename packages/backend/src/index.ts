import configuration from "./configuration.js";
import * as Sentry from "@sentry/node";
import "dotenv/config";

Sentry.init({
  dsn: configuration.sentryDsn,
  environment: configuration.environment,
  release: configuration.gitSha,
});

import "./discord/index.js";
import { startCronJobs } from "./league/cron.js";

startCronJobs();
