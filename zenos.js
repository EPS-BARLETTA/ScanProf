// ====== GROUPES ZENOS ======
function genererGroupesZenos() {
  const all = JSON.parse(localStorage.getItem("eleves") || "[]");

  // Champs indispensables
  const valides = all
    .filter(e => e && e.vma !== undefined && e.vma !== "" && e.classe && e.sexe)
    .map(e => ({ ...e, vma: Number(e.vma) }))
    .filter(e => !Number.isNaN(e.vma));

  if (valides.length < 4) {
    alert("Données incomplètes (VMA, classe ou sexe manquants).");
    return;
  }

  // Regrouper par classe
  const parClasse = {};
  valides.forEach(e => {
    const c = String(e.classe).trim();
    if (!parClasse[c]) parClasse[c] = [];
    parClasse[c].push(e);
  });

  const groupes = [];  // [{classe, membres:[...]}]
  const restants = [];

  Object.entries(parClasse).forEach(([classe, liste]) => {
    // Tri VMA décroissante
    liste.sort((a, b) => b.vma - a.vma);

    // On monte des paquets de 4 : [haut][m1][m2][bas]
    while (liste.length >= 4) {
      const haut = liste.shift();  // VMA max
      const bas  = liste.pop();    // VMA min

      // Essai de mixité sur les 2 moyens
      let m1, m2;

      const wantF = "F", wantG = "G";
      const fIdx = liste.findIndex(x => String(x.sexe).toUpperCase().startsWith(wantF));
      const gIdx = liste.findIndex(x => String(x.sexe).toUpperCase().startsWith(wantG));

      if (fIdx !== -1 && gIdx !== -1 && fIdx !== gIdx) {
        // Prend 1F + 1G
        const firstIdx  = Math.min(fIdx, gIdx);
        const secondKey = (firstIdx === fIdx) ? wantG : wantF;
        const first  = liste.splice(firstIdx, 1)[0];
        const secondIdx = liste.findIndex(x => String(x.sexe).toUpperCase().startsWith(secondKey));
        if (secondIdx !== -1) {
          const second = liste.splice(secondIdx, 1)[0];
          m1 = first; m2 = second;
        }
      }

      // fallback si pas de mixité possible
      if (!m1 || !m2) {
        m1 = liste.shift();
        m2 = liste.shift();
      }

      groupes.push({ classe, membres: [haut, m1, m2, bas] });
    }

    // Reste de cette classe
    if (liste.length) {
      restants.push(...liste.map(e => ({ ...e, classe })));
    }
  });

  renderGroupes(groupes, restants);
}

// ====== RENDU ======
function renderGroupes(groupes, restants) {
  const cont = document.getElementById("groupes");
  const resteCont = document.getElementById("restants");
  cont.innerHTML = "";
  resteCont.innerHTML = "";

  // Un tableau distinct par groupe
  groupes.forEach((g, idx) => {
    const table = document.createElement("table");
    table.className = "zenos-group";
    table.innerHTML = `
      <caption>Groupe ${idx + 1} — Classe ${escapeHtml(g.classe)}</caption>
      <thead>
        <tr>
          <th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th><th>Distance</th>
        </tr>
      </thead>
      <tbody>
        ${g.membres.map((m, i) => `
          <tr style="background:${i % 2 ? '#eaf6ff' : '#fff'}">
            <td>${escapeHtml(m.nom ?? "")}</td>
            <td>${escapeHtml(m.prenom ?? "")}</td>
            <td>${escapeHtml(m.classe ?? "")}</td>
            <td>${escapeHtml(m.sexe ?? "")}</td>
            <td>${escapeHtml(m.vma ?? "")}</td>
            <td>${escapeHtml(m.distance ?? "")}</td>
          </tr>
        `).join("")}
      </tbody>
    `;
    cont.appendChild(table);
  });

  // Élèves non attribués
  if (restants.length) {
    const titre = document.createElement("h3");
    titre.textContent = "Élèves non attribués à un groupe de 4";
    resteCont.appendChild(titre);

    const table = document.createElement("table");
    table.className = "zenos-group";
    table.innerHTML = `
      <thead>
        <tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th><th>Distance</th></tr>
      </thead>
      <tbody>
        ${restants.map((e, i) => `
          <tr style="background:${i % 2 ? '#eaf6ff' : '#fff'}">
            <td>${escapeHtml(e.nom ?? "")}</td>
            <td>${escapeHtml(e.prenom ?? "")}</td>
            <td>${escapeHtml(e.classe ?? "")}</td>
            <td>${escapeHtml(e.sexe ?? "")}</td>
            <td>${escapeHtml(e.vma ?? "")}</td>
            <td>${escapeHtml(e.distance ?? "")}</td>
          </tr>
        `).join("")}
      </tbody>
    `;
    resteCont.appendChild(table);

    const p = document.createElement("p");
    p.className = "notice";
    p.textContent = "Ces élèves n’ont pas pu être intégrés dans un groupe complet de 4. L’enseignant peut les répartir manuellement.";
    resteCont.appendChild(p);
  }
}

// ====== EXPORTS ======
function exporterGroupesCSV() {
  const tables = document.querySelectorAll(".zenos-group");
  if (!tables.length) return;

  let csv = "Groupe,Nom,Prénom,Classe,Sexe,VMA,Distance\n";
  tables.forEach((table, tIdx) => {
    const caption = table.querySelector("caption")?.textContent || `Groupe ${tIdx+1}`;
    table.querySelectorAll("tbody tr").forEach(tr => {
      const cells = Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim());
      csv += `${caption},${cells.join(",")}\n`;
    });
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "groupes_zenos.csv";
  a.click();
}

function exporterGroupesPDF() {
  const contentHtml = `
    <h1 style="text-align:center;">ZENOS TOUR</h1>
    ${document.getElementById("groupes").innerHTML}
    ${document.getElementById("restants").innerHTML}
    <div style="margin-top:24px;text-align:center;">
      ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB
    </div>
  `;

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Groupes ZENOS</title>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
          th, td { border: 1px solid #000; padding: 6px; text-align: center; }
          caption { font-weight: 700; margin-bottom: 6px; }
          tbody tr:nth-child(even) { background: #f2f2f2; }
        </style>
      </head>
      <body>${contentHtml}</body>
    </html>
  `);
  win.document.close();
  win.print(); // "Enregistrer en PDF" côté utilisateur
}

function imprimerGroupes() {
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Impression - Groupes ZENOS</title>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
          th, td { border: 1px solid #000; padding: 6px; text-align: center; }
          caption { font-weight: 700; margin-bottom: 6px; }
          tbody tr:nth-child(even) { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1 style="text-align:center;">ZENOS TOUR</h1>
        ${document.getElementById("groupes").innerHTML}
        ${document.getElementById("restants").innerHTML}
        <div style="margin-top:24px;text-align:center;">
          ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
}

function envoyerGroupesParMail() {
  const tables = document.querySelectorAll(".zenos-group");
  if (!tables.length) return;

  let corps = "Groupes ZENOS :%0A%0A";
  tables.forEach((table, tIdx) => {
    const caption = table.querySelector("caption")?.textContent || `Groupe ${tIdx+1}`;
    corps += caption + "%0A";
    table.querySelectorAll("tbody tr").forEach(tr => {
      const row = Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim()).join(" | ");
      corps += row + "%0A";
    });
    corps += "%0A";
  });

  // Ajout des non-attribués si présents
  const nonAttribuesBlock = document.querySelector("#restants table.zenos-group tbody");
  if (nonAttribuesBlock) {
    corps += "Élèves non attribués :%0A";
    Array.from(nonAttribuesBlock.querySelectorAll("tr")).forEach(tr => {
      const row = Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim()).join(" | ");
      corps += row + "%0A";
    });
  }

  const lien = `mailto:?subject=Groupes ZENOS&body=${corps}Cordialement.`;
  window.location.href = lien;
}

// ====== UTILS ======
function escapeHtml(s) {
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
