document.addEventListener("DOMContentLoaded", () => {
  const btnGenerer = document.getElementById("btn-generer");
  const groupesContainer = document.getElementById("groupes-container");
  const btnExport = document.getElementById("btn-export-zenos");
  const btnImprimer = document.getElementById("btn-imprimer-zenos");
  const btnEmail = document.getElementById("btn-email-zenos");

  let groupes = [];

  function genererGroupes(eleves) {
    const parClasse = {};

    eleves.forEach(e => {
      if (!e.vma || !e.classe || !e.sexe) return;
      const classe = e.classe.trim();
      if (!parClasse[classe]) parClasse[classe] = [];
      parClasse[classe].push({ ...e, vma: parseFloat(e.vma) });
    });

    groupes = [];

    for (const classe in parClasse) {
      const liste = parClasse[classe].sort((a, b) => b.vma - a.vma);
      while (liste.length >= 4) {
        const [haut] = liste.splice(0, 1);
        const [bas] = liste.splice(-1, 1);
        const moyens = liste.splice(0, 2);
        const groupe = [haut, ...moyens, bas];
        groupes.push(groupe);
      }

      // Élèves restants
      if (liste.length) {
        groupes.push({ reste: true, classe, eleves: liste });
      }
    }
  }

  function afficherGroupes() {
    groupesContainer.innerHTML = "";

    groupes.forEach((groupe, index) => {
      if (groupe.reste) {
        const titre = document.createElement("h3");
        titre.textContent = `Élèves non attribués (${groupe.classe})`;
        titre.style.color = "red";
        groupesContainer.appendChild(titre);
        const ul = document.createElement("ul");
        groupe.eleves.forEach(e => {
          const li = document.createElement("li");
          li.textContent = `${e.prenom} ${e.nom} - VMA : ${e.vma}`;
          ul.appendChild(li);
        });
        groupesContainer.appendChild(ul);
      } else {
        const table = document.createElement("table");
        table.className = "tableau-groupe";
        const titre = document.createElement("caption");
        titre.textContent = `Groupe ZENOS #${index + 1}`;
        table.appendChild(titre);

        const thead = document.createElement("thead");
        thead.innerHTML = "<tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th><th>Distance</th></tr>";
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        groupe.forEach(e => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${e.nom}</td><td>${e.prenom}</td><td>${e.classe}</td><td>${e.sexe}</td><td>${e.vma}</td><td>${e.distance || ""}</td>`;
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        groupesContainer.appendChild(table);
      }
    });
  }

  btnGenerer.addEventListener("click", () => {
    const eleves = JSON.parse(localStorage.getItem("eleves") || "[]");
    const valides = eleves.filter(e => e.vma && e.classe && e.sexe);
    if (!valides.length) {
      alert("Données incomplètes (VMA, Classe ou Sexe manquant).");
      return;
    }

    genererGroupes(valides);
    afficherGroupes();
  });

  btnExport.addEventListener("click", () => {
    let csv = "Groupe,Nom,Prénom,Classe,Sexe,VMA,Distance\n";
    let compteur = 1;
    groupes.forEach(groupe => {
      if (groupe.reste) {
        groupe.eleves.forEach(e => {
          csv += `Non attribué,${e.nom},${e.prenom},${e.classe},${e.sexe},${e.vma},${e.distance || ""}\n`;
        });
      } else {
        groupe.forEach(e => {
          csv += `${compteur},${e.nom},${e.prenom},${e.classe},${e.sexe},${e.vma},${e.distance || ""}\n`;
        });
        compteur++;
      }
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "groupes_zenos.csv";
    link.click();
  });

  btnImprimer.addEventListener("click", () => {
    window.print();
  });

  btnEmail.addEventListener("click", () => {
    let corps = "Bonjour,%0A%0AVeuillez trouver ci-dessous les groupes ZENOS :%0A%0A";
    let compteur = 1;
    groupes.forEach(groupe => {
      if (groupe.reste) {
        corps += `%0AÉlèves non attribués (${groupe.classe}) :%0A`;
        groupe.eleves.forEach(e => {
          corps += `- ${e.prenom} ${e.nom}, VMA ${e.vma}%0A`;
        });
      } else {
        corps += `%0AGroupe ZENOS #${compteur} :%0A`;
        groupe.forEach(e => {
          corps += `${e.nom} ${e.prenom} (${e.classe}) - VMA ${e.vma}%0A`;
        });
        compteur++;
      }
    });

    window.location.href = `mailto:?subject=Groupes ZENOS&body=${corps}%0A%0ACordialement.`;
  });
});
