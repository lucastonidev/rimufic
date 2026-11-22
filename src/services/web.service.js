// src/services/web.service.js
import { supabase } from "../config/supabase.js";
import axios from "axios";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

// Nosso "banco de dados" temporário na memória RAM do servidor
const cache = {
  stories: {},
  home: { data: null, timestamp: 0 },
};

// Tempo de vida do cache: 1 hora em milissegundos
const CACHE_TTL = 60 * 60 * 1000;

export const getHomeStories = async () => {
  const now = Date.now();

  // Se a home está no cache e não venceu, entrega na hora!
  if (cache.home.data && now - cache.home.timestamp < CACHE_TTL) {
    return cache.home.data;
  }

  // Se não tem cache, vai no Supabase
  const { data: stories, error } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw error;

  // Salva na memória para os próximos acessos
  cache.home.data = stories;
  cache.home.timestamp = now;

  return stories;
};

export const getStoryWithContent = async (id) => {
  const now = Date.now();

  // 1. O PULO DO GATO: Se existe no cache e ainda não deu 1 hora, devolve na hora!
  if (cache.stories[id] && now - cache.stories[id].timestamp < CACHE_TTL) {
    console.log(`⚡ Servindo história ${id} via Cache Mágico!`);
    return cache.stories[id].data;
  }

  // 2. Se o cache não existe ou venceu, faz o trabalho pesado de ir no Supabase e GitHub
  const { data: story, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !story) throw new Error("História não encontrada.");

  let htmlContent = "<p>O conteúdo desta lenda se perdeu no tempo...</p>";
  let isPdf = false;
  let pdfUrl = null;
  let readingTime = 1;

  // Verifica se a obra é um Livro Digital em formato PDF
  if (
    story.format === "pdf" ||
    (story.content && story.content.toLowerCase().includes(".pdf"))
  ) {
    isPdf = true;
    pdfUrl = story.content;
    readingTime = 20; // Estimativa padrão para livros em PDF
  } else if (story.content && story.content.startsWith("http")) {
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
          "blockquote",
          "div",
          "hr",
          "span",
        ]),
        allowedAttributes: { "*": ["style", "class", "src", "alt", "href"] },
      });

      const wordsCount = htmlContent.replace(/<[^>]*>?/gm, "").split(/\s+/).length;
      readingTime = Math.ceil(wordsCount / 200) || 1;
    } catch (e) {
      console.error("Erro ao buscar o texto no GitHub:", e.message);
    }
  }

  const result = { story, htmlContent, readingTime, isPdf, pdfUrl };

  // 3. Salva o resultado final na memória para o próximo leitor
  cache.stories[id] = {
    data: result,
    timestamp: now,
  };

  return result;
};

export const getRandomStoryId = async () => {
  // Puxamos apenas a coluna "id" de todas as histórias para economizar memória e banda
  const { data, error } = await supabase.from("stories").select("id");

  if (error || !data || data.length === 0) return null;

  // Sorteia um índice com base no total de histórias
  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex].id;
};

export const clearStoryCache = (id) => {
  if (id && cache.stories[id]) {
    delete cache.stories[id];
    console.log(`🧹 Cache da história ${id} limpo com sucesso!`);
  }
  // Limpa também o cache da página inicial para atualizar os destaques
  cache.home.data = null;
  cache.home.timestamp = 0;
};

export const searchStories = async (q, genre, sort) => {
  let query = supabase.from("stories").select("*");

  // Filtro de texto (busca no título, autor ou sinopse)
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`title.ilike.${term},author.ilike.${term},synopsis.ilike.${term}`);
  }

  // Filtro de gêneros (suporta valor único ou múltiplos checkboxes)
  if (genre) {
    if (Array.isArray(genre) && genre.length > 0) {
      query = query.in("genre", genre);
    } else if (typeof genre === "string" && genre.trim()) {
      query = query.eq("genre", genre);
    }
  }

  // Ordenação
  if (sort === "az") {
    query = query.order("title", { ascending: true });
  } else {
    // Padrão: mais recentes primeiro
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("Erro na busca de histórias:", error);
    throw error;
  }

  return data || [];
};