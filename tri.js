function goHome() {
  window.location.href = "index.html";
}

function goZenos() {
  window.location.href = "groupe-zenos.html";
}

function getData() {
  return JSON.parse(localStorage.getItem("eleves")) || [];
}

function saveData(data) {
  localStorage.setItem("eleves", JSON.stringify(data));
}

function buildTable(data) {
  const tableHead = document.getElementById("tableHead");
  const tbody = document.getElementById("elevesTableBody");
  tbody.innerHTML = "";
  tableHead.innerHTML = "";

  if (data.length === 0) return;

  const keys = Object.keys(data[0]);

  // Créer l'en-tête du tableau
  const headRow = document.createElement("tr");
  keys.forEach(key => {
    const th = document.createElement("th");
    th.textContent = key;
    headRow.appendChild(th);
  });
  tableHead.appendChild(headRow);

  // Créer les lignes du tableau
  data.forEach(eleve => {
    const tr = document.createElement("tr");
    keys.forEach(key => {
      const td = document.createElement("td");
      td.textContent = eleve[key] || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  // Remplir le menu déroulant avec les colonnes
  const sortSelect = document.getElementById("sortKey");
  sortSelect.innerHTML = "";
  keys.forEach(k => {
    const option = document.createElement("option");
    option.value = k;
    option.textContent = "Trier par " + k;
    sortSelect.appendChild(option);
  });
}

function sortTable() {
  const key = document.getElementById("sortKey").value;
  const data = getData();

  if (!key || data.length === 0) return;

  const sorted = [...data].sort((a, b) => {
    const valA = a[key] || "";
    const valB = b[key] || "";

    const isNumeric = !isNaN(valA) && !isNaN(valB);
    if (isNumeric) {
      return parseFloat(valA) - parseFloat(valB);
    } else {
      return valA.toString().localeCompare(valB.toString(), "fr", { sensitivity: "base" });
    }
  });

  saveData(sorted);
  buildTable(sorted);
}

function resetData() {
  if (confirm("Confirmer la suppression de tous les participants ?")) {
    localStorage.removeItem("eleves");
    buildTable([]);
  }
}

function searchTable() {
  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  const data = getData();
  const filtered = data.filter(eleve =>
    Object.values(eleve).some(val =>
      (val || "").toString().toLowerCase().includes(searchValue)
    )
  );
  buildTable(filtered);
}

function exportCSV() {
  const data = getData();
  if (data.length === 0) return;

  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(","),
    ...data.map(row => keys.map(k => `"${row[k] || ""}"`).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "participants.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const lines = e.target.result.split("\n").filter(Boolean);
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const data = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i] || "");
      return obj;
    });
    saveData(data);
    buildTable(data);
  };
  reader.readAsText(file);
}

window.onload = function() {
  buildTable(getData());
};
