// ============================================
// MOMENTUM TRAINING — sheets.js
// Lectura via API Key, escritura via Apps Script
// ============================================

const Sheets = {
  _cache: {},

  // ---- LECTURA ----
  async get(range) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${encodeURIComponent(range)}?key=${CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sheets GET error ${res.status}`);
    const data = await res.json();
    return data.values || [];
  },

  rowsToObjects(rows) {
    if (!rows.length) return [];
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i] !== undefined ? row[i] : '');
      return obj;
    });
  },

  async getCached(key, range) {
    if (!this._cache[key]) {
      const rows = await this.get(range);
      this._cache[key] = this.rowsToObjects(rows);
    }
    return this._cache[key];
  },

  clearCache() { this._cache = {}; },

  // ---- ESCRITURA via Apps Script ----
  async append(hoja, valores) {
    const url = CONFIG.APPS_SCRIPT_URL;
    if (!url || url === 'TU_APPS_SCRIPT_URL') {
      console.warn('Apps Script URL no configurada — guardado solo local');
      return { ok: false, local: true };
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ hoja, valores }),
      });
      return await res.json();
    } catch (err) {
      console.warn('Error escribiendo en Sheets:', err);
      return { ok: false, error: err.message };
    }
  },

  // ---- HELPERS ----
  async getPlantillas() {
    return this.getCached('plantillas', `${CONFIG.SHEETS.PLANTILLAS}!A:K`);
  },

  async getSesiones() {
    const rows = await this.get(`${CONFIG.SHEETS.SESIONES}!A:I`);
    return this.rowsToObjects(rows);
  },

  async getEjerciciosRealizados() {
    const rows = await this.get(`${CONFIG.SHEETS.EJERCICIOS}!A:T`);
    return this.rowsToObjects(rows);
  },

  // Última vez que se hizo un ejercicio
  getUltimaVez(ejerciciosAll, nombreEjercicio) {
    const matches = ejerciciosAll
      .filter(e => e.Ejercicio === nombreEjercicio && e.Reps)
      .sort((a, b) => b.EjercicioID.localeCompare(a.EjercicioID));
    return matches[0] || null;
  },
};
