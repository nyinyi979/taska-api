import "dotenv/config";
import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!region) {
  throw new Error("AWS_REGION is missing");
}

if (!accessKeyId) {
  throw new Error("AWS_ACCESS_KEY_ID is missing");
}

if (!secretAccessKey) {
  throw new Error("AWS_SECRET_ACCESS_KEY is missing");
}

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export default s3;
