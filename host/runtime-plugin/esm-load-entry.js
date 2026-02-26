// Tracks retry attempt count per entry URL.
// When loadEntry is called again (by RetryPlugin's scriptRetry loop),
// the count tells us which retry we're on so we can cache-bust the URL.
const retryCount = new Map();

const esmLoadEntryPlugin = () => ({
  name: 'esm-load-entry-plugin',

  async loadEntry({ remoteInfo }) {
    // Only intercept ESM-type remotes — let var/global go through loadEntryScript normally
    if (remoteInfo.type !== 'module' && remoteInfo.type !== 'esm') return;

    const base = remoteInfo.entry;
    const count = retryCount.get(base) ?? 0;

    // First attempt uses the original URL.
    // Retries add ?_retry=N so the browser module registry treats it as a new module
    // and makes a real network request instead of returning the cached failure.
    const url =
      count === 0 ? base : `${base}${base.includes('?') ? '&' : '?'}_retry=${count}`;

    try {
      // new Function bypasses webpack static analysis so the URL stays truly dynamic
      const mod = await new Function('url', 'return import(url)')(url);
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
