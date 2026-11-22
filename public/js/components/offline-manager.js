// public/js/components/offline-manager.js

export class OfflineManager {
  constructor() {
    this.storageKey = "@rimufic:offline_stories";
    this.cacheName = "rimufic-offline-v1";
    this.offlineStories = this.getOfflineStories();
    this.init();
  }

  getOfflineStories() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  isDownloaded(storyId) {
    return this.offlineStories.some((s) => String(s.id) === String(storyId));
  }

  updateAllButtons(id, isDownloaded) {
    const btns = document.querySelectorAll(`.btn-offline[data-id="${id}"]`);
    btns.forEach((btn) => {
      const icon = btn.querySelector("i");
      const textSpan = btn.querySelector(".btn-offline-text");
      if (isDownloaded) {
        if (icon) {
          icon.className = "ph-fill ph-check-circle";
          icon.style.color = "#10B981";
        }
        if (textSpan) textSpan.textContent = "Disponível Offline";
        btn.setAttribute("title", "Disponível Offline (Clique para remover)");
        btn.classList.add("is-offline");
      } else {
        if (icon) {
          icon.className = "ph ph-cloud-arrow-down";
          icon.style.color = "";
        }
        if (textSpan) textSpan.textContent = "Salvar Offline";
        btn.setAttribute("title", "Baixar para Ler Offline");
        btn.classList.remove("is-offline");
      }
    });
  }

  async toggleOffline(btnElement) {
    const id = String(btnElement.getAttribute("data-id"));
    const title = btnElement.getAttribute("data-title") || "Obra Sem Título";
    const author = btnElement.getAttribute("data-author") || "Autor Desconhecido";
    const coverUrl = btnElement.getAttribute("data-cover") || "";
    const genre = btnElement.getAttribute("data-genre") || "Geral";
    const isPdf = btnElement.getAttribute("data-is-pdf") === "true";
    const contentUrl = btnElement.getAttribute("data-content-url") || "";

    if (this.isDownloaded(id)) {
      // 1. Remover download offline
      await this.removeDownload(id);
      this.updateAllButtons(id, false);

      if (window.showToast) {
        window.showToast("Download offline removido deste aparelho.", "info", "ph-trash");
      }
    } else {
      // 2. Baixar obra para leitura offline
      const btns = document.querySelectorAll(`.btn-offline[data-id="${id}"]`);
      btns.forEach((b) => {
        const icon = b.querySelector("i");
        if (icon) icon.className = "ph ph-circle-notch animate-spin";
      });

      try {
        await this.downloadStory({
          id,
          title,
          author,
          coverUrl,
          genre,
          isPdf,
          contentUrl,
          pageUrl: window.location.pathname,
        });

        this.updateAllButtons(id, true);

        if (window.showToast) {
          window.showToast(
            "✨ Obra salva para ler offline sem internet!",
            "success",
            "ph-cloud-check",
          );
        }
      } catch (err) {
        console.error("Erro ao salvar para leitura offline:", err);
        this.updateAllButtons(id, false);
        if (window.showToast) {
          window.showToast(
            "Não foi possível salvar o arquivo offline.",
            "error",
            "ph-warning-circle",
          );
        }
      }
    }
  }

  async downloadStory(storyData) {
    if (!("caches" in window)) {
      throw new Error("Seu navegador não possui suporte ao armazenamento offline.");
    }

    const cache = await caches.open(this.cacheName);
    const urlsToCache = [storyData.pageUrl, window.location.href];

    if (storyData.coverUrl && storyData.coverUrl.startsWith("http")) {
      urlsToCache.push(storyData.coverUrl);
    }

    if (storyData.contentUrl && storyData.contentUrl.startsWith("http")) {
      urlsToCache.push(storyData.contentUrl);
    }

    // Baixa os recursos com tratamento tolerante
    await Promise.allSettled(
      urlsToCache.map(async (url) => {
        try {
          const res = await fetch(url, { mode: "cors" });
          if (res.ok) await cache.put(url, res);
        } catch (e) {
          console.warn(`Recurso não pré-carregado: ${url}`, e);
        }
      }),
    );

    this.offlineStories.push({
      ...storyData,
      downloadedAt: new Date().toISOString(),
    });

    localStorage.setItem(this.storageKey, JSON.stringify(this.offlineStories));
  }

  async removeDownload(storyId) {
    const story = this.offlineStories.find((s) => String(s.id) === String(storyId));
    if (story && "caches" in window) {
      try {
        const cache = await caches.open(this.cacheName);
        if (story.pageUrl) await cache.delete(story.pageUrl);
        if (story.coverUrl) await cache.delete(story.coverUrl);
        if (story.contentUrl) await cache.delete(story.contentUrl);
      } catch (e) {
        console.warn("Erro ao limpar cache específico:", e);
      }
    }

    this.offlineStories = this.offlineStories.filter(
      (s) => String(s.id) !== String(storyId),
    );
    localStorage.setItem(this.storageKey, JSON.stringify(this.offlineStories));
  }

  checkOfflineButtons() {
    const btns = document.querySelectorAll(".btn-offline");
    btns.forEach((btn) => {
      const id = btn.getAttribute("data-id");
      if (this.isDownloaded(id)) {
        this.updateAllButtons(id, true);
      }
    });
  }

  init() {
    this.checkOfflineButtons();
  }
}

export const offlineManager = new OfflineManager();
window.offlineManager = offlineManager;
window.toggleOfflineStory = (btn) => offlineManager.toggleOffline(btn);
