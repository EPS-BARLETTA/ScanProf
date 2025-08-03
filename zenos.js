const groupes = [];
const tableauEleves = JSON.parse(localStorage.getItem("eleves") || "[]");

function genererGroupes() {
  const classes = {};

  // Regroupe les élèves par classe
  tableauEleves.forEach(eleve => {
    if (eleve.vma && !isNaN(parseFloat(eleve.vma))) {
      const classe = eleve.classe || "Inconnue";
      if (!classes[classe]) classes[classe] = [];
      classes[classe].push({ ...eleve, vma: parseFloat(eleve.vma) });
    }
  });

  Object.entries(classes).forEach(([classe, eleves]) => {
    // Trie les élèves par VMA décroissante
    eleves.sort((a, b) => b.vma - a.vma);

    // Découpe en groupes hétérogènes : 1 fort, 2 moyens, 1 faible
    while (eleves.length >= 4) {
      const fort = eleves.shift(); // premier (VMA haute)
      const faible = eleves.pop(); // dernier (VMA faible)
      const moyen1 = eleves.shift(); // suivant (moyenne haute)
      const moyen2 = eleves.pop();   // suivant (moyenne basse)

      const groupe = [fort, moyen1, moyen2, faible];
      groupes.push({ classe, membres: groupe });
    }
  });

  afficherGroupes();
}

function afficherGroupes() {
  const container = document.getElementById("groupes");
  container.innerHTML = "";

  groupes.forEach((groupe, index) => {
    const div = document.createElement("div");
    div.className = "group";

    const titre = document.createElement("h3");
    titre.textContent = `Groupe ${index + 1} – Classe ${groupe.classe}`;
    div.appendChild(titre);

    const ul = document.createElement("ul");
    groupe.membres.forEach(eleve => {
      const li = document.createElement("li");
      li.textContent = `${eleve.prenom} ${eleve.nom} (${eleve.vma})`;
      ul.appendChild(li);
    });

    div.appendChild(ul);
    container.appendChild(div);
  });
}

function exporterCSV() {
  if (groupes.length === 0) return;

  const lignes = [["Classe", "Groupe", "Nom", "Prénom", "VMA"]];

  groupes.forEach((groupe, i) => {
    groupe.membres.forEach(eleve => {
      lignes.push([
        groupe.classe,
        `Groupe ${i + 1}`,
        eleve.nom,
        eleve.prenom,
        eleve.vma
      ]);
    });
  });

  const csvContent = lignes.map(ligne => ligne.map(val => `"${val}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const lien = document.createElement("a");
  lien.setAttribute("href", url);
  lien.setAttribute("download", "groupes_zenos.csv");
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
}

genererGroupes();
