import "dotenv/config";
import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime-types";
import s3 from "../lib/aws";

export type TFile = {
  filename: string;
  buffer: Buffer<ArrayBufferLike>;
};

const isProd = process.env.NODE_ENV === "production";

const bucketName =
  process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || "";

const region = process.env.AWS_REGION || "";

if (!bucketName) {
  throw new Error("S3_BUCKET_NAME or AWS_S3_BUCKET is missing");
}

if (!region) {
  throw new Error("AWS_REGION is missing");
}

/**
 * Gets the MIME type for an uploaded file.
 */
function getContentType(filename: string): string {
  if (filename.toLowerCase().endsWith(".svg")) {
    return "image/svg+xml";
  }

  return mime.lookup(filename) || "application/octet-stream";
}

/**
 * Removes unsafe filename characters.
 */
function sanitizeFilename(filename: string): string {
  return path
    .basename(filename)
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Properly encodes each part of an S3 object key without encoding "/".
 */
function encodeS3Key(key: string): string {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

/**
 * Creates the equivalent of the old AWS SDK v2 upload Location.
 *
 * This URL is directly accessible only when the bucket/object permissions
 * allow public access.
 */
function getS3Url(key: string): string {
  return `https://${bucketName}.s3.${region}.amazonaws.com/` + encodeS3Key(key);
}

/**
 * Uploads a Buffer to S3 and returns its S3 URL.
 */
async function uploadBufferToS3(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentDisposition: "inline",
    }),
  );

  return getS3Url(key);
}

/**
 * Extracts an object key from an S3 URL.
 *
 * Supports:
 * - Virtual-hosted URLs
 * - Path-style URLs
 * - s3://bucket/key URLs
 */
function extractS3Key(filePath: string): string | null {
  const value = filePath.trim();

  if (!value) {
    return null;
  }

  if (value.startsWith("s3://")) {
    const withoutProtocol = value.slice("s3://".length);
    const slashIndex = withoutProtocol.indexOf("/");

    if (slashIndex === -1) {
      return null;
    }

    const bucket = withoutProtocol.slice(0, slashIndex);
    const key = withoutProtocol.slice(slashIndex + 1);

    return bucket === bucketName ? safeDecodeURIComponent(key) : null;
  }

  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return null;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const pathname = safeDecodeURIComponent(url.pathname.replace(/^\/+/, ""));

    /*
     * Virtual-hosted S3 URL:
     * https://bucket.s3.region.amazonaws.com/key
     */
    if (
      hostname === `${bucketName}.s3.amazonaws.com` ||
      hostname.startsWith(`${bucketName}.s3.`) ||
      hostname.startsWith(`${bucketName}.s3-`)
    ) {
      return pathname;
    }

    /*
     * Path-style S3 URL:
     * https://s3.region.amazonaws.com/bucket/key
     */
    if (
      hostname === "s3.amazonaws.com" ||
      hostname.startsWith("s3.") ||
      hostname.startsWith("s3-")
    ) {
      const [urlBucket, ...keyParts] = pathname.split("/");

      if (urlBucket === bucketName) {
        return keyParts.join("/");
      }
    }

    return null;
  } catch {
    return null;
  }
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Uploads an in-memory Buffer to S3.
 */
export const uploadFileByBuffer = async (
  buffer: Buffer,
  filename: string,
): Promise<string> => {
  const safeFilename = sanitizeFilename(filename);
  const s3Key = `${randomUUID()}_${safeFilename}`;
  const contentType = getContentType(filename);

  return uploadBufferToS3(buffer, s3Key, contentType);
};

/**
 * Saves an uploaded Buffer temporarily before uploading it.
 */
export const saveFileToTmp = ({ filename, buffer }: TFile): string => {
  const safeFilename = sanitizeFilename(filename);
  const uniqueName = `${randomUUID()}_${safeFilename}`;

  const tmpDirectory = isProd ? "/tmp" : path.join(process.cwd(), "tmp");

  const temporaryPath = path.join(tmpDirectory, uniqueName);

  if (!existsSync(tmpDirectory)) {
    mkdirSync(tmpDirectory, {
      recursive: true,
    });
  }

  writeFileSync(temporaryPath, buffer);
  return isProd ? temporaryPath : `/tmp/${uniqueName}`;
};

/**
 * Downloads an existing remote file and uploads a duplicated copy to S3.
 */
export const duplicateFileS3 = async (filePath: string): Promise<string> => {
  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(
      `Failed to download file: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  const pathname = (() => {
    try {
      return new URL(filePath).pathname;
    } catch {
      return filePath;
    }
  })();

  const filename = sanitizeFilename(path.basename(pathname)) || "file";

  const s3Key = `${randomUUID()}_${filename}`;
  const contentType =
    response.headers.get("content-type") || getContentType(filename);

  return uploadBufferToS3(buffer, s3Key, contentType);
};

/**
 * Uploads a temporary file and removes the local temporary copy
 * after the upload succeeds.
 */
export const uploadFile = async (tmpFilePath: string): Promise<string> => {
  const realFilePath = isProd
    ? tmpFilePath
    : path.join(process.cwd(), tmpFilePath);

  if (!existsSync(realFilePath)) {
    console.error(`File path does not exist: ${realFilePath}`);

    return "";
  }

  const buffer = readFileSync(realFilePath);
  const filename = path.basename(realFilePath);
  const contentType = getContentType(filename);

  const uploadedUrl = await uploadBufferToS3(buffer, filename, contentType);

  if (existsSync(realFilePath)) {
    unlinkSync(realFilePath);
  }

  return uploadedUrl;
};

/**
 * Uploads a file using its actual local filesystem path.
 */
export const uploadFileRealPath = async (filePath: string): Promise<string> => {
  if (!existsSync(filePath)) {
    throw new Error(`File path does not exist: ${filePath}`);
  }

  const buffer = readFileSync(filePath);
  const filename = sanitizeFilename(path.basename(filePath));

  const s3Key = `${randomUUID()}_${filename}`;
  const contentType = getContentType(filename);

  return uploadBufferToS3(buffer, s3Key, contentType);
};

export const removeFiles = async (
  filePaths?: Array<string | null>,
): Promise<void> => {
  if (!filePaths?.length) {
    return;
  }

  await Promise.all(filePaths.map((filePath) => removeFile(filePath)));
};

/**
 * Removes an S3 object when given one of this bucket's S3 URLs.
 * Otherwise, it treats the value as a local path.
 */
export const removeFile = async (filePath: string | null): Promise<void> => {
  if (!filePath?.trim()) {
    return;
  }

  const s3Key = extractS3Key(filePath);

  if (s3Key) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      }),
    );

    return;
  }

  if (/^https?:\/\//i.test(filePath)) {
    console.warn(`Skipped non-S3 remote URL: ${filePath}`);

    return;
  }

  const realFilePath = isProd
    ? filePath
    : path.isAbsolute(filePath) && !filePath.startsWith("/tmp/")
      ? filePath
      : path.join(process.cwd(), filePath);

  if (existsSync(realFilePath)) {
    unlinkSync(realFilePath);
  }
};
