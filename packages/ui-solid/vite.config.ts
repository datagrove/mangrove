import { defineConfig, searchForWorkspaceRoot } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import serveStatic from 'serve-static'
import mkcert from 'vite-plugin-mkcert'
import { resolve } from 'path';


export default defineConfig({
  plugins: [solidPlugin(), mkcert()], //
  appType: 'spa',
  server: {
    host: true,
    proxy: {
      '/wss': {
        target: 'https://localhost:5078/wss',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/api': {
        target: 'https://localhost:8089',
        changeOrigin: true,
        secure: false,
      },
      '/TestResults': {
        target: 'https://localhost:5078',
        changeOrigin: true,
        secure: false,
      }
    },
    port: 5783,
  },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@datagrove/ui',
      // the proper extensions will be added
      fileName: 'index',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['solid-js'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          'solid-js': 'solid',
        },
      },
    },
  },
});
