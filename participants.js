
function loadTable() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");
  if (data.length === 0) return;

  const table = document.getElementById("participantsTable");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  const headers = Object.keys(data[0]);
  thead.innerHTML = "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";

  tbody.innerHTML = "";
  data.forEach(entry => {
    const row = document.createElement("tr");
    headers.forEach(h => {
      const cell = document.createElement("td");
      cell.textContent = entry[h] || "";
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
}

function sortTable() {
  const table = document.getElementById("participantsTable");
  const header = table.querySelector("thead tr");
  if (!header) return;

  const key = prompt("Trier selon quelle colonne ? (ex: Nom, VMA)");
  if (!key) return;

  const data = JSON.parse(localStorage.getItem("eleves") || "[]");

  data.sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    const isNumeric = !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB));
    if (isNumeric) return parseFloat(valA) - parseFloat(valB);
    return String(valA).localeCompare(String(valB));
  });

  localStorage.setItem("eleves", JSON.stringify(data));
  loadTable();
}

function resetTable() {
  if (confirm("Êtes-vous sûr de vouloir tout effacer ?")) {
    localStorage.removeItem("eleves");
    location.reload();
  }
}

function filterTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#participantsTable tbody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(input) ? "" : "none";
  });
}

function generateCSV() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csv = [headers.join(",")].concat(data.map(row =>
    headers.map(h => `"${row[h] || ""}"`).join(",")
  )).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "participants.csv";
  a.click();
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const lines = e.target.result.split("\n");
    const headers = lines[0].split(",");
    const data = lines.slice(1).filter(Boolean).map(line => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i]?.replace(/"/g, ""));
      return obj;
    });

    const existing = JSON.parse(localStorage.getItem("eleves") || "[]");
    const merged = [...existing, ...data];
    localStorage.setItem("eleves", JSON.stringify(merged));
    loadTable();
  };
  reader.readAsText(file);
}

function sendEmail() {
  const data = JSON.parse(localStorage.getItem("eleves") || "[]");
  if (data.length === 0) return;

  let body = "Bonjour,%0D%0AVoici la liste des participants scannés avec ScanProf :%0D%0A%0D%0A";
  data.forEach(d => {
    body += Object.values(d).join(" - ") + "%0D%0A";
  });

  window.location.href = "mailto:?subject=Liste Participants ScanProf&body=" + body;
}

window.onload = loadTable;
