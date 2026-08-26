// public/js/components/admin/EditUserModal.js
import { UserAPI } from "../../api/UserAPI.js";

export class EditUserModal {
  constructor() {
    this.form = document.getElementById("formEditUser");
    this.idInput = document.getElementById("editUserId");
    this.roleSelect = document.getElementById("editRoleSelect");
    this.nameInput = document.getElementById("editFullName");
    this.emailInput = document.getElementById("editEmail");
    this.passwordInput = document.getElementById("passwordEdit");

    if (this.form) {
      this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    }
  }

  open(id, role, fullName, email) {
    if (this.idInput) this.idInput.value = id;
    if (this.roleSelect) this.roleSelect.value = role;
    if (this.nameInput) this.nameInput.value = fullName;
    if (this.emailInput) this.emailInput.value = email;
    if (this.passwordInput) this.passwordInput.value = "";

    if (window.openModal) window.openModal("modalEditUser");
  }

  async handleSubmit(e) {
    e.preventDefault();
    const id = this.idInput.value;

    const userData = {
      role: this.roleSelect.value,
      fullName: this.nameInput.value,
      email: this.emailInput.value,
      password: this.passwordInput.value,
    };

    try {
      const response = await UserAPI.update(id, userData);
      const result = await response.json();

      if (response.ok) {
        alert("✨ " + result.message);
        window.location.reload();
      } else {
        alert("Erro: " + result.message);
      }
    } catch (err) {
      alert("Erro ao salvar alterações.");
    }
  }
}
