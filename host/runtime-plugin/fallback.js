const fallbackPlugin = () => ({
    name: 'fallback-plugin',
    async errorLoadRemote(args) {
      // Chunk/module failed to load
      if (args.lifecycle === 'onLoad') {
        const React = await import('react');
        const FallbackComponent = () =>
          React.createElement('div', null, `Failed to load remote module`);
        return { default: FallbackComponent };
      }
  
      // Entry (remoteEntry.js) failed to load
      if (args.lifecycle === 'afterResolve') {
        console.error('Remote entry failed:', args);
        return args; // or swap to a backup entry URL
      }
  
      return args;
    },
  });
  
  export default fallbackPlugin;