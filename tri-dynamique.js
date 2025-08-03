let tableauEleves = JSON.parse(localStorage.getItem("eleves") || "[]");

function detecterCriteres(tableau) {
  const set = new Set();
  tableau.forEach(eleve => {
    Object.keys(eleve).forEach(cle => set.add(cle));
  });
  return [...set];
}

function mettreAJourMenuTri() {
  const criteres = detecterCriteres(tableauEleves);
  const select = document.getElementById("critere-select");
  select.innerHTML = "";
  criteres.forEach(critere => {
    const opt = document.createElement("option");
    opt.value = critere;
    opt.textContent = critere;
    select.appendChild(opt);
  });
}

function trierTableau() {
  const critere = document.getElementById("critere-select").value;
  const sens = document.getElementById("sens-select").value;

  tableauEleves.sort((a, b) => {
    let va = a[critere];
    let vb = b[critere];

    if (!isNaN(parseFloat(va)) && !isNaN(parseFloat(vb))) {
      va = parseFloat(va);
      vb = parseFloat(vb);
    } else {
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
    }

    if (va < vb) return sens === "asc" ? -1 : 1;
    if (va > vb) return sens === "asc" ? 1 : -1;
    return 0;
  });

  afficherTableau();
}

function afficherTableau() {
  const entete = document.getElementById("entete-tableau");
  const corps = document.getElementById("corps-tableau");

  entete.innerHTML = "";
  corps.innerHTML = "";

  if (tableauEleves.length === 0) {
    corps.innerHTML = "<tr><td colspan='100%'>Aucune donnée à afficher</td></tr>";
    return;
  }

  const champs = Object.keys(tableauEleves[0]);
  const ligneEntete = document.createElement("tr");
  champs.forEach(champ => {
    const th = document.createElement("th");
    th.textContent = champ;
    ligneEntete.appendChild(th);
  });
  entete.appendChild(ligneEntete);

  tableauEleves.forEach(eleve => {
    const tr = document.createElement("tr");
    champs.forEach(champ => {
      const td = document.createElement("td");
      td.textContent = eleve[champ];
      tr.appendChild(td);
    });
    corps.appendChild(tr);
  });
}

mettreAJourMenuTri();
afficherTableau();
