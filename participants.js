// ===== Helpers =====
function getTable() {
  // Essaie de trouver le tableau principal (adapte l'ID si besoin)
  return document.querySelector('table');
}

function getHeaders() {
  const table = getTable();
  if (!table) return [];
  const head = table.querySelector('thead');
  if (head) {
    const ths = head.querySelectorAll('th');
    if (ths && ths.length) return Array.from(ths).map(th => th.textContent.trim());
  }
  // fallback si pas de <thead>
  const firstRow = table.querySelector('tbody tr');
  return firstRow ? Array.from(firstRow.children).map(td => td.textContent.trim()) : [];
}

function loadEleves() {
  try {
    const raw = localStorage.getItem('eleves');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveEleves(list) {
  localStorage.setItem('eleves', JSON.stringify(list));
}

// Normalisation basique (évite variantes)
const KEY_ALIASES = {
  'Nom': 'Nom', 'Prénom': 'Prénom', 'Prenom': 'Prénom', 'Classe': 'Classe',
  'Sexe': 'Sexe', 'Genre': 'Sexe',
  'VMA': 'VMA', 'Distance': 'Distance', 'Vitesse': 'Vitesse', 'Vitesse 30m': 'Vitesse',
  'Points': 'Points', 'Palier': 'Palier', 'Navette': 'Navette',
  'Saut en longueur': 'Saut en longueur', 'Longueur': 'Saut en longueur',
};

function normalizeLabel(label) {
  const clean = (label || '').replace(/\s+/g, ' ').trim();
  const base = clean.replace(/[▲▼🡅🡇🔼🔽]+/g, '').trim();
  return KEY_ALIASES[base] || base;
}

const IGNORE_FIELDS = new Set(['#', 'Actions', 'Source', 'source']);
const NUMERIC_FIELDS = new Set(['VMA','Distance','Vitesse','Points','Palier','Navette','Saut en longueur']);

// ===== UI ajout =====
function openAddDialog() {
  const dlg = document.getElementById('addParticipantDialog');
  const zone = document.getElementById('dynamicFields');
  const optList = document.getElementById('optionalList');
  const optKey = document.getElementById('optKey');
  const optVal = document.getElementById('optVal');
  const addOptBtn = document.getElementById('btnAddOptional');

  if (!dlg || !zone) {
    console.warn('Dialog d’ajout introuvable dans la page.');
    return;
  }

  zone.innerHTML = '';
  if (optList) optList.innerHTML = '';
  if (optKey) optKey.value = '';
  if (optVal) optVal.value = '';

  // 1) Construire la liste des champs depuis les colonnes visibles
  const headers = getHeaders()
    .map(normalizeLabel)
    .filter(h => h && !IGNORE_FIELDS.has(h));

  const defaultFields = ['Nom','Prénom','Classe','Sexe']; // minimum si tableau vide
  const fields = headers.length ? headers : defaultFields;

  // 2) Générer les inputs
  for (const label of fields) {
    const id = `fld_${label.replace(/\W+/g, '_')}`;
    const wrap = document.createElement('label');
    wrap.style.display = 'grid';
    wrap.style.gap = '4px';
    wrap.innerHTML = `<span style="font-size:12px;color:#475569">${label}</span>`;
    const input = document.createElement('input');
    input.id = id;
    input.name = label;
    input.required = ['Nom','Prénom','Classe','Sexe'].includes(label);
    if (NUMERIC_FIELDS.has(label)) {
      input.type = 'number';
      input.step = 'any';
      input.inputMode = 'decimal';
    } else {
      input.type = 'text';
    }
    input.placeholder = label;
    input.className = 'input';
    wrap.appendChild(input);
    zone.appendChild(wrap);
  }

  // 3) Gestion des champs optionnels
  const optionals = new Map(); // key -> value

  function renderOptionals() {
    if (!optList) return;
    optList.innerHTML = '';
    optionals.forEach((val, key) => {
      const pill = document.createElement('span');
      pill.style.cssText = 'display:inline-flex;align-items:center;gap:6px;border:1px solid #e5e7eb;border-radius:999px;padding:6px 10px;font-size:12px;';
      pill.innerHTML = `<strong>${key}</strong>: ${val}`;
      const x = document.createElement('button');
      x.type = 'button';
      x.textContent = '✕';
      x.style.cssText = 'margin-left:6px;border:none;background:transparent;cursor:pointer;';
      x.onclick = () => { optionals.delete(key); renderOptionals(); };
      pill.appendChild(x);
      optList.appendChild(pill);
    });
  }

  if (addOptBtn) {
    addOptBtn.onclick = () => {
      const k = normalizeLabel(optKey ? optKey.value : '');
      const v = (optVal ? optVal.value : '').trim();
      if (!k) return;
      // Empêche doublon avec colonnes actuelles
      if (fields.includes(k)) {
        alert(`“${k}” existe déjà comme colonne affichée.`);
        return;
      }
      optionals.set(k, v);
      if (optKey) optKey.value = '';
      if (optVal) optVal.value = '';
      renderOptionals();
    };
  }

  // 4) Boutons du dialog
  const cancelBtn = document.getElementById('cancelAdd');
  if (cancelBtn) cancelBtn.onclick = () => dlg.close();

  // 5) Submit
  const form = document.getElementById('addParticipantForm');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();

      const data = {};
      // Valeurs des champs “officiels” (depuis les colonnes)
      zone.querySelectorAll('input').forEach(inp => {
        const label = normalizeLabel(inp.name);
        let val = inp.value.trim();
        if (NUMERIC_FIELDS.has(label) && val !== '') {
          const num = parseFloat(val.replace(',', '.'));
          if (!Number.isNaN(num)) val = num;
        }
        if (val !== '') data[label] = val;
      });

      // Valeurs des champs optionnels
      optionals.forEach((v, k) => {
        const label = normalizeLabel(k);
        let val = (v || '').trim();
        if (NUMERIC_FIELDS.has(label) && val !== '') {
          const num = parseFloat(val.replace(',', '.'));
          if (!Number.isNaN(num)) val = num;
        }
        if (val !== '') data[label] = val;
      });

      // Ajout dans localStorage
      const list = loadEleves();
      list.push(data);
      saveEleves(list);

      // Re-render si dispo, sinon reload
      if (typeof window.renderParticipantsTable === 'function') {
        window.renderParticipantsTable(list);
      } else {
        location.reload();
      }

      dlg.close();
    };
  }

  // 6) Ouvrir le dialog (compat iOS)
  try { dlg.showModal(); } catch { dlg.setAttribute('open',''); }
}

// ===== Wiring =====
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnAddParticipant');
  if (btn) btn.addEventListener('click', openAddDialog);
});
