import { defineConfig,searchForWorkspaceRoot } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import serveStatic from 'serve-static'
import mkcert from 'vite-plugin-mkcert'


export default defineConfig({
    plugins: [solidPlugin(),mkcert()], //
    appType: 'spa',
    server: {
      proxy: {
        // '/wss': {
        //   target: 'https://localhost:5078/wss',
        //   changeOrigin: true,
        //   secure: false,
        //   ws: true
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
