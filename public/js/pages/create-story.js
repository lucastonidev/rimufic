// public/js/pages/create-story.js

class StoryEditor {
  constructor() {
    // 1. Mapeamos os elementos da tela uma única vez
    this.cacheElements();

    // 2. Iniciamos os escutadores de eventos
    this.bindEvents();

    // 3. Configuramos os comportamentos mágicos do editor
    this.setupEditor();
  }

  cacheElements() {
    // Botões e Formulário
    this.btnPublish = document.getElementById("btnPublish");
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
    // Delega o envio para a função handlePublish
    if (this.btnPublish) {
      this.btnPublish.addEventListener("click", () => this.handlePublish());
    }
  }

  setupEditor() {
    if (!this.editorArea) return;

    // Instrui o navegador a usar <p> em vez de <div> quando o usuário der "Enter"
    document.execCommand("defaultParagraphSeparator", false, "p");

    // Escuta o que o usuário digita
    this.editorArea.addEventListener("input", () => this.handleEditorInput());
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

      // Trava no Front-End (4MB)
      if (file.size > maxSizeInMB * 1024 * 1024) {
        alert(
          `A imagem selecionada é muito pesada (${(file.size / (1024 * 1024)).toFixed(2)} MB). Escolha um arquivo de até ${maxSizeInMB} MB.`,
        );
        input.value = ""; // Limpa a seleção
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
        this.urlPlaceholderText.innerText =
          "URL inválida ou imagem inacessível.";
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

    if (
      this.editorArea.innerHTML.trim() === "" ||
      this.editorArea.innerHTML === "<br>"
    ) {
      this.editorArea.innerHTML = templateHTML;
    } else {
      this.editorArea.innerHTML +=
        '<br><hr style="border: 1px dashed var(--glass-border); margin: 2rem 0;"><br>' +
        templateHTML;
    }
  }

  handleEditorInput() {
    // Se o usuário começar a digitar texto "solto" (sem tag HTML),
    // envolvemos num <p> na hora para ativar a Letra Capitular do CSS
    if (
      this.editorArea.innerHTML.length > 0 &&
      !this.editorArea.innerHTML.startsWith("<")
    ) {
      const text = this.editorArea.innerHTML;
      this.editorArea.innerHTML = `<p>${text}</p>`;

      const selection = window.getSelection();
      const range = document.createRange();

      const textNode =
        this.editorArea.childNodes[0].firstChild ||
        this.editorArea.childNodes[0];

      range.selectNodeContents(textNode);
      range.collapse(false); // false = colapsa para o final
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Limpeza de lixo HTML gerado por navegadores
    if (
      this.editorArea.innerHTML === "<br>" ||
      this.editorArea.innerHTML === "<p><br></p>"
    ) {
      this.editorArea.innerHTML = "";
    }
  }

  formatContentForBackend() {
    let htmlBruto = this.editorArea.innerHTML;

    // 1. Remove tags <span> e <div> desnecessárias
    let htmlLimpo = htmlBruto.replace(/<\/?span[^>]*>/gi, "");

    // 2. Padroniza tags de títulos inseridas nativamente
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
      alert("Por favor, preencha o Título da obra.");
      this.switchTab("tabInfo", document.getElementById("btnTabInfo"));
      return;
    }

    if (!content || content === "<br>") {
      alert("O conteúdo da história não pode estar vazio.");
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
      const url = isEditing
        ? `/api/v1/admin/stories/${storyId}`
        : "/api/v1/admin/stories";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(
          `✨ Obra ${isEditing ? "atualizada" : "sincronizada"} com sucesso no GitHub e Banco!`,
        );
        window.location.href = "/admin/stories";
      } else {
        alert(
          `Erro ao ${isEditing ? "atualizar" : "publicar"}: ` +
            (result.message || "Tente novamente."),
        );
        this.resetPublishButton(isEditing);
      }
    } catch (err) {
      console.error("Erro de rede:", err);
      alert(`Erro de conexão ao ${isEditing ? "atualizar" : "publicar"}.`);
      this.resetPublishButton(isEditing);
    }
  }

  resetPublishButton(isEditing) {
    this.btnPublish.disabled = false;
    this.btnPublish.innerHTML = `<i class="ph ph-paper-plane-tilt"></i> ${isEditing ? "Atualizar" : "Publicar"}`;
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
