import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

type MethodHandler = (request: Request) => Response | Promise<Response>

// On Vercel, each api/<name>.ts runs as a function. `vite dev` doesn't serve api/, so this runs the same handlers locally.
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
      server.middlewares.use('/api', async (req, res, next) => {
        const name = new URL(req.url ?? '/', 'http://localhost').pathname.slice(1)
        if (!/^[a-z-]+$/.test(name)) return next()
        const handlers: Record<string, MethodHandler | undefined> = await server.ssrLoadModule(`/api/${name}.ts`)
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
  plugins: [react(), tailwindcss(), devApi()],
})
