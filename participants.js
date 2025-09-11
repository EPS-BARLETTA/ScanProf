// === Etat en mémoire ===
let _elevesBrut = [];
let _vueCourante = [];
let _labels = {};
let _types  = {};
let _ordreAsc = true; // ⬅︎ nouvel état pour ↑/↓

// ------------ Helpers méta (labels/types) ------------
function collectMeta(rows) {
  const L = {}, T = {};
  (rows || []).forEach(r => {
    if (r && r.__labels && typeof r.__labels === "object") Object.assign(L, r.__labels);
    if (r && r.__types  && typeof r.__types  === "object") Object.assign(T, r.__types);
  });
  return { labels: L, types: T };
}
function humanLabel(key) {
  if (_labels && _labels[key]) return _labels[key];
  const map = { nom:"Nom", prenom:"Prénom", classe:"Classe", sexe:"Sexe",
    distance:"Distance", vitesse:"Vitesse", vma:"VMA", temps_total:"Temps total" };
  if (map[key]) return map[key];
  if (/^t\d+$/i.test(key)) return key.toUpperCase();
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ------------ Helpers colonnes & splits ------------
function isSplitKey(key = "") {
  const k = key.toLowerCase();
  return k.includes("interm") || k.includes("split");
}
function parseSplits(val) {
  if (val == null) return [];
  if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
  return String(val).split(/[;,]\s*/).map(x => x.trim()).filter(Boolean);
}
function allColumnKeys(rows) {
  if (!rows || !rows.length) return [];
  const standard = ["nom","prenom","classe","sexe","distance","vitesse","vma","temps_total"];
  const set = new Set();
  rows.forEach(r => Object.keys(r || {}).forEach(k => set.add(k)));
  const others = Array.from(set)
    .filter(k => !standard.includes(k))
    .sort((a,b)=>a.localeCompare(b,'fr',{sensitivity:'base'}));
  return [...standard.filter(k => set.has(k)), ...others];
}
function augmentData(rows) {
  if (!rows || !rows.length) return [];
  const splitKeys = new Set();
  rows.forEach(r => Object.keys(r || {}).forEach(k => { if (isSplitKey(k)) splitKeys.add(k); }));
  if (splitKeys.size === 0) return rows.map(r => ({...r}));

  let maxSplits = 0;
  rows.forEach(r => { for (const k of splitKeys) maxSplits = Math.max(maxSplits, parseSplits(r[k]).length); });
  const tCols = Array.from({length:maxSplits}, (_,i)=>`T${i+1}`);

  return rows.map(r => {
    const obj = {...r};
    let had = false;
    for (const k of splitKeys) {
      const arr = parseSplits(r[k]); if (arr.length) had = true;
      tCols.forEach((tName, idx) => { if (obj[tName] == null) obj[tName] = arr[idx] ?? ""; });
    }
    if (had) { for (const k of splitKeys) delete obj[k]; }
    return obj;
  });
}

// ------------ Détection temps/nombre pour tri ------------
function looksLikeTime(v) {
  const s = String(v || "");
  return /^(\d{1,2}:)?\d{1,2}:\d{1,2}(\.\d+)?$/.test(s) || /^\d{1,2}(\.\d+)?$/.test(s);
}
function parseTimeToSeconds(v) {
  if (v == null) return Number.POSITIVE_INFINITY;
  const s = String(v).trim();
  if (s.includes(":")) {
    const p = s.split(":").map(x=>x.trim());
    let h=0, m=0, sec=0;
    if (p.length === 3) { h=+p[0]||0; m=+p[1]||0; sec=parseFloat(p[2])||0; }
    else if (p.length === 2) { m=+p[0]||0; sec=parseFloat(p[1])||0; }
    else { sec=parseFloat(p[0])||0; }
    return h*3600 + m*60 + sec;
  }
  const n = parseFloat(s.replace(/\s/g,'').replace(',', '.'));
  return isNaN(n) ? Number.POSITIVE_INFINITY : n;
}
function isLikelyNumber(val) {
  if (val == null) return false;
  const s = String(val).trim().replace(/\s/g,'').replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(s);
}
function numericKey(key="") {
  const k = key.toLowerCase();
  return k === "vma" || k === "vitesse" || k === "distance";
}
function typedSortValue(key, val) {
  const t = (_types && _types[key]) || null;
  if (t === "time" || (!t && (key.toLowerCase()==="temps_total" || /^t\d+$/i.test(key) || looksLikeTime(val)))) {
    return parseTimeToSeconds(val);
  }
  if (t === "number" || numericKey(key) || isLikelyNumber(val)) {
    const n = parseFloat(String(val).trim().replace(/\s/g,'').replace(',', '.'));
    return isNaN(n) ? Number.POSITIVE_INFINITY : n;
  }
  return String(val ?? "").toLocaleLowerCase();
}

// ------------ Rendu cellules ------------
function formatCellValue(key, val) {
  if (val == null) return "";
  const k = (key || "").toLowerCase();
  if (typeof val === "string" && /[,;]/.test(val) && (k.includes("inter") || k.includes("split") || k.includes("temps"))) {
    const parts = val.split(/[;,]\s*/).filter(Boolean);
    return parts.map(s =>
      `<span style="display:inline-block;margin:2px 4px 2px 0;padding:2px 6px;border-radius:999px;background:#eef;border:1px solid #d5d9ff;">${s}</span>`
    ).join("<br>");
  }
  if (Array.isArray(val)) return val.map(v => formatCellValue(k, v)).join("<br>");
  if (typeof val === "object") {
    return Object.entries(val).map(([kk, vv]) => `<div><strong>${kk}:</strong> ${formatCellValue(kk, vv)}</div>`).join("");
  }
  return String(val);
}

// ------------ UI : bouton ordre ↑/↓ ------------
function ensureOrdreButton() {
  if (document.getElementById("ordre-btn")) return;
  const triSelect = document.getElementById("tri-select");
  if (!triSelect) return;
  const btn = document.createElement("button");
  btn.id = "ordre-btn";
  btn.type = "button";
  btn.style.marginLeft = "8px";
  btn.className = "btn btn-light";
  updateOrdreButtonText(btn);
  btn.onclick = () => {
    _ordreAsc = !_ordreAsc;
    updateOrdreButtonText(btn);
    // retrier immédiatement si on a déjà une vue
    if (_vueCourante && _vueCourante.length) trierParticipants();
  };
  triSelect.insertAdjacentElement("afterend", btn);
}
function updateOrdreButtonText(btn) {
  btn.textContent = _ordreAsc ? "↑ Croissant" : "↓ Décroissant";
}

// ------------ Identifiant unique d'une ligne ------------
const uniqKey = (e) =>
  `${(e.nom||"").toLowerCase()}|${(e.prenom||"").toLowerCase()}|${(e.classe||"").toLowerCase()}`;

// ------------ Initialisation ------------
function afficherParticipants() {
  _elevesBrut = JSON.parse(localStorage.getItem("eleves") || "[]");
  const meta = collectMeta(_elevesBrut);
  _labels = meta.labels;
  _types  = meta.types;

  _vueCourante = augmentData(_elevesBrut);

  const triSelect = document.getElementById("tri-select");
  let keys = allColumnKeys(_vueCourante);
  if (keys.some(k => /^T\d+$/i.test(k))) keys = keys.filter(k => !isSplitKey(k));
  triSelect.innerHTML = keys.map(k => `<option value="${k}">${humanLabel(k)}</option>`).join("");

  ensureOrdreButton();
  updateTable(_vueCourante);
}

// ------------ Rendu tableau ------------
function updateTable(data) {
  const thead = document.getElementById("table-head");
  const tbody = document.getElementById("participants-body");
  if (!thead || !tbody) return;

  if (!data || data.length === 0) {
    thead.innerHTML = "";
    tbody.innerHTML = `<tr><td colspan="1">Aucun élève enregistré.</td></tr>`;
    return;
  }

  let cols = allColumnKeys(data);
  if (cols.some(k => /^T\d+$/i.test(k))) cols = cols.filter(k => !isSplitKey(k));
  thead.innerHTML = `<tr>${cols.map(c => `<th>${humanLabel(c)}</th>`).join("")}</tr>`;

  // Ajoute data-key + title pour l'appui long (sans changer l'apparence)
  tbody.innerHTML = data.map((row, i) => {
    const tds = cols.map(k => formatCellValue(k, row[k])).join("</td><td>");
    const key = uniqKey(row);
    return `<tr data-key="${key}" title="Astuce : appui long pour supprimer la ligne" class="${i % 2 === 0 ? 'pair' : 'impair'}"><td>${tds}</td></tr>`;
  }).join("");
}

// ------------ Filtre texte ------------
function filtrerTexte() {
  const q = (document.getElementById("filtre-txt").value || "").toLowerCase().trim();
  _elevesBrut = JSON.parse(localStorage.getItem("eleves") || "[]");

  let filtered;
  if (!q) {
    filtered = _elevesBrut.slice();
  } else {
    filtered = _elevesBrut.filter(obj => {
      for (const k in obj) {
        const val = (obj[k] == null ? "" : String(obj[k])).toLowerCase();
        if (val.indexOf(q) !== -1) return true;
      }
      return false;
    });
  }

  const meta = collectMeta(filtered);
  _labels = meta.labels; _types = meta.types;

  _vueCourante = augmentData(filtered);
  let keys = allColumnKeys(_vueCourante);
  if (keys.some(k => /^T\d+$/i.test(k))) keys = keys.filter(k => !isSplitKey(k));
  document.getElementById("tri-select").innerHTML = keys.map(k => `<option value="${k}">${humanLabel(k)}</option>`).join("");

  updateTable(_vueCourante);
}

// ------------ Tri dynamique (avec ↑/↓ et détection nombres/temps) ------------
function trierParticipants() {
  const critere = document.getElementById("tri-select").value;
  let data = _vueCourante.length ? _vueCourante.slice() : augmentData(JSON.parse(localStorage.getItem("eleves") || "[]"));
  if (data.length === 0) return;

  data.sort((a, b) => {
    const va = typedSortValue(critere, a[critere]);
    const vb = typedSortValue(critere, b[critere]);
    if (typeof va === "number" && typeof vb === "number") {
      return _ordreAsc ? (va - vb) : (vb - va);
    }
    const cmp = String(va).localeCompare(String(vb), "fr", { sensitivity: "base", numeric: true });
    return _ordreAsc ? cmp : -cmp;
  });

  _vueCourante = data;
  updateTable(data);
}

// ------------ Export CSV (inchangé, avec T1..Tn) ------------
function exporterCSV() {
  const data = _vueCourante.length ? _vueCourante : augmentData(JSON.parse(localStorage.getItem("eleves") || "[]"));
  if (!data.length) return;

  let header = allColumnKeys(data);
  if (header.some(k => /^T\d+$/i.test(k))) header = header.filter(k => !isSplitKey(k));

  const rows = data.map(row => header.map(k => (row[k] ?? "")).join(","));
  const csv = [header.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "participants.csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ------------ Import CSV (inchangé) ------------
function importerCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
    if (!lines.length) return;

    const headers = lines[0].split(",").map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((h, i) => obj[h] = (values[i] || "").trim());
      return obj;
    });

    localStorage.setItem("eleves", JSON.stringify(data));
    _elevesBrut = data.slice();

    const meta = collectMeta(_elevesBrut);
    _labels = meta.labels; _types = meta.types;

    _vueCourante = augmentData(_elevesBrut);
    let keys = allColumnKeys(_vueCourante);
    if (keys.some(k => /^T\d+$/i.test(k))) keys = keys.filter(k => !isSplitKey(k));
    document.getElementById("tri-select").innerHTML = keys.map(k => `<option value="${k}">${humanLabel(k)}</option>`).join("");

    updateTable(_vueCourante);
  };
  reader.readAsText(file);
}

// ------------ Impression (aperçu + bouton) ------------
function imprimerTableau() {
  const table = document.getElementById("participants-table");
  if (!table) return;

  const win = window.open("", "_blank");
  if (!win) { alert("Veuillez autoriser l’ouverture de fenêtres pour imprimer."); return; }

  win.document.write(`
    <html>
      <head>
        <meta charset="utf-8">
        <title>Participants enregistrés</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: Arial, sans-serif; margin: 0; font-size: 12pt; }
          h1 { font-size: 18pt; margin: 12mm 12mm 6mm 12mm; }
          .bar { margin: 0 12mm 6mm 12mm; }
          .btn { font-size: 12pt; padding: 8px 14px; border: 1px solid #aaa; border-radius: 8px; background: #f2f2f2; cursor: pointer; }
          table { border-collapse: collapse; width: calc(100% - 24mm); margin: 0 12mm; }
          th, td { border: 1px solid #ccc; padding: 6pt; text-align: left; vertical-align: top; }
          th { background: #f2f2f2; }
          tr:nth-child(even) { background: #fafafa; }
          td { white-space: normal; word-break: break-word; }
          .footer { margin: 8mm 12mm; font-size: 9pt; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Participants enregistrés</h1>
        <div class="bar">
          <button class="btn" onclick="window.print()">🖨️ Imprimer / PDF</button>
        </div>
        ${table.outerHTML}
        <div class="footer">ScanProf — Impression du ${new Date().toLocaleString()}</div>
      </body>
    </html>
  `);
  win.document.close();
  try { win.focus(); win.print(); } catch(e) {}
}

// ------------ Envoi par mail (inchangé) ------------
function envoyerParMail() {
  const data = _vueCourante.length ? _vueCourante : augmentData(JSON.parse(localStorage.getItem("eleves") || "[]"));
  if (!data.length) return;

  let header = allColumnKeys(data);
  if (header.some(k => /^T\d+$/i.test(k))) header = header.filter(k => !isSplitKey(k));

  const lignes = data.map(e => header.map(k => (e[k] ?? "")).join("\t")).join("%0A");
  const entete = header.join("\t");

  const body = `Bonjour,%0A%0AVoici la liste des participants scannés depuis ScanProf :%0A%0A${encodeURIComponent(entete)}%0A${encodeURIComponent(lignes)}%0A%0ACordialement.`;
  const mailto = `mailto:?subject=${encodeURIComponent("Participants ScanProf")}&body=${body}`;
  window.location.href = mailto;
}

// ------------ Réinitialisation ------------
function resetData() {
  if (confirm("Voulez-vous vraiment réinitialiser la liste ?")) {
    localStorage.removeItem("eleves");
    _elevesBrut = [];
    _vueCourante = [];
    updateTable([]);
  }
}

// --- Suppression par appui long sur une ligne (sans modifier l'UI) ---
(function enableLongPressDelete() {
  const PRESS_MS = 800;  // durée d'appui pour déclencher
  const MOVE_TOL = 8;    // tolérance de mouvement (px)
  const BODY_SEL = "#participants-body";

  let pressTimer = null;
  let startX = 0, startY = 0;
  let targetRow = null;

  function clearTimer() {
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
    targetRow = null;
  }

  function deleteByKey(key) {
    // 1) localStorage
    const arr = JSON.parse(localStorage.getItem("eleves") || "[]");
    const filtered = arr.filter(e => uniqKey(e) !== key);
    localStorage.setItem("eleves", JSON.stringify(filtered));

    // 2) états en mémoire
    _elevesBrut = _elevesBrut.filter(e => uniqKey(e) !== key);
    _vueCourante = _vueCourante.filter(e => uniqKey(e) !== key);

    // 3) rerender
    updateTable(_vueCourante);
  }

  function startPress(row, x, y) {
    clearTimer();
    targetRow = row;
    startX = x; startY = y;

    pressTimer = setTimeout(() => {
      const key = targetRow?.dataset?.key;
      if (!key) return clearTimer();

      if (confirm("Supprimer cette ligne ?")) {
        deleteByKey(key);
      }
      clearTimer();
    }, PRESS_MS);
  }

  // Délégué global : fonctionne après rerender
  document.addEventListener("pointerdown", (e) => {
    const row = e.target.closest("tr[data-key]");
    if (!row) return;
    if (!row.closest(BODY_SEL)) return; // s'assure qu'on est bien sur le tableau participants
    startPress(row, e.clientX, e.clientY);
  }, { passive: true });

  ["pointerup","pointercancel","pointerleave"].forEach(evt =>
    window.addEventListener(evt, clearTimer, { passive: true })
  );

  window.addEventListener("pointermove", (e) => {
    if (!pressTimer) return;
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx > MOVE_TOL || dy > MOVE_TOL) clearTimer(); // annule si on “glisse” (scroll)
  }, { passive: true });
})();

window.onload = afficherParticipants;
