import React, { useState } from 'react';
import { Waves, ShieldAlert, BookOpen, Scale, FileText, Lock, Cookie, Anchor, MessageSquarePlus, Send, X, CheckCircle, ShieldCheck, Trash2, Mail, Calendar, RefreshCw, Key } from 'lucide-react';
import { PORTS_DATABASE } from '../data/portsData';
import { Port } from '../types';
import { LegalTab } from './LegalModal';
import { buildPortPath } from '../utils/router';

interface FooterProps {
  onSelectPort: (port: Port) => void;
  onOpenLegal: (tab: LegalTab) => void;
}

interface SuggestionItem {
  id: string;
  text: string;
  email?: string;
  date: string;
}

export const Footer: React.FC<FooterProps> = ({ onSelectPort, onOpenLegal }) => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Admin Panel State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [isPinAuthenticated, setIsPinAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');
  const [suggestionsList, setSuggestionsList] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || isSending) return;

    setIsSending(true);

    const payload = {
      text: feedbackText.trim(),
      email: contactEmail.trim(),
      date: new Date().toISOString()
    };

    // 1. Try server API
    try {
      await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('API submission fallback to localStorage:', err);
    }

    // 2. Also save to localStorage fallback
    try {
      const existing = JSON.parse(localStorage.getItem('user_suggestions') || '[]');
      existing.unshift({
        id: 'sug_' + Date.now(),
        ...payload
      });
      localStorage.setItem('user_suggestions', JSON.stringify(existing));
    } catch (err) {
      console.error(err);
    }

    setIsSending(false);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsFeedbackOpen(false);
      setFeedbackText('');
      setContactEmail('');
    }, 2200);
  };

  const loadAdminSuggestions = async () => {
    setIsLoadingSuggestions(true);
    let items: SuggestionItem[] = [];

    // Fetch from API
    try {
      const res = await fetch('/api/suggestions');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.suggestions)) {
          items = data.suggestions;
        }
      }
    } catch (err) {
      console.warn('API GET failed, using local storage:', err);
    }

    // Fallback merge from localStorage
    try {
      const local = JSON.parse(localStorage.getItem('user_suggestions') || '[]');
      if (Array.isArray(local) && local.length > 0) {
        const existingIds = new Set(items.map(i => i.id || i.text + i.date));
        local.forEach((loc: any) => {
          const identifier = loc.id || loc.text + loc.date;
          if (!existingIds.has(identifier)) {
            items.push(loc);
          }
        });
      }
    } catch (err) {
      console.error(err);
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setSuggestionsList(items);
    setIsLoadingSuggestions(false);
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput.trim() === '1234') {
      setIsPinAuthenticated(true);
      setPinError('');
      loadAdminSuggestions();
    } else {
      setPinError('PIN incorrecto. Por favor, verifica el código de acceso.');
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    try {
      await fetch(`/api/suggestions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }

    try {
      const local = JSON.parse(localStorage.getItem('user_suggestions') || '[]');
      const filtered = local.filter((item: any) => item.id !== id && (item.text + item.date) !== id);
      localStorage.setItem('user_suggestions', JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }

    setSuggestionsList(prev => prev.filter(item => item.id !== id));
  };
  return (
    <footer className="bg-slate-950 border-t-2 border-slate-800 text-slate-400 text-xs py-10 px-4 mt-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Terminology Guide */}
        <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-blue-600 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Glosario Náutico: Conceptos Clave de Mareas y Pesca</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
            <div>
              <strong className="text-blue-300 block mb-1 uppercase font-mono text-[11px]">Pleamar y Bajamar</strong>
              <p className="text-slate-400">
                <strong>Pleamar</strong> es el nivel máximo que alcanza el mar en el ciclo de marea. <strong>Bajamar</strong> es el nivel mínimo. Se suceden aproximadamente cada 6 horas y 12 minutos.
              </p>
            </div>

            <div>
              <strong className="text-blue-300 block mb-1 uppercase font-mono text-[11px]">Coeficiente de Mareas</strong>
              <p className="text-slate-400">
                Índice entre 30 y 120. Un coeficiente alto (&gt;80) indica <em>Mareas Vivas</em> con mayor diferencia de nivel y corrientes más intensas.
              </p>
            </div>

            <div>
              <strong className="text-blue-300 block mb-1 uppercase font-mono text-[11px]">Tabla Solunar y Períodos</strong>
              <p className="text-slate-400">
                Los <em>Períodos Mayores</em> (~2h) y <em>Menores</em> (~1h) indican los momentos de máxima atracción gravitacional lunar, estimulando la actividad de picadas.
              </p>
            </div>
          </div>
        </div>

        {/* Directory of Ports - real, crawlable links to every port page */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Anchor className="w-4 h-4 text-blue-400" />
            <span>Tabla de Mareas por Puerto ({PORTS_DATABASE.length})</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {PORTS_DATABASE.slice(0, 12).map(p => (
              <a
                key={p.id}
                href={buildPortPath(p)}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectPort(p);
                }}
                className="text-left text-slate-400 hover:text-blue-300 transition-colors py-1 truncate cursor-pointer font-mono text-[11px]"
              >
                • Mareas {p.name.split(' (')[0]}
              </a>
            ))}
          </div>

          {PORTS_DATABASE.length > 12 && (
            <details className="group">
              <summary className="cursor-pointer select-none text-cyan-400 hover:text-cyan-300 font-mono text-[11px] font-bold list-none inline-flex items-center gap-1">
                <span className="group-open:hidden">Ver los {PORTS_DATABASE.length} puertos disponibles ➔</span>
                <span className="hidden group-open:inline">Ocultar puertos ➔</span>
              </summary>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3">
                {PORTS_DATABASE.slice(12).map(p => (
                  <a
                    key={p.id}
                    href={buildPortPath(p)}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectPort(p);
                    }}
                    className="text-left text-slate-400 hover:text-blue-300 transition-colors py-1 truncate cursor-pointer font-mono text-[11px]"
                  >
                    • Mareas {p.name.split(' (')[0]}
                  </a>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* User Feedback & Suggestions */}
        <div className="bg-slate-900/50 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white text-sm">
            <MessageSquarePlus className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold">¿Tienes propuestas de mejora o sugerencias?</div>
              <div className="text-slate-400 font-mono text-[11px] mt-0.5">Déjanos tus comentarios directamente en la web para seguir perfeccionando la aplicación.</div>
            </div>
          </div>
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="px-5 py-2.5 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-600/30 transition-all rounded-lg font-bold flex items-center gap-2 cursor-pointer text-xs shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Sugerencia</span>
          </button>
        </div>

        {/* Legal & Compliance Navigation Row */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span>Cumplimiento Normativo & Privacidad:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              onClick={() => onOpenLegal('aviso-legal')}
              className="text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Aviso Legal</span>
            </button>

            <span className="text-slate-700">•</span>

            <button
              onClick={() => onOpenLegal('privacidad')}
              className="text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Política de Privacidad</span>
            </button>

            <span className="text-slate-700">•</span>

            <button
              onClick={() => onOpenLegal('cookies')}
              className="text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Cookie className="w-3.5 h-3.5 text-slate-400" />
              <span>Política de Cookies</span>
            </button>

            <span className="text-slate-700">•</span>

            <button
              onClick={() => onOpenLegal('terminos-nauticos')}
              className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Anchor className="w-3.5 h-3.5 text-amber-500" />
              <span>Descargo Náutico</span>
            </button>

            <span className="text-slate-700">•</span>

            <button
              onClick={() => {
                setIsAdminOpen(true);
                setAdminPinInput('');
                setPinError('');
                if (isPinAuthenticated) {
                  loadAdminSuggestions();
                }
              }}
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-md"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ver Sugerencias (Admin)</span>
            </button>
          </div>
        </div>

        {/* Technical Station ID Bar & Disclaimer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white uppercase tracking-tight flex items-center gap-2">
                TABLA DE MAREAS PRO <span className="text-[10px] text-slate-400 font-mono">© 2026</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>STATION ID: ESP-CDZ-022</span>
                <span>•</span>
                <span>LAT: 36.52°N</span>
                <span>•</span>
                <span>LONG: 6.28°W</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-400 font-bold">CONEXIÓN SATELITAL ACTIVA</span>
            <span className="text-slate-600">|</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Uso recreativo y deportivo.</span>
          </div>
        </div>

      </div>

      {/* Direct Web Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-white font-bold text-base border-b border-slate-800 pb-3">
              <MessageSquarePlus className="w-6 h-6 text-emerald-400" />
              <span>Buzón de Sugerencias y Feedback</span>
            </div>

            {isSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-white font-bold text-base">¡Sugerencia Registrada!</h3>
                <p className="text-slate-400 text-xs">Muchas gracias por tu mensaje. Lo revisaremos para seguir mejorando Tabla de Mareas Pro.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <p className="text-slate-300 text-xs leading-relaxed">
                  ¿Tienes alguna sugerencia de mejora, corrección de datos o nueva función que te gustaría ver en la aplicación?
                </p>

                <div>
                  <label className="block text-slate-400 text-[11px] font-mono uppercase mb-1">Tu mensaje o sugerencia *</label>
                  <textarea
                    required
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Escribe aquí tu propuesta..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-mono uppercase mb-1">Email de contacto (opcional)</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFeedbackOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                  >
                    {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isSending ? 'Enviando...' : 'Enviar Sugerencia'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Admin Suggestions Panel Modal */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setIsAdminOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-white font-bold text-base border-b border-slate-800 pb-3 shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>Panel de Administración — Sugerencias Recibidas</span>
            </div>

            {!isPinAuthenticated ? (
              <form onSubmit={handleAdminAuth} className="space-y-4 py-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-2">
                  <Key className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-slate-300 text-xs font-medium">Introduce el código PIN de Administrador para acceder a las sugerencias enviadas por los usuarios.</p>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-mono uppercase mb-1">PIN de Acceso</label>
                  <input
                    type="password"
                    autoFocus
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-center text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
                  />
                  {pinError && <p className="text-rose-400 text-xs mt-1.5">{pinError}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Acceder</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Buzón activo:</span>
                    <span className="bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">{suggestionsList.length} propuesta{suggestionsList.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onClick={loadAdminSuggestions}
                    className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {isLoadingSuggestions ? (
                    <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Cargando sugerencias...</span>
                    </div>
                  ) : suggestionsList.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/50 border border-slate-800/80 rounded-xl p-6">
                      <MessageSquarePlus className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-slate-400">Aún no se han recibido sugerencias.</p>
                      <p className="text-[11px] mt-1 text-slate-500">Cuando un usuario envíe un formulario en la web, aparecerá en este panel en tiempo real.</p>
                    </div>
                  ) : (
                    suggestionsList.map((item) => (
                      <div key={item.id} className="bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors rounded-xl p-4 space-y-2 relative group">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-900 pb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{new Date(item.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {item.email && item.email !== 'No proporcionado' && (
                            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/30">
                              <Mail className="w-3 h-3" />
                              <span>{item.email}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-white text-xs leading-relaxed whitespace-pre-wrap pt-1 font-sans">
                          {item.text}
                        </p>

                        <div className="pt-2 flex justify-end border-t border-slate-900/60">
                          <button
                            onClick={() => handleDeleteSuggestion(item.id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors text-[11px] flex items-center gap-1 font-mono cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};
