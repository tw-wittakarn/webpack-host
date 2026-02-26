// Tracks retry attempt count per entry URL.
// When loadEntry is called again (by RetryPlugin's scriptRetry loop),
// the count tells us which retry we're on so we can cache-bust the URL.
const retryCount = new Map();

// Rewrites string-literal import specifiers in ESM source to absolute + cache-busted URLs.
// The browser's module map permanently caches results (including failures) keyed by URL,
// so retrying a chunk with the same URL just returns the cached error without a network hit.
// Converting to a new URL (absolute + ?_retry=N) forces a fresh fetch.
function rewriteImports(src, baseUrl, retrySuffix) {
  function bustUrl(rawUrl) {
    // Leave bare specifiers (e.g. 'react', 'vue') for the import map / bundler
    if (!rawUrl.startsWith('.') && !rawUrl.startsWith('/') && !/^https?:/.test(rawUrl)) {
      return rawUrl;
    }
    const abs = new URL(rawUrl, baseUrl).href;
    return abs + (abs.includes('?') ? '&' : '?') + retrySuffix;
  }

  // Match: from '...', import '...', import('...')
  // Group 1 = keyword/prefix, Group 2 = quote char, Group 3 = specifier
  return src.replace(
    /(from\s*|import\s*\(?\s*)(['"`])([^'"`\n]+)\2/g,
    (_, pre, q, u) => `${pre}${q}${bustUrl(u)}${q}`,
  );
}

const esmLoadEntryPlugin = () => ({
  name: 'esm-load-entry-plugin',

  async loadEntry({ remoteInfo }) {
    // Only intercept ESM-type remotes — let var/global go through loadEntryScript normally
    if (remoteInfo.type !== 'module' && remoteInfo.type !== 'esm') return;

    const base = remoteInfo.entry;
    const count = retryCount.get(base) ?? 0;
    const retrySuffix = `_retry=${count}`;

    // First attempt uses the original URL.
    // Retries add ?_retry=N so the browser module registry treats it as a new module
    // and makes a real network request instead of returning the cached failure.
    const url =
      count === 0 ? base : `${base}${base.includes('?') ? '&' : '?'}${retrySuffix}`;

    try {
      let mod;

      if (count === 0) {
        // new Function bypasses webpack static analysis so the URL stays truly dynamic
        mod = await new Function('url', 'return import(url)')(url);
      } else {
        // On retry: fetch the entry source and rewrite all chunk import URLs to
        // absolute + cache-busted, then import via a blob URL.
        // This ensures chunks also get new URLs that bypass the browser's module map cache.
        const resp = await fetch(url, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const src = rewriteImports(await resp.text(), new URL(url), retrySuffix);

        const blobUrl = URL.createObjectURL(new Blob([src], { type: 'application/javascript' }));
        try {
          mod = await new Function('url', 'return import(url)')(blobUrl);
        } finally {
          URL.revokeObjectURL(blobUrl);
        }
      }

      retryCount.delete(base);
      return mod;
    } catch (e) {
      retryCount.set(base, count + 1);

      // Throw with RUNTIME-008 in the message so getRemoteEntry's catch block
      // sets isScriptLoadError=true and fires the loadEntryError hook,
      // which lets RetryPlugin drive the retry loop.
      throw new Error(
        `[ Federation Runtime ]: RUNTIME-008: Failed to load script resources - remoteName: ${remoteInfo.name}, resourceUrl: ${url}`,
      );
    }
  },
});

export default esmLoadEntryPlugin;
