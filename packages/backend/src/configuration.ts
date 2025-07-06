import "dotenv/config";
import env from "env-var";

export default {
  version: env.get("VERSION").required().asString(),
  gitSha: env.get("GIT_SHA").required().asString(),
  sentryDsn: env.get("SENTRY_DSN").asString(),
  environment: env
    .get("ENVIRONMENT")
    .default("dev")
    .asEnum(["dev", "beta", "prod"]),
  discordToken: env.get("DISCORD_TOKEN").required().asString(),
  applicationId: env.get("APPLICATION_ID").required().asString(),
  riotApiToken: env.get("RIOT_API_TOKEN").required().asString(),
  databaseUrl: env.get("DATABASE_URL").required().asString(),
  port: env.get("PORT").default("3000").asPortNumber(),
};
