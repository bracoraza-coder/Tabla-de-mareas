import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

const DB_FILE = path.resolve(__dirname, 'suggestions_db.json');

function getStoredSuggestions() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

function saveSuggestions(items: any[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.error(e);
  }
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-suggestions-dev',
        configureServer(server) {
          server.middlewares.use('/api/suggestions', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              return res.end();
            }

            if (req.method === 'GET') {
              const suggestions = getStoredSuggestions();
              res.statusCode = 200;
              return res.end(JSON.stringify({ ok: true, suggestions }));
            }

            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: any) => { body += chunk; });
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body || '{}');
                  if (!parsed.text || !parsed.text.trim()) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ ok: false, error: 'Mensaje vacío' }));
                  }
                  const current = getStoredSuggestions();
                  const newItem = {
                    id: 'sug_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                    text: parsed.text.trim(),
                    email: parsed.email ? parsed.email.trim() : 'No proporcionado',
                    date: new Date().toISOString(),
                    read: false
                  };
                  current.unshift(newItem);
                  saveSuggestions(current);
                  res.statusCode = 200;
                  return res.end(JSON.stringify({ ok: true, suggestion: newItem }));
                } catch (err) {
                  res.statusCode = 500;
                  return res.end(JSON.stringify({ ok: false, error: 'Error procesando sugerencia' }));
                }
              });
              return;
            }

            if (req.method === 'DELETE') {
              let body = '';
              req.on('data', (chunk: any) => { body += chunk; });
              req.on('end', () => {
                try {
                  const url = new URL(req.url || '', 'http://localhost');
                  const id = url.searchParams.get('id');
                  let current = getStoredSuggestions();
                  if (id) {
                    current = current.filter((item: any) => item.id !== id);
                  } else {
                    current = [];
                  }
                  saveSuggestions(current);
                  res.statusCode = 200;
                  return res.end(JSON.stringify({ ok: true, suggestions: current }));
                } catch (e) {
                  res.statusCode = 500;
                  return res.end(JSON.stringify({ ok: false, error: 'Error al eliminar' }));
                }
              });
              return;
            }

            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
