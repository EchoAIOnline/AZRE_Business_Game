import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import dealdeskHandler from './api/dealdesk.ts';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['OFFICE_ACCESS_PASSWORD','DEALDESK_PLUGIN_API_KEY','DEALDESK_PLUGIN_URL']) if (env[key]) process.env[key] = env[key];
  return {
    plugins: [react(), tailwindcss(), {name:'local-dealdesk-api', configureServer(server) {
      server.middlewares.use('/api/dealdesk', async (req,res) => {
        let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 4096) {res.statusCode=413;res.end();return;} }
        try { Object.assign(req,{body:body ? JSON.parse(body) : {}}); } catch {res.statusCode=400;res.end(JSON.stringify({error:'Invalid request.'}));return;}
        await dealdeskHandler(req,res);
      });
    }}],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
