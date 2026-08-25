// src/middleware/rateLimit.middleware.js
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limita cada IP a 5 tentativas por janela de tempo
  message:
    "Muitas tentativas de login a partir deste IP. Por favor, tente novamente após 15 minutos.",
  standardHeaders: true, // Retorna os limites nos cabeçalhos `RateLimit-*`
  legacyHeaders: false, // Desabilita os cabeçalhos `X-RateLimit-*`
});
