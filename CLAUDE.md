# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **Module Federation v2 demo** showing a Webpack 5 host consuming federated modules from a Vite 4 remote. pnpm monorepo with two workspaces: `host/` and `remote/`.

- **Host** (port 3000): Webpack 5 + React 18, consumes remote Button component
- **Remote** (port 5001): Vite 4 + React 18, exposes Button component via `@module-federation/vite`

## Commands

```bash
# Install
pnpm install

# Build and serve both apps
pnpm run build
pnpm run serve

# Development (run in separate terminals)
pnpm run dev:hosts          # Host webpack-dev-server on :3000
pnpm run serve:remotes      # Remote on :5001 (build first with pnpm run build:remotes)

# Individual apps
pnpm --filter @webpack-host/host start    # Host dev server
pnpm --filter @webpack-host/remote dev    # Remote dev server

# Stop all services (kills ports 3000 and 5001)
pnpm run stop
```

No test or lint configurations exist in this project.

## Architecture

### Module Federation Flow

1. Remote (`remote/vite.config.js`) exposes `./Button` component and generates `mf-manifest.json`
2. Host (`host/webpack.config.js`) declares remote as `viteRemote@http://localhost:5001/mf-manifest.json`
3. Host's `ButtonRemote.jsx` uses `@module-federation/enhanced/runtime` to dynamically load the remote Button via `React.lazy()` + `Suspense`
4. React and React-DOM are shared as eager singletons across both apps

### Host Entry Chain

`main.jsx` → `bootstrap.jsx` (async boundary for Module Federation) → `App.jsx` → `ButtonRemote.jsx` (lazy-loads remote)

### Runtime Plugins (`host/runtime-plugin/`)

- **retry.js**: Retries failed remote loads up to 4 times with 1s delay using `@module-federation/retry-plugin`
- **fallback.js**: Implements `errorLoadRemote` hook to return fallback UI when remote chunks or entry files fail to load

### Error Handling Layers

1. `ErrorBoundary.jsx` — React error boundary wrapping remote components
2. `retry.js` — Network-level retry with backoff
3. `fallback.js` — Module Federation runtime fallback for load failures
