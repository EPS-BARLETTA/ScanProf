function goHome() {
  window.location.href = "index.html";
}

function generatePDF() {
  const groupes = document.querySelectorAll(".groupe");
  if (groupes.length === 0) {
    alert("Aucun groupe à imprimer.");
    return;
  }

  const doc = new window.jspdf.jsPDF();

  doc.setFontSize(20);
  doc.text("ZENOS TOUR", 105, 20, { align: "center" });

  let y = 30;
  groupes.forEach((groupe, i) => {
    const rows = groupe.querySelectorAll("tbody tr");
    doc.setFontSize(14);
    doc.text(`Groupe ${i + 1}`, 15, y);

    y += 5;
    doc.setFontSize(10);
    doc.text("Nom", 15, y);
    doc.text("Prénom", 55, y);
    doc.text("Distance", 100, y);
    doc.text("VMA", 140, y);

    y += 5;
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 4) {
        doc.text(cells[0].textContent, 15, y);
        doc.text(cells[1].textContent, 55, y);
        doc.text(cells[2].textContent, 100, y);
        doc.text(cells[3].textContent, 140, y);
        y += 5;
      }
    });

    y += 5;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.setFontSize(10);
  doc.text("ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB", 105, 290, { align: "center" });

  doc.save("ZENOS_TOUR.pdf");
}

function shuffle(array) {
  return array.map(value => ({ value, sort: Math.random() }))
              .sort((a, b) => a.sort - b.sort)
              .map(({ value }) => value);
}

function generateGroups() {
  const container = document.getElementById("groupesContainer");
  const data = JSON.parse(localStorage.getItem("eleves")) || [];

  if (data.length < 4 || !data[0].VMA || !data[0].Sexe) {
    container.innerHTML = "<p>❌ Données insuffisantes ou non compatibles avec les groupes ZENOS (VMA et Sexe requis).</p>";
    return;
  }

  const eleves = [...data].filter(e => e.VMA && !isNaN(parseFloat(e.VMA)));
  eleves.forEach(e => e.VMA = parseFloat(e.VMA));
  eleves.sort((a, b) => b.VMA - a.VMA);

  const total = eleves.length;
  const groupCount = Math.floor(total / 4);
  const remainder = total % 4;

  const high = eleves.slice(0, groupCount); // top VMA
  const low = eleves.slice(-groupCount);    // low VMA
  const middle = eleves.slice(groupCount, total - groupCount); // middle VMA
  const mixedMiddle = shuffle([...middle]);

  const groups = [];

  for (let i = 0; i < groupCount; i++) {
    const group = [];
    if (high[i]) group.push(high[i]);
    if (low[i]) group.push(low[i]);
    if (mixedMiddle[2 * i]) group.push(mixedMiddle[2 * i]);
    if (mixedMiddle[2 * i + 1]) group.push(mixedMiddle[2 * i + 1]);

    if (group.length === 4 && isMixed(group)) {
      groups.push(group);
    }
  }

  // Affichage
  container.innerHTML = "";
  groups.forEach((groupe, index) => {
    const table = document.createElement("table");
    table.classList.add("groupe");

    const caption = document.createElement("caption");
    caption.textContent = `Groupe ${index + 1}`;
    caption.style.fontWeight = "bold";
    caption.style.marginBottom = "5px";
    table.appendChild(caption);

    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Nom</th><th>Prénom</th><th>Distance</th><th>VMA</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    groupe.forEach(eleve => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${eleve.Nom || ""}</td>
        <td>${eleve.Prénom || ""}</td>
        <td>${eleve.Distance || ""}</td>
        <td>${eleve.VMA}</td>`;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  });
}

function isMixed(groupe) {
  const sexes = groupe.map(e => e.Sexe?.toLowerCase());
  return sexes.includes("f") && sexes.includes("m");
}

window.onload = generateGroups;
