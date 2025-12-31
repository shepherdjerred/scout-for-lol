import { S3Client } from "@aws-sdk/client-s3";
import configuration from "@scout-for-lol/backend/configuration.ts";
import { createLogger } from "@scout-for-lol/backend/logger.ts";

const logger = createLogger("s3-client");

let cachedClient: S3Client | undefined;

/**
 * Creates an S3 client configured for the current environment.
 * Supports custom S3-compatible endpoints like SeaweedFS, MinIO, etc.
 *
 * Configuration is read from environment variables:
 * - S3_ENDPOINT: Custom S3 endpoint URL (e.g., https://seaweedfs.example.com:8333)
 * - S3_ACCESS_KEY_ID: Access key for authentication
 * - S3_SECRET_ACCESS_KEY: Secret key for authentication
 * - S3_REGION: AWS region (default: us-east-1)
 * - S3_FORCE_PATH_STYLE: Use path-style URLs (required for most S3-compatible services)
 *
 * If no custom endpoint is configured, falls back to AWS default credential chain.
 */
export function createS3Client(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  const endpoint = configuration.s3Endpoint;
  const accessKeyId = configuration.s3AccessKeyId;
  const secretAccessKey = configuration.s3SecretAccessKey;
  const region = configuration.s3Region ?? "us-east-1";
  const forcePathStyle = configuration.s3ForcePathStyle;

  // Check if custom endpoint is configured
  if (endpoint) {
    logger.info(`[S3Client] 🔗 Using custom S3 endpoint: ${endpoint}`);

    if (!accessKeyId || !secretAccessKey) {
      logger.warn(
        "[S3Client] ⚠️  S3_ENDPOINT is set but credentials are missing. " +
          "Set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY for authenticated access.",
      );
    }

    cachedClient = new S3Client({
      endpoint,
      region,
      forcePathStyle,
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
    });
  } else {
    // Fall back to default AWS credential chain
    logger.info("[S3Client] 🔗 Using default AWS S3 configuration");
    cachedClient = new S3Client({
      region,
    });
  }

  return cachedClient;
}

/**
 * Reset the cached S3 client. Useful for testing.
 */
export function resetS3Client(): void {
  cachedClient = undefined;
}
