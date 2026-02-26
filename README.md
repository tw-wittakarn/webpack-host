# Webpack host - Vite Federation Demo

This example demos consumption of federated modules from a vite bundle as a remote into Webpack host.

## Running

First, run `pnpm install`, then `pnpm run build` and `pnpm run serve`. This will build and serve both `host` and `remote` on ports 3000, 5001 respectively.

- HOST: [localhost:3000](http://localhost:3000/)
- REMOTE: [localhost:5001](http://localhost:5001/)

`CTRL + C` can only stop the host server. You can run `pnpm stop` to stop all services.
