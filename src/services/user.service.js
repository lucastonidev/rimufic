// src/services/user.service.js
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../config/supabase.js";

const getAdminClient = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const inviteNewUser = async (email, fullName, role, password) => {
  const adminClient = getAdminClient();
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
  if (authError) throw authError;

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ role })
    .eq("id", authData.user.id);
  if (profileError) throw profileError;
};

export const updateUserRole = async (id, role, password, fullName, email) => {
  const adminClient = getAdminClient();

  // 1. Atualiza a permissão e o nome na tabela pública 'profiles'
  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      role,
      full_name: fullName,
    })
    .eq("id", id);
  if (profileError) throw profileError;

  // 2. Prepara o objeto de atualização da Autenticação
  const authUpdates = {
    email: email,
    user_metadata: { full_name: fullName },
  };

  // Se a senha foi preenchida, adiciona ao pacote de atualização
  if (password && password.trim() !== "") {
    authUpdates.password = password;
  }

  // 3. Atualiza os dados sensíveis na área de Auth
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    id,
    authUpdates,
  );
  if (authError) throw authError;
};

export const banUser = async (id) => {
  const { error } = await getAdminClient().auth.admin.deleteUser(id);
  if (error) throw error;
};
