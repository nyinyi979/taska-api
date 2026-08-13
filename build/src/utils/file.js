"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFile = exports.removeFiles = exports.uploadFileRealPath = exports.uploadFile = exports.duplicateFileS3 = exports.saveFileToTmp = exports.uploadFileByBuffer = void 0;
require("dotenv/config");
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const client_s3_1 = require("@aws-sdk/client-s3");
const mime_types_1 = __importDefault(require("mime-types"));
const aws_1 = __importDefault(require("../lib/aws"));
const isProd = process.env.NODE_ENV === "production";
const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || "";
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
function getContentType(filename) {
    if (filename.toLowerCase().endsWith(".svg")) {
        return "image/svg+xml";
    }
    return mime_types_1.default.lookup(filename) || "application/octet-stream";
}
/**
 * Removes unsafe filename characters.
 */
function sanitizeFilename(filename) {
    return node_path_1.default
        .basename(filename)
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
}
/**
 * Properly encodes each part of an S3 object key without encoding "/".
 */
function encodeS3Key(key) {
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
function getS3Url(key) {
    return `https://${bucketName}.s3.${region}.amazonaws.com/` + encodeS3Key(key);
}
/**
 * Uploads a Buffer to S3 and returns its S3 URL.
 */
async function uploadBufferToS3(buffer, key, contentType) {
    await aws_1.default.send(new client_s3_1.PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentDisposition: "inline",
    }));
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
function extractS3Key(filePath) {
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
        if (hostname === `${bucketName}.s3.amazonaws.com` ||
            hostname.startsWith(`${bucketName}.s3.`) ||
            hostname.startsWith(`${bucketName}.s3-`)) {
            return pathname;
        }
        /*
         * Path-style S3 URL:
         * https://s3.region.amazonaws.com/bucket/key
         */
        if (hostname === "s3.amazonaws.com" ||
            hostname.startsWith("s3.") ||
            hostname.startsWith("s3-")) {
            const [urlBucket, ...keyParts] = pathname.split("/");
            if (urlBucket === bucketName) {
                return keyParts.join("/");
            }
        }
        return null;
    }
    catch {
        return null;
    }
}
function safeDecodeURIComponent(value) {
    try {
        return decodeURIComponent(value);
    }
    catch {
        return value;
    }
}
/**
 * Uploads an in-memory Buffer to S3.
 */
const uploadFileByBuffer = async (buffer, filename) => {
    const safeFilename = sanitizeFilename(filename);
    const s3Key = `${(0, node_crypto_1.randomUUID)()}_${safeFilename}`;
    const contentType = getContentType(filename);
    return uploadBufferToS3(buffer, s3Key, contentType);
};
exports.uploadFileByBuffer = uploadFileByBuffer;
/**
 * Saves an uploaded Buffer temporarily before uploading it.
 */
const saveFileToTmp = ({ filename, buffer }) => {
    const safeFilename = sanitizeFilename(filename);
    const uniqueName = `${(0, node_crypto_1.randomUUID)()}_${safeFilename}`;
    const tmpDirectory = isProd ? "/tmp" : node_path_1.default.join(process.cwd(), "tmp");
    const temporaryPath = node_path_1.default.join(tmpDirectory, uniqueName);
    if (!(0, node_fs_1.existsSync)(tmpDirectory)) {
        (0, node_fs_1.mkdirSync)(tmpDirectory, {
            recursive: true,
        });
    }
    (0, node_fs_1.writeFileSync)(temporaryPath, buffer);
    return isProd ? temporaryPath : `/tmp/${uniqueName}`;
};
exports.saveFileToTmp = saveFileToTmp;
/**
 * Downloads an existing remote file and uploads a duplicated copy to S3.
 */
const duplicateFileS3 = async (filePath) => {
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const pathname = (() => {
        try {
            return new URL(filePath).pathname;
        }
        catch {
            return filePath;
        }
    })();
    const filename = sanitizeFilename(node_path_1.default.basename(pathname)) || "file";
    const s3Key = `${(0, node_crypto_1.randomUUID)()}_${filename}`;
    const contentType = response.headers.get("content-type") || getContentType(filename);
    return uploadBufferToS3(buffer, s3Key, contentType);
};
exports.duplicateFileS3 = duplicateFileS3;
/**
 * Uploads a temporary file and removes the local temporary copy
 * after the upload succeeds.
 */
const uploadFile = async (tmpFilePath) => {
    const realFilePath = isProd
        ? tmpFilePath
        : node_path_1.default.join(process.cwd(), tmpFilePath);
    if (!(0, node_fs_1.existsSync)(realFilePath)) {
        console.error(`File path does not exist: ${realFilePath}`);
        return "";
    }
    const buffer = (0, node_fs_1.readFileSync)(realFilePath);
    const filename = node_path_1.default.basename(realFilePath);
    const contentType = getContentType(filename);
    const uploadedUrl = await uploadBufferToS3(buffer, filename, contentType);
    if ((0, node_fs_1.existsSync)(realFilePath)) {
        (0, node_fs_1.unlinkSync)(realFilePath);
    }
    return uploadedUrl;
};
exports.uploadFile = uploadFile;
/**
 * Uploads a file using its actual local filesystem path.
 */
const uploadFileRealPath = async (filePath) => {
    if (!(0, node_fs_1.existsSync)(filePath)) {
        throw new Error(`File path does not exist: ${filePath}`);
    }
    const buffer = (0, node_fs_1.readFileSync)(filePath);
    const filename = sanitizeFilename(node_path_1.default.basename(filePath));
    const s3Key = `${(0, node_crypto_1.randomUUID)()}_${filename}`;
    const contentType = getContentType(filename);
    return uploadBufferToS3(buffer, s3Key, contentType);
};
exports.uploadFileRealPath = uploadFileRealPath;
const removeFiles = async (filePaths) => {
    if (!(filePaths === null || filePaths === void 0 ? void 0 : filePaths.length)) {
        return;
    }
    await Promise.all(filePaths.map((filePath) => (0, exports.removeFile)(filePath)));
};
exports.removeFiles = removeFiles;
/**
 * Removes an S3 object when given one of this bucket's S3 URLs.
 * Otherwise, it treats the value as a local path.
 */
const removeFile = async (filePath) => {
    if (!(filePath === null || filePath === void 0 ? void 0 : filePath.trim())) {
        return;
    }
    const s3Key = extractS3Key(filePath);
    if (s3Key) {
        await aws_1.default.send(new client_s3_1.DeleteObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
        }));
        return;
    }
    if (/^https?:\/\//i.test(filePath)) {
        console.warn(`Skipped non-S3 remote URL: ${filePath}`);
        return;
    }
    const realFilePath = isProd
        ? filePath
        : node_path_1.default.isAbsolute(filePath) && !filePath.startsWith("/tmp/")
            ? filePath
            : node_path_1.default.join(process.cwd(), filePath);
    if ((0, node_fs_1.existsSync)(realFilePath)) {
        (0, node_fs_1.unlinkSync)(realFilePath);
    }
};
exports.removeFile = removeFile;
