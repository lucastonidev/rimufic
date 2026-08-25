// src/router/api/public.route.js
import express from "express";

const router = express.Router();

// Rota de status/boas-vindas da API Pública
router.get("/status", (req, res) => {
  res.status(200).json({
    success: true,
    message: "A magia da API pública está fluindo!",
  });
});

// Futuramente, você pode adicionar endpoints como:
// router.get("/stories", apiGetPublicStories);

export { router as publicApiRoutes };
