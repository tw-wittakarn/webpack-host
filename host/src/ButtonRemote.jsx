import * as React from 'react';

const ButtonLazy = React.lazy(() => {
    return import('viteRemote/Button')
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