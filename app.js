// ============================================
// MOMENTUM TRAINING — app.js v3
// Diseño motivacional azul + Google Sheets
// ============================================

function getEmoji(nombre) {
  if (!nombre) return '⚡';
  const n = nombre.toLowerCase();
  if (n.includes('calentamiento')) return '🔥';
  if (n.includes('flexion')||n.includes('flexión')||n.includes('push')) return '💪';
  if (n.includes('sentadilla')||n.includes('squat')||n.includes('split')) return '🦵';
  if (n.includes('desplante')||n.includes('lunge')||n.includes('zancada')) return '🏃';
  if (n.includes('plancha')||n.includes('plank')||n.includes('toque')) return '🧘';
  if (n.includes('remo')||n.includes('row')) return '🚣';
  if (n.includes('swing')||n.includes('kettlebell')) return '🏋️';
  if (n.includes('step')) return '⬆️';
  if (n.includes('sit')||n.includes('abdom')||n.includes('crunch')) return '🤸';
  if (n.includes('burpee')) return '🔥';
  return '⚡';
}

const State = {
  screen:'home', programa:null, semana:null, dia:null,
  plantillas:[], sesiones:[], ejerciciosAll:[],
  sesionActiva:null, seriesRegistradas:[],
  ejerciciosDia:[], currentExIdx:0, currentSerie:0, currentReps:0,
  calYear:new Date().getFullYear(), calMonth:new Date().getMonth(),
};

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function pad(n){return String(n).padStart(2,'0')}
function nowStr(){const d=new Date();return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`}
function getTime(){const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}`}

let _toastT,_savedT;
function showToast(msg,type=''){
  const t=document.getElementById('toast');if(!t)return;
  t.textContent=msg;t.className='toast'+(type?' '+type:'')+' show';
  clearTimeout(_toastT);_toastT=setTimeout(()=>t.className='toast',2500);
}
function showSaved(){
  const b=document.getElementById('saved-badge');if(!b)return;
  b.classList.add('show');clearTimeout(_savedT);_savedT=setTimeout(()=>b.classList.remove('show'),1500);
}

function renderAndShow(id){
  const app=document.getElementById('app');
  const old=document.getElementById('sc-'+id);if(old)old.remove();
  const div=document.createElement('div');
  div.className='screen';div.id='sc-'+id;
  const fns={home:renderHome,weeks:renderWeeks,days:renderDays,overview:renderOverview,prep:renderPrep,exercise:renderExercise,summary:renderSummary,history:renderHistory};
  div.innerHTML=(fns[id]||(()=>'<div class="loading"><div class="load-txt">Pantalla no encontrada</div></div>'))();
  app.appendChild(div);
  requestAnimationFrame(()=>{
    document.querySelectorAll('#app .screen').forEach(s=>s.classList.remove('active'));
    div.classList.add('active');
  });
  setTimeout(()=>app.querySelectorAll('.screen:not(.active)').forEach(s=>s.remove()),400);
  if(id==='prep')setTimeout(startCd,200);
}

function geoBg(){
  return `<div class="geo">
    <div class="gc" style="width:180px;height:180px;top:-70px;right:-60px"></div>
    <div class="gc" style="width:100px;height:100px;bottom:120px;left:-40px;border-color:rgba(245,200,0,.1)"></div>
    <div class="gc" style="width:70px;height:70px;top:38%;right:18px;border-color:rgba(255,255,255,.04)"></div>
    <div class="gd" style="width:10px;height:10px;top:28%;left:28px;background:rgba(245,200,0,.3)"></div>
    <div class="gd" style="width:7px;height:7px;top:18%;right:70px;background:rgba(255,255,255,.2)"></div>
  </div>`;
}

function getEjerciciosDia(){
  if(!State.programa||!State.semana||!State.dia)return[];
  return State.plantillas.filter(p=>p.Programa===State.programa&&Number(p.Semana)===State.semana&&Number(p.Dia)===State.dia).sort((a,b)=>Number(a.Orden)-Number(b.Orden));
}
function getUltimaVez(nombre){
  return State.ejerciciosAll.filter(e=>e.Ejercicio===nombre&&e.Reps).sort((a,b)=>(b.EjercicioID||'').localeCompare(a.EjercicioID||''))[0]||null;
}
function getSemanasPrograma(prog){
  return[...new Set(State.plantillas.filter(p=>p.Programa===prog).map(p=>Number(p.Semana)))].sort((a,b)=>a-b);
}
function getSesionesPrograma(prog){return State.sesiones.filter(s=>s.Programa===prog).length}
function getProgresoPrograma(prog){
  const sems=getSemanasPrograma(prog);
  const hechas=[...new Set(State.sesiones.filter(s=>s.Programa===prog).map(s=>Number(s.Semana)))];
  return sems.length?`S${hechas.length||1}/${sems.length}`:'—';
}
function getMaterialDia(exs){
  const hasBanda=exs.some(e=>e.Equipo==='Banda'),hasKB=exs.some(e=>e.Equipo==='Kettlebell');
  const items=[];
  if(hasBanda)items.push({dot:'#FF3B30',label:'Bandas elásticas'});
  if(hasKB)items.push({emoji:'🏋️',label:'Kettlebell'});
  if(!hasBanda&&!hasKB)items.push({emoji:'🏃',label:'Peso corporal'});
  return items;
}
function calcRacha(){
  const dates=State.sesiones.map(s=>{const p=(s.Fecha_Inicio||'').split(/[\/,\s]+/);if(p.length>=3)return new Date(p[2],p[1]-1,p[0]).toDateString();return null;}).filter(Boolean);
  const unique=[...new Set(dates)].map(d=>new Date(d)).sort((a,b)=>b-a);
  let r=0;const today=new Date();today.setHours(0,0,0,0);
  for(let i=0;i<unique.length;i++){const d=new Date(unique[i]);d.setHours(0,0,0,0);const diff=Math.round((today-d)/(1000*60*60*24));if(diff===i||diff===i+1)r++;else break;}
  return r;
}
function calcTotalUltima(prog,semana,dia){
  const ses=State.sesiones.filter(s=>s.Programa===prog&&Number(s.Semana)===semana&&Number(s.Dia)===dia);
  if(!ses.length)return'—';
  const last=ses[ses.length-1];
  const exs=State.ejerciciosAll.filter(e=>e.SesionID===last.SesionID);
  return exs.reduce((t,e)=>t+Number(e.Reps||0),0)||'—';
}
function renderWeekDots(){
  const hoy=new Date();hoy.setHours(0,0,0,0);
  const lunes=new Date(hoy);lunes.setDate(hoy.getDate()-((hoy.getDay()+6)%7));
  return['L','M','X','J','V','S','D'].map((d,i)=>{
    const fecha=new Date(lunes);fecha.setDate(lunes.getDate()+i);
    const isHoy=fecha.toDateString()===hoy.toDateString();
    const hasSes=State.sesiones.some(s=>{const p=(s.Fecha_Inicio||'').split(/[\/,\s]+/);if(p.length>=3){const sd=new Date(p[2],p[1]-1,p[0]);return sd.toDateString()===fecha.toDateString();}return false;});
    const cls=hasSes?'done':isHoy?'today':'';
    return`<div class="day ${isHoy?'today':''}"><div class="day-c ${cls}">${hasSes?'✓':fecha.getDate()}</div><div class="day-n">${d}</div></div>`;
  }).join('');
}
function renderProgCards(){
  const progs=[...new Set(State.plantillas.map(p=>p.Programa))];
  return progs.map(prog=>{
    const sems=getSemanasPrograma(prog);
    const isKB=prog.toLowerCase().includes('kettle')||prog.toLowerCase().includes('kb');
    const color=isKB?'#FF3A5C':'#F5C800';
    return`<div style="margin:0 18px 10px;padding:16px 18px;border-radius:20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);cursor:pointer;border-left:3px solid ${color}" onclick="State.programa='${prog}';renderAndShow('weeks')">
      <div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${color};margin-bottom:6px">● ${getSesionesPrograma(prog)} sesiones completadas</div>
      <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;margin-bottom:4px">${prog.toUpperCase()}</div>
      <div style="font-size:13px;color:var(--t2)">${isKB?'Kettlebells · Bandas · Corporal':'Peso corporal · Bandas elásticas'}</div>
      <div style="display:flex;gap:20px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)">
        <div><div style="font-family:'Syne',sans-serif;font-size:22px;color:${color}">${sems.length}</div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.1em;font-weight:700">Semanas</div></div>
        <div><div style="font-family:'Syne',sans-serif;font-size:22px;color:${color}">4</div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.1em;font-weight:700">Días/sem</div></div>
        <div><div style="font-family:'Syne',sans-serif;font-size:22px;color:${color}">${getProgresoPrograma(prog)}</div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.1em;font-weight:700">Progreso</div></div>
      </div>
    </div>`;
  }).join('');
}

function renderHome(){
  let nextInfo=null;
  if(State.plantillas.length&&State.programa){
    const prog=State.programa;
    for(const s of getSemanasPrograma(prog)){
      const dias=[...new Set(State.plantillas.filter(p=>p.Programa===prog&&Number(p.Semana)===s).map(p=>Number(p.Dia)))].sort((a,b)=>a-b);
      for(const d of dias){if(!State.sesiones.find(se=>se.Programa===prog&&Number(se.Semana)===s&&Number(se.Dia)===d)){nextInfo={semana:s,dia:d,prog};break;}}
      if(nextInfo)break;
    }
  }
  const racha=calcRacha();
  const exsDia=nextInfo?State.plantillas.filter(p=>p.Programa===nextInfo.prog&&Number(p.Semana)===nextInfo.semana&&Number(p.Dia)===nextInfo.dia):[];
  const exCount=exsDia.filter(e=>e.Tipo!=='Calentamiento').length;
  const mats=getMaterialDia(exsDia);
  // Si no hay siguiente, sugerir el día 1 semana 1 igualmente (modo libre)
  if(!nextInfo && State.programa) {
    const prog=State.programa;
    const sems=getSemanasPrograma(prog);
    if(sems.length) nextInfo={semana:sems[0],dia:1,prog};
  }
  const heroContent=nextInfo
    ?`<div class="hero-lbl">Sesión recomendada · Semana ${nextInfo.semana}</div>
      <div class="hero-name">${nextInfo.prog.toUpperCase()}<br>S${nextInfo.semana}D${nextInfo.dia}</div>
      <div class="hero-pills"><div class="hero-pill">⚡ ${exCount} ejercicios</div><div class="hero-pill">⏱ ~45 min</div>${mats.map(m=>`<div class="hero-pill">${m.emoji||''} ${m.label}</div>`).join('')}</div>
      <div class="hero-rival">La última vez: <strong>${calcTotalUltima(nextInfo.prog,nextInfo.semana,nextInfo.dia)} reps</strong></div>
      <button class="hero-btn" onclick="openOverview('${nextInfo.prog}',${nextInfo.semana},${nextInfo.dia})">⚡ EMPEZAR HOY</button>`
    :`<div class="hero-name">SIN<br>PROGRAMA</div><div class="hero-rival">Comprueba la conexión con Sheets</div>`;

  return`${geoBg()}
    <div class="home-scroll" style="position:relative;z-index:1">
      <div class="home-top">
        <div class="streak">🔥 <span class="streak-n">${racha}</span> <span class="streak-l">días seguidos</span></div>
        <div class="home-greet">¡Buenas! A por ello,</div>
        <div class="home-title">¿LISTO<br>PARA <em>HOY?</em></div>
      </div>
      <div class="hero-card" onclick="${nextInfo?`openOverview('${nextInfo.prog}',${nextInfo.semana},${nextInfo.dia})`:''}">
        <div class="hero-illo"><div class="hero-illo-fallback" style="background:linear-gradient(135deg,#1557B0,#0D3B8E)">${nextInfo?getEmoji(exsDia.find(e=>e.Tipo!=='Calentamiento')?.Ejercicio||''):'🏆'}</div></div>
        <div class="hero-info">${heroContent}</div>
      </div>
      <div class="week-wrap"><div class="week-lbl">Esta semana</div><div class="days">${renderWeekDots()}</div></div>
      ${renderProgCards()}
      <div style="height:20px"></div>
    </div>
    ${renderTabs('home')}`;
}

function renderWeeks(){
  const prog=State.programa;if(!prog)return renderHome();
  const sems=getSemanasPrograma(prog);
  const sesHechas=State.sesiones.filter(s=>s.Programa===prog).map(s=>Number(s.Semana));
  const maxHecha=sesHechas.length?Math.max(...sesHechas):0;
  const pct=sems.length?Math.round((maxHecha/sems.length)*100):0;
  const weeksHtml=sems.map(s=>{
    const isDone=s<maxHecha,isCurr=s===(maxHecha||1);
    const sesDone=State.sesiones.filter(x=>x.Programa===prog&&Number(x.Semana)===s).length;
    return`<div class="week-item ${isDone?'done':''} ${isCurr?'current':''}" onclick="State.semana=${s};renderAndShow('days')">
      <div class="week-num">${s}</div>
      <div class="week-info"><div class="week-title-txt">Semana ${s}</div><div class="week-meta-txt">4 sesiones${isDone?` · ${sesDone} completadas`:isCurr?' · En curso':' · Pendiente'}</div></div>
      ${isCurr?'<div class="week-badge">ACTUAL</div>':isDone?'<span>✅</span>':'<span style="color:var(--t3)">🔒</span>'}
    </div>`;
  }).join('');
  return`${geoBg()}
    <div class="topbar"><div class="back-btn" onclick="renderAndShow('home')">←</div><div class="topbar-title">${prog.toUpperCase()}</div><div class="topbar-sub">${sems.length} sem.</div></div>
    <div class="scroll" style="position:relative;z-index:1;padding-bottom:20px">
      <div class="prog-wrap">
        <div class="prog-bar-card">
          <div class="prog-labels"><span>Progreso general</span><strong>Semana ${maxHecha||1} de ${sems.length}</strong></div>
          <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
        </div>
        ${weeksHtml}
      </div>
    </div>
    ${renderTabs('weeks')}`;
}

function renderDays(){
  const prog=State.programa,sem=State.semana;if(!prog||!sem)return renderHome();
  const dias=[...new Set(State.plantillas.filter(p=>p.Programa===prog&&Number(p.Semana)===sem).map(p=>Number(p.Dia)))].sort((a,b)=>a-b);
  const sesHechas=State.sesiones.filter(s=>s.Programa===prog&&Number(s.Semana)===sem).map(s=>Number(s.Dia));
  const nextDia=dias.find(d=>!sesHechas.includes(d));
  const daysHtml=dias.map(d=>{
    const isDone=sesHechas.includes(d),isNext=d===nextDia;
    const exs=State.plantillas.filter(p=>p.Programa===prog&&Number(p.Semana)===sem&&Number(p.Dia)===d);
    const exNoCal=exs.filter(e=>e.Tipo!=='Calentamiento');
    const ssG=[...new Set(exs.filter(e=>e.Tipo==='Superset').map(e=>e.Grupo_Superset))];
    const mats=getMaterialDia(exs);
    return`<div class="day-card ${isDone?'completed':''} ${isNext?'next-up':''}" onclick="openOverview('${prog}',${sem},${d})">
      ${isNext?'<div class="day-next-badge">SIGUIENTE</div>':''}
      <div class="day-card-num">Sesión ${d}</div>
      <div class="day-card-name">${prog.toUpperCase()} S${sem}D${d}</div>
      <div class="day-chips">
        ${isDone?'<div class="day-chip">✅ Completada</div>':''}
        <div class="day-chip">${exNoCal.length} ejercicios</div>
        ${ssG.length?`<div class="day-chip ss">${ssG.length}× Superset</div>`:''}
        ${mats.filter(m=>m.dot||m.emoji==='🏋️').map(m=>`<div class="day-chip mat">${m.emoji||'🎯'} ${m.label}</div>`).join('')}
      </div>
      <div class="day-footer"><div class="day-count">${isDone?'Completada':'~45 min'}</div>${!isDone?'<div style="font-size:16px;color:var(--t3)">→</div>':''}</div>
    </div>`;
  }).join('');
  return`${geoBg()}
    <div class="topbar"><div class="back-btn" onclick="renderAndShow('weeks')">←</div><div class="topbar-title">SEMANA ${sem}</div><div class="topbar-sub">${prog}</div></div>
    <div class="scroll" style="position:relative;z-index:1;padding:0 18px 20px">${daysHtml}</div>
    ${renderTabs('days')}`;
}

function openOverview(prog,semana,dia){State.programa=prog;State.semana=semana;State.dia=dia;renderAndShow('overview');}

function renderOverview(){
  const exs=getEjerciciosDia();if(!exs.length){renderAndShow('home');return'';}
  const mats=getMaterialDia(exs);
  const matHtml=mats.map(m=>`<div class="mat-chip">${m.dot?`<div class="mat-dot" style="background:${m.dot}"></div>`:''} ${m.emoji||''} ${m.label}</div>`).join('');
  const listHtml=exs.map(ex=>{
    const tipo=ex.Tipo||'Serie';
    const last=getUltimaVez(ex.Ejercicio);
    const typeClass=tipo==='Calentamiento'?'calent':tipo==='Superset'?'ss':tipo==='Circuito'?'cir':'serie';
    const typeLabel=tipo==='Superset'?`Superset ${ex.Grupo_Superset||''}`:tipo;
    const matRow=ex.Equipo==='Banda'?`<div class="ov-item-mats"><div class="ov-mat"><div class="ov-mat-dot" style="background:#FF3B30"></div>Banda</div></div>`:ex.Equipo==='Kettlebell'?`<div class="ov-item-mats"><div class="ov-mat">🏋️ Kettlebell</div></div>`:'';
    return`<div class="ov-item">
      <div class="ov-thumb">${getEmoji(ex.Ejercicio)}</div>
      <div><div class="ov-type-badge ${typeClass}">${typeLabel}</div><div class="ov-item-name">${ex.Ejercicio}</div><div class="ov-item-sub">${ex.Series_Obj||3} series · ${last?last.Reps+' reps anterior':'Primera vez'}</div>${matRow}</div>
    </div>`;
  }).join('');
  return`${geoBg()}
    <div class="scroll" style="position:relative;z-index:1;padding-bottom:20px">
      <div class="ov-header">
        <div class="ov-back" onclick="renderAndShow('days')">← Volver</div>
        <div class="ov-lbl">Guía · Semana ${State.semana} · Sesión ${State.dia}</div>
        <div class="ov-title">HOY<br><em>ENTRENAS</em></div>
        <div class="ov-sub">${exs.length} ejercicios · ~45 min</div>
      </div>
      <div class="mat-banner"><div class="mat-title">📦 Material que necesitas hoy</div><div class="mat-chips">${matHtml}</div></div>
      <div class="ov-list">${listHtml}</div>
      <div class="ov-cta"><button class="ov-btn" onclick="startWorkout()">⚡ ¡EMPEZAR AHORA!</button></div>
    </div>`;
}

async function startWorkout(){
  const exs=getEjerciciosDia();
  State.ejerciciosDia=exs;State.currentExIdx=0;State.currentSerie=0;State.seriesRegistradas=[];
  const sesionID=uid();
  const ses={SesionID:sesionID,Programa:State.programa,Semana:State.semana,Dia:State.dia,Nombre_Dia:`S${State.semana}D${State.dia} ${State.programa}`,Fecha_Inicio:nowStr(),Fecha_Fin:'',Completada:'No',Notas:'',_startTs:Date.now()};
  State.sesionActiva=ses;Storage.saveSession(ses);
  try{await Sheets.append(CONFIG.SHEETS.SESIONES,[sesionID,State.programa,State.semana,State.dia,ses.Nombre_Dia,ses.Fecha_Inicio,'','No','']);}
  catch(e){showToast('Sin conexión — guardado local','err');}
  renderAndShow('prep');
}

let _cdTimer=null;
function stopCd(){if(_cdTimer){clearInterval(_cdTimer);_cdTimer=null;}}
function startCd(){
  stopCd();
  let secs=5;
  const fill=document.getElementById('cd-fill'),num=document.getElementById('cd-n');
  if(!fill||!num)return;
  const circ=131.9;
  _cdTimer=setInterval(()=>{
    secs--;num.textContent=secs;fill.style.strokeDashoffset=circ*(1-secs/5);
    if(secs<=0){stopCd();renderAndShow('exercise');}
  },1000);
}

function renderPrep(){
  const exs=State.ejerciciosDia,idx=State.currentExIdx,ex=exs[idx];
  if(!ex){renderAndShow('summary');return'';}
  const tipo=ex.Tipo||'Serie';
  const typeLabel=tipo==='Superset'?`Superset ${ex.Grupo_Superset}`:tipo;
  const last=getUltimaVez(ex.Ejercicio);
  let matHtml=`<div class="prep-row"><div class="prep-icon">🏃</div><div><div class="prep-item-name">Sin material</div><div class="prep-item-sub">Solo espacio libre</div></div></div>`;
  if(ex.Equipo==='Banda')matHtml=`<div class="prep-row"><div class="prep-icon"><div style="width:24px;height:24px;border-radius:50%;background:#FF3B30;margin:auto"></div></div><div><div class="prep-item-name">Banda elástica</div><div class="prep-item-sub">Anclaje bajo · ~80cm elongación</div></div></div>`;
  else if(ex.Equipo==='Kettlebell')matHtml=`<div class="prep-row"><div class="prep-icon">🏋️</div><div><div class="prep-item-name">Kettlebell ${last?.Peso_KB?last.Peso_KB+'kg':''}</div><div class="prep-item-sub">Prepara el peso adecuado</div></div></div>`;
  return`${geoBg()}
    <div class="prep-body">
      <div class="prep-back" onclick="renderAndShow('overview')">← Vista general</div>
      <div class="prep-eyebrow">${typeLabel} · Ejercicio ${idx+1} de ${exs.length}</div>
      <div class="prep-name">${ex.Ejercicio}</div>
      <div class="prep-hero">${getEmoji(ex.Ejercicio)}</div>
      <div class="prep-mat-box"><div class="prep-mat-lbl">🎒 Prepara tu material</div><div class="prep-rows">${matHtml}</div></div>
      <div class="prep-cd">
        <div class="cd-ring">
          <svg width="52" height="52" viewBox="0 0 52 52"><circle class="cd-bg" cx="26" cy="26" r="21"/><circle class="cd-fill" id="cd-fill" cx="26" cy="26" r="21" stroke-dasharray="131.9" stroke-dashoffset="0"/></svg>
          <div class="cd-n" id="cd-n">5</div>
        </div>
        <div class="cd-info"><strong id="cd-ex">${ex.Ejercicio}</strong>empieza en unos segundos</div>
      </div>
      <button class="prep-go" onclick="stopCd();renderAndShow('exercise')">YA ESTOY LISTO →</button>
    </div>`;
}

function getExBg(ex){
  const t=ex.Tipo||'Serie';
  if(t==='Superset')return'#2e1a00,#8c4a00';
  if(t==='Circuito')return'#002030,#004060';
  if(ex.Equipo==='Kettlebell')return'#1a0a30,#3d1a6e';
  return'#0d3b8e,#1a73e8';
}
function getTypeColor(tipo){if(tipo==='Superset')return'var(--orange)';if(tipo==='Circuito')return'#00CFFF';if(tipo==='Calentamiento')return'var(--purple)';return'var(--yellow)';}
function getExInGroup(ex,exs){return exs.filter(e=>e.Grupo_Superset===ex.Grupo_Superset&&e.Tipo===ex.Tipo&&Number(e.Orden)<Number(ex.Orden)).length;}
function getGroupTotal(ex,exs){return exs.filter(e=>e.Grupo_Superset===ex.Grupo_Superset&&e.Tipo===ex.Tipo).length;}

function renderExercise(){
  const exs=State.ejerciciosDia,idx=State.currentExIdx,ex=exs[idx];
  if(!ex){renderAndShow('summary');return'';}
  const tipo=ex.Tipo||'Serie';
  const isCalent=tipo==='Calentamiento';
  const last=getUltimaVez(ex.Ejercicio);
  const goalReps=last?Number(last.Reps)+1:Number(ex.Reps_Obj||12);
  State.currentReps=goalReps;
  const numSeries=Number(ex.Series_Obj||3);
  const tagClass=tipo==='Superset'?'ss':tipo==='Circuito'?'cir':tipo==='Calentamiento'?'calent':'serie';
  const tagLabel=tipo==='Superset'?`SS ${ex.Grupo_Superset}`:tipo==='Circuito'?'Circuito':tipo==='Calentamiento'?'Calent.':'Serie';
  let groupHtml='';
  if(tipo==='Superset'||tipo==='Circuito'){
    const total=getGroupTotal(ex,exs),pos=getExInGroup(ex,exs);
    const gpCls=tipo==='Superset'?'gp-ss':'gp-cir';
    groupHtml=`<div class="group-pill ${gpCls}"><div class="gp-dot"></div><div class="gp-txt">${tipo} ${ex.Grupo_Superset}</div><div class="gp-sub">· Ej ${pos+1} de ${total}</div></div>`;
  }
  let bandaHtml='';
  if(ex.Equipo==='Banda')bandaHtml=`<div class="banda-badge"><div class="bb-dots"><div class="bb-dot" style="background:#FF3B30"></div></div><div class="bb-sep"></div><div class="bb-kg">${last?.Peso_Banda_kg||'7-16'} kg</div><div class="bb-sep"></div><div class="bb-lbl">anclaje bajo</div></div>`;
  else if(ex.Equipo==='Kettlebell')bandaHtml=`<div class="banda-badge"><div class="bb-kg">🏋️ ${last?.Peso_KB||'—'} kg</div></div>`;
  const dotsHtml=Array.from({length:numSeries},(_,i)=>`<div class="sdot ${i===State.currentSerie?'active':i<State.currentSerie?'done':''}"></div>`).join('');

  if(isCalent){
    return`${geoBg()}
      <div class="ex-screen">
        <div class="ex-hero" style="background:linear-gradient(135deg,#2d0a4a,#4a1a7a)"><div style="font-size:100px;position:relative;z-index:1">🔥</div><div class="ex-hero-overlay"></div>
          <div class="ex-topbar"><div class="ex-back-btn" onclick="renderAndShow('overview')">←</div><div class="ex-prog"><span class="ep-num">1/${exs.length}</span><span class="ep-tag calent">Calent.</span></div></div>
        </div>
        <div class="calent-hero">
          <div class="calent-emoji">🔥</div>
          <div class="calent-title">CALENTAMIENTO</div>
          <div class="calent-sub">Prepara tu cuerpo.<br>Movilidad general.</div>
          <button class="calent-done-btn" id="calent-btn" onclick="doneCalent(this)">MARCAR COMO COMPLETADO ✓</button>
        </div>
        <div style="padding:0 18px max(18px,env(safe-area-inset-bottom));position:relative;z-index:1">
          <button style="width:100%;padding:14px;background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.18);border-radius:14px;color:var(--t2);font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer" onclick="nextExercise()">SALTAR →</button>
        </div>
      </div>`;
  }

  return`${geoBg()}
    <div class="ex-screen">
      <div class="ex-hero" style="background:linear-gradient(135deg,${getExBg(ex)})">
        <div style="font-size:110px;position:relative;z-index:1">${getEmoji(ex.Ejercicio)}</div>
        <div class="ex-hero-overlay"></div>
        <div class="ex-topbar">
          <div class="ex-back-btn" onclick="renderAndShow('overview')">←</div>
          <div class="ex-prog"><span class="ep-num">${idx+1}/${exs.length}</span><span class="ep-tag ${tagClass}">${tagLabel}</span></div>
        </div>
      </div>
      <div class="s-dots">${dotsHtml}</div>
      ${groupHtml}
      <div class="ex-content">
        <div>
          <div class="ex-type-row"><div class="ex-type-dot" style="background:${getTypeColor(tipo)}"></div><div class="ex-type-lbl">${tipo==='Superset'?`SS ${ex.Grupo_Superset} · Ej ${getExInGroup(ex,exs)+1}/${getGroupTotal(ex,exs)}`:tipo} · ${ex.Equipo||'Corporal'}</div></div>
          <div class="ex-name">${ex.Ejercicio}</div>
          ${bandaHtml}
        </div>
        <div>
          <div class="rival-card">
            <div class="riv-side"><div class="riv-vs">Última vez</div><div class="riv-n last">${last?last.Reps:'—'}</div><div class="riv-lbl">${last?'reps anteriores':'primera vez'}</div></div>
            <div class="riv-arr">→</div><div class="riv-sep"></div>
            <div class="riv-side"><div class="riv-vs">Tu reto hoy</div><div class="riv-n goal">${goalReps}</div><div class="riv-lbl">¡supérate!</div></div>
          </div>
          <div class="counter">
            <div class="cnt-btn" onclick="chReps(-1)">−</div>
            <div class="cnt-center"><div class="cnt-num" id="cnt-num">${goalReps}</div><div class="cnt-unit">repeticiones</div></div>
            <div class="cnt-btn" onclick="chReps(1)">+</div>
          </div>
          <button class="done-btn" id="done-btn" onclick="doneSerie()">✓ &nbsp; SERIE COMPLETADA</button>
        </div>
      </div>
    </div>`;
}

function chReps(d){State.currentReps=Math.max(0,State.currentReps+d);const el=document.getElementById('cnt-num');if(el)el.textContent=State.currentReps;}

function doneCalent(btn){
  btn.classList.add('done');btn.textContent='✓ COMPLETADO';
  showToast('Calentamiento completado ✓');showSaved();
  setTimeout(()=>nextExercise(),800);
}

function nextExercise(){
  State.currentExIdx++;
  if(State.currentExIdx>=State.ejerciciosDia.length){finishWorkout();return;}
  State.currentSerie=0;
  renderAndShow('prep');
}

async function doneSerie(){
  const btn=document.getElementById('done-btn');
  if(btn){btn.classList.add('done');btn.textContent='✓ ¡Hecho!';}
  const ex=State.ejerciciosDia[State.currentExIdx];
  const last=getUltimaVez(ex.Ejercicio);
  const isPR=State.currentReps>Number(last?.Reps||0);
  const numSeries=Number(ex.Series_Obj||3);
  const isLastSerie=State.currentSerie>=numSeries-1;
  const isLastEx=State.currentExIdx>=State.ejerciciosDia.length-1;
  await registerSerie(ex,State.currentSerie,State.currentReps);
  const cel=document.getElementById('cel');if(!cel)return;
  document.getElementById('cel-reps').textContent=State.currentReps;
  const diff=State.currentReps-Number(last?.Reps||0);
  document.getElementById('cel-vs').textContent=diff>0?`+${diff}`:diff===0?'=':diff;
  document.getElementById('cel-ser').textContent=`${State.currentSerie+1}/${numSeries}`;
  document.getElementById('cel-pr').style.display=isPR?'block':'none';
  document.getElementById('cel-hero').textContent=isLastEx&&isLastSerie?'🏆':isPR?'🌟':'🔥';
  if(isLastEx&&isLastSerie){document.getElementById('cel-title').innerHTML='¡ENTRENO<br>COMPLETADO!';document.getElementById('cel-sub').textContent='¡Lo has dado todo!';document.getElementById('cel-next').textContent='Ver resumen';document.getElementById('cel-go').textContent='VER RESUMEN →';}
  else if(isLastSerie){const nextEx=State.ejerciciosDia[State.currentExIdx+1];document.getElementById('cel-title').innerHTML='¡EJERCICIO<br>COMPLETADO!';document.getElementById('cel-sub').textContent=`${numSeries} series ✓`;document.getElementById('cel-next').textContent=nextEx?.Ejercicio||'Siguiente';document.getElementById('cel-go').textContent='SIGUIENTE →';}
  else{document.getElementById('cel-title').innerHTML='¡SERIE<br>HECHA!';document.getElementById('cel-sub').textContent=`Serie ${State.currentSerie+1} de ${numSeries}`;document.getElementById('cel-next').textContent=ex.Ejercicio;document.getElementById('cel-go').textContent='SIGUIENTE SERIE →';}
  setTimeout(()=>{cel.classList.add('show');spawnConfetti();},200);
}

function nextAfterCel(){
  const cel=document.getElementById('cel');if(cel)cel.classList.remove('show');
  const ex=State.ejerciciosDia[State.currentExIdx];
  const numSeries=Number(ex?.Series_Obj||3);
  const isLastSerie=State.currentSerie>=numSeries-1;
  const isLastEx=State.currentExIdx>=State.ejerciciosDia.length-1;
  if(isLastEx&&isLastSerie){finishWorkout();return;}
  if(isLastSerie){State.currentSerie=0;State.currentExIdx++;renderAndShow('prep');}
  else{State.currentSerie++;renderAndShow('exercise');}
}

async function finishWorkout(){
  const fin=nowStr();
  if(State.sesionActiva){
    State.sesionActiva.Fecha_Fin=fin;State.sesionActiva.Completada='Sí';
    State.sesiones.push({...State.sesionActiva});
    try{await Sheets.append(CONFIG.SHEETS.SESIONES,[State.sesionActiva.SesionID+'_fin',State.programa,State.semana,State.dia,State.sesionActiva.Nombre_Dia,State.sesionActiva.Fecha_Inicio,fin,'Sí',Storage.loadNotes()]);}catch(e){}
  }
  Storage.clearSession();renderAndShow('summary');
}

async function registerSerie(ex,serieIdx,reps){
  const row={EjercicioID:uid(),SesionID:State.sesionActiva?.SesionID||'',Orden:ex.Orden||'',Tipo:ex.Tipo||'Serie',Grupo_Superset:ex.Grupo_Superset||'',Ejercicio:ex.Ejercicio||'',Equipo:ex.Equipo||'Corporal',Series_Obj:ex.Series_Obj||3,N_Serie:serieIdx+1,Reps:reps,Peso_KB:'',Color_Banda:'',Anclaje_Banda:'',Elongacion_cm:'',Peso_Banda_kg:'',Descanso_seg:'',RPE:'',RIR:'',Notas:Storage.loadNotes()};
  State.seriesRegistradas.push(row);State.ejerciciosAll.push(row);
  try{await Sheets.append(CONFIG.SHEETS.EJERCICIOS,Object.values(row));}catch(e){console.warn('Error guardando:',e);}
  showSaved();
}

function renderSummary(){
  const racha=calcRacha();
  const exNames=[...new Set(State.seriesRegistradas.map(s=>s.Ejercicio))];
  const durMin=State.sesionActiva?Math.round((Date.now()-State.sesionActiva._startTs)/60000):0;
  const exHtml=exNames.map(n=>{
    const ss=State.seriesRegistradas.filter(s=>s.Ejercicio===n);
    const isPR=ss.some(s=>Number(s.Reps)>Number(getUltimaVez(n)?.Reps||0));
    return`<div class="sum-rec-item"><div class="sri-icon">${getEmoji(n)}</div><div class="sri-info"><div class="sri-name">${n}</div><div class="sri-detail">${ss.length} series · ${ss.map(s=>s.Reps).join('/')} reps</div></div>${isPR?'<div class="sri-pr">+1 PR</div>':''}</div>`;
  }).join('');
  return`${geoBg()}
    <div class="scroll" style="position:relative;z-index:1;padding-bottom:20px">
      <div class="sum-top"><div class="sum-eyebrow">Sesión completada · Semana ${State.semana}</div><div class="sum-title">¡LO HAS<br><em>DADO TODO!</em></div><div class="sum-sub">${State.programa} · ${durMin} minutos</div></div>
      <div class="sum-streak"><div class="ss-num">🔥${racha}</div><div class="ss-right"><div class="ss-lbl">Racha actual</div><div class="ss-sub2">días seguidos</div></div></div>
      <div class="sum-stats">
        <div class="sstat"><div class="sstat-v">${exNames.length}</div><div class="sstat-l">Ejercicios</div></div>
        <div class="sstat"><div class="sstat-v">${State.seriesRegistradas.length}</div><div class="sstat-l">Series</div></div>
        <div class="sstat"><div class="sstat-v">${exNames.filter(n=>State.seriesRegistradas.filter(s=>s.Ejercicio===n).some(s=>Number(s.Reps)>Number(getUltimaVez(n)?.Reps||0))).length}</div><div class="sstat-l">Récords</div></div>
      </div>
      <div class="sum-recs"><div class="sum-rec-lbl">Tus marcas de hoy</div>${exHtml||'<div style="color:var(--t2);font-size:13px;padding:16px 0">Sin series registradas</div>'}</div>
      <button class="sum-cta" onclick="renderAndShow('home')">VOLVER AL INICIO 🏠</button>
    </div>
    ${renderTabs('summary')}`;
}

function renderHistory(){
  const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const y=State.calYear,m=State.calMonth,now=new Date();
  const sessionDays=new Set();
  State.sesiones.forEach(s=>{const p=(s.Fecha_Inicio||'').split(/[\/,\s]+/);if(p.length>=3){const d=new Date(p[2],p[1]-1,p[0]);if(d.getFullYear()===y&&d.getMonth()===m)sessionDays.add(d.getDate());}});
  const firstDay=(new Date(y,m,1).getDay()+6)%7,daysInMonth=new Date(y,m+1,0).getDate();
  const lbls=['L','M','X','J','V','S','D'].map(d=>`<div class="cal-day-lbl">${d}</div>`).join('');
  let cells=Array(firstDay).fill('<div></div>');
  for(let d=1;d<=daysInMonth;d++){const isToday=d===now.getDate()&&m===now.getMonth()&&y===now.getFullYear();const hasSes=sessionDays.has(d);cells.push(`<div class="cal-day ${isToday?'today':''} ${hasSes?'has-session':''}">${d}${hasSes?'<div class="cal-dot"></div>':''}</div>`);}
  const recentHtml=[...State.sesiones].reverse().slice(0,12).map(s=>{const p=(s.Fecha_Inicio||'').split(/[\/,\s]+/);const day=p[0]||'?',mon=months[Number(p[1])-1]?.slice(0,3).toUpperCase()||'';return`<div class="ses-item"><div class="ses-date"><div class="ses-day">${day}</div><div class="ses-mon">${mon}</div></div><div class="ses-info"><div class="ses-name">${s.Nombre_Dia||'Sesión'}</div><div class="ses-meta">${s.Programa} · Semana ${s.Semana}</div></div></div>`;}).join('')||'<div class="empty"><div class="empty-ico">📅</div><div class="empty-ttl">Sin sesiones</div><div class="empty-sub">Completa tu primera sesión para ver el historial</div></div>';
  return`${geoBg()}
    <div class="topbar"><div class="topbar-title">HISTORIAL</div></div>
    <div class="scroll" style="position:relative;z-index:1;padding-bottom:20px">
      <div class="cal-header">
        <button class="cal-nav-btn" onclick="State.calMonth--;if(State.calMonth<0){State.calMonth=11;State.calYear--;}renderAndShow('history')">‹</button>
        <div class="cal-month">${months[m]} ${y}</div>
        <button class="cal-nav-btn" onclick="State.calMonth++;if(State.calMonth>11){State.calMonth=0;State.calYear++;}renderAndShow('history')">›</button>
      </div>
      <div class="cal-grid">${lbls}${cells.join('')}</div>
      <div class="recent-lbl">Sesiones recientes</div>${recentHtml}
    </div>
    ${renderTabs('history')}`;
}

function renderTabs(active){
  const tabs=[{id:'home',ico:'🏠',lbl:'Inicio',fn:"renderAndShow('home')"},{id:'entrena',ico:'⚡',lbl:'Entrena',fn:"renderAndShow('weeks')"},{id:'history',ico:'📅',lbl:'Historial',fn:"renderAndShow('history')"}];
  const activeId=active==='weeks'||active==='days'||active==='overview'||active==='prep'||active==='exercise'||active==='summary'?'entrena':active;
  return`<div class="tabs">${tabs.map(t=>`<div class="tab ${t.id===activeId?'on':''}" onclick="${t.fn}"><div class="tab-ico">${t.ico}</div><div class="tab-lbl">${t.lbl}</div></div>`).join('')}</div>`;
}

function openPause(){document.getElementById('pause-ov').classList.add('show');}
function resumePause(){document.getElementById('pause-ov').classList.remove('show');}

function spawnConfetti(){
  const c=document.getElementById('confetti');if(!c)return;c.innerHTML='';
  const cols=['#F5C800','#FF3A5C','#fff','#FF9500','#34C759','#00CFFF'];
  for(let i=0;i<55;i++){const p=document.createElement('div');p.className='particle';const sz=6+Math.random()*9;p.style.cssText=`left:${Math.random()*100}%;top:0;width:${sz}px;height:${sz}px;background:${cols[Math.floor(Math.random()*cols.length)]};border-radius:${Math.random()>.5?'50%':'3px'};animation-delay:${Math.random()*.5}s;animation-duration:${1.2+Math.random()*.8}s`;c.appendChild(p);}
}

async function init(){
  try{
    const[plantRows,sesRows,exRows]=await Promise.allSettled([Sheets.get(`${CONFIG.SHEETS.PLANTILLAS}!A:K`),Sheets.get(`${CONFIG.SHEETS.SESIONES}!A:I`),Sheets.get(`${CONFIG.SHEETS.EJERCICIOS}!A:T`)]);
    if(plantRows.status==='fulfilled')State.plantillas=Sheets.rowsToObjects(plantRows.value);
    if(sesRows.status==='fulfilled')State.sesiones=Sheets.rowsToObjects(sesRows.value);
    if(exRows.status==='fulfilled')State.ejerciciosAll=Sheets.rowsToObjects(exRows.value);
    if(!State.plantillas.length)showToast('Sin datos — comprueba la API Key','err');
  }catch(e){console.error('Error:',e);showToast('Error de conexión','err');}
  const progs=[...new Set(State.plantillas.map(p=>p.Programa))];
  if(progs.length)State.programa=progs[0];
  const savedSes=Storage.loadSession();
  if(savedSes){State.sesionActiva=savedSes;State.programa=savedSes.Programa;State.semana=Number(savedSes.Semana);State.dia=Number(savedSes.Dia);}
  renderAndShow('home');
}

document.addEventListener('DOMContentLoaded',init);
