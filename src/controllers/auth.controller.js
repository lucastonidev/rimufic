// src/controllers/auth.controller.js
import { supabase } from "../config/supabase.js";

export const renderLogin = (req, res) => {
  res.render("login", { error: null });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Tenta fazer o login no Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // 2. Verifica se deu erro PRIMEIRO (antes de tentar ler o token)
  if (error) {
    return res.render("login", {
      error: "E-mail ou palavra-passe incorretos.",
    });
  }

  // 3. Pega o token JWT mágico do Supabase
  const token = data.session.access_token;

  // 4. Salva o token em um cookie seguro
  res.cookie("jwt_token", token, {
    httpOnly: true, // Impede acesso via JS no front-end
    secure: process.env.NODE_ENV === "production", // Em produção, exige HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000, // Expira em 7 dias
    sameSite: "strict", // Previne ataques CSRF
  });

  // 5. Login com sucesso? Redireciona para o Grimório (Admin)
  res.redirect("/admin");
};

export const logout = (req, res) => {
  res.clearCookie("jwt_token");
  res.redirect("/login");
};
