// public/js/components/reader/PdfReader.js

export class PdfReader {
  constructor(containerId = "containerPdf") {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.url = this.container.getAttribute("data-pdf-url");
    if (!this.url) return;

    this.pdfDoc = null;
    this.pageNum = 1;
    this.pageRendering = false;
    this.pageNumPending = null;
    this.scale = 1.25;

    this.canvas = document.getElementById("pdfCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.currentPageSpan = document.getElementById("pdfCurrentPage");
    this.totalPagesSpan = document.getElementById("pdfTotalPages");
    this.zoomDisplaySpan = document.getElementById("pdfZoomDisplay");
    this.loadingSpinner = document.getElementById("pdfLoadingSpinner");

    this.btnPrev = document.getElementById("pdfPrev");
    this.btnNext = document.getElementById("pdfNext");
    this.btnZoomIn = document.getElementById("pdfZoomIn");
    this.btnZoomOut = document.getElementById("pdfZoomOut");
    this.btnFitWidth = document.getElementById("pdfFitWidth");

    this.init();
  }

  async init() {
    this.bindEvents();

    // Configura o worker do PDF.js
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      try {
        const loadingTask = window.pdfjsLib.getDocument({
          url: this.url,
          withCredentials: false,
        });

        this.pdfDoc = await loadingTask.promise;
        if (this.totalPagesSpan) {
          this.totalPagesSpan.innerText = this.pdfDoc.numPages;
        }

        // Tenta recuperar a última página lida salva pelo leitor
        const savedPage = parseInt(
          localStorage.getItem(`@rimufic:pdf_page:${window.location.pathname}`),
          10,
        );
        if (savedPage && savedPage > 0 && savedPage <= this.pdfDoc.numPages) {
          this.pageNum = savedPage;
        }

        if (this.loadingSpinner) {
          this.loadingSpinner.style.display = "none";
        }

        this.renderPage(this.pageNum);
      } catch (err) {
        console.error("Erro ao carregar o PDF:", err);
        if (this.loadingSpinner) {
          this.loadingSpinner.innerHTML = `
            <i class="ph ph-warning-circle" style="color: #EF4444; font-size: 2.5rem;"></i>
            <span style="color: #FCA5A5;">Não foi possível carregar o livro digital.</span>
            <a href="${this.url}" target="_blank" class="btn-primary" style="margin-top: 10px; font-size: 0.85rem; padding: 6px 12px;">
              Baixar PDF diretamente
            </a>
          `;
        }
      }
    }
  }

  bindEvents() {
    if (this.btnPrev) {
      this.btnPrev.addEventListener("click", () => this.onPrevPage());
    }
    if (this.btnNext) {
      this.btnNext.addEventListener("click", () => this.onNextPage());
    }
    if (this.btnZoomIn) {
      this.btnZoomIn.addEventListener("click", () => this.changeZoom(0.2));
    }
    if (this.btnZoomOut) {
      this.btnZoomOut.addEventListener("click", () => this.changeZoom(-0.2));
    }
    if (this.btnFitWidth) {
      this.btnFitWidth.addEventListener("click", () => this.fitToWidth());
    }

    // Atalhos do teclado (Setas Esquerda e Direita)
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") this.onPrevPage();
      if (e.key === "ArrowRight") this.onNextPage();
    });
  }

  async renderPage(num) {
    this.pageRendering = true;

    try {
      const page = await this.pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale: this.scale });

      this.canvas.height = viewport.height;
      this.canvas.width = viewport.width;

      const renderContext = {
        canvasContext: this.ctx,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      await renderTask.promise;

      this.pageRendering = false;

      if (this.pageNumPending !== null) {
        this.renderPage(this.pageNumPending);
        this.pageNumPending = null;
      }

      // Atualiza os indicadores de página
      if (this.currentPageSpan) {
        this.currentPageSpan.innerText = num;
      }

      // Atualiza botões
      if (this.btnPrev) this.btnPrev.disabled = num <= 1;
      if (this.btnNext) this.btnNext.disabled = num >= this.pdfDoc.numPages;

      // Salva progresso da página atual
      localStorage.setItem(`@rimufic:pdf_page:${window.location.pathname}`, num);
    } catch (err) {
      console.error("Erro na renderização da página:", err);
      this.pageRendering = false;
    }
  }

  queueRenderPage(num) {
    if (this.pageRendering) {
      this.pageNumPending = num;
    } else {
      this.renderPage(num);
    }
  }

  onPrevPage() {
    if (this.pageNum <= 1) return;
    this.pageNum--;
    this.queueRenderPage(this.pageNum);
  }

  onNextPage() {
    if (!this.pdfDoc || this.pageNum >= this.pdfDoc.numPages) return;
    this.pageNum++;
    this.queueRenderPage(this.pageNum);
  }

  changeZoom(delta) {
    const newScale = Math.max(0.6, Math.min(2.5, this.scale + delta));
    if (newScale !== this.scale) {
      this.scale = newScale;
      if (this.zoomDisplaySpan) {
        this.zoomDisplaySpan.innerText = `${Math.round(this.scale * 100)}%`;
      }
      this.queueRenderPage(this.pageNum);
    }
  }

  fitToWidth() {
    const wrapper = document.getElementById("pdfCanvasWrapper");
    if (!wrapper || !this.pdfDoc) return;

    this.pdfDoc.getPage(this.pageNum).then((page) => {
      const baseViewport = page.getViewport({ scale: 1 });
      const availableWidth = wrapper.clientWidth - 40; // Desconta padding
      this.scale = Math.max(0.6, Math.min(2.5, availableWidth / baseViewport.width));

      if (this.zoomDisplaySpan) {
        this.zoomDisplaySpan.innerText = `${Math.round(this.scale * 100)}%`;
      }
      this.queueRenderPage(this.pageNum);
    });
  }
}
