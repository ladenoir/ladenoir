import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 is S3-compatible. These env vars must be set (see .env.example):
 *   R2_ACCOUNT_ID        - Cloudflare account id
 *   R2_ACCESS_KEY_ID     - R2 S3 API token access key
 *   R2_SECRET_ACCESS_KEY - R2 S3 API token secret
 *   R2_BUCKET            - bucket name (e.g. la-de-noir-media)
 *   R2_PUBLIC_BASE       - public base URL for objects
 *                          (the bucket's r2.dev URL or a custom domain)
 *
 * R2 must first be enabled in the Cloudflare dashboard and the bucket created.
 */

export function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_BASE
  );
}

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

/** Upload bytes to R2 and return the public URL. */
export async function uploadToR2(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string
): Promise<string> {
  if (!r2Configured()) {
    throw new Error(
      "R2 is not configured. Set R2_* env vars (see .env.example)."
    );
  }
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  const base = process.env.R2_PUBLIC_BASE!.replace(/\/$/, "");
  return `${base}/${key}`;
}
