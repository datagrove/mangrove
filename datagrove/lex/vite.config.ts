import { defineConfig, searchForWorkspaceRoot } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import serveStatic from 'serve-static'
import mkcert from 'vite-plugin-mkcert'
import pluginRewriteAll from 'vite-plugin-rewrite-all';


// headers: {
//   'Cross-Origin-Opener-Policy': 'same-origin',
//   'Cross-Origin-Embedder-Policy': 'require-corp',
// },
export default defineConfig({
  plugins: [pluginRewriteAll(),solidPlugin(), mkcert()], //
  appType: 'spa',
  //base: './',
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  server: {
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      // '/wss': {
      //   target: 'https://localhost:5078/wss',
      //   changeOrigin: true,
      //   secure: false,
      //   ws: true
      // }, 

      //this doesn't exercise the service worker though.
      // '/~': {
      //   target: 'http://127.0.0.1:3000',
      //   changeOrigin: true,
      //   secure: false,
      // },
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
});