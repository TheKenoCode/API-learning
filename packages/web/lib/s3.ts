import AWS from "aws-sdk";

// Configure S3 client for MinIO
const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
  secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin123",
  region: process.env.S3_REGION || "us-east-1",
  s3ForcePathStyle: true, // Required for MinIO
  signatureVersion: "v4",
});

export const BUCKETS = {
  IMAGES: process.env.S3_BUCKET_IMAGES || "carhub-images",
  MODELS: process.env.S3_BUCKET_MODELS || "carhub-models", 
  DOCUMENTS: process.env.S3_BUCKET_DOCUMENTS || "carhub-documents",
} as const;

/**
 * Generate a presigned URL for file upload
 */
export async function generatePresignedUploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  try {
    const params = {
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn,
    };

    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
    return uploadUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate upload URL");
  }
}

/**
 * Generate a presigned URL for file download
 */
export async function generatePresignedDownloadUrl(
  bucket: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn,
    };

    const downloadUrl = await s3.getSignedUrlPromise("getObject", params);
    return downloadUrl;
  } catch (error) {
    console.error("Error generating presigned download URL:", error);
    throw new Error("Failed to generate download URL");
  }
}

/**
 * Upload a file directly to S3 (server-side)
 */
export async function uploadFile(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<AWS.S3.ManagedUpload.SendData> {
  try {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    };

    const result = await s3.upload(params).promise();
    return result;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(bucket: string, key: string): Promise<void> {
  try {
    const params = {
      Bucket: bucket,
      Key: key,
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("Failed to delete file");
  }
}

/**
 * Helper function to generate a unique file key
 */
export function generateFileKey(
  userId: string,
  originalName: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const fileExtension = originalName.split(".").pop();
  
  const baseKey = `${userId}/${timestamp}-${randomString}`;
  const key = fileExtension ? `${baseKey}.${fileExtension}` : baseKey;
  
  return prefix ? `${prefix}/${key}` : key;
}

// TODO: Add image optimization utilities
// TODO: Add 3D model validation
// TODO: Add progress tracking for large uploads 