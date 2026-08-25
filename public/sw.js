// public/sw.js
const CACHE_NAME = "rimufic-cache-v1";

// O navegador exige que o Service Worker tenha pelo menos o evento 'fetch' para reconhecer como PWA.
self.addEventListener("fetch", (event) => {
  // Por enquanto, apenas deixamos a requisição passar normalmente.
  // No futuro, podemos usar isso para fazer o app funcionar offline!
});
