// src/schemas/story.schema.js
import { z } from "zod";

export const storySchema = z.object({
  title: z
    .string()
    .min(2, "O título deve ter no mínimo 2 caracteres.")
    .max(100, "O título é muito longo."),
  author: z.string().optional().default("Grão-Mestre"),
  genre: z.enum(["folclore", "fabula", "fantasia", "mitologia", "terror"], {
    errorMap: () => ({ message: "Gênero inválido selecionado." }),
  }),
  synopsis: z.string().optional(),
  coverUrl: z
    .string()
    .url("A URL da capa deve ser válida.")
    .optional()
    .or(z.literal("")),
  content: z.string().min(10, "A história precisa ter conteúdo."),
});
