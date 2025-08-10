// === Etat en mémoire pour le tri/filtre ===
let _elevesBrut = [];   // données RAW depuis localStorage
let _vueCourante = [];  // vue “augmentée” (T1..Tn, etc.)
let _labels = {};       // labels humains optionnels (via __labels)
let _types  = {};       // types optionnels (via __types): "time" | "number" | "text"

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
  const map = {
    nom: "Nom", prenom: "Prénom", classe: "Classe", sexe: "Sexe",
    distance: "Distance", vitesse: "Vitesse", vma: "VMA",
    temps_total: "Temps total"
  };
  if (map[key]) return map[key];
  if (/^t\d+$/i.test(key)) return key.toUpperCase(); // T1..Tn
  // défaut: remplace _ par espace + capitalise
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

// colonnes (standard d’abord, puis autres en alpha)
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

// Vue “augmentée” avec T1..Tn si un champ split est présent
function augmentData(rows) {
  if (!rows || !rows.length) return [];
  const splitKeys = new Set();
  rows.forEach(r => Object.keys(r || {}).forEach(k => { if (isSplitKey(k)) splitKeys.add(k); }));
  if (splitKeys.size === 0) return rows.map(r => ({...r}));

  let maxSplits = 0;
  rows.forEach(r => {
    for (const k of splitKeys) maxSplits = Math.max(maxSplits, parseSplits(r[k]).length);
  });
  const tCols = Array.from({length:maxSplits}, (_,i)=>`T${i+1}`);

  return rows.map(r => {
    const obj = {...r};
    let hadSplits = false;
    for (const k of splitKeys) {
      const arr = parseSplits(r[k]);
      if (arr.length) hadSplits = true;
      tCols.forEach((tName, idx) => {
        if (obj[tName] == null) obj[tName] = arr[idx] ?? "";
      });
    }
    if (hadSplits) { for (const k of splitKeys) delete obj[k]; }
    return obj;
  });
}

// ------------ Helpers tri: time/number ------------
function looksLikeTime(v) {
  const s = String(v || "");
  // hh:mm:ss(.ms) | mm:ss(.ms) | ss(.ms)
  return /^(\d{1,2}:)?\d{1,2}:\d{1,2}(\.\d+)?$/.test(s) || /^\d{1,2}(\.\d+)?$/.test(s);
}
function parseTimeToSeconds(v) {
  if (v == null) return Number.POSITIVE_INFINITY;
  const s = String(v).trim();
  if (s.includes(":")) {
    const parts = s.split(":").map(x=>x.trim());
    let h=0, m=0, sec=0;
    if (parts.length === 3) { h = +parts[0]||0; m = +parts[1]||0; sec = parseFloat(parts[2])||0; }
    else if (parts.length === 2) { m = +parts[0]||0; sec = parseFloat(parts[1])||0; }
    else { sec = parseFloat(parts[0])||0; }
    return h*3600 + m*60 + sec;
  }
  const n = parseFloat(s);
  return isNaN(n) ? Number.POSITIVE_INFINITY : n;
}

function typedSortValue(key, val) {
  const t = (_types && _types[key]) || null;
  if (t === "time" || (!t && (key.toLowerCase()==="temps_total" || /^t\d+$/i.test(key) || looksLikeTime(val)))) {
    return parseTimeToSeconds(val);
  }
  if (t === "number") {
    const n = parseFloat(val);
    return isNaN(n) ? Number.POSITIVE_INFINITY : n;
  }
  // fallback: texte
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

  tbody.innerHTML = data.map((row, i) => {
    const tds = cols.map(k => formatCellValue(k, row[k])).join("</td><td>");
    return `<tr class="${i % 2 === 0 ? 'pair' : 'impair'}"><td>${tds}</td></tr>`;
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

// ------------ Tri dynamique ------------
function trierParticipants() {
  const critere = document.getElementById("tri-select").value;
  let data = _vueCourante.length ? _vueCourante.slice() : augmentData(JSON.parse(localStorage.getItem("eleves") || "[]"));
  if (data.length === 0) return;

  data.sort((a, b) => {
    const va = typedSortValue(critere, a[critere]);
    const vb = typedSortValue(critere, b[critere]);
    if (typeof va === "number" && typeof vb === "number") return va - vb;
    return String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
  });

  _vueCourante = data;
  updateTable(data);
}

// ------------ Export CSV (avec T1..Tn) ------------
function exporterCSV() {
  const data = _vueCourante.length ? _vueCourante : augmentData(JSON.parse(localStorage.getItem("eleves") || "[]"));
  if (!data.length) return;

  let header = allColumnKeys(data);
  if (header.some(k => /^T\d+$/i.test(k))) header = header.filter(k => !isSplitKey(k)); // masque ‘intermediaires’ si T* présent

  const rows = data.map(row => header.map(k => (row[k] ?? "")).join(","));
  const csv = [header.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "participants.csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ------------ Import CSV ------------
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

// ------------ Impression (fiable iPad) ------------
function imprimerTableau() {
  const table = document.getElementById("participants-table");
  if (!table) return;

  // Ouvre un onglet d’aperçu avec un bouton “Imprimer” (évite le blocage iOS d’impression auto)
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
  // On ESSAIE d’imprimer (sera ignoré si iOS bloque), sinon l’utilisateur clique sur le bouton
  try { win.focus(); win.print(); } catch(e) {}
}

// ------------ Envoi par mail ------------
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

window.onload = afficherParticipants;
