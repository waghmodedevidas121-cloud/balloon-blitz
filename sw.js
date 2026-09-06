/* BalloonBlitz service worker — offline-first app shell */
const CACHE = "balloon-blitz-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./data/content.js",
  "./js/save.js", "./js/audio.js", "./js/music.js", "./js/ads.js",
  "./js/player.js", "./js/economy.js", "./js/achievements.js", "./js/rewards.js",
  "./js/leaderboard.js", "./js/engine.js", "./js/ui.js", "./js/main.js",
  "./assets/icon-192.png", "./assets/icon-512.png"
];
const AUDIO = [
  "./assets/audio/home.mp3", "./assets/audio/campaign.mp3",
  "./assets/audio/blitz.mp3", "./assets/audio/survival.mp3"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isAudio = url.pathname.includes("/assets/audio/");
  if (isAudio) {
    // audio: cache-first, lazy-fill as played
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
