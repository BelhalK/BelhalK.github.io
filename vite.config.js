import { defineConfig, createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const bentoRoot = fileURLToPath(new URL('./apps/my-bento', import.meta.url))

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
        name: 'static-page-courtside',
        configureServer(server) {
            server.middlewares.use((request, _response, next) => {
                if (request.url === '/assets/courtside.js') request.url = '/src/basketball.js';
                const match = request.url.match(/^\/(research|talks|industry|advisory|software|awards|teaching|education|music|bath|flowerbed)\/?$/);
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
