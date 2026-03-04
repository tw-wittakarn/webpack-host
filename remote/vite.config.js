import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: 'http://localhost:5001/',
  plugins: [
    react(),
    federation({
      name: "viteRemote",
      filename: "remoteEntry.js",
      exposes: {
        './Button': './src/components/Button'
      },
      shared: {
        react: {
          singleton: true,
          eager: true
        }, 'react-dom': {
          singleton: true,
          eager: true
        },
      }
    })
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
  }
})
