import {libraryClipDefinitions,type LibraryClipName} from './src/utils/animationLibrary.ts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {createReadStream,existsSync} from 'node:fs';
import {defineConfig, loadEnv} from 'vite';
import dealdeskHandler from './api/dealdesk.ts';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['OFFICE_ACCESS_PASSWORD','DEALDESK_PLUGIN_API_KEY','DEALDESK_PLUGIN_API_KEY2','DEALDESK_PLUGIN_URL']) if (env[key]) process.env[key] = env[key];
  const workforceProxy = {'/workforce': {target: env.WORKFORCE_PROXY_URL || 'http://127.0.0.1:3101', changeOrigin:false, rewrite:(url:string)=>url.replace(/^\/workforce(?=\/|$)/,'') || '/', timeout:180000, proxyTimeout:180000}};
  return {
    plugins: [react(), tailwindcss(), {name:'local-dealdesk-api', configureServer(server) {
      // Development-only access to the user's original downloads for A/B fidelity review.
      server.middlewares.use('/__animation-source', (req,res,next)=>{
        const name=req.url?.split('?')[0]?.replace(/^\//,'');
        if(req.method!=='GET'||!name||!['Josh.fbx','Joe.fbx','Louise.fbx','Suzie.fbx','Typing.fbx'].includes(name)){next();return;}
        const file=path.join('/private/tmp/azre-mixamo',name);
        if(!existsSync(file)){res.statusCode=404;res.end('Original Mixamo download unavailable.');return;}
        res.setHeader('Content-Type','application/octet-stream');createReadStream(file).pipe(res);
      });
      server.middlewares.use('/__animation-library',(req,res,next)=>{
        const label=req.url?.split('?')[0]?.replace(/^\//,'').replace(/\.fbx$/,'') as LibraryClipName;
        if(req.method!=='GET'||!Object.hasOwn(libraryClipDefinitions,label)){next();return;}
        const file=path.join('/Users/asharizakar/Downloads/Avatar Animations',libraryClipDefinitions[label].file);
        if(!existsSync(file)){res.statusCode=404;res.end('Original library download unavailable.');return;}
        res.setHeader('Content-Type','application/octet-stream');createReadStream(file).pipe(res);
      });
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
    preview: {proxy:workforceProxy},
    server: {
      proxy:workforceProxy,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
