import { Port } from '../types';
import { PORTS_DATABASE } from '../data/portsData';

/**
 * Super simple URL router functions to manage clean URLs 
 * without bringing in a heavy router library like React Router for a single-page app.
 */

// Format: /puerto/es-gal-vigo
export function buildPortPath(port: Port): string {
  return `/mareas/${port.id}`;
}

export function parsePortFromUrl(): Port | null {
  const path = window.location.pathname;
  if (path.startsWith('/mareas/')) {
    const id = path.replace('/mareas/', '');
    const found = PORTS_DATABASE.find(p => p.id === id);
    if (found) return found;
  }
  return null;
}
