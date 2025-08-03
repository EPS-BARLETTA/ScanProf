function exporterCSV() {
  if (tableauEleves.length === 0) return;

  const champs = Object.keys(tableauEleves[0]);
  const lignes = [champs.join(",")];

  tableauEleves.forEach(eleve => {
    const ligne = champs.map(c => `"${(eleve[c] || "").toString().replace(/"/g, '""')}"`).join(",");
    lignes.push(ligne);
  });

  const csvContent = lignes.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const lien = document.createElement("a");
  lien.setAttribute("href", url);
  lien.setAttribute("download", "tri_scanprof.csv");
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
}

function resetDonnees() {
  if (confirm("Voulez-vous vraiment supprimer tous les élèves ?")) {
    localStorage.removeItem("eleves");
    location.reload();
  }
}
