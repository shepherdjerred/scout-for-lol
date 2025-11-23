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
  continuationToken: z.string().optional(),
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

    const { bucketName, accessKeyId, secretAccessKey, region, endpoint, prefix, continuationToken } = result.data;

    // Create S3 client
    const client = new S3Client({
      region,
      ...(endpoint ? { endpoint } : {}),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // List all objects with pagination support
    type S3Object = {
      Key?: string | undefined;
      LastModified?: Date | undefined;
      ETag?: string | undefined;
      Size?: number | undefined;
      StorageClass?: string | undefined;
    };
    const allContents: S3Object[] = [];
    let nextToken: string | undefined = continuationToken;
    let iterations = 0;
    const maxIterations = 10; // Max 10k objects (10 * 1000)

    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
        ...(nextToken ? { ContinuationToken: nextToken } : {}),
      });

      const response = await client.send(command);

      if (response.Contents) {
        allContents.push(...response.Contents);
      }

      nextToken = response.NextContinuationToken;
      iterations++;
    } while (nextToken && iterations < maxIterations);

    return new Response(
      JSON.stringify({
        contents: allContents,
        isTruncated: nextToken !== undefined,
        nextContinuationToken: nextToken,
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
