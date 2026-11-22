// public/js/pages/create-story.js

class StoryEditor {
  constructor() {
    this.autosaveTimer = null;
    this.cacheElements();
    this.bindEvents();
    this.setupEditor();
    this.setupAutosaveListeners();
    this.loadDraft();
    this.updateWordCount();
  }

  cacheElements() {
    // Botões e Formulário
    this.btnPublish = document.getElementById("btnPublish");
    this.btnDraft = document.getElementById("btnSaveDraft") || document.getElementById("btnDraft");
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

    // Fonte e Formato da Obra (Domínio Público e PDFs)
    this.sourceTypeSelect = document.getElementById("sourceType");
    this.sourceUrlInput = document.getElementById("sourceUrl");
    this.pdfFileInput = document.getElementById("pdfFileInput");
    this.pdfUrlInput = document.getElementById("pdfUrlInput");
    this.sectionPdfUpload = document.getElementById("sectionPdfUpload");

    // Editor e Abas
    this.editorArea = document.getElementById("editorArea");
    this.tabPanes = document.querySelectorAll(".tab-pane");
    this.tabBtns = document.querySelectorAll(".tab-btn");

    // Preview da URL
    this.urlPreviewImg = document.getElementById("urlPreviewImg");
    this.urlPlaceholderText = document.getElementById("urlPlaceholderText");

    // Barra de Status e Modo Zen
    this.autosaveStatus = document.getElementById("autosaveStatus");
    this.wordCountSpan = document.getElementById("wordCount");
    this.readingTimeEstimateSpan = document.getElementById("readingTimeEstimate");
    this.btnZenMode = document.getElementById("btnZenMode");
  }

  bindEvents() {
    if (this.btnPublish) {
      this.btnPublish.addEventListener("click", () => this.handlePublish());
    }
    if (this.btnDraft) {
      this.btnDraft.addEventListener("click", () => this.saveDraft(false));
    }

    // Tecla Escape para sair do Modo Zen
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("zen-mode")) {
        this.toggleZenMode();
      }
    });
  }

  setupEditor() {
    if (!this.editorArea) return;

    document.execCommand("defaultParagraphSeparator", false, "p");

    this.editorArea.addEventListener("input", () => {
      this.handleEditorInput();
      this.updateWordCount();
      this.triggerAutosave();
    });

    this.editorArea.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.originalEvent || e).clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      this.updateWordCount();
      this.triggerAutosave();
    });
  }

  setupAutosaveListeners() {
    const inputs = [this.titleInput, this.authorInput, this.synopsisTextarea, this.coverUrlInput];
    inputs.forEach((input) => {
      if (input) {
        input.addEventListener("input", () => this.triggerAutosave());
      }
    });

    if (this.genreSelect) {
      this.genreSelect.addEventListener("change", () => this.triggerAutosave());
    }
  }

  triggerAutosave() {
    // Não executa autosave em modo de edição de obra já publicada para evitar sobrescrita acidental
    if (this.storyIdInput && this.storyIdInput.value.trim() !== "") return;

    if (this.autosaveStatus) {
      this.autosaveStatus.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> Salvando rascunho...';
      this.autosaveStatus.style.opacity = "1";
    }

    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      this.saveDraft(true);
    }, 1200);
  }

  updateWordCount() {
    if (!this.editorArea) return;

    const text = this.editorArea.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const readingTime = Math.ceil(words / 200) || 0;

    if (this.wordCountSpan) {
      this.wordCountSpan.innerText = `${words} ${words === 1 ? "palavra" : "palavras"}`;
    }

    if (this.readingTimeEstimateSpan) {
      this.readingTimeEstimateSpan.innerText = `~${readingTime} min de leitura`;
    }
  }

  // ==========================================
  // MÉTODOS DE INTERFACE (ABAS E IMAGENS)
  // ==========================================
  switchTab(tabId, btnElement) {
    this.tabPanes.forEach((pane) => pane.classList.remove("active"));
    this.tabBtns.forEach((btn) => btn.classList.remove("active"));

    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add("active");
    if (btnElement) btnElement.classList.add("active");
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
  // MÉTODOS DO EDITOR (WYSIWYG 2.0)
  // ==========================================

  execCmd(command) {
    document.execCommand(command, false, null);
    this.editorArea.focus();
    this.updateWordCount();
    this.triggerAutosave();
  }

  formatBlock(tag) {
    document.execCommand("formatBlock", false, tag);
    this.editorArea.focus();
    this.updateWordCount();
    this.triggerAutosave();
  }

  insertSceneBreak() {
    const breakHtml = '<div class="scene-break">✧ ✧ ✧</div><p><br></p>';
    document.execCommand("insertHTML", false, breakHtml);
    this.editorArea.focus();
    this.updateWordCount();
    this.triggerAutosave();
  }

  toggleZenMode() {
    document.body.classList.toggle("zen-mode");
    const isZen = document.body.classList.contains("zen-mode");

    if (this.btnZenMode) {
      this.btnZenMode.innerHTML = isZen
        ? '<i class="ph ph-arrows-in-simple"></i>'
        : '<i class="ph ph-arrows-out-simple"></i>';
      this.btnZenMode.title = isZen
        ? "Sair do Modo Zen (Esc)"
        : "Modo Zen (Foco em Tela Cheia)";
    }

    if (isZen) {
      showToast("Modo Zen ativado! Pressione Esc para sair.", "info", "ph-feather");
    }
  }

  loadTemplate() {
    const templateHTML = `
        <h2 style="text-align: center; font-family: 'Playfair Display', serif; color: var(--accent);">Capítulo I: A Noite Desperta</h2>
        <br>
        <p>A noite na floresta amazônica não é silenciosa. Ela pulsa, respira e sussurra. Mas naquela noite específica, perto da curva do Rio Negro, um silêncio antinatural havia caído como uma mortalha grossa.</p>
        <br>
        <p>Tião limpou o suor da testa com as costas da mão suja de graxa e serragem. O motor da motosserra estava desligado, repousando aos seus pés como uma besta adormecida.</p>
        <br>
        <div class="scene-break">✧ ✧ ✧</div>
        <br>
        <blockquote>"As lendas não nascem da imaginação, mas das sombras que os olhos mortais se recusam a aceitar."</blockquote>
        <br>
        <p>Foi então que o cheiro mudou. A fragrância úmida de terra e folhas verdes foi substituída por um odor acre de fumaça e enxofre...</p>
    `;

    if (this.editorArea.innerHTML.trim() === "" || this.editorArea.innerHTML === "<br>") {
      this.editorArea.innerHTML = templateHTML;
    } else {
      this.editorArea.innerHTML +=
        '<br><div class="scene-break">✧ ✧ ✧</div><br>' +
        templateHTML;
    }

    this.updateWordCount();
    this.triggerAutosave();
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
    return htmlLimpo;
  }

  // ==========================================
  // LÓGICA DE SALVAMENTO (API FETCH & DRAFT)
  // ==========================================

  getSelectedFormat() {
    const checkedRadio = document.querySelector('input[name="formatToggle"]:checked');
    return checkedRadio ? checkedRadio.value : "text";
  }

  async handlePublish() {
    const storyId = this.storyIdInput ? this.storyIdInput.value.trim() : "";
    const isEditing = storyId !== "";

    const title = this.titleInput.value.trim();
    const author = this.authorInput.value.trim();
    const genre = this.genreSelect.value;
    const synopsis = this.synopsisTextarea.value.trim();
    const coverUrl = this.coverUrlInput.value.trim();
    const format = this.getSelectedFormat();
    const sourceType = this.sourceTypeSelect ? this.sourceTypeSelect.value : "original";
    const sourceUrl = this.sourceUrlInput ? this.sourceUrlInput.value.trim() : "";
    const pdfUrl = this.pdfUrlInput ? this.pdfUrlInput.value.trim() : "";
    const content = this.formatContentForBackend();

    if (!title) {
      showToast("Por favor, preencha o Título da obra.", "error", "ph-warning-circle");
      this.switchTab("tabInfo", document.getElementById("btnTabInfo"));
      return;
    }

    if (format === "pdf") {
      const hasPdfFile = this.pdfFileInput && this.pdfFileInput.files && this.pdfFileInput.files.length > 0;
      if (!hasPdfFile && !pdfUrl) {
        showToast("Para livros em PDF, envie um arquivo ou informe o link.", "error", "ph-warning-circle");
        this.switchTab("tabInfo", document.getElementById("btnTabInfo"));
        return;
      }
    } else {
      if (!content || content === "<br>") {
        showToast("O conteúdo da história não pode estar vazio.", "error", "ph-warning-circle");
        this.switchTab("tabEditor", document.getElementById("btnTabEditor"));
        return;
      }
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
    formData.append("format", format);
    formData.append("sourceType", sourceType);
    formData.append("sourceUrl", sourceUrl);
    formData.append("pdfUrl", pdfUrl);

    if (this.coverInput && this.coverInput.files.length > 0) {
      formData.append("coverFile", this.coverInput.files[0]);
    }

    if (format === "pdf" && this.pdfFileInput && this.pdfFileInput.files.length > 0) {
      formData.append("pdfFile", this.pdfFileInput.files[0]);
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
        localStorage.removeItem("@rimufic:draft");
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

  saveDraft(silent = false) {
    const draftData = {
      title: this.titleInput ? this.titleInput.value.trim() : "",
      author: this.authorInput ? this.authorInput.value.trim() : "",
      genre: this.genreSelect ? this.genreSelect.value : "folclore",
      synopsis: this.synopsisTextarea ? this.synopsisTextarea.value.trim() : "",
      coverUrl: this.coverUrlInput ? this.coverUrlInput.value.trim() : "",
      format: this.getSelectedFormat(),
      sourceType: this.sourceTypeSelect ? this.sourceTypeSelect.value : "original",
      sourceUrl: this.sourceUrlInput ? this.sourceUrlInput.value.trim() : "",
      pdfUrl: this.pdfUrlInput ? this.pdfUrlInput.value.trim() : "",
      content: this.formatContentForBackend(),
      updatedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    localStorage.setItem("@rimufic:draft", JSON.stringify(draftData));

    if (this.autosaveStatus) {
      this.autosaveStatus.innerHTML = `<i class="ph ph-cloud-check"></i> Rascunho salvo às ${draftData.updatedAt}`;
    }

    if (!silent) {
      showToast("Rascunho salvo com sucesso no navegador.", "info", "ph-floppy-disk");
    }
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

        if (this.sourceTypeSelect && data.sourceType) this.sourceTypeSelect.value = data.sourceType;
        if (this.sourceUrlInput && data.sourceUrl) this.sourceUrlInput.value = data.sourceUrl;
        if (this.pdfUrlInput && data.pdfUrl) this.pdfUrlInput.value = data.pdfUrl;

        if (data.format && window.toggleFormatMode) {
          const radio = document.querySelector(`input[name="formatToggle"][value="${data.format}"]`);
          if (radio) {
            radio.checked = true;
            window.toggleFormatMode(data.format);
          }
        }

        if (this.coverUrlInput && data.coverUrl) {
          this.coverUrlInput.value = data.coverUrl;
          this.previewImageUrl(data.coverUrl);
        }

        if (this.editorArea && data.content && data.content !== "<br>") {
          this.editorArea.innerHTML = data.content;
        }

        if (this.autosaveStatus && data.updatedAt) {
          this.autosaveStatus.innerHTML = `<i class="ph ph-clock-counter-clockwise"></i> Rascunho anterior recuperado (${data.updatedAt})`;
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

window.switchTab = (tabId, btn) => appEditor.switchTab(tabId, btn);
window.previewImage = (e) => appEditor.previewImage(e);
window.previewImageUrl = (url) => appEditor.previewImageUrl(url);
window.execCmd = (cmd) => appEditor.execCmd(cmd);
window.formatBlock = (tag) => appEditor.formatBlock(tag);
window.insertSceneBreak = () => appEditor.insertSceneBreak();
window.toggleZenMode = () => appEditor.toggleZenMode();
window.loadTemplate = () => appEditor.loadTemplate();
window.toggleFormatMode = (mode) => {
  const sectionPdf = document.getElementById("sectionPdfUpload");
  const tabEditorBtn = document.getElementById("btnTabEditor");
  if (sectionPdf) {
    sectionPdf.style.display = mode === "pdf" ? "block" : "none";
  }
  if (tabEditorBtn) {
    tabEditorBtn.innerHTML = mode === "pdf"
      ? '<i class="ph ph-pen-nib"></i> 2. Notas / Descrição (Opcional)'
      : '<i class="ph ph-pen-nib"></i> 2. Escrever História';
  }
};

window.toggleCoverMode = (mode) => {
  const modeUpload = document.getElementById("modeUpload");
  const modeUrl = document.getElementById("modeUrl");
  const coverInput = document.getElementById("coverInput");
  const coverUrl = document.getElementById("coverUrl");

  if (mode === "upload") {
    modeUpload.style.display = "block";
    modeUrl.style.display = "none";
    coverUrl.value = "";
    appEditor.previewImageUrl("");
  } else {
    modeUpload.style.display = "none";
    modeUrl.style.display = "block";
    coverInput.value = "";
    document.getElementById("coverPreview").style.display = "none";
    document.getElementById("coverUploadBox").style.color = "";
    document.querySelector("#coverUploadBox i").style.opacity = "1";
    document.querySelector("#coverUploadBox span").style.opacity = "1";
  }
};
