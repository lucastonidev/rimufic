// public/js/components/reader/RealisticMode.js

export class RealisticMode {
  constructor(state, ui, onProgressUpdate) {
    this.state = state;
    this.ui = ui;
    this.onProgressUpdate = onProgressUpdate;
  }

  normalizeHTML(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    temp.querySelectorAll("div").forEach((div) => {
      const p = document.createElement("p");
      p.innerHTML = div.innerHTML;
      div.replaceWith(p);
    });

    temp.querySelectorAll("br").forEach((br) => br.remove());

    let firstFound = false;
    temp.querySelectorAll("p").forEach((p) => {
      if (p.textContent.trim() === "" && !p.querySelector("img")) {
        p.remove();
      } else if (!firstFound) {
        p.classList.add("first-paragraph");
        firstFound = true;
      }
    });

    return temp.innerHTML;
  }

  async buildPages() {
    const flipbook = document.getElementById("flipbook");
    const mainArea = document.getElementById("mainArea"); // Precisamos dele para herdar o CSS correto!
    if (!flipbook || !mainArea || !this.ui.contentSimple) return false;

    const areaWidth = mainArea.clientWidth;
    const areaHeight = mainArea.clientHeight;
    if (areaWidth < 260 || areaHeight < 260) return false;

    const rawHTML =
      this.normalizeHTML(this.ui.contentSimple.innerHTML) ||
      "<p>Não há conteúdo para exibir nesta história.</p>";
    const title =
      document.querySelector(".header-title")?.innerText || "Boa leitura!";

    const isMobile = window.innerWidth <= 768;
    this.pageWidth = isMobile ? areaWidth : Math.floor(areaWidth / 2);
    this.pageHeight = areaHeight;

    const builtPages = [];
    builtPages.push(`
      <div class="page page-cover" data-density="hard">
          <div class="page-content page-cover-content">
              <h1>${title}</h1>
              <p class="page-cover-subtitle">Contos de Rimufic</p>
          </div>
      </div>
      <div class="page page-cover" data-density="hard"><div class="page-content page-blank"></div></div>
    `);

    const measureContainer = document.createElement("div");
    measureContainer.style.position = "absolute";
    measureContainer.style.top = "-9999px";
    measureContainer.style.visibility = "hidden";
    measureContainer.style.width = `${this.pageWidth}px`;
    measureContainer.style.height = `${this.pageHeight}px`;

    const measureBox = document.createElement("div");
    measureBox.className = "page-content";
    measureBox.style.fontSize = `${this.state.fontSize}rem`;
    measureBox.style.boxSizing = "border-box";

    measureContainer.appendChild(measureBox);

    // ANCORAMOS O MEDIDOR NA TELA PRINCIPAL (Herda fontes e espaços reais)
    mainArea.appendChild(measureContainer);

    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = rawHTML;
      const elements = Array.from(tempDiv.children);

      let pageCount = 1;

      for (let el of elements) {
        measureBox.appendChild(el.cloneNode(true));

        if (measureBox.scrollHeight > measureBox.clientHeight) {
          measureBox.lastChild.remove();

          if (measureBox.innerHTML.trim() !== "") {
            this.commitPage(builtPages, measureBox.innerHTML, pageCount);
            pageCount++;
            measureBox.innerHTML = "";
          }

          measureBox.appendChild(el.cloneNode(true));

          if (measureBox.scrollHeight > measureBox.clientHeight) {
            measureBox.innerHTML = "";

            let currentP = document.createElement(el.tagName);
            currentP.className = el.className;
            measureBox.appendChild(currentP);

            // Algoritmo Cortador Cirúrgico (Respeita Tags de Negrito e Itálico)
            for (let child of Array.from(el.childNodes)) {
              if (child.nodeType === 3) {
                const words = child.textContent.split(" ");
                for (let word of words) {
                  if (word.trim() === "") continue;

                  currentP.innerHTML += word + " ";

                  if (measureBox.scrollHeight > measureBox.clientHeight) {
                    currentP.innerHTML = currentP.innerHTML.slice(
                      0,
                      -(word.length + 1),
                    );
                    this.commitPage(
                      builtPages,
                      measureBox.innerHTML,
                      pageCount,
                    );
                    pageCount++;

                    measureBox.innerHTML = "";
                    currentP = document.createElement(el.tagName);
                    currentP.className = "continued-p";
                    currentP.innerHTML = word + " ";
                    measureBox.appendChild(currentP);
                  }
                }
              } else {
                currentP.appendChild(child.cloneNode(true));
                if (measureBox.scrollHeight > measureBox.clientHeight) {
                  currentP.lastChild.remove();
                  this.commitPage(builtPages, measureBox.innerHTML, pageCount);
                  pageCount++;

                  measureBox.innerHTML = "";
                  currentP = document.createElement(el.tagName);
                  currentP.className = "continued-p";
                  currentP.appendChild(child.cloneNode(true));
                  measureBox.appendChild(currentP);
                }
              }
            }
          }
        }
      }

      if (measureBox.innerHTML.trim() !== "") {
        this.commitPage(builtPages, measureBox.innerHTML, pageCount);
      }
    } finally {
      if (mainArea.contains(measureContainer)) {
        mainArea.removeChild(measureContainer);
      }
    }

    builtPages.push(`
      <div class="page page-cover page-cover-bottom" data-density="hard"><div class="page-content page-blank"></div></div>
      <div class="page page-cover page-cover-bottom" data-density="hard">
          <div class="page-content page-cover-content">
              <i class="ph ph-book-open-text page-end-icon"></i>
              <h2 class="page-end-title">Fim</h2>
          </div>
      </div>
    `);

    if (builtPages.length <= 2) return false;

    if (this.state.pageFlipInstance) {
      this.state.pageFlipInstance.destroy();
      this.state.pageFlipInstance = null;
    }

    // GARANTIA DE LIMPEZA: Recriamos a div do zero para a biblioteca não bugar no fullscreen
    const viewport = document.querySelector(".flipbook-viewport");
    if (viewport) {
      viewport.innerHTML = '<div id="flipbook"></div>';
    }

    // Injeta as novas páginas redimensionadas na div limpa
    document.getElementById("flipbook").innerHTML = builtPages.join("");

    return true;
  }

  commitPage(builtPages, html, pageNumber) {
    // O NÚMERO FICA FORA DO PAGE-CONTENT, não afeta mais o cálculo de tamanho!
    builtPages.push(`
      <div class="page">
          <div class="page-content" style="font-size: ${this.state.fontSize}rem;">
              ${html}
          </div>
          <div class="page-number">${pageNumber}</div>
      </div>
    `);
  }

  init() {
    if (this.state.pageFlipInstance) return Promise.resolve(true);
    if (!this.pageWidth || !this.pageHeight) return Promise.resolve(false);
    const flipbook = document.getElementById("flipbook");
    if (!flipbook || flipbook.querySelectorAll(".page").length === 0) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        this.state.pageFlipInstance = new St.PageFlip(
          document.getElementById("flipbook"),
          {
            width: this.pageWidth,
            height: this.pageHeight,
            size: "fixed",
            usePortrait: window.innerWidth <= 768,
            maxShadowOpacity: 0.5,
            showCover: true,
            mobileScrollSupport: false,
          },
        );
        this.state.pageFlipInstance.loadFromHTML(
          document.querySelectorAll(".page"),
        );
        this.state.pageFlipInstance.on("flip", (e) => this.syncProgress(e.data));
        resolve(true);
      }, 100);
    });
  }

  syncProgress(currentPageIndex = null) {
    if (!this.state.pageFlipInstance) return;
    const current =
      currentPageIndex !== null
        ? currentPageIndex
        : this.state.pageFlipInstance.getCurrentPageIndex();
    const total = this.state.pageFlipInstance.getPageCount();
    this.onProgressUpdate(current + 1, total);
  }

  nextPage() {
    if (this.state.pageFlipInstance) this.state.pageFlipInstance.flipNext();
  }
  prevPage() {
    if (this.state.pageFlipInstance) this.state.pageFlipInstance.flipPrev();
  }
}
