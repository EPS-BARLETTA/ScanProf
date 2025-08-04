document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("elevesTableBody");
  const eleves = JSON.parse(localStorage.getItem("eleves") || "[]");

  if (!eleves.length) {
    tableBody.innerHTML = '<tr><td colspan="7">Aucun élève chargé. Veuillez d\'abord scanner ou importer des données.</td></tr>';
    return;
  }

  function renderTable(data) {
    tableBody.innerHTML = data.map(eleve => `
      <tr>
        <td>${eleve.nom}</td>
        <td>${eleve.prenom}</td>
        <td>${eleve.classe}</td>
        <td>${eleve.sexe}</td>
        <td>${eleve.distance || ""}</td>
        <td>${eleve.vitesse || ""}</td>
        <td>${eleve.vma || ""}</td>
      </tr>
    `).join("");
  }

  function sortBy(key, ascending = true) {
    eleves.sort((a, b) => {
      if (typeof a[key] === "number") {
        return ascending ? a[key] - b[key] : b[key] - a[key];
      } else {
        return ascending
          ? (a[key] || "").localeCompare(b[key] || "")
          : (b[key] || "").localeCompare(a[key] || "");
      }
    });
    renderTable(eleves);
  }

  // Tri initial (par nom)
  renderTable(eleves);

  // Fonctions boutons
  window.sortBy = (key) => sortBy(key);

  window.goHome = () => {
    window.location.href = "index.html";
  };

  window.goZenos = () => {
    window.location.href = "groupe-zenos.html";
  };

  window.exportCSV = () => {
    const headers = ["Nom", "Prénom", "Classe", "Sexe", "Distance", "Vitesse", "VMA"];
    const rows = eleves.map(e =>
      [e.nom, e.prenom, e.classe, e.sexe, e.distance || "", e.vitesse || "", e.vma || ""]
    );
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "participants_scanprof.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
});
