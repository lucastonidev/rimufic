export class SimpleMode {
  constructor(state, ui, onProgressUpdate) {
    this.state = state;
    this.ui = ui;
    this.onProgressUpdate = onProgressUpdate;
    this.touchStartX = 0;
    this.bindEvents();
  }

  calculatePages() {
    if (this.state.mode !== "simple") return;

    // 1. Zera animações e posição
    this.state.isAnimating = false;
    this.ui.contentSimple.style.transition = "none";
    this.ui.contentSimple.style.transform = "none";
    this.ui.viewportSimple.style.scrollBehavior = "auto";
    this.ui.viewportSimple.scrollLeft = 0;

    // 2. Pega a largura EXATA com frações de pixel (Evita erro que acumula a cada página)
    const viewportWidth = this.ui.viewportSimple.getBoundingClientRect().width;

    // 3. Aplica as medidas de coluna
    this.ui.contentSimple.style.columnWidth = `${viewportWidth}px`;
    this.ui.contentSimple.style.columnGap = `${this.state.simpleGap}px`;

    // O SEGREDO DO BUG DO TEXTO: Remover o max-content.
    // O max-content faz o Chrome ignorar o tamanho dos espaços, espremendo as colunas!
    this.ui.contentSimple.style.width = "";

    // Força o navegador a recalcular o layout visual
    void this.ui.contentSimple.offsetWidth;

    const step = this.getStep();

    // O scrollWidth bruto agora bate com os múltiplos perfeitos
    this.state.simpleTotalPages = Math.ceil(
      (this.ui.contentSimple.scrollWidth + this.state.simpleGap) / step,
    );

    if (this.state.simpleTotalPages < 1) this.state.simpleTotalPages = 1;
    if (this.state.simpleCurrentPage >= this.state.simpleTotalPages) {
      this.state.simpleCurrentPage = this.state.simpleTotalPages - 1;
    }

    this.updateView("none");
  }

  async updateView(direction = "next") {
    const targetLeft = this.getTargetLeft();

    const displayPage = this.state.simpleCurrentPage + 1;
    this.onProgressUpdate(displayPage, this.state.simpleTotalPages);

    // Reseta estilos para evitar conflitos residuais
    this.ui.contentSimple.style.transition = "none";
    this.ui.contentSimple.style.transform = "none";
    this.ui.viewportSimple.style.scrollBehavior = "auto";

    if (direction === "none" || this.state.animStyle === "none") {
      this.ui.viewportSimple.scrollLeft = targetLeft;
      this.state.isAnimating = false;
      return;
    }

    // ANIMAÇÃO 1: Deslizar - Agora com motor customizado de scroll
    if (this.state.animStyle === "slide") {
      this.state.isAnimating = true;
      await this.smoothScrollTo(this.ui.viewportSimple, targetLeft, 400);
      this.state.isAnimating = false;
      return;
    }

    // ANIMAÇÃO 2: Virar - Corrigida
    if (this.state.animStyle === "flip") {
      this.state.isAnimating = true;
      this.ui.viewportSimple.style.transformOrigin =
        direction === "next" ? "left center" : "right center";

      await this.animateCSS(this.ui.viewportSimple, "flipOutY");

      // Vira a página em milissegundos enquanto está invisível
      this.ui.viewportSimple.scrollLeft = targetLeft;
      this.ui.viewportSimple.style.transformOrigin =
        direction === "next" ? "right center" : "left center";

      await this.animateCSS(this.ui.viewportSimple, "flipInY");

      this.state.isAnimating = false;
    }
  }

  // FUNÇÃO DE ROLAGEM SUAVE CUSTOMIZADA (Ignora bugs nativos dos navegadores)
  smoothScrollTo(element, target, duration) {
    return new Promise((resolve) => {
      const start = element.scrollLeft;
      const change = target - start;
      const startTime = performance.now();

      const animateScroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Curva de aceleração suave (easeInOutQuad) para ficar com o peso de uma página real
        const ease =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        element.scrollLeft = start + change * ease;

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          element.scrollLeft = target; // Crava o valor no final para precisão máxima
          resolve();
        }
      };

      requestAnimationFrame(animateScroll);
    });
  }

  nextPage() {
    if (this.state.isAnimating) return;
    if (
      this.state.mode === "simple" &&
      this.state.simpleCurrentPage < this.state.simpleTotalPages - 1
    ) {
      this.state.simpleCurrentPage++;
      this.updateView("next");
    }
  }

  prevPage() {
    if (this.state.isAnimating) return;
    if (this.state.mode === "simple" && this.state.simpleCurrentPage > 0) {
      this.state.simpleCurrentPage--;
      this.updateView("prev");
    }
  }

  updateScrollProgress() {
    if (this.state.mode !== "scroll") return;
    const scrollTop = this.ui.viewportSimple.scrollTop;
    const scrollHeight =
      this.ui.viewportSimple.scrollHeight - this.ui.viewportSimple.clientHeight;

    if (scrollHeight <= 0) {
      this.ui.progressBar.style.width = "100%";
      this.ui.pageInfo.innerText = "Lido";
      return;
    }
    const scrollPercentage = scrollTop / scrollHeight;
    this.ui.progressBar.style.width = `${scrollPercentage * 100}%`;
    this.ui.pageInfo.innerText = `${Math.round(scrollPercentage * 100)}% Concluído`;
  }

  bindEvents() {
    this.ui.viewportSimple.addEventListener("scroll", () => {
      if (this.state.mode === "scroll")
        window.requestAnimationFrame(() => this.updateScrollProgress());
    });
    this.ui.containerSimple.addEventListener(
      "touchstart",
      (e) => {
        if (this.state.mode !== "simple" || this.state.isAnimating) return;
        this.touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true },
    );
    this.ui.containerSimple.addEventListener(
      "touchend",
      (e) => {
        if (this.state.mode !== "simple" || this.state.isAnimating) return;
        let touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < this.touchStartX - 50) this.nextPage();
        if (touchEndX > this.touchStartX + 50) this.prevPage();
      },
      { passive: true },
    );
  }

  animateCSS(element, animation, prefix = "animate__") {
    return new Promise((resolve) => {
      const animationName = `${prefix}${animation}`;
      element.classList.add(`${prefix}animated`, animationName, "book-anim");
      function handleAnimationEnd(event) {
        event.stopPropagation();
        element.classList.remove(
          `${prefix}animated`,
          animationName,
          "book-anim",
        );
        resolve("Animation ended");
      }
      element.addEventListener("animationend", handleAnimationEnd, {
        once: true,
      });
    });
  }

  getStep() {
    // Usa as medidas exatas da tela sem arredondar para não acumular erros nas páginas finais
    const viewportWidth = this.ui.viewportSimple.getBoundingClientRect().width;
    return viewportWidth + this.state.simpleGap;
  }

  getTargetLeft() {
    const step = this.getStep();
    return this.state.simpleCurrentPage * step;
  }
}
