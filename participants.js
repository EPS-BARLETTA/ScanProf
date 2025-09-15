document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("tableBody");

  function loadEleves() {
    try { return JSON.parse(localStorage.getItem("eleves") || "[]"); }
    catch { return []; }
  }

  function renderTable() {
    const eleves = loadEleves();
    tableBody.innerHTML = "";
    eleves.forEach(eleve => {
      const tr = document.createElement("tr");
      for (const key in eleve) {
        const td = document.createElement("td");
        td.textContent = eleve[key];
        tr.appendChild(td);
      }
      tableBody.appendChild(tr);
    });
  }

  // Pas d’eventListener sur #addParticipant → bouton présent mais ne fait rien (état initial)
  renderTable();
});
