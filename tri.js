function getEleves() {
  return JSON.parse(localStorage.getItem("eleves")) || [];
}

function renderTable(data) {
  const tableBody = document.getElementById("elevesTableBody");
  const tableHead = document.getElementById("tableHead");
  tableBody.innerHTML = "";
  tableHead.innerHTML = "";

  if (data.length === 0) return;

  const columns = Object.keys(data[0]);

  const headRow = document.createElement("tr");
  columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    headRow.appendChild(th);
  });
  tableHead.appendChild(headRow);

  data.forEach(eleve => {
    const row = document.createElement("tr");
    columns.forEach(col => {
      const td = document.createElement("td");
      td.textContent = eleve[col] || "";
      row.appendChild(td);
    });
    tableBody.appendChild(row);
  });

  const triSelect = document.getElementById("triSelect");
  triSelect.innerHTML = "";
  columns.forEach(col => {
    const option = document.createElement("option");
    option.value = col;
    option.textContent = "Trier par " + col;
    triSelect.appendChild(option);
  });
}

function trier() {
  const critere = document.getElementById("triSelect").value;
  const recherche = document.getElementById("searchInput").value.toLowerCase();
  let data = getEleves();

  if (recherche) {
    data = data.filter(e => Object.values(e).some(val => (val || "").toLowerCase().includes(recherche)));
  }

  data.sort((a, b) => (a[critere] || "").localeCompare(b[critere] || ""));
  renderTable(data);
}

function exportCSV() {
  const data = getEleves();
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map(e => headers.map(h => e[h] || "").join(","));
  const csvContent = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "eleves.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function resetData() {
  if (confirm("Réinitialiser les données ?")) {
    localStorage.removeItem("eleves");
    location.reload();
  }
}

window.onload = () => {
  renderTable(getEleves());
};