// public/js/pages/admin.js

class AdminPanel {
  constructor() {
    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    this.mobileBtn = document.getElementById("mobileMenuBtn");
    this.sidebarContent = document.getElementById("sidebarContent");
  }

  bindEvents() {
    if (this.mobileBtn && this.sidebarContent) {
      this.mobileBtn.addEventListener("click", () => this.toggleSidebar());
    }
  }

  toggleSidebar() {
    this.sidebarContent.classList.toggle("active");

    // Troca o ícone de hambúrguer para X
    const icon = this.mobileBtn.querySelector("i");
    if (this.sidebarContent.classList.contains("active")) {
      icon.classList.replace("ph-list", "ph-x");
    } else {
      icon.classList.replace("ph-x", "ph-list");
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden"; // Evita scroll do body
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "auto"; // Restaura scroll do body
    }
  }
}

// Inicialização Mestra
const adminApp = new AdminPanel();

// Ponte Global: Permite que os 'onclick' do HTML consigam chamar os métodos de modal
window.openModal = (modalId) => adminApp.openModal(modalId);
window.closeModal = (modalId) => adminApp.closeModal(modalId);
