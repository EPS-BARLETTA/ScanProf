// Fonction principale de génération
function genererGroupesZenos() {
  const participants = JSON.parse(localStorage.getItem("eleves") || "[]");

  if (!participants.length) {
    alert("Aucun participant trouvé.");
    return;
  }

  // Vérification des données requises
  const filtres = participants.filter(e => e.vma && e.classe && e.sexe);
  if (filtres.length < 4) {
    alert("Données incomplètes (VMA ou classe manquantes).");
    return;
  }

  const groupesHTML = document.getElementById("groupes");
  groupesHTML.innerHTML = ""; // Nettoyer affichage

  let groupesParClasse = {};

  filtres.forEach(p => {
    const classe = p.classe.trim();
    if (!groupesParClasse[classe]) groupesParClasse[classe] = [];
    groupesParClasse[classe].push(p);
  });

  let groupesComplets = [];
  let restants = [];

  for (const classe in groupesParClasse) {
    const eleves = groupesParClasse[classe];

    // Tri décroissant selon VMA
    eleves.sort((a, b) => parseFloat(b.vma) - parseFloat(a.vma));

    while (eleves.length >= 4) {
      const haut = eleves.shift(); // plus forte VMA
      const bas = eleves.pop();    // plus faible VMA
      const milieu1 = eleves.shift();
      const milieu2 = eleves.pop();

      const groupe = [haut, milieu1, milieu2, bas];
      groupesComplets.push({ classe, groupe });
    }

    // Si élèves restants, on les stocke
    if (eleves.length > 0) {
      restants.push(...eleves.map(e => ({ ...e, classe })));
    }
  }

  // Affichage des groupes
  groupesComplets.forEach((g, index) => {
    const html = `
      <table class="zenos-group">
        <caption>Groupe ${index + 1} – Classe ${g.classe}</caption>
        <thead>
          <tr><th>Nom</th><th>Prénom</th><th>Distance</th><th>VMA</th></tr>
        </thead>
        <tbody>
          ${g.groupe.map(e => `
            <tr>
              <td>${e.nom || ""}</td>
              <td>${e.prenom || ""}</td>
              <td>${e.distance || ""}</td>
              <td>${e.vma || ""}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    groupesHTML.innerHTML += html;
  });

  // Affichage des élèves non affectés
  if (restants.length > 0) {
    groupesHTML.innerHTML += `
      <h3>Élèves non attribués à un groupe</h3>
      <table class="zenos-group">
        <thead>
          <tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>VMA</th></tr>
        </thead>
        <tbody>
          ${restants.map(e => `
            <tr>
              <td>${e.nom || ""}</td>
              <td>${e.prenom || ""}</td>
              <td>${e.classe || ""}</td>
              <td>${e.vma || ""}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <p style="margin-top:8px;"><i>Ces élèves n’ont pas pu être intégrés dans un groupe de 4.</i></p>
    `;
  }
}

// Export CSV
function exporterGroupesCSV() {
  const groupes = document.querySelectorAll(".zenos-group");
  if (!groupes.length) return;

  let contenu = "Groupe,Nom,Prénom,Distance,VMA\n";

  groupes.forEach((table, index) => {
    const caption = table.querySelector("caption")?.textContent || `Groupe ${index + 1}`;
    const lignes = table.querySelectorAll("tbody tr");
    lignes.forEach(row => {
      const cells = row.querySelectorAll("td");
      const ligne = [caption, ...Array.from(cells).map(c => c.textContent.trim())];
      contenu += ligne.join(",") + "\n";
    });
  });

  const blob = new Blob([contenu], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "groupes_zenos.csv";
  a.click();
}

// Export PDF
function exporterGroupesPDF() {
  const win = window.open("", "_blank");
  const contenu = document.getElementById("groupes").innerHTML;

  win.document.write(`
    <html>
      <head>
        <title>ZENOS TOUR</title>
        <style>
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid black; padding: 5px; text-align: center; }
          caption { font-weight: bold; margin-bottom: 5px; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1 style="text-align:center;">ZENOS TOUR</h1>
        ${contenu}
        <footer style="margin-top:30px;text-align:center;">
          ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB
        </footer>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
}

// Envoi mail
function envoyerGroupesParMail() {
  const tables = document.querySelectorAll(".zenos-group");
  if (!tables.length) return;

  let corps = "Groupes ZENOS :%0A%0A";
  tables.forEach(table => {
    const caption = table.querySelector("caption")?.textContent || "Groupe";
    corps += caption + "%0A";
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const valeurs = Array.from(cells).map(c => c.textContent.trim()).join(" | ");
      corps += valeurs + "%0A";
    });
    corps += "%0A";
  });

  const lien = `mailto:?subject=Groupes ZENOS&body=${corps}`;
  window.location.href = lien;
}
