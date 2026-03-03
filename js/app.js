/* === NAVIGATION === */
let currentScreen = 1;

function goTo(n) {
  document.getElementById('s' + currentScreen).classList.remove('active');
  currentScreen = n;
  const next = document.getElementById('s' + n);
  next.classList.add('active');
  next.scrollTop = 0;
  updateProgress();
  updateBackNav();
  if (n === 3) revealStops();
  if (n === 5) loadAttendees();
}

function goBack() {
  if (currentScreen === 6) { goTo(4); return; }
  if (currentScreen > 1) goTo(currentScreen - 1);
}

function updateProgress() {
  document.querySelectorAll('.dot').forEach(d => {
    const s = parseInt(d.dataset.screen);
    d.classList.remove('active','done');
    if (s === currentScreen) d.classList.add('active');
    else if (s < currentScreen) d.classList.add('done');
  });
  document.getElementById('progress').style.opacity = currentScreen === 6 ? '0' : '1';
}

function updateBackNav() {
  const nav = document.getElementById('backNav');
  nav.classList.toggle('visible', currentScreen >= 2 && currentScreen !== 5);
}

document.querySelectorAll('.dot').forEach(d => {
  d.addEventListener('click', () => {
    const s = parseInt(d.dataset.screen);
    if (s < currentScreen) goTo(s);
  });
});

/* === SCREEN 3 REVEALS === */
function revealStops() {
  document.querySelectorAll('.s3-stop').forEach((el, i) => {
    el.classList.remove('visible');
    setTimeout(() => el.classList.add('visible'), 300 + i * 220);
  });
}

/* === FORM === */
let personCount = 1;
const PADEL_ROLES = ['Hraju turnaj', 'Fandím / koukám'];

function changeCount(d) {
  personCount = Math.max(1, Math.min(10, personCount + d));
  document.getElementById('personCount').textContent = personCount;
  rebuildNameInputs();
  rebuildPadelRoles();
}

function rebuildNameInputs() {
  const c = document.getElementById('namesInputs');
  const existing = [...c.querySelectorAll('.name-input')].map(i => i.value);
  c.innerHTML = '';
  for (let i = 0; i < personCount; i++) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'name-input';
    inp.placeholder = i === 0 ? 'Tvoje jméno…' : 'Jméno osoby ' + (i+1) + '…';
    inp.autocomplete = 'off';
    inp.value = existing[i] || '';
    c.appendChild(inp);
  }
}

function rebuildPadelRoles() {
  const container = document.getElementById('padelRolesContainer');
  if (!container) return;
  const padelEl = document.querySelector('.stop-choice[data-part="padel"]');
  const padelSelected = padelEl && padelEl.classList.contains('selected');
  if (!padelSelected) { container.innerHTML = ''; return; }

  const saved = {};
  container.querySelectorAll('.padel-role.role-selected').forEach(r => {
    saved[r.dataset.person] = r.dataset.role;
  });

  container.innerHTML = '';
  for (let i = 0; i < personCount; i++) {
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:6px;';
    if (personCount > 1) {
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-family:"Bebas Neue",sans-serif;font-size:10px;letter-spacing:2px;color:var(--muted);margin-bottom:3px;';
      lbl.textContent = 'Osoba ' + (i+1) + ':';
      row.appendChild(lbl);
    }
    PADEL_ROLES.forEach(role => {
      const btn = document.createElement('div');
      btn.className = 'padel-role';
      btn.dataset.role = role;
      btn.dataset.person = String(i);
      if (saved[String(i)] === role) btn.classList.add('role-selected');
      btn.innerHTML = '<div class="role-dot"></div>' + role;
      btn.onclick = e => {
        e.stopPropagation();
        container.querySelectorAll('.padel-role[data-person="' + i + '"]').forEach(r => r.classList.remove('role-selected'));
        btn.classList.add('role-selected');
      };
      row.appendChild(btn);
    });
    container.appendChild(row);
  }
}

function toggleStopChoice(el) {
  el.classList.toggle('selected');
  rebuildPadelRoles();
}
function toggleKids(el) { el.classList.toggle('on'); }

/* === HELPERS === */
function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* === STORAGE === */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbw4OBUsZutD1CPYjMqw0-nRAz6NRdpTpK2xxqthY1AAToO0PMFL74IKlBglkF_jXJNm/exec';

function normalizeAttendee(p) {
  if (!p || typeof p !== 'object') return null;
  // GAS returns capitalized keys (Name, Parts, PadelRole, KidsB, KidsP)
  // normalize everything to lowercase keys
  if (p.Name !== undefined) p.name = p.Name;
  if (p.Parts !== undefined) p.parts = p.Parts;
  if (p.PadelRole !== undefined && p.padelRole === undefined) p.padelRole = p.PadelRole;
  if (p.KidsB !== undefined && p.kidsB === undefined) p.kidsB = p.KidsB;
  if (p.KidsP !== undefined && p.kidsP === undefined) p.kidsP = p.KidsP;
  // parse parts if it came as a JSON string
  if (typeof p.parts === 'string') {
    try { p.parts = JSON.parse(p.parts); } catch(e) { p.parts = []; }
  }
  if (!Array.isArray(p.parts)) p.parts = [];
  p.kidsB = (p.kidsB === true || p.kidsB === 'TRUE');
  p.kidsP = (p.kidsP === true || p.kidsP === 'TRUE');
  return p;
}

async function loadAttendees() {
  try {
    const r = await fetch(GAS_URL);
    if (!r.ok) { renderAttendees([]); return; }
    const json = await r.json();
    renderAttendees(json.attendees || []);
  } catch(e) { renderAttendees([]); }
}

async function saveAttendees(data) {
  const r = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ attendees: data })
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
}

function renderAttendees(rawData) {
  const data = (rawData || []).map(normalizeAttendee).filter(p => p && p.name);
  const lists = { brunch:[], padel:[], bar:[] };
  data.forEach(p => {
    if (p.parts.includes('brunch')) lists.brunch.push(p);
    if (p.parts.includes('padel'))  lists.padel.push(p);
    if (p.parts.includes('bar'))    lists.bar.push(p);
  });
  ['brunch','padel','bar'].forEach(part => {
    const people = lists[part];
    const cap = part.charAt(0).toUpperCase() + part.slice(1);
    document.getElementById('cnt' + cap).textContent = people.length;
    const ul = document.getElementById('lst' + cap);
    if (!people.length) { ul.innerHTML = '<li class="att-empty">Zatím nikdo…</li>'; return; }
    ul.innerHTML = people.map(p => {
      let x = '';
      if (part === 'padel' && p.padelRole) x += '<span class="att-role-tag">' + escapeHtml(p.padelRole) + '</span>';
      if (part === 'brunch' && p.kidsB) x += '<span class="att-kids-tag">+ děti</span>';
      if (part === 'padel' && p.kidsP)  x += '<span class="att-kids-tag">+ děti</span>';
      return '<li>' + escapeHtml(p.name) + x + '</li>';
    }).join('');
  });
}

async function submitReg() {
  const names = [...document.querySelectorAll('.name-input')]
    .map(i => i.value.trim())
    .filter(v => v.length > 0);

  if (!names.length) { showMsg('Napiš své jméno', 'error'); return; }
  if (names.length < personCount) { showMsg('Vyplň jméno pro všech ' + personCount + ' osob', 'error'); return; }

  const parts = [...document.querySelectorAll('.stop-choice.selected')]
    .map(el => el.dataset.part);
  if (!parts.length) { showMsg('Vyber alespoň jednu zastávku', 'error'); return; }

  const padelRoles = [];
  if (parts.includes('padel')) {
    for (let i = 0; i < personCount; i++) {
      const roleEl = document.querySelector('.padel-role[data-person="' + i + '"].role-selected');
      if (!roleEl) { showMsg('Vyber roli v padelu pro osobu ' + (i+1), 'error'); return; }
      padelRoles.push(roleEl.dataset.role);
    }
  }

  const kidsB = document.getElementById('kidsB').classList.contains('on');
  const kidsP = document.getElementById('kidsP').classList.contains('on');
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Ukládám…';

  try {
    let data = [];
    try {
      const r2 = await fetch(GAS_URL);
      if (r2.ok) {
        const j = await r2.json();
        data = (j.attendees || []).map(normalizeAttendee).filter(p => p && p.name);
      }
    } catch(fetchErr) { /* start fresh */ }

    names.forEach((name, i) => {
      const entry = {
        name: name,
        parts: parts,
        padelRole: padelRoles[i] || '',
        kidsB: kidsB,
        kidsP: kidsP,
        ts: Date.now()
      };
      const idx = data.findIndex(p => p.name && p.name.toLowerCase() === name.toLowerCase());
      if (idx >= 0) data[idx] = entry;
      else data.push(entry);
    });

    await saveAttendees(data);
    renderAttendees(data);
    window.location.href = 'info.html';
  } catch(e) {
    console.error('submitReg error:', e);
    showMsg('Chyba při ukládání: ' + e.message, 'error');
    alert('Chyba při ukládání: ' + e.message);
    btn.disabled = false;
    btn.textContent = 'Přihlásit se na tour';
  }
}

function showMsg(text, type) {
  const el = document.getElementById('formMsg');
  el.textContent = text;
  el.className = 'form-msg ' + type;
  setTimeout(() => { el.textContent = ''; el.className = 'form-msg'; }, 5000);
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert('Odkaz zkopírován!'))
    .catch(() => prompt('Zkopíruj odkaz:', window.location.href));
}
