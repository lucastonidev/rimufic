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
