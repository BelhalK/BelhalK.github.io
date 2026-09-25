import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    appType: 'mpa',
    plugins: [react(), {
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
