import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { PORTS_DATABASE } from "./src/data/portsData";
import { getTideDayData, getMonthlyTideData } from "./src/utils/tideEngine";

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
  // 1. Search & List Ports
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

  // 2. Tide Day Data for a Port & Date
  app.get("/api/tides/:portId", (req, res) => {
    const { portId } = req.params;
    const dateQuery = req.query.date as string; // YYYY-MM-DD
    const port = PORTS_DATABASE.find(p => p.id === portId) || PORTS_DATABASE[0];
    
    let targetDate = new Date();
    if (dateQuery) {
      const parsed = new Date(dateQuery + "T12:00:00");
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }

    const dayData = getTideDayData(port, targetDate, Date.now());
    res.json({ port, dayData });
  });

  // 3. Monthly Tide Table
  app.get("/api/monthly/:portId", (req, res) => {
    const { portId } = req.params;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth();
    const port = PORTS_DATABASE.find(p => p.id === portId) || PORTS_DATABASE[0];

    const monthlyRows = getMonthlyTideData(port, year, month);
    res.json({ port, year, month, monthlyRows });
  });

  // 4. Gemini AI Marine & Fishing Advisor Endpoint
  app.post("/api/ai/advice", async (req, res) => {
    try {
      const { portName, region, dateStr, tideState, waterHeight, coefficient, weather, solunarScore, userQuestion } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "Clave de API Gemini no configurada."
        });
      }

      const prompt = `
Eres el Capitán Náutico y experto en pesca deportiva y meteorología marina de "Tabla de Mareas".
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
Mantén la respuesta concisa y visualmente ordenada con viñetas o negritas sin superar los 350 palabras.
`;

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
