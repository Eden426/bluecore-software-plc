import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Serves the Vercel-style functions in api/ from the Vite dev server, so the
// admin console works locally without `vercel dev`. Dev only; on Vercel the
// files in api/ are deployed as functions.
function devApi() {
  return {
    name: 'support-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const path = req.url.split('?')[0].replace(/\/$/, '')
        let mod
        try {
          mod = await server.ssrLoadModule(`${path}.js`)
        } catch {
          res.statusCode = 404
          return res.end('Not found')
        }
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const request = new Request(`http://${req.headers.host}${req.url}`, {
          method: req.method,
          headers: req.headers,
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
        })
        const response = await mod.default.fetch(request)
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Expose non-VITE_ vars (server secrets) to the dev API's process.env only.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    plugins: [react(), devApi()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  }
})
