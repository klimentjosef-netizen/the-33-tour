/* ===================================================
   The 33 Tour – info.js
   JavaScript pro info.html (scroll stránka)
=================================================== */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbw4OBUsZutD1CPYjMqw0-nRAz6NRdpTpK2xxqthY1AAToO0PMFL74IKlBglkF_jXJNm/exec';
const PADEL_ROLES = ['Hraju turnaj', 'Fandím / koukám'];
const ADMIN_PIN = '2803';

/* === HELPERS === */
function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* === COUNTDOWN === */
function startCountdown() {
  const target = new Date('2026-03-28T09:00:00+01:00');
  const els = {
    days: document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins: document.getElementById('cd-mins'),
    secs: document.getElementById('cd-secs')
  };

  function tick() {
    const now = new Date();
    let diff = Math.max(0, Math.floor((target - now) / 1000));
    const d = Math.floor(diff / 86400); diff %= 86400;
    const h = Math.floor(diff / 3600); diff %= 3600;
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    els.days.textContent = String(d).padStart(2, '0');
    els.hours.textContent = String(h).padStart(2, '0');
    els.mins.textContent = String(m).padStart(2, '0');
    els.secs.textContent = String(s).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);
}

/* === DEADLINE BANNER === */
function initDeadlineBanner() {
  const deadline = new Date('2026-03-10T23:59:59+01:00');
  const banner = document.getElementById('deadlineBanner');
  const span = document.getElementById('deadlineCountdown');
  if (!banner || !span) return;

  function tick() {
    const now = new Date();
    const diff = Math.max(0, Math.floor((deadline - now) / 1000));
    if (diff <= 0) {
      banner.style.display = 'none';
      return;
    }
    const d = Math.floor(diff / 86400);
    const h = Math.floor((diff % 86400) / 3600);
    if (d > 0) {
      span.textContent = 'zbývá ' + d + ' dní a ' + h + ' hodin';
    } else {
      const m = Math.floor((diff % 3600) / 60);
      span.textContent = 'zbývá ' + h + 'h ' + m + 'min';
    }
  }
  tick();
  setInterval(tick, 60000);
}

/* === SCROLL ANIMATIONS === */
function initScrollAnimations() {
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-stop]').forEach(function(el) { observer.observe(el); });
  document.querySelectorAll('[data-faq]').forEach(function(el) { observer.observe(el); });
}

/* === FAQ === */
function toggleFaq(btn) {
  const item = btn.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function(el) {
    el.classList.remove('open');
  });
  if (!isOpen) item.classList.add('open');
}

/* === FORM – PERSON COUNT === */
let personCount = 1;

function changeCount(d) {
  personCount = Math.max(1, Math.min(10, personCount + d));
  document.getElementById('personCount').textContent = personCount;
  rebuildNameInputs();
  rebuildPadelRoles();
}

function rebuildNameInputs() {
  const c = document.getElementById('namesInputs');
  const existing = Array.from(c.querySelectorAll('.name-input')).map(function(i) { return i.value; });
  c.innerHTML = '';
  for (var i = 0; i < personCount; i++) {
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'name-input';
    inp.placeholder = 'Jméno osoby ' + (i + 1) + '…';
    inp.autocomplete = 'off';
    inp.value = existing[i] || '';
    c.appendChild(inp);
  }
}

/* === FORM – STOP CHOICES === */
function toggleStopChoice(el) {
  el.classList.toggle('selected');
  rebuildPadelRoles();
}

function toggleKids(el) {
  el.classList.toggle('on');
}

/* === FORM – PADEL ROLES === */
function rebuildPadelRoles() {
  var container = document.getElementById('padelRolesContainer');
  if (!container) return;
  var padelEl = document.querySelector('.stop-choice[data-part="padel"]');
  var padelSelected = padelEl && padelEl.classList.contains('selected');
  if (!padelSelected) { container.innerHTML = ''; return; }

  var saved = {};
  container.querySelectorAll('.padel-role.role-selected').forEach(function(r) {
    saved[r.dataset.person] = r.dataset.role;
  });

  container.innerHTML = '';
  for (var i = 0; i < personCount; i++) {
    var row = document.createElement('div');
    row.style.cssText = 'margin-bottom:6px;';
    if (personCount > 1) {
      var lbl = document.createElement('div');
      lbl.style.cssText = 'font-family:"Bebas Neue",sans-serif;font-size:10px;letter-spacing:2px;color:var(--muted);margin-bottom:3px;';
      lbl.textContent = 'Osoba ' + (i + 1) + ':';
      row.appendChild(lbl);
    }
    PADEL_ROLES.forEach(function(role) {
      var btn = document.createElement('div');
      btn.className = 'padel-role';
      btn.dataset.role = role;
      btn.dataset.person = String(i);
      if (saved[String(i)] === role) btn.classList.add('role-selected');
      btn.innerHTML = '<div class="role-dot"></div>' + escapeHtml(role);
      btn.onclick = function(e) {
        e.stopPropagation();
        container.querySelectorAll('.padel-role[data-person="' + i + '"]').forEach(function(r) {
          r.classList.remove('role-selected');
        });
        btn.classList.add('role-selected');
      };
      row.appendChild(btn);
    });
    container.appendChild(row);
  }
}

/* === STORAGE (GAS) === */
function normalizeAttendee(p) {
  if (!p || typeof p !== 'object') return null;
  if (p.Name !== undefined) p.name = p.Name;
  if (p.Parts !== undefined) p.parts = p.Parts;
  if (p.PadelRole !== undefined && p.padelRole === undefined) p.padelRole = p.PadelRole;
  if (p.KidsB !== undefined && p.kidsB === undefined) p.kidsB = p.KidsB;
  if (p.KidsP !== undefined && p.kidsP === undefined) p.kidsP = p.KidsP;
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
    var r = await fetch(GAS_URL);
    if (!r.ok) { renderAttendees([]); return; }
    var json = await r.json();
    var data = json.attendees || [];
    renderAttendees(data);
    renderAdmin(data);
  } catch(e) { renderAttendees([]); }
}

async function saveAttendees(data) {
  var r = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ attendees: data })
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
}

/* === RENDER ATTENDEES === */
function renderAttendees(rawData) {
  var data = (rawData || []).map(normalizeAttendee).filter(function(p) { return p && p.name; });
  var lists = { brunch: [], padel: [], bar: [] };
  data.forEach(function(p) {
    if (p.parts.includes('brunch')) lists.brunch.push(p);
    if (p.parts.includes('padel')) lists.padel.push(p);
    if (p.parts.includes('bar')) lists.bar.push(p);
  });
  ['brunch', 'padel', 'bar'].forEach(function(part) {
    var people = lists[part];
    var cap = part.charAt(0).toUpperCase() + part.slice(1);
    var cntEl = document.getElementById('cnt' + cap);
    if (cntEl) cntEl.textContent = people.length;
    var ul = document.getElementById('lst' + cap);
    if (!ul) return;
    if (!people.length) { ul.innerHTML = '<li class="att-empty">Zatím nikdo…</li>'; return; }
    ul.innerHTML = people.map(function(p) {
      var x = '';
      if (part === 'padel' && p.padelRole) x += '<span class="att-role-tag">' + escapeHtml(p.padelRole) + '</span>';
      if (part === 'brunch' && p.kidsB) x += '<span class="att-kids-tag">+ děti</span>';
      if (part === 'padel' && p.kidsP) x += '<span class="att-kids-tag">+ děti</span>';
      return '<li>' + escapeHtml(p.name) + x + '</li>';
    }).join('');
  });
}

/* === SUBMIT REGISTRATION === */
async function submitReg() {
  var names = Array.from(document.querySelectorAll('.name-input'))
    .map(function(i) { return i.value.trim(); })
    .filter(function(v) { return v.length > 0; });

  if (!names.length) { showMsg('Napiš své jméno', 'error'); return; }
  if (names.length < personCount) { showMsg('Vyplň jméno pro všech ' + personCount + ' osob', 'error'); return; }

  var parts = Array.from(document.querySelectorAll('.stop-choice.selected'))
    .map(function(el) { return el.dataset.part; });
  if (!parts.length) { showMsg('Vyber alespoň jednu zastávku', 'error'); return; }

  var padelRoles = [];
  if (parts.includes('padel')) {
    for (var i = 0; i < personCount; i++) {
      var roleEl = document.querySelector('.padel-role[data-person="' + i + '"].role-selected');
      if (!roleEl) { showMsg('Vyber roli v padelu pro osobu ' + (i + 1), 'error'); return; }
      padelRoles.push(roleEl.dataset.role);
    }
  }

  var kidsB = document.getElementById('kidsB').classList.contains('on');
  var kidsP = document.getElementById('kidsP').classList.contains('on');
  var btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Ukládám…';

  try {
    var data = [];
    try {
      var r2 = await fetch(GAS_URL);
      if (r2.ok) {
        var j = await r2.json();
        data = (j.attendees || []).map(normalizeAttendee).filter(function(p) { return p && p.name; });
      }
    } catch(fetchErr) { /* start fresh */ }

    names.forEach(function(name, i) {
      var entry = {
        name: name,
        parts: parts,
        padelRole: padelRoles[i] || '',
        kidsB: kidsB,
        kidsP: kidsP,
        ts: Date.now()
      };
      var idx = data.findIndex(function(p) { return p.name && p.name.toLowerCase() === name.toLowerCase(); });
      if (idx >= 0) data[idx] = entry;
      else data.push(entry);
    });

    await saveAttendees(data);
    renderAttendees(data);
    renderAdmin(data);
    showMsg('Registrace uložena!', 'success');
    btn.textContent = 'Přihlásit skupinu na tour';
    btn.disabled = false;
  } catch(e) {
    showMsg('Chyba při ukládání: ' + e.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Přihlásit skupinu na tour';
  }
}

function showMsg(text, type) {
  var el = document.getElementById('formMsg');
  el.textContent = text;
  el.className = 'form-msg ' + type;
  setTimeout(function() { el.textContent = ''; el.className = 'form-msg'; }, 5000);
}

/* === SHARE === */
function copyLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(function() { alert('Odkaz zkopírován!'); })
    .catch(function() { prompt('Zkopíruj odkaz:', window.location.href); });
}

function initWhatsAppBtn() {
  var btn = document.getElementById('waBtn');
  if (!btn) return;
  var text = encodeURIComponent('Ahoj! Pepča slaví 33. narozeniny a zve tě na The 33 Tour – 28. března 2026 v Ostravě a Katowicích. Mrkni na detaily a přihlas se: ' + window.location.href);
  btn.href = 'https://wa.me/?text=' + text;
}

/* === ADMIN === */
function toggleAdmin() {
  var panel = document.getElementById('adminPanel');
  panel.classList.toggle('open');
}

function checkPin() {
  var input = document.getElementById('pinInput');
  var error = document.getElementById('pinError');
  if (input.value === ADMIN_PIN) {
    document.getElementById('pinGate').style.display = 'none';
    document.getElementById('adminContent').classList.add('open');
    loadAttendees();
  } else {
    error.textContent = 'Špatný PIN';
    input.value = '';
  }
}

function renderAdmin(rawData) {
  var data = (rawData || []).map(normalizeAttendee).filter(function(p) { return p && p.name; });

  var summaryEl = document.getElementById('adminSummary');
  var bodyEl = document.getElementById('adminBody');
  if (!summaryEl || !bodyEl) return;

  var cntB = 0, cntP = 0, cntBar = 0;
  data.forEach(function(p) {
    if (p.parts.includes('brunch')) cntB++;
    if (p.parts.includes('padel')) cntP++;
    if (p.parts.includes('bar')) cntBar++;
  });

  summaryEl.innerHTML =
    '<div class="admin-sum-box"><div class="big">' + cntB + '</div><div class="lbl">Brunch</div></div>' +
    '<div class="admin-sum-box"><div class="big">' + cntP + '</div><div class="lbl">Padel</div></div>' +
    '<div class="admin-sum-box"><div class="big">' + cntBar + '</div><div class="lbl">Night Cap</div></div>';

  bodyEl.innerHTML = data.map(function(p, idx) {
    var check = '<span class="admin-check">✓</span>';
    var cross = '<span class="admin-cross">—</span>';
    return '<tr>' +
      '<td>' + escapeHtml(p.name) + '</td>' +
      '<td>' + (p.parts.includes('brunch') ? check : cross) + '</td>' +
      '<td>' + (p.parts.includes('padel') ? check : cross) + '</td>' +
      '<td>' + escapeHtml(p.padelRole || '—') + '</td>' +
      '<td>' + (p.parts.includes('bar') ? check : cross) + '</td>' +
      '<td>' + (p.kidsB ? check : cross) + '</td>' +
      '<td>' + (p.kidsP ? check : cross) + '</td>' +
      '<td><button class="del-btn" onclick="deleteAttendee(' + idx + ')">Smazat</button></td>' +
      '</tr>';
  }).join('');
}

var cachedData = [];

async function deleteAttendee(idx) {
  if (!confirm('Opravdu smazat tuto registraci?')) return;
  try {
    var r = await fetch(GAS_URL);
    if (!r.ok) return;
    var j = await r.json();
    var data = (j.attendees || []).map(normalizeAttendee).filter(function(p) { return p && p.name; });
    data.splice(idx, 1);
    await saveAttendees(data);
    renderAttendees(data);
    renderAdmin(data);
    showMsg('Registrace smazána', 'success');
  } catch(e) {
    showMsg('Chyba: ' + e.message, 'error');
  }
}

function exportCSV() {
  var rows = [['Jméno', 'Brunch', 'Padel', 'Role', 'Bar', 'Děti B', 'Děti P']];
  document.querySelectorAll('#adminBody tr').forEach(function(tr) {
    var cells = Array.from(tr.querySelectorAll('td'));
    if (cells.length < 7) return;
    rows.push([
      cells[0].textContent.trim(),
      cells[1].textContent.trim() === '✓' ? 'ANO' : 'NE',
      cells[2].textContent.trim() === '✓' ? 'ANO' : 'NE',
      cells[3].textContent.trim(),
      cells[4].textContent.trim() === '✓' ? 'ANO' : 'NE',
      cells[5].textContent.trim() === '✓' ? 'ANO' : 'NE',
      cells[6].textContent.trim() === '✓' ? 'ANO' : 'NE'
    ]);
  });

  var csv = rows.map(function(r) {
    return r.map(function(c) { return '"' + c.replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');

  var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'the-33-tour-registrace.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/* === INIT === */
document.addEventListener('DOMContentLoaded', function() {
  startCountdown();
  initDeadlineBanner();
  initScrollAnimations();
  initWhatsAppBtn();
  loadAttendees();
  // Auto-refresh attendees every 30 seconds
  setInterval(loadAttendees, 30000);
});
