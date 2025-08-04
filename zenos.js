document.addEventListener("DOMContentLoaded", () => {
  const groupesContainer = document.getElementById("groupesContainer");
  const btnExport = document.getElementById("btnExportCSV");
  const btnImprimer = document.getElementById("btnImprimer");

  const liste = JSON.parse(localStorage.getItem("eleves") || "[]");

  if (!liste.length) {
    groupesContainer.innerHTML = "<p>Aucun élève trouvé. Veuillez scanner des QR codes ou importer un fichier CSV via RunStats.</p>";
    btnExport.disabled = true;
    btnImprimer.disabled = true;
    return;
  }

  const donneesValides = liste.filter(e =>
    e.nom && e.prenom && e.classe && e.sexe && !isNaN(e.vma)
  );

  // Tri décroissant VMA
  donneesValides.sort((a, b) => b.vma - a.vma);

  const filles = donneesValides.filter(e => e.sexe.toLowerCase().startsWith("f"));
  const garcons = donneesValides.filter(e => e.sexe.toLowerCase().startsWith("g"));

  const groupes = [];
  const tailleGroupe = 4;

  while (filles.length || garcons.length) {
    const groupe = [];

    if (filles.length > 0) groupe.push(filles.shift());
    if (garcons.length > 0) groupe.push(garcons.shift());
    if (filles.length > 0) groupe.push(filles.pop());
    if (garcons.length > 0) groupe.push(garcons.pop());

    groupes.push(groupe.filter(Boolean));
  }

  // Affichage HTML
  groupesContainer.innerHTML = "";
  groupes.forEach((groupe, index) => {
    const div = document.createElement("div");
    div.className = "group";
    div.innerHTML = `
      <h3>Groupe ${index + 1}</h3>
      <ul>
        ${groupe.map(e => `
          <li>${e.prenom} ${e.nom} – ${e.classe} – ${e.sexe} – Distance: ${e.distance} m – Vitesse: ${e.vitesse} km/h – VMA : ${e.vma} km/h</li>
        `).join("")}
      </ul>
    `;
    groupesContainer.appendChild(div);
  });

  // 📥 Export CSV
  btnExport.addEventListener("click", () => {
    const lignes = [["Groupe", "Nom", "Prénom", "Classe", "Sexe", "Distance", "Vitesse", "VMA"]];
    groupes.forEach((groupe, index) => {
      groupe.forEach(e => {
        lignes.push([
          `Groupe ${index + 1}`,
          e.nom, e.prenom, e.classe, e.sexe,
          e.distance, e.vitesse, e.vma
        ]);
      });
    });

    const csvContent = lignes.map(l => l.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "groupes_zenos.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // 🖨 Impression
  btnImprimer.addEventListener("click", () => {
    window.print();
  });
});
