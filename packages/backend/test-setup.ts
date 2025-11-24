/**
 * Test setup file - loaded before all tests
 * This ensures environment variables are set before any modules are loaded
 */

Bun.env.NODE_ENV = "test";
Bun.env["S3_BUCKET_NAME"] = "test-bucket";
