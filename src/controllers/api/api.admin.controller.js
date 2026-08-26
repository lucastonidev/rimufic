// src/controllers/api/api.admin.controller.js
import * as userService from "../../services/user.service.js";
import * as storyService from "../../services/story.service.js";
import { AppError } from "../../utils/AppError.js";

// --- USUÁRIOS (API) ---
export const apiInviteUser = async (req, res, next) => {
  try {
    const { fullName, email, role } = req.body;
    if (!email || !fullName)
      return next(new AppError("Nome e e-mail são obrigatórios.", 400));
    await userService.inviteNewUser(email, fullName, role);
    res
      .status(201)
      .json({ success: true, message: "Membro adicionado com sucesso!" });
  } catch (err) {
    next(err);
  }
};

export const apiUpdateUserRole = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id)
      return next(new AppError("Não pode alterar próprias permissões.", 403));

    const { role, password, fullName, email } = req.body;

    await userService.updateUserRole(
      req.params.id,
      role,
      password,
      fullName,
      email,
    );

    res
      .status(200)
      .json({ success: true, message: "Usuário atualizado com sucesso!" });
  } catch (err) {
    next(err);
  }
};

export const apiBanUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id)
      return next(new AppError("Ação não permitida.", 403));
    await userService.banUser(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Usuário banido do grimório." });
  } catch (err) {
    next(err);
  }
};

// --- OBRAS (API) ---
export const apiCreateStory = async (req, res, next) => {
  try {
    const { title, author, genre, synopsis, coverUrl, content } = req.body;
    if (!title || !content)
      return next(new AppError("Título e conteúdo são obrigatórios.", 400));

    const { markdownUrl, finalCoverUrl } =
      await storyService.processAndUploadContent(
        title,
        author,
        genre,
        synopsis,
        coverUrl,
        content,
        req.file,
        false,
      );
    await storyService.insertStoryToDatabase(
      {
        title,
        author: author || "Grão-Mestre",
        genre: genre || "folclore",
        synopsis,
        cover_url: finalCoverUrl,
        content: markdownUrl,
        user_id: req.user.id,
      },
      req.cookies.jwt_token,
    );

    res
      .status(201)
      .json({ success: true, message: "Obra publicada com sucesso!" });
  } catch (err) {
    next(err);
  }
};

export const apiUpdateStory = async (req, res, next) => {
  try {
    const { title, author, genre, synopsis, coverUrl, content } = req.body;
    if (!title || !content)
      return next(new AppError("Título e conteúdo são obrigatórios.", 400));

    const { markdownUrl, finalCoverUrl } =
      await storyService.processAndUploadContent(
        title,
        author,
        genre,
        synopsis,
        coverUrl,
        content,
        req.file,
        true,
      );
    await storyService.updateStoryInDatabase(
      req.params.id,
      {
        title,
        author: author || "Grão-Mestre",
        genre: genre || "folclore",
        synopsis,
        cover_url: finalCoverUrl,
        content: markdownUrl,
      },
      req.cookies.jwt_token,
    );

    res
      .status(200)
      .json({ success: true, message: "Obra atualizada com sucesso!" });
  } catch (err) {
    next(err);
  }
};

export const apiDeleteStory = async (req, res, next) => {
  try {
    await storyService.deleteStoryFromDatabase(
      req.params.id,
      req.cookies.jwt_token,
    );
    res
      .status(200)
      .json({ success: true, message: "Obra apagada com sucesso!" });
  } catch (err) {
    next(err);
  }
};
