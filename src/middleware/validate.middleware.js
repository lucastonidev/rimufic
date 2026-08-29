// src/middleware/validate.middleware.js
import { AppError } from "../utils/AppError.js";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // O Zod verifica os dados e remove campos não esperados
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      // Se falhar, formata as mensagens de erro do Zod para o usuário
      const issues = Array.isArray(error?.issues) ? error.issues : [];
      const errorMessages =
        issues.length > 0
          ? issues.map((issue) => issue.message).join(" | ")
          : "Dados inválidos enviados na requisição.";
      next(new AppError(errorMessages, 400));
    }
  };
};
