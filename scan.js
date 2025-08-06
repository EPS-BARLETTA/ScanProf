function normalizeKeys(obj) {
  const map = {
    vma: 'VMA',
    vitesse: 'Vitesse',
    distance: 'Distance',
    classe: 'Classe',
    sexe: 'Sexe',
    nom: 'Nom',
    prénom: 'Prénom',
    prenom: 'Prénom'
  };
  const result = {};
  for (const key in obj) {
    const cleanKey = key.trim().toLowerCase();
    result[map[cleanKey] || key] = obj[key];
  }
  return result;
}

function loadTable() {
  let data = JSON.parse(localStorage.getItem("eleves")) || [];
  data = data.map(normalizeKeys);
  localStorage.setItem("eleves", JSON.stringify(data));

  const table = document.getElementById("dataTable");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  if (!data.length) return;

  const headers = Object.keys(data[0]);
  thead.innerHTML = "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";
  tbody.innerHTML = data.map(row => {
    return "<tr>" + headers.map(h => `<td>${row[h] || ""}</td>`).join("") + "</tr>";
  }).join("");

  const select = document.getElementById("sortSelect");
  select.innerHTML = headers.map(h => `<option value="${h}">${h}</option>`).join("");
}

function sortTable() {
  const critere = document.getElementById("sortSelect").value;
  let data = JSON.parse(localStorage.getItem("eleves")) || [];
  const isNumeric = data.every(e => !isNaN(parseFloat(e[critere])));
  data.sort((a, b) => {
    const aVal = a[critere] || "";
    const bVal = b[critere] || "";
    return isNumeric
      ? parseFloat(aVal) - parseFloat(bVal)
      : aVal.localeCompare(bVal);
  });
  localStorage.setItem("eleves", JSON.stringify(data));
  loadTable();
}

function filterTable() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#dataTable tbody tr");
  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(search) ? "" : "none";
  });
}

function exportCSV() {
  const data = JSON.parse(localStorage.getItem("eleves")) || [];
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(",")].concat(
    data.map(row => headers.map(h => `"${row[h] || ""}"`).join(","))
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "participants.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function importCSV() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = reader.result.split("\n").filter(l => l.trim());
      const headers = lines[0].split(",");
      const rows = lines.slice(1).map(line => {
        const values = line.split(",");
        return headers.reduce((obj, h, i) => {
          obj[h] = values[i].replace(/^"|"$/g, '');
          return obj;
        }, {});
      });
      localStorage.setItem("eleves", JSON.stringify(rows));
      loadTable();
    };
    reader.readAsText(file);
  };
  input.click();
}

function resetData() {
  if (confirm("Réinitialiser la liste ? Cela effacera toutes les données.")) {
    localStorage.removeItem("eleves");
    location.reload();
  }
}

function generatePDF() {
  window.print();
}

function sendByEmail() {
  const data = JSON.parse(localStorage.getItem("eleves")) || [];
  if (!data.length) return alert("Aucune donnée à envoyer.");
  const headers = Object.keys(data[0]);
  const bodyContent = [headers.join(" | ")].concat(
    data.map(row => headers.map(h => row[h] || "").join(" | "))
  ).join("%0D%0A");
  const mailto = `mailto:?subject=Participants ScanProfs&body=Bonjour,%0D%0AVeuillez trouver la liste des participants :%0D%0A${bodyContent}%0D%0ACordialement.`;
  window.location.href = mailto;
}

window.onload = loadTable;
