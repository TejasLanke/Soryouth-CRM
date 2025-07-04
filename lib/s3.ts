
import 'server-only';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
  throw new Error('Missing AWS S3 configuration in environment variables.');
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadFileToS3(buffer: Buffer, key: string, contentType: string) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  // Return the public URL of the uploaded file
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

export async function deleteFileFromS3(key: string) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const command = new DeleteObjectCommand(params);
  await s3Client.send(command);
  return { success: true };
}

export async function getFileFromS3(key: string): Promise<Buffer> {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const command = new GetObjectCommand(params);
  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error(`Failed to get file from S3: ${key}. Body is empty.`);
  }

  const byteArray = await response.Body.transformToByteArray();
  return Buffer.from(byteArray);
}

export async function getPresignedUrl(key: string) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };
  const command = new GetObjectCommand(params);
  // Generate a presigned URL that is valid for a short time (e.g., 5 minutes)
  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return url;
}
