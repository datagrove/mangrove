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
    https: true,
    port: 8080,
  },
});
