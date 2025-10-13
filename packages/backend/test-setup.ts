/**
 * Test setup file - loaded before all tests
 * This ensures environment variables are set before any modules are loaded
 */

process.env.NODE_ENV = "test";
process.env["S3_BUCKET_NAME"] = "test-bucket";
