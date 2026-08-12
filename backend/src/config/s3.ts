import 'dotenv/config';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../utils/AppError';

const requiredEnv = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
] as const;

export const assertS3Config = () => {
  const missing = requiredEnv.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new AppError(
      `S3 is not configured. Missing environment variables: ${missing.join(', ')}`,
      500
    );
  }
};

export const getS3Bucket = () => {
  assertS3Config();
  return process.env.AWS_S3_BUCKET_NAME as string;
};

export const getS3Region = () => {
  assertS3Config();
  return process.env.AWS_REGION as string;
};

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const buildS3PublicUrl = (key: string) => {
  const bucket = getS3Bucket();
  const region = getS3Region();
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

export const getSignedDownloadUrl = async (key: string, expiresInSeconds = 3600) => {
  assertS3Config();
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: getS3Bucket(), Key: key }),
    { expiresIn: expiresInSeconds }
  );
};

export const deleteS3Object = async (key: string) => {
  assertS3Config();
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: getS3Bucket(),
      Key: key,
    })
  );
};
