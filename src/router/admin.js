// src/router/admin.js
import express from "express";
import { adminWebRoutes } from "./web/admin.route.js";

const router = express.Router();

// Repassa todas as requisições de /admin para o roteador modular do painel
router.use("/", adminWebRoutes);

export { router as AdminRoutes };
