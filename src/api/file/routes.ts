import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import {
  handleCreateBatchFiles,
  handleFileUploadTmp,
  handleUploadFile,
} from "./handlers";
import { fileUrlBodySchema } from "./schemas";
import { authenticate } from "../../utils/auth";

const fileRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post("/", {
    preHandler: authenticate,
    schema: { tags: ["Files"], summary: "Upload a temporary file" },
    handler: handleFileUploadTmp,
  });
  app.post("/batch", {
    preHandler: authenticate,
    schema: { tags: ["Files"], summary: "Upload temporary files" },
    handler: handleCreateBatchFiles,
  });
  app.post("/upload", {
    preHandler: authenticate,
    schema: {
      tags: ["Files"],
      summary: "Move a temporary file to permanent storage",
      body: fileUrlBodySchema,
    },
    handler: handleUploadFile,
  });
};

export default fileRoutes;
