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

async function fetchDiagnostic(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
    });
    clearTimeout(timeout);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return {
      ok: res.ok,
      status: res.status,
      contentType,
      bodyPreview: text.slice(0, 500),
      json,
      url,
    };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, status: 0, error: String(err && err.message || err), url };
  }
}

async function fetchJson(url) {
  const diag = await fetchDiagnostic(url);
  return diag.json;
}

async function getStationList() {
  const now = Date.now();
  if (stationListCache.data && now - stationListCache.fetchedAt < STATION_LIST_TTL_MS) {
    return { data: stationListCache.data, diag: null, usedFallback: false };
  }
  const url = `${IHM_BASE}?request=getlist&format=json`;
  const diag = await fetchDiagnostic(url);
  const parsed = extractStations(diag.json);
  if (parsed.length === 0) {
    // Live call failed or returned something unparseable - use the stale
    // cache if we have one, otherwise the verified fallback snapshot.
    if (stationListCache.data) return { data: stationListCache.data, diag, usedFallback: false };
    return { data: { estaciones: { puertos: STATION_LIST_FALLBACK.map(s => ({ id: s.id, code: s.code, puerto: s.name })) } }, diag, usedFallback: true };
  }
  stationListCache = { data: diag.json, fetchedAt: now };
  return { data: diag.json, diag, usedFallback: false };
}

// Verified against a real live response (2026-07-31): the IHM wraps the
// station list at estaciones.puertos[], each with {id, code, puerto, lat, lon}.
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

// A hardcoded snapshot of the real station list, captured from a verified
// live response, used ONLY if the live getlist call fails. This is real
// data we've confirmed once, not a guess - a safety net, not a shortcut.
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
  { id: '29', code: 'vigo', name: 'Vigo' },
  { id: '26', code: 'vilagarcia', name: 'Vilagarcía (Ría de Arousa)' },
];

function findStationId(stations, portName, portCode) {
  // 1) Exact match on the normalized IHM "code" - most reliable, since our
  // own port ids are already similar slugs (e.g. 'isla-cristina' vs 'islacristina').
  if (portCode) {
    const normCode = normalizeName(portCode).replace(/\s+/g, '');
    const exact = stations.find((s) => normalizeName(s.code).replace(/\s+/g, '') === normCode);
    if (exact) return exact;
  }

  // 2) Fallback: fuzzy match on the display name.
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

// Verified against a real live response (2026-07-31): tide events live at
// mareas.datos.marea[], each with {hora, altura, tipo}.
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
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800'); // edge cache 30 min

  const { port, portName, date, debug } = req.query;

  // Diagnostic mode: shows exactly what the IHM responded, raw, so we can
  // fix the parsing against real data instead of guessing blindly.
  if (debug) {
    const listDiag = await fetchDiagnostic(`${IHM_BASE}?request=getlist&format=json`);
    const dateParam = (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    const tideDiag = await fetchDiagnostic(`${IHM_BASE}?request=gettide&id=${encodeURIComponent(port || '6')}&format=json&date=${dateParam}`);
    res.status(200).json({ debug: true, getlist: listDiag, gettide: tideDiag });
    return;
  }

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
    const { data: stationListRaw, diag: listDiag } = await getStationList();
    const stations = extractStations(stationListRaw);

    if (stations.length === 0) {
      res.status(200).json({
        ok: false,
        source: 'modelo-estimado',
        reason: 'No se pudo obtener el listado oficial de estaciones del IHM en este momento.',
        hint: listDiag ? { status: listDiag.status, contentType: listDiag.contentType, bodyPreview: listDiag.bodyPreview } : undefined,
      });
      return;
    }

    const station = findStationId(stations, portName, port);
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
