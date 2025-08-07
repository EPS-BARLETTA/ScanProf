document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#table-body");
  const triSelect = document.getElementById("tri");
  const btnTrier = document.getElementById("btn-trier");
  const btnReset = document.getElementById("btn-reset");
  const btnExport = document.getElementById("btn-export");
  const btnImport = document.getElementById("btn-import");
  const btnImprimer = document.getElementById("btn-imprimer");
  const btnEmail = document.getElementById("btn-email");

  let eleves = JSON.parse(localStorage.getItem("eleves")) || [];

  function afficherTableau(data) {
    tableBody.innerHTML = "";

    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="10">Aucun élève enregistré.</td></tr>';
      return;
    }

    const keys = Object.keys(data[0]);
    const tableHead = document.querySelector("#table-head");
    tableHead.innerHTML = keys.map(k => `<th>${k}</th>`).join("");

    data.forEach(el => {
      const row = document.createElement("tr");
      keys.forEach(k => {
        const cell = document.createElement("td");
        cell.textContent = el[k];
        row.appendChild(cell);
      });
      tableBody.appendChild(row);
    });

    // Mise en forme visuelle (lignes alternées)
    document.querySelectorAll("tbody tr:nth-child(even)").forEach(row => {
      row.style.backgroundColor = "#f2f2f2";
    });
  }

  function trierPar(cle) {
    eleves.sort((a, b) => {
      const valA = a[cle];
      const valB = b[cle];
      if (!isNaN(valA) && !isNaN(valB)) {
        return parseFloat(valA) - parseFloat(valB);
      } else {
        return String(valA).localeCompare(String(valB));
      }
    });
    afficherTableau(eleves);
  }

  btnTrier.addEventListener("click", () => {
    const critere = triSelect.value;
    if (critere) trierPar(critere);
  });

  btnReset.addEventListener("click", () => {
    if (confirm("Voulez-vous vraiment réinitialiser la liste ?")) {
      localStorage.removeItem("eleves");
      eleves = [];
      afficherTableau(eleves);
    }
  });

  btnExport.addEventListener("click", () => {
    const csvContent = [
      Object.keys(eleves[0] || {}).join(","),
      ...eleves.map(obj => Object.values(obj).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "participants.csv";
    link.click();
  });

  btnImport.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      const lines = event.target.result.split("\n");
      const headers = lines[0].split(",");
      const newData = lines.slice(1).map(line => {
        const values = line.split(",");
        return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim() || ""]));
      });
      eleves = newData;
      localStorage.setItem("eleves", JSON.stringify(eleves));
      afficherTableau(eleves);
    };
    reader.readAsText(file);
  });

  btnImprimer.addEventListener("click", () => {
    window.print();
  });

  btnEmail.addEventListener("click", () => {
    let contenu = "Bonjour,%0A%0AVeuillez trouver ci-dessous la liste des participants scannés :%0A%0A";
    contenu += Object.keys(eleves[0] || {}).join("\t") + "%0A";
    contenu += eleves.map(e => Object.values(e).join("\t")).join("%0A");
    const mailto = `mailto:?subject=Liste participants ScanProf&body=${contenu}%0A%0ACordialement.`;
    window.location.href = mailto;
  });

  // Initialisation
  afficherTableau(eleves);

  // Ajout dynamique des options de tri
  const champsDisponibles = Object.keys(eleves[0] || {});
  triSelect.innerHTML = champsDisponibles.map(champ => `<option value="${champ}">${champ}</option>`).join("");
});
