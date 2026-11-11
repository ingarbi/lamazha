const CACHE_NAME = 'lamazaha-cache-v1';
// Файлы, которые нужны для базовой работы сайта (кэшируются сразу)
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './site.webmanifest',
    './favicon.ico',
    './favicon.svg',
    './favicon-192x192.png'
];

// 1. Установка: сохраняем основные файлы в кэш
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting()) // Активируем сразу
    );
});

// 2. Активация: удаляем старые кэши, если версия обновилась
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Перехват запросов (Fetch)
self.addEventListener('fetch', (event) => {
    // Работаем только с GET-запросами
    if (event.request.method !== 'GET') return;

    event.respondWith(
        // Стратегия: сначала ищем в кэше, если нет — идем в сеть и кэшируем
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Отдаем из кэша (быстро)
            }
            return fetch(event.request).then((networkResponse) => {
                // Если ответ успешный, кэшируем его (например, JSON или картинки)
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // Если сети нет и файла нет в кэше - можно вернуть заглушку
                // console.log('Оффлайн режим: файл не найден в кэше');
            });
        })
    );
});