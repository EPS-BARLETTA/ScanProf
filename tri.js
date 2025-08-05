document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("elevesTableBody");
  const triSelect = document.getElementById("triSelect");
  const eleves = JSON.parse(localStorage.getItem("eleves") || "[]");

  if (!eleves.length) {
    tableBody.innerHTML = '<tr><td colspan="10">Aucun élève chargé. Veuillez d’abord scanner ou importer des données.</td></tr>';
    return;
  }

  // Génère dynamiquement les colonnes disponibles
  const colonnes = Object.keys(eleves[0]);
  triSelect.innerHTML = colonnes.map(col => `<option value="${col}">${col.charAt(0).toUpperCase() + col.slice(1)}</option>`).join("");

  // Affiche les données dans le tableau
  function renderTable(data) {
    tableBody.innerHTML = data.map(eleve => `
      <tr>
        ${colonnes.map(col => `<td>${eleve[col] || ""}</td>`).join("")}
      </tr>
    `).join("");
  }

  // Fonction de tri selon la clé sélectionnée
  document.getElementById("btnTrier").addEventListener("click", () => {
    const critere = triSelect.value;
    eleves.sort((a, b) => {
      const valA = a[critere];
      const valB = b[critere];
      if (!isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) {
        return parseFloat(valA) - parseFloat(valB);
      }
      return (valA || "").toString().localeCompare((valB || "").toString());
    });
    renderTable(eleves);
  });

  // Export CSV
  document.getElementById("btnExporter").addEventListener("click", () => {
    const lignes = [colonnes];
    eleves.forEach(eleve => {
      lignes.push(colonnes.map(col => eleve[col] || ""));
    });
    const csv = lignes.map(ligne => ligne.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "eleves_tries.csv";
    link.click();
  });

  // Impression
  document.getElementById("btnImprimer").addEventListener("click", () => {
    window.print();
  });

  // Retour accueil
  document.getElementById("btnAccueil").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Groupe ZENOS
  document.getElementById("btnZenos").addEventListener("click", () => {
    window.location.href = "groupe-zenos.html";
  });

  // Tri initial
  renderTable(eleves);
});
