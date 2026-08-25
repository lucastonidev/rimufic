// src/middleware/error.middleware.js
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Erro interno no servidor.";

  // TRADUTOR DINÂMICO DE ERROS DO BANCO (Supabase/PostgreSQL)
  // Exemplo: 23505 é o código do PostgreSQL para "Chave Única Duplicada"
  if (err.code === "23505") {
    err.statusCode = 409; // 409 Conflict
    err.message = "Já existe um registro com este nome no sistema.";
  }

  // Exemplo: 23503 é Violação de Chave Estrangeira
  if (err.code === "23503") {
    err.statusCode = 400;
    err.message = "A operação falhou porque a referência não existe no banco.";
  }

  // Resposta final que vai para o Front-End
  res.status(err.statusCode).json({
    success: false,
    status: err.status || "error",
    message: err.message,
    // Dica: Em desenvolvimento, mandamos o "stack" para ajudar a debugar. Em produção, escondemos!
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};
