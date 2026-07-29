import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, FileText, Lock, Cookie, Anchor, CheckCircle, Scale, Database, RefreshCw } from 'lucide-react';

export type LegalTab = 'aviso-legal' | 'privacidad' | 'cookies' | 'terminos-nauticos';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'aviso-legal',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [savedConsent, setSavedConsent] = useState<string>('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const raw = localStorage.getItem('mareas_cookie_consent');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSavedConsent(parsed.timestamp ? new Date(parsed.timestamp).toLocaleString('es-ES') : 'Aceptado');
      } catch {
        setSavedConsent('Aceptado');
      }
    } else {
      setSavedConsent('No configurado');
    }
  }, [isOpen]);

  const resetCookieConsent = () => {
    localStorage.removeItem('mareas_cookie_consent');
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Centro Legal y Cumplimiento Normativo
              </h2>
              <p className="text-xs text-slate-400">
                Información legal, protección de datos, cookies y avisos de seguridad náutica
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('aviso-legal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'aviso-legal'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Aviso Legal</span>
          </button>

          <button
            onClick={() => setActiveTab('privacidad')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'privacidad'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Política de Privacidad</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'cookies'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Política de Cookies</span>
          </button>

          <button
            onClick={() => setActiveTab('terminos-nauticos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'terminos-nauticos'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>Descargo Náutico</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed flex-1">
          
          {/* TAB 1: AVISO LEGAL */}
          {activeTab === 'aviso-legal' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    1. DATOS IDENTIFICATIVOS Y TITULARIDAD
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    LSSI-CE Ley 34/2002
                  </span>
                </div>
                <p>
                  En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se facilitan a continuación los datos informativos de la aplicación:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 font-mono text-xs">
                  <li><strong>Denominación del Servicio:</strong> Tabla de Mareas Pro & Telemetría Marina</li>
                  <li><strong>Finalidad:</strong> Consulta de datos hidrométricos, previsiones meteorológicas y actividad solunar náutica.</li>
                  <li><strong>Dominio y Entorno:</strong> Aplicación web estática (Vercel), sin servidor backend propio.</li>
                  <li><strong>Contacto Técnico:</strong> soporte-nautico@mareaspro.app</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  2. Propiedad Intelectual e Industrial
                </h3>
                <p>
                  Todos los derechos de propiedad intelectual del diseño de la plataforma, código fuente, algoritmos de cálculo armónico astronómico, interfaz gráfica e iconografía náutica corresponden en exclusiva al equipo de desarrollo.
                </p>
                <p>
                  Queda prohibida la reproducción total o parcial de los algoritmos de predicción o la automatización de scraping sobre las APIs de consulta sin autorización previa.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  3. Fuentes de Datos Abiertas y Licencias MetOD
                </h3>
                <p>
                  Los datos meteorológicos, de viento y oleaje son obtenidos en tiempo real a través de las APIs abiertas de <strong>Open-Meteo Weather & Marine API</strong> bajo licencia <strong className="text-cyan-400">CC BY 4.0</strong>. Las tablas de mareas se calculan con un modelo astronómico propio de componentes armónicos (M2, S2, N2), calibrado y verificado progresivamente puerto a puerto contra los horarios publicados por el <strong>Instituto Hidrográfico de la Marina (IHM)</strong>, autoridad oficial española en predicción de mareas. Es un modelo de aproximación, no una redistribución directa de datos oficiales: para navegación o cualquier uso donde la precisión sea crítica, verifica siempre los horarios en la <a href="https://armada.defensa.gob.es/ihm" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">web oficial del IHM</a>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: POLITICA DE PRIVACIDAD */}
          {activeTab === 'privacidad' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    TRATAMIENTO DE DATOS (RGPD & LOPDGDD)
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-800">
                    PRIVACIDAD POR DISEÑO
                  </span>
                </div>
                <p>
                  Garantizamos la máxima protección de la privacidad de nuestros usuarios. Esta aplicación <strong>no requiere registro previo ni solicita datos personales identificativos</strong> (como nombres, correos o números de teléfono) para las funciones básicas de consulta.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  1. Uso de la Geolocalización del Dispositivo
                </h3>
                <p>
                  Al pulsar el botón de <strong className="text-cyan-300">"Puerto más cercano por GPS"</strong>, el navegador solicitará su permiso explícito para acceder a las coordenadas de latitud y longitud.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Procesamiento Local:</strong> Las coordenadas se procesan única y exclusivamente en el navegador del usuario para calcular la distancia haversine hacia los 12 puertos registrados.</li>
                  <li><strong>No Almacenamiento:</strong> Las coordenadas GPS en tiempo real no se guardan en ningún servidor externo ni se asocian a un perfil de usuario.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  2. Consulta de Datos Meteorológicos en Tiempo Real
                </h3>
                <p>
                  Para mostrar viento, oleaje y temperatura en vivo, su navegador realiza una petición directa y gratuita a <strong className="text-cyan-300">Open-Meteo</strong> (servicio meteorológico abierto, sin necesidad de cuenta ni clave de API). Esta aplicación no dispone de servidor propio: su dispositivo se conecta directamente a Open-Meteo, igual que lo haría al cargar cualquier imagen de una web.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Datos enviados:</strong> únicamente las coordenadas del puerto que ha seleccionado (no su ubicación personal, salvo que use el botón de GPS descrito arriba, y en tal caso solo se usan para elegir el puerto más cercano).</li>
                  <li><strong>Sin identificación:</strong> no se envían cookies, nombres, correos ni ningún identificador de usuario en estas peticiones.</li>
                  <li><strong>Sin intermediarios propios:</strong> no registramos, guardamos ni procesamos estas peticiones en ningún servidor nuestro; simplemente no existe tal servidor.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  3. Almacenamiento Local (Local Storage)
                </h3>
                <p>
                  Para mejorar la experiencia de usuario, almacenamos en el navegador (Local Storage):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <strong className="text-cyan-400 block mb-1 font-mono text-xs">Ajustes Náuticos</strong>
                    <span className="text-slate-400 text-xs">Unidades de medida (metros/pies, nudos/km/h) y selección de puerto favorito.</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <strong className="text-cyan-400 block mb-1 font-mono text-xs">Avisos y Alarmas</strong>
                    <span className="text-slate-400 text-xs">Configuración de notificaciones push locales y horas de antelación fijadas.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  4. Derechos del Usuario (ARCO / RGPD)
                </h3>
                <p>
                  Dado que no almacenamos datos personales en servidores centralizados —porque no existe tal servidor—, puede eliminar todos sus datos y ajustes en cualquier momento limpiando el almacenamiento local o la caché del navegador.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: POLITICA DE COOKIES */}
          {activeTab === 'cookies' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    POLÍTICA DETALLADA DE COOKIES
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    DIRECTIVA 2002/58/CE
                  </span>
                </div>
                <p>
                  Una cookie es un pequeño archivo de texto que se almacena en su navegador cuando visita una página web. Su objetivo es recordar su visita para cuando vuelva a navegar por la página.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Clasificación de Cookies Utilizadas</h3>
                
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-emerald-400 font-mono text-xs uppercase">1. Cookies Técnicas y Esenciales (Obligatorias)</strong>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-800">TÉCNICA</span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      Permiten la carga del mapa interactivo de puertos, estado de mareas y la representación gráfica en tiempo real. No se pueden desactivar ya que la aplicación dejaría de funcionar.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-cyan-400 font-mono text-xs uppercase">2. LocalStorage de Preferencias</strong>
                      <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-mono border border-cyan-800">PERSISTENCIA LOCAL</span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      Guarda el estado de la pestaña seleccionada, la tabla de puertos favoritos y los parámetros meteorológicos.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-amber-400 font-mono text-xs uppercase">3. Ausencia de Cookies Publicitarias o Afiliados</strong>
                      <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded font-mono border border-amber-800">SIN PUBLICIDAD</span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      Esta aplicación <strong>no contiene cookies de redes publicitarias de terceros, trazadores comportamentales ni programas de afiliados de ventas</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status and Reset */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-slate-400">Estado de consentimiento actual: </span>
                  <strong className="text-cyan-400 font-mono">{savedConsent}</strong>
                </div>

                <button
                  onClick={resetCookieConsent}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reconfigurar Aviso de Cookies</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DESCARGO NAUTICO */}
          {activeTab === 'terminos-nauticos' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-amber-950/40 p-4 rounded-xl border border-amber-800/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>AVISO IMPORTANTE DE SEGURIDAD EN LA NAVEGACIÓN Y CALADO</span>
                </div>
                <p className="text-amber-200 text-xs leading-relaxed">
                  Las predicciones de mareas, corrientes, meteorología y actividad solunar facilitadas en esta plataforma tienen un carácter exclusivamente informativo, deportivo, recreativo y de pesca de costa.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">1. Exención de Responsabilidad Náutica</h3>
                <p>
                  En ningún caso los datos mostrados deben sustituir las publicaciones oficiales obligatorias de seguridad marítima:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Cartas Náuticas Oficiales:</strong> Emitidas por el Instituto Hidrográfico de la Marina (IHM) o autoridades hidrográficas internacionales homologadas.</li>
                  <li><strong>Avisos a los Navegantes (Avisos Ferrocarril / Salvamento Marítimo):</strong> Para derrota, maniobras de atracada, cálculo de resguardo bajo la quilla o entrada a barras de ríos.</li>
                  <li><strong>Boletines MetOff / AEMET Marítimo:</strong> Avisos de temporal costero, galernas o rachas huracanadas emitidos por los canales VHF de Salvamento Marítimo (Canal 16/67).</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">2. Variaciones Hidrográficas Locales</h3>
                <p>
                  El nivel real del agua en la costa puede diferir de las predicciones astronómicas debido a factores meteorológicos impredecibles:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <strong className="text-amber-400 block mb-1 font-mono text-xs">Presión Atmosférica (Efecto Barométrico)</strong>
                    <span className="text-slate-400 text-xs">Una borrasca profunda (baja presión) eleva el nivel del mar hasta 10 cm por cada 10 hPa de caída.</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <strong className="text-amber-400 block mb-1 font-mono text-xs">Viento de Costa (Soplado)</strong>
                    <span className="text-slate-400 text-xs">Vientos sostenidos de mar a tierra retienen agua en la bahía aumentando la altura de la pleamar.</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 text-center font-mono">
                El patrón o capitán del buque/embarcación es el único responsable final de la seguridad de la navegación y de las decisiones tomadas a bordo.
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Documentación revisada y actualizada conforme a la LSSI-CE & RGPD</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-lg shadow-blue-950/50"
          >
            Entendido y Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
