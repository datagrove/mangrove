import { defineConfig,searchForWorkspaceRoot } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import serveStatic from 'serve-static'

const x = () => ({
    name: 'TestResults',
    configureServer(server: any) {
      server.middlewares.use(serveStatic('../RunTest', { index: false }))
    }
  })

export default defineConfig({
    plugins: [solidPlugin(),x()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5078',
          changeOrigin: true,
        },
        '/TestResults': {
          target: 'http://localhost:5078',
          changeOrigin: true
        }
      },
        port: 5783,
    },
    build: {
        target: 'esnext',
        outDir: '../server/dist',
        emptyOutDir: true,
    },
});
