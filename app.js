// ============================================
// MOMENTUM TRAINING — app.js
// ============================================

// ---- ESTADO GLOBAL ----
const State = {
  screen: 'home',
  programa: null,
  semana: null,
  dia: null,
  plantillas: [],
  sesiones: [],
  ejerciciosAll: [],
  sesionActiva: null,
  ejerciciosActivos: [],
  currentExIdx: 0,
  seriesRegistradas: [],
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
};

// ---- UTILS ----
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function pad(n) { return String(n).padStart(2,'0'); }
function nowStr() {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function getTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---- TOAST / SAVED ----
let toastTimer, savedTimer;
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' '+type : '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast', 2500);
}
function showSaved() {
  const b = document.getElementById('saved-badge');
  b.classList.add('show');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => b.classList.remove('show'), 1500);
}

// ---- NAVEGACIÓN ----
function goTo(screenId, push=true) {
  const prev = document.querySelector('.screen.active');
  if (prev) {
    prev.classList.add('slide-back');
    setTimeout(() => { prev.classList.remove('active','slide-back'); }, 280);
  }
  State.screen = screenId;
  renderScreen(screenId);
}

function goBack(screenId) {
  const prev = document.querySelector('.screen.active');
  if (prev) {
    prev.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    prev.style.opacity = '0';
    prev.style.transform = 'translateX(24px)';
    setTimeout(() => { prev.classList.remove('active'); prev.style = ''; }, 220);
  }
  State.screen = screenId;
  renderScreen(screenId);
}

// ---- RENDER ----
function renderScreen(id) {
  const app = document.getElementById('app');
  const div = document.createElement('div');
  div.className = 'screen';
  div.id = 'sc-' + id;

  const screens = {
    home:      renderHome,
    weeks:     renderWeeks,
    days:      renderDays,
    calent:    renderCalent,
    exercise:  renderExercise,
    summary:   renderSummary,
    history:   renderHistory,
  };

  const fn = screens[id];
  if (!fn) { showToast('Pantalla no encontrada', 'error'); return; }
  div.innerHTML = fn();
  app.appendChild(div);
  requestAnimationFrame(() => div.classList.add('active'));
  setTimeout(() => app.querySelectorAll('.screen:not(.active)').forEach(s => s.remove()), 400);

  attachEvents(id, div);
  restoreNotes(div);
  updateClock(div);
}

// ---- HOME ----
function renderHome() {
  const sesiones = State.sesiones;
  const ultimaSesion = sesiones.length ? sesiones[sesiones.length-1] : null;

  // Siguiente sesión
  let nextTag = 'Sin sesiones pendientes';
  let nextName = 'EMPIEZA<br>HOY';
  let nextMeta = 'Elige un programa para comenzar';
  let nextSesionId = null;

  if (State.plantillas.length) {
    const prog = 'Estándar';
    const sesDone = sesiones.filter(s => s.Programa === prog);
    const all = getPlantillasSorted(prog);
    const nextIdx = sesDone.length % all.length;
    const next = all[nextIdx];
    if (next) {
      nextTag = `Siguiente sesión · ${prog}`;
      nextName = `SESIÓN ${next.dia}<br>SEMANA ${next.semana}`;
      const exCount = State.plantillas.filter(p =>
        p.Programa===prog && Number(p.Semana)===next.semana && Number(p.Dia)===next.dia
      ).length;
      const ssCount = [...new Set(State.plantillas.filter(p =>
        p.Programa===prog && Number(p.Semana)===next.semana && Number(p.Dia)===next.dia && p.Tipo==='Superset'
      ).map(p=>p.Grupo_Superset))].length;
      nextMeta = `${exCount} ejercicios${ssCount>0?` · ${ssCount} supersets`:''} · ~45 min`;
      nextSesionId = `${prog}-${next.semana}-${next.dia}`;
    }
  }

  return `
    <div class="status-bar"><span id="clk">${getTime()}</span><span style="letter-spacing:3px">···</span></div>
    <div class="home-hero">
      <div class="home-glow"></div>
      <div class="home-eyebrow">Momentum Training</div>
      <div class="home-title">HOY<br><em>TOCA</em></div>
    </div>
    <div class="scroll">
      <div class="pad">
        <div class="next-card" data-action="start-next" data-sesid="${nextSesionId||''}">
          <div class="next-inner">
            <div class="next-tag">${nextTag}</div>
            <div class="next-name">${nextName}</div>
            <div class="next-meta">${nextMeta}</div>
            <button class="cta-btn" data-action="start-next" data-sesid="${nextSesionId||''}">
              <span>EMPEZAR AHORA</span>
              <div class="play-circle">▶</div>
            </button>
          </div>
        </div>
        <div class="section-label">Programas</div>
        <div class="prog-card std" data-action="open-prog" data-prog="Estándar">
          <div class="prog-glow"></div>
          <div class="prog-badge">● ${getSesionesPrograma('Estándar')} sesiones completadas</div>
          <div class="prog-name">ESTÁNDAR</div>
          <div class="prog-meta">Peso corporal · Bandas elásticas</div>
          <div class="prog-stats">
            <div><div class="ps-val">12</div><div class="ps-lbl">Semanas</div></div>
            <div><div class="ps-val">4</div><div class="ps-lbl">Días/sem</div></div>
            <div><div class="ps-val">${getProgresoPrograma('Estándar')}</div><div class="ps-lbl">Progreso</div></div>
          </div>
        </div>
        <div class="prog-card kb" data-action="open-prog" data-prog="Kettlebell">
          <div class="prog-glow"></div>
          <div class="prog-badge">● Disponible</div>
          <div class="prog-name">KETTLEBELL</div>
          <div class="prog-meta">Kettlebells · Bandas · Corporal</div>
          <div class="prog-stats">
            <div><div class="ps-val">12</div><div class="ps-lbl">Semanas</div></div>
            <div><div class="ps-val">—</div><div class="ps-lbl">Progreso</div></div>
          </div>
        </div>
      </div>
    </div>
    ${renderBottomNav('home')}`;
}

function getSesionesPrograma(prog) {
  return State.sesiones.filter(s=>s.Programa===prog).length;
}

function getProgresoPrograma(prog) {
  const semanas = [...new Set(State.plantillas.filter(p=>p.Programa===prog).map(p=>p.Semana))];
  const semanasHechas = [...new Set(State.sesiones.filter(s=>s.Programa===prog).map(s=>s.Semana))];
  if (!semanas.length) return '—';
  return `S${semanasHechas.length||1}/${semanas.length}`;
}

function getPlantillasSorted(prog) {
  const dias = [];
  const semanas = [...new Set(State.plantillas.filter(p=>p.Programa===prog).map(p=>Number(p.Semana)))].sort((a,b)=>a-b);
  semanas.forEach(s => {
    const d = [...new Set(State.plantillas.filter(p=>p.Programa===prog&&Number(p.Semana)===s).map(p=>Number(p.Dia)))].sort((a,b)=>a-b);
    d.forEach(dia => dias.push({semana:s, dia}));
  });
  return dias;
}

// ---- WEEKS ----
function renderWeeks() {
  const prog = State.programa;
  const semanas = [...new Set(State.plantillas.filter(p=>p.Programa===prog).map(p=>Number(p.Semana)))].sort((a,b)=>a-b);
  const sesDone = State.sesiones.filter(s=>s.Programa===prog).map(s=>Number(s.Semana));
  const currentSem = sesDone.length ? Math.max(...sesDone) : 1;
  const pct = Math.round((currentSem/semanas.length)*100);

  const weeksHtml = semanas.map(s => {
    const isDone = s < currentSem;
    const isCurr = s === currentSem;
    const sesCount = State.sesiones.filter(x=>x.Programa===prog&&Number(x.Semana)===s).length;
    return `
      <div class="week-item ${isDone?'done':''} ${isCurr?'current':''}" data-action="open-week" data-semana="${s}">
        <div class="week-num">${s}</div>
        <div class="week-info">
          <div class="week-title">Semana ${s}</div>
          <div class="week-meta">4 sesiones${isDone?` · ${sesCount} completadas`:isCurr?' · En curso':' · Pendiente'}</div>
        </div>
        ${isCurr ? '<div class="week-badge">ACTUAL</div>' : isDone ? '<span>✅</span>' : '<span style="color:var(--t3)">🔒</span>'}
      </div>`;
  }).join('');

  return `
    <div class="status-bar"><span>${getTime()}</span><span style="letter-spacing:3px">···</span></div>
    <div class="topbar">
      <div class="back-btn" data-action="back-home">←</div>
      <div class="topbar-title">${prog.toUpperCase()}</div>
      <div class="topbar-sub">${semanas.length} semanas</div>
    </div>
    <div class="scroll">
      <div class="pad">
        <div class="progress-wrap">
          <div class="progress-labels">
            <span>Progreso</span>
            <strong>Semana ${currentSem} de ${semanas.length}</strong>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        ${weeksHtml}
      </div>
    </div>
    ${renderBottomNav('weeks')}`;
}

// ---- DAYS ----
function renderDays() {
  const prog = State.programa;
  const sem = State.semana;
  const dias = [...new Set(State.plantillas.filter(p=>p.Programa===prog&&Number(p.Semana)===sem).map(p=>Number(p.Dia)))].sort((a,b)=>a-b);
  const diasHechos = State.sesiones.filter(s=>s.Programa===prog&&Number(s.Semana)===sem).map(s=>Number(s.Dia));
  const nextDia = dias.find(d=>!diasHechos.includes(d));

  const daysHtml = dias.map(d => {
    const isDone = diasHechos.includes(d);
    const isNext = d === nextDia && !isDone;
    const exs = State.plantillas.filter(p=>p.Programa===prog&&Number(p.Semana)===sem&&Number(p.Dia)===d);
    const exNoCal = exs.filter(e=>e.Tipo!=='Calentamiento');
    const ssGroups = [...new Set(exs.filter(e=>e.Tipo==='Superset').map(e=>e.Grupo_Superset))];
    const cirGroups = [...new Set(exs.filter(e=>e.Tipo==='Circuito').map(e=>e.Grupo_Superset))];
    const hasBanda = exs.some(e=>e.Equipo==='Banda');
    const hasKB = exs.some(e=>e.Equipo==='Kettlebell');
    const bandaColors = hasBanda ? getBandaColorsForDay(exs) : '';

    return `
      <div class="day-card ${isDone?'completed':''} ${isNext?'next-up':''}" data-action="${isDone?'':'open-day'}" data-dia="${d}">
        ${isNext ? '<div class="day-next-badge">SIGUIENTE</div>' : ''}
        <div class="day-num">Sesión ${d}</div>
        <div class="day-name">${prog.toUpperCase()} S${sem}D${d}</div>
        <div class="day-chips">
          ${isDone ? '<div class="day-chip">✅ Completada</div>' : ''}
          <div class="day-chip">${exNoCal.length} ejercicios</div>
          ${ssGroups.length>0 ? `<div class="day-chip ss">${ssGroups.length}× Superset</div>` : ''}
          ${cirGroups.length>0 ? `<div class="day-chip cir">${cirGroups.length}× Circuito</div>` : ''}
          <div class="day-chip">🏃 Corporal</div>
          ${hasBanda ? `<div class="day-chip mat">${bandaColors} Bandas</div>` : ''}
          ${hasKB ? `<div class="day-chip mat">🏋️ Kettlebell</div>` : ''}
        </div>
        <div class="day-footer">
          <div class="day-count">${isDone ? 'Completada' : `~45 min`}</div>
          ${!isDone ? '<div style="font-size:16px;color:var(--t3)">→</div>' : ''}
        </div>
      </div>`;
  }).join('');

  return `
    <div class="status-bar"><span>${getTime()}</span><span style="letter-spacing:3px">···</span></div>
    <div class="topbar">
      <div class="back-btn" data-action="back-weeks">←</div>
      <div class="topbar-title">SEMANA ${sem}</div>
      <div class="topbar-sub">${prog}</div>
    </div>
    <div class="scroll"><div class="pad">${daysHtml}</div></div>
    ${renderBottomNav('days')}`;
}

function getBandaColorsForDay(exs) {
  const bandaIds = new Set();
  exs.forEach(e => {
    // Colores de bandas usadas anteriormente en este ejercicio
    const last = Sheets.getUltimaVez(State.ejerciciosAll, e.Ejercicio);
    if (last && last.Color_Banda) {
      last.Color_Banda.split(',').forEach(c => {
        const b = CONFIG.BANDAS.find(x=>x.nombre.trim()===c.trim());
        if (b) bandaIds.add(b.color);
      });
    }
  });
  return [...bandaIds].map(c=>`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:2px"></span>`).join('');
}

// ---- CALENTAMIENTO ----
function renderCalent() {
  const prog = State.programa, sem = State.semana, dia = State.dia;
  const exs = getEjerciciosDia();
  const idx = 0;
  const total = exs.length;
  const nextEx = exs[1];

  return `
    <div class="status-bar"><span>${getTime()}</span><span style="letter-spacing:3px">···</span></div>
    <div class="ex-photo">
      <div class="ex-photo-bg" style="background:linear-gradient(135deg,#1a0d2e,#2e1a4a)">🔥</div>
      <div class="ex-photo-overlay"></div>
      <div class="ex-photo-topbar">
        <div class="ex-back-round" data-action="back-days">←</div>
        <div class="ex-type-badge" style="background:rgba(176,102,255,.15);color:var(--purple);border:1px solid rgba(176,102,255,.3)">● Calentamiento</div>
      </div>
      <div class="ex-name-wrap">
        <div class="ex-name-bg"><div class="ex-name-big">CALENTAMIENTO</div></div>
      </div>
    </div>
    <div class="ex-nav">
      <div class="ex-nav-btn dim">← Anterior</div>
      <div class="ex-nav-info">
        <div class="ex-nav-prog">EJERCICIO 1 / ${total}</div>
        <div class="ex-nav-sub">Sesión ${dia} · S${sem}</div>
      </div>
      <div class="ex-nav-btn" data-action="next-ex" data-idx="1">Siguiente →</div>
    </div>
    <div class="scroll">
      <div class="calent-hero">
        <div class="calent-emoji">🔥</div>
        <div class="calent-title">CALENTAMIENTO</div>
        <div class="calent-sub">Movilidad general<br>Prepara el cuerpo para el entrenamiento</div>
        <button class="cta-btn" id="calent-btn" data-action="toggle-calent" style="max-width:300px;margin:0 auto">
          MARCAR COMO COMPLETADO ✓
        </button>
      </div>
      ${renderVideoGuides('calentamiento movilidad', 'warm up routine')}
      ${renderNotes()}
    </div>`;
}

// ---- EXERCISE ----
function renderExercise() {
  const exs = getEjerciciosDia();
  const idx = State.currentExIdx;
  const ex = exs[idx];
  if (!ex) { goTo('summary'); return ''; }

  const tipo = ex.Tipo;
  const total = exs.length;
  const prevIdx = idx - 1;
  const nextIdx = idx + 1;

  // Group exercises (superset/circuito)
  let groupExs = [ex];
  if (tipo === 'Superset' || tipo === 'Circuito') {
    groupExs = exs.filter(e => e.Grupo_Superset === ex.Grupo_Superset && e.Tipo === tipo);
  }

  const isSingle = groupExs.length === 1;
  const isGroup = !isSingle;

  // Type badge
  const badges = {
    Serie:    `background:rgba(77,245,200,.15);color:var(--teal);border:1px solid rgba(77,245,200,.3)`,
    Superset: `background:rgba(255,165,2,.15);color:var(--orange);border:1px solid rgba(255,165,2,.3)`,
    Circuito: `background:rgba(0,180,255,.15);color:var(--blue);border:1px solid rgba(0,180,255,.3)`,
  };
  const badgeStyle = badges[tipo] || badges.Serie;
  const badgeLabel = isGroup ? `${tipo} ${ex.Grupo_Superset}` : `● Serie · ${ex.Equipo||'Corporal'}`;

  // Photo bg gradient by type
  const bgs = {
    Serie:    '#0d1a0d,#1a2e1a',
    Superset: '#1f0f00,#2e1a00',
    Circuito: '#001520,#002030',
  };
  const bgColors = bgs[tipo] || bgs.Serie;

  // Nav label
  const navLabel = isGroup
    ? `${tipo === 'Circuito' ? 'EJERCICIOS' : 'EJERCICIO'} ${idx+1}-${idx+groupExs.length} / ${total}`
    : `EJERCICIO ${idx+1} / ${total}`;
  const navSub = isGroup
    ? `${tipo} ${ex.Grupo_Superset} · ${tipo==='Circuito'?'Sin descanso':'Alternar series'}`
    : `Sesión ${State.dia} · S${State.semana}`;

  // Exercises name for photo
  const displayName = isGroup ? `${tipo.toUpperCase()} ${ex.Grupo_Superset}` : ex.Ejercicio;
  const photoEmoji = getEjercicioEmoji(ex.Ejercicio);

  // Num series
  const numSeries = Number(ex.Series_Obj) || 3;

  // Build table
  const tableHtml = isGroup
    ? buildGroupTable(groupExs, numSeries)
    : buildSerieTable(ex, numSeries);

  // SS/Cir indicator
  const groupIndicator = isGroup ? `
    <div class="ss-bar ${tipo === 'Superset' ? 'ss' : 'cir'}">
      <div class="ss-dot"></div>
      <div class="ss-text">${tipo} ${ex.Grupo_Superset}</div>
      <div class="ss-sub">${tipo==='Circuito' ? `${groupExs.length} ejercicios · Sin descanso` : 'Alternar serie a serie'}</div>
    </div>` : '';

  // Next/prev labels
  const isLast = nextIdx >= total;
  const nextLabel = isLast ? 'Finalizar' : 'Siguiente →';
  const nextAction = isLast ? 'finish-session' : 'next-ex';
  const nextDataIdx = isLast ? '' : `data-idx="${getNextGroupIdx(exs, idx, groupExs)}"`;

  // YouTube search term
  const ytQuery1 = encodeURIComponent(ex.Ejercicio + ' ejercicio técnica');
  const ytQuery2 = encodeURIComponent(ex.Ejercicio + ' variaciones');

  return `
    <div class="status-bar"><span>${getTime()}</span><span style="letter-spacing:3px">···</span></div>
    <div class="ex-photo">
      <div class="ex-photo-bg" style="background:linear-gradient(135deg,${bgColors})">${photoEmoji}</div>
      <div class="ex-photo-overlay"></div>
      <div class="ex-photo-topbar">
        <div class="ex-back-round" data-action="${prevIdx < 0 ? 'back-calent' : 'prev-ex'}" data-idx="${prevIdx}">←</div>
        <div class="ex-type-badge" style="${badgeStyle}">● ${badgeLabel}</div>
      </div>
      <div class="ex-name-wrap">
        <div class="ex-name-bg"><div class="ex-name-big">${displayName}</div></div>
      </div>
    </div>
    <div class="ex-nav">
      <div class="ex-nav-btn ${prevIdx<0?'dim':''}" data-action="${prevIdx<0?'':'prev-ex'}" data-idx="${prevIdx}">${prevIdx<0?'← Anterior':'← Anterior'}</div>
      <div class="ex-nav-info">
        <div class="ex-nav-prog">${navLabel}</div>
        <div class="ex-nav-sub">${navSub}</div>
      </div>
      <div class="ex-nav-btn" data-action="${nextAction}" ${nextDataIdx}>${nextLabel}</div>
    </div>
    ${groupIndicator}
    <div class="scroll">
      ${tableHtml}
      <button class="add-serie-btn" data-action="add-serie">+ Agregar Serie</button>
      ${renderVideoGuides(ex.Ejercicio + ' técnica', ex.Ejercicio + ' variaciones')}
      ${renderNotes()}
      ${renderOptionalRPE()}
    </div>`;
}

function getNextGroupIdx(exs, currentIdx, groupExs) {
  // Skip to first ex after this group
  const lastGroupIdx = exs.findIndex((e,i) => i > currentIdx && !groupExs.includes(e));
  return lastGroupIdx >= 0 ? lastGroupIdx : currentIdx + groupExs.length;
}

function getEjercicioEmoji(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes('flexion') || n.includes('flexión') || n.includes('push')) return '💪';
  if (n.includes('sentadilla') || n.includes('squat')) return '🦵';
  if (n.includes('desplante') || n.includes('lunge')) return '🏃';
  if (n.includes('plancha') || n.includes('plank')) return '🧘';
  if (n.includes('remo') || n.includes('row')) return '🚣';
  if (n.includes('dips')) return '⬇️';
  if (n.includes('curl')) return '💪';
  if (n.includes('kettlebell') || n.includes('kb') || n.includes('swing')) return '🏋️';
  if (n.includes('burpee')) return '🔥';
  if (n.includes('step')) return '⬆️';
  return '⚡';
}

// ---- BUILD TABLES ----
function buildSerieTable(ex, numSeries) {
  const equipo = ex.Equipo || 'Corporal';
  const showKg = equipo !== 'Corporal';
  const kgHeader = equipo === 'Banda' ? 'KG' : equipo === 'Kettlebell' ? 'KB' : '';
  const progress = Storage.loadProgress();
  const exKey = `ex-${State.currentExIdx}`;

  const rows = Array.from({length: numSeries}, (_, i) => {
    const saved = progress[exKey]?.[i] || {};
    const isDone = saved.done || false;
    const isAct = !isDone && i === Array.from({length:numSeries},(_,j)=>j).find(j=>!(progress[exKey]?.[j]?.done));
    const last = Sheets.getUltimaVez(State.ejerciciosAll, ex.Ejercicio);

    return { isDone, isAct, i, saved, last, ex, equipo, exKey };
  });

  return `
    <div class="tbl-wrap">
      <div class="tbl-head">
        <div class="th">S</div>
        <div class="th left">ANTERIOR</div>
        <div class="th">${showKg ? kgHeader : ''}</div>
        <div class="th">REPS</div>
        <div class="th">✓</div>
      </div>
      <div class="tbl-body" id="tbl-main">
        ${rows.map(r => buildSerieRow(r)).join('')}
      </div>
    </div>`;
}

function buildSerieRow({isDone, isAct, i, saved, last, ex, equipo, exKey}) {
  const isBanda = equipo === 'Banda';
  const isKB = equipo === 'Kettlebell';
  const reps = saved.reps || (last ? last.Reps : '—');
  const prevText = last ? `${last.Reps}r` : '—';
  const prevSub  = last ? (last.Color_Banda ? last.Color_Banda : equipo) : equipo;
  const savedBandas = saved.bandas || (last && last.Color_Banda ? last.Color_Banda.split(',').map(c=>c.trim()) : []);
  const savedKg = saved.kg || (last && last.Peso_KB ? last.Peso_KB : '');
  const savedAnclaje = saved.anclaje || (last && last.Anclaje_Banda ? last.Anclaje_Banda : 'Bajo');
  const savedElong = saved.elong || (last && last.Elongacion_cm ? last.Elongacion_cm : 80);

  let kgHtml = '';
  if (isBanda) {
    const kg = calcBandaKg(savedBandas);
    kgHtml = kg ? `<div class="er-kg-val">${kg}</div><div class="er-kg-lbl">kg</div>` : `<div class="er-kg-val" style="color:var(--t3)">—</div>`;
  } else if (isKB && savedKg) {
    kgHtml = `<div class="er-kg-val">${savedKg}</div><div class="er-kg-lbl">kg</div>`;
  }

  const grpCls = isDone ? 'done-block' : '';
  const badgeCls = isDone ? 'badge-done' : isAct ? 'badge-active' : 'badge-pending';
  const badgeTxt = isDone ? '✓ Hecho' : isAct ? '● Actual' : 'Pendiente';

  return `
    <div class="serie-block ${grpCls}" id="sb-${exKey}-${i}">
      <div class="serie-block-label">
        <div class="sbl-num">SERIE ${i+1}</div>
        <div class="sbl-badge ${badgeCls}">${badgeTxt}</div>
      </div>
      <div class="ex-row ${isBanda?'banda-row':''}">
        <div></div>
        <div>
          <div class="er-exname">${ex.Ejercicio}</div>
          <div class="er-prev">${prevText} · ${prevSub}</div>
        </div>
        <div class="er-kg" id="kg-${exKey}-${i}">${kgHtml}</div>
        <div class="er-reps">
          <button class="reps-btn" data-action="reps-dec" data-key="${exKey}" data-idx="${i}">−</button>
          <div class="reps-val" id="rv-${exKey}-${i}">${reps}</div>
          <button class="reps-btn" data-action="reps-inc" data-key="${exKey}" data-idx="${i}">+</button>
        </div>
        <div class="er-check ${isDone?'done':''}" id="chk-${exKey}-${i}" data-action="toggle-check" data-key="${exKey}" data-idx="${i}" data-exkey="${exKey}">${isDone?'✓':'○'}</div>
      </div>
      ${isBanda ? buildBandaDetail(exKey, i, savedBandas, savedAnclaje, savedElong) : ''}
    </div>`;
}

function buildGroupTable(groupExs, numSeries) {
  const progress = Storage.loadProgress();

  let rows = '';
  for (let s = 0; s < numSeries; s++) {
    const groupKey = `group-${State.currentExIdx}`;
    const saved = progress[groupKey]?.[s] || {};
    const isDone = saved.done || false;
    const isAct = !isDone && s === Array.from({length:numSeries},(_,j)=>j).find(j=>!(progress[groupKey]?.[j]?.done));
    const badgeCls = isDone ? 'badge-done' : isAct ? 'badge-active' : 'badge-pending';
    const badgeTxt = isDone ? '✓ Hecho' : isAct ? '● Actual' : 'Pendiente';

    rows += `
      <div class="serie-block ${isDone?'done-block':''}" id="sb-${groupKey}-${s}">
        <div class="serie-block-label">
          <div class="sbl-num">SERIE ${s+1}</div>
          <div class="sbl-badge ${badgeCls}">${badgeTxt}</div>
        </div>
        ${groupExs.map((ex, ei) => {
          const isBanda = (ex.Equipo||'Corporal') === 'Banda';
          const isKB = (ex.Equipo||'Corporal') === 'Kettlebell';
          const last = Sheets.getUltimaVez(State.ejerciciosAll, ex.Ejercicio);
          const exSaved = progress[groupKey]?.[s]?.[`ex${ei}`] || {};
          const savedBandas = exSaved.bandas || (last && last.Color_Banda ? last.Color_Banda.split(',').map(c=>c.trim()) : []);
          const savedAnclaje = exSaved.anclaje || 'Bajo';
          const savedElong = exSaved.elong || 80;
          const reps = exSaved.reps || (last ? last.Reps : '—');
          const kgId = `kg-${groupKey}-${s}-${ei}`;
          let kgHtml = '';
          if (isBanda) {
            const kg = calcBandaKg(savedBandas);
            kgHtml = kg ? `<div class="er-kg-val">${kg}</div><div class="er-kg-lbl">kg</div>` : `<div class="er-kg-val" style="color:var(--t3)">—</div>`;
          } else if (isKB && last?.Peso_KB) {
            kgHtml = `<div class="er-kg-val">${last.Peso_KB}</div><div class="er-kg-lbl">kg</div>`;
          }

          const chkHtml = ei === 0
            ? `<div class="er-check ${isDone?'done':''}" id="chk-${groupKey}-${s}" data-action="toggle-group-check" data-key="${groupKey}" data-idx="${s}">${isDone?'✓':'○'}</div>`
            : `<div class="er-check-blank"></div>`;

          return `
            <div class="ex-row ${isBanda?'banda-row':''}">
              <div></div>
              <div>
                <div class="er-exname">${ex.Ejercicio}</div>
                <div class="er-prev">${last?last.Reps+'r':'—'} · ${last&&last.Color_Banda?last.Color_Banda:ex.Equipo||'Corporal'}</div>
              </div>
              <div class="er-kg" id="${kgId}">${kgHtml}</div>
              <div class="er-reps">
                <button class="reps-btn" data-action="reps-dec-g" data-key="${groupKey}" data-serie="${s}" data-ei="${ei}">−</button>
                <div class="reps-val" id="rv-${groupKey}-${s}-${ei}">${reps}</div>
                <button class="reps-btn" data-action="reps-inc-g" data-key="${groupKey}" data-serie="${s}" data-ei="${ei}">+</button>
              </div>
              ${chkHtml}
            </div>
            ${isBanda ? buildBandaDetail(`${groupKey}-${s}-${ei}`, 0, savedBandas, savedAnclaje, savedElong, kgId) : ''}`;
        }).join('')}
      </div>`;
  }

  const hasKg = groupExs.some(e=>(e.Equipo||'Corporal')!=='Corporal');
  return `
    <div class="tbl-wrap">
      <div class="tbl-head">
        <div class="th">S</div>
        <div class="th left">EJERCICIO</div>
        <div class="th">${hasKg?'KG':''}</div>
        <div class="th">REPS</div>
        <div class="th">✓</div>
      </div>
      <div class="tbl-body" id="tbl-main">${rows}</div>
    </div>`;
}

function buildBandaDetail(key, idx, savedBandas, savedAnclaje, savedElong, kgId=null) {
  const realKgId = kgId || `kg-${key}-${idx}`;
  const chips = CONFIG.BANDAS.map(b => {
    const isSel = savedBandas.includes(b.nombre);
    return `<div class="bchip ${isSel?'sel':''}" data-banda="${b.nombre}" data-min="${b.min}" data-max="${b.max}" data-kgid="${realKgId}" data-detkey="${key}-${idx}" onclick="toggleBandaChip(this)">
      <div class="bchip-dot" style="background:${b.color}"></div>
    </div>`;
  }).join('');

  const anclHtml = CONFIG.ANCLAJES.map(a =>
    `<div class="anc-chip ${a===savedAnclaje?'sel':''}" onclick="selAnclaje(this)">${a==='Bajo'?'⬇️':a==='Medio'?'➡️':'⬆️'} ${a}</div>`
  ).join('');

  const elongId = `elong-${key}-${idx}`;

  return `
    <div class="banda-detail">
      <div class="banda-detail-inner">
        ${chips}
        <div class="det-div"></div>
        <div class="anc-mini">${anclHtml}</div>
        <div class="det-div"></div>
        <div class="elong-mini">
          <button class="elong-btn" data-action="elong-dec" data-id="${elongId}">−</button>
          <div class="elong-val" id="${elongId}">${savedElong}cm</div>
          <button class="elong-btn" data-action="elong-inc" data-id="${elongId}">+</button>
        </div>
      </div>
    </div>`;
}

function calcBandaKg(bandaNames) {
  if (!bandaNames || !bandaNames.length) return '';
  let mn=0, mx=0;
  bandaNames.forEach(nombre => {
    const b = CONFIG.BANDAS.find(x => x.nombre === nombre);
    if (b) { mn += b.min; mx += b.max; }
  });
  return mn > 0 ? `${mn}-${mx}` : '';
}

// ---- VIDEOS ----
function renderVideoGuides(query1, query2) {
  const yt1 = `https://youtube.com/results?search_query=${encodeURIComponent(query1)}`;
  const yt2 = `https://youtube.com/results?search_query=${encodeURIComponent(query2)}`;
  return `
    <div class="vid-sec">
      <div class="vid-lbl">Vídeos guía</div>
      <div class="vid-row">
        <a class="vid-btn" href="${yt1}" target="_blank">
          <div class="vid-play">▶</div>
          <div><div class="vid-title">Técnica básica</div><div class="vid-sub">YouTube →</div></div>
        </a>
        <a class="vid-btn" href="${yt2}" target="_blank">
          <div class="vid-play">▶</div>
          <div><div class="vid-title">Variaciones</div><div class="vid-sub">YouTube →</div></div>
        </a>
      </div>
    </div>`;
}

// ---- NOTES ----
function renderNotes() {
  return `
    <div class="notes-sec">
      <div class="notes-lbl">Notas de sesión</div>
      <textarea class="notes-input" placeholder="Añade notas sobre esta sesión..." data-action="save-notes"></textarea>
    </div>`;
}

// ---- RPE/RIR OPTIONAL ----
let rpeOptCounter = 0;
function renderOptionalRPE() {
  const id = ++rpeOptCounter;
  return `
    <div class="opt-toggle" id="opt-t${id}" data-action="toggle-opt" data-body="opt-b${id}" data-icon="opt-i${id}">
      <div class="opt-toggle-label">RPE / RIR — Opcionales</div>
      <em class="opt-toggle-icon" id="opt-i${id}">∨</em>
    </div>
    <div class="opt-body" id="opt-b${id}">
      <div class="opt-inner">
        <div class="field-label">RPE — Esfuerzo percibido</div>
        <div class="rpe-card">
          <div class="rpe-top">
            <div class="rpe-num" id="rpe-n${id}">7</div>
            <div class="rpe-desc" id="rpe-d${id}">Duro, aguanto</div>
          </div>
          <div class="rpe-track">
            ${Array.from({length:10},(_,i)=>`<div class="rpe-pip ${i<7?'on':''}" data-action="set-rpe" data-val="${i+1}" data-nid="rpe-n${id}" data-did="rpe-d${id}"></div>`).join('')}
          </div>
        </div>
        <div class="field-label">RIR — Reps en reserva</div>
        <div class="rir-grid">
          ${[['0','Fallo'],['1','1 res.'],['2','2 res.'],['3+','Fácil']].map(([v,l],i)=>`
            <div class="rir-btn ${i===2?'sel':''}" data-action="set-rir"><div class="rir-val">${v}</div><div class="rir-lbl">${l}</div></div>`).join('')}
        </div>
      </div>
    </div>`;
}

// ---- SUMMARY ----
function renderSummary() {
  const ses = State.sesionActiva;
  const series = State.seriesRegistradas;
  const exNames = [...new Set(series.map(s=>s.Ejercicio))];
  const durMin = ses ? Math.round((Date.now()-ses._startTs)/60000) : 0;

  const exHtml = exNames.map(n => {
    const ss = series.filter(s=>s.Ejercicio===n);
    const reps = ss.map(s=>s.Reps).join('/');
    return `<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1;font-size:14px;font-weight:700">${n}</div>
      <div style="font-size:13px;color:var(--t2)">${ss.length} series · ${reps} reps</div>
    </div>`;
  }).join('');

  return `
    <div class="status-bar"><span>${getTime()}</span><span style="letter-spacing:3px">···</span></div>
    <div class="scroll">
      <div class="summary-hero">
        <div class="summary-emoji">🏆</div>
        <div class="summary-title">SESIÓN<br><em>COMPLETADA</em></div>
        <div class="summary-sub">${ses?ses.Nombre_Dia:''}</div>
      </div>
      <div class="summary-stats">
        <div class="sum-stat"><div class="sum-stat-val">${exNames.length}</div><div class="sum-stat-lbl">Ejercicios</div></div>
        <div class="sum-stat"><div class="sum-stat-val">${series.length}</div><div class="sum-stat-lbl">Series</div></div>
        <div class="sum-stat"><div class="sum-stat-val">${durMin}m</div><div class="sum-stat-lbl">Duración</div></div>
      </div>
      <div class="pad">
        <div class="section-label">Resumen</div>
        <div style="background:var(--s1);border:1px solid var(--border);border-radius:16px;padding:0 16px">${exHtml || '<div style="padding:16px;color:var(--t2);font-size:13px">Sin series registradas</div>'}</div>
        <div style="margin-top:16px"><button class="cta-btn" data-action="go-home">VOLVER AL INICIO</button></div>
        <div style="height:20px"></div>
      </div>
    </div>`;
}

// ---- HISTORY ----
function renderHistory() {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const year = State.calYear, month = State.calMonth;
  const now = new Date();

  const sessionDays = new Set();
  State.sesiones.forEach(s => {
    if (!s.Fecha_Inicio) return;
    const parts = s.Fecha_Inicio.split(/[\/,\s]+/);
    if (parts.length >= 3) {
      const d = new Date(parts[2], parts[1]-1, parts[0]);
      if (d.getFullYear()===year && d.getMonth()===month) sessionDays.add(d.getDate());
    }
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const startOffset = (firstDay+6)%7;
  const dayLabels = ['L','M','X','J','V','S','D'].map(d=>`<div class="cal-day-label">${d}</div>`).join('');
  let cells = Array(startOffset).fill('<div></div>');
  for (let d=1; d<=daysInMonth; d++) {
    const isToday = d===now.getDate() && month===now.getMonth() && year===now.getFullYear();
    const hasSes = sessionDays.has(d);
    cells.push(`<div class="cal-day ${isToday?'today':''} ${hasSes?'has-session':''}">${d}${hasSes?'<div class="cal-dot"></div>':''}</div>`);
  }

  const recentSes = [...State.sesiones].reverse().slice(0,15);
  const sesHtml = recentSes.length
    ? recentSes.map(s => {
        const parts = (s.Fecha_Inicio||'').split(/[\/,\s]+/);
        const day = parts[0]||'?';
        const mon = months[Number(parts[1])-1]?.slice(0,3).toUpperCase()||'';
        return `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--s1);border:1px solid var(--border);border-radius:16px;margin-bottom:8px">
          <div style="width:44px;height:44px;border-radius:13px;background:var(--s2);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--accent);line-height:1">${day}</div>
            <div style="font-size:9px;font-weight:800;color:var(--t3);text-transform:uppercase;letter-spacing:.08em">${mon}</div>
          </div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;margin-bottom:2px">${s.Nombre_Dia||'Sesión'}</div>
            <div style="font-size:12px;color:var(--t2)">${s.Programa} · Semana ${s.Semana}</div>
          </div>
        </div>`;
      }).join('')
    : '<div class="empty"><div class="empty-icon">📅</div><div class="empty-title">Sin sesiones</div><div class="empty-sub">Completa tu primera sesión para ver el historial</div></div>';

  return `
    <div class="status-bar"><span>${getTime()}</span><span style="letter-spacing:3px">···</span></div>
    <div class="topbar"><div class="topbar-title">HISTORIAL</div></div>
    <div class="scroll">
      <div class="pad">
        <div class="cal-header">
          <button class="cal-nav" data-action="cal-prev">‹</button>
          <div class="cal-month">${months[month]} ${year}</div>
          <button class="cal-nav" data-action="cal-next">›</button>
        </div>
        <div class="cal-grid">${dayLabels}${cells.join('')}</div>
        <div class="section-label" style="margin-top:24px">Sesiones recientes</div>
        ${sesHtml}
        <div style="height:20px"></div>
      </div>
    </div>
    ${renderBottomNav('history')}`;
}

// ---- BOTTOM NAV ----
function renderBottomNav(active) {
  return `
    <div class="bottom-nav">
      <div class="nav-item ${active==='home'?'active':''}" data-action="nav-home">
        <div class="nav-icon">🏠</div>
        <div class="nav-label">Inicio</div>
      </div>
      <div class="nav-item ${active==='weeks'||active==='days'?'active':''}" data-action="nav-weeks">
        <div class="nav-icon">⚡</div>
        <div class="nav-label">Entrena</div>
      </div>
      <div class="nav-item ${active==='history'?'active':''}" data-action="nav-history">
        <div class="nav-icon">📅</div>
        <div class="nav-label">Historial</div>
      </div>
    </div>`;
}

// ---- EJERCICIOS DEL DÍA ----
function getEjerciciosDia() {
  return State.plantillas
    .filter(p => p.Programa===State.programa && Number(p.Semana)===State.semana && Number(p.Dia)===State.dia)
    .sort((a,b) => Number(a.Orden)-Number(b.Orden));
}

// ---- SESSION MANAGEMENT ----
async function startSession() {
  if (State.sesionActiva) return;
  const exs = getEjerciciosDia();
  const sesionID = uid();
  const ses = {
    SesionID: sesionID,
    Programa: State.programa,
    Semana: State.semana,
    Dia: State.dia,
    Nombre_Dia: `S${State.semana}D${State.dia} ${State.programa}`,
    Fecha_Inicio: nowStr(),
    Fecha_Fin: '',
    Completada: 'No',
    Notas: '',
    _startTs: Date.now(),
  };
  State.sesionActiva = ses;
  State.ejerciciosActivos = exs;
  Storage.saveSession(ses);

  try {
    await Sheets.append(CONFIG.SHEETS.SESIONES, [
      sesionID, State.programa, State.semana, State.dia,
      ses.Nombre_Dia, ses.Fecha_Inicio, '', 'No', ''
    ]);
  } catch(e) { showToast('Sin conexión — guardado local', 'error'); }
}

async function finishSession() {
  const fin = nowStr();
  if (State.sesionActiva) {
    State.sesionActiva.Fecha_Fin = fin;
    State.sesionActiva.Completada = 'Sí';
    State.sesiones.push({...State.sesionActiva});
    try {
      await Sheets.append(CONFIG.SHEETS.SESIONES, [
        State.sesionActiva.SesionID+'_end', State.programa, State.semana, State.dia,
        State.sesionActiva.Nombre_Dia, State.sesionActiva.Fecha_Inicio, fin, 'Sí',
        Storage.loadNotes()
      ]);
    } catch(e) {}
  }
  Storage.clearSession();
  goTo('summary');
}

async function registerSerie(exKey, idx, data) {
  const exs = getEjerciciosDia();
  const ex = exs[State.currentExIdx];
  const serieID = uid();
  const row = {
    EjercicioID: serieID,
    SesionID: State.sesionActiva?.SesionID || '',
    Orden: ex?.Orden || '',
    Tipo: ex?.Tipo || '',
    Grupo_Superset: ex?.Grupo_Superset || '',
    Ejercicio: data.ejercicio || ex?.Ejercicio || '',
    Equipo: ex?.Equipo || 'Corporal',
    Series_Obj: ex?.Series_Obj || 3,
    N_Serie: idx + 1,
    Reps: data.reps || 0,
    Peso_KB: data.kg || '',
    Color_Banda: (data.bandas||[]).join(', '),
    Anclaje_Banda: data.anclaje || '',
    Elongacion_cm: data.elong || '',
    Peso_Banda_kg: data.kgTotal || '',
    Descanso_seg: data.descanso || '',
    RPE: data.rpe || '',
    RIR: data.rir || '',
    Notas: Storage.loadNotes(),
  };
  State.seriesRegistradas.push(row);
  State.ejerciciosAll.push(row);

  try {
    await Sheets.append(CONFIG.SHEETS.EJERCICIOS, Object.values(row));
  } catch(e) { console.warn('Sin conexión, guardado local'); }

  showToast('Serie ✓ guardada');
  showSaved();
}

// ---- EVENT DELEGATION ----
function attachEvents(screenId, el) {
  el.addEventListener('click', async e => {
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const action = t.dataset.action;

    switch(action) {
      case 'back-home':    goBack('home'); break;
      case 'back-weeks':   goBack('weeks'); break;
      case 'back-days':    goBack('days'); break;
      case 'back-calent':  goBack('calent'); break;
      case 'nav-home':     goTo('home'); break;
      case 'nav-weeks':
        if (State.programa) goTo('weeks');
        else goTo('home');
        break;
      case 'nav-history':  goTo('history'); break;

      case 'open-prog':
        State.programa = t.dataset.prog;
        goTo('weeks');
        break;

      case 'start-next': {
        const sid = t.dataset.sesid;
        if (sid) {
          const [prog, sem, dia] = sid.split('-');
          State.programa = prog;
          State.semana = Number(sem);
          State.dia = Number(dia);
          await startSession();
          State.currentExIdx = 0;
          goTo('calent');
        }
        break;
      }

      case 'open-week':
        State.semana = Number(t.dataset.semana);
        goTo('days');
        break;

      case 'open-day':
        State.dia = Number(t.dataset.dia);
        State.currentExIdx = 0;
        State.seriesRegistradas = [];
        State.sesionActiva = null;
        await startSession();
        goTo('calent');
        break;

      case 'toggle-calent': {
        const btn = el.querySelector('#calent-btn');
        const done = btn.classList.toggle('secondary');
        btn.textContent = done ? '✓ COMPLETADO' : 'MARCAR COMO COMPLETADO ✓';
        if (done) { showToast('Calentamiento ✓'); showSaved(); }
        break;
      }

      case 'next-ex': {
        const nextIdx = Number(t.dataset.idx);
        const exs = getEjerciciosDia();
        if (nextIdx >= exs.length) { await finishSession(); break; }
        // Skip already-grouped exercises
        State.currentExIdx = nextIdx;
        goTo('exercise');
        break;
      }

      case 'prev-ex':
        State.currentExIdx = Math.max(0, Number(t.dataset.idx));
        goTo('exercise');
        break;

      case 'back-calent-from-ex':
        goBack('calent');
        break;

      case 'finish-session':
        await finishSession();
        break;

      case 'add-serie':
        showToast('Serie añadida ✓');
        break;

      case 'toggle-check': {
        const key = t.dataset.key;
        const idx = Number(t.dataset.idx);
        const isDone = t.classList.toggle('done');
        t.textContent = isDone ? '✓' : '○';
        const sb = el.querySelector(`#sb-${key}-${idx}`);
        if (sb) {
          sb.classList.toggle('done-block', isDone);
          const badge = sb.querySelector('.sbl-badge');
          if (badge) {
            badge.className = 'sbl-badge ' + (isDone?'badge-done':'badge-pending');
            badge.textContent = isDone ? '✓ Hecho' : 'Pendiente';
          }
        }
        if (isDone) {
          const reps = el.querySelector(`#rv-${key}-${idx}`)?.textContent || '0';
          const savedBandas = [...el.querySelectorAll(`[data-detkey="${key}-${idx}"] .bchip.sel`)].map(c=>c.dataset.banda);
          const anclaje = el.querySelector(`[data-detkey="${key}-${idx}"]`)?.closest('.banda-detail')
            ?.querySelector('.anc-chip.sel')?.textContent?.trim() || '';
          const elong = el.querySelector(`#elong-${key}-${idx}`)?.textContent?.replace('cm','') || '';
          const kgStr = calcBandaKg(savedBandas);

          Storage.saveProgress(key, idx, { done:true, reps, bandas:savedBandas, anclaje, elong });
          await registerSerie(key, idx, { ejercicio: getEjerciciosDia()[State.currentExIdx]?.Ejercicio, reps, bandas:savedBandas, anclaje, elong, kgTotal:kgStr });

          // Activate next
          const next = el.querySelector(`#sb-${key}-${idx+1}`);
          if (next) {
            const nb = next.querySelector('.sbl-badge');
            if (nb) { nb.className='sbl-badge badge-active'; nb.textContent='● Actual'; }
          }
        } else {
          Storage.saveProgress(key, idx, { done:false });
        }
        showSaved();
        break;
      }

      case 'toggle-group-check': {
        const key = t.dataset.key;
        const idx = Number(t.dataset.idx);
        const isDone = t.classList.toggle('done');
        t.textContent = isDone ? '✓' : '○';
        const sb = el.querySelector(`#sb-${key}-${idx}`);
        if (sb) {
          sb.classList.toggle('done-block', isDone);
          const badge = sb.querySelector('.sbl-badge');
          if (badge) {
            badge.className = 'sbl-badge ' + (isDone?'badge-done':'badge-pending');
            badge.textContent = isDone ? '✓ Hecho' : 'Pendiente';
          }
        }
        if (isDone) {
          Storage.saveProgress(key, idx, { done:true });
          showToast('Serie ✓ guardada');
        } else {
          Storage.saveProgress(key, idx, { done:false });
        }
        showSaved();
        break;
      }

      case 'reps-dec': case 'reps-inc': {
        const key = t.dataset.key, idx = t.dataset.idx;
        const vEl = el.querySelector(`#rv-${key}-${idx}`);
        if (vEl) {
          const v = Math.max(0, Number(vEl.textContent.replace(/[^0-9]/g,'')) + (action==='reps-inc'?1:-1));
          vEl.textContent = v;
          Storage.saveProgress(key, idx, { ...(Storage.loadProgress()[key]?.[idx]||{}), reps:v });
          showSaved();
        }
        break;
      }

      case 'reps-dec-g': case 'reps-inc-g': {
        const key=t.dataset.key, s=t.dataset.serie, ei=t.dataset.ei;
        const vEl = el.querySelector(`#rv-${key}-${s}-${ei}`);
        if (vEl) {
          const v = Math.max(0, Number(vEl.textContent.replace(/[^0-9]/g,'')) + (action==='reps-inc-g'?1:-1));
          vEl.textContent = v;
          showSaved();
        }
        break;
      }

      case 'elong-dec': case 'elong-inc': {
        const eid = t.dataset.id;
        const vEl = el.querySelector(`#${eid}`);
        if (vEl) {
          const v = Math.max(0, parseInt(vEl.textContent) + (action==='elong-inc'?5:-5));
          vEl.textContent = v + 'cm';
          showSaved();
        }
        break;
      }

      case 'toggle-opt': {
        const bodyId = t.dataset.body, iconId = t.dataset.icon;
        const body = el.querySelector(`#${bodyId}`);
        const icon = el.querySelector(`#${iconId}`);
        if (body) {
          const open = body.classList.toggle('open');
          if (icon) { icon.textContent = open ? '∧' : '∨'; icon.classList.toggle('open', open); }
          t.classList.toggle('open', open);
        }
        break;
      }

      case 'set-rpe': {
        const v = Number(t.dataset.val);
        const nEl = el.querySelector(`#${t.dataset.nid}`);
        const dEl = el.querySelector(`#${t.dataset.did}`);
        t.closest('.rpe-track').querySelectorAll('.rpe-pip').forEach((p,i) => p.classList.toggle('on', i<v));
        if (nEl) nEl.textContent = v;
        if (dEl) dEl.textContent = CONFIG.RPE_DESC[v];
        break;
      }

      case 'set-rir':
        t.closest('.rir-grid').querySelectorAll('.rir-btn').forEach(b=>b.classList.remove('sel'));
        t.classList.add('sel');
        break;

      case 'save-notes':
        // handled by input event
        break;

      case 'go-home':
        State.sesionActiva = null;
        State.seriesRegistradas = [];
        goTo('home');
        break;

      case 'cal-prev':
        State.calMonth--;
        if (State.calMonth < 0) { State.calMonth=11; State.calYear--; }
        goTo('history');
        break;

      case 'cal-next':
        State.calMonth++;
        if (State.calMonth > 11) { State.calMonth=0; State.calYear++; }
        goTo('history');
        break;
    }
  });

  // Notes input
  el.querySelectorAll('.notes-input').forEach(inp => {
    inp.addEventListener('input', () => {
      Storage.saveNotes(inp.value);
      showSaved();
    });
  });
}

// Banda chip toggle (called inline)
function toggleBandaChip(el) {
  el.classList.toggle('sel');
  const inner = el.closest('.banda-detail-inner');
  const kgId = el.dataset.kgid;
  const chips = inner.querySelectorAll('.bchip.sel');
  let mn=0, mx=0;
  chips.forEach(c => {
    mn += Number(c.dataset.min);
    mx += Number(c.dataset.max);
  });
  const kgEl = document.getElementById(kgId);
  if (kgEl) kgEl.innerHTML = mn>0
    ? `<div class="er-kg-val">${mn}-${mx}</div><div class="er-kg-lbl">kg</div>`
    : `<div class="er-kg-val" style="color:var(--t3)">—</div>`;
  showSaved();
}

function selAnclaje(el) {
  el.closest('.anc-mini').querySelectorAll('.anc-chip').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  showSaved();
}

// ---- RESTORE NOTES ----
function restoreNotes(el) {
  const notes = Storage.loadNotes();
  if (notes) el.querySelectorAll('.notes-input').forEach(inp => inp.value = notes);
}

// ---- CLOCK ----
function updateClock(el) {
  const clk = el.querySelector('#clk');
  if (!clk) return;
  clk.textContent = getTime();
  setInterval(() => { if (clk.isConnected) clk.textContent = getTime(); }, 30000);
}

// ---- INIT ----
async function init() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen active" style="align-items:center;justify-content:center;gap:16px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:52px;letter-spacing:.06em;color:var(--accent)">MOMENTUM</div>
      <div class="spinner"></div>
      <div class="loading-text">Cargando programa...</div>
    </div>`;

  try {
    const [plantRows, sesRows, exRows] = await Promise.all([
      Sheets.get(`${CONFIG.SHEETS.PLANTILLAS}!A:K`),
      Sheets.get(`${CONFIG.SHEETS.SESIONES}!A:I`),
      Sheets.get(`${CONFIG.SHEETS.EJERCICIOS}!A:T`),
    ]);
    State.plantillas = Sheets.rowsToObjects(plantRows);
    State.sesiones   = Sheets.rowsToObjects(sesRows);
    State.ejerciciosAll = Sheets.rowsToObjects(exRows);
  } catch(err) {
    console.error('Error cargando datos:', err);
    showToast('Error al cargar. Comprueba la API Key.', 'error');
  }

  // Restore active session if exists
  const savedSes = Storage.loadSession();
  if (savedSes) {
    State.sesionActiva = savedSes;
    State.programa = savedSes.Programa;
    State.semana = Number(savedSes.Semana);
    State.dia = Number(savedSes.Dia);
    State.ejerciciosActivos = getEjerciciosDia();
  }

  app.innerHTML = '';
  renderScreen('home');
}

document.addEventListener('DOMContentLoaded', init);
