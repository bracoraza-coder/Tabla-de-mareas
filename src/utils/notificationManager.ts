import { NotificationSettings, Port, UserUnits, ScheduledAlert, TideDayData } from '../types';
import { calculateTideDayData } from './tideEngine';
import { PORTS_DATABASE } from '../data/portsData';
import { getZonedParts } from './timezoneHelpers';

/**
 * Checks and requests browser notification permission.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Sends a direct local notification if permission is granted.
 */
export function sendTestNotification(portName: string): boolean {
  if (getNotificationPermission() === 'granted') {
    new Notification('Mareas Pro: Prueba de Alerta', {
      body: `Notificaciones activadas correctamente para ${portName}. Recibirás avisos antes de las pleamares y bajamares.`,
      icon: '/favicon.svg' // Provide a real icon path if available
    });
    return true;
  }
  return false;
}

export function sendRealNotification(title: string, body: string) {
  if (getNotificationPermission() === 'granted') {
    new Notification(title, { body, icon: '/favicon.svg' });
  }
}

/**
 * Generates the list of scheduled alerts for *today* based on the user's settings
 * and subscribed ports.
 * 
 * Note: In a real PWA with a Service Worker, this logic would run in the background.
 * For this browser-only demo, we just calculate the times to display them in the UI.
 */
export function getScheduledAlertsForToday(
  subscribedPortIds: string[],
  settings: NotificationSettings,
  units: UserUnits
): ScheduledAlert[] {
  if (!settings.enabled || subscribedPortIds.length === 0) return [];

  const alerts: ScheduledAlert[] = [];
  const now = new Date();

  subscribedPortIds.forEach(portId => {
    const port = PORTS_DATABASE.find(p => p.id === portId);
    if (!port) return;

    // We calculate the tide data for "today" in the port's local timezone
    // to find today's high/low events.
    const todayData = calculateTideDayData(port, now);

    // Apply filters
    if (settings.notifyMareasVivas && todayData.coefficient < 80) {
      return; // Skip this port today if setting is on and coef is low
    }

    todayData.highLows.forEach(hl => {
      if (hl.type === 'pleamar' && !settings.notifyPleamar) return;
      if (hl.type === 'bajamar' && !settings.notifyBajamar) return;

      // Calculate alert time
      const [h, m] = hl.time.split(':').map(Number);
      
      // We need to subtract alertTimingMinutes from the event time
      let alertMin = m - settings.alertTimingMinutes;
      let alertHour = h;
      
      while (alertMin < 0) {
        alertMin += 60;
        alertHour -= 1;
      }
      
      // If alert time goes to previous day, we skip it for simplicity in this UI list
      if (alertHour < 0) return;

      const alertTimeStr = `${String(alertHour).padStart(2,'0')}:${String(alertMin).padStart(2,'0')}`;

      alerts.push({
        id: `${port.id}-${hl.time}-${hl.type}`,
        portId: port.id,
        portName: port.name.split(' (')[0],
        tideType: hl.type,
        timeStr: hl.time,
        scheduledAlertTimeStr: alertTimeStr,
        heightMeters: hl.height,
        coefficient: todayData.coefficient
      });
    });
  });

  // Sort alerts by alert time chronologically
  alerts.sort((a, b) => a.scheduledAlertTimeStr.localeCompare(b.scheduledAlertTimeStr));

  return alerts;
}
