import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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

  // Gemini AI Initialization
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

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

  // Gemini AI Marine & Fishing Advisor Endpoint
  app.post("/api/ai/advice", async (req, res) => {
    try {
      const { portName, region, dateStr, tideState, waterHeight, coefficient, weather, solunarScore, userQuestion } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "Clave de API Gemini no configurada."
        });
      }

      const prompt = `Eres el Capitán Náutico y experto en pesca deportiva y meteorología marina de "Tabla de Mareas".
Analiza los siguientes datos marinos reales para la localización de ${portName} (${region}) el día ${dateStr}:
- Estado actual de la marea: ${tideState} (Altura actual: ${waterHeight}m)
- Coeficiente de Mareas: ${coefficient} (30-120)
- Viento: ${weather.windSpeedKnots} nudos dirección ${weather.windDirection} (Rachas: ${weather.windGustKnots} kts)
- Oleaje / Mar de Fondo: ${weather.waveHeightMeters}m (${weather.seaStateName}, Período ${weather.wavePeriodSeconds}s)
- Temperatura marina del agua: ${weather.waterTemp}°C | Temp ambiente: ${weather.temp}°C
- Índice Actividad Solunar de Pesca: ${solunarScore}/5 (Nivel de actividad solunar)

Pregunta o solicitud del usuario: ${userQuestion || "¿Cuáles son los mejores momentos para la pesca y la navegación hoy?"}

Instrucciones de respuesta:
1. Responde de forma clara, profesional, amable y estructurada en español.
2. Da consejos prácticos de pesca (técnicas recomendadas según el coeficiente y la marea, tipo de señuelo/carnada, especie objetivo como doradas, lubinas, sargos o calamares).
3. Da recomendaciones de seguridad náutica para marineros, surfistas o bañistas (evaluando viento y viento de tierra/mar).
4. Responde específicamente a la duda del usuario si hizo una pregunta.
Mantén la respuesta concisa y visualmente ordenada con viñetas o negritas sin superar los 350 palabras.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "Eres el experto marino oficial de Tabla de Mareas. Ofreces asesoramiento sobre mareas, viento, pesca deportiva y seguridad marítima en español.",
          temperature: 0.7,
        }
      });

      res.json({ advice: response.text });
    } catch (err: any) {
      console.error("Error in Gemini API /api/ai/advice:", err);
      res.status(500).json({ error: "No se pudo generar la recomendación marina en este momento." });
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
