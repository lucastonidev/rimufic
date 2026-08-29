// public/js/pages/read.js
import { SimpleMode } from "../components/reader/SimpleMode.js";
import { RealisticMode } from "../components/reader/RealisticMode.js";

class ReaderController {
  constructor() {
    this.cacheElements();

    this.state = {
      mode: "simple",
      simpleCurrentPage: 0,
      simpleTotalPages: 1,
      simpleGap: 40,
      fontSize: 1.25,
      animStyle: "flip",
      isAnimating: false,
      pageFlipInstance: null,
      isRebuildingRealistic: false,
      hasPendingRealisticRebuild: false,
    };

    this.simpleMotor = new SimpleMode(
      this.state,
      this.ui,
      this.updateUIProgress.bind(this),
    );
    this.realisticMotor = new RealisticMode(
      this.state,
      this.ui,
      this.updateUIProgress.bind(this),
    );

    this.bindEvents();
    this.init();
  }

  cacheElements() {
    this.ui = {
      containerSimple: document.getElementById("containerSimple"),
      viewportSimple: document.getElementById("viewportSimple"),
      contentSimple: document.getElementById("bookContentSimple"),
      containerRealistic: document.getElementById("containerRealistic"),
      pageInfo: document.getElementById("pageInfo"),
      progressBar: document.getElementById("progressBar"),
      settingsPanel: document.getElementById("settingsPanel"),
      fontSizeDisplay: document.getElementById("fontSizeDisplay"),
      animGroup: document.getElementById("animGroup"),
      fontWarning: document.getElementById("fontWarning"),
    };
  }

  // NOVA FUNÇÃO: Recalcula o livro toda vez que a tela mudar!
  recalculateCurrentMode() {
    if (this.state.mode === "simple") {
      this.simpleMotor.calculatePages();
    } else if (this.state.mode === "scroll") {
      this.simpleMotor.updateScrollProgress();
    } else if (this.state.mode === "realistic") {
      this.rebuildRealisticMode();
    }
  }

  async rebuildRealisticMode() {
    if (this.state.mode !== "realistic") return;

    if (this.state.isRebuildingRealistic) {
      this.state.hasPendingRealisticRebuild = true;
      return;
    }

    this.state.isRebuildingRealistic = true;
    this.state.hasPendingRealisticRebuild = false;

    let wasBuilt = false;

    for (let attempt = 0; attempt < 5; attempt++) {
      wasBuilt = await this.realisticMotor.buildPages();
      if (wasBuilt) break;
      await new Promise((resolve) => setTimeout(resolve, 140));
    }

    if (wasBuilt) {
      await this.realisticMotor.init();
      this.realisticMotor.syncProgress();
    }

    this.state.isRebuildingRealistic = false;

    if (this.state.hasPendingRealisticRebuild) {
      this.rebuildRealisticMode();
    }
  }

  bindEvents() {
    document.getElementById("btnSettings").addEventListener("click", () => {
      this.ui.settingsPanel.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (
        !this.ui.settingsPanel.contains(e.target) &&
        !document.getElementById("btnSettings").contains(e.target)
      ) {
        this.ui.settingsPanel.classList.remove("active");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (this.state.mode === "simple") {
        if (e.key === "ArrowRight") this.simpleMotor.nextPage();
        if (e.key === "ArrowLeft") this.simpleMotor.prevPage();
      } else if (this.state.mode === "realistic") {
        if (e.key === "ArrowRight") this.realisticMotor.nextPage();
        if (e.key === "ArrowLeft") this.realisticMotor.prevPage();
      }
    });

    // 1. Escuta o botão de Tela Cheia
    document.addEventListener("fullscreenchange", () => {
      const icon = document.getElementById("btnFullscreen").querySelector("i");
      if (document.fullscreenElement) {
        icon.classList.replace("ph-corners-out", "ph-corners-in");
      } else {
        icon.classList.replace("ph-corners-in", "ph-corners-out");
      }

      // Dá tempo do navegador redesenhar a tela preta antes de medir
      setTimeout(() => this.recalculateCurrentMode(), 300);
    });

    // 2. Escuta quando o usuário redimensiona a janela do Windows/Mac manualmente
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      // Debounce: Aguarda 300ms depois que o usuário parou de arrastar a tela
      resizeTimer = setTimeout(() => {
        if (!document.fullscreenElement) {
          this.recalculateCurrentMode();
        }
      }, 300);
    });
  }

  init() {
    this.setAnimation("flip");
    this.setReadingMode("simple");
  }

  updateUIProgress(current, total) {
    this.ui.pageInfo.innerText = `Página ${current} de ${total}`;
    this.ui.progressBar.style.width = `${(current / total) * 100}%`;
  }

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    ["btnThemeDark", "btnThemeSepia", "btnThemeLight"].forEach((id) =>
      document.getElementById(id).classList.remove("active"),
    );
    const btnMap = {
      dark: "btnThemeDark",
      sepia: "btnThemeSepia",
      light: "btnThemeLight",
    };
    document.getElementById(btnMap[theme]).classList.add("active");
  }

  setAnimation(style) {
    this.state.animStyle = style;
    ["btnAnimFlip", "btnAnimSlide", "btnAnimNone"].forEach((id) =>
      document.getElementById(id).classList.remove("active"),
    );

    if (style === "flip")
      document.getElementById("btnAnimFlip").classList.add("active");
    if (style === "slide")
      document.getElementById("btnAnimSlide").classList.add("active");
    if (style === "none")
      document.getElementById("btnAnimNone").classList.add("active");

    this.ui.contentSimple.style.transition =
      style === "slide"
        ? "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)"
        : "none";
  }

  changeFontSize(step) {
    this.state.fontSize += step;
    if (this.state.fontSize < 0.9) this.state.fontSize = 0.9;
    if (this.state.fontSize > 2.0) this.state.fontSize = 2.0;

    this.ui.contentSimple.style.fontSize = `${this.state.fontSize}rem`;

    if (this.state.fontSize <= 1.0) this.ui.fontSizeDisplay.innerText = "P";
    else if (this.state.fontSize <= 1.3)
      this.ui.fontSizeDisplay.innerText = "M";
    else if (this.state.fontSize <= 1.6)
      this.ui.fontSizeDisplay.innerText = "G";
    else this.ui.fontSizeDisplay.innerText = "GG";

    // O Recalculador Universal assume o papel aqui
    this.recalculateCurrentMode();
  }

  setReadingMode(mode) {
    this.state.mode = mode;

    ["btnModeRealistic", "btnModeSimple", "btnModeScroll"].forEach((id) =>
      document.getElementById(id).classList.remove("active"),
    );

    if (mode === "simple") {
      document.getElementById("btnModeSimple").classList.add("active");
      this.ui.containerSimple.classList.add("active");
      this.ui.containerRealistic.classList.remove("active");
      this.ui.viewportSimple.classList.remove("scroll-mode");

      document.getElementById("tapLeft").style.display = "flex";
      document.getElementById("tapRight").style.display = "flex";

      this.ui.animGroup.classList.remove("hidden-option");
      this.ui.fontWarning.style.display = "none";
      this.simpleMotor.calculatePages();
    } else if (mode === "scroll") {
      document.getElementById("btnModeScroll").classList.add("active");
      this.ui.containerSimple.classList.add("active");
      this.ui.containerRealistic.classList.remove("active");
      this.ui.viewportSimple.classList.add("scroll-mode");

      document.getElementById("tapLeft").style.display = "none";
      document.getElementById("tapRight").style.display = "none";

      this.ui.animGroup.classList.add("hidden-option");
      this.ui.fontWarning.style.display = "none";
      this.simpleMotor.updateScrollProgress();
    } else if (mode === "realistic") {
      document.getElementById("btnModeRealistic").classList.add("active");
      this.ui.containerRealistic.classList.add("active");
      this.ui.containerSimple.classList.remove("active");

      this.ui.animGroup.classList.add("hidden-option");
      this.ui.fontWarning.style.display = "none";

      this.rebuildRealisticMode();
    }
  }

  toggleFullscreen() {
    const readerWrapper = document.getElementById("supremeReader");
    if (!document.fullscreenElement) {
      if (readerWrapper.requestFullscreen) readerWrapper.requestFullscreen();
      else if (readerWrapper.webkitRequestFullscreen)
        readerWrapper.webkitRequestFullscreen();
      else if (readerWrapper.msRequestFullscreen)
        readerWrapper.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  }
}

const readerApp = new ReaderController();

window.setTheme = (t) => readerApp.setTheme(t);
window.setAnimation = (a) => readerApp.setAnimation(a);
window.changeFontSize = (s) => readerApp.changeFontSize(s);
window.setReadingMode = (m) => readerApp.setReadingMode(m);
window.toggleFullscreen = () => readerApp.toggleFullscreen();
window.nextPageSimple = () => readerApp.simpleMotor.nextPage();
window.prevPageSimple = () => readerApp.simpleMotor.prevPage();
