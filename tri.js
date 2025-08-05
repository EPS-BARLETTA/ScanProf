function goHome() {
  window.location.href = "index.html";
}

function goZenos() {
  window.location.href = "groupe-zenos.html";
}

function afficherTableau(data) {
  const tableHead = document.getElementById("tableHead");
  const tbody = document.getElementById("elevesTableBody");
  tableHead.innerHTML = "";
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = "<tr><td colspan='100%'>Aucun participant enregistré.</td></tr>";
    return;
  }

  // Génère les entêtes de colonne dynamiquement
  const keys = Object.keys(data[0]);
  const headerRow = document.createElement("tr");
  keys.forEach(key => {
    const th = document.createElement("th");
    th.textContent = key;
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  // Remplit le tableau
  data.forEach(eleve => {
    const row = document.createElement("tr");
    keys.forEach(key => {
      const td = document.createElement("td");
      td.textContent = eleve[key] || "";
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  // Met à jour le menu déroulant pour le tri
  const triSelect = document.getElementById("triSelect");
  triSelect.innerHTML = "";
  keys.forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = "Trier par " + key;
    triSelect.appendChild(option);
  });
}

function applySort() {
  const triKey = document.getElementById("triSelect").value;
  const data = JSON.parse(localStorage.getItem("eleves")) || [];

  if (!triKey) return;

  data.sort((a, b) => {
    const valA = a[triKey] || "";
    const valB = b[triKey] || "";

    if (!isNaN(valA) && !isNaN(valB)) {
      return parseFloat(valB) - parseFloat(valA); // Tri décroissant numérique
    }
    return valA.localeCompare(valB); // Sinon tri alphabétique
  });

  afficherTableau(data);
}

function filterTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const allData = JSON.parse(localStorage.getItem("eleves")) || [];
  const filtered = allData.filter(eleve =>
    Object.values(eleve).some(val =>
      (val || "").toLowerCase().includes(input)
    )
  );
  afficherTableau(filtered);
}

function exportCSV() {
  const data = JSON.parse(localStorage.getItem("eleves")) || [];
  if (data.length === 0) return alert("Aucune donnée à exporter.");

  const keys = Object.keys(data[0]);
  const rows = [keys.join(",")];

  data.forEach(eleve => {
    const row = keys.map(key => `"${eleve[key] || ""}"`).join(",");
    rows.push(row);
  });

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
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

    localStorage.setItem("eleves", JSON.stringify(data));
    alert("✅ Données CSV importées.");
    afficherTableau(data);
  };
  reader.readAsText(file);
}

function resetData() {
  if (confirm("Êtes-vous sûr de vouloir tout réinitialiser ?")) {
    localStorage.removeItem("eleves");
    location.reload();
  }
}

// Chargement initial
window.onload = () => {
  const data = JSON.parse(localStorage.getItem("eleves")) || [];
  afficherTableau(data);
};
