// Affichage initial
function afficherParticipants() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");
  const triSelect = document.getElementById("tri-select");
  updateTable(data);

  // Alimente le menu de tri selon les clés présentes
  if (data.length > 0) {
    const keys = Object.keys(data[0]);
    triSelect.innerHTML = keys.map(k => `<option value="${k}">${k}</option>`).join("");
  }
}

// Met à jour le tableau HTML
function updateTable(data) {
  const tbody = document.getElementById("participants-body");
  if (!tbody) return;

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

// Tri dynamique
function trierParticipants() {
  const critere = document.getElementById("tri-select").value;
  let data = JSON.parse(localStorage.getItem("eleves") || "[]");

  data.sort((a, b) => {
    const valA = a[critere];
    const valB = b[critere];

    if (!isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) {
      return parseFloat(valA) - parseFloat(valB); // tri numérique
    }
    return (valA || "").toString().localeCompare((valB || "").toString(), "fr", { sensitivity: "base" });
  });

  updateTable(data);
}

// Export CSV
function exporterCSV() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");
  if (data.length === 0) return;

  const enTete = Object.keys(data[0]).join(";");
  const lignes = data.map(obj => Object.values(obj).join(";"));
  const csv = [enTete, ...lignes].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = "participants.csv";
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
}

// Import CSV
function importerCSV(event) {
  const fichier = event.target.files[0];
  if (!fichier) return;

  const lecteur = new FileReader();
  lecteur.onload = function(e) {
    const lignes = e.target.result.split("\n").map(l => l.trim()).filter(l => l);
    const enTete = lignes[0].split(";");
    const data = lignes.slice(1).map(ligne => {
      const valeurs = ligne.split(";");
      const obj = {};
      enTete.forEach((cle, idx) => {
        obj[cle] = valeurs[idx] || "";
      });
      return obj;
    });

    localStorage.setItem("eleves", JSON.stringify(data));
    updateTable(data);
  };
  lecteur.readAsText(fichier);
}

// Impression
function imprimerParticipants() {
  const contenu = document.getElementById("participants-table").outerHTML;
  const fenetre = window.open("", "_blank");
  fenetre.document.write(`
    <html>
    <head>
      <title>Liste des participants</title>
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid black; padding: 8px; text-align: center; }
        tr:nth-child(even) { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h2>Liste des participants</h2>
      ${contenu}
    </body>
    </html>
  `);
  fenetre.document.close();
  fenetre.print();
}

// Envoi par mail avec CSV en pièce jointe simulée (mailto avec corps)
function envoyerParMail() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");
  if (data.length === 0) return;

  const enTete = Object.keys(data[0]).join("\t");
  const lignes = data.map(obj => Object.values(obj).join("\t"));
  const texte = [enTete, ...lignes].join("\n");

  const mailto = `mailto:?subject=Liste des participants&body=${encodeURIComponent(texte)}`;
  window.location.href = mailto;
}

// Réinitialisation
function reinitialiserParticipants() {
  if (confirm("Voulez-vous vraiment effacer tous les participants ?")) {
    localStorage.removeItem("eleves");
    updateTable([]);
  }
}

// Initialisation au chargement
window.onload = afficherParticipants;
