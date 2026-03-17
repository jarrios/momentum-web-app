# Momentum Training PWA

App de entrenamiento personal — Estándar y Kettlebell.

## Archivos

```
momentum/
├── index.html       ← Página principal
├── style.css        ← Estilos
├── config.js        ← ⚙️ CONFIGURACIÓN (edita aquí)
├── storage.js       ← Persistencia Local
├── sheets.js        ← Conexión Google Sheets
├── app.js           ← Lógica completa
├── sw.js            ← Service Worker (offline)
├── manifest.json    ← PWA manifest
├── icon-192.png     ← Iconos
├── icon-512.png           
└── README.md
```

## Configuración

Edita `config.js` y rellena tu API Key:

```js
SHEET_ID: '1Riz_9M7BZzKc-S78xLrVG98uMzSIhn95Dvrjq85W_A8',
API_KEY: 'TU_API_KEY_AQUI', // Google CloudAPI Key
APPS_SCRIPT_URL: 'TU_APPS_SCRIPT_URL', // URL de Apps Script
```
##Apps Script (para grabar en Sheets)
1. Abre tu Google Sheet
2. Extensiones → Apps Script
3. Pega este código:
function doPost(e) {
   try {
const data = JSON.parse(e.postData.contents);
const ss = SpreadsheetApp.openById('1Riz_9M7BZzKcS78xLrVG98uMzSIhn95Dvrjq85W_A8');
const sheet = ss.getSheetByName(data.hoja);
sheet.appendRow(data.valores);
return ContentService
.createTextOutput(JSON.stringify({ok:true}))
.setMimeType(ContentService.MimeType.JSON);
} catch(err) {
return ContentService
.createTextOutput(JSON.stringify({ok:false,error:err.message}))
.setMimeType(ContentService.MimeType.JSON);
} }
4. Implementar → Nueva implementación → Aplicación web
5. Ejecutar como: Yo · Acceso: Cualquier persona
6. Copia la URL y pégala en config.js
7. Copia la URL y pégala en config.js
   
## Publicar en GitHub Pages

1. Crea un repositorio en GitHub llamado `momentum-training`
2. Sube todos los archivos de esta carpeta
3. Ve a Settings → Pages → Branch: main → Save
4. Tu app estará en: `https://TUUSUARIO.github.io/momentum-training`

## Google Sheets necesario

El Sheet debe tener 3 pestañas:
- `Plantillas` — con los ejercicios del programa
- `Sesiones` — se rellena automáticamente
- `Ejercicios_Realizados` — se rellena automáticamente

Sheet ID configurado: `1Riz_9M7BZzKc-S78xLrVG98uMzSIhn95Dvrjq85W_A8`

## Instalar en móvil

**iPhone:** Abrir en Safari → Compartir → Añadir a pantalla de inicio  
**Android:** Abrir en Chrome → Menú → Instalar app
