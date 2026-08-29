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

  const wantsJson =
    req.originalUrl.startsWith("/api/") ||
    req.xhr ||
    req.accepts(["json", "html"]) === "json";

  if (wantsJson) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status || "error",
      message: err.message,
      // Dica: Em desenvolvimento, mandamos o "stack" para ajudar a debugar. Em produção, escondemos!
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
  }

  const safeMessage = String(err.message)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  return res.status(err.statusCode).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Erro ${err.statusCode}</title>
      </head>
      <body style="font-family: Inter, sans-serif; background: #120c18; color: #f3f4f6; margin: 0; padding: 2rem;">
        <h1 style="margin-top: 0;">Erro ${err.statusCode}</h1>
        <p>${safeMessage}</p>
      </body>
    </html>
  `);
};
