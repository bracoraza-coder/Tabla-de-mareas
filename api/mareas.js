// /api/mareas — Backend propio (Vercel Serverless Function).
//
// El frontend NUNCA llama directamente al IHM: llama a este endpoint.
// Este endpoint:
//   1) Busca en vivo, contra el listado oficial del IHM, el ID de estación
//      que corresponde al puerto pedido (por nombre) - no usamos IDs
//      adivinados a mano, que sería tan poco fiable como el modelo actual.
//   2) Pide la predicción real de mareas de esa estación para la fecha dada.
//   3) Normaliza el resultado a un formato limpio y estable.
//   4) Cachea en memoria (TTL) para no saturar la API oficial.
//   5) Si cualquier paso falla, devuelve { ok: false } de forma clara -
//      nunca datos inventados etiquetados como oficiales.
//
// Fuente: Instituto Hidrográfico de la Marina (IHM) - ideihm.covam.es
// Uso gratuito, sin clave. Atribución obligatoria en el frontend.

// Nota: no se declara "runtime" explícito - Vercel usa Node.js por defecto
// para archivos en /api/*.js, que es justo lo que necesitamos aquí.

const IHM_BASE = 'https://ideihm.covam.es/api-ihm/getmarea';
const STATION_LIST_TTL_MS = 24 * 60 * 60 * 1000; // station list barely changes
const TIDE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min, per report recommendation

// Simple in-memory cache. Serverless instances are ephemeral/cold-started,
// so this is a best-effort cache (reduces load when an instance is warm),
// not a durable store - that's fine for this use case.
let stationListCache = { data: null, fetchedAt: 0 };
const tideCache = new Map(); // key: `${stationId}:${date}` -> { data, fetchedAt }

function normalizeName(s) {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // drop parenthetical qualifiers
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchJson(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      // The IHM API defaults to plain text / HTML for some requests -
      // treat unparsable responses as a failure rather than guessing.
      return null;
    }
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function getStationList() {
  const now = Date.now();
  if (stationListCache.data && now - stationListCache.fetchedAt < STATION_LIST_TTL_MS) {
    return stationListCache.data;
  }
  const url = `${IHM_BASE}?request=getlist&format=json`;
  const data = await fetchJson(url);
  if (!data) return stationListCache.data; // serve stale cache over nothing, if we have it
  stationListCache = { data, fetchedAt: now };
  return data;
}

// Extracts a flat array of {id, name} from whatever shape the IHM getlist
// response turns out to be - written defensively since the exact schema
// hasn't been verified against a live response yet.
function extractStations(raw) {
  if (!raw) return [];
  const candidates = Array.isArray(raw) ? raw : raw.stations || raw.data || raw.list || raw.puertos || [];
  if (!Array.isArray(candidates)) return [];
  return candidates
    .map((s) => ({
      id: s.id ?? s.ID ?? s.Id ?? s.idPuerto ?? s.codigo ?? null,
      name: s.name ?? s.NAME ?? s.nombre ?? s.puerto ?? s.PUERTO ?? '',
    }))
    .filter((s) => s.id !== null && s.name);
}

function findStationId(stations, portName) {
  const target = normalizeName(portName);
  if (!target) return null;

  let best = null;
  let bestScore = -1;
  for (const s of stations) {
    const candidate = normalizeName(s.name);
    if (!candidate) continue;
    let score = 0;
    if (candidate === target) score = 100;
    else if (candidate.startsWith(target) || target.startsWith(candidate)) score = 80;
    else if (candidate.includes(target) || target.includes(candidate)) score = 60;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore >= 60 ? best : null;
}

function extractTideEvents(raw) {
  if (!raw) return null;
  const events = Array.isArray(raw) ? raw : raw.mareas || raw.tides || raw.data || raw.predicciones || null;
  if (!Array.isArray(events)) return null;

  const parsed = events
    .map((e) => {
      const time = e.hora ?? e.time ?? e.datetime ?? e.fecha ?? null;
      const height = e.altura ?? e.height ?? e.value ?? null;
      const rawType = (e.tipo ?? e.type ?? '').toString().toLowerCase();
      const type = rawType.includes('baj') || rawType === 'l' || rawType === 'low' ? 'bajamar' : 'pleamar';
      if (time === null || height === null) return null;
      return { time: String(time), height: Number(height), type };
    })
    .filter(Boolean);

  return parsed.length > 0 ? parsed : null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800'); // edge cache 30 min

  const { port, portName, date } = req.query;

  if (!portName || typeof portName !== 'string') {
    res.status(400).json({ ok: false, error: 'Falta el parámetro portName (nombre del puerto a buscar).' });
    return;
  }

  const targetDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date
    : new Date().toISOString().slice(0, 10);

  const cacheKey = `${port || portName}:${targetDate}`;
  const cached = tideCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < TIDE_CACHE_TTL_MS) {
    res.status(200).json({ ...cached.data, cached: true });
    return;
  }

  try {
    const stationListRaw = await getStationList();
    const stations = extractStations(stationListRaw);

    if (stations.length === 0) {
      res.status(200).json({
        ok: false,
        source: 'modelo-estimado',
        reason: 'No se pudo obtener el listado oficial de estaciones del IHM en este momento.',
      });
      return;
    }

    const station = findStationId(stations, portName);
    if (!station) {
      res.status(200).json({
        ok: false,
        source: 'modelo-estimado',
        reason: `No se encontró una estación IHM que coincida con "${portName}".`,
      });
      return;
    }

    const dateParam = targetDate.replace(/-/g, '');
    const tideUrl = `${IHM_BASE}?request=gettide&id=${encodeURIComponent(station.id)}&format=json&date=${dateParam}`;
    const tideRaw = await fetchJson(tideUrl);
    const events = extractTideEvents(tideRaw);

    if (!events) {
      res.status(200).json({
        ok: false,
        source: 'modelo-estimado',
        reason: `El IHM no devolvió datos válidos para la estación "${station.name}" en esta fecha.`,
      });
      return;
    }

    const payload = {
      ok: true,
      source: 'IHM',
      stationName: station.name,
      stationId: station.id,
      date: targetDate,
      fetchedAt: new Date().toISOString(),
      tides: events,
    };

    tideCache.set(cacheKey, { data: payload, fetchedAt: Date.now() });
    res.status(200).json(payload);
  } catch (err) {
    res.status(200).json({
      ok: false,
      source: 'modelo-estimado',
      reason: 'Error inesperado consultando el IHM.',
    });
  }
}
