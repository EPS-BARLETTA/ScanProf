document.addEventListener('DOMContentLoaded', () => {
  const participants = JSON.parse(localStorage.getItem('participants')) || [];
  const valides = participants.filter(p => p.vma && !isNaN(p.vma));
  const groupes = [];
  const used = [];

  // Trier par VMA décroissante
  valides.sort((a, b) => parseFloat(b.vma) - parseFloat(a.vma));

  while (valides.length >= 4) {
    const groupe = [];

    // Sélection VMA haute
    groupe.push(valides.shift());

    // VMA basse
    groupe.push(valides.pop());

    // 2 intermédiaires
    if (valides.length >= 2) {
      groupe.push(valides.shift());
      groupe.push(valides.pop());
    } else {
      groupe.push(...valides.splice(0, 2));
    }

    groupes.push(groupe);
  }

  // Affichage
  const container = document.getElementById('groupes');
  groupes.forEach((groupe, i) => {
    const div = document.createElement('div');
    div.className = 'groupe';
    div.innerHTML = `<h3>Groupe ${i + 1}</h3><ul>` +
      groupe.map(p => `<li>${p.nom} (${p.vma} km/h) – ${p.sexe}</li>`).join('') +
      `</ul>`;
    container.appendChild(div);
  });

  // Export CSV
  document.getElementById('exportCSV').addEventListener('click', () => {
    let csv = "Groupe,Nom,Sexe,Classe,VMA\n";
    groupes.forEach((groupe, i) => {
      groupe.forEach(p => {
        csv += `${i + 1},${p.nom},${p.sexe},${p.classe},${p.vma}\n`;
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "groupes_zenos.csv";
    link.click();
  });
});
