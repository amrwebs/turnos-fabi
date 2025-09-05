// Admin with Templates (Plantillas). No auto-seeding; Fabi debe cargar horarios.
const SETTINGS_KEY = 'fabi_settings';
const SLOTS_KEY = 'fabi_slots';
const BOOKINGS_KEY = 'fabi_bookings';
const TPL_KEY = 'fabi_templates';
const SERVICES_KEY = 'fabi_services';

const $ = (sel) => document.querySelector(sel);

function fmtDate(d){
  const yyyy = d.getFullYear();
  const mm = ('0'+(d.getMonth()+1)).slice(-2);
  const dd = ('0'+d.getDate()).slice(-2);
  return `${yyyy}-${mm}-${dd}`;
}
function parseDate(str){ return new Date(str+'T00:00:00'); }
function timeToMinutes(t){ const [h,m] = t.split(':').map(Number); return h*60+m; }
function minutesToTime(min){ const h = String(Math.floor(min/60)).padStart(2,'0'); const m = String(min%60).padStart(2,'0'); return `${h}:${m}`; }

function rangeDates(from, to){
  const res = [];
  if(!from || !to) return res;
  const d = parseDate(from);
  const end = parseDate(to);
  while(d <= end){
    res.push(fmtDate(d));
    d.setDate(d.getDate()+1);
  }
  return res;
}

// --- Settings
function saveSettings(){
  const price = parseInt($('#priceInput').value || '0',10);
  const whatsapp = $('#waInput').value.trim();
  const mp = $('#mpInput').value.trim();
  const s = { price, whatsapp, mp_link: mp };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  alert('Configuración guardada');
}
function loadSettings(){
  const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
  if(!s) return;
  $('#priceInput').value = s.price ?? 0;
  $('#waInput').value = s.whatsapp ?? '';
  $('#mpInput').value = s.mp_link ?? '';
}

// --- Templates
function defaultTemplates(){
  return [
    { name:'Lun a Vie · 9 a 15 · 30min', start:'09:00', end:'15:00', dur:30, days:[1,2,3,4,5] },
    { name:'Sábados · 9 a 13 · 30min', start:'09:00', end:'13:00', dur:30, days:[6] },
  ];
}
function getTemplates(){
  const t = JSON.parse(localStorage.getItem(TPL_KEY) || 'null');
  return t || defaultTemplates();
}
function setTemplates(tpls){
  localStorage.setItem(TPL_KEY, JSON.stringify(tpls));
}
function refreshTplSelect(){
  const sel = $('#tplSelect');
  sel.innerHTML = '';
  getTemplates().forEach((t,i)=>{
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = t.name;
    sel.appendChild(opt);
  });
}

function readTplForm(){
  const name = $('#tplName').value.trim() || 'Nueva plantilla';
  const start = $('#tplStart').value;
  const end = $('#tplEnd').value;
  const dur = parseInt($('#tplDur').value,10);
  const days = Array.from(document.querySelectorAll('.tplDay:checked')).map(d=>parseInt(d.value,10));
  return { name, start, end, dur, days };
}
function writeTplForm(t){
  $('#tplName').value = t.name;
  $('#tplStart').value = t.start;
  $('#tplEnd').value = t.end;
  $('#tplDur').value = String(t.dur);
  document.querySelectorAll('.tplDay').forEach(cb=>{
    cb.checked = t.days.includes(parseInt(cb.value,10));
  });
}

function saveTpl(){
  const idx = parseInt($('#tplSelect').value || '-1',10);
  const tpls = getTemplates();
  const data = readTplForm();
  if(isNaN(idx) || idx < 0){ // add
    tpls.push(data);
  } else {
    tpls[idx] = data;
  }
  setTemplates(tpls);
  refreshTplSelect();
  alert('Plantilla guardada');
}

function deleteTpl(){
  const idx = parseInt($('#tplSelect').value || '-1',10);
  const tpls = getTemplates();
  if(isNaN(idx) || idx < 0) return alert('Seleccioná una plantilla');
  if(!confirm('¿Eliminar esta plantilla?')) return;
  tpls.splice(idx,1);
  setTemplates(tpls);
  refreshTplSelect();
}

function loadTplToForm(){
  const idx = parseInt($('#tplSelect').value || '0',10);
  const t = getTemplates()[idx];
  if(t) { writeTplForm(t); const badge = document.querySelector('#tplEditing'); if(badge) badge.style.display='inline-block'; }
}

// --- Slots generation
function applyTemplateToDates(tpl, dates){
  const all = JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}');
  dates.forEach(dateStr=>{
    const w = parseDate(dateStr).getDay();
    if(!tpl.days.includes(w)) return;
    const slots = [];
    let cur = timeToMinutes(tpl.start);
    const endMin = timeToMinutes(tpl.end);
    while(cur < endMin){
      slots.push({ time: minutesToTime(cur), blocked:false });
      cur += tpl.dur;
    }
    all[dateStr] = slots;
  });
  localStorage.setItem(SLOTS_KEY, JSON.stringify(all));
}

function applyTplWeek(){
  const idx = parseInt($('#tplSelect').value || '0',10);
  const tpl = getTemplates()[idx];
  if(!tpl) return;
  // current week Mon-Sun
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay();
  const diff = (day===0? -6 : 1 - day); // move to Monday
  monday.setDate(now.getDate()+diff);
  const sunday = new Date(monday); sunday.setDate(monday.getDate()+6);
  const dates = rangeDates(fmtDate(monday), fmtDate(sunday));
  applyTemplateToDates(tpl, dates);
  alert('Plantilla aplicada a esta semana');
  renderToday();
}

function applyTplRange(){
  const idx = parseInt($('#tplSelect').value || '0',10);
  const tpl = getTemplates()[idx];
  if(!tpl) return;
  const from = $('#fromDate').value;
  const to = $('#toDate').value;
  const dates = rangeDates(from, to);
  if(dates.length===0) return alert('Elegí un rango válido');
  applyTemplateToDates(tpl, dates);
  alert('Plantilla aplicada al rango');
  renderToday();
}

function genFromTplBtn(){
  applyTplRange();
}

// --- Block/Open/Reset and Today
function blockSlot(dateStr, time, blocked=true){
  const all = JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}');
  if(!all[dateStr]) return;
  all[dateStr] = all[dateStr].map(s => s.time===time ? {...s, blocked} : s);
  localStorage.setItem(SLOTS_KEY, JSON.stringify(all));
}

function openSlot(dateStr, time){
  blockSlot(dateStr, time, false);
}

function resetAll(){
  if(confirm('¿Borrar todos los turnos y reservas?')){
    localStorage.removeItem(SLOTS_KEY);
    localStorage.removeItem(BOOKINGS_KEY);
    alert('Datos borrados.');
    renderToday();
  }
}

function renderToday(){
  const cont = $('#todayList');
  cont.innerHTML = '';
  const today = fmtDate(new Date());
  const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '{}')[today] || [];
  const slots = JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}')[today] || [];

  if(slots.length===0){
    cont.innerHTML = '<p class="muted">No hay turnos cargados para hoy.</p>';
    return;
  }

  slots.forEach(s => {
    const item = document.createElement('div');
    item.className = 'item';
    const taken = bookings.some(b=>b.time===s.time);
    item.innerHTML = `
      <div><strong>${s.time}</strong> ${s.blocked?'<span class="badge">Bloqueado</span>':''} ${taken?'<span class="badge">Reservado</span>':''}</div>
      <div>
        <button class="btn outline" data-act="block" data-time="${s.time}">Bloquear</button>
        <button class="btn outline" data-act="open" data-time="${s.time}">Abrir</button>
      </div>
    `;
    cont.appendChild(item);
  });

  cont.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const time = btn.dataset.time;
    const today = fmtDate(new Date());
    if(btn.dataset.act === 'block'){
      blockSlot(today, time, true);
    } else if(btn.dataset.act === 'open'){
      openSlot(today, time);
    }
    renderToday();
  }, { once:true });
}

function setDefaults(){
  const today = fmtDate(new Date());
  $('#fromDate').value = today;
  $('#toDate').value = today;
  $('#blockDate').value = today;
  $('#openDate').value = today;
  $('#year').textContent = new Date().getFullYear();
}

function listeners(){
  $('#saveSettings').addEventListener('click', saveSettings);
  $('#saveTpl').addEventListener('click', saveTpl);
  $('#deleteTpl').addEventListener('click', deleteTpl);
  $('#tplSelect').addEventListener('change', loadTplToForm);
  $('#applyTplWeek').addEventListener('click', applyTplWeek);
  const tNew = document.querySelector('#tplNew'); if(tNew) tNew.addEventListener('click', tplNew);
  $('#applyTplRange').addEventListener('click', applyTplRange);
  $('#genFromTpl').addEventListener('click', genFromTplBtn);
  $('#resetBtn').addEventListener('click', resetAll);
  const add = document.querySelector('#svcAdd'); if(add) add.addEventListener('click', svcAdd);
  const del = document.querySelector('#svcDelete'); if(del) del.addEventListener('click', svcDelete);
  const nw = document.querySelector('#svcNew'); if(nw) nw.addEventListener('click', svcNew);
  $('#blockBtn').addEventListener('click',()=>{
    const d = $('#blockDate').value, t = $('#blockTime').value;
    if(!d || !t) return alert('Elegí fecha y hora');
    blockSlot(d,t,true); alert('Turno bloqueado'); renderToday();
  });
  $('#openBtn').addEventListener('click',()=>{
    const d = $('#openDate').value, t = $('#openTime').value;
    if(!d || !t) return alert('Elegí fecha y hora');
    openSlot(d,t); alert('Turno abierto'); renderToday();
  });
}

function main(){
  setDefaults();
  refreshTplSelect();
  loadTplToForm();
  loadSettings();
  listeners();
  renderServices();
  renderToday();
}

document.addEventListener('DOMContentLoaded', main);


// --- Services CRUD
function getServices(){
  return JSON.parse(localStorage.getItem(SERVICES_KEY) || '[]');
}
function setServices(s){ localStorage.setItem(SERVICES_KEY, JSON.stringify(s)); }
function renderServices(){
  const list = document.querySelector('#svcList');
  if(!list) return;
  const s = getServices();
  list.innerHTML = '';
  if(s.length===0){
    const p = document.createElement('p'); p.className='muted'; p.textContent='Sin servicios aún.'; list.appendChild(p);
  }
  s.forEach((svc, idx)=>{
    const item = document.createElement('div');
    item.className = 'item';
    item.dataset.index = idx;
    item.innerHTML = `<div><strong>${svc.name||'(sin nombre)'}</strong> · $${(svc.price||0).toLocaleString('es-AR')} · ${svc.dur||30}min</div>`;
    list.appendChild(item);
  });
  list.addEventListener('click',(e)=>{
    const row = e.target.closest('.item');
    if(!row) return;
    const i = parseInt(row.dataset.index,10);
    const svc = getServices()[i];
    if(!svc) return;
    // highlight
    list.querySelectorAll('.item').forEach(n=>n.classList.remove('selected'));
    row.classList.add('selected');
    // form
    document.querySelector('#svcName').value = svc.name || '';
    document.querySelector('#svcPrice').value = svc.price || '';
    document.querySelector('#svcDur').value = String(svc.dur||30);
    document.querySelector('#svcName').dataset.editIndex = i;
    const badge = document.querySelector('#svcEditing'); if(badge) badge.style.display='inline-block';
  }, { once:true });
}
function svcAdd(){
  const name = document.querySelector('#svcName').value.trim();
  const price = parseInt(document.querySelector('#svcPrice').value || '0',10);
  const dur = parseInt(document.querySelector('#svcDur').value || '30',10);
  if(!name){ alert('Poné un nombre'); return; }
  const s = getServices();
  const editIndex = parseInt(document.querySelector('#svcName').dataset.editIndex || '-1',10);
  if(!isNaN(editIndex) && editIndex >= 0){
    s[editIndex] = { name, price, dur };
    document.querySelector('#svcName').dataset.editIndex = '';
  } else {
    s.push({ name, price, dur });
  }
  setServices(s);
  renderServices();
  svcClearForm();
  alert('Servicio guardado');
}
function svcDelete(){
  const editIndex = parseInt(document.querySelector('#svcName').dataset.editIndex || '-1',10);
  if(isNaN(editIndex) || editIndex < 0) return alert('Elegí un servicio (Editar) antes de eliminar');
  const s = getServices();
  s.splice(editIndex,1);
  setServices(s);
  document.querySelector('#svcName').value='';
  document.querySelector('#svcPrice').value='';
  document.querySelector('#svcDur').value='30';
  document.querySelector('#svcName').dataset.editIndex = '';
  renderServices();
  svcClearForm();
  alert('Servicio eliminado');
}


function svcClearForm(){
  document.querySelector('#svcName').value='';
  document.querySelector('#svcPrice').value='';
  document.querySelector('#svcDur').value='30';
  document.querySelector('#svcName').dataset.editIndex='';
  const badge = document.querySelector('#svcEditing'); if(badge) badge.style.display='none';
  const list = document.querySelector('#svcList'); if(list) list.querySelectorAll('.item').forEach(n=>n.classList.remove('selected'));
}
function svcNew(){ svcClearForm(); }

// Override svcAdd and svcDelete to update badge/selection


function tplClearForm(){
  document.querySelector('#tplName').value='';
  document.querySelector('#tplStart').value='09:00';
  document.querySelector('#tplEnd').value='15:00';
  document.querySelector('#tplDur').value='30';
  document.querySelectorAll('.tplDay').forEach(cb=> cb.checked = (['1','2','3','4','5'].includes(cb.value)) );
  const badge = document.querySelector('#tplEditing'); if(badge) badge.style.display='none';
}
function tplNew(){ tplClearForm(); }
