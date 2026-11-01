import { defineConfig, createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const bentoRoot = fileURLToPath(new URL('./apps/my-bento', import.meta.url))
const modelcycleRoot = fileURLToPath(new URL('./apps/modelcycle', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
    appType: 'mpa',
    plugins: [react(), {
        // /my-bento/ is a separate Vite app (own deps and Tailwind config);
        // in dev, run its server in middleware mode under that prefix.
        name: 'my-bento-dev',
        apply: 'serve',
        async configureServer(server) {
            const bento = await createServer({
                root: bentoRoot,
                configFile: `${bentoRoot}/vite.config.ts`,
                server: { middlewareMode: true, hmr: { port: 24679 } },
                appType: 'spa',
            })
            server.httpServer?.on('close', () => bento.close())
            server.middlewares.use((request, response, next) => {
                if (request.url === '/my-bento') {
                    response.writeHead(301, { Location: '/my-bento/' }).end()
                    return
                }
                if (request.url.startsWith('/my-bento/')) return bento.middlewares(request, response, next)
                next()
            })
        },
    }, {
        // /modelcycle/ is also a separate app, but its plugins need Vite 8, so
        // its dev server has to come from its own node_modules, not this Vite.
        name: 'modelcycle-dev',
        apply: 'serve',
        async configureServer(server) {
            const viteEntry = `${modelcycleRoot}/node_modules/vite/dist/node/index.js`
            if (!existsSync(viteEntry)) {
                server.config.logger.warn('/modelcycle/ is unavailable: run npm install --prefix apps/modelcycle')
                return
            }
            const { createServer: createModelcycleServer } = await import(pathToFileURL(viteEntry).href)
            const modelcycle = await createModelcycleServer({
                root: modelcycleRoot,
                configFile: `${modelcycleRoot}/vite.config.ts`,
                server: { middlewareMode: true, hmr: { port: 24680 } },
                appType: 'spa',
            })
            server.httpServer?.on('close', () => modelcycle.close())
            server.middlewares.use((request, response, next) => {
                if (request.url === '/modelcycle') {
                    response.writeHead(301, { Location: '/modelcycle/' }).end()
                    return
                }
                if (request.url.startsWith('/modelcycle/')) return modelcycle.middlewares(request, response, next)
                next()
            })
        },
    }, {
        name: 'static-page-courtside',
        configureServer(server) {
            server.middlewares.use((request, _response, next) => {
                if (request.url === '/assets/courtside.js') request.url = '/src/basketball.js';
                const match = request.url.match(/^\/(research|talks|industry|advisory|software|awards|teaching|education|music|bath)\/?$/);
                if (match) {
                    request.url = `/public/${match[1]}/index.html`;
                }
                next();
            });
        },
    }],
    build: {
        manifest: true,
        rollupOptions: {
            input: {
                main: 'index.html',
                courtside: 'src/basketball.js',
                research: 'public/research/index.html',
                talks: 'public/talks/index.html',
                industry: 'public/industry/index.html',
                advisory: 'public/advisory/index.html',
                software: 'public/software/index.html',
                awards: 'public/awards/index.html',
                teaching: 'public/teaching/index.html',
                education: 'public/education/index.html',
                music: 'public/music/index.html',
            },
        },
    },
})
