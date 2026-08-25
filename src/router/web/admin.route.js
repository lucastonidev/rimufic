// src/router/web/admin.route.js
import express from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth.middleware.js";
import {
  renderDashboard,
  renderManageUsers,
  renderManageStories,
  renderCreateStory,
  renderEditStory,
} from "../../controllers/admin/web.admin.controller.js";

const router = express.Router();

// Protege TODAS as rotas deste roteador
router.use(requireAuth);

// Páginas do Painel
router.get("/", renderDashboard);
router.get("/create-story", renderCreateStory);
router.get("/stories", renderManageStories);
router.get("/stories/edit/:id", renderEditStory);

// Rotas Restritas (Apenas Grão-Mestre/Admin)
router.get("/users", requireAdmin, renderManageUsers);

export { router as adminWebRoutes };
