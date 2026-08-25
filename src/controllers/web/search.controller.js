// src/controllers/web/search.controller.js
import * as webService from "../../services/web.service.js";

export const renderSearch = async (req, res, next) => {
  try {
    const { q, genre, sort } = req.query;
    const stories = await webService.searchStories(q, genre, sort);
    res.render("search", { stories, query: req.query });
  } catch (err) {
    next(err);
  }
};
