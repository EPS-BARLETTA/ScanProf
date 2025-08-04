function genererGroupes() {
  const liste = JSON.parse(localStorage.getItem("eleves") || "[]");

  if (liste.length < 4) {
    alert("⚠️ Pas assez d'élèves pour former des groupes.");
    return;
  }

  // Filtrage des données nécessaires (RunStats)
  const elevesValides = liste.filter(e =>
    e.nom && e.prenom && e.classe && e.sexe && !isNaN(e.vma)
  );

  // Tri décroissant par VMA
  elevesValides.sort((a, b) => b.vma - a.vma);

  // Séparation garçons / filles
  const filles = elevesValides.filter(e => e.sexe.toLowerCase() === "f");
  const garcons = elevesValides.filter(e => e.sexe.toLowerCase() === "g");

  const groupes = [];

  while (elevesValides.length >= 4) {
    const groupe = [];

    // Alterner haut/bas tableau pour hétérogénéité
    groupe.push(elevesValides.shift()); // VMA haute
    groupe.push(elevesValides.pop());   // VMA basse

    // Compléter en respectant la mixité si possible
    if (filles.length > 0) groupe.push(filles.shift());
    else if (garcons.length > 0) groupe.push(garcons.shift());

    if (filles.length > 0) groupe.push(filles.pop());
    else if (garcons.length > 0) groupe.push(garcons.pop());

    groupes.push(groupe.filter(Boolean));
  }

  // Affichage
  const container = document.getElementById("groupesContainer");
  container.innerHTML = `
    <h2>${groupes.length} groupe(s) généré(s)</h2>
    <table>
      <thead>
        <tr>
          <th>Groupe</th>
          <th>Nom</th>
          <th>Prénom</th>
          <th>Sexe</th>
          <th>Classe</th>
          <th>VMA</th>
        </tr>
      </thead>
      <tbody>
        ${groupes
          .map((groupe, index) =>
            groupe
              .map(eleve => `
                <tr>
                  <td>Groupe ${index + 1}</td>
                  <td>${eleve.nom}</td>
                  <td>${eleve.prenom}</td>
                  <td>${eleve.sexe}</td>
                  <td>${eleve.classe}</td>
                  <td>${eleve.vma}</td>
                </tr>
              `)
              .join("")
          )
          .join("")}
      </tbody>
    </table>
  `;

  // Stocker pour graphique
  localStorage.setItem("groupesZenos", JSON.stringify(groupes));
}

function afficherGraphique() {
  const groupes = JSON.parse(localStorage.getItem("groupesZenos") || "[]");
  if (groupes.length === 0) {
    alert("Veuillez d'abord générer les groupes.");
    return;
  }

  const ctx = document.getElementById("radarChart").getContext("2d");
  document.getElementById("chartContainer").style.display = "block";

  const labels = ["VMA", "Vitesse", "Distance", "Mixité"];

  const datasets = groupes.map((groupe, i) => {
    const couleurs = ["rgba(52,152,219,0.5)", "rgba(231,76,60,0.5)", "rgba(46,204,113,0.5)", "rgba(155,89,182,0.5)", "rgba(241,196,15,0.5)"];
    const border = couleurs[i % couleurs.length].replace("0.5", "1");

    const vmas = groupe.map(e => parseFloat(e.vma) || 0);
    const vitesses = groupe.map(e => parseFloat(e.vitesse) || 0);
    const distances = groupe.map(e => parseFloat(e.distance) || 0);
    const mixite = groupe.filter(e => e.sexe.toLowerCase() === "f").length;

    const moyenne = arr => arr.reduce((a, b) => a + b, 0) / arr.length || 0;

    return {
      label: `Groupe ${i + 1}`,
      data: [
        moyenne(vmas),
        moyenne(vitesses),
        moyenne(distances),
        mixite / groupe.length * 100
      ],
      backgroundColor: couleurs[i % couleurs.length],
      borderColor: border,
      borderWidth: 1
    };
  });

  if (window.radarChart) window.radarChart.destroy();

  window.radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets
    },
    options: {
      scales: {
        r: {
          angleLines: { display: true },
          suggestedMin: 0,
          suggestedMax: 100
        }
      },
      plugins: {
        title: {
          display: true,
          text: "Équilibre des groupes ZENOS",
          font: { size: 16 }
        }
      }
    }
  });
}
