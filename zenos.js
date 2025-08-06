function generateGroups() {
  const data = JSON.parse(localStorage.getItem("eleves")) || [];
  if (!data.length || !data[0].VMA || !data[0].Classe) {
    alert("Données incomplètes (VMA ou Classe manquante).");
    return;
  }

  const classes = [...new Set(data.map(e => e.Classe))];
  const groups = [];

  classes.forEach(classe => {
    const eleves = data.filter(e => e.Classe === classe && e.VMA && e.Sexe);
    eleves.sort((a, b) => parseFloat(b.VMA) - parseFloat(a.VMA));

    while (eleves.length >= 4) {
      const haut = eleves.shift();
      const bas = eleves.pop();
      const milieux = [eleves.shift(), eleves.pop()].filter(Boolean);
      const groupe = [haut, ...milieux, bas];
      groups.push({ classe, groupe });
    }

    if (eleves.length > 0) {
      groups.push({ classe, groupe: eleves }); // restants non assignés
    }
  });

  displayGroups(groups);
}

function displayGroups(groups) {
  const container = document.getElementById("groupsContainer");
  container.innerHTML = "";

  groups.forEach((grp, i) => {
    const div = document.createElement("div");
    div.innerHTML = `<h3>Classe ${grp.classe} – Groupe ${i + 1}</h3><ul>` +
      grp.groupe.map(e => `<li>${e.Nom} ${e.Prénom} – VMA: ${e.VMA} – Sexe: ${e.Sexe}</li>`).join("") +
      "</ul><hr/>";
    container.appendChild(div);
  });
}

function downloadCSV() {
  const container = document.getElementById("groupsContainer");
  if (!container.innerText.trim()) return alert("Aucun groupe généré.");

  const lines = ["Classe,Groupe,Nom,Prénom,VMA,Sexe"];
  const divs = container.querySelectorAll("div");

  divs.forEach((div, index) => {
    const groupe = div.querySelector("h3").innerText;
    const items = div.querySelectorAll("li");
    items.forEach(li => {
      const parts = li.innerText.match(/(\\w+)\\s(\\w+).*VMA: ([\\d.]+).*Sexe: (\\w+)/);
      if (parts) {
        const [, nom, prenom, vma, sexe] = parts;
        lines.push(`${groupe.split("–")[0].trim()},${groupe.split("–")[1].trim()},${nom},${prenom},${vma},${sexe}`);
      }
    });
  });

  const blob = new Blob([lines.join("\\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "groupes_zenos.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF() {
  window.print(); // impression PDF système
}

function sendZenosByEmail() {
  const body = "Bonjour,%0D%0AVeuillez trouver les groupes ZENOS générés avec ScanProfs.%0D%0ACordialement.";
  const mailto = `mailto:?subject=Groupes ZENOS ScanProfs&body=${body}`;
  window.location.href = mailto;
}
