// src/controllers/admin/web.admin.controller.js
import * as adminService from "../../services/admin.service.js";
import * as userService from "../../services/user.service.js";
import { getStoryById } from "../../services/story.service.js";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

// --- DASHBOARD ---
export const renderDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardMetrics(req.cookies.jwt_token);
    res.render("admin/dashboard", { activePage: "dashboard", stats });
  } catch (err) {
    next(err);
  }
};

// --- USUÁRIOS ---
export const renderManageUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.render("admin/users", { activePage: "users", users });
  } catch (err) {
    next(err);
  }
};

// --- OBRAS ---
export const renderManageStories = async (req, res, next) => {
  try {
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${req.cookies.jwt_token}` },
        },
      },
    );
    let query = userSupabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });
    if (req.user.role !== "admin") query = query.eq("user_id", req.user.id);

    const { data: stories, error } = await query;
    if (error) throw error;
    res.render("admin/stories", { activePage: "stories", stories });
  } catch (err) {
    next(err);
  }
};

export const renderCreateStory = (req, res) =>
  res.render("admin/create-story", { activePage: "create" });

export const renderEditStory = async (req, res, next) => {
  try {
    const story = await getStoryById(req.params.id, req.cookies.jwt_token);
    let rawContent = "";
    if (story.content && story.content.startsWith("http")) {
      const response = await axios.get(story.content);
      rawContent = response.data.split("---").slice(2).join("---").trim();
    }
    res.render("admin/create-story", {
      activePage: "stories",
      story,
      rawContent,
    });
  } catch (err) {
    next(err);
  }
};
