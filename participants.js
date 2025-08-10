// === Etat en mémoire pour le tri/filtre ===
let _elevesBrut = [];
let _vueCourante = [];

// --- Helpers ---
// Calcule l’ensemble des colonnes présentes (standard d’abord si dispo, puis autres clés en alpha)
function allColumnKeys(rows) {
  if (!rows || !rows.length) return [];
  const standard = ["nom","prenom","classe","sexe","distance","vitesse","vma","intermediaires","temps_total"];
  const set = new Set();
  rows.forEach(r => Object.keys(r || {}).forEach(k => set.add(k)));
  const others = Array.from(set)
    .filter(k => !standard.includes(k))
    .sort((a,b)=>a.localeCompare(b,'fr',{sensitivity:'base'}));
  return [...standard.filter(k => set.has(k)), ...others];
}

// Améliore le rendu de certaines cellules (splits/intermédiaires, objets, listes…)
function formatCellValue(key, val) {
  if (val == null) return "";
  const k = (key || "").toLowerCase();

  // Détecte listes séparées par virgule/point-virgule : affiche en “pills” empilés
  if (typeof val === "string" && /[,;]/.test(val) && (k.includes("inter") || k.includes("split") || k.includes("temps"))) {
    const parts = val.split(/[;,]\s*/).filter(Boolean);
    return parts.map(s =>
      `<span style="display:inline-block;margin:2px 4px 2px 0;padding:2px 6px;border-radius:999px;background:#eef;border:1px solid #d5d9ff;">${s}</span>`
    ).join("<br>");
  }

  // Aplatissement simple si array/objet
  if (Array.isArray(val)) return val.map(v => formatCellValue(k, v)).join("<br>");
  if (typeof val === "object") {
    return Object.entries(val).map(([kk, vv]) => `<div><strong>${kk}:</strong> ${formatCellValue(kk, vv)}</div>`).join("");
  }

  return String(val);
}

// -------- Initialisation --------
function afficherParticipants() {
  _elevesBrut = JSON.parse(localStorage.getItem("eleves") || "[]");
  _vueCourante = _elevesBrut.slice();

  const triSelect = document.getElementById("tri-select");

  // Alimente le menu de tri d'après l’union des clés présentes
  if (_elevesBrut.length > 0) {
    const keys = allColumnKeys(_elevesBrut);
    triSelect.innerHTML = keys.map(k => `<option value="${k}">${k}</option>`).join("");
  } else {
    triSelect.innerHTML = "";
  }

  updateTable(_vueCourante);
}

// -------- Rendu tableau avec colonnes dynamiques --------
function updateTable(data) {
  const thead = document.getElementById("table-head");
  const tbody = document.getElementById("participants-body");
  if (!thead || !tbody) return;

  if (!data || data.length === 0) {
    thead.innerHTML = "";
    tbody.innerHTML = `<tr><td colspan="1">Aucun élève enregistré.</td></tr>`;
    return;
  }

  const cols = allColumnKeys(data);

  // Header
  thead.innerHTML = `<tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr>`;

  // Body
  tbody.innerHTML = data.map((row, i) => {
    const tds = cols.map(k => formatCellValue(k, row[k])).join("</td><td>");
    return `<tr class="${i % 2 === 0 ? 'pair' : 'impair'}"><td>${tds}</td></tr>`;
  }).join("");
}

// -------- Filtre texte --------
function filtrerTexte() {
  const q = (document.getElementById("filtre-txt").value || "").toLowerCase().trim();
  _elevesBrut = JSON.parse(localStorage.getItem("eleves") || "[]");

  if (!q) {
    _vueCourante = _elevesBrut.slice();
    updateTable(_vueCourante);
    return;
  }

  _vueCourante = _elevesBrut.filter(obj => {
    for (const k in obj) {
      const val = (obj[k] == null ? "" : String(obj[k])).toLowerCase();
      if (val.indexOf(q) !== -1) return true;
    }
    return false;
  });

  updateTable(_vueCourante);
}

// -------- Tri dynamique --------
function trierParticipants() {
  const critere = document.getElementById("tri-select").value;
  let data = _vueCourante.length ? _vueCourante.slice() : JSON.parse(localStorage.getItem("eleves") || "[]");
  if (data.length === 0) return;

  data.sort((a, b) => {
    const A = a[critere], B = b[critere];
    if (!isNaN(parseFloat(A)) && !isNaN(parseFloat(B))) {
      return parseFloat(A) - parseFloat(B); // tri numérique
    }
    return String(A || "").localeCompare(String(B || ""), "fr", { sensitivity: "base" });
  });

  _vueCourante = data;
  updateTable(data);
}

// -------- Export CSV --------
function exporterCSV() {
  const data = _vueCourante.length ? _vueCourante : JSON.parse(localStorage.getItem("eleves") || "[]");
  if (!data.length) return;

  const header = allColumnKeys(data);
  const rows = data.map(row => header.map(k => (row[k] ?? "")).join(","));
  const csv = [header.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "participants.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------- Import CSV --------
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
    _vueCourante = data.slice();

    // Met à jour tri-select et tableau avec les nouvelles colonnes importées
    const triSelect = document.getElementById("tri-select");
    const keys = allColumnKeys(_elevesBrut);
    triSelect.innerHTML = keys.map(k => `<option value="${k}">${k}</option>`).join("");

    updateTable(_vueCourante);
  };
  reader.readAsText(file);
}

// -------- Impression (fiable iPad) --------
function imprimerTableau() {
  const table = document.getElementById("participants-table");
  if (!table) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow || iframe.contentDocument;
  const wdoc = doc.document || doc;
  wdoc.open();
  wdoc.write(`
    <html>
      <head>
        <meta charset="utf-8">
        <title>Participants</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: Arial, sans-serif; margin: 0; font-size: 12pt; }
          h1 { font-size: 16pt; margin: 0 0 8mm 0; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 6pt; text-align: left; vertical-align: top; }
          th { background: #f2f2f2; }
          tr:nth-child(even) { background: #fafafa; }
          td { white-space: normal; word-break: break-word; }
          .footer { margin-top: 8mm; font-size: 9pt; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Participants enregistrés</h1>
        ${table.outerHTML}
        <div class="footer">ScanProf — Impression du ${new Date().toLocaleString()}</div>
      </body>
    </html>
  `);
  wdoc.close();

  setTimeout(() => {
    (iframe.contentWindow || iframe).focus();
    (iframe.contentWindow || iframe).print();
    setTimeout(() => document.body.removeChild(iframe), 800);
  }, 120);
}

// -------- Envoi par mail --------
function envoyerParMail() {
  const data = _vueCourante.length ? _vueCourante : JSON.parse(localStorage.getItem("eleves") || "[]");
  if (!data.length) return;

  const header = allColumnKeys(data);
  const lignes = data.map(e => header.map(k => (e[k] ?? "")).join("\t")).join("%0A");
  const entete = header.join("\t");

  const body = `Bonjour,%0A%0AVoici la liste des participants scannés depuis ScanProf :%0A%0A${encodeURIComponent(entete)}%0A${encodeURIComponent(lignes)}%0A%0ACordialement.`;
  const mailto = `mailto:?subject=${encodeURIComponent("Participants ScanProf")}&body=${body}`;
  window.location.href = mailto;
}

// -------- Réinitialisation --------
function resetData() {
  if (confirm("Voulez-vous vraiment réinitialiser la liste ?")) {
    localStorage.removeItem("eleves");
    _elevesBrut = [];
    _vueCourante = [];
    updateTable([]);
  }
}

window.onload = afficherParticipants;
