import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remotion-render-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.method === 'POST' && req.url === '/api/render') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });

            req.on('end', async () => {
              try {
                const { zodiacs, date } = JSON.parse(body);
                
                // Ensure tmp directory exists
                if (!fs.existsSync('./tmp')) {
                  fs.mkdirSync('./tmp');
                }

                const tmpPath = path.resolve('./tmp/tmp_input.json');
                fs.writeFileSync(tmpPath, JSON.stringify(zodiacs));

                console.log(`\n[API] Starting render for ${zodiacs.length} zodiacs...`);
                
                const renderProcess = spawn('node', [
                  'src/remotion-single/renderAll.js',
                  tmpPath,
                  date
                ], {
                  stdio: 'inherit',
                  env: { ...process.env, NODE_ENV: 'production' }
                });

                renderProcess.on('close', (code) => {
                  if (code === 0) {
                    console.log(`[API] Render process completed successfully.`);
                  } else {
                    console.error(`[API] Render process failed with code ${code}.`);
                  }
                  // Cleanup tmp file
                  if (fs.existsSync(tmpPath)) {
                    fs.unlinkSync(tmpPath);
                  }
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'started' }));
              } catch (err) {
                console.error('[API] Error handling render request:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to start render' }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 3000
  }
})
