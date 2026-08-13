import { FastifyReply, FastifyRequest } from "fastify";
import handleFormData from "../../utils/handleFormData";
import { TFile } from "../../utils/file";
import { messages } from "../messages";
import { TypeBoxRequest } from "../request";
import { createBatchFiles, createFile, uploadFile } from "./controllers";
import { fileUrlBodySchema } from "./schemas";

export const handleFileUploadTmp = async (
  req: FastifyRequest,
  res: FastifyReply,
) => {
  try {
    const { imageBuffer, body } = await handleFormData(req.parts());
    if (!imageBuffer) {
      return res
        .status(400)
        .send({ ...messages.schemaError, message: "File is required." });
    }
    const result = await createFile({
      buffer: imageBuffer,
      filename: body.image.filename,
    });
    return res.code(201).send({
      ...messages.createOk,
      data: { url: result, filename: body.image.filename },
    });
  } catch (err) {
    throw err;
  }
};

export const handleCreateBatchFiles = async (
  req: FastifyRequest,
  res: FastifyReply,
) => {
  try {
    const files: TFile[] = [];
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
        ...messages.schemaError,
        message: "At least one file is required.",
      });
    }
    const result = await createBatchFiles(files);
    return res.code(201).send({ ...messages.createOk, data: result });
  } catch (err) {
    throw err;
  }
};

export const handleUploadFile = async (
  req: TypeBoxRequest<{ body: typeof fileUrlBodySchema }>,
  res: FastifyReply,
) => {
  try {
    const result = await uploadFile(req.body.url);
    return res.code(201).send({
      ...messages.createOk,
      data: { url: result },
    });
  } catch (err) {
    throw err;
  }
};
