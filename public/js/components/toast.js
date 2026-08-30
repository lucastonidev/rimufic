// public/js/components/toast.js
window.showToast = function (msg, type = "info", icon = "ph-info") {
  let container = document.getElementById("toastContainer");

  // Cria o container caso ele não exista na página atual
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="ph ${icon}"></i> ${msg}`;
  container.appendChild(toast);

  // Remove o toast automaticamente após 4 segundos
  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("animationend", () => toast.remove());
  }, 4000);
};
