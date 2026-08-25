// src/services/web.service.js
import { supabase } from "../config/supabase.js";
import axios from "axios";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export const getHomeStories = async () => {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw error;
  return stories;
};

export const getStoryWithContent = async (id) => {
  const { data: story, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !story) throw new Error("História não encontrada.");

  let htmlContent = "<p>O conteúdo desta lenda se perdeu no tempo...</p>";

  // Busca o Markdown no GitHub e converte com segurança
  if (story.content && story.content.startsWith("http")) {
    try {
      const response = await axios.get(story.content);
      const parts = response.data.split("---");
      const pureMarkdown =
        parts.length > 2 ? parts.slice(2).join("---").trim() : response.data;

      const rawHtml = marked.parse(pureMarkdown);

      htmlContent = sanitizeHtml(rawHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "img",
          "h1",
          "h2",
          "h3",
        ]),
        allowedAttributes: { "*": ["style", "class", "src", "alt", "href"] },
      });
    } catch (e) {
      console.error("Erro ao buscar o texto no GitHub:", e.message);
    }
  }

  // Calcula tempo de leitura (200 palavras por min)
  const wordsCount = htmlContent.replace(/<[^>]*>?/gm, "").split(/\s+/).length;
  const readingTime = Math.ceil(wordsCount / 200) || 1;

  return { story, htmlContent, readingTime };
};

export const searchStories = async (q, genre, sort) => {
  let dbQuery = supabase.from("stories").select("*");

  if (q) dbQuery = dbQuery.or(`title.ilike.%${q}%,synopsis.ilike.%${q}%`);

  if (genre) {
    if (Array.isArray(genre)) dbQuery = dbQuery.in("genre", genre);
    else dbQuery = dbQuery.eq("genre", genre);
  }

  if (sort === "az") dbQuery = dbQuery.order("title", { ascending: true });
  else dbQuery = dbQuery.order("created_at", { ascending: false });

  const { data: stories, error } = await dbQuery;

  if (error) throw error;
  return stories;
};
