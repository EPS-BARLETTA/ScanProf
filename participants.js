// Fonction d'affichage du tableau
function afficherParticipants() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");
  const tableBody = document.getElementById("participants-body");
  const triSelect = document.getElementById("tri-select");

  if (!tableBody) return;

  // Affichage initial
  updateTable(data);

  // Remplir le menu de tri dynamiquement
  if (data.length > 0) {
    const keys = Object.keys(data[0]);
    triSelect.innerHTML = keys
      .map(key => `<option value="${key}">${key}</option>`)
      .join("");
  }
}

// Fonction de tri
function trierParticipants() {
  const critere = document.getElementById("tri-select").value;
  let data = JSON.parse(localStorage.getItem("eleves") || "[]");

  if (data.length === 0) return;

  if (!isNaN(parseFloat(data[0][critere]))) {
    data.sort((a, b) => parseFloat(b[critere]) - parseFloat(a[critere]));
  } else {
    data.sort((a, b) => ("" + a[critere]).localeCompare(b[critere]));
  }

  updateTable(data);
}

// Affichage tableau
function updateTable(data) {
  const tableBody = document.getElementById("participants-body");

  tableBody.innerHTML = data
    .map((e, i) => `
      <tr class="${i % 2 === 0 ? 'pair' : 'impair'}">
        <td>${e.nom || ""}</td>
        <td>${e.prenom || ""}</td>
        <td>${e.classe || ""}</td>
        <td>${e.sexe || ""}</td>
        <td>${e.distance || ""}</td>
        <td>${e.vitesse || ""}</td>
        <td>${e.vma || ""}</td>
      </tr>
    `)
    .join("");
}

// Export CSV
function exporterCSV() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");
  if (data.length === 0) return;

  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(","),
    ...data.map(row => keys.map(k => row[k] ?? "").join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "participants.csv";
  a.click();
}

// Import CSV
function importerCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const [header, ...lines] = text.split("\n").filter(l => l.trim() !== "");
    const keys = header.split(",");

    const data = lines.map(line => {
      const values = line.split(",");
      const obj = {};
      keys.forEach((key, i) => obj[key.trim()] = values[i]?.trim() || "");
      return obj;
    });

    localStorage.setItem("eleves", JSON.stringify(data));
    updateTable(data);
  };
  reader.readAsText(file);
}

// Impression
function imprimerTableau() {
  const contenu = document.getElementById("participants-table").outerHTML;
  const fenetre = window.open("", "_blank");
  fenetre.document.write(`
    <html>
      <head>
        <title>Participants</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 5px; text-align: center; }
          tr.pair { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>Liste des participants</h2>
        ${contenu}
        <footer style="margin-top:20px;">ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB</footer>
      </body>
    </html>
  `);
  fenetre.document.close();
  fenetre.print();
}

// Envoi mail
function envoyerParMail() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");
  if (data.length === 0) return;

  const lignes = data.map(e =>
    `${e.nom}, ${e.prenom}, ${e.classe}, ${e.sexe}, ${e.distance}, ${e.vitesse}, ${e.vma}`
  ).join("%0A");

  const mailto = `mailto:?subject=Participants ScanProf&body=Bonjour,%0AVoici la liste des participants scannés :%0A%0A${lignes}%0A%0ACordialement.`;
  window.location.href = mailto;
}

// Réinitialiser
function resetData() {
  if (confirm("Supprimer tous les participants ?")) {
    localStorage.removeItem("eleves");
    location.reload();
  }
}

window.onload = afficherParticipants;
