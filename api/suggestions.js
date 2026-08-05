// /api/suggestions.js - API Endpoint for Feedback & Suggestions

let suggestionsStore = [];

export default async function handler(req, res) {
  // CORS & JSON Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      
      const { text, email } = body || {};
      if (!text || !text.trim()) {
        return res.status(400).json({ ok: false, error: 'El mensaje no puede estar vacío.' });
      }

      const newSuggestion = {
        id: 'sug_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        text: text.trim(),
        email: email ? email.trim() : 'No proporcionado',
        date: new Date().toISOString(),
        read: false
      };

      suggestionsStore.unshift(newSuggestion);

      return res.status(200).json({ ok: true, message: 'Sugerencia guardada correctamente.', suggestion: newSuggestion });
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'Error procesando la sugerencia.' });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, suggestions: suggestionsStore });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (id) {
      suggestionsStore = suggestionsStore.filter(s => s.id !== id);
    } else {
      suggestionsStore = [];
    }
    return res.status(200).json({ ok: true, suggestions: suggestionsStore });
  }

  return res.status(405).json({ ok: false, error: 'Método no permitido' });
}
