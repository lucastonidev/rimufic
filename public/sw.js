const CACHE_NAME = "rimufic-cache-v1";

// O evento install avisa que o PWA está pronto, sem gerar alertas de lentidão no fetch
self.addEventListener("install", (event) => {
  console.log("✨ Service Worker do Rimufic instalado e pronto para o futuro!");
});
