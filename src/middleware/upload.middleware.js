// src/middleware/upload.middleware.js
import multer from "multer";
import { AppError } from "../utils/AppError.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Apenas arquivos de imagem são permitidos!", 400), false);
  }
};

export const uploadCover = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // Limite de 4MB para compatibilidade com Vercel
  fileFilter,
}).single("coverFile");
