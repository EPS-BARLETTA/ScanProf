function goHome() {
  window.location.href = "index.html";
}

function generateGroups() {
  const data = JSON.parse(localStorage.getItem("eleves")) || [];
  const container = document.getElementById("groupesContainer");
  container.innerHTML = "";

  const validData = data.filter(e => e.VMA && e.Sexe && e.Nom && e.Prénom);
  if (validData.length < 4) {
    container.innerHTML = "<p>Pas assez de données pour former des groupes.</p>";
    return;
  }

  // Convertir VMA en nombre
  validData.forEach(e => e.VMA = parseFloat(e.VMA));

  // Trier par VMA
  validData.sort((a, b) => b.VMA - a.VMA);

  const high = validData.slice(0, Math.floor(validData.length / 4));
  const low = validData.slice(-Math.floor(validData.length / 4));
  const mid = validData.slice(Math.floor(validData.length / 4), -Math.floor(validData.length / 4));

  const groups = [];
  while (high.length && low.length && mid.length >= 2) {
    const group = [];
    group.push(high.shift());
    group.push(low.shift());
    group.push(mid.shift());
    group.push(mid.shift());

    const sexes = group.map(e => e.Sexe);
    if (sexes.includes("F") && sexes.includes("M")) {
      groups.push(group);
    }
  }

  if (groups.length === 0) {
    container.innerHTML = "<p>Aucun groupe valide n’a pu être généré avec les critères.</p>";
    return;
  }

  // Affichage
  groups.forEach((group, i) => {
    const div = document.createElement("div");
    div.className = "group";
    div.innerHTML = `<h3>Groupe ${i + 1}</h3>`;
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Nom</th><th>Prénom</th><th>Sexe</th><th>Distance</th><th>VMA</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    group.forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${e.Nom}</td><td>${e.Prénom}</td><td>${e.Sexe}</td><td>${e.Distance || ""}</td><td>${e.VMA}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    div.appendChild(table);
    container.appendChild(div);
  });

  // Stocker les groupes pour PDF
  localStorage.setItem("groupesZenos", JSON.stringify(groups));
}

function downloadPDF() {
  const groups = JSON.parse(localStorage.getItem("groupesZenos")) || [];
  if (groups.length === 0) {
    alert("Aucun groupe à imprimer.");
    return;
  }

  let doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("ZENOS TOUR", 105, 15, null, null, "center");
  doc.setFontSize(12);

  let y = 25;
  groups.forEach((group, i) => {
    doc.text(`Groupe ${i + 1}`, 15, y);
    y += 6;
    doc.text("Nom", 20, y);
    doc.text("Prénom", 60, y);
    doc.text("Distance", 100, y);
    doc.text("VMA", 140, y);
    y += 6;
    group.forEach(e => {
      doc.text(e.Nom || "", 20, y);
      doc.text(e.Prénom || "", 60, y);
      doc.text(e.Distance || "", 100, y);
      doc.text(String(e.VMA || ""), 140, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    y += 4;
  });

  doc.setFontSize(10);
  doc.text("ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB", 105, 285, null, null, "center");

  doc.save("groupes-zenos.pdf");
}
