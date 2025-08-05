function goHome() {
  window.location.href = "index.html";
}

function generateGroups() {
  const eleves = JSON.parse(localStorage.getItem("eleves")) || [];
  if (eleves.length === 0) return;

  const valid = eleves.filter(e => e.VMA && e.Sexe && e.Classe);
  valid.forEach(e => e.VMA = parseFloat(e.VMA));

  valid.sort((a, b) => a.VMA - b.VMA);

  const femmes = valid.filter(e => e.Sexe.toUpperCase() === "F");
  const hommes = valid.filter(e => e.Sexe.toUpperCase() === "M");

  const groupes = [];
  const used = new Set();

  while (valid.length - used.size >= 4) {
    const nonUtilises = valid.filter(e => !used.has(e));

    const sorted = [...nonUtilises].sort((a, b) => a.VMA - b.VMA);
    const bas = sorted[0];
    const haut = sorted[sorted.length - 1];

    const milieu = sorted.slice(1, -1).filter(e => e !== bas && e !== haut);
    if (milieu.length < 2) break;

    const moy1 = milieu[0];
    const moy2 = milieu[1];

    const groupe = [bas, haut, moy1, moy2];

    const sexes = groupe.map(e => e.Sexe.toUpperCase());
    if (sexes.includes("M") && sexes.includes("F")) {
      groupes.push(groupe);
      groupe.forEach(e => used.add(e));
    } else {
      break;
    }
  }

  displayGroups(groupes);
  window.groupesZenos = groupes; // pour PDF
}

function displayGroups(groupes) {
  const container = document.getElementById("groupesContainer");
  container.innerHTML = "";

  groupes.forEach((groupe, i) => {
    const div = document.createElement("div");
    div.className = "group";
    div.innerHTML = `<h2>Groupe ${i + 1}</h2>
      <table>
        <thead><tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>Distance</th><th>VMA</th></tr></thead>
        <tbody>
          ${groupe.map(e => `
            <tr>
              <td>${e.Nom || ""}</td>
              <td>${e.Prénom || ""}</td>
              <td>${e.Classe || ""}</td>
              <td>${e.Sexe || ""}</td>
              <td>${e.Distance || ""}</td>
              <td>${e.VMA || ""}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;
    container.appendChild(div);
  });
}

function generatePDF() {
  if (!window.groupesZenos || window.groupesZenos.length === 0) {
    alert("Aucun groupe à imprimer.");
    return;
  }

  const newWindow = window.open("", "_blank");
  newWindow.document.write(`
    <html><head><title>ZENOS TOUR</title>
    <style>
      body { font-family: Arial; padding: 20px; }
      h1 { text-align: center; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { border: 1px solid #333; padding: 6px; text-align: center; }
      th { background-color: #9b59b6; color: white; }
      footer { margin-top: 30px; text-align: center; font-size: 0.8em; color: #777; }
    </style>
    </head><body>
    <h1>ZENOS TOUR</h1>`);

  window.groupesZenos.forEach((groupe, i) => {
    newWindow.document.write(`<h3>Groupe ${i + 1}</h3>`);
    newWindow.document.write(`
      <table>
        <thead><tr><th>Nom</th><th>Prénom</th><th>Distance</th><th>VMA</th></tr></thead>
        <tbody>
        ${groupe.map(e => `
          <tr>
            <td>${e.Nom || ""}</td>
            <td>${e.Prénom || ""}</td>
            <td>${e.Distance || ""}</td>
            <td>${e.VMA || ""}</td>
          </tr>`).join("")}
        </tbody>
      </table>`);
  });

  newWindow.document.write(`<footer>ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB</footer>`);
  newWindow.document.write(`</body></html>`);
  newWindow.document.close();
  newWindow.print();
}

function showGraph() {
  const ctx = document.getElementById("graphCanvas").getContext("2d");
  document.getElementById("graphCanvas").style.display = "block";

  const eleves = JSON.parse(localStorage.getItem("eleves")) || [];
  const tranches = { "8-10": 0, "10-12": 0, "12-14": 0, "14-16": 0, "16+": 0 };

  eleves.forEach(e => {
    const vma = parseFloat(e.VMA);
    if (isNaN(vma)) return;
    if (vma < 10) tranches["8-10"]++;
    else if (vma < 12) tranches["10-12"]++;
    else if (vma < 14) tranches["12-14"]++;
    else if (vma < 16) tranches["14-16"]++;
    else tranches["16+"]++;
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(tranches),
      datasets: [{
        label: "Nombre d'élèves par tranche de VMA",
        data: Object.values(tranches),
      }]
    }
  });
}

window.onload = generateGroups;
