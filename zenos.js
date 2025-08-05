const participants = JSON.parse(localStorage.getItem("participants")) || [];

function genererGroupesZenos() {
  const data = [...participants].filter(p => p.VMA && p.Sexe && p.Nom && p.Prénom && p.Classe);

  data.forEach(p => {
    p.VMA = parseFloat(p.VMA);
    p.Distance = parseFloat(p.Distance || 0);
  });

  data.sort((a, b) => a.VMA - b.VMA);

  const reste = [];
  const groupes = [];

  while (data.length >= 4) {
    const faible = data.shift();
    const fort = data.pop();
    const milieux = data.splice(0, 2);

    const groupe = [faible, ...milieux, fort];

    const mix = groupe.map(e => e.Sexe.toUpperCase());
    const garcons = mix.filter(s => s === 'M').length;
    const filles = mix.filter(s => s === 'F').length;

    if (garcons > 0 && filles > 0) {
      groupes.push(groupe);
    } else {
      reste.push(...groupe);
    }
  }

  reste.push(...data);

  afficherGroupes(groupes, reste);
  window.groupesZenos = groupes; // stocké pour PDF ou graphique
}

function afficherGroupes(groupes, reste) {
  const container = document.getElementById("groupesContainer");
  container.innerHTML = "";

  groupes.forEach((groupe, i) => {
    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent = `Groupe ${i + 1}`;
    table.appendChild(caption);

    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>Distance</th><th>VMA</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    groupe.forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${e.Nom}</td><td>${e.Prénom}</td><td>${e.Classe}</td><td>${e.Sexe}</td><td>${e.Distance}</td><td>${e.VMA}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  });

  const resteContainer = document.getElementById("resteContainer");
  if (reste.length > 0) {
    resteContainer.innerHTML = `⚠️ ${reste.length} élève(s) non placés (groupes incomplets ou mixité impossible).`;
  } else {
    resteContainer.innerHTML = "";
  }
}

function genererPDF() {
  if (!window.groupesZenos || window.groupesZenos.length === 0) return alert("Aucun groupe à imprimer.");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const autoTable = window.jspdfAutoTable;

  doc.setFontSize(16);
  doc.text("ZENOS TOUR", 105, 15, { align: "center" });

  let y = 25;

  window.groupesZenos.forEach((groupe, i) => {
    autoTable(doc, {
      startY: y,
      head: [["Nom", "Prénom", "Distance", "VMA"]],
      body: groupe.map(e => [e.Nom, e.Prénom, e.Distance, e.VMA]),
      theme: 'grid',
      styles: { halign: 'center' },
      headStyles: { fillColor: [155, 89, 182] },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.text(`Groupe ${i + 1}`, 15, data.settings.startY - 5);
      }
    });

    y = doc.lastAutoTable.finalY + 10;
  });

  doc.setFontSize(10);
  doc.text("ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB", 105, 290, { align: "center" });

  doc.save("ZENOS_TOUR.pdf");
}

window.addEventListener("DOMContentLoaded", genererGroupesZenos);
