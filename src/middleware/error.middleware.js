// src/middleware/error.middleware.js
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Erro interno no servidor.";

  // TRADUTOR DINÂMICO DE ERROS DO BANCO (Supabase/PostgreSQL)
  if (err.code === "23505") {
    err.statusCode = 409; // 409 Conflict
    err.message = "Já existe um registro com este nome no sistema.";
  }

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
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
  }

  // Renderiza a página de erro mágica com o tema e mascote do Rimufic
  try {
    return res.status(err.statusCode).render("error", {
      statusCode: err.statusCode,
      message: err.message,
      stack: process.env.NODE_ENV !== "production" ? err.stack : null,
    });
  } catch (renderError) {
    // Fallback seguro caso haja falha ao renderizar a view
    console.error("Erro ao renderizar view de erro:", renderError);
    return res.status(err.statusCode).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Erro ${err.statusCode}</title>
        </head>
        <body style="font-family: sans-serif; background: #0B0710; color: #f3f4f6; padding: 3rem; text-align: center;">
          <h1>Erro ${err.statusCode}</h1>
          <p>${err.message}</p>
          <p><a href="/" style="color: #9D4EDD;">Voltar para o Início</a></p>
        </body>
      </html>
    `);
  }
};
