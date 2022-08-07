const FILES_TO_CACHE = [
    '/index.html',
    '/css/styles.css',
    '/js/index.js',
    '/icons/icon-192x192.png'
];

const CACHE_NAME = 'budget-tracker-cache';
const DATA_CACHE_NAME = 'budget-cache';

// install service worker
self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Files were successfully pre-cached!');
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// activate the service worker and remove old data from the cache
self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    // deletes data from cache if not in 'FILES_TO_CACHE'
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log('Removing old cache data', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
})

// Intercept fetch requests
self.addEventListener('fetch', function(e) {
    if (e.request.url.includes('/api/')) {
        e.respondWith(
            caches
                .open(DATA_CACHE_NAME)
                .then(cache => {
                    return fetch(e.request)
                        .then(response => {
                            // if response was good, clone it and store it in the cache
                            if (response.status === 200) {
                                cache.put(e.request.url, response.clone());
                            }

                            return response;
                        })
                        .catch(err => {
                            // network request failed, try to get it from the cache
                            return cache.match(e.request);
                        })
                })
                .catch(err => console.log(err))
        );

        return;
    }
})