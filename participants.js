document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("tableBody");
  const addBtn = document.getElementById("addParticipant");

  function loadEleves() {
    return JSON.parse(localStorage.getItem("eleves") || "[]");
  }
  function saveEleves(list) {
    localStorage.setItem("eleves", JSON.stringify(list));
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

  addBtn.addEventListener("click", () => {
    const nom = prompt("Nom :");
    const prenom = prompt("Prénom :");
    const classe = prompt("Classe :");
    const sexe = prompt("Sexe :");
    const vma = prompt("VMA :");

    if (nom && prenom) {
      const eleves = loadEleves();
      eleves.push({ Nom: nom, Prénom: prenom, Classe: classe, Sexe: sexe, VMA: vma });
      saveEleves(eleves);
      renderTable();
    }
  });

  renderTable();
});
