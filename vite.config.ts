import { readFile } from 'node:fs/promises'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

const duckDbMvpWorkerPath = '/@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js'

function duckDbMvpWorkerSourceMapWorkaround(): Plugin {
  return {
    name: 'duckdb-mvp-worker-source-map-workaround',
    apply: 'serve',
    enforce: 'pre',
    async load(id) {
      if (id.includes('?url')) {
        return null
      }

      const workerPath = id.split('?', 1)[0]
      if (!workerPath.replace(/\\/g, '/').endsWith(duckDbMvpWorkerPath)) {
        return null
      }

      // duckdb-wasm omits this map from its npm package but leaves the reference in the worker.
      const worker = await readFile(workerPath, 'utf8')
      return worker.replace(/\n?\/\/# sourceMappingURL=duckdb-browser-mvp\.worker\.js\.map\s*$/, '\n')
    },
  }
}

export default defineConfig({
  plugins: [duckDbMvpWorkerSourceMapWorkaround(), react()],
  server: {
    port: 4173,
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
