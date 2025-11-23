/**
 * Simple R2/S3 list endpoint
 */
import type { APIRoute } from "astro";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { z } from "zod";

// Mark this route as server-rendered
export const prerender = false;

const RequestSchema = z.object({
  bucketName: z.string(),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  region: z.string(),
  endpoint: z.string().optional(),
  prefix: z.string(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: unknown = await request.json();
    const result = RequestSchema.safeParse(body);

    if (!result.success) {
      return new Response(JSON.stringify({ error: "Invalid request body", details: result.error.message }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const { bucketName, accessKeyId, secretAccessKey, region, endpoint, prefix } = result.data;

    // Create S3 client
    const client = new S3Client({
      region,
      ...(endpoint ? { endpoint } : {}),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // List objects
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: 1000,
    });

    const response = await client.send(command);

    return new Response(
      JSON.stringify({
        contents: response.Contents ?? [],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes
        },
      },
    );
  } catch (error) {
    console.error("R2 list error:", error);
    const ErrorSchema = z.object({ message: z.string() });
    const result = ErrorSchema.safeParse(error);
    const message = result.success ? result.data.message : "Failed to list objects";
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
};

export const OPTIONS: APIRoute = () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
};
