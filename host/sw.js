const REMOTE_ORIGIN = 'http://localhost:5001';
const MAX_RETRIES = 30;

// Take control immediately on install — no need to wait for a page reload
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(clients.claim()));

self.addEventListener('fetch', event => {
  const url = event.request.url;
  // Only intercept JS chunks from the remote origin
  if (url.startsWith(REMOTE_ORIGIN) && url.endsWith('.js')) {
    event.respondWith(fetchWithRetry(url, 1));
  }
});

async function fetchWithRetry(url, attempt) {
  try {
    // On retries, bypass HTTP cache to force a real network request
    const opts = attempt > 1 ? { cache: 'reload' } : {};
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log(`[SW] loaded: ${url} (attempt ${attempt})`);
    return res;
  } catch (err) {
    console.warn(`[SW] failed (attempt ${attempt}/${MAX_RETRIES}): ${url}`);
    if (attempt >= MAX_RETRIES) {
      console.error(`[SW] giving up: ${url}`);
      throw err;
    }
    await new Promise(r => setTimeout(r, 1000 * attempt));
    return fetchWithRetry(url, attempt + 1);
  }
}
