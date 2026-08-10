// /api/mareas — Backend Serverless (Vercel Function).
//
// Medidas de Seguridad y Optimización Aplicadas:
// - V-01: Caché con Límite Máximo de Entradas (LRU Eviction) para evitar DoS / OOM.
// - V-02: Validación estricta de parámetros y fecha (YYYY-MM-DD) contra abuso upstream.
// - V-04: Eliminación de fuga de datos técnicos internos (sin bodyPreview en respuestas).
// - V-05: Uso de códigos de estado HTTP semánticos (400, 404, 429, 502, 500) en lugar de 200 con error.
// - V-06: Adición de encabezados de seguridad HTTP (X-Content-Type-Options, X-Frame-Options, Referrer-Policy).
// - V-07: Control de tasa de peticiones (Rate Limiting) por IP del cliente.

const IHM_BASE = 'https://ideihm.covam.es/api-ihm/getmarea';
const STATION_LIST_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const TIDE_CACHE_TTL_MS = 30 * 60 * 1000;       // 30 minutos
const MAX_CACHE_ENTRIES = 300;                   // Máximo de elementos en caché (V-01)

// Caché en memoria con desalojo automático por límite de tamaño (LRU)
let stationListCache = { data: null, fetchedAt: 0 };
const tideCache = new Map(); // key: `${stationId}:${date}` -> { data, fetchedAt }

// Control de tasa por IP (V-07)
const ipRateLimitMap = new Map(); // ip -> { count, resetAt }
const RATE_LIMIT_MAX = 60;        // 60 peticiones por minuto por IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = ipRateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count += 1;
  return true;
}

// Limpieza periódica suave de IPs expiradas
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRateLimitMap.entries()) {
      if (now > record.resetAt) ipRateLimitMap.delete(ip);
    }
  }, 5 * 60 * 1000);
}

function setInCache(key, payload) {
  if (tideCache.size >= MAX_CACHE_ENTRIES) {
    // Elimina la entrada más antigua (primer key en iteración de Map)
    const oldestKey = tideCache.keys().next().value;
    if (oldestKey) tideCache.delete(oldestKey);
  }
  tideCache.set(key, { data: payload, fetchedAt: Date.now() });
}

function normalizeName(s) {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // eliminar acentos
    .toLowerCase()
    .replace(/\(.*?\)/g, '')         // ignorar paréntesis
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchJsonWithTimeout(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'InfoMareaPro/2.0 (Backend Proxy)',
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch (err) {
    clearTimeout(timeout);
    console.error(`[Fetch Error] ${url}:`, err && err.message ? err.message : err);
    return null;
  }
}

async function getStationList() {
  const now = Date.now();
  if (stationListCache.data && now - stationListCache.fetchedAt < STATION_LIST_TTL_MS) {
    return stationListCache.data;
  }
  const url = `${IHM_BASE}?request=getlist&format=json`;
  const raw = await fetchJsonWithTimeout(url);
  const parsed = extractStations(raw);
  if (parsed.length === 0) {
    if (stationListCache.data) return stationListCache.data;
    // Snapshot oficial verificado como respaldo de seguridad
    return { estaciones: { puertos: STATION_LIST_FALLBACK.map(s => ({ id: s.id, code: s.code, puerto: s.name })) } };
  }
  stationListCache = { data: raw, fetchedAt: now };
  return raw;
}

function extractStations(raw) {
  if (!raw) return [];
  const list = raw?.estaciones?.puertos;
  if (!Array.isArray(list)) return [];
  return list
    .map((s) => ({
      id: s.id ?? null,
      code: (s.code ?? '').toString(),
      name: s.puerto ?? '',
    }))
    .filter((s) => s.id !== null && (s.code || s.name));
}

const STATION_LIST_FALLBACK = [
  { id: '71', code: 'aguarda', name: 'A Guarda' },
  { id: '49', code: 'algeciras', name: 'Algeciras' },
  { id: '57', code: 'arinaga', name: 'Arinaga (Gran Canaria)' },
  { id: '53', code: 'arrecife', name: 'Arrecife (Lanzarote)' },
  { id: '7', code: 'aviles', name: 'Avilés (San Juan de Nieva)' },
  { id: '32', code: 'ayamonte', name: 'Ayamonte' },
  { id: '30', code: 'baiona', name: 'Baiona' },
  { id: '47', code: 'barbate', name: 'Barbate' },
  { id: '72', code: 'Bermeo', name: 'Bermeo' },
  { id: '2', code: 'bilbao', name: 'Bilbao' },
  { id: '37', code: 'bonanza', name: 'Bonanza (Sanlúcar de Barrameda)' },
  { id: '13', code: 'burela', name: 'Burela' },
  { id: '42', code: 'cadiz', name: 'Cádiz' },
  { id: '22', code: 'camarinas', name: 'Camariñas' },
  { id: '16', code: 'carino', name: 'Cariño' },
  { id: '17', code: 'cedeira', name: 'Cedeira' },
  { id: '51', code: 'ceuta', name: 'Ceuta' },
  { id: '39', code: 'chipiona', name: 'Chipiona' },
  { id: '15', code: 'cillero', name: 'Cillero (Ría de Viveiro)' },
  { id: '46', code: 'conil', name: 'Conil' },
  { id: '20', code: 'coruna', name: 'A Coruña' },
  { id: '8', code: 'cudillero', name: 'Cudillero' },
  { id: '41', code: 'elpuertosantamaria', name: 'El Puerto de Santa María' },
  { id: '18', code: 'ferrol', name: 'Ferrol' },
  { id: '23', code: 'fisterra', name: 'Fisterra' },
  { id: '12', code: 'foz', name: 'Foz' },
  { id: '44', code: 'gallineras', name: 'Gallineras' },
  { id: '6', code: 'gijon', name: 'Gijón' },
  { id: '64', code: 'granadilla', name: 'Granadilla (Tenerife)' },
  { id: '33', code: 'islacanela', name: 'Marina de Isla Canela' },
  { id: '34', code: 'islacristina', name: 'Isla Cristina' },
  { id: '43', code: 'lacarraca', name: 'La Carraca' },
  { id: '70', code: 'langosteira', name: 'Langosteira (Puerto exterior de A Coruña)' },
  { id: '31', code: 'lisboa', name: 'Lisboa' },
  { id: '4', code: 'llanes', name: 'Llanes' },
  { id: '63', code: 'loscristianos', name: 'Los Cristianos (Tenerife)' },
  { id: '61', code: 'losgigantes', name: 'Los Gigantes (Tenerife)' },
  { id: '21', code: 'malpica', name: 'Malpica' },
  { id: '28', code: 'marin', name: 'Marín (Ría de Pontevedra)' },
  { id: '36', code: 'mazagon', name: 'Mazagón (Huelva)' },
  { id: '55', code: 'morrojable', name: 'Morro Jable (Fuerteventura)' },
  { id: '9', code: 'navia', name: 'Navia' },
  { id: '1', code: 'pasajes', name: 'Pasajes' },
  { id: '58', code: 'pasitoblanco', name: 'Pasito Blanco (Gran Canaria)' },
  { id: '24', code: 'portosin', name: 'Portosín (Ría de Muros y Noia)' },
  { id: '62', code: 'ptocruz', name: 'Puerto de la Cruz (Tenerife)' },
  { id: '67', code: 'ptolaestaca', name: 'Puerto de la Estaca (El Hierro)' },
  { id: '56', code: 'ptolaluz', name: 'Puerto de la Luz (Gran Canaria)' },
  { id: '59', code: 'ptolasnieves', name: 'Puerto de las Nieves (Gran Canaria)' },
  { id: '54', code: 'ptorosario', name: 'Puerto del Rosario (Fuerteventura)' },
  { id: '35', code: 'puntaumbria', name: 'Punta Umbría' },
  { id: '11', code: 'ribadeo', name: 'Ribadeo' },
  { id: '5', code: 'ribadesella', name: 'Ribadesella' },
  { id: '40', code: 'rota', name: 'Rota' },
  { id: '19', code: 'sada', name: 'Sada Fontán (Ría de Betanzos)' },
  { id: '14', code: 'sancibrao', name: 'Alúmina Española (San Cibrao)' },
  { id: '45', code: 'sanctipetri', name: 'Sancti Petri' },
  { id: '65', code: 'sansebastiangomera', name: 'San Sebastián de la Gomera' },
  { id: '3', code: 'santander', name: 'Santander' },
  { id: '25', code: 'santauxia', name: 'Santa Uxía de Ribeíra (Ría de Arousa)' },
  { id: '27', code: 'sanxenxo', name: 'Sanxenxo (Ría de Pontevedra)' },
  { id: '38', code: 'sevilla', name: 'Sevilla' },
  { id: '50', code: 'sotogrande', name: 'Sotogrande' },
  { id: '66', code: 'stacruzpalma', name: 'Santa Cruz de La Palma' },
  { id: '60', code: 'stacruztenerife', name: 'Santa Cruz de Tenerife' },
  { id: '52', code: 'tanger', name: 'Tánger' },
  { id: '10', code: 'tapia', name: 'Tapia' },
  { id: '48', code: 'tarifa', name: 'Tarifa' },
  { id: '26', code: 'vilagarcia', name: 'Vilagarcía (Ría de Arousa)' },
  { id: '29', code: 'vigo', name: 'Vigo' },
];

function findStationId(stations, portName, portCode) {
  if (portCode) {
    const normCode = normalizeName(portCode).replace(/\s+/g, '');
    const exact = stations.find((s) => normalizeName(s.code).replace(/\s+/g, '') === normCode);
    if (exact) return exact;
  }

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
  const events = raw?.mareas?.datos?.marea;
  if (!Array.isArray(events)) return null;

  const parsed = events
    .map((e) => {
      const time = e.hora;
      const height = e.altura;
      const rawType = (e.tipo || '').toString().toLowerCase();
      const type = rawType.includes('baj') ? 'bajamar' : 'pleamar';
      if (!time || height === undefined) return null;
      const h = Number(height);
      if (Number.isNaN(h)) return null;
      return { time: String(time), height: h, type };
    })
    .filter(Boolean);

  return parsed.length > 0 ? parsed : null;
}

export default async function handler(req, res) {
  // CORS y métodos permitidos
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Encabezados de seguridad HTTP (V-06)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Control de tasa de peticiones (V-07)
  const xRealIp = req.headers['x-real-ip'];
  const xForwardedFor = req.headers['x-forwarded-for'];
  const clientIp = (typeof xRealIp === 'string' ? xRealIp.trim() : null)
    || (typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0].trim() : null)
    || req.socket?.remoteAddress
    || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      ok: false,
      error: 'Demasiadas peticiones. Por favor, intente nuevamente en un minuto.',
    });
  }

  const { port, portName, date } = req.query;

  if (!portName || typeof portName !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'Falta el parámetro portName (nombre del puerto a buscar).',
    });
  }

  // Validación de fecha (YYYY-MM-DD)
  let targetDate = new Date().toISOString().slice(0, 10);
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    targetDate = date;
  }

  const cacheKey = `${port || portName}:${targetDate}`;
  const cached = tideCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < TIDE_CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800');
    return res.status(200).json({ ...cached.data, cached: true });
  }

  try {
    const stationListRaw = await getStationList();
    const stations = extractStations(stationListRaw);

    if (stations.length === 0) {
      // V-05: Código HTTP 502 Bad Gateway
      return res.status(502).json({
        ok: false,
        source: 'modelo-estimado',
        reason: 'No se pudo obtener el listado oficial de estaciones del IHM en este momento.',
      });
    }

    const station = findStationId(stations, portName, port);
    if (!station) {
      // V-05: Código HTTP 404 Not Found
      return res.status(404).json({
        ok: false,
        source: 'modelo-estimado',
        reason: `No se encontró una estación IHM que coincida con "${portName}".`,
      });
    }

    const dateParam = targetDate.replace(/-/g, '');
    const tideUrl = `${IHM_BASE}?request=gettide&id=${encodeURIComponent(station.id)}&format=json&date=${dateParam}`;
    const tideRaw = await fetchJsonWithTimeout(tideUrl);
    const events = extractTideEvents(tideRaw);

    if (!events) {
      // V-05: Código HTTP 502 Bad Gateway
      return res.status(502).json({
        ok: false,
        source: 'modelo-estimado',
        reason: `El IHM no devolvió datos válidos para la estación "${station.name}" en esta fecha.`,
      });
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

    setInCache(cacheKey, payload); // V-01: Almacenamiento seguro con límite
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800');
    return res.status(200).json(payload);

  } catch (err) {
    console.error('[API Mareas Error]:', err);
    // V-05: Código HTTP 500 Internal Server Error
    return res.status(500).json({
      ok: false,
      source: 'modelo-estimado',
      reason: 'Error interno en el servidor procesando la consulta.',
    });
  }
}
