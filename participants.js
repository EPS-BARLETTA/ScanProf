document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("table-body");
  const selectTri = document.getElementById("tri-select");

  function afficherParticipants(participants) {
    tableBody.innerHTML = "";
    participants.forEach(e => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${e.Nom || ""}</td>
        <td>${e.Prénom || e.Prenom || ""}</td>
        <td>${e.Classe || ""}</td>
        <td>${e.Sexe || ""}</td>
        <td>${e.VMA || ""}</td>
        <td>${e.Distance || ""}</td>
        <td>${e.Vitesse || ""}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  function getParticipants() {
    return JSON.parse(localStorage.getItem("eleves") || "[]");
  }

  function saveParticipants(participants) {
    localStorage.setItem("eleves", JSON.stringify(participants));
  }

  function trierParticipants(par) {
    const participants = getParticipants();
    if (!participants[0]?.hasOwnProperty(par)) return;

    if (!isNaN(participants[0][par])) {
      participants.sort((a, b) => parseFloat(b[par]) - parseFloat(a[par]));
    } else {
      participants.sort((a, b) => (a[par] || "").localeCompare(b[par] || ""));
    }

    afficherParticipants(participants);
  }

  document.getElementById("export-csv").onclick = () => {
    const participants = getParticipants();
    if (!participants.length) return;
    const header = Object.keys(participants[0]);
    const rows = [header.join(";")];
    participants.forEach(p => {
      rows.push(header.map(k => p[k] || "").join(";"));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "participants.csv";
    a.click();
  };

  document.getElementById("import-csv").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const lines = e.target.result.split("\n");
      const keys = lines[0].split(";");

      const newParticipants = lines.slice(1).map(line => {
        const values = line.split(";");
        const obj = {};
        keys.forEach((key, i) => obj[key] = values[i]);
        return obj;
      });

      const existing = getParticipants();
      const updated = [...existing, ...newParticipants];
      saveParticipants(updated);
      afficherParticipants(updated);
    };
    reader.readAsText(file);
  });

  document.getElementById("reinit").onclick = () => {
    if (confirm("Voulez-vous vraiment tout réinitialiser ?")) {
      localStorage.removeItem("eleves");
      tableBody.innerHTML = "";
    }
  };

  document.getElementById("print").onclick = () => window.print();

  document.getElementById("send-mail").onclick = () => {
    const participants = getParticipants();
    let body = "Bonjour, voici la liste des participants :\n\n";
    participants.forEach(p => {
      body += `${p.Prenom || p.Prénom} ${p.Nom} - ${p.Classe} - VMA : ${p.VMA}\n`;
    });
    const mailto = `mailto:?subject=Liste participants ScanProfs&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  document.getElementById("search-input").addEventListener("input", function () {
    const value = this.value.toLowerCase();
    const participants = getParticipants().filter(p =>
      Object.values(p).some(v => (v || "").toString().toLowerCase().includes(value))
    );
    afficherParticipants(participants);
  });

  selectTri.addEventListener("change", () => trierParticipants(selectTri.value));

  // Initialisation
  const data = getParticipants();
  afficherParticipants(data);
});
