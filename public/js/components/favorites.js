// public/js/favorites.js

class FavoritesManager {
  constructor() {
    this.storageKey = "@rimufic:favorites";
    this.favorites = this.getFavorites();
  }

  // Puxa os dados do armazenamento local
  getFavorites() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Adiciona ou remove um favorito
  toggleFavorite(btnElement) {
    const id = btnElement.getAttribute("data-id");
    const title = btnElement.getAttribute("data-title");
    const author = btnElement.getAttribute("data-author");
    const coverUrl = btnElement.getAttribute("data-cover");
    const genre = btnElement.getAttribute("data-genre");

    const index = this.favorites.findIndex((fav) => fav.id === id);
    const icon = btnElement.querySelector("i");

    if (index === -1) {
      // Salvar
      this.favorites.push({ id, title, author, coverUrl, genre });
      icon.classList.replace("ph", "ph-fill");
    } else {
      // Remover
      this.favorites.splice(index, 1);
      icon.classList.replace("ph-fill", "ph");
    }

    localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));

    // Se estivermos na página da biblioteca, recarregamos a tela
    if (window.location.pathname === "/library") {
      this.renderFavorites();
    }
  }

  // Pinta os corações de vermelho ao carregar a página
  checkFavorites() {
    const favBtns = document.querySelectorAll(".btn-fav");
    favBtns.forEach((btn) => {
      const id = btn.getAttribute("data-id");
      if (this.favorites.some((fav) => fav.id === id)) {
        btn.querySelector("i").classList.replace("ph", "ph-fill");
      }
    });
  }

  // Monta a página de Biblioteca Mágica
  renderFavorites() {
    const grid = document.getElementById("favoritesGrid");
    const emptyState = document.getElementById("emptyState");
    const statsBadge = document.getElementById("statsBadge");

    if (!grid) return; // Só executa se a grid existir na tela

    grid.innerHTML = "";

    if (this.favorites.length === 0) {
      emptyState.style.display = "block";
      if (statsBadge)
        statsBadge.innerHTML = `<i class="ph-fill ph-books"></i><span>0 Obras Salvas</span>`;
      return;
    }

    emptyState.style.display = "none";
    if (statsBadge)
      statsBadge.innerHTML = `<i class="ph-fill ph-books"></i><span>${this.favorites.length} Obras Salvas</span>`;

    this.favorites.forEach((story) => {
      const article = document.createElement("article");
      article.className = "story-card glass";
      article.innerHTML = `
    <a href="/read/${story.id}" class="card-link">
        <div class="card-cover">
            <img src="${story.coverUrl || "/assets/banner-magic.jpeg"}" alt="Capa">
        </div>
        <h3 class="card-title">${story.title}</h3>
        <p class="card-author">por ${story.author}</p>
    </a>
    <div class="card-footer">
        <span class="card-genre">${story.genre}</span>
        <button class="btn-fav" data-id="${story.id}" data-title="${story.title}" data-author="${story.author}" data-cover="${story.coverUrl}" data-genre="${story.genre}" onclick="toggleFav(this)" title="Remover dos favoritos">
            <i class="ph-fill ph-heart"></i>
        </button>
    </div>
`;
      grid.appendChild(article);
    });
  }
}

const favApp = new FavoritesManager();

// Expõe a função para o HTML
window.toggleFav = (btn) => favApp.toggleFavorite(btn);

// Inicia as verificações quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  favApp.checkFavorites();
  if (window.location.pathname === "/library") {
    favApp.renderFavorites();
  }
});
