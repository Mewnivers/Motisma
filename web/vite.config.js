import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Unique id per build, embedded in the bundle (__BUILD_ID__) AND emitted as
// /version.json. The running app polls version.json and reloads itself when the
// id changes — so a new deploy shows up without a manual refresh.
const buildId = String(Date.now());

// In dev, the React app runs on :5173 and the API on :3000. Proxying /api keeps
// them same-origin, so session cookies are first-party (no CORS, no SameSite
// headaches). In production nginx serves the built site and proxies /api too.
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'emit-version-json',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ id: buildId }),
        });
      },
    },
  ],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
});
