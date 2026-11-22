// src/controllers/auth.controller.js
import { supabase } from "../config/supabase.js";

export const renderLogin = (req, res) => {
  res.render("login", { error: null, success: null });
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
      success: null,
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

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.render("login", {
      error: "Por favor, informe seu e-mail para receber as instruções.",
      success: null,
    });
  }

  try {
    const redirectUrl = `${req.protocol}://${req.get("host")}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error("Erro no Supabase Auth resetPasswordForEmail:", error.message);
    }

    // Por questão de segurança, sempre exibimos mensagem de sucesso sem vazar se o e-mail existe
    return res.render("login", {
      error: null,
      success: "Se este e-mail estiver registrado, você receberá um link mágico para redefinir sua palavra-passe.",
    });
  } catch (err) {
    console.error("Erro inesperado em forgotPassword:", err);
    return res.render("login", {
      error: "Ocorreu uma instabilidade ao enviar o e-mail de recuperação.",
      success: null,
    });
  }
};

export const renderResetPassword = (req, res) => {
  res.render("reset-password", { error: null, success: null });
};

export const resetPassword = async (req, res) => {
  const { password, confirmPassword, token } = req.body;

  if (!password || password.length < 6) {
    return res.render("reset-password", {
      error: "A nova palavra-passe precisa ter no mínimo 6 caracteres.",
      success: null,
    });
  }

  if (password !== confirmPassword) {
    return res.render("reset-password", {
      error: "As palavras-passe digitadas não conferem.",
      success: null,
    });
  }

  try {
    let client = supabase;
    if (token) {
      const { createClient } = await import("@supabase/supabase-js");
      client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    }

    const { error } = await client.auth.updateUser({ password });

    if (error) {
      return res.render("reset-password", {
        error: "Não foi possível redefinir a palavra-passe: " + error.message,
        success: null,
      });
    }

    return res.render("login", {
      error: null,
      success: "✨ Palavra-passe atualizada com sucesso! Entre com suas novas credenciais.",
    });
  } catch (err) {
    console.error("Erro em resetPassword:", err);
    return res.render("reset-password", {
      error: "Erro ao processar nova palavra-passe.",
      success: null,
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("jwt_token");
  res.redirect("/login");
};
