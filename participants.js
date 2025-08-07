function chargerParticipants() {
  const data = JSON.parse(localStorage.getItem("eleves")) || [];
  if (!data.length) return;

  const table = document.getElementById("participantsTable");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  // Générer l'en-tête dynamiquement
  const headers = Object.keys(data[0]);
  thead.innerHTML = "<tr>" + headers.map(h => "<th>" + h + "</th>").join("") + "</tr>";

  // Générer les lignes
  tbody.innerHTML = data.map(entry =>
    "<tr>" + headers.map(h => "<td>" + (entry[h] ?? "") + "</td>").join("") + "</tr>"
  ).join("");

  // Alimenter le menu de tri
  const select = document.getElementById("triSelect");
  select.innerHTML = "<option value=''>-- Trier par --</option>" +
    headers.map(h => `<option value="${h}">${h}</option>`).join("");
}

function trierTableau() {
  const critere = document.getElementById("triSelect").value;
  if (!critere) return;
  let data = JSON.parse(localStorage.getItem("eleves")) || [];

  data.sort((a, b) => {
    if (!isNaN(a[critere]) && !isNaN(b[critere])) {
      return parseFloat(a[critere]) - parseFloat(b[critere]);
    } else {
      return String(a[critere]).localeCompare(String(b[critere]));
    }
  });

  localStorage.setItem("eleves", JSON.stringify(data));
  chargerParticipants();
}

function reinitialiser() {
  if (confirm("Voulez-vous vraiment effacer tous les participants ?")) {
    localStorage.removeItem("eleves");
    location.reload();
  }
}

function exportCSV() {
  const data = JSON.parse(localStorage.getItem("eleves")) || [];
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => row[h]).join(";"));
  const csv = [headers.join(";"), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "participants.csv";
  link.click();
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const lines = e.target.result.split("\n");
    const headers = lines[0].split(";");
    const data = lines.slice(1).map(line => {
      const values = line.split(";");
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i]);
      return obj;
    });

    const existing = JSON.parse(localStorage.getItem("eleves")) || [];
    const merged = [...existing, ...data];
    localStorage.setItem("eleves", JSON.stringify(merged));
    location.reload();
  };
  reader.readAsText(file);
}

function imprimer() {
  window.print();
}

function envoyerMail() {
  const data = JSON.parse(localStorage.getItem("eleves")) || [];
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => row[h]).join("\t")).join("\n");

  const mailtoLink = "mailto:?subject=Liste des participants ScanProf&body=" + encodeURIComponent(
    "Bonjour,%0A%0AVoici la liste des participants scannés avec ScanProf :%0A%0A" + rows + "%0A%0ACordialement."
  );
  window.location.href = mailtoLink;
}

window.onload = chargerParticipants;
