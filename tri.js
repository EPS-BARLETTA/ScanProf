let eleves = JSON.parse(localStorage.getItem("eleves")) || [];
let colonnes = [];

function afficherTableau(filtre = "") {
  const tableHead = document.getElementById("elevesTableHead");
  const tableBody = document.getElementById("elevesTableBody");

  if (eleves.length === 0) {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "<tr><td colspan='100%'>Aucun élève enregistré.</td></tr>";
    return;
  }

  colonnes = Object.keys(eleves[0]);

  // En-têtes
  tableHead.innerHTML = "<tr>" + colonnes.map(col => `<th>${col}</th>`).join("") + "</tr>";

  // Lignes filtrées
  const lignes = eleves.filter(eleve => {
    return filtre === "" || Object.values(eleve).some(val => val.toLowerCase().includes(filtre.toLowerCase()));
  });

  tableBody.innerHTML = lignes.map(eleve => {
    return "<tr>" + colonnes.map(col => `<td>${eleve[col] || ""}</td>`).join("") + "</tr>";
  }).join("");
}

function remplirMenuTri() {
  const select = document.getElementById("triSelect");
  select.innerHTML = colonnes.map(c => `<option value="${c}">${c}</option>`).join("");
  select.onchange = () => trierPar(select.value);
}

function trierPar(cle) {
  eleves.sort((a, b) => {
    const valA = a[cle]?.toLowerCase?.() || a[cle];
    const valB = b[cle]?.toLowerCase?.() || b[cle];

    if (!isNaN(valA) && !isNaN(valB)) return parseFloat(valA) - parseFloat(valB);
    return valA > valB ? 1 : valA < valB ? -1 : 0;
  });
  afficherTableau(document.getElementById("searchInput").value);
}

function filtrer() {
  const texte = document.getElementById("searchInput").value;
  afficherTableau(texte);
}

function resetData() {
  if (confirm("❌ Réinitialiser tous les élèves ?")) {
    localStorage.removeItem("eleves");
    eleves = [];
    afficherTableau();
    remplirMenuTri();
  }
}

function exportCSV() {
  if (eleves.length === 0) return;

  const lignes = [colonnes.join(",")];
  eleves.forEach(eleve => {
    lignes.push(colonnes.map(col => `"${eleve[col] || ""}"`).join(","));
  });

  const blob = new Blob([lignes.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "participants.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function handleCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    const rows = content.split("\n").filter(row => row.trim() !== "");
    const headers = rows[0].split(",").map(h => h.trim());
    const data = rows.slice(1).map(row => {
      const values = row.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i]?.trim();
      });
      return obj;
    });

    eleves = data;
    localStorage.setItem("eleves", JSON.stringify(eleves));
    afficherTableau();
    remplirMenuTri();
    alert("✅ Données CSV importées.");
  };
  reader.readAsText(file);
}

function goHome() {
  window.location.href = "index.html";
}

function goZenos() {
  window.location.href = "groupe-zenos.html";
}

window.onload = () => {
  afficherTableau();
  remplirMenuTri();
};
