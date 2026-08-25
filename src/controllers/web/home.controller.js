// src/controllers/web/home.controller.js
import * as webService from "../../services/web.service.js";

export const renderHome = async (req, res, next) => {
  try {
    const stories = await webService.getHomeStories();
    res.render("index", { stories });
  } catch (err) {
    next(err);
  }
};
