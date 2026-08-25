// src/router/web.js
import express from "express";
import { siteRoutes } from "./web/site.route.js";

const router = express.Router();

// Repassa todas as requisições da raiz (/) para o novo roteador modularizado
router.use("/", siteRoutes);

export { router as webRoutes };
