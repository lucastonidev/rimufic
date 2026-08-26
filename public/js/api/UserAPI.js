// public/js/api/UserAPI.js
export class UserAPI {
  static async add(userData) {
    return await fetch("/api/v1/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
  }

  static async update(id, userData) {
    return await fetch(`/api/v1/admin/users/${id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
  }

  static async ban(id) {
    return await fetch(`/api/v1/admin/users/${id}`, {
      method: "DELETE",
    });
  }
}
