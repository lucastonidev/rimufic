// src/router/api.js
import express from "express";
import { adminApiRoutes } from "./api/admin.route.js";
import { publicApiRoutes } from "./api/public.route.js";

const router = express.Router();

// Repassa chamadas /api/v1/admin para o admin.route.js
router.use("/admin", adminApiRoutes);

// Repassa chamadas /api/v1/public para o public.route.js
router.use("/public", publicApiRoutes);

export { router as ApiRoutes };
