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
        showToast("Usuário adicionado com sucesso!", "success", "ph-check-circle");
        window.location.reload();
      } else {
        showToast(result.message || "Falha ao adicionar usuário. Tente novamente.", "error", "ph-x-circle");
      }
    } catch (err) {
      showToast("Erro ao conectar com o servidor.", "error", "ph-x-circle");
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
