// ============================================
// CONFIGURACIÓN — edita estos valores
// ============================================
const CONFIG = {
  SHEET_ID: '1Riz_9M7BZzKc-S78xLrVG98uMzSIhn95Dvrjq85W_A8',
  API_KEY: 'AIzaSyCg6qC834cKz7YrG0ZuAIeCPzTwDdNWcn8', // <-- pega aquí tu API key cuando la tengas
  SHEETS: {
    PLANTILLAS: 'Plantillas',
    SESIONES: 'Sesiones',
    EJERCICIOS: 'Ejercicios_Realizados'
  },
  BANDAS: [
    { nombre: 'Amarilla', color: '#FFD700', rango: '2-7 kg' },
    { nombre: 'Roja',     color: '#FF3B30', rango: '7-16 kg' },
    { nombre: 'Negra',    color: '#555555', rango: '14-27 kg' },
    { nombre: 'Morada',   color: '#9B59B6', rango: '18-36 kg' },
    { nombre: 'Verde',    color: '#27AE60', rango: '23-57 kg' }
  ],
  ANCLAJES: ['Bajo', 'Medio', 'Alto'],
  RPE_DESC: ['','Muy fácil','Fácil','Moderado','Cómodo','Moderado-duro','Duro','Duro, aguanto','Muy duro','Casi al límite','Al fallo'],
};
