document.addEventListener("DOMContentLoaded", () => {
  const eleves = JSON.parse(localStorage.getItem("eleves") || "[]");
  const tableauBody = document.querySelector("#zenosTable tbody");

  if (!eleves.length) {
    tableauBody.innerHTML = "<tr><td colspan='4'>Aucun élève disponible. Veuillez scanner d’abord avec RunStats.</td></tr>";
    return;
  }

  // Tri par VMA décroissante puis alternance par sexe pour équilibrer
  eleves.sort((a, b) => b.vma - a.vma);

  const groupes = [];
  const tailleGroupe = 4;
  let groupeActuel = [];

  const garcons = eleves.filter(e => e.sexe.toUpperCase() === "G");
  const filles = eleves.filter(e => e.sexe.toUpperCase() === "F");

  while (garcons.length || filles.length) {
    let prochain = null;

    if ((groupeActuel.filter(e => e.sexe === "F").length < 2 || !garcons.length) && filles.length) {
      prochain = filles.shift();
    } else if (garcons.length) {
      prochain = garcons.shift();
    }

    if (prochain) groupeActuel.push(prochain);

    if (groupeActuel.length === tailleGroupe) {
      groupes.push(groupeActuel);
      groupeActuel = [];
    }
  }

  if (groupeActuel.length > 0) groupes.push(groupeActuel); // dernier groupe s'il reste

  groupes.forEach((groupe, index) => {
    groupe.forEach(eleve => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>Groupe ${index + 1}</td>
        <td>${eleve.nom}</td>
        <td>${eleve.prenom}</td>
        <td>${eleve.sexe}</td>
        <td>${eleve.vma} km/h</td>
        <td>${eleve.vitesse} km/h</td>
        <td>${eleve.distance} m</td>
      `;
      tableauBody.appendChild(tr);
    });
  });

  // 🎯 Bouton Imprimer
  document.getElementById("imprimerBtn").addEventListener("click", () => {
    window.print();
  });

  // 📊 Bouton Radar - Affiche un radar comparatif des groupes (VMA, Vitesse, Distance, Mixité)
  document.getElementById("radarBtn").addEventListener("click", () => {
    const ctx = document.getElementById("radarChart").getContext("2d");

    const labels = ["VMA Moy.", "Vitesse Moy.", "Distance Moy.", "Mixité (%)"];
    const datasets = groupes.map((groupe, i) => {
      const vma = groupe.reduce((a, b) => a + b.vma, 0) / groupe.length;
      const vit = groupe.reduce((a, b) => a + b.vitesse, 0) / groupe.length;
      const dist = groupe.reduce((a, b) => a + b.distance, 0) / groupe.length;
      const mix = (groupe.filter(e => e.sexe === "F").length / groupe.length) * 100;

      return {
        label: `Groupe ${i + 1}`,
        data: [vma, vit, dist, mix],
        fill: true
      };
    });

    new Chart(ctx, {
      type: "radar",
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        plugins: {
          title: {
            display: true,
            text: "Équilibre des groupes (ZENOS Tour)"
          },
          legend: {
            position: 'top'
          }
        }
      }
    });

    document.getElementById("graphiqueSection").style.display = "block";
  });
});
