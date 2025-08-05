function goHome() {
  window.location.href = "index.html";
}

function goZenos() {
  window.location.href = "groupe-zenos.html";
}

function resetStorage() {
  if (confirm("Voulez-vous vraiment réinitialiser les données ?")) {
    localStorage.removeItem("eleves");
    location.reload();
  }
}

function exportCSV() {
  const eleves = JSON.parse(localStorage.getItem("eleves")) || [];
  if (eleves.length === 0) return alert("Aucune donnée à exporter.");

  const headers = Object.keys(eleves[0]);
  const rows = eleves.map(eleve =>
    headers.map(h => `"${(eleve[h] || "").toString().replace(/"/g, '""')}"`).join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
  reader.onload = function (e) {
    const text = e.target.result;
    const [headerLine, ...lines] = text.trim().split("\n");
    const headers = headerLine.split(",");

    const data = lines.map(line => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = values[i] ? values[i].trim().replace(/^"|"$/g, "") : "";
      });
      return obj;
    });

    localStorage.setItem("eleves", JSON.stringify(data));
    location.reload();
  };
  reader.readAsText(file);
}

function applySort() {
  const key = document.getElementById("sortSelect").value;
  const eleves = JSON.parse(localStorage.getItem("eleves")) || [];
  eleves.sort((a, b) => (a[key] || "").localeCompare(b[key] || ""));
  localStorage.setItem("eleves", JSON.stringify(eleves));
  displayTable(eleves);
}

function applySearch() {
  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  const eleves = JSON.parse(localStorage.getItem("eleves")) || [];
  const filtered = eleves.filter(eleve =>
    Object.values(eleve).some(v =>
      (v || "").toString().toLowerCase().includes(searchValue)
    )
  );
  displayTable(filtered);
}

function displayTable(data) {
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("elevesTableBody");
  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  if (data.length === 0) return;

  const headers = Object.keys(data[0]);

  const headRow = document.createElement("tr");
  headers.forEach(header => {
    const th = document.createElement("th");
    th.textContent = header;
    headRow.appendChild(th);
  });
  tableHead.appendChild(headRow);

  data.forEach(eleve => {
    const row = document.createElement("tr");
    headers.forEach(header => {
      const td = document.createElement("td");
      td.textContent = eleve[header] || "";
      row.appendChild(td);
    });
    tableBody.appendChild(row);
  });

  populateSortOptions(headers);
}

function populateSortOptions(headers) {
  const select = document.getElementById("sortSelect");
  select.innerHTML = "";
  headers.forEach(header => {
    const option = document.createElement("option");
    option.value = header;
    option.textContent = header;
    select.appendChild(option);
  });
}

window.onload = function () {
  const eleves = JSON.parse(localStorage.getItem("eleves")) || [];
  displayTable(eleves);
};
