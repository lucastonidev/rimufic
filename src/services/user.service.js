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

export const inviteNewUser = async (email, fullName, role) => {
  const adminClient = getAdminClient();
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password: "SenhaTemporaria123!",
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

export const updateUserRole = async (id, role) => {
  const { error } = await getAdminClient()
    .from("profiles")
    .update({ role })
    .eq("id", id);
  if (error) throw error;
};

export const banUser = async (id) => {
  const { error } = await getAdminClient().auth.admin.deleteUser(id);
  if (error) throw error;
};
