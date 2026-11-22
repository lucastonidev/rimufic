// public/sw.js
const CACHE_NAME = "rimufic-app-v6";
const OFFLINE_STORIES_CACHE = "rimufic-offline-v1";

const STATIC_ASSETS = [
  "/",
  "/library",
  "/manifest.json",
  "/css/base/global.css",
  "/css/base/variables.css",
  "/css/base/reset.css",
  "/css/components/header.css",
  "/css/components/card.css",
  "/css/components/toast.css",
  "/css/components/source-badge.css",
  "/css/pages/read.css",
  "/css/components/reader/PdfReader.css",
  "/js/main.js",
  "/js/components/toast.js",
  "/js/components/favorites.js",
  "/js/components/offline-manager.js",
  "/assets/logo-192.png",
  "/assets/banner-magic.jpeg",
];

// Instalação: pré-carrega os arquivos vitais da interface
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✨ Service Worker do Rimufic: Pré-carregando casca da aplicação...");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Alguns recursos estáticos falharam no pré-cache:", err);
      });
    }),
  );
  self.skipWaiting();
});

// Ativação: limpa versões defasadas de cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== OFFLINE_STORIES_CACHE) {
            console.log("🧹 Removendo cache obsoleto:", key);
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Interceptação de Rede (Fetch)
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Apenas requisições GET
  if (req.method !== "GET") return;

  // Ignora rotas administrativas ou de autenticação
  if (req.url.includes("/admin") || req.url.includes("/login") || req.url.includes("/logout")) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // Se a resposta for bem-sucedida e for asset estático, salva no cache
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            if (
              req.url.includes("/css/") ||
              req.url.includes("/js/") ||
              req.url.includes("/assets/")
            ) {
              cache.put(req, copy);
            }
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // FALLBACK OFFLINE:
        // 1. Tenta recuperar do cache de livros baixados offline
        const offlineStoryMatch = await caches.match(req, {
          cacheName: OFFLINE_STORIES_CACHE,
        });
        if (offlineStoryMatch) return offlineStoryMatch;

        // 2. Tenta recuperar do cache estático da aplicação
        const staticMatch = await caches.match(req, { cacheName: CACHE_NAME });
        if (staticMatch) return staticMatch;

        // 3. Tenta qualquer correspondência global de cache
        const anyMatch = await caches.match(req);
        if (anyMatch) return anyMatch;

        // 4. Se for navegação e o usuário não tiver baixado aquela página específica
        if (req.mode === "navigate") {
          return new Response(
            `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <title>Sem Conexão - Rimufic</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0710; color: #F3F4F6; text-align: center; padding: 4rem 1.5rem; }
                h1 { color: #9D4EDD; font-size: 2rem; margin-bottom: 0.5rem; }
                p { color: #9CA3AF; font-size: 1.1rem; max-width: 480px; margin: 0 auto 1.5rem auto; line-height: 1.6; }
                a { display: inline-block; background: #9D4EDD; color: #FFF; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; }
              </style>
            </head>
            <body>
              <h1>📶 Modo Desconectado</h1>
              <p>Você está sem conexão com a internet. Abra sua biblioteca para ler as histórias que você salvou offline!</p>
              <a href="/library">Acessar Minha Biblioteca</a>
            </body>
            </html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }
      }),
  );
});
