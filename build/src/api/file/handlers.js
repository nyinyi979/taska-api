"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadFile = exports.handleCreateBatchFiles = exports.handleFileUploadTmp = void 0;
const handleFormData_1 = __importDefault(require("../../utils/handleFormData"));
const messages_1 = require("../messages");
const controllers_1 = require("./controllers");
const handleFileUploadTmp = async (req, res) => {
    try {
        const { imageBuffer, body } = await (0, handleFormData_1.default)(req.parts());
        if (!imageBuffer) {
            return res
                .status(400)
                .send({ ...messages_1.messages.schemaError, message: "File is required." });
        }
        const result = await (0, controllers_1.createFile)({
            buffer: imageBuffer,
            filename: body.image.filename,
        });
        return res.code(201).send({
            ...messages_1.messages.createOk,
            data: { url: result, filename: body.image.filename },
        });
    }
    catch (err) {
        throw err;
    }
};
exports.handleFileUploadTmp = handleFileUploadTmp;
const handleCreateBatchFiles = async (req, res) => {
    try {
        const files = [];
        for await (const part of req.parts()) {
            if (part.type === "file" && part.fieldname === "file") {
                files.push({
                    filename: part.filename,
                    buffer: await part.toBuffer(),
                });
            }
        }
        if (!files.length) {
            return res.status(400).send({
                ...messages_1.messages.schemaError,
                message: "At least one file is required.",
            });
        }
        const result = await (0, controllers_1.createBatchFiles)(files);
        return res.code(201).send({ ...messages_1.messages.createOk, data: result });
    }
    catch (err) {
        throw err;
    }
};
exports.handleCreateBatchFiles = handleCreateBatchFiles;
const handleUploadFile = async (req, res) => {
    try {
        const result = await (0, controllers_1.uploadFile)(req.body.url);
        return res.code(201).send({
            ...messages_1.messages.createOk,
            data: { url: result },
        });
    }
    catch (err) {
        throw err;
    }
};
exports.handleUploadFile = handleUploadFile;
