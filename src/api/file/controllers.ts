import {
  removeFile,
  saveFileToTmp,
  TFile,
  uploadFile as promoteTemporaryFile,
} from "../../utils/file";

export const createFile = async (data: TFile) => saveFileToTmp(data);

export const createBatchFiles = async (data: TFile[]) =>
  Promise.all(data.map((item) => saveFileToTmp(item)));

export const uploadFile = async (data: string) => promoteTemporaryFile(data);

export const deleteFile = async (filePath: string) => removeFile(filePath);
