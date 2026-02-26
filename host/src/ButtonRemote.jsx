import * as React from 'react';
import { getInstance } from '@module-federation/enhanced/runtime';

const ButtonLazy = React.lazy(() => {
    const mf = getInstance();
    console.log('[debug] MF instance:', mf);
    console.log('[debug] MF plugins:', mf?.options?.plugins?.map(p => p.name));
    return mf.loadRemote('viteRemote/Button')
        .then((m) => {
            // React.lazy requires { default: Component }
            if (m?.default) return m;
            return { default: m };
        })
        .catch((error) => {
            console.error('[debug] loadRemote failed:', error.message);
            throw new Error(`Button Remote Error: ${error.message}`);
        });
});

const ButtonRemote = () => {
    return (
        <React.Suspense fallback={<div>loading...</div>}>
            <ButtonLazy />
        </React.Suspense>
    );
};

export default ButtonRemote;