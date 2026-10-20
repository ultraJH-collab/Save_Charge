/* SaveCharge 서비스 워커 (PRD F-17)
   정적 파일은 캐시 우선, 그 외(T map SDK 등 외부 요청)는 네트워크로 처리합니다. */
var CACHE = 'savecharge-v1';
var ASSETS = [
  './', 'index.html', 'station.html', 'favorites.html', 'report.html', 'vehicle.html', 'settings.html', 'onboarding.html',
  'css/common.css', 'css/home.css', 'css/pages.css',
  'js/config.js', 'js/store.js', 'js/data.js', 'js/cost.js', 'js/ui.js', 'js/map.js',
  'js/home.js', 'js/station.js', 'js/favorites.js', 'js/report.js', 'js/vehicle.js', 'js/settings.js', 'js/onboarding.js',
  'img/icon.svg', 'manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // 네트워크 우선, 실패 시 캐시 (개발 중 수정사항이 바로 보이도록)
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); })
  );
});
