import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

type MethodHandler = (request: Request) => Response | Promise<Response>

// On Vercel, api/siteping.ts runs as a function. `vite dev` doesn't serve api/, so this runs the same handler locally.
function sitepingDevApi(): Plugin {
  return {
    name: 'siteping-dev-api',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
      server.middlewares.use('/api/siteping', async (req, res) => {
        const handlers: Record<string, MethodHandler | undefined> = await server.ssrLoadModule('/api/siteping.ts')
        const handler = handlers[req.method ?? 'GET']
        if (!handler) {
          res.statusCode = 405
          res.end()
          return
        }
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const headers = new Headers()
        for (const [name, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(name, value)
        const request = new Request(new URL(req.originalUrl ?? req.url ?? '/', `http://${req.headers.host}`), {
          method: req.method,
          headers,
          body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
        })
        const response = await handler(request)
        res.statusCode = response.status
        response.headers.forEach((value, name) => res.setHeader(name, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sitepingDevApi()],
})
