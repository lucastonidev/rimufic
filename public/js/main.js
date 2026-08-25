// public/js/main.js

class AppNavigation {
  constructor() {
    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    this.mobileMenuBtn = document.getElementById("mobileMenuBtn");
    this.navLinks = document.getElementById("navLinks");
  }

  bindEvents() {
    if (this.mobileMenuBtn && this.navLinks) {
      this.mobileMenuBtn.addEventListener("click", () => this.toggleMenu());
    }
  }

  toggleMenu() {
    this.navLinks.classList.toggle("show");

    // Troca o ícone (Hamburger <-> X) de forma mais limpa com replace
    const icon = this.mobileMenuBtn.querySelector("i");
    if (this.navLinks.classList.contains("show")) {
      icon.classList.replace("ph-list", "ph-x");
    } else {
      icon.classList.replace("ph-x", "ph-list");
    }
  }
}

// Inicializa a classe assim que o DOM carregar
document.addEventListener("DOMContentLoaded", () => {
  new AppNavigation();
});
