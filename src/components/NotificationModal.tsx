import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  BellRing, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  Star, 
  Send, 
  Settings2, 
  X,
  Volume2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Info,
  Waves,
  ArrowLeft
} from 'lucide-react';
import { Port, NotificationSettings, UserUnits, ScheduledAlert } from '../types';
import { PORTS_DATABASE } from '../data/portsData';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendTestNotification,
  getScheduledAlertsForToday 
} from '../utils/notificationManager';
import { formatHeight } from '../utils/tideEngine';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: string[];
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  selectedPort: Port;
  onSelectPort: (port: Port) => void;
  units: UserUnits;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  favorites,
  settings,
  onUpdateSettings,
  selectedPort,
  onSelectPort,
  units,
}) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      onUpdateSettings({ ...settings, enabled: true });
    }
  };

  const handleTestNotification = () => {
    const success = sendTestNotification(selectedPort.name);
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  const togglePortSubscription = (portId: string) => {
    const currentList = settings.subscribedPortIds;
    const newList = currentList.includes(portId)
      ? currentList.filter(id => id !== portId)
      : [...currentList, portId];

    onUpdateSettings({
      ...settings,
      subscribedPortIds: newList,
    });
  };

  const favoritePortsList = PORTS_DATABASE.filter(p => favorites.includes(p.id));
  const scheduledAlerts: ScheduledAlert[] = getScheduledAlertsForToday(
    settings.subscribedPortIds,
    settings,
    units
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" id="notifications-modal-overlay">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
        id="notifications-modal-container"
      >
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 shrink-0"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
            <div className="w-10 h-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Alertas y Notificaciones de Mareas
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Recibe avisos automáticos en tu navegador para las Pleamares y Bajamares de tus puertos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            id="close-notifications-modal-btn"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-slate-300">

          {/* Permission Status Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5">
                {permission === 'granted' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                ) : permission === 'denied' ? (
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                )}

                <div>
                  <div className="font-bold text-white text-sm font-mono flex items-center gap-2">
                    <span>Estado del Navegador:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      permission === 'granted' 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : permission === 'denied'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {permission === 'granted' ? 'Permiso Concedido ✓' : permission === 'denied' ? 'Bloqueado por el Navegador ✗' : 'Pendiente de Activar'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {permission === 'granted'
                      ? 'Tu navegador permite enviar notificaciones de escritorio para tus alertas marítimas.'
                      : permission === 'denied'
                      ? 'Has bloqueado las notificaciones. Para habilitarlas, activa el candado o permiso de notificaciones en la barra de dirección de tu navegador.'
                      : 'Activa los permisos del navegador para comenzar a recibir avisos directos de pleamar y bajamar.'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              {permission !== 'granted' ? (
                <button
                  onClick={handleRequestPermission}
                  disabled={permission === 'denied'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  id="request-notification-permission-btn"
                >
                  Solicitar Permisos
                </button>
              ) : (
                <button
                  onClick={handleTestNotification}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-blue-300 border border-slate-700 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 font-mono"
                  id="test-notification-btn"
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Probar Notificación</span>
                </button>
              )}
            </div>

            {testSent && (
              <div className="bg-emerald-950/70 border border-emerald-800 text-emerald-300 p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>¡Notificación de prueba enviada! Comprueba tu centro de notificaciones de escritorio o móvil.</span>
              </div>
            )}
          </div>

          {/* Master Toggle */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <span>Suscripción Principal de Alertas</span>
              </div>
              <p className="text-slate-400">
                Encender o apagar todas las notificaciones meteorológicas y de marea.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => onUpdateSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
                id="master-notification-switch"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Timing Lead Time Selector */}
          <div className="space-y-2">
            <label className="font-bold text-white uppercase text-[11px] font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Antelación del Aviso (Lead Time)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              {[
                { label: 'Al momento (0m)', value: 0 },
                { label: '15 min antes', value: 15 },
                { label: '30 min antes', value: 30 },
                { label: '1 hora antes', value: 60 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateSettings({ ...settings, alertTimingMinutes: opt.value })}
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    settings.alertTimingMinutes === opt.value
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Types of Alerts Filters */}
          <div className="space-y-2">
            <label className="font-bold text-white uppercase text-[11px] font-mono flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-blue-400" /> Tipos de Alerta a Recibir
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">📈</span> Pleamares (Marea Alta)
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifyPleamar}
                  onChange={(e) => onUpdateSettings({ ...settings, notifyPleamar: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-cyan-400 font-bold">📉</span> Bajamares (Marea Baja)
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifyBajamar}
                  onChange={(e) => onUpdateSettings({ ...settings, notifyBajamar: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">⚡</span> Mareas Vivas (Coef ≥ 80)
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifyMareasVivas}
                  onChange={(e) => onUpdateSettings({ ...settings, notifyMareasVivas: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Subscribed Favorite Ports */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white uppercase text-[11px] font-mono flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" /> Puertos Suscritos a Alertas
              </label>
              <span className="text-slate-400 text-xs font-mono">
                {settings.subscribedPortIds.length} suscritos
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
              {PORTS_DATABASE.map((port) => {
                const isSubscribed = settings.subscribedPortIds.includes(port.id);
                const isFav = favorites.includes(port.id);

                return (
                  <div
                    key={port.id}
                    className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-lg hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                      <div>
                        <div className="font-bold text-white text-xs">{port.name}</div>
                        <div className="text-[10px] text-slate-400">{port.region}, {port.country}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => togglePortSubscription(port.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                        isSubscribed
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {isSubscribed ? <BellRing className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                      <span>{isSubscribed ? 'Activo' : 'Desactivado'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Scheduled Alerts Timeline */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="font-bold text-white uppercase text-[11px] font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Programación de Avisos para Hoy
            </label>

            {scheduledAlerts.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center text-slate-400 font-mono text-xs">
                No hay avisos programados para hoy con los filtros actuales o no has suscrito ningún puerto.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                {scheduledAlerts.map((alertItem) => (
                  <div
                    key={alertItem.id}
                    className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{alertItem.tideType === 'pleamar' ? '📈' : '📉'}</span>
                        <span className="capitalize">{alertItem.tideType}</span>
                        <span className="text-slate-400">en {alertItem.portName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Evento: {alertItem.timeStr}h • Altura: {formatHeight(alertItem.heightMeters, units)}
                      </div>
                    </div>

                    <div className="bg-blue-950/80 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-lg text-xs font-bold text-right shrink-0">
                      <div>Aviso a las</div>
                      <div className="text-white text-sm">{alertItem.scheduledAlertTimeStr}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Las notificaciones se ejecutan directamente en tu dispositivo</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            id="done-notifications-btn"
          >
            Guardar Configuración
          </button>
        </div>

      </div>
    </div>
  );
};
