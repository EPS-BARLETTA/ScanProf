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

  function sortByKey(key, ascending = true) {
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

  // Tri par défaut
  renderTable(eleves);

  // Boutons de tri
  document.getElementById("sortNom").addEventListener("click", () => sortByKey("nom", true));
  document.getElementById("sortClasse").addEventListener("click", () => sortByKey("classe", true));
  document.getElementById("sortSexe").addEventListener("click", () => sortByKey("sexe", true));
  document.getElementById("sortDistanceAsc").addEventListener("click", () => sortByKey("distance", true));
  document.getElementById("sortDistanceDesc").addEventListener("click", () => sortByKey("distance", false));
  document.getElementById("sortVitesseAsc").addEventListener("click", () => sortByKey("vitesse", true));
  document.getElementById("sortVitesseDesc").addEventListener("click", () => sortByKey("vitesse", false));
  document.getElementById("sortVma").addEventListener("click", () => sortByKey("vma", true));

  // Bouton Imprimer
  document.getElementById("btnImprimer").addEventListener("click", () => {
    window.print();
  });

  // Bouton Retour accueil
  document.getElementById("btnAccueil").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Bouton Groupe ZENOS
  document.getElementById("btnZenos").addEventListener("click", () => {
    window.location.href = "groupe-zenos.html";
  });
});

