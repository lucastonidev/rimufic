// public/js/components/favorites.js

class FavoritesManager {
  constructor() {
    this.storageKey = "@rimufic:favorites";
    this.offlineStorageKey = "@rimufic:offline_stories";
    this.currentTab = "favorites";
    this.favorites = this.getFavorites();
  }

  // Puxa os dados dos favoritos locais
  getFavorites() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

  getOfflineStories() {
    const data = localStorage.getItem(this.offlineStorageKey);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Adiciona ou remove um favorito
  toggleFavorite(btnElement) {
    const id = btnElement.getAttribute("data-id");
    const title = btnElement.getAttribute("data-title");
    const author = btnElement.getAttribute("data-author");
    const coverUrl = btnElement.getAttribute("data-cover");
    const genre = btnElement.getAttribute("data-genre");

    const index = this.favorites.findIndex((fav) => String(fav.id) === String(id));
    const isAdding = index === -1;

    if (isAdding) {
      this.favorites.push({ id, title, author, coverUrl, genre });
      if (window.showToast) {
        window.showToast("Adicionado aos seus favoritos! ❤️", "success", "ph-heart");
      }
    } else {
      this.favorites.splice(index, 1);
      if (window.showToast) {
        window.showToast("Removido dos favoritos.", "info", "ph-heart-break");
      }
    }

    localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
    this.syncButtonStates(id, isAdding);

    if (window.location.pathname === "/library") {
      this.render();
    }
  }

  syncButtonStates(id, isFav) {
    const btns = document.querySelectorAll(`.btn-fav[data-id="${id}"]`);
    btns.forEach((btn) => {
      const icon = btn.querySelector("i");
      if (isFav) {
        btn.classList.add("active", "is-favorite");
        if (icon) {
          icon.className = "ph-fill ph-heart";
          icon.style.color = "#EF4444";
        }
        btn.setAttribute("title", "Remover dos favoritos");
      } else {
        btn.classList.remove("active", "is-favorite");
        if (icon) {
          icon.className = "ph ph-heart";
          icon.style.color = "";
        }
        btn.setAttribute("title", "Adicionar aos favoritos");
      }
    });
  }

  checkFavorites() {
    const favBtns = document.querySelectorAll(".btn-fav");
    favBtns.forEach((btn) => {
      const id = btn.getAttribute("data-id");
      const icon = btn.querySelector("i");
      const isFav = this.favorites.some((fav) => String(fav.id) === String(id));
      if (isFav) {
        btn.classList.add("active", "is-favorite");
        if (icon) {
          icon.className = "ph-fill ph-heart";
          icon.style.color = "#EF4444";
        }
        btn.setAttribute("title", "Remover dos favoritos");
      } else {
        btn.classList.remove("active", "is-favorite");
        if (icon) {
          icon.className = "ph ph-heart";
          icon.style.color = "";
        }
        btn.setAttribute("title", "Adicionar aos favoritos");
      }
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    const tabFav = document.getElementById("tabFavorites");
    const tabOff = document.getElementById("tabOffline");

    if (tabFav) tabFav.classList.toggle("active", tab === "favorites");
    if (tabOff) tabOff.classList.toggle("active", tab === "offline");

    this.render();
  }

  render() {
    const grid = document.getElementById("favoritesGrid");
    const emptyState = document.getElementById("emptyState");
    const emptyIcon = document.getElementById("emptyStateIcon");
    const emptyTitle = document.getElementById("emptyStateTitle");
    const emptyText = document.getElementById("emptyStateText");
    const emptyAction = document.getElementById("emptyStateAction");
    const statsBadge = document.getElementById("statsBadge");

    if (!grid) return;
    grid.innerHTML = "";

    const isOfflineTab = this.currentTab === "offline";
    const stories = isOfflineTab ? this.getOfflineStories() : this.favorites;

    if (statsBadge) {
      const count = stories.length;
      statsBadge.innerHTML = isOfflineTab
        ? `<i class="ph-fill ph-cloud-check" style="color: #10B981;"></i><span>${count} Obra${count === 1 ? "" : "s"} Baixada${count === 1 ? "" : "s"}</span>`
        : `<i class="ph-fill ph-books" style="color: #EC4899;"></i><span>${count} Obra${count === 1 ? "" : "s"} Salva${count === 1 ? "" : "s"}</span>`;
    }

    if (stories.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
        if (isOfflineTab) {
          if (emptyIcon) emptyIcon.className = "ph ph-cloud-slash";
          if (emptyTitle) emptyTitle.innerText = "Nenhuma obra baixada offline ainda...";
          if (emptyText)
            emptyText.innerText =
              "Ao ler qualquer história ou livro digital, clique no botão com ícone de nuvem para baixar e ler sem internet a qualquer momento!";
          if (emptyAction) {
            emptyAction.innerHTML = '<i class="ph ph-books"></i> Ver Meus Favoritos';
            emptyAction.onclick = (e) => {
              e.preventDefault();
              this.switchTab("favorites");
            };
          }
        } else {
          if (emptyIcon) emptyIcon.className = "ph ph-ghost";
          if (emptyTitle) emptyTitle.innerText = "Sua biblioteca está vazia...";
          if (emptyText)
            emptyText.innerText =
              "Parece que você ainda não encontrou nenhuma lenda para guardar. Explore o acervo e favorite suas histórias preferidas!";
          if (emptyAction) {
            emptyAction.innerHTML = '<i class="ph ph-magnifying-glass"></i> Explorar Acervo';
            emptyAction.onclick = null;
            emptyAction.href = "/search";
          }
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    stories.forEach((story) => {
      const article = document.createElement("article");
      article.className = "story-card glass";

      const readUrl = `/read/${story.id}`;
      const cover = story.coverUrl || "/assets/banner-magic.jpeg";

      article.innerHTML = `
        <div class="card-cover">
          <img src="${cover}" alt="Capa">
        </div>
        <span class="card-genre">${story.genre || "Geral"}</span>
        ${
          isOfflineTab
            ? `<span class="source-badge card-source-tag" style="background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.5); color: #A7F3D0;">
                <i class="ph ph-cloud-check"></i> Offline
              </span>`
            : ""
        }
        <div class="card-body">
          <h3 class="card-title">${story.title}</h3>
          <p class="card-author">por ${story.author}</p>
        </div>
        <div class="card-footer">
          <button class="btn-fav" data-id="${story.id}" data-title="${story.title}" data-author="${story.author}" data-cover="${story.coverUrl || ""}" data-genre="${story.genre || ""}" onclick="toggleFav(this)" title="Favoritar">
            <i class="${this.favorites.some((f) => String(f.id) === String(story.id)) ? "ph-fill" : "ph"} ph-heart"></i>
          </button>
        </div>
        <a href="${readUrl}" class="card-stretched-link" aria-label="Ler ${story.title}"></a>
      `;
      grid.appendChild(article);
    });
  }
}

const favApp = new FavoritesManager();

window.toggleFav = (btn) => favApp.toggleFavorite(btn);
window.switchLibraryTab = (tab) => favApp.switchTab(tab);

document.addEventListener("DOMContentLoaded", () => {
  favApp.checkFavorites();
  if (window.location.pathname === "/library") {
    favApp.render();
  }
});
