// public/js/pages/users.js
import { AddUserModal } from "../components/admin/AddUserModal.js";
import { EditUserModal } from "../components/admin/EditUserModal.js";
import { DeleteUserModal } from "../components/admin/DeleteUserModal.js";

// Instancia os componentes
const addUserComponent = new AddUserModal();
const editUserComponent = new EditUserModal();
const deleteUserComponent = new DeleteUserModal();

window.openEditModal = (id, role, name, email) => editUserComponent.open(id, role, name, email);
window.openDeleteModal = (id) => deleteUserComponent.open(id);
window.submitDelete = () => deleteUserComponent.submitDelete();
