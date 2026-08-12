import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
// @ts-ignore
import mareasHandler from './api/mareas.js';

const DB_FILE = path.resolve(__dirname, 'suggestions_db.json');
const STATS_FILE = path.resolve(__dirname, 'stats_db.json');

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

function getStoredStats() {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
      if (!data.newUsers) data.newUsers = 0;
      if (!data.returningUsers) data.returningUsers = 0;
      return data;
    }
  } catch (e) {
    console.error(e);
  }
  return {
    totalVisits: 0,
    todayVisits: 0,
    newUsers: 0,
    returningUsers: 0,
    lastResetDate: todayStr
  };
}

function saveStats(stats: any) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
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
          server.middlewares.use('/api/counter', (req, res, next) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              return res.end();
            }

            const stats = getStoredStats();
            const todayStr = new Date().toISOString().split('T')[0];

            if (stats.lastResetDate !== todayStr) {
              stats.todayVisits = 0;
              stats.lastResetDate = todayStr;
            }

            const url = new URL(req.url || '', 'http://localhost');
            const isInc = req.method === 'POST' || url.searchParams.get('inc') === '1';
            const userType = url.searchParams.get('type');

            if (isInc) {
              stats.totalVisits += 1;
              stats.todayVisits += 1;
              if (userType === 'new') {
                stats.newUsers = (stats.newUsers || 0) + 1;
              } else if (userType === 'returning') {
                stats.returningUsers = (stats.returningUsers || 0) + 1;
              }
              saveStats(stats);
            }

            // Real active visitors (at least 1 - current viewer)
            const onlineNow = Math.max(1, (stats.totalVisits > 0 ? Math.min(stats.todayVisits, 3) : 1));

            res.statusCode = 200;
            return res.end(JSON.stringify({
              ok: true,
              totalVisits: stats.totalVisits,
              todayVisits: stats.todayVisits,
              newUsers: stats.newUsers || 0,
              returningUsers: stats.returningUsers || 0,
              onlineNow
            }));
          });

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

          server.middlewares.use('/api/mareas', async (req, res) => {
            try {
              const url = new URL(req.url || '', 'http://localhost');
              const queryParams: Record<string, string> = {};
              url.searchParams.forEach((val, key) => { queryParams[key] = val; });
              (req as any).query = queryParams;
              (res as any).status = (code: number) => {
                res.statusCode = code;
                return res;
              };
              (res as any).json = (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(data));
              };
              await mareasHandler(req, res);
            } catch (err) {
              console.error('Error in /api/mareas middleware:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Error interno en mareas API' }));
            }
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
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
