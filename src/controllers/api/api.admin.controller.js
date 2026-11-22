// src/controllers/api/api.admin.controller.js
import * as userService from "../../services/user.service.js";
import * as storyService from "../../services/story.service.js";
import { AppError } from "../../utils/AppError.js";

// --- USUÁRIOS (API) ---
export const apiInviteUser = async (req, res, next) => {
  try {
    const { fullName, email, role, password } = req.body;
    if (!email || !fullName || !password)
      return next(
        new AppError("Nome, e-mail e senha são obrigatórios.", 400),
      );
    await userService.inviteNewUser(email, fullName, role, password);
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
    const {
      title,
      author,
      genre,
      synopsis,
      coverUrl,
      content,
      format = "text",
      pdfUrl,
      sourceType = "original",
      sourceUrl,
    } = req.body;

    const coverFile = req.files?.coverFile?.[0] || req.file;
    const pdfFile = req.files?.pdfFile?.[0];

    if (!title) {
      return next(new AppError("O título da obra é obrigatório.", 400));
    }

    if (format === "pdf" && !pdfFile && (!pdfUrl || !pdfUrl.trim())) {
      return next(new AppError("Para obras em PDF, selecione o arquivo ou informe o link.", 400));
    }

    if (format === "text" && (!content || content === "<br>")) {
      return next(new AppError("O conteúdo da história não pode estar vazio.", 400));
    }

    const { markdownUrl, finalCoverUrl } =
      await storyService.processAndUploadContent(
        title,
        author,
        genre,
        synopsis,
        coverUrl,
        content,
        coverFile,
        false,
        format,
        pdfFile,
        pdfUrl,
        sourceType,
        sourceUrl,
      );

    await storyService.insertStoryToDatabase(
      {
        title,
        author: author || "Grão-Mestre",
        genre: genre || "folclore",
        synopsis,
        cover_url: finalCoverUrl,
        content: markdownUrl,
        source_type: sourceType || "original",
        source_url: sourceUrl || "",
        format: format || "text",
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
    const {
      title,
      author,
      genre,
      synopsis,
      coverUrl,
      content,
      format = "text",
      pdfUrl,
      sourceType = "original",
      sourceUrl,
    } = req.body;

    const coverFile = req.files?.coverFile?.[0] || req.file;
    const pdfFile = req.files?.pdfFile?.[0];

    if (!title) {
      return next(new AppError("O título da obra é obrigatório.", 400));
    }

    const { markdownUrl, finalCoverUrl } =
      await storyService.processAndUploadContent(
        title,
        author,
        genre,
        synopsis,
        coverUrl,
        content,
        coverFile,
        true,
        format,
        pdfFile,
        pdfUrl,
        sourceType,
        sourceUrl,
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
        source_type: sourceType || "original",
        source_url: sourceUrl || "",
        format: format || "text",
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
