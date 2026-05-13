import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remotion-api',
      configureServer(server) {
        server.httpServer?.setTimeout(0);
        server.middlewares.use(async (req, res, next) => {
          const { method, url } = req;

          // 1. POST /api/render
          if (method === 'POST' && url === '/api/render') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
              try {
                const { zodiacs, date } = JSON.parse(body);
                if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');
                const tmpPath = path.resolve('./tmp/tmp_input.json');
                fs.writeFileSync(tmpPath, JSON.stringify(zodiacs));

                console.log(`\n[API] Starting render for ${zodiacs.length} zodiacs...`);
                const proc = spawn('node', ['src/remotion-single/renderAll.js', tmpPath, date], {
                  stdio: 'inherit',
                  env: { ...process.env, NODE_ENV: 'production' }
                });

                proc.on('close', (code) => {
                  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
                  
                  const outDir = path.resolve('./out');
                  const videos = fs.existsSync(outDir)
                    ? fs.readdirSync(outDir).filter((f) => f.endsWith('.mp4'))
                    : [];

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  if (code === 0) {
                    res.end(JSON.stringify({ status: 'done', videos }));
                  } else {
                    res.end(JSON.stringify({ status: 'error', videos }));
                  }
                });

                proc.on('error', (err) => {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ status: 'error', message: err.message }));
                });
              } catch (err) {
                res.writeHead(500).end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }

          // 2. GET /api/videos
          if (method === 'GET' && url === '/api/videos') {
            const outDir = path.resolve('./out');
            let videos = [];
            if (fs.existsSync(outDir)) {
              videos = fs.readdirSync(outDir).filter(f => f.endsWith('.mp4'));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ videos }));
            return;
          }

          // 3. GET /api/download/:filename
          if (method === 'GET' && url.startsWith('/api/download/')) {
            const filename = url.replace('/api/download/', '');
            const filePath = path.resolve('./out', filename);
            if (fs.existsSync(filePath)) {
              res.writeHead(200, {
                'Content-Type': 'video/mp4',
                'Content-Disposition': `attachment; filename="${filename}"`
              });
              fs.createReadStream(filePath).pipe(res);
            } else {
              res.writeHead(404).end('Not Found');
            }
            return;
          }

          // 4. DELETE /api/delete
          if (method === 'DELETE' && url === '/api/delete') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
              try {
                const { filenames } = JSON.parse(body);
                const deleted = [];
                filenames.forEach(f => {
                  const p = path.resolve('./out', f);
                  if (fs.existsSync(p)) {
                    fs.unlinkSync(p);
                    deleted.push(f);
                  }
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ deleted, failed: [] }));
              } catch (err) {
                res.writeHead(500).end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }

          next();
        });
      }
    }
  ],
  server: {
    port: 3000
  }
})
