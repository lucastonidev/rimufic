import { supabase } from "../config/supabase.js";
import axios from "axios";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html"; // <-- ADICIONADO

export const renderHome = async (req, res, next) => {
  try {
    const { data: stories, error } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) throw error;
    res.render("index", { stories });
  } catch (err) {
    next(err);
  }
};

export const renderReadStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: story, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !story) throw new Error("História não encontrada.");

    let htmlContent = "<p>O conteúdo desta lenda se perdeu no tempo...</p>";

    if (story.content && story.content.startsWith("http")) {
      try {
        const response = await axios.get(story.content);
        const parts = response.data.split("---");
        const pureMarkdown =
          parts.length > 2 ? parts.slice(2).join("---").trim() : response.data;

        // 1. Converte para HTML
        const rawHtml = marked.parse(pureMarkdown);

        // 2. MÁGICA DE SEGURANÇA: Limpa scripts maliciosos, mas mantém os estilos do seu editor
        htmlContent = sanitizeHtml(rawHtml, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            "img",
            "h1",
            "h2",
            "h3",
          ]),
          allowedAttributes: {
            "*": ["style", "class", "src", "alt", "href"],
          },
        });
      } catch (e) {
        console.error("Erro ao buscar o texto no GitHub:", e.message);
      }
    }

    const wordsCount = htmlContent
      .replace(/<[^>]*>?/gm, "")
      .split(/\s+/).length;
    const readingTime = Math.ceil(wordsCount / 200) || 1;

    res.render("read", { story, htmlContent, readingTime });
  } catch (err) {
    next(err);
  }
};

// Adicione no final de src/controllers/web.controller.js

export const renderSearch = async (req, res, next) => {
  try {
    const { q, genre, sort } = req.query;

    // 1. Inicia a query básica puxando todas as obras
    let dbQuery = supabase.from("stories").select("*");

    // 2. Filtro de Texto (Busca no Título ou na Sinopse)
    if (q) {
      dbQuery = dbQuery.or(`title.ilike.%${q}%,synopsis.ilike.%${q}%`);
    }

    // 3. Filtro de Gênero (Pode ser um ou múltiplos selecionados na barra lateral)
    if (genre) {
      if (Array.isArray(genre)) {
        dbQuery = dbQuery.in("genre", genre);
      } else {
        dbQuery = dbQuery.eq("genre", genre);
      }
    }

    // 4. Ordenação
    if (sort === "az") {
      dbQuery = dbQuery.order("title", { ascending: true }); // A-Z
    } else {
      dbQuery = dbQuery.order("created_at", { ascending: false }); // Mais recentes
    }

    // Executa a busca!
    const { data: stories, error } = await dbQuery;

    if (error) throw error;

    // Renderiza enviando as histórias E os filtros atuais para manter os botões "marcados" na tela
    res.render("search", { stories, query: req.query });
  } catch (err) {
    next(err);
  }
};
