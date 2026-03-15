# Momentum Training PWA

App de entrenamiento personal — Estándar y Kettlebell.

## Archivos

```
momentum/
├── index.html       ← Página principal
├── style.css        ← Estilos
├── config.js        ← ⚙️ CONFIGURACIÓN (edita aquí)
├── sheets.js        ← Conexión Google Sheets
├── app.js           ← Lógica completa
├── manifest.json    ← PWA manifest
└── README.md
```

## Configuración

Edita `config.js` y rellena tu API Key:

```js
API_KEY: 'TU_API_KEY_AQUI',
```

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
