function genererGroupesZenos() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");

  if (data.length === 0) {
    alert("Aucun participant scanné.");
    return;
  }

  // Vérifie que tous les élèves ont une VMA et une classe
  const valides = data.filter(e => e.VMA && e.Classe);
  const invalides = data.filter(e => !e.VMA || !e.Classe);

  if (valides.length === 0) {
    alert("Données incomplètes (VMA ou classe manquantes).");
    return;
  }

  // Trie les élèves par classe
  const classes = {};
  valides.forEach(eleve => {
    const classe = eleve.Classe;
    if (!classes[classe]) classes[classe] = [];
    classes[classe].push(eleve);
  });

  const groupesFinal = [];
  const restants = [];

  Object.keys(classes).forEach(classe => {
    const elevesClasse = [...classes[classe]];
    elevesClasse.sort((a, b) => parseFloat(b.VMA) - parseFloat(a.VMA));

    while (elevesClasse.length >= 4) {
      const haut = elevesClasse.shift();
      const bas = elevesClasse.pop();
      const inter1 = elevesClasse.shift();
      const inter2 = elevesClasse.pop();

      if (haut && bas && inter1 && inter2) {
        const groupe = [haut, inter1, inter2, bas];
        groupesFinal.push({ classe, groupe });
      } else {
        restants.push(...[haut, inter1, inter2, bas].filter(e => e));
      }
    }

    // Ajouter les élèves restants non groupés
    restants.push(...elevesClasse);
  });

  afficherGroupes(groupesFinal, restants);
}

function afficherGroupes(groupes, restants) {
  const conteneur = document.getElementById("groupes-container");
  conteneur.innerHTML = "";

  groupes.forEach((groupe, index) => {
    const div = document.createElement("div");
    div.className = "groupe";

    const titre = document.createElement("h3");
    titre.textContent = `Groupe ${index + 1} – Classe ${groupe.classe}`;
    div.appendChild(titre);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    groupe.groupe.forEach(eleve => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${eleve.Nom}</td>
        <td>${eleve.Prénom}</td>
        <td>${eleve.Classe}</td>
        <td>${eleve.Sexe}</td>
        <td>${eleve.VMA}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    div.appendChild(table);

    conteneur.appendChild(div);
  });

  if (restants.length > 0) {
    const restDiv = document.createElement("div");
    restDiv.className = "groupe";
    const titre = document.createElement("h3");
    titre.textContent = "Élèves non groupés";
    restDiv.appendChild(titre);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    restants.forEach(eleve => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${eleve.Nom}</td>
        <td>${eleve.Prénom}</td>
        <td>${eleve.Classe}</td>
        <td>${eleve.Sexe}</td>
        <td>${eleve.VMA}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    restDiv.appendChild(table);
    conteneur.appendChild(restDiv);
  }
}

// Export CSV des groupes
function exportCSVGroupes() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");
  if (data.length === 0) return;

  let csv = "Nom;Prénom;Classe;Sexe;VMA\n";
  data.forEach(eleve => {
    csv += `${eleve.Nom};${eleve.Prénom};${eleve.Classe};${eleve.Sexe};${eleve.VMA || ""}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "groupes_zenos.csv";
  a.click();
}

// Envoi mail avec tableau (en mode texte)
function envoyerMailGroupes() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");
  if (data.length === 0) return;

  let body = "Voici les groupes ZENOS Tour :\n\n";
  data.forEach((e, i) => {
    body += `${i + 1}. ${e.Prenom || e.Prénom} ${e.Nom} – ${e.Classe} – VMA: ${e.VMA}\n`;
  });

  const lien = `mailto:?subject=Groupes ZENOS Tour&body=${encodeURIComponent(body)}`;
  window.location.href = lien;
}
