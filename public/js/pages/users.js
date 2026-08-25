// public/js/pages/users.js

class UserManager {
  constructor() {
    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    // Formulários
    this.formAddUser = document.getElementById("formAddUser");
    this.formEditUser = document.getElementById("formEditUser");

    // Inputs Ocultos
    this.editUserId = document.getElementById("editUserId");
    this.editRoleSelect = document.getElementById("editRoleSelect");
    this.banUserId = document.getElementById("banUserId");
  }

  bindEvents() {
    if (this.formAddUser) {
      this.formAddUser.addEventListener("submit", (e) => this.handleAddUser(e));
    }
    if (this.formEditUser) {
      this.formEditUser.addEventListener("submit", (e) =>
        this.handleEditUser(e),
      );
    }
  }

  // Abastece o Modal de Edição com os dados do usuário clicado
  openEditModal(id, role) {
    if (this.editUserId) this.editUserId.value = id;
    if (this.editRoleSelect) this.editRoleSelect.value = role;
    if (window.openModal) window.openModal("modalEditUser");
  }

  // Abastece o Modal de Banimento
  openBanModal(id) {
    if (this.banUserId) this.banUserId.value = id;
    if (window.openModal) window.openModal("modalBanUser");
  }

  // POST: Adicionar Novo Membro
  async handleAddUser(e) {
    e.preventDefault();
    const btn = this.formAddUser.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Convidando...`;

    // No EJS, garanta que os inputs tenham id="addName", id="addEmail", id="addRole"
    const fullName = document.getElementById("addName")?.value;
    const email = document.getElementById("addEmail")?.value;
    const role = document.getElementById("addRole")?.value;

    try {
      const response = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, role }),
      });
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
      btn.disabled = false;
      btn.innerHTML = "Enviar Convite";
    }
  }

  // PUT: Editar Permissões
  async handleEditUser(e) {
    e.preventDefault();
    const id = this.editUserId.value;
    const newRole = this.editRoleSelect.value;

    try {
      const response = await fetch(`/api/v1/admin/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const result = await response.json();

      if (response.ok) {
        alert("✨ " + result.message);
        window.location.reload();
      } else {
        alert("Erro: " + result.message);
      }
    } catch (err) {
      alert("Erro ao salvar permissões.");
    }
  }

  // DELETE: Banir Usuário
  async submitBan() {
    const id = this.banUserId.value;
    const confirmacao = confirm("Esta ação é irreversível. Prosseguir?");

    if (!confirmacao) return;

    try {
      const response = await fetch(`/api/v1/admin/users/${id}`, {
        method: "DELETE",
      });
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

// Inicialização Mestra
const userApp = new UserManager();

// Pontes Globais para o HTML (onClick)
window.openEditModal = (id, role) => userApp.openEditModal(id, role);
window.openBanModal = (id) => userApp.openBanModal(id);
window.submitBan = () => userApp.submitBan();
