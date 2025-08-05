const participants = JSON.parse(localStorage.getItem("participants")) || [];

function genererGroupesZenos() {
  const data = [...participants].filter(p => p.VMA && p.Sexe && p.Nom && p.Prénom && p.Classe);

  data.forEach(p => p.VMA = parseFloat(p.VMA));
  data.sort((a, b) => a.VMA - b.VMA);

  const reste = [];
  const groupes = [];

  while (data.length >= 4) {
    const eleveFaible = data.shift();       // plus faible VMA
    const eleveFort = data.pop();           // plus forte VMA

    const milieu = data.splice(0, 2);       // deux moyens

    const groupe = [eleveFaible, ...milieu, eleveFort];

    const sexes = groupe.map(e => e.Sexe.toUpperCase());
    const garcons = sexes.filter(s => s === 'M').length;
    const filles = sexes.filter(s => s === 'F').length;

    if (garcons > 0 && filles > 0) {
      groupes.push(groupe);
    } else {
      reste.push(...groupe); // pas mixte
    }
  }

  // S'il reste moins de 4 élèves
  reste.push(...data);

  afficherGroupes(groupes, reste);
  window.groupesZenos = groupes.flat(); // pour le radar
}

function afficherGroupes(groupes, reste) {
  const container = document.getElementById("groupesContainer");
  container.innerHTML = "";

  groupes.forEach((groupe, index) => {
    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent = `Groupe ${index + 1}`;
    table.appendChild(caption);

    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    groupe.forEach(el => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${el.Nom}</td><td>${el.Prénom}</td><td>${el.Classe}</td><td>${el.Sexe}</td><td>${el.VMA}</td>`;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  });

  const resteContainer = document.getElementById("resteContainer");
  if (reste.length > 0) {
    resteContainer.innerHTML = `⚠️ ${reste.length} élève(s) n'ont pas été placés dans un groupe (pas assez ou mixité impossible).`;
  } else {
    resteContainer.innerHTML = "";
  }
}

// Histogrammes VMA & Distance
function genererRadar() {
  const ctx = document.getElementById("radarChart");
  if (!window.groupesZenos || groupesZenos.length === 0) return;

  const vmas = groupesZenos.map(p => parseFloat(p.VMA));
  const distances = groupesZenos.map(p => parseFloat(p.Distance || 0));

  const tranchesVMA = ["<8", "8-10", "10-12", "12-14", "14+"];
  const vmaCounts = [0, 0, 0, 0, 0];
  vmas.forEach(v => {
    if (v < 8) vmaCounts[0]++;
    else if (v < 10) vmaCounts[1]++;
    else if (v < 12) vmaCounts[2]++;
    else if (v < 14) vmaCounts[3]++;
    else vmaCounts[4]++;
  });

  const tranchesDist = ["<400", "400–800", "800–1200", "1200+"];
  const distCounts = [0, 0, 0, 0];
  distances.forEach(d => {
    if (d < 400) distCounts[0]++;
    else if (d < 800) distCounts[1]++;
    else if (d < 1200) distCounts[2]++;
    else distCounts[3]++;
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [...tranchesVMA, ...tranchesDist],
      datasets: [{
        label: 'Répartition VMA',
        data: [...vmaCounts, 0, 0, 0, 0], // Complété pour les 4 barres suivantes
        backgroundColor: '#9b59b6'
      }, {
        label: 'Répartition Distance',
        data: [0, 0, 0, 0, ...distCounts],
        backgroundColor: '#3498db'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Analyse des groupes ZENOS'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          stepSize: 1
        }
      }
    }
  });
}

// Initialisation
window.addEventListener("DOMContentLoaded", genererGroupesZenos);
