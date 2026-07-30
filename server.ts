import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PORTS_DATABASE } from "./src/data/portsData";
import { getTideDayData, getMonthlyTideData } from "./src/utils/tideEngine";

// In-Memory Cache implementation
const memoryCache = new Map<string, { expiry: number, data: any }>();

function getCached(key: string) {
  const cached = memoryCache.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data;
  return null;
}
function setCache(key: string, data: any, ttlMs: number) {
  memoryCache.set(key, { expiry: Date.now() + ttlMs, data });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());


  // REST API Routes
  app.get("/api/ports", (req, res) => {
    const query = (req.query.q as string || "").toLowerCase();
    if (!query) {
      return res.json({ ports: PORTS_DATABASE });
    }
    const filtered = PORTS_DATABASE.filter(
      p => p.name.toLowerCase().includes(query) ||
           p.region.toLowerCase().includes(query) ||
           p.country.toLowerCase().includes(query)
    );
    res.json({ ports: filtered });
  });

  // Proxy: IHM Tides Official Data with Caching
  app.get("/api/proxy/ihm", async (req, res) => {
    const { ihmId, monthStr } = req.query;
    if (!ihmId || !monthStr) return res.status(400).json({ error: "Missing ihmId or monthStr" });

    const cacheKey = `ihm_${ihmId}_${monthStr}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', data: cached });
    }

    try {
      const url = `https://ideihm.covam.es/api-ihm/getmarea?request=gettide&id=${ihmId}&format=json&month=${monthStr}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
      
      if (!resp.ok) throw new Error(`IHM API failed: ${resp.status}`);
      
      const data = await resp.json();
      if (data && data.mareas) {
        setCache(cacheKey, data, 1000 * 60 * 60 * 6); // Cache 6 horas (Predicciones)
      }
      res.json({ source: 'live', data });
    } catch (e: any) {
      console.error('Error fetching IHM:', e.message);
      res.status(500).json({ error: "Fallo al conectar con IHM" });
    }
  });

  // Proxy: Open-Meteo Marine Weather with Caching
  app.get("/api/proxy/marine", async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "Missing lat/lng" });

    const cacheKey = `marine_${lat}_${lng}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', data: cached });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const [weatherRes, marineRes] = await Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code&timezone=auto`,
          { signal: controller.signal }
        ),
        fetch(
          `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction&timezone=auto`,
          { signal: controller.signal }
        )
      ]).finally(() => clearTimeout(timeout));

      if (!weatherRes.ok || !marineRes.ok) throw new Error('Open-Meteo failed');
      
      const weatherData = await weatherRes.json();
      const marineData = await marineRes.json();
      
      const combined = { weather: weatherData, marine: marineData };
      setCache(cacheKey, combined, 1000 * 60 * 15); // Cache 15 minutos (Live Telemetry)
      
      res.json({ source: 'live', data: combined });
    } catch (e: any) {
      console.error('Error fetching Open-Meteo:', e.message);
      res.status(500).json({ error: "Fallo al conectar con Open-Meteo" });
    }
  });



  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Tabla de Mareas running on http://localhost:${PORT}`);
  });
}

startServer();
