var cacheName = 'cocotrace';
var filesToCache = [
  'index.html',
  'css/ceidcovid.css',
  'css/milligram.min.css',
  'css/normalize.css',
  'fonts/roboto-v29-latin_greek-300.woff',
  'fonts/roboto-v29-latin_greek-300.woff2',
  'fonts/roboto-v29-latin_greek-300italic.woff',
  'fonts/roboto-v29-latin_greek-300italic.woff2',
  'fonts/roboto-v29-latin_greek-700.woff',
  'fonts/roboto-v29-latin_greek-700.woff2',
  'fonts/roboto-v29-latin_greek-700italic.woff',
  'fonts/roboto-v29-latin_greek-700italic.woff2',
  'fonts/roboto-v29-latin_greek-regular.woff',
  'fonts/roboto-v29-latin_greek-regular.woff2',
  'imgs/appicon-128.png',
  'imgs/appicon-144.png',
  'imgs/appicon-152.png',
  'imgs/appicon-192.png',
  'imgs/appicon-256.png',
  'imgs/appicon-512.png',
  'js/ceidcovid.js',
  'js/idb-index-min.js',
  'js/zxing-index.js',
  'json/contactpersons.json',
  'json/rooms.json'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
