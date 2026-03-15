// ============================================
// MOMENTUM TRAINING — app.js
// ============================================

// ---- STATE ----
const State = {
  screen: 'home',
  program: null,         // 'Estándar' | 'Kettlebell'
  semana: null,          // número
  dia: null,             // número
  plantillas: [],        // todos los registros de Plantillas
  sesiones: [],          // historial de Sesiones
  ejerciciosAll: [],     // todos Ejercicios_Realizados

  // Sesión activa
  sesionActiva: null,    // { SesionID, Fecha_Inicio, ... }
  ejerciciosActivos: [], // copia de plantilla para esta sesión
  currentExIdx: 0,       // índice del ejercicio actual
  currentSerie: 1,
  seriesRegistradas: [], // series guardadas en esta sesión

  // Timer
  timerInterval: null,
  timerSeconds: 90,
  timerRemaining: 90,
};

// ---- UTILS ----
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function now() { return new Date().toLocaleString('es-ES'); }
function pad(n) { return String(n).padStart(2,'0'); }
function formatDur(sec) {
  const m = Math.floor(sec/60), s = sec%60;
  return m>0 ? `${m}m ${pad(s)}s` : `${s}s`;
}
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' '+type : '') + ' show';
  setTimeout(() => t.className = 'toast', 2500);
}
function getTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function getStatusBar() {
  return `<div class="status-bar"><span>${getTime()}</span><span style="letter-spacing:3px">···</span></div>`;
}

// ---- NAVIGATION ----
function goTo(screenId, data={}) {
  Object.assign(State, data);
  const prev = document.querySelector('.screen.active');
  if (prev) prev.classList.add('slide-out');
  setTimeout(() => { if(prev) { prev.classList.remove('active','slide-out'); } }, 280);

  State.screen = screenId;
  render();
}

function render() {
  const app = document.getElementById('app');
  const screens = {
    home:     renderHome,
    program:  renderProgram,
    days:     renderDays,
    workout:  renderWorkout,
    register: renderRegister,
    timer:    renderTimer,
    summary:  renderSummary,
    history:  renderHistory,
  };
  const fn = screens[State.screen];
  if (!fn) return;
  const html = fn();
  const div = document.createElement('div');
  div.className = 'screen';
  div.innerHTML = html;
  app.appendChild(div);
  requestAnimationFrame(() => div.classList.add('active'));

  // Remove old screens after transition
  setTimeout(() => {
    app.querySelectorAll('.screen:not(.active)').forEach(s => s.remove());
  }, 400);

  attachEvents(State.screen, div);
}

// ---- SCREEN: HOME ----
function renderHome() {
  const lastSesion = State.sesiones.length
    ? State.sesiones[State.sesiones.length-1]
    : null;

  const lastHtml = lastSesion ? `
    <div class="section-label">Última sesión</div>
    <div class="card last-session-card">
      <div class="lsc-icon">⚡</div>
      <div class="lsc-info">
        <div class="lsc-label">${lastSesion.Programa} · Semana ${lastSesion.Semana}</div>
        <div class="lsc-name">${lastSesion.Nombre_Dia}</div>
        <div class="lsc-date">${lastSesion.Fecha_Inicio || ''}</div>
      </div>
      <button class="lsc-btn" data-action="ver-sesion" data-id="${lastSesion.SesionID}">VER</button>
    </div>` : '';

  return `
    ${getStatusBar()}
    <div class="home-hero">
      <div class="home-glow"></div>
      <div class="home-greeting">Buenos días,</div>
      <div class="home-title">LISTO PARA<br><em>ENTRENAR</em></div>
    </div>
    <div class="scroll">
      <div class="pad">
        ${lastHtml}
        <div class="section-label">Elige programa</div>
        <div class="card program-card std tap" data-action="open-program" data-prog="Estándar">
          <div class="prog-glow"></div>
          <div class="prog-badge">● Activo</div>
          <div class="prog-name">ESTÁNDAR</div>
          <div class="prog-meta">Peso corporal · Bandas elásticas</div>
          <div class="prog-stats">
            <div><div class="prog-stat-val">12</div><div class="prog-stat-lbl">Semanas</div></div>
            <div><div class="prog-stat-val">4</div><div class="prog-stat-lbl">Días/sem</div></div>
          </div>
        </div>
        <div class="card program-card kb tap" data-action="open-program" data-prog="Kettlebell">
          <div class="prog-glow"></div>
          <div class="prog-badge">● Disponible</div>
          <div class="prog-name">KETTLEBELL</div>
          <div class="prog-meta">Kettlebells · Bandas · Peso corporal</div>
          <div class="prog-stats">
            <div><div class="prog-stat-val">12</div><div class="prog-stat-lbl">Semanas</div></div>
            <div><div class="prog-stat-val">4</div><div class="prog-stat-lbl">Días/sem</div></div>
          </div>
        </div>
      </div>
    </div>
    ${renderBottomNav('home')}`;
}

// ---- SCREEN: PROGRAM (semanas) ----
function renderProgram() {
  const prog = State.program;
  const plantillas = State.plantillas.filter(p => p.Programa === prog);
  const semanas = [...new Set(plantillas.map(p=>p.Semana))].map(Number).sort((a,b)=>a-b);

  // Determinar semana actual (última con sesión o 1)
  const sesSemanas = State.sesiones.filter(s=>s.Programa===prog).map(s=>Number(s.Semana));
  const currentSemana = sesSemanas.length ? Math.max(...sesSemanas) : 1;
  const total = semanas.length;
  const pct = Math.round((currentSemana/total)*100);

  const weeksHtml = semanas.map(s => {
    const isDone = s < currentSemana;
    const isCurr = s === currentSemana;
    const cls = isDone ? 'done' : isCurr ? 'current' : '';
    const badge = isCurr ? `<span class="week-badge">ACTUAL</span>` : isDone ? '✅' : '🔒';
    const sesCount = State.sesiones.filter(x=>x.Programa===prog && Number(x.Semana)===s).length;
    return `
      <div class="card week-item ${cls} ${isCurr||isDone?'tap':''}" data-action="open-week" data-semana="${s}">
        <div class="week-num">${s}</div>
        <div class="week-info">
          <div class="week-title">Semana ${s}</div>
          <div class="week-meta">4 sesiones${isDone ? ` · ${sesCount} completadas`:''}</div>
        </div>
        ${badge}
      </div>`;
  }).join('');

  return `
    ${getStatusBar()}
    <div class="topbar">
      <div class="back-btn" data-action="back">←</div>
      <div class="topbar-title">${prog.toUpperCase()}</div>
      <div class="topbar-sub">${total} semanas</div>
    </div>
    <div class="scroll">
      <div class="pad">
        <div class="prog-header">
          <div class="prog-header-title">PROGRAMA<br><em>${prog.toUpperCase()}</em></div>
          <div class="prog-progress-wrap">
            <div class="prog-progress-labels">
              <span>Progreso</span>
              <strong>Semana ${currentSemana} de ${total}</strong>
            </div>
            <div class="prog-progress-bar">
              <div class="prog-progress-fill" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
        <div class="section-label">Selecciona semana</div>
        ${weeksHtml}
      </div>
    </div>
    ${renderBottomNav('program')}`;
}

// ---- SCREEN: DAYS ----
function renderDays() {
  const prog = State.program;
  const sem = State.semana;
  const dias = [...new Set(
    State.plantillas.filter(p=>p.Programa===prog && Number(p.Semana)===sem).map(p=>Number(p.Dia))
  )].sort((a,b)=>a-b);

  // Siguiente día que toca
  const diasHechos = State.sesiones
    .filter(s=>s.Programa===prog && Number(s.Semana)===sem)
    .map(s=>Number(s.Dia));
  const nextDia = dias.find(d=>!diasHechos.includes(d)) || dias[0];

  const diasHtml = dias.map(d => {
    const done = diasHechos.includes(d);
    const isNext = d === nextDia && !done;
    const exs = State.plantillas.filter(p=>p.Programa===prog&&Number(p.Semana)===sem&&Number(p.Dia)===d&&p.Tipo!=='Calentamiento');
    const chips = exs.slice(0,3).map(e=>`<div class="day-chip">${e.Ejercicio}</div>`).join('');
    const more = exs.length>3 ? `<div class="day-chip">+${exs.length-3} más</div>` : '';
    const supersets = exs.filter(e=>e.Tipo==='Superset').length/2;
    const circuitos = exs.filter(e=>e.Tipo==='Circuito').length/4;

    return `
      <div class="card day-card ${done?'completed':''} ${isNext?'next-up':''} tap"
           data-action="open-day" data-dia="${d}">
        ${isNext ? '<div class="day-next-badge">SIGUIENTE</div>' : ''}
        <div class="day-num">Sesión ${d}</div>
        <div class="day-name">${prog.toUpperCase()} S${sem}D${d}</div>
        <div class="day-chips">${chips}${more}</div>
        <div class="day-footer">
          <div class="day-count">${done?'✅ Completada · ':''}${exs.length} ejercicios${supersets>0?` · ${supersets} SS`:''}${circuitos>0?` · ${circuitos} CIR`:''}</div>
          ${!done?'<div class="day-arrow">→</div>':''}
        </div>
      </div>`;
  }).join('');

  return `
    ${getStatusBar()}
    <div class="topbar">
      <div class="back-btn" data-action="back">←</div>
      <div class="topbar-title">SEMANA ${sem}</div>
      <div class="topbar-sub">${prog}</div>
    </div>
    <div class="scroll">
      <div class="pad">${diasHtml}</div>
    </div>
    ${renderBottomNav('program')}`;
}

// ---- SCREEN: WORKOUT ----
function renderWorkout() {
  const prog = State.program, sem = State.semana, dia = State.dia;
  const exs = State.ejerciciosActivos.length
    ? State.ejerciciosActivos
    : State.plantillas.filter(p=>p.Programa===prog&&Number(p.Semana)===sem&&Number(p.Dia)===dia)
        .sort((a,b)=>Number(a.Orden)-Number(b.Orden));

  if (!State.ejerciciosActivos.length) State.ejerciciosActivos = exs;

  // Build blocks
  const blocks = buildBlocks(exs);
  const total = exs.filter(e=>e.Tipo!=='Calentamiento').length;
  const done = State.seriesRegistradas.map(s=>s.Ejercicio);

  const blocksHtml = blocks.map(block => {
    if (block.type === 'single') {
      const e = block.items[0];
      const isDone = done.filter(x=>x===e.Ejercicio).length >= Number(e.Series_Obj||3);
      return `
        <div class="card ex-block type-${e.Tipo} ${isDone?'':'tap'}"
             data-action="${isDone?'':'start-ex'}" data-ejercicio="${e.Ejercicio}" data-tipo="${e.Tipo}">
          <div class="ex-row">
            <div class="ex-dot"></div>
            <div class="ex-info">
              <div class="ex-name">${e.Ejercicio}</div>
              <div class="ex-detail">${e.Series_Obj||3} series${getLastRef(e.Ejercicio)}</div>
            </div>
            <div class="ex-type-badge">${e.Tipo}</div>
            <div class="ex-check ${isDone?'done'}">${isDone?'✓':'→'}</div>
          </div>
        </div>`;
    } else {
      // group (superset or circuito)
      const tipo = block.type;
      const label = tipo==='Superset' ? `Superset ${block.grupo}` : `Circuito ${block.grupo}`;
      const exsHtml = block.items.map(e => {
        const isDone = done.filter(x=>x===e.Ejercicio).length >= Number(e.Series_Obj||3);
        return `
          <div class="group-ex tap" data-action="start-ex" data-ejercicio="${e.Ejercicio}" data-tipo="${e.Tipo}">
            <div class="group-ex-info">
              <div class="group-ex-name">${e.Ejercicio}</div>
              <div class="group-ex-detail">${e.Series_Obj||3} series${getLastRef(e.Ejercicio)}</div>
            </div>
            <div class="ex-check ${isDone?'done'}">${isDone?'✓':'→'}</div>
          </div>`;
      }).join('');
      return `
        <div class="group-block type-${tipo}">
          <div class="group-header">
            <div class="group-header-dot"></div>
            ${label}
          </div>
          ${exsHtml}
        </div>`;
    }
  }).join('');

  const seriesDone = State.seriesRegistradas.length;

  return `
    ${getStatusBar()}
    <div class="topbar">
      <div class="back-btn" data-action="back">←</div>
      <div class="topbar-title">SESIÓN ${dia}</div>
      <div class="topbar-sub">S${sem} · ${prog}</div>
    </div>
    <div class="scroll">
      <div class="workout-hero pad">
        <div class="workout-title">${prog.toUpperCase()}<br>S${sem} D${dia}</div>
        <div class="workout-meta">${total} ejercicios · ${seriesDone} series hechas</div>
      </div>
      <div class="pad">${blocksHtml}</div>
      <div style="height:20px"></div>
    </div>
    <div style="position:absolute;bottom:80px;left:0;right:0;padding:0 20px;">
      <button class="cta-btn" data-action="empezar-sesion">
        ${State.sesionActiva ? 'CONTINUAR SESIÓN' : 'EMPEZAR SESIÓN'}
      </button>
    </div>
    ${renderBottomNav('program')}`;
}

function buildBlocks(exs) {
  const blocks = [];
  let i = 0;
  while (i < exs.length) {
    const e = exs[i];
    if (e.Tipo === 'Serie' || e.Tipo === 'Calentamiento') {
      blocks.push({ type: 'single', items: [e] });
      i++;
    } else if (e.Tipo === 'Superset' || e.Tipo === 'Circuito') {
      const grupo = e.Grupo_Superset;
      const group = exs.filter(x => x.Grupo_Superset === grupo && x.Tipo === e.Tipo);
      blocks.push({ type: e.Tipo, grupo, items: group });
      i += group.length;
    } else {
      blocks.push({ type: 'single', items: [e] });
      i++;
    }
  }
  return blocks;
}

function getLastRef(nombre) {
  const matches = State.ejerciciosAll.filter(e=>e.Ejercicio===nombre&&e.Reps);
  if (!matches.length) return '';
  matches.sort((a,b)=>b.EjercicioID.localeCompare(a.EjercicioID));
  const last = matches[0];
  return ` · Últ: ${last.Reps} reps`;
}

// ---- SCREEN: REGISTER ----
function renderRegister() {
  const nombre = State.currentExNombre;
  const tipo = State.currentExTipo;
  const exPlantilla = State.ejerciciosActivos.find(e=>e.Ejercicio===nombre) || {};
  const equipo = exPlantilla.Equipo || 'Corporal';
  const seriesObj = Number(exPlantilla.Series_Obj) || 3;
  const serie = State.currentSerie;

  // Last ref
  const lastEx = State.ejerciciosAll.filter(e=>e.Ejercicio===nombre&&e.Reps)
    .sort((a,b)=>b.EjercicioID.localeCompare(a.EjercicioID))[0];

  const dotsHtml = Array.from({length:seriesObj},(_,i)=>{
    const cls = i+1 < serie ? 'done' : i+1===serie ? 'active' : '';
    return `<div class="s-dot ${cls}"></div>`;
  }).join('');

  // Type color
  const typeColors = {Calentamiento:'var(--c-calent)',Serie:'var(--c-serie)',Superset:'var(--c-superset)',Circuito:'var(--c-circuito)'};
  const typeColor = typeColors[tipo]||'var(--c-serie)';

  // Equipment fields
  let equipHtml = '';
  if (equipo === 'Banda') {
    const bandasHtml = CONFIG.BANDAS.map(b => `
      <div class="banda-opt" data-banda="${b.nombre}">
        <div class="banda-color" style="background:${b.color}"></div>
        <div class="banda-info">
          <div class="banda-name">${b.nombre}</div>
          <div class="banda-range">${b.rango}</div>
        </div>
      </div>`).join('');
    const anclajesHtml = CONFIG.ANCLAJES.map((a,i) => {
      const icons = ['⬇️','➡️','⬆️'];
      return `<div class="anclaje-opt" data-anclaje="${a}">
        <div class="anclaje-icon">${icons[i]}</div>
        <div class="anclaje-label">${a}</div>
      </div>`;
    }).join('');
    equipHtml = `
      <div>
        <div class="field-label">Banda</div>
        <div class="banda-grid">${bandasHtml}</div>
      </div>
      <div>
        <div class="field-label">Anclaje</div>
        <div class="anclaje-grid">${anclajesHtml}</div>
      </div>
      <div>
        <div class="field-label">Elongación (cm)</div>
        <div class="counter-card">
          <button class="cnt-btn" data-counter="elongacion" data-delta="-5">−</button>
          <div class="cnt-display">
            <div class="cnt-val" id="cnt-elongacion">80</div>
            <div class="cnt-unit">cm</div>
          </div>
          <button class="cnt-btn" data-counter="elongacion" data-delta="5">+</button>
        </div>
      </div>
      <div>
        <div class="field-label">Peso banda (kg)</div>
        <div class="counter-card">
          <button class="cnt-btn" data-counter="pesoBanda" data-delta="-1">−</button>
          <div class="cnt-display">
            <div class="cnt-val" id="cnt-pesoBanda">8</div>
            <div class="cnt-unit">kg</div>
          </div>
          <button class="cnt-btn" data-counter="pesoBanda" data-delta="1">+</button>
        </div>
      </div>`;
  } else if (equipo === 'Kettlebell') {
    equipHtml = `
      <div>
        <div class="field-label">Peso KB (kg)</div>
        <div class="counter-card">
          <button class="cnt-btn" data-counter="pesoKB" data-delta="-2">−</button>
          <div class="cnt-display">
            <div class="cnt-val" id="cnt-pesoKB">16</div>
            <div class="cnt-unit">kg</div>
          </div>
          <button class="cnt-btn" data-counter="pesoKB" data-delta="2">+</button>
        </div>
      </div>`;
  }

  return `
    ${getStatusBar()}
    <div class="topbar">
      <div class="back-btn" data-action="back">←</div>
      <div class="topbar-title">REGISTRAR</div>
    </div>
    <div class="scroll">
      <div class="reg-header pad">
        <div class="reg-type-label" style="color:${typeColor}">● ${tipo}</div>
        <div class="reg-ex-name">${nombre}</div>
        <div class="reg-refs">
          ${lastEx ? `<div class="ref-pill">Última vez: <span>${lastEx.Reps} reps</span></div>` : ''}
          ${lastEx&&lastEx.Color_Banda ? `<div class="ref-pill">Banda: <span>${lastEx.Color_Banda}</span></div>` : ''}
          ${lastEx&&lastEx.RPE ? `<div class="ref-pill">RPE ant.: <span>${lastEx.RPE}</span></div>` : ''}
        </div>
      </div>
      <div class="series-dots pad">${dotsHtml}</div>
      <div class="serie-label">Serie ${serie} de ${seriesObj}</div>
      <div class="form">
        <div>
          <div class="field-label">Repeticiones</div>
          <div class="counter-card">
            <button class="cnt-btn" data-counter="reps" data-delta="-1">−</button>
            <div class="cnt-display">
              <div class="cnt-val" id="cnt-reps">${lastEx?lastEx.Reps:10}</div>
              <div class="cnt-unit">reps</div>
            </div>
            <button class="cnt-btn" data-counter="reps" data-delta="1">+</button>
          </div>
        </div>
        ${equipHtml}
        <div>
          <div class="field-label">RPE — Esfuerzo percibido</div>
          <div class="rpe-card">
            <div class="rpe-top">
              <div class="rpe-num" id="rpe-num">${lastEx&&lastEx.RPE?lastEx.RPE:7}</div>
              <div class="rpe-desc" id="rpe-desc">${CONFIG.RPE_DESC[lastEx&&lastEx.RPE?Number(lastEx.RPE):7]}</div>
            </div>
            <div class="rpe-track">
              ${Array.from({length:10},(_,i)=>`<div class="rpe-pip ${i<(lastEx&&lastEx.RPE?Number(lastEx.RPE):7)?'active':''}" data-rpe="${i+1}"></div>`).join('')}
            </div>
          </div>
        </div>
        <div>
          <div class="field-label">RIR — Reps en reserva</div>
          <div class="rir-grid">
            ${[['0','Al fallo'],['1','1 en res.'],['2','2 en res.'],['3+','Fácil']].map(([v,l],i)=>`
              <div class="rir-opt ${i===2?'selected':''}" data-rir="${v}">
                <div class="rir-val">${v}</div>
                <div class="rir-lbl">${l}</div>
              </div>`).join('')}
          </div>
        </div>
        <div>
          <div class="field-label">Descanso (seg)</div>
          <div class="counter-card">
            <button class="cnt-btn" data-counter="descanso" data-delta="-15">−</button>
            <div class="cnt-display">
              <div class="cnt-val" id="cnt-descanso">90</div>
              <div class="cnt-unit">seg</div>
            </div>
            <button class="cnt-btn" data-counter="descanso" data-delta="15">+</button>
          </div>
        </div>
      </div>
      <div style="padding:16px 20px 0;">
        <button class="cta-btn" data-action="confirmar-serie">CONFIRMAR SERIE ✓</button>
      </div>
      <div style="height:40px"></div>
    </div>`;
}

// ---- SCREEN: TIMER ----
function renderTimer() {
  const total = State.timerSeconds;
  const rem = State.timerRemaining;
  const circumference = 2 * Math.PI * 80;
  const offset = circumference * (1 - rem/total);
  const warning = rem <= 10;

  return `
    ${getStatusBar()}
    <div class="topbar">
      <div class="back-btn" data-action="skip-timer">✕</div>
      <div class="topbar-title">DESCANSO</div>
    </div>
    <div class="scroll" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 20px 100px;">
      <div class="timer-label">RECUPERANDO</div>
      <div class="timer-ring">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle class="timer-ring-bg" cx="100" cy="100" r="80"/>
          <circle class="timer-ring-fill ${warning?'warning':''}" cx="100" cy="100" r="80"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
            id="timer-ring-fill"/>
        </svg>
        <div class="timer-center">
          <div class="timer-display ${warning?'warning':''}" id="timer-display">
            ${pad(Math.floor(rem/60))}:${pad(rem%60)}
          </div>
        </div>
      </div>
      <div class="timer-next">Siguiente: <strong>${State.nextExNombre||'—'}</strong></div>
      <div class="timer-controls">
        <button class="timer-btn skip" data-action="skip-timer">SALTAR</button>
        <button class="timer-btn add"  data-action="add-time">+30s</button>
      </div>
    </div>`;
}

// ---- SCREEN: SUMMARY ----
function renderSummary() {
  const ses = State.sesionActiva;
  const series = State.seriesRegistradas;
  const exNames = [...new Set(series.map(s=>s.Ejercicio))];
  const durMin = ses ? Math.round((Date.now() - ses._startTs)/60000) : 0;

  const exHtml = exNames.map(nombre => {
    const ss = series.filter(s=>s.Ejercicio===nombre);
    const reps = ss.map(s=>s.Reps).join(' / ');
    return `
      <div class="sum-ex-row">
        <div class="sum-ex-name">${nombre}</div>
        <div class="sum-ex-detail">${ss.length} series · ${reps} reps</div>
      </div>`;
  }).join('');

  return `
    ${getStatusBar()}
    <div class="scroll">
      <div class="summary-hero">
        <div class="summary-emoji">🏆</div>
        <div class="summary-title">SESIÓN<br><em>COMPLETADA</em></div>
        <div class="summary-sub">${ses?ses.Nombre_Dia:''}</div>
      </div>
      <div class="summary-stats">
        <div class="sum-stat">
          <div class="sum-stat-val">${exNames.length}</div>
          <div class="sum-stat-lbl">Ejercicios</div>
        </div>
        <div class="sum-stat">
          <div class="sum-stat-val">${series.length}</div>
          <div class="sum-stat-lbl">Series</div>
        </div>
        <div class="sum-stat">
          <div class="sum-stat-val">${durMin}m</div>
          <div class="sum-stat-lbl">Duración</div>
        </div>
      </div>
      <div class="pad">
        <div class="section-label">Ejercicios realizados</div>
        <div class="card summary-ex-list">${exHtml}</div>
        <div style="margin-top:16px;">
          <button class="cta-btn" data-action="go-home">VOLVER AL INICIO</button>
        </div>
        <div style="height:20px"></div>
      </div>
    </div>`;
}

// ---- SCREEN: HISTORY ----
function renderHistory() {
  const now = new Date();
  const year = State.calYear || now.getFullYear();
  const month = State.calMonth !== undefined ? State.calMonth : now.getMonth();
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // Days with sessions
  const sessionDays = new Set();
  State.sesiones.forEach(s => {
    if (!s.Fecha_Inicio) return;
    const d = new Date(s.Fecha_Inicio.split(',')[0].split('/').reverse().join('-'));
    if (d.getFullYear()===year && d.getMonth()===month) {
      sessionDays.add(d.getDate());
    }
  });

  // Build calendar
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const startOffset = (firstDay+6)%7; // Monday first
  const dayLabels = ['L','M','X','J','V','S','D'].map(d=>`<div class="cal-day-label">${d}</div>`).join('');

  let calCells = Array(startOffset).fill('<div></div>');
  for (let d=1; d<=daysInMonth; d++) {
    const isToday = d===now.getDate() && month===now.getMonth() && year===now.getFullYear();
    const hasSes = sessionDays.has(d);
    calCells.push(`
      <div class="cal-day ${isToday?'today':''} ${hasSes?'has-session':''}"
           ${hasSes?`data-action="open-cal-day" data-day="${d}" data-month="${month}" data-year="${year}"`:''}
           >${d}${hasSes?'<div class="cal-day-dot"></div>':''}</div>`);
  }

  // Recent sessions list
  const recent = [...State.sesiones].reverse().slice(0,10);
  const histHtml = recent.length ? recent.map(s => {
    const parts = (s.Fecha_Inicio||'').split('/');
    const day = parts[0]||'?';
    const monIdx = (Number(parts[1])-1)||0;
    const monStr = monthNames[monIdx]?.slice(0,3).toUpperCase()||'';
    return `
      <div class="card history-session-card tap" data-action="ver-sesion-hist" data-id="${s.SesionID}">
        <div class="hsc-date-box">
          <div class="hsc-day">${day}</div>
          <div class="hsc-mon">${monStr}</div>
        </div>
        <div class="hsc-info">
          <div class="hsc-name">${s.Nombre_Dia||'Sesión'}</div>
          <div class="hsc-meta">${s.Programa} · Semana ${s.Semana}</div>
        </div>
        <div class="hsc-arrow">→</div>
      </div>`;
  }).join('') : '<div class="empty"><div class="empty-icon">📅</div><div class="empty-title">Sin sesiones aún</div><div class="empty-sub">Completa tu primera sesión para ver el historial.</div></div>';

  return `
    ${getStatusBar()}
    <div class="topbar">
      <div class="topbar-title">HISTORIAL</div>
    </div>
    <div class="scroll">
      <div class="pad">
        <div class="cal-header">
          <button class="cal-nav-btn" data-action="cal-prev">‹</button>
          <div class="cal-month">${monthNames[month]} ${year}</div>
          <button class="cal-nav-btn" data-action="cal-next">›</button>
        </div>
        <div class="cal-grid">
          ${dayLabels}
          ${calCells.join('')}
        </div>
        <div class="section-label" style="margin-top:24px;">Sesiones recientes</div>
        ${histHtml}
        <div style="height:20px"></div>
      </div>
    </div>
    ${renderBottomNav('history')}`;
}

// ---- BOTTOM NAV ----
function renderBottomNav(active) {
  const items = [
    { id:'home',    icon:'🏠', label:'Inicio'  },
    { id:'program', icon:'📋', label:'Programa'},
    { id:'history', icon:'📅', label:'Historial'},
  ];
  return `<div class="bottom-nav">
    ${items.map(it=>`
      <div class="nav-item ${active===it.id?'active':''}" data-action="nav" data-screen="${it.id}">
        <div class="nav-icon">${it.icon}</div>
        <div class="nav-dot"></div>
        <div class="nav-label">${it.label}</div>
      </div>`).join('')}
  </div>`;
}

// ---- EVENT DELEGATION ----
function attachEvents(screenId, el) {
  el.addEventListener('click', async e => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    switch(action) {
      case 'back':
        handleBack();
        break;
      case 'nav':
        handleNav(target.dataset.screen);
        break;
      case 'open-program':
        State.program = target.dataset.prog;
        goTo('program');
        break;
      case 'open-week':
        State.semana = Number(target.dataset.semana);
        goTo('days');
        break;
      case 'open-day':
        State.dia = Number(target.dataset.dia);
        State.ejerciciosActivos = [];
        State.seriesRegistradas = [];
        State.sesionActiva = null;
        goTo('workout');
        break;
      case 'empezar-sesion':
        await empezarSesion();
        break;
      case 'start-ex':
        startExercise(target.dataset.ejercicio, target.dataset.tipo);
        break;
      case 'confirmar-serie':
        await confirmarSerie(el);
        break;
      case 'skip-timer':
        skipTimer();
        break;
      case 'add-time':
        State.timerRemaining += 30;
        break;
      case 'go-home':
        resetSession();
        goTo('home');
        break;
      case 'cal-prev':
        State.calMonth = State.calMonth !== undefined ? State.calMonth : new Date().getMonth();
        State.calMonth--;
        if (State.calMonth < 0) { State.calMonth = 11; State.calYear = (State.calYear||new Date().getFullYear())-1; }
        goTo('history');
        break;
      case 'cal-next':
        State.calMonth = State.calMonth !== undefined ? State.calMonth : new Date().getMonth();
        State.calMonth++;
        if (State.calMonth > 11) { State.calMonth = 0; State.calYear = (State.calYear||new Date().getFullYear())+1; }
        goTo('history');
        break;
      case 'ver-sesion':
      case 'ver-sesion-hist':
        showToast('Detalle de sesión próximamente');
        break;
    }
  });

  // Counters
  el.querySelectorAll('.cnt-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const field = btn.dataset.counter;
      const delta = Number(btn.dataset.delta);
      const valEl = el.querySelector(`#cnt-${field}`);
      if (!valEl) return;
      const newVal = Math.max(0, Number(valEl.textContent) + delta);
      valEl.textContent = newVal;
    });
  });

  // RPE pips
  el.querySelectorAll('.rpe-pip').forEach(pip => {
    pip.addEventListener('click', () => {
      const val = Number(pip.dataset.rpe);
      el.querySelectorAll('.rpe-pip').forEach((p,i) => p.classList.toggle('active', i<val));
      const numEl = el.querySelector('#rpe-num');
      const descEl = el.querySelector('#rpe-desc');
      if (numEl) numEl.textContent = val;
      if (descEl) descEl.textContent = CONFIG.RPE_DESC[val];
    });
  });

  // RIR
  el.querySelectorAll('.rir-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      el.querySelectorAll('.rir-opt').forEach(o=>o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  // Banda
  el.querySelectorAll('.banda-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      el.querySelectorAll('.banda-opt').forEach(o=>o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  // Anclaje
  el.querySelectorAll('.anclaje-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      el.querySelectorAll('.anclaje-opt').forEach(o=>o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });
}

function handleBack() {
  const map = {
    program: 'home',
    days: 'program',
    workout: 'days',
    register: 'workout',
    timer: 'register',
    summary: 'home',
  };
  const dest = map[State.screen];
  if (dest) goTo(dest);
}

function handleNav(screen) {
  if (screen === 'home') goTo('home');
  else if (screen === 'program') {
    if (State.program) goTo('program');
    else goTo('home');
  }
  else if (screen === 'history') goTo('history');
}

// ---- SESSION LOGIC ----
async function empezarSesion() {
  if (!State.sesionActiva) {
    const sesionID = uid();
    const exPlant = State.plantillas.filter(p =>
      p.Programa===State.program && Number(p.Semana)===State.semana && Number(p.Dia)===State.dia
    ).sort((a,b)=>Number(a.Orden)-Number(b.Orden));

    State.sesionActiva = {
      SesionID: sesionID,
      Programa: State.program,
      Semana: State.semana,
      Dia: State.dia,
      Nombre_Dia: exPlant[0]?.Nombre_Dia || `S${State.semana}D${State.dia}`,
      Fecha_Inicio: now(),
      Fecha_Fin: '',
      Completada: 'No',
      Notas: '',
      _startTs: Date.now(),
    };
    State.ejerciciosActivos = exPlant;

    // Guardar sesión en Sheets
    try {
      await Sheets.append(CONFIG.SHEETS.SESIONES, [
        sesionID, State.program, State.semana, State.dia,
        State.sesionActiva.Nombre_Dia, State.sesionActiva.Fecha_Inicio,
        '', 'No', ''
      ]);
      showToast('Sesión iniciada ✓');
    } catch(err) {
      showToast('Sin conexión — guardando local', 'error');
    }
  }

  // Ir al primer ejercicio sin completar
  const done = new Set(State.seriesRegistradas.map(s=>s.Ejercicio));
  const next = State.ejerciciosActivos.find(e => {
    if (e.Tipo === 'Calentamiento') return false;
    const seriesObj = Number(e.Series_Obj)||3;
    return State.seriesRegistradas.filter(s=>s.Ejercicio===e.Ejercicio).length < seriesObj;
  });

  if (next) {
    startExercise(next.Ejercicio, next.Tipo);
  } else {
    await finalizarSesion();
  }
}

function startExercise(nombre, tipo) {
  const seriesObj = Number(State.ejerciciosActivos.find(e=>e.Ejercicio===nombre)?.Series_Obj)||3;
  const done = State.seriesRegistradas.filter(s=>s.Ejercicio===nombre).length;
  State.currentExNombre = nombre;
  State.currentExTipo = tipo;
  State.currentSerie = done + 1;
  goTo('register');
}

async function confirmarSerie(el) {
  const reps = Number(el.querySelector('#cnt-reps')?.textContent) || 0;
  const descanso = Number(el.querySelector('#cnt-descanso')?.textContent) || 90;
  const rpe = Number(el.querySelector('#rpe-num')?.textContent) || 7;
  const rir = el.querySelector('.rir-opt.selected')?.dataset.rir || '2';
  const banda = el.querySelector('.banda-opt.selected')?.dataset.banda || '';
  const anclaje = el.querySelector('.anclaje-opt.selected')?.dataset.anclaje || '';
  const elongacion = Number(el.querySelector('#cnt-elongacion')?.textContent) || '';
  const pesoBanda = Number(el.querySelector('#cnt-pesoBanda')?.textContent) || '';
  const pesoKB = Number(el.querySelector('#cnt-pesoKB')?.textContent) || '';

  const exID = uid();
  const exPlant = State.ejerciciosActivos.find(e=>e.Ejercicio===State.currentExNombre)||{};

  const row = {
    EjercicioID: exID,
    SesionID: State.sesionActiva?.SesionID || '',
    Orden: exPlant.Orden || '',
    Tipo: State.currentExTipo,
    Grupo_Superset: exPlant.Grupo_Superset || '',
    Ejercicio: State.currentExNombre,
    Equipo: exPlant.Equipo || 'Corporal',
    Series_Obj: exPlant.Series_Obj || 3,
    N_Serie: State.currentSerie,
    Reps: reps,
    Peso_KB: pesoKB,
    Color_Banda: banda,
    Anclaje_Banda: anclaje,
    Elongacion_cm: elongacion,
    Peso_Banda_kg: pesoBanda,
    Descanso_seg: descanso,
    RPE: rpe,
    RIR: rir,
    Notas: '',
  };

  State.seriesRegistradas.push(row);
  State.ejerciciosAll.push(row); // actualizar cache local

  // Guardar en Sheets
  try {
    await Sheets.append(CONFIG.SHEETS.EJERCICIOS, Object.values(row));
  } catch(err) {
    console.warn('Sin conexión, guardado local');
  }

  showToast(`Serie ${State.currentSerie} registrada ✓`);

  // Determinar siguiente
  const seriesObj = Number(exPlant.Series_Obj)||3;
  const tipo = State.currentExTipo;

  if (State.currentSerie < seriesObj) {
    // Hay más series de este ejercicio
    if (tipo === 'Superset' || tipo === 'Circuito') {
      // Alternar al compañero del grupo
      const grupo = exPlant.Grupo_Superset;
      const compas = State.ejerciciosActivos.filter(e=>e.Grupo_Superset===grupo&&e.Tipo===tipo);
      const currentIdx = compas.findIndex(e=>e.Ejercicio===State.currentExNombre);
      const nextIdx = (currentIdx+1) % compas.length;
      const nextEx = compas[nextIdx];

      // Si volvemos al primero, incrementar serie
      if (nextIdx === 0) State.currentSerie++;

      State.nextExNombre = nextEx.Ejercicio;
      startTimerThen(() => startExercise(nextEx.Ejercicio, nextEx.Tipo), descanso);
    } else {
      State.currentSerie++;
      State.nextExNombre = State.currentExNombre;
      startTimerThen(() => startExercise(State.currentExNombre, tipo), descanso);
    }
  } else {
    // Ejercicio completo — buscar siguiente
    const nextEx = State.ejerciciosActivos.find(e => {
      if (e.Tipo === 'Calentamiento') return false;
      // Si es del mismo grupo, ya se maneja arriba
      if ((e.Tipo==='Superset'||e.Tipo==='Circuito') && e.Grupo_Superset===exPlant.Grupo_Superset) return false;
      const obj = Number(e.Series_Obj)||3;
      return State.seriesRegistradas.filter(s=>s.Ejercicio===e.Ejercicio).length < obj;
    });

    if (nextEx) {
      State.nextExNombre = nextEx.Ejercicio;
      startTimerThen(() => startExercise(nextEx.Ejercicio, nextEx.Tipo), descanso);
    } else {
      await finalizarSesion();
    }
  }
}

function startTimerThen(callback, seconds) {
  if (State.timerInterval) clearInterval(State.timerInterval);
  State.timerSeconds = seconds;
  State.timerRemaining = seconds;
  State._timerCallback = callback;
  goTo('timer');

  State.timerInterval = setInterval(() => {
    State.timerRemaining--;
    // Update display
    const disp = document.getElementById('timer-display');
    const fill = document.getElementById('timer-ring-fill');
    if (disp) {
      disp.textContent = `${pad(Math.floor(State.timerRemaining/60))}:${pad(State.timerRemaining%60)}`;
      if (State.timerRemaining <= 10) { disp.classList.add('warning'); fill?.classList.add('warning'); }
    }
    if (fill) {
      const circ = 2 * Math.PI * 80;
      fill.setAttribute('stroke-dashoffset', circ * (1 - State.timerRemaining/State.timerSeconds));
    }
    if (State.timerRemaining <= 0) {
      clearInterval(State.timerInterval);
      State.timerInterval = null;
      if (State._timerCallback) State._timerCallback();
    }
  }, 1000);
}

function skipTimer() {
  if (State.timerInterval) { clearInterval(State.timerInterval); State.timerInterval = null; }
  if (State._timerCallback) State._timerCallback();
}

async function finalizarSesion() {
  if (State.timerInterval) clearInterval(State.timerInterval);
  const fin = now();
  if (State.sesionActiva) {
    State.sesionActiva.Fecha_Fin = fin;
    State.sesionActiva.Completada = 'Sí';
    // Actualizar en Sheets (append fila actualizada — simplificado)
    try {
      await Sheets.append(CONFIG.SHEETS.SESIONES, [
        State.sesionActiva.SesionID+'_fin', State.program, State.semana, State.dia,
        State.sesionActiva.Nombre_Dia, State.sesionActiva.Fecha_Inicio, fin, 'Sí', ''
      ]);
    } catch(e) { console.warn(e); }
    State.sesiones.push({...State.sesionActiva});
  }
  goTo('summary');
}

function resetSession() {
  State.sesionActiva = null;
  State.ejerciciosActivos = [];
  State.seriesRegistradas = [];
  State.currentExNombre = null;
  State.currentExTipo = null;
  State.currentSerie = 1;
}

// ---- INIT ----
async function init() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="screen active" style="align-items:center;justify-content:center;display:flex;flex-direction:column;gap:16px;">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:48px;letter-spacing:0.06em;color:var(--accent);">MOMENTUM</div>
    <div class="spinner"></div>
    <div class="loading-text">Cargando programa...</div>
  </div>`;

  try {
    const [plantRows, sesRows, exRows] = await Promise.all([
      Sheets.get(`${CONFIG.SHEETS.PLANTILLAS}!A:K`),
      Sheets.get(`${CONFIG.SHEETS.SESIONES}!A:I`),
      Sheets.get(`${CONFIG.SHEETS.EJERCICIOS}!A:S`),
    ]);
    State.plantillas = Sheets.rowsToObjects(plantRows);
    State.sesiones = Sheets.rowsToObjects(sesRows);
    State.ejerciciosAll = Sheets.rowsToObjects(exRows);
  } catch(err) {
    console.error('Error cargando datos:', err);
    showToast('Error al cargar. Comprueba la API Key.', 'error');
  }

  app.innerHTML = '';
  render();
}

document.addEventListener('DOMContentLoaded', init);
