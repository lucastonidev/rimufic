import { createClient } from "@supabase/supabase-js";

export const getDashboardMetrics = async (userToken) => {
  const userSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    },
  );

  const [stories, users, recent] = await Promise.all([
    userSupabase.from("stories").select("*", { count: "exact", head: true }),
    userSupabase.from("profiles").select("*", { count: "exact", head: true }),
    userSupabase
      .from("stories")
      .select("title, author, created_at")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  if (stories.error || users.error || recent.error)
    throw new Error("Erro ao carregar métricas.");

  return {
    totalStories: stories.count || 0,
    totalUsers: users.count || 0,
    recentStories: recent.data || [],
  };
};
