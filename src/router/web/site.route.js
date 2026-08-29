// src/router/web/site.route.js
import express from "express";
import { checkUser } from "../../middleware/auth.middleware.js";
import { loginLimiter } from "../../middleware/rateLimit.middleware.js";

// Controladores
import { renderHome } from "../../controllers/web/home.controller.js";
import { renderSearch } from "../../controllers/web/search.controller.js";
import {
  renderReadStory,
  redirectRandomStory,
} from "../../controllers/web/read.controller.js";
import { renderLibrary } from "../../controllers/web/library.controller.js";
import {
  renderLogin,
  login,
  logout,
} from "../../controllers/auth.controller.js";

const router = express.Router();

// Middleware global para injetar o usuário nas views (se estiver logado)
router.use(checkUser);

// Rotas de Páginas Públicas
router.get("/", renderHome);
router.get("/search", renderSearch);
router.get("/read/:id", renderReadStory);
router.get("/library", renderLibrary);
router.get("/random", redirectRandomStory);
router.get("/prompt", (req, res) => {
  res.render("prompt");
});

// Rotas de Autenticação
router.get("/login", renderLogin);
router.post("/login", loginLimiter, login);
router.get("/logout", logout);

export { router as siteRoutes };
