function goHome() {
  window.location.href = "index.html";
}

function getData() {
  return JSON.parse(localStorage.getItem("eleves")) || [];
}

function generateZenosGroups(data) {
  const valid = data.filter(e => e.VMA && e.Sexe && e.Nom && e.Prénom);
  if (valid.length < 4) return [];

  // Trier les élèves par VMA
  const sorted = valid.sort((a, b) => parseFloat(b.VMA) - parseFloat(a.VMA));

  const groupes = [];

  while (sorted.length >= 4) {
    const high = sorted.shift();
    const low = sorted.pop();
    const mid1 = sorted.shift();
    const mid2 = sorted.pop();

    const groupe = [high, mid1, mid2, low];

    const filles = groupe.filter(e => e.Sexe.toLowerCase() === "f").length;
    const garcons = groupe.filter(e => e.Sexe.toLowerCase() === "m").length;

    if (filles > 0 && garcons > 0) {
      groupes.push(groupe);
    }
  }

  return groupes;
}

function displayGroups(groupes) {
  const container = document.getElementById("groupesContainer");
  container.innerHTML = "";

  if (groupes.length === 0) {
    container.innerHTML = "<p style='text-align:center;color:#888'>Aucun groupe généré. Vérifiez que les données sont complètes (Nom, Prénom, Sexe, VMA).</p>";
    return;
  }

  groupes.forEach((groupe, i) => {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    const titre = document.createElement("h3");
    titre.textContent = `Groupe ${i + 1}`;
    titre.style.marginTop = "30px";
    titre.style.color = "#6a1b9a";
    container.appendChild(titre);

    const headRow = document.createElement("tr");
    ["Nom", "Prénom", "Classe", "Sexe", "VMA", "Distance"].forEach(k => {
      const th = document.createElement("th");
      th.textContent = k;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    groupe.forEach(eleve => {
      const tr = document.createElement("tr");
      ["Nom", "Prénom", "Classe", "Sexe", "VMA", "Distance"].forEach(k => {
        const td = document.createElement("td");
        td.textContent = eleve[k] || "";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  });
}

function generatePDF() {
  const groupes = generateZenosGroups(getData());
  if (groupes.length === 0) {
    alert("Aucun groupe à imprimer.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("ZENOS TOUR", 105, 15, null, null, "center");

  let y = 25;
  groupes.forEach((groupe, i) => {
    doc.setFontSize(14);
    doc.text(`Groupe ${i + 1}`, 10, y);
    y += 6;
    doc.setFontSize(10);
    groupe.forEach(eleve => {
      doc.text(`${eleve.Nom} ${eleve.Prénom} - ${eleve.Distance || ""}m - VMA: ${eleve.VMA}`, 12, y);
      y += 6;
    });
    y += 4;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.setFontSize(10);
  doc.text("ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB", 105, 285, null, null, "center");
  doc.save("zenos_groups.pdf");
}

window.onload = function () {
  const data = getData();
  const groupes = generateZenosGroups(data);
  displayGroups(groupes);
};
