"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handlers_1 = require("./handlers");
const schemas_1 = require("./schemas");
const auth_1 = require("../../utils/auth");
const fileRoutes = async (app) => {
    app.post("/", {
        preHandler: auth_1.authenticate,
        schema: { tags: ["Files"], summary: "Upload a temporary file" },
        handler: handlers_1.handleFileUploadTmp,
    });
    app.post("/batch", {
        preHandler: auth_1.authenticate,
        schema: { tags: ["Files"], summary: "Upload temporary files" },
        handler: handlers_1.handleCreateBatchFiles,
    });
    app.post("/upload", {
        preHandler: auth_1.authenticate,
        schema: {
            tags: ["Files"],
            summary: "Move a temporary file to permanent storage",
            body: schemas_1.fileUrlBodySchema,
        },
        handler: handlers_1.handleUploadFile,
    });
};
exports.default = fileRoutes;
