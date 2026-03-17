// ============================================
// MOMENTUM TRAINING — storage.js
// Persistencia local para no perder el progreso
// ============================================

const Storage = {
  KEYS: {
    SESSION:  'momentum_session_active',
    PROGRESS: 'momentum_progress',
    NOTES:    'momentum_notes',
    SERIES:   'momentum_series',
  },

  save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
  },

  load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  },

  remove(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  },

  // Guardar sesión activa
  saveSession(sesion) {
    this.save(this.KEYS.SESSION, sesion);
  },
  loadSession() {
    return this.load(this.KEYS.SESSION);
  },
  clearSession() {
    this.remove(this.KEYS.SESSION);
    this.remove(this.KEYS.PROGRESS);
    this.remove(this.KEYS.NOTES);
    this.remove(this.KEYS.SERIES);
  },

  // Guardar progreso de series
  saveProgress(exKey, serieIdx, data) {
    const all = this.load(this.KEYS.SERIES) || {};
    if (!all[exKey]) all[exKey] = {};
    all[exKey][serieIdx] = data;
    this.save(this.KEYS.SERIES, all);
  },
  loadProgress() {
    return this.load(this.KEYS.SERIES) || {};
  },

  // Notas
  saveNotes(text) {
    this.save(this.KEYS.NOTES, text);
  },
  loadNotes() {
    return this.load(this.KEYS.NOTES) || '';
  },
};
