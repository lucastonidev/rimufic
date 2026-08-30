// public/js/pages/prompt.js

class PromptGenerator {
  constructor() {
    this.STORAGE_KEY = "@RimuFic:SavedPrompts";
    this.currentPromptId = null;

    // Aguarda o DOM carregar completamente antes de iniciar
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.cacheElements();

    // Trava de Segurança: Se não encontrar o formulário (ex: está na Home), para a execução aqui!
    if (!this.ui.form) return;

    this.bindEvents();
    this.renderSavedList();
    this.exposeToWindow(); // Expõe os botões para o HTML
  }

  cacheElements() {
    this.ui = {
      form: document.getElementById("promptForm"),
      outputDiv: document.getElementById("promptOutput"),
      savedListDiv: document.getElementById("savedPromptsList"),
      btnGenerate: document.getElementById("btnGenerate"),
      editorToolbar: document.getElementById("editorToolbar"),
      fandom: document.getElementById("fandom"),
      charA: document.getElementById("charA"),
      charB: document.getElementById("charB"),
      tone: document.getElementById("tone"),
      trope: document.getElementById("trope"),
      pacing: document.getElementById("pacing"),
      focus: document.getElementById("focus"),
      descLevel: document.getElementById("descLevel"),
      hook: document.getElementById("hook"),
      details: document.getElementById("details"),
      noRepetition: document.getElementById("noRepetition"),
      longChapters: document.getElementById("longChapters"),
      toastContainer: document.getElementById("toastContainer"),
      advancedOptions: document.getElementById("advancedOptions"),
      btnToggleAdvanced: document.getElementById("btnToggleAdvanced"),
    };
  }

  bindEvents() {
    this.ui.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.generateAndDisplayPrompt();
    });

    // MÁGICA DAS PASTAS: Desvincula ID ao digitar para criar Novo Arquivo
    this.ui.form.addEventListener("input", () => {
      this.currentPromptId = null;
    });

    this.ui.outputDiv.addEventListener("input", () => {
      this.currentPromptId = null;
    });

    // Atalho CTRL + ENTER
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        if (this.ui.form.checkValidity()) {
          e.preventDefault();
          this.generateAndDisplayPrompt();
        } else {
          this.ui.form.reportValidity();
        }
      }
    });
  }

  getFormData() {
    return {
      universo: this.ui.fandom.value.trim(),
      personagemA: this.ui.charA.value.trim(),
      personagemB: this.ui.charB.value.trim(),
      tom: this.ui.tone.value,
      tropo: this.ui.trope.value,
      ritmo: this.ui.pacing.value,
      foco: this.ui.focus.value,
      nivelDescricao: this.ui.descLevel.value,
      gancho: this.ui.hook.value.trim(),
      detalhes: this.ui.details.value.trim(),
      evitarRepeticao: this.ui.noRepetition.checked,
      capitulosLongos: this.ui.longChapters.checked,
    };
  }

  generateAndDisplayPrompt() {
    this.ui.btnGenerate.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Gerando...`;
    this.ui.btnGenerate.style.opacity = "0.7";

    setTimeout(() => {
      const data = this.getFormData();
      const novoConteudo = this.buildRichPrompt(data);
      this.ui.outputDiv.innerHTML = novoConteudo;

      this.ui.editorToolbar.style.display = "flex";
      showToast("Prompt gerado com sucesso!", "success", "ph-check");

      this.ui.btnGenerate.innerHTML = `<i class="ph ph-magic-wand"></i> Gerar Prompt`;
      this.ui.btnGenerate.style.opacity = "1";

      if (this.currentPromptId) this.saveCurrentPrompt(false);
    }, 400);
  }

  buildRichPrompt(data) {
    let html = `<h2># INFORMAÇÕES BÁSICAS</h2>`;
    html += `<p>Atue como um escritor profissional, premiado e especialista na criação de fanfics de alta qualidade. Sua tarefa é escrever uma história envolvente e coesa baseada nas seguintes diretrizes.</p>`;
    html += `<p><strong>Universo / Fandom:</strong> ${data.universo}</p>`;
    html += `<p><strong>Personagem A:</strong> ${data.personagemA} | <strong>Personagem B:</strong> ${data.personagemB}</p>`;
    html += `<p><strong>Dinâmica / Tropo Principal:</strong> ${data.tropo} | <strong>Tom / Atmosfera:</strong> ${data.tom}</p>`;

    html += `<h2># EVENTO INICIAL (GANCHO)</h2>`;
    html += `<p><em>"${data.gancho || "Desenvolva uma introdução natural e cativante baseada no tropo selecionado."}"</em></p>`;

    if (data.detalhes) {
      html += `<h2># DETALHES ESPECÍFICOS E REGRAS</h2>`;
      html += `<p>${data.detalhes.replace(/\n/g, "<br>")}</p>`;
    }

    // AQUI VOLTAM AS DIRETRIZES TÉCNICAS E OPÇÕES AVANÇADAS
    html += `<h2># DIRETRIZES TÉCNICAS DE ESCRITA</h2>`;
    html += `<p><strong>Foco Principal:</strong> A trama deve priorizar <em>${data.foco}</em> em sua construção narrativa.</p>`;
    html += `<p><strong>Ritmo (Pacing):</strong> A progressão da história deve ter um ritmo <em>${data.ritmo}</em>, garantindo que os eventos pareçam orgânicos.</p>`;
    html += `<p><strong>Nível de Descrição:</strong> <em>${data.nivelDescricao}</em>. Revele emoções através de ações sutis e subtexto (Show, don't tell).</p>`;

    if (data.evitarRepeticao) {
      html += `<p><strong>Vocabulário:</strong> Empregue um vocabulário rico e diversificado. <strong>Evite absolutamente a repetição de palavras</strong> próximas umas das outras, bem como o uso de expressões genéricas de IA.</p>`;
    }

    if (data.capitulosLongos) {
      html += `<p><strong>Extensão:</strong> Escreva capítulos densos, longos e substanciais. Cada cena deve ter tempo para respirar e desenvolver a psicologia dos personagens.</p>`;
    }

    return html;
  }

  saveCurrentPrompt(showNotify = true) {
    const data = this.getFormData();
    if (!data.universo || !data.personagemA) {
      return showToast("Preencha os campos vitais.", "error", "ph-warning");
    }

    const htmlContent = this.ui.outputDiv.innerHTML.trim();
    if (!htmlContent || this.ui.outputDiv.querySelector(".empty-state")) {
      return showToast("Gere antes de salvar.", "error", "ph-warning");
    }

    const savedItem = {
      id: this.currentPromptId || crypto.randomUUID(),
      ...data,
      promptGerado: htmlContent,
      dataCriacao: new Date().toISOString(),
    };

    let savedData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
    const existingIndex = savedData.findIndex((item) => item.id === savedItem.id);

    if (existingIndex >= 0) savedData[existingIndex] = savedItem;
    else savedData.push(savedItem);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedData));
    this.currentPromptId = savedItem.id;

    if (showNotify) {
      showToast("Prompt Salvo!", "success", "ph-floppy-disk");
      this.renderSavedList();
    }
  }

  renderSavedList() {
    const savedData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
    if (savedData.length === 0) {
      this.ui.savedListDiv.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><i class="ph ph-folder-dashed"></i><p>Nenhum universo salvo ainda.</p></div>`;
      return;
    }

    const folders = {};
    savedData.forEach((item) => {
      const folderName = item.universo || "Outros";
      if (!folders[folderName]) folders[folderName] = [];
      folders[folderName].push(item);
    });

    let html = "";
    for (const [folderName, items] of Object.entries(folders)) {
      html += `
        <div class="folder-card glass">
            <div class="folder-header">
                <i class="ph-fill ph-folder" style="font-size: 1.5rem; color: var(--accent);"></i>
                <h3>${this.escapeHTML(folderName)}</h3>
            </div>
            <div class="folder-content">
      `;

      items.forEach((item) => {
        html += `
            <div class="folder-item" onclick="loadPrompt('${item.id}')">
                <p><i class="ph ph-file-text"></i> ${this.escapeHTML(item.personagemA)} & ${this.escapeHTML(item.personagemB)}</p>
                <button class="btn-icon" style="color: var(--danger); padding: 4px;" onclick="deletePrompt('${item.id}', event)" title="Apagar Prompt">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `;
      });
      html += `</div></div>`;
    }

    this.ui.savedListDiv.innerHTML = html;
  }

  loadPrompt(id) {
    const item = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]").find(
      (i) => i.id === id,
    );
    if (item) {
      this.currentPromptId = item.id;

      this.ui.fandom.value = item.universo || "";
      this.ui.charA.value = item.personagemA || "";
      this.ui.charB.value = item.personagemB || "";
      this.ui.tone.value = item.tom || "Slow Burn";
      this.ui.trope.value = item.tropo || "Inimigos para Amantes";
      this.ui.pacing.value = item.ritmo || "Moderado";
      this.ui.focus.value = item.foco || "Equilíbrio";
      this.ui.descLevel.value = item.nivelDescricao || "Detalhado";
      this.ui.hook.value = item.gancho || "";
      this.ui.details.value = item.detalhes || "";
      this.ui.noRepetition.checked =
        item.evitarRepeticao !== undefined ? item.evitarRepeticao : true;
      this.ui.longChapters.checked =
        item.capitulosLongos !== undefined ? item.capitulosLongos : true;

      this.ui.outputDiv.innerHTML = item.promptGerado || "";
      this.ui.editorToolbar.style.display = "flex";
  showToast("Carregado.", "info", "ph-download");
    }
  }

  deletePrompt(id, ev) {
    ev.stopPropagation();
    let savedData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]").filter(
      (item) => item.id !== id,
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedData));

    if (this.currentPromptId === id) this.clearForm(false);
    this.renderSavedList();
  }

  clearForm(show = true) {
    this.ui.form.reset();
    this.currentPromptId = null;
    this.ui.outputDiv.innerHTML = `<div class="empty-state"><i class="ph ph-sparkle"></i><p>Preencha os dados e clique em "Gerar".</p></div>`;
    this.ui.editorToolbar.style.display = "none";
    if (show) showToast("Limpo", "info", "ph-arrows-clockwise");
  }

  copyPrompt() {
    navigator.clipboard
      .writeText(this.ui.outputDiv.innerText)
      .then(() => showToast("Copiado!", "success", "ph-copy"));
  }

  formatText(e, cmd, val = null) {
    e.preventDefault();
    document.execCommand(cmd, false, val);
    this.ui.outputDiv.focus();
  }

  loadExampleData() {
    this.ui.fandom.value = "Winx Club";
    this.ui.charA.value = "Bloom";
    this.ui.charB.value = "Valtor";
    this.generateAndDisplayPrompt();
  }

  toggleAdvanced() {
    // Como agora começa visível (block), ajustamos a lógica de clique
    if (
      this.ui.advancedOptions.style.display === "none" ||
      this.ui.advancedOptions.style.display === ""
    ) {
      this.ui.advancedOptions.style.display = "block";
      this.ui.btnToggleAdvanced.innerHTML = `<i class="ph ph-caret-up"></i> Ocultar Opções Avançadas`;
    } else {
      this.ui.advancedOptions.style.display = "none";
      this.ui.btnToggleAdvanced.innerHTML = `<i class="ph ph-faders"></i> Mostrar Opções Avançadas`;
    }
  }

  escapeHTML(str) {
    return str.replace(
      /[&<>'"]/g,
      (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[t],
    );
  }

  exposeToWindow() {
    window.formatText = (e, cmd, val) => this.formatText(e, cmd, val);
    window.copyPrompt = () => this.copyPrompt();
    window.saveCurrentPrompt = () => this.saveCurrentPrompt();
    window.loadExampleData = () => this.loadExampleData();
    window.clearForm = () => this.clearForm();
    window.loadPrompt = (id) => this.loadPrompt(id);
    window.deletePrompt = (id, ev) => this.deletePrompt(id, ev);
    window.toggleAdvanced = () => this.toggleAdvanced();
  }
}
const promptApp = new PromptGenerator();