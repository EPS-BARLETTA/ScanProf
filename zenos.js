let groupes = [];

function chargerDonnees() {
  const eleves = JSON.parse(localStorage.getItem("eleves")) || [];
  const valides = eleves.filter(e => e.VMA && e.Sexe && e.Nom && e.Prénom && !isNaN(parseFloat(e.VMA)));
  const garcons = valides.filter(e => e.Sexe.toLowerCase().startsWith("g"));
  const filles = valides.filter(e => e.Sexe.toLowerCase().startsWith("f"));

  const trierParVMA = liste => liste.sort((a, b) => parseFloat(b.VMA) - parseFloat(a.VMA));

  trierParVMA(garcons);
  trierParVMA(filles);

  const tous = [...garcons, ...filles];
  trierParVMA(tous);

  const nbGroupes = Math.floor(tous.length / 4);
  groupes = [];

  let restants = [...tous];

  for (let i = 0; i < nbGroupes; i++) {
    const groupe = [];

    const top = restants.shift(); // VMA haute
    const bottom = restants.pop(); // VMA basse

    // Moyens : chercher au milieu
    const mid1 = restants.splice(Math.floor(restants.length / 2), 1)[0];
    const mid2 = restants.splice(Math.floor(restants.length / 2), 1)[0];

    if (top && bottom && mid1 && mid2) {
      const tentative = [top, mid1, mid2, bottom];
      const garconsInGroupe = tentative.filter(e => e.Sexe.toLowerCase().startsWith("g")).length;
      const fillesInGroupe = tentative.filter(e => e.Sexe.toLowerCase().startsWith("f")).length;

      if (garconsInGroupe > 0 && fillesInGroupe > 0) {
        groupes.push(tentative);
      } else {
        restants.push(top, mid1, mid2, bottom);
      }
    }
  }

  afficherGroupes();
}

function afficherGroupes() {
  const container = document.getElementById("groupesContainer");
  container.innerHTML = "";

  if (groupes.length === 0) {
    container.innerHTML = "<p>Aucun groupe généré.</p>";
    return;
  }

  groupes.forEach((groupe, index) => {
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr><th colspan="4">Groupe ${index + 1}</th></tr>
        <tr><th>Nom</th><th>Prénom</th><th>Distance</th><th>VMA</th></tr>
      </thead>
      <tbody>
        ${groupe.map(e => `
          <tr>
            <td>${e.Nom}</td>
            <td>${e.Prénom}</td>
            <td>${e.Distance || ""}</td>
            <td>${e.VMA}</td>
          </tr>
        `).join("")}
      </tbody>
    `;
    container.appendChild(table);
  });
}

function genererPDF() {
  if (groupes.length === 0) {
    alert("Aucun groupe à imprimer.");
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("ZENOS TOUR", 105, 15, { align: "center" });

  let y = 25;
  doc.setFontSize(12);
  groupes.forEach((groupe, index) => {
    doc.text(`Groupe ${index + 1}`, 10, y);
    y += 6;
    doc.text("Nom", 20, y);
    doc.text("Prénom", 60, y);
    doc.text("Distance", 110, y);
    doc.text("VMA", 150, y);
    y += 5;

    groupe.forEach(e => {
      doc.text(e.Nom, 20, y);
      doc.text(e.Prénom, 60, y);
      doc.text(e.Distance || "", 110, y);
      doc.text(e.VMA, 150, y);
      y += 5;
    });
    y += 5;

    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.setFontSize(10);
  doc.text("ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB", 105, 290, { align: "center" });

  doc.save("groupes-zenos.pdf");
}

function goHome() {
  window.location.href = "index.html";
}

function afficherEquilibre() {
  const eleves = JSON.parse(localStorage.getItem("eleves")) || [];
  const vmaTranches = { "8–10": 0, "10–12": 0, "12–14": 0, "14–16": 0, "16+": 0 };
  const distTranches = { "0–800": 0, "800–1000": 0, "1000–1200": 0, "1200+": 0 };
  const sexes = { Filles: 0, Garçons: 0 };

  eleves.forEach(e => {
    const vma = parseFloat(e.VMA);
    const dist = parseFloat(e.Distance);

    if (!isNaN(vma)) {
      if (vma < 10) vmaTranches["8–10"]++;
      else if (vma < 12) vmaTranches["10–12"]++;
      else if (vma < 14) vmaTranches["12–14"]++;
      else if (vma < 16) vmaTranches["14–16"]++;
      else vmaTranches["16+"]++;
    }

    if (!isNaN(dist)) {
      if (dist < 800) distTranches["0–800"]++;
      else if (dist < 1000) distTranches["800–1000"]++;
      else if (dist < 1200) distTranches["1000–1200"]++;
      else distTranches["1200+"]++;
    }

    if (e.Sexe?.toLowerCase().startsWith("f")) sexes["Filles"]++;
    else if (e.Sexe?.toLowerCase().startsWith("g")) sexes["Garçons"]++;
  });

  const ctx = document.getElementById("chart").getContext("2d");
  if (window.myChart) window.myChart.destroy();

  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        ...Object.keys(vmaTranches).map(l => `VMA ${l}`),
        ...Object.keys(distTranches).map(l => `Distance ${l}`),
        "Filles", "Garçons"
      ],
      datasets: [{
        label: "Répartition",
        data: [
          ...Object.values(vmaTranches),
          ...Object.values(distTranches),
          sexes["Filles"], sexes["Garçons"]
        ]
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

window.onload = () => {
  chargerDonnees();
};
