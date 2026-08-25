// src/config/supabase.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Carrega as variáveis do .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "⚠️ Credenciais do Supabase não encontradas no arquivo .env!",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
