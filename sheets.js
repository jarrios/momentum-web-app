// ============================================
// GOOGLE SHEETS — lectura y escritura
// ============================================

const Sheets = {
  baseUrl: () => `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}`,

  async get(range) {
    const url = `${Sheets.baseUrl()}/values/${encodeURIComponent(range)}?key=${CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sheets GET error: ${res.status}`);
    const data = await res.json();
    return data.values || [];
  },

  async append(sheetName, values) {
    const url = `${Sheets.baseUrl()}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED&key=${CONFIG.API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values] })
    });
    if (!res.ok) throw new Error(`Sheets APPEND error: ${res.status}`);
    return res.json();
  },

  async update(range, values) {
    const url = `${Sheets.baseUrl()}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED&key=${CONFIG.API_KEY}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    });
    if (!res.ok) throw new Error(`Sheets UPDATE error: ${res.status}`);
    return res.json();
  },

  rowsToObjects(rows) {
    if (!rows.length) return [];
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i] || '');
      return obj;
    });
  },

  // Cache local para no re-leer plantillas cada vez
  _cache: {},
  async getCached(key, range) {
    if (!Sheets._cache[key]) {
      const rows = await Sheets.get(range);
      Sheets._cache[key] = Sheets.rowsToObjects(rows);
    }
    return Sheets._cache[key];
  },
  clearCache() { Sheets._cache = {}; },

  // Helpers específicos
  async getPlantillas() {
    return Sheets.getCached('plantillas', `${CONFIG.SHEETS.PLANTILLAS}!A:K`);
  },
  async getSesiones() {
    const rows = await Sheets.get(`${CONFIG.SHEETS.SESIONES}!A:I`);
    return Sheets.rowsToObjects(rows);
  },
  async getEjercicios(sesionID) {
    const rows = await Sheets.get(`${CONFIG.SHEETS.EJERCICIOS}!A:S`);
    const all = Sheets.rowsToObjects(rows);
    return sesionID ? all.filter(e => e.SesionID === sesionID) : all;
  },
  async getLastEjercicio(nombreEjercicio) {
    const all = await Sheets.get(`${CONFIG.SHEETS.EJERCICIOS}!A:S`);
    const objs = Sheets.rowsToObjects(all);
    const matches = objs.filter(e => e.Ejercicio === nombreEjercicio && e.Reps);
    if (!matches.length) return null;
    // Ordenar por EjercicioID desc (son timestamps) y coger el último
    matches.sort((a,b) => b.EjercicioID.localeCompare(a.EjercicioID));
    return matches[0];
  }
};
