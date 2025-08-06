function genererGroupesZenos() {
  const data = JSON.parse(localStorage.getItem("eleves")) || [];

  const normalise = e => ({
    Nom: e.Nom || e.nom || "",
    Prénom: e.Prénom || e.prenom || "",
    Classe: e.Classe || e.classe || "",
    Sexe: e.Sexe || e.sexe || "",
    VMA: parseFloat(e.VMA || e.vma || 0),
    Distance: e.Distance || e.distance || ""
  });

  const eleves = data.map(normalise).filter(e => e.VMA && e.Classe);
  if (eleves.length < 4) {
    alert("Pas assez d'élèves valides avec VMA et Classe.");
    return;
  }

  const groupesParClasse = {};
  eleves.sort((a, b) => a.VMA - b.VMA);

  eleves.forEach(eleve => {
    if (!groupesParClasse[eleve.Classe]) groupesParClasse[eleve.Classe] = [];
    groupesParClasse[eleve.Classe].push(eleve);
  });

  const groupes = [];
  const restants = [];

  for (const classe in groupesParClasse) {
    const liste = groupesParClasse[classe];
    while (liste.length >= 4) {
      const bas = liste.shift();
      const haut = liste.pop();
      const moy1 = liste.shift();
      const moy2 = liste.shift();
      groupes.push([haut, bas, moy1, moy2].filter(Boolean));
    }
    restants.push(...liste);
  }

  const container = document.getElementById("groupesContainer");
  container.innerHTML = "";

  groupes.forEach((groupe, index) => {
    const div = document.createElement("div");
    div.innerHTML = `<h3>Groupe ${index + 1}</h3><table><tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th><th>Distance</th></tr>` +
      groupe.map(e => `<tr><td>${e.Nom}</td><td>${e.Prénom}</td><td>${e.Classe}</td><td>${e.Sexe}</td><td>${e.VMA}</td><td>${e.Distance}</td></tr>`).join("") +
      "</table>";
    container.appendChild(div);
  });

  if (restants.length) {
    const div = document.createElement("div");
    div.innerHTML = `<h3>Élèves restants</h3><table><tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th><th>Distance</th></tr>` +
      restants.map(e => `<tr><td>${e.Nom}</td><td>${e.Prénom}</td><td>${e.Classe}</td><td>${e.Sexe}</td><td>${e.VMA}</td><td>${e.Distance}</td></tr>`).join("") +
      "</table>";
    container.appendChild(div);
  }
}

function exportGroupesCSV() {
  const tables = document.querySelectorAll("#groupesContainer table");
  if (!tables.length) return alert("Aucun groupe généré.");

  let csv = "Nom,Prénom,Classe,Sexe,VMA,Distance\n";
  tables.forEach(table => {
    const rows = table.querySelectorAll("tr");
    rows.forEach((row, i) => {
      if (i === 0) return;
      const cells = row.querySelectorAll("td");
      const rowData = Array.from(cells).map(td => `"${td.innerText}"`).join(",");
      csv += rowData + "\n";
    });
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "groupes_zenos.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function imprimerGroupes() {
  window.print();
}

function envoyerGroupesParMail() {
  const tables = document.querySelectorAll("#groupesContainer table");
  if (!tables.length) return alert("Aucun groupe généré.");

  let body = "Bonjour,%0D%0AVoici les groupes ZENOS Tour :%0D%0A%0D%0A";
  tables.forEach((table, i) => {
    const rows = table.querySelectorAll("tr");
    body += `Groupe ${i + 1}%0D%0A`;
    rows.forEach((row, j) => {
      if (j === 0) return;
      const cells = row.querySelectorAll("td");
      const line = Array.from(cells).map(td => td.innerText).join(" | ");
      body += line + "%0D%0A";
    });
    body += "%0D%0A";
  });

  const mailto = `mailto:?subject=Groupes ZENOS Tour&body=${body}Cordialement.`;
  window.location.href = mailto;
}
