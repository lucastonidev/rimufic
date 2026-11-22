// src/services/story.service.js
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import TurndownService from "turndown";
import PQueue from "p-queue";
import { uploadToGitHub } from "./github.service.js";
import { clearStoryCache } from "./web.service.js";

const turndownService = new TurndownService();

// A CATRACA: Permite processar apenas 2 imagens por vez para proteger a RAM do servidor
const imageQueue = new PQueue({ concurrency: 2 });

export const processAndUploadContent = async (
  title,
  author,
  genre,
  synopsis,
  coverUrl,
  content,
  file,
  isUpdate = false,
  format = "text",
  pdfFile = null,
  pdfUrl = "",
  sourceType = "original",
  sourceUrl = "",
) => {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let finalCoverUrl = coverUrl || "";

  // 1. Processamento e fila de imagens da Capa
  if (file) {
    const imagePath = `content/covers/${slug}.webp`;

    await imageQueue.add(async () => {
      console.log(`⏳ Iniciando processamento da capa: ${slug}...`);
      const webpBuffer = await sharp(file.buffer)
        .resize({ width: 600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      await uploadToGitHub(
        imagePath,
        webpBuffer,
        `🖼️ ${isUpdate ? "Atualizando" : "Adicionando"} capa: ${slug}`,
      );
      console.log(`✅ Capa processada e enviada: ${slug}`);
    });

    finalCoverUrl = `https://cdn.jsdelivr.net/gh/lucastonidev/rimufic-storys@main/${imagePath}`;
  }

  // 2. Processamento do Conteúdo (PDF vs Markdown)
  let finalContentUrl = "";

  if (format === "pdf") {
    if (pdfFile) {
      const pdfPath = `content/books/${slug}.pdf`;
      console.log(`📚 Enviando PDF da obra para o GitHub: ${slug}.pdf...`);
      await uploadToGitHub(
        pdfPath,
        pdfFile.buffer,
        `📖 ${isUpdate ? "Atualizando" : "Adicionando"} livro em PDF: ${slug}.pdf`,
      );
      finalContentUrl = `https://cdn.jsdelivr.net/gh/lucastonidev/rimufic-storys@main/${pdfPath}`;
    } else if (pdfUrl && pdfUrl.trim() !== "") {
      finalContentUrl = pdfUrl.trim();
    }
  } else {
    // Processamento de Texto e Markdown
    const markdownBody = turndownService.turndown(content || "");
    const dateField = isUpdate ? "updated_at" : "created_at";
    const mdFileContent = `---\ntitle: "${title}"\nauthor: "${author || "Grão-Mestre"}"\ngenre: "${genre || "folclore"}"\ncover_url: "${finalCoverUrl}"\nsynopsis: "${synopsis || ""}"\nsource_type: "${sourceType || "original"}"\nsource_url: "${sourceUrl || ""}"\nformat: "text"\n${dateField}: "${new Date().toISOString()}"\n---\n\n${markdownBody}`;

    const mdPath = `content/stories/${slug}.md`;
    await uploadToGitHub(
      mdPath,
      mdFileContent,
      `✨ ${isUpdate ? "Atualizando" : "Adicionando"} conto: ${slug}.md`,
    );

    finalContentUrl = `https://cdn.jsdelivr.net/gh/lucastonidev/rimufic-storys@main/${mdPath}`;
  }

  return {
    markdownUrl: finalContentUrl,
    finalCoverUrl,
  };
};

export const insertStoryToDatabase = async (storyPayload, userToken) => {
  const userSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    },
  );

  try {
    const { data, error } = await userSupabase
      .from("stories")
      .insert([storyPayload])
      .select();
    if (error) throw error;
    clearStoryCache();
    return data;
  } catch (err) {
    // Fallback defensivo: se a tabela stories ainda não tem colunas source_type/source_url no banco
    if (err.message && (err.message.includes("source_") || err.message.includes("format"))) {
      const sanitizedPayload = { ...storyPayload };
      delete sanitizedPayload.source_type;
      delete sanitizedPayload.source_url;
      delete sanitizedPayload.format;

      const { data, error } = await userSupabase
        .from("stories")
        .insert([sanitizedPayload])
        .select();
      if (error) throw error;
      clearStoryCache();
      return data;
    }
    throw err;
  }
};

export const deleteStoryFromDatabase = async (storyId, userToken) => {
  const userSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    },
  );

  const { error } = await userSupabase
    .from("stories")
    .delete()
    .eq("id", storyId);
    if (error) throw error;
    clearStoryCache(storyId);
};

export const updateStoryInDatabase = async (
  storyId,
  storyPayload,
  userToken,
) => {
  const userSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    },
  );

  try {
    const { data, error } = await userSupabase
      .from("stories")
      .update(storyPayload)
      .eq("id", storyId)
      .select();
    if (error) throw error;

    clearStoryCache(storyId);
    return data;
  } catch (err) {
    if (err.message && (err.message.includes("source_") || err.message.includes("format"))) {
      const sanitizedPayload = { ...storyPayload };
      delete sanitizedPayload.source_type;
      delete sanitizedPayload.source_url;
      delete sanitizedPayload.format;

      const { data, error } = await userSupabase
        .from("stories")
        .update(sanitizedPayload)
        .eq("id", storyId)
        .select();
      if (error) throw error;

      clearStoryCache(storyId);
      return data;
    }
    throw err;
  }
};

export const getStoryById = async (storyId, userToken) => {
  const userSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    },
  );

  const { data, error } = await userSupabase
    .from("stories")
    .select("*")
    .eq("id", storyId)
    .single();
  if (error) throw error;
  return data;
};
