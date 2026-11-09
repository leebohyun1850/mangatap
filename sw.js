const CACHE = 'mangatap-v7';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // 서버(GitHub Pages)의 임시 보관본을 거치지 않고 항상 최신 파일을 받아 저장, 파일 하나가 없어도 설치가 실패하지 않게 하나씩 저장
      .then(c => Promise.all(ASSETS.map(a => c.add(new Request(a, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 캐시 우선, 없으면 네트워크. 받아온 같은 출처 파일은 캐시에 보관해 오프라인에서도 열림
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) {
        fetch(req.url, { cache: 'reload' }).then(res => { if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res)); }).catch(() => {});
        return hit;
      }
      return fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
