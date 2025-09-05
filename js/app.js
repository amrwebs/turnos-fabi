// Frontend-only demo using localStorage. No auto-seeding; cliente ve horarios solo si Fabi cargó slots.
const $ = (sel) => document.querySelector(sel);

const SETTINGS_KEY = 'fabi_settings';
const SLOTS_KEY = 'fabi_slots';
const BOOKINGS_KEY = 'fabi_bookings';
const SERVICES_KEY = 'fabi_services';

const defaultSettings = {
  price: 0,
  whatsapp: '',
  mp_link: ''
};

function getSettings(){
  const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
  return s || defaultSettings;
}

function fmtDate(d){
  const yyyy = d.getFullYear();
  const mm = ('0'+(d.getMonth()+1)).slice(-2);
  const dd = ('0'+d.getDate()).slice(-2);
  return `${yyyy}-${mm}-${dd}`;
}

function loadSlots(dateStr){
  const all = JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}');
  return (all[dateStr] || []).filter(s => !s.blocked);
}

function getBookings(dateStr){
  const all = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '{}');
  return all[dateStr] || [];
}

function isTaken(dateStr, time){
  return getBookings(dateStr).some(b => b.time === time);
}

function renderSlots(dateStr){
  const sel = $('#slot');
  const empty = $('#emptyNotice');
  sel.innerHTML = '';
  const slots = loadSlots(dateStr);
  const available = slots.filter(s => !isTaken(dateStr, s.time));
  if(available.length === 0){
    const opt = document.createElement('option');
    opt.textContent = 'Sin turnos';
    opt.value = '';
    sel.appendChild(opt);
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  available.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.time;
    opt.textContent = s.time;
    sel.appendChild(opt);
  });
}

function book(){
  const dateStr = $('#date').value;
  const slot = $('#slot').value;
  const name = $('#name').value.trim();
  const phone = $('#phone').value.trim();
  const pay = $('#payment').value;

  if(!dateStr || !slot){ alert('Elegí fecha y horario'); return; }
  if(!name){ alert('Ingresá tu nombre'); return; }
  if(!phone){ alert('Ingresá tu celular'); return; }

  const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '{}');
  bookings[dateStr] = bookings[dateStr] || [];
  if(bookings[dateStr].some(b => b.time === slot)){
    alert('Ese turno ya fue tomado, elegí otro.');
    renderSlots(dateStr);
    return;
  }
  const svcIndex = parseInt($('#service').value || '0',10);
  const services = getServices();
  const svc = services[svcIndex] || services[0];
  const booking = { time: slot, name, phone, pay, service: svc?.name || '', price: svc?.price || 0, created_at: Date.now() };
  bookings[dateStr].push(booking);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));

  const { price, whatsapp, mp_link } = getSettings();

  const confirm = $('#confirm');
  let mpText = '';
  if(pay === 'mp' && mp_link){
    mpText = `<p>Pago por Mercado Pago: <a href="${mp_link}" target="_blank" rel="noopener">Ir al link</a></p>`;
  }
  const waMsg = encodeURIComponent(`Hola Fabi! Soy ${name}. Reservé para el ${dateStr} a las ${slot}. Forma de pago: ${pay==='mp'?'Mercado Pago':'Efectivo'}. Mi cel: ${phone}.`);
  const waHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g,'')}?text=${waMsg}` : '#';

  confirm.classList.remove('hidden');
  confirm.innerHTML = `
    <h4>¡Turno reservado!</h4>
    <p>Fecha: <strong>${dateStr}</strong> — Hora: <strong>${slot}</strong></p>
    <p>Total: <strong>$${(price||0).toLocaleString('es-AR')}</strong></p>
    ${mpText}
    <p><a class="btn" ${whatsapp?'':'aria-disabled="true"'} href="${waHref}" target="_blank" rel="noopener">Avisar por WhatsApp</a></p>
  `;

  renderSlots(dateStr);
}

function getServices(){
  const s = JSON.parse(localStorage.getItem(SERVICES_KEY) || 'null');
  return s || [];
}
function renderServices(){
  const sel = $('#service');
  sel.innerHTML = '';
  const services = getServices();
  services.forEach((s, i)=>{
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });
}
function currentServicePrice(){
  const i = parseInt($('#service').value || '-1',10);
  const services = getServices();
  const svc = (i>=0 ? services[i] : null);
  return svc && typeof svc.price==='number' ? svc.price : 0;
}
function showPrice(){
  $('#price').textContent = `$${currentServicePrice().toLocaleString('es-AR')}`;
}

function main(){
  $('#year').textContent = new Date().getFullYear();
  const today = new Date();
  $('#date').value = fmtDate(today);
  renderServices();
  showPrice();
  renderSlots(fmtDate(today));
  $('#date').addEventListener('change', e => renderSlots(e.target.value));
  $('#service').addEventListener('change', showPrice);
  $('#bookBtn').addEventListener('click', book);
}

document.addEventListener('DOMContentLoaded', main);
