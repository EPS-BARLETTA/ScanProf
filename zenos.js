document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("groupesContainer");
  const radarCanvas = document.getElementById("radarCanvas");
  const btnRadar = document.getElementById("btnAfficherRadar");

  const eleves = JSON.parse(localStorage.getItem("eleves") || "[]");
  if (!eleves.length) {
    container.innerHTML = "<p>Aucun élève trouvé. Veuillez scanner ou importer un fichier RunStats.</p>";
    return;
  }

  // Fonction de tri mixte et VMA pour groupes hétérogènes
  function genererGroupesHeterogenes(liste, taille = 4) {
    const garcons = liste.filter(e => e.sexe.toLowerCase().startsWith("g")).sort((a,b) => b.vma - a.vma);
    const filles = liste.filter(e => e.sexe.toLowerCase().startsWith("f")).sort((a,b) => b.vma - a.vma);
    const groupes = [];

    while (garcons.length || filles.length) {
      const groupe = [];
      for (let i = 0; i < taille; i++) {
        let source = (i % 2 === 0) ? garcons : filles;
        if (!source.length) source = garcons.length ? garcons : filles;
        if (source.length) groupe.push(source.shift());
      }
      groupes.push(groupe);
    }

    return groupes;
  }

  const groupes = genererGroupesHeterogenes(eleves);

  function afficherGroupes(groupes) {
    container.innerHTML = groupes.map((groupe, i) => `
      <h3>Groupe ${i + 1}</h3>
      <table>
        <thead>
          <tr><th>Nom</th><th>Prénom</th><th>Sexe</th><th>Classe</th><th>Distance</th><th>Vitesse</th><th>VMA</th></tr>
        </thead>
        <tbody>
          ${groupe.map(e => `
            <tr>
              <td>${e.nom}</td>
              <td>${e.prenom}</td>
              <td>${e.sexe}</td>
              <td>${e.classe}</td>
              <td>${e.distance || ""}</td>
              <td>${e.vitesse || ""}</td>
              <td>${e.vma || ""}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    `).join("");
  }

  afficherGroupes(groupes);

  btnRadar.addEventListener("click", () => {
    radarCanvas.style.display = "block";
    const labels = groupes.map((_, i) => `Groupe ${i + 1}`);

    const vmaMoy = groupes.map(g => moyenne(g.map(e => e.vma)));
    const vitesseMoy = groupes.map(g => moyenne(g.map(e => e.vitesse)));
    const distanceMoy = groupes.map(g => moyenne(g.map(e => e.distance)));
    const mixite = groupes.map(g => {
      const f = g.filter(e => e.sexe.toLowerCase().startsWith("f")).length;
      const gCount = g.length;
      return gCount ? (f / gCount) * 100 : 0;
    });

    const data = {
      labels,
      datasets: [
        {
          label: "VMA moyenne",
          data: vmaMoy,
        },
        {
          label: "Vitesse moyenne",
          data: vitesseMoy,
        },
        {
          label: "Distance moyenne",
          data: distanceMoy,
        },
        {
          label: "Mixité (%)",
          data: mixite,
        }
      ]
    };

    new Chart(radarCanvas, {
      type: "radar",
      data,
      options: {
        elements: { line: { borderWidth: 3 } },
        scales: { r: { min: 0, suggestedMax: 100 } }
      }
    });
  });

  function moyenne(tab) {
    const nums = tab.filter(x => typeof x === "number" && !isNaN(x));
    return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : 0;
  }
});
