const CACHE_NAME = 'sehri-iftar-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './data/main.js',
  './data/timetable.js',
  './manifest.json'
];

// ইনস্টল এবং ক্যাশ করা
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// অফলাইনে ফাইলগুলো রিকোয়েস্ট হ্যান্ডেল করা
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});