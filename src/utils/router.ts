import { Port } from '../types';
import { PORTS_DATABASE } from '../data/portsData';

export const PORT_PATH_PREFIX = '/mareas';

/** Builds the canonical path for a given port, e.g. "/mareas/cadiz". */
export function buildPortPath(port: Port): string {
  return `${PORT_PATH_PREFIX}/${port.id}`;
}

/** Reads the current browser path and returns the matching port, if any. */
export function getPortFromLocation(): Port | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.replace(/\/+$/, '');
  const match = path.match(/^\/mareas\/([a-z0-9-]+)$/i);
  if (!match) return null;
  const slug = match[1].toLowerCase();
  return PORTS_DATABASE.find(p => p.id === slug) || null;
}

/**
 * Pushes (or replaces) the browser URL to reflect the given port, without
 * triggering a full page reload - this is what gives every port its own
 * shareable, indexable, bookmarkable address (e.g. /mareas/vigo) while the
 * app itself stays a fast client-side SPA.
 */
export function syncUrlToPort(port: Port, replace = false) {
  if (typeof window === 'undefined') return;
  const path = buildPortPath(port);
  if (window.location.pathname === path) return;
  if (replace) {
    window.history.replaceState({ portId: port.id }, '', path);
  } else {
    window.history.pushState({ portId: port.id }, '', path);
  }
}

/**
 * Updates <title>, meta description, canonical link and Open Graph/Twitter
 * tags to match the currently selected port. This runs client-side, but
 * Google (and most modern crawlers) execute JavaScript before indexing, so
 * each port effectively gets its own unique, search-relevant page.
 */
export function updateHeadForPort(port: Port) {
  if (typeof document === 'undefined') return;

  const origin = window.location.origin;
  const path = buildPortPath(port);
  const url = `${origin}${path}`;

  const title = `Mareas y Surf en ${port.name} Hoy | Previsión de Olas | Tabla de Mareas Pro`;
  const description = `Tabla de mareas de ${port.name} (${port.region}) en tiempo real: pleamar, bajamar, coeficiente y altura del agua. Previsión de surf y oleaje: swell, periodo, viento y mejor hora para surfear. Datos gratuitos, siempre actualizados.`;

  document.title = title;

  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
