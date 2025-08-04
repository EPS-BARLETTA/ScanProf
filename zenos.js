document.addEventListener("DOMContentLoaded", () => {
  const groupesContainer = document.getElementById("groupesContainer");
  const liste = JSON.parse(localStorage.getItem("eleves") || "[]");

  if (!liste.length) {
    groupesContainer.innerHTML = "<p>Aucun élève trouvé. Veuillez scanner des QR codes ou importer un fichier CSV via RunStats.</p>";
    return;
  }

  // Sélectionner uniquement les champs nécessaires
  const donneesValides = liste.filter(e =>
    e.nom && e.prenom && e.classe && e.sexe && !isNaN(e.vma)
  );

  // Tri par VMA décroissante
  donneesValides.sort((a, b) => b.vma - a.vma);

  // Séparer les filles et les garçons
  const filles = donneesValides.filter(e => e.sexe.toLowerCase().startsWith("f"));
  const garcons = donneesValides.filter(e => e.sexe.toLowerCase().startsWith("g"));

  const groupes = [];
  const tailleGroupe = 4;

  while (filles.length || garcons.length) {
    const groupe = [];

    // Mélange un peu les genres mais garde une certaine alternance
    if (filles.length > 0) groupe.push(filles.shift());
    if (garcons.length > 0) groupe.push(garcons.shift());
    if (filles.length > 0) groupe.push(filles.pop());
    if (garcons.length > 0) groupe.push(garcons.pop());

    groupes.push(groupe.filter(Boolean)); // retirer les undefined si effectif impair
  }

  groupes.forEach((groupe, index) => {
    const div = document.createElement("div");
    div.className = "group";
    div.innerHTML = `
      <h3>Groupe ${index + 1}</h3>
      <ul>
        ${groupe.map(e => `
          <li>${e.prenom} ${e.nom} – ${e.classe} – ${e.sexe} – VMA : ${e.vma} km/h</li>
        `).join("")}
      </ul>
    `;
    groupesContainer.appendChild(div);
  });
});
