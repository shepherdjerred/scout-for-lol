import "dotenv/config";
import env from "env-var";

console.log("🔧 Loading application configuration");

function getRequiredEnvVar(name: string): string {
  // don't require these when running tests
  if (process.env.NODE_ENV === "test") {
    return getOptionalEnvVar(name) ?? "TEST PLACEHOLDER";
  }
  try {
    const value = env.get(name).required().asString();
    console.log(`✅ ${name}: configured`);
    return value;
  } catch (error) {
    console.error(`❌ Missing required environment variable: ${name}`);
    throw error;
  }
}

function getOptionalEnvVar(
  name: string,
  defaultValue?: string
): string | undefined {
  const value = env.get(name).asString();
  if (value) {
    console.log(`✅ ${name}: configured`);
    return value;
  } else if (defaultValue) {
    console.log(`⚠️  ${name}: using default value (${defaultValue})`);
    return defaultValue;
  } else {
    console.log(`⚠️  ${name}: not configured`);
    return undefined;
  }
}

export default {
  version: getRequiredEnvVar("VERSION"),
  gitSha: getRequiredEnvVar("GIT_SHA"),
  sentryDsn: getOptionalEnvVar("SENTRY_DSN"),
  environment: env
    .get("ENVIRONMENT")
    .default("dev")
    .asEnum(["dev", "beta", "prod"]),
  discordToken: getRequiredEnvVar("DISCORD_TOKEN"),
  applicationId: getRequiredEnvVar("APPLICATION_ID"),
  riotApiToken: getRequiredEnvVar("RIOT_API_TOKEN"),
  databaseUrl: getRequiredEnvVar("DATABASE_URL"),
  port: env.get("PORT").default("3000").asPortNumber(),
  s3BucketName: getOptionalEnvVar("S3_BUCKET_NAME"),
};

console.log("✅ Configuration loaded successfully");
