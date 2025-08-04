document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("groupesContainer");
  const radarCanvas = document.getElementById("radarChart");

  const eleves = JSON.parse(localStorage.getItem("eleves") || "[]");

  if (!eleves.length) {
    container.innerHTML = "<p>Aucun élève chargé. Veuillez scanner les données depuis RunStats.</p>";
    return;
  }

  // Filtrer uniquement les élèves avec données complètes
  const valides = eleves.filter(e =>
    e.nom && e.prenom && e.sexe && e.classe && e.vma && !isNaN(parseFloat(e.vma))
  );

  if (valides.length < 4) {
    container.innerHTML = "<p>Pas assez de données valides pour former des groupes.</p>";
    return;
  }

  // Trier par VMA décroissant
  valides.sort((a, b) => b.vma - a.vma);

  // Créer les groupes de manière hétérogène (type 1er + dernier)
  const groupes = [];
  const total = valides.length;
  const tailleGroupe = 4;

  for (let i = 0; i < Math.floor(total / tailleGroupe); i++) {
    groupes.push([]);
  }

  let i = 0;
  let sens = 1;
  for (const eleve of valides) {
    groupes[i].push(eleve);
    i += sens;
    if (i === groupes.length || i < 0) {
      sens *= -1;
      i += sens;
    }
  }

  // Affichage du tableau
  let html = "";
  groupes.forEach((groupe, idx) => {
    html += `<h3>Groupe ${idx + 1}</h3>`;
    html += `<table><thead><tr><th>Nom</th><th>Prénom</th><th>Sexe</th><th>Classe</th><th>Distance</th><th>Vitesse</th><th>VMA</th></tr></thead><tbody>`;
    groupe.forEach(e => {
      html += `<tr><td>${e.nom}</td><td>${e.prenom}</td><td>${e.sexe}</td><td>${e.classe}</td><td>${e.distance}</td><td>${e.vitesse}</td><td>${e.vma}</td></tr>`;
    });
    html += `</tbody></table>`;
  });

  container.innerHTML = html;

  // Export CSV
  window.exportCSV = function () {
    const csvRows = [["Groupe", "Nom", "Prénom", "Sexe", "Classe", "Distance", "Vitesse", "VMA"]];
    groupes.forEach((groupe, index) => {
      groupe.forEach(e => {
        csvRows.push([index + 1, e.nom, e.prenom, e.sexe, e.classe, e.distance, e.vitesse, e.vma]);
      });
    });

    const csvContent = csvRows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "groupes_zenos.csv";
    link.click();
  };

  // Radar chart
  window.afficherRadar = function () {
    if (radarCanvas.style.display === "block") return; // évite de le recréer

    const labels = groupes.map((_, i) => `Groupe ${i + 1}`);
    const vmas = groupes.map(g => moy(g.map(e => parseFloat(e.vma))));
    const vitesses = groupes.map(g => moy(g.map(e => parseFloat(e.vitesse))));
    const distances = groupes.map(g => moy(g.map(e => parseFloat(e.distance))));
    const mixite = groupes.map(g => {
      const filles = g.filter(e => e.sexe.toLowerCase() === "f").length;
      const garcons = g.filter(e => e.sexe.toLowerCase() === "m").length;
      return Math.min(filles, garcons) / Math.max(filles || 1, garcons || 1);
    });

    const data = {
      labels,
      datasets: [
        {
          label: "VMA",
          data: vmas,
        },
        {
          label: "Vitesse",
          data: vitesses,
        },
        {
          label: "Distance",
          data: distances,
        },
        {
          label: "Mixité (équilibre F/G)",
          data: mixite,
        }
      ]
    };

    new Chart(radarCanvas, {
      type: "radar",
      data,
      options: {
        responsive: true,
        scales: {
          r: {
            beginAtZero: true,
            max: Math.max(...vmas.concat(vitesses, distances)) + 1
          }
        }
      }
    });

    radarCanvas.style.display = "block";
  };

  function moy(arr) {
    const valid = arr.filter(x => !isNaN(x));
    return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2) : 0;
  }
});
