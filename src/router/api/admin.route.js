// src/router/api/admin.route.js
import express from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth.middleware.js";
import { uploadCover } from "../../middleware/upload.middleware.js";
import {
  apiCreateStory,
  apiUpdateStory,
  apiDeleteStory,
  apiInviteUser,
  apiUpdateUserRole,
  apiBanUser,
} from "../../controllers/api/api.admin.controller.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { storySchema } from "../../schemas/story.schema.js";

const router = express.Router();
router.use(requireAuth);

// --- Endpoints de Obras ---
router.post(
  "/stories",
  uploadCover,
  validateRequest(storySchema),
  apiCreateStory,
);

router.put(
  "/stories/:id",
  uploadCover,
  validateRequest(storySchema),
  apiUpdateStory,
);

router.delete("/stories/:id", apiDeleteStory);

// --- Endpoints de Usuários ---
// (Faltavam as rotas de criar e editar usuário que estavam no controller, deixei preparadas caso precise)
router.post("/users", requireAdmin, apiInviteUser);
router.put("/users/:id/role", requireAdmin, apiUpdateUserRole);
router.delete("/users/:id", requireAdmin, apiBanUser);

export { router as adminApiRoutes };
