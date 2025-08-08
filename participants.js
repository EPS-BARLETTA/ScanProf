// === Etat en mémoire pour le tri/filtre ===
let _elevesBrut = [];
let _vueCourante = [];

// -------- Initialisation --------
function afficherParticipants() {
  _elevesBrut = JSON.parse(localStorage.getItem("eleves") || "[]");
  _vueCourante = _elevesBrut.slice();

  const triSelect = document.getElementById("tri-select");
  updateTable(_vueCourante);

  // Alimente le menu de tri d'après les clés présentes
  if (_elevesBrut.length > 0) {
    const keys = Object.keys(_elevesBrut[0]);
    triSelect.innerHTML = keys.map(k => `<option value="${k}">${k}</option>`).join("");
  }
}

// -------- Affichage du tableau --------
function updateTable(data) {
  const tbody = document.getElementById("participants-body");
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">Aucun élève enregistré.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((e, i) => `
    <tr class="${i % 2 === 0 ? 'pair' : 'impair'}">
      <td>${e.nom ?? ""}</td>
      <td>${e.prenom ?? ""}</td>
      <td>${e.classe ?? ""}</td>
      <td>${e.sexe ?? ""}</td>
      <td>${e.distance ?? ""}</td>
      <td>${e.vitesse ?? ""}</td>
      <td>${e.vma ?? ""}</td>
    </tr>
  `).join("");
}

// -------- Filtre texte (sur toutes les colonnes) --------
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

  // Utilise les colonnes standard si dispo, sinon toutes les clés du 1er objet
  const standard = ["nom","prenom","classe","sexe","distance","vitesse","vma"];
  const keys = standard.filter(k => k in data[0]);
  const header = (keys.length ? keys : Object.keys(data[0]));

  const rows = data.map(row => header.map(k => (row[k] ?? "")).join(","));
  const csv = [header.join(","), ...rows].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "participants.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
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
    updateTable(_vueCourante);
  };
  reader.readAsText(file);
}

// -------- Impression --------
function imprimerTableau() {
  const table = document.getElementById("participants-table");
  if (!table) return;

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Participants</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 6px; text-align: center; }
          thead th { background: #eef5ff; }
          tbody tr:nth-child(even) { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2 style="text-align:center;">Liste des participants</h2>
        ${table.outerHTML}
        <div style="margin-top:16px; text-align:center;">ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB</div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
}

// -------- Envoi par mail --------
function envoyerParMail() {
  const data = _vueCourante.length ? _vueCourante : JSON.parse(localStorage.getItem("eleves") || "[]");
  if (!data.length) return;

  const header = ["nom","prenom","classe","sexe","distance","vitesse","vma"];
  const lignes = data.map(e => header.map(k => (e[k] ?? "")).join("\t")).join("%0A");
  const entete = header.join("\t");

  const body = `Bonjour,%0A%0AVoici la liste des participants scannés :%0A%0A${encodeURIComponent(entete)}%0A${encodeURIComponent(lignes)}%0A%0ACordialement.`;
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
