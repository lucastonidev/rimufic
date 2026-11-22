// src/middleware/upload.middleware.js
import multer from "multer";
import { AppError } from "../utils/AppError.js";

const storage = multer.memoryStorage();

const storyFileFilter = (req, file, cb) => {
  if (file.fieldname === "coverFile") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError("Apenas arquivos de imagem são permitidos na capa!", 400), false);
    }
  } else if (file.fieldname === "pdfFile") {
    if (
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      cb(null, true);
    } else {
      cb(new AppError("Apenas arquivos PDF são permitidos para livros digitais!", 400), false);
    }
  } else {
    cb(null, true);
  }
};

export const uploadStoryFiles = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Limite de 25MB compatível com a API do GitHub
  fileFilter: storyFileFilter,
}).fields([
  { name: "coverFile", maxCount: 1 },
  { name: "pdfFile", maxCount: 1 },
]);

// Exportamos também com o nome original para manter compatibilidade reversa
export const uploadCover = uploadStoryFiles;
