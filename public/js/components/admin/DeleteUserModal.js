// public/js/components/admin/DeleteUserModal.js
import { UserAPI } from "../../api/UserAPI.js";

export class DeleteUserModal {
  constructor() {
    this.idInput = document.getElementById("deleteUserId");
  }

  open(id) {
    if (this.idInput) this.idInput.value = id;
    if (window.openModal) window.openModal("modalDeleteUser");
  }

  async submitDelete() {
    const id = this.idInput.value;

    try {
      const response = await UserAPI.delete(id);
      const result = await response.json();

      if (response.ok) {
        showToast("Usuário excluído com sucesso!", "success", "ph-check-circle");
        window.location.reload();
      } else {
        showToast(result.message || "Erro ao excluir usuário.", "error", "ph-warning-circle");
      }
    } catch (err) {
      showToast("Erro ao excluir usuário.", "error", "ph-warning-circle");
    }
  }
}
