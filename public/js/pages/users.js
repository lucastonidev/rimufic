// public/js/pages/users.js
import { AddUserModal } from "../components/admin/AddUserModal.js";
import { EditUserModal } from "../components/admin/EditUserModal.js";
import { BanUserModal } from "../components/admin/BanUserModal.js";

// Instancia os componentes
const addUserComponent = new AddUserModal();
const editUserComponent = new EditUserModal();
const banUserComponent = new BanUserModal();

// Expõe os métodos de abrir e confirmar modais para o HTML
// Como estamos usando módulos, as funções não vão automaticamente para o escopo global.
// Precisamos pendurá-las no objeto 'window' explicitamente.
window.openEditModal = (id, role, name, email) =>
  editUserComponent.open(id, role, name, email);
window.openBanModal = (id) => banUserComponent.open(id);
window.submitBan = () => banUserComponent.submitBan();
