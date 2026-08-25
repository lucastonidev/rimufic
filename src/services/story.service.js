// src/services/story.service.js
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import TurndownService from "turndown";
import PQueue from "p-queue";
import { uploadToGitHub } from "./github.service.js";

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
) => {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let finalCoverUrl = coverUrl || "";

  // Processamento e fila de imagens
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

  // Processamento de Texto e Markdown
  const markdownBody = turndownService.turndown(content);
  const dateField = isUpdate ? "updated_at" : "created_at";
  const mdFileContent = `---\ntitle: "${title}"\nauthor: "${author || "Grão-Mestre"}"\ngenre: "${genre || "folclore"}"\ncover_url: "${finalCoverUrl}"\nsynopsis: "${synopsis || ""}"\n${dateField}: "${new Date().toISOString()}"\n---\n\n${markdownBody}`;

  const mdPath = `content/stories/${slug}.md`;
  await uploadToGitHub(
    mdPath,
    mdFileContent,
    `✨ ${isUpdate ? "Atualizando" : "Adicionando"} conto: ${slug}.md`,
  );

  return {
    markdownUrl: `https://cdn.jsdelivr.net/gh/lucastonidev/rimufic-storys@main/${mdPath}`,
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

  const { data, error } = await userSupabase
    .from("stories")
    .insert([storyPayload])
    .select();
  if (error) throw error;
  return data;
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

  const { data, error } = await userSupabase
    .from("stories")
    .update(storyPayload)
    .eq("id", storyId)
    .select();
  if (error) throw error;
  return data;
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
