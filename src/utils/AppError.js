// src/utils/AppError.js
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // Se for erro 4xx (erro do usuário), é 'fail'. Se for 5xx (erro do servidor), é 'error'.
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Marca que foi um erro previsto pela nossa lógica

    Error.captureStackTrace(this, this.constructor);
  }
}
