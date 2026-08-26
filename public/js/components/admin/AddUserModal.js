// public/js/components/admin/AddUserModal.js
import { UserAPI } from "../../api/UserAPI.js";

export class AddUserModal {
  constructor() {
    this.form = document.getElementById("formAddUser");

    if (this.form) {
      this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const btn = this.form.querySelector('button[type="submit"]');
    this.setLoading(btn, true, "Convidando...");

    const userData = {
      fullName: document.getElementById("addName")?.value,
      email: document.getElementById("addEmail")?.value,
      password: document.getElementById("password")?.value,
      role: document.getElementById("addRole")?.value,
    };

    try {
      const response = await UserAPI.add(userData);
      const result = await response.json();

      if (response.ok) {
        alert("✨ " + result.message);
        window.location.reload();
      } else {
        alert("Erro: " + result.message);
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      this.setLoading(btn, false, "Enviar Convite");
    }
  }

  setLoading(btn, isLoading, text) {
    btn.disabled = isLoading;
    btn.innerHTML = isLoading
      ? `<i class="ph ph-spinner animate-spin"></i> ${text}`
      : text;
  }
}
