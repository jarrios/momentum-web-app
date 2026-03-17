// ============================================
// MOMENTUM TRAINING — config.js
// ============================================

const CONFIG = {
  // Google Sheets
  SHEET_ID: '1Riz_9M7BZzKc-S78xLrVG98uMzSIhn95Dvrjq85W_A8',
  API_KEY: 'AIzaSyCg6qC834cKz7YrG0ZuAIeCPzTwDdNWcn8',           // <-- pega tu API Key aquí
  APPS_SCRIPT_URL: 'TU_APPS_SCRIPT_URL', // <-- pega la URL de Apps Script aquí

  SHEETS: {
    PLANTILLAS: 'Plantillas',
    SESIONES: 'Sesiones',
    EJERCICIOS: 'Ejercicios_Realizados',
  },

  // Bandas
  BANDAS: [
    { id: 'am', nombre: 'Amarilla', color: '#FFD700', min: 2,  max: 7  },
    { id: 'ro', nombre: 'Roja',     color: '#FF3B30', min: 7,  max: 16 },
    { id: 'ne', nombre: 'Negra',    color: '#555555', min: 14, max: 27 },
    { id: 'mo', nombre: 'Morada',   color: '#9B59B6', min: 18, max: 36 },
    { id: 've', nombre: 'Verde',    color: '#27AE60', min: 23, max: 57 },
  ],

  ANCLAJES: ['Bajo', 'Medio', 'Alto'],

  RPE_DESC: [
    '', 'Muy fácil', 'Fácil', 'Moderado', 'Cómodo',
    'Moderado-duro', 'Duro', 'Duro, aguanto',
    'Muy duro', 'Casi al límite', 'Al fallo'
  ],

  // Tipos de ejercicio
  TIPOS: {
    CALENTAMIENTO: 'Calentamiento',
    SERIE:         'Serie',
    SUPERSET:      'Superset',
    CIRCUITO:      'Circuito',
  },

  // Equipamiento
  EQUIPO: {
    CORPORAL:    'Corporal',
    BANDA:       'Banda',
    KETTLEBELL:  'Kettlebell',
  },
};
