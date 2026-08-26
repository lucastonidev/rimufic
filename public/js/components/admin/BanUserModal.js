// public/js/components/admin/BanUserModal.js
import { UserAPI } from "../../api/UserAPI.js";

export class BanUserModal {
  constructor() {
    this.idInput = document.getElementById("banUserId");
  }

  open(id) {
    if (this.idInput) this.idInput.value = id;
    if (window.openModal) window.openModal("modalBanUser");
  }

  async submitBan() {
    const id = this.idInput.value;
    const confirmacao = confirm("Esta ação é irreversível. Prosseguir?");

    if (!confirmacao) return;

    try {
      const response = await UserAPI.ban(id);
      const result = await response.json();

      if (response.ok) {
        alert("🛡️ " + result.message);
        window.location.reload();
      } else {
        alert("Erro: " + result.message);
      }
    } catch (err) {
      alert("Erro ao banir usuário.");
    }
  }
}
