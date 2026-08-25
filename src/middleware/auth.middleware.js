// src/middleware/auth.middleware.js
import { supabase } from "../config/supabase.js";

export const requireAuth = async (req, res, next) => {
  const token = req.cookies.jwt_token;

  // Se não tem cookie, expulsa para a tela de login
  if (!token) {
    return res.redirect("/login");
  }

  // Verifica com o Supabase se o token JWT é genuíno e ainda é válido
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.clearCookie("jwt_token");
    return res.redirect("/login");
  }

  // Busca o "role" (cargo) do usuário na tabela de perfis
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", data.user.id)
    .single();

  // Salva tudo na requisição
  req.user = {
    ...data.user,
    ...profile,
  };

  // VARIÁVEL GLOBAL DO EJS:
  // Passando o req.user para res.locals, a variável "user" fica
  // disponível automaticamente em qualquer arquivo .ejs do seu painel!
  res.locals.user = req.user;

  next();
};

// Porteiro nível 2: Apenas para áreas super sensíveis (como deletar coisas)
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .send("Acesso Negado: Apenas o Grão-Mestre pode acessar esta área.");
  }
};

export const checkUser = async (req, res, next) => {
  const token = req.cookies.jwt_token;

  if (token) {
    // Verifica se o token é válido
    const { data, error } = await supabase.auth.getUser(token);

    if (!error && data.user) {
      // Pega os dados extras do perfil (como o nome)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_url")
        .eq("id", data.user.id)
        .single();

      // Disponibiliza a variável "user" para as telas públicas
      res.locals.user = {
        ...data.user,
        ...profile,
      };
    }
  }

  // O next() vazio significa: "Pode continuar carregando a página normalmente!"
  next();
};