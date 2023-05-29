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
  plugins: [pluginRewriteAll()], //
  appType: 'spa',
  //base: './',
  server: {
    port: 6783,
  },
});
