// public/js/pages/create-story.js

class StoryEditor {
  constructor() {
    this.cacheElements();
    this.bindEvents();
    this.setupEditor();
    this.loadDraft();
  }

  cacheElements() {
    // Botões e Formulário
    this.btnPublish = document.getElementById("btnPublish");
    this.btnDraft = document.getElementById("btnDraft");
    this.storyIdInput = document.getElementById("storyId");
    this.titleInput = document.getElementById("title");
    this.authorInput = document.getElementById("author");
    this.genreSelect = document.getElementById("genre");
    this.synopsisTextarea = document.getElementById("synopsis");

    // Upload de Imagem
    this.coverUrlInput = document.getElementById("coverUrl");
    this.coverInput = document.getElementById("coverInput");
    this.uploadBox = document.getElementById("coverUploadBox");
    this.coverPreview = document.getElementById("coverPreview");

    // Editor e Abas
    this.editorArea = document.getElementById("editorArea");
    this.tabPanes = document.querySelectorAll(".tab-pane");
    this.tabBtns = document.querySelectorAll(".tab-btn");

    // Upload de Imagem
    this.coverUrlInput = document.getElementById("coverUrl");
    this.coverInput = document.getElementById("coverInput");
    this.uploadBox = document.getElementById("coverUploadBox");
    this.coverPreview = document.getElementById("coverPreview");

    // NOVO: Referências do preview da URL
    this.urlPreviewImg = document.getElementById("urlPreviewImg");
    this.urlPlaceholderText = document.getElementById("urlPlaceholderText");
  }

  bindEvents() {
    if (this.btnPublish) {
      this.btnPublish.addEventListener("click", () => this.handlePublish());
    }
    if (this.btnDraft) {
      this.btnDraft.addEventListener("click", () => this.saveDraft());
    }
  }

  setupEditor() {
    if (!this.editorArea) return;

    document.execCommand("defaultParagraphSeparator", false, "p");
    this.editorArea.addEventListener("input", () => this.handleEditorInput());

    this.editorArea.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.originalEvent || e).clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    });
  }

  // ==========================================
  // MÉTODOS DE INTERFACE (ABAS E IMAGENS)
  // ==========================================
  switchTab(tabId, btnElement) {
    this.tabPanes.forEach((pane) => pane.classList.remove("active"));
    this.tabBtns.forEach((btn) => btn.classList.remove("active"));

    document.getElementById(tabId).classList.add("active");
    btnElement.classList.add("active");
  }

  previewImage(event) {
    const input = event.target;

    if (input.files && input.files[0]) {
      const file = input.files[0];
      const maxSizeInMB = 4;

      if (file.size > maxSizeInMB * 1024 * 1024) {
        showToast(
          `Imagem muito pesada. Escolha um arquivo de até ${maxSizeInMB} MB.`,
          "error",
          "ph-warning-circle",
        );
        input.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.coverPreview.src = e.target.result;
        this.coverPreview.style.display = "block";
        this.uploadBox.style.color = "transparent";
        this.uploadBox.querySelector("i").style.opacity = "0";
        this.uploadBox.querySelector("span").style.opacity = "0";
      };
      reader.readAsDataURL(file);
    }
  }

  previewImageUrl(url) {
    if (url && url.trim() !== "") {
      this.urlPreviewImg.src = url;
      this.urlPreviewImg.style.display = "block";
      this.urlPlaceholderText.style.display = "none";

      this.urlPreviewImg.onerror = () => {
        this.urlPreviewImg.style.display = "none";
        this.urlPlaceholderText.style.display = "block";
        this.urlPlaceholderText.innerText = "URL inválida ou imagem inacessível.";
      };
    } else {
      this.urlPreviewImg.style.display = "none";
      this.urlPlaceholderText.style.display = "block";
      this.urlPlaceholderText.innerText = "Preview do link aparecerá aqui";
    }
  }

  // ==========================================
  // MÉTODOS DO EDITOR (WYSIWYG)
  // ==========================================

  execCmd(command) {
    document.execCommand(command, false, null);
    this.editorArea.focus();
  }

  loadTemplate() {
    const templateHTML = `
        <h1 style="text-align: center; font-family: 'Playfair Display', serif; color: var(--accent);">Título do Capítulo</h1>
        <br>
        <p style="color: var(--text-muted);"><em>(Comece descrevendo o cenário onde a história se inicia. Quebre o gelo introduzindo o clima do lugar.)</em></p>
        <p>A noite na floresta amazônica não é silenciosa. Ela pulsa, respira e sussurra. Mas naquela noite específica, perto da curva do Rio Negro, um silêncio antinatural havia caído como uma mortalha grossa.</p>
        <br>
        <p style="color: var(--text-muted);"><em>(Apresente o personagem principal e o conflito inicial.)</em></p>
        <p>Tião limpou o suor da testa com as costas da mão suja de graxa e serragem. O motor da motosserra estava desligado, repousando aos seus pés como uma besta de metal adormecida.</p>
        <br>
        <div style="text-align: center; letter-spacing: 15px; color: var(--accent); margin: 20px 0;">✧ ✧ ✧</div>
        <br>
        <p style="color: var(--text-muted);"><em>(Desenvolva a história, use quebras de cena acima se necessário.)</em></p>
        <p>Foi então que o cheiro mudou. A fragrância úmida de terra e folhas verdes foi substituída por um odor acre de fumaça e enxofre...</p>
    `;

    if (this.editorArea.innerHTML.trim() === "" || this.editorArea.innerHTML === "<br>") {
      this.editorArea.innerHTML = templateHTML;
    } else {
      this.editorArea.innerHTML +=
        '<br><hr style="border: 1px dashed var(--glass-border); margin: 2rem 0;"><br>' +
        templateHTML;
    }
  }

  handleEditorInput() {
    if (this.editorArea.innerHTML.length > 0 && !this.editorArea.innerHTML.startsWith("<")) {
      const text = this.editorArea.innerHTML;
      this.editorArea.innerHTML = `<p>${text}</p>`;

      const selection = window.getSelection();
      const range = document.createRange();

      const textNode = this.editorArea.childNodes[0].firstChild || this.editorArea.childNodes[0];

      range.selectNodeContents(textNode);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    if (this.editorArea.innerHTML === "<br>" || this.editorArea.innerHTML === "<p><br></p>") {
      this.editorArea.innerHTML = "";
    }
  }

  formatContentForBackend() {
    let htmlBruto = this.editorArea.innerHTML;
    let htmlLimpo = htmlBruto.replace(/<\/?span[^>]*>/gi, "");
    htmlLimpo = htmlLimpo.replace(
      /<h[1-3]>/gi,
      "<h2 style=\"text-align: center; font-family: 'Playfair Display', serif; color: var(--accent); margin-bottom: 2rem;\">",
    );
    htmlLimpo = htmlLimpo.replace(/<\/h[1-3]>/gi, "</h2>");
    return htmlLimpo;
  }

  // ==========================================
  // LÓGICA DE SALVAMENTO (API FETCH)
  // ==========================================

  async handlePublish() {
    const storyId = this.storyIdInput ? this.storyIdInput.value.trim() : "";
    const isEditing = storyId !== "";

    const title = this.titleInput.value.trim();
    const author = this.authorInput.value.trim();
    const genre = this.genreSelect.value;
    const synopsis = this.synopsisTextarea.value.trim();
    const coverUrl = this.coverUrlInput.value.trim();
    const content = this.formatContentForBackend();

    if (!title) {
      showToast("Por favor, preencha o Título da obra.", "error", "ph-warning-circle");
      this.switchTab("tabInfo", document.getElementById("btnTabInfo"));
      return;
    }

    if (!content || content === "<br>") {
      showToast("O conteúdo da história não pode estar vazio.", "error", "ph-warning-circle");
      return;
    }

    // Feedback Visual
    this.btnPublish.disabled = true;
    this.btnPublish.innerHTML = `<i class="ph ph-spinner animate-spin"></i> ${isEditing ? "Atualizando..." : "Publicando..."}`;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("genre", genre);
    formData.append("synopsis", synopsis);
    formData.append("coverUrl", coverUrl);
    formData.append("content", content);

    if (this.coverInput.files.length > 0) {
      formData.append("coverFile", this.coverInput.files[0]);
    }

    try {
      const url = isEditing ? `/api/v1/admin/stories/${storyId}` : "/api/v1/admin/stories";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(
          `✨ Obra ${isEditing ? "atualizada" : "sincronizada"} com sucesso no GitHub e Banco!`,
          "success",
          "ph-check-circle",
        );
        window.location.href = "/admin/stories";
      } else {
        showToast(
          result.message || "Falha ao processar os dados. Tente novamente.",
          "error",
          "ph-x-circle",
        );
        this.resetPublishButton(isEditing);
      }
    } catch (err) {
      console.error("Erro de rede:", err);
      showToast(`Erro de conexão ao ${isEditing ? "atualizar" : "publicar"}.`, "error", "ph-plugs");
      this.resetPublishButton(isEditing);
    }
  }

  resetPublishButton(isEditing) {
    this.btnPublish.disabled = false;
    this.btnPublish.innerHTML = `<i class="ph ph-paper-plane-tilt"></i> ${isEditing ? "Atualizar" : "Publicar"}`;
  }

  saveDraft() {
    const draftData = {
      title: this.titleInput.value.trim(),
      author: this.authorInput.value.trim(),
      genre: this.genreSelect.value,
      synopsis: this.synopsisTextarea.value.trim(),
      coverUrl: this.coverUrlInput.value.trim(),
      content: this.formatContentForBackend(),
    };

    localStorage.setItem("@rimufic:draft", JSON.stringify(draftData));
    showToast("Rascunho salvo localmente em seu navegador.", "info", "ph-floppy-disk");
  }

  loadDraft() {
    // Só carrega rascunho se for uma "Nova Obra" (Sem ID)
    if (this.storyIdInput && this.storyIdInput.value.trim() !== "") return;

    const draft = localStorage.getItem("@rimufic:draft");
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (this.titleInput && data.title) this.titleInput.value = data.title;
        if (this.authorInput && data.author) this.authorInput.value = data.author;
        if (this.genreSelect && data.genre) this.genreSelect.value = data.genre;
        if (this.synopsisTextarea && data.synopsis) this.synopsisTextarea.value = data.synopsis;

        if (this.coverUrlInput && data.coverUrl) {
          this.coverUrlInput.value = data.coverUrl;
          this.previewImageUrl(data.coverUrl);
        }

        if (this.editorArea && data.content && data.content !== "<br>") {
          this.editorArea.innerHTML = data.content;
        }

        showToast("Rascunho anterior recuperado.", "info", "ph-magic-wand");
      } catch (e) {
        console.error("Erro ao carregar o rascunho:", e);
      }
    }
  }
}

// ==========================================
// INICIALIZAÇÃO E PONTE COM O HTML (EJS)
// ==========================================
const appEditor = new StoryEditor();

// Mapeamos os métodos da classe para o escopo global (window)
// Isso é necessário porque seu arquivo HTML usa atributos como `onclick="switchTab(...)"` nativamente.
window.switchTab = (tabId, btn) => appEditor.switchTab(tabId, btn);
window.previewImage = (e) => appEditor.previewImage(e);
window.previewImageUrl = (url) => appEditor.previewImageUrl(url);
window.execCmd = (cmd) => appEditor.execCmd(cmd);
window.loadTemplate = () => appEditor.loadTemplate();
window.toggleCoverMode = (mode) => {
  const modeUpload = document.getElementById("modeUpload");
  const modeUrl = document.getElementById("modeUrl");
  const coverInput = document.getElementById("coverInput");
  const coverUrl = document.getElementById("coverUrl");

  if (mode === "upload") {
    modeUpload.style.display = "block";
    modeUrl.style.display = "none";

    // Limpa a URL se ele voltou para a aba de arquivo local
    coverUrl.value = "";
    appEditor.previewImageUrl("");
  } else {
    modeUpload.style.display = "none";
    modeUrl.style.display = "block";

    // Limpa o arquivo selecionado se ele mudou para aba de URL
    coverInput.value = "";
    document.getElementById("coverPreview").style.display = "none";
    document.getElementById("coverUploadBox").style.color = "";
    document.querySelector("#coverUploadBox i").style.opacity = "1";
    document.querySelector("#coverUploadBox span").style.opacity = "1";
  }
};
