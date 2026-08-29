// src/controllers/web/read.controller.js
import * as webService from "../../services/web.service.js";

export const renderReadStory = async (req, res, next) => {
  try {
    const { story, htmlContent, readingTime } =
      await webService.getStoryWithContent(req.params.id);
    res.render("read", { story, htmlContent, readingTime });
  } catch (err) {
    next(err);
  }
};

export const redirectRandomStory = async (req, res, next) => {
  try {
    const randomId = await webService.getRandomStoryId();

    // Se o banco estiver totalmente vazio, apenas volta para o início
    if (!randomId) {
      return res.redirect("/");
    }

    // A mágica: joga o usuário para a rota de leitura com o ID sorteado!
    res.redirect(`/read/${randomId}`);
  } catch (err) {
    next(err);
  }
};