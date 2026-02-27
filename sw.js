const CACHE_NAME = 'sehri-iftar-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './data/main.js',
  './data/timetable.js',
  './manifest.json',
  './fonts/Kalpurush.ttf',
  './fonts/AlQuranIndoPakbyQuranWBW.woff'
];

// ১. ভেরিয়েবল ডিক্লেয়ার করা
let notificationInterval = null; 
let lastNotifiedTime = ""; // একই মিনিটে বারবার নোটিফিকেশন আসা বন্ধ করতে

// ইনস্টল এবং ক্যাশ করা
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// অফলাইনে ফাইলগুলো রিকোয়েস্ট হ্যান্ডেল করা
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});

// ২. Push Notification লজিক
self.addEventListener('message', event => {
    if (event.data.type === 'SCHEDULE_NOTIFICATIONS') {
        const { sahri, iftar, district } = event.data;
        
        // আগের কোনো ইন্টারভাল থাকলে তা বন্ধ করা
        if (notificationInterval) clearInterval(notificationInterval);

        notificationInterval = setInterval(() => {
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ":" + 
                              now.getMinutes().toString().padStart(2, '0');

            // যদি এই মিনিটে একবার নোটিফিকেশন দিয়ে থাকি, তবে আর দেব না
            if (lastNotifiedTime === currentTime) return;

            const sahriTime = toEng(sahri);
            const iftarTime = getIftar24(iftar);

            if (currentTime === sahriTime) {
                showNotification("সাহরীর সময় শেষ!", `আজ ${district}-এ সাহরীর শেষ সময় ভোর ${sahri}`);
                lastNotifiedTime = currentTime;
            }

            if (currentTime === iftarTime) {
                showNotification("ইফতারের সময় হয়েছে!", `আজ ${district}-এ ইফতারের সময় সন্ধ্যা ${iftar}`);
                lastNotifiedTime = currentTime;
            }
        }, 30000); // ৩০ সেকেন্ড পর পর চেক করা নিরাপদ
    }
});

function showNotification(title, body) {
    self.registration.showNotification(title, {
        body: body,
        icon: 'assets/icon.png',
        badge: 'assets/icon.png', // ফোনের স্ট্যাটাস বারে দেখানোর জন্য
        vibrate: [200, 100, 200],
        tag: 'ramadan-notif' // একই টাইপের নোটিফিকেশন রিপ্লেস করার জন্য
    });
}

function toEng(n) { return String(n).replace(/[০-৯]/g, d => "0123456789" ["০১২৩৪৫৬৭৮৯".indexOf(d)]); }
function getIftar24(iftar) {
    const [h, m] = toEng(iftar).split(':').map(Number);
    return (h + 12).toString().padStart(2, '0') + ":" + m.toString().padStart(2, '0');

}
