document.addEventListener("DOMContentLoaded", () => {
  const liste = JSON.parse(localStorage.getItem("eleves") || "[]");
  if (liste.length === 0) {
    document.getElementById("groupesContainer").innerHTML =
      "<p style='color:red;'>Aucun élève trouvé. Veuillez scanner un QR code généré par RunStats.</p>";
    return;
  }

  // Tri par VMA décroissante
  liste.sort((a, b) => b.vma - a.vma);

  // Séparer filles et garçons
  const filles = liste.filter(e => e.sexe.toLowerCase() === "f");
  const garcons = liste.filter(e => e.sexe.toLowerCase() === "g");

  // Regroupement équilibré
  const groupes = [];
  const totalGroupes = Math.ceil(liste.length / 4);

  for (let i = 0; i < totalGroupes; i++) {
    groupes.push([]);
  }

  const repartition = [...filles, ...garcons];
  let sens = 1;
  let g = 0;

  repartition.forEach((eleve, index) => {
    groupes[g].push(eleve);
    if (sens === 1 && g >= totalGroupes - 1) sens = -1;
    else if (sens === -1 && g <= 0) sens = 1;
    else g += sens;
  });

  // Affichage
  const container = document.getElementById("groupesContainer");
  groupes.forEach((groupe, i) => {
    const html = groupe
      .map(e => `${e.prenom} ${e.nom} (${e.sexe.toUpperCase()} - ${e.vma} km/h)`)
      .join("<br>");
    const div = document.createElement("div");
    div.className = "groupe";
    div.innerHTML = `<h4>Groupe ${i + 1}</h4>${html}`;
    container.appendChild(div);
  });

  // Stockage pour radar
  window.groupesZenos = groupes;
});

// Radar
function genererRadar() {
  const groupes = window.groupesZenos || [];
  if (groupes.length === 0) return;

  const labels = groupes.map((_, i) => `Groupe ${i + 1}`);
  const moyVMA = groupes.map(g => moyenne(g.map(e => e.vma)));
  const moyDistance = groupes.map(g => moyenne(g.map(e => e.distance || 0)));
  const mixite = groupes.map(g => calculMixite(g));

  const ctx = document.getElementById("radarChart").getContext("2d");
  document.getElementById("radarChart").style.display = "block";

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["VMA", "Distance", "Mixité"],
      datasets: labels.map((g, i) => ({
        label: g,
        data: [moyVMA[i], moyDistance[i], mixite[i] * 100],
        fill: true
      }))
    },
    options: {
      responsive: true,
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
          text: "Équilibre des groupes (en % pour mixité)"
        }
      }
    }
  });
}

function moyenne(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calculMixite(groupe) {
  const f = groupe.filter(e => e.sexe.toLowerCase() === "f").length;
  const g = groupe.filter(e => e.sexe.toLowerCase() === "g").length;
  const total = f + g;
  if (total === 0) return 0;
  return 1 - Math.abs(f - g) / total; // 1 = parfait équilibre
}
