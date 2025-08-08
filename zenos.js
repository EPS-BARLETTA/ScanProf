// ====== GROUPES ZENOS ======
function genererGroupesZenos() {
  try {
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
    var parClasse = {};
    valides.forEach(function(e){
      var c = String(e.classe).trim();
      if (!parClasse[c]) parClasse[c] = [];
      parClasse[c].push(e);
    });

    var groupes = [];  // [{classe, membres:[...]}]
    var restants = [];

    Object.keys(parClasse).forEach(function(classe){
      var liste = parClasse[classe].slice().sort(function(a,b){ return b.vma - a.vma; });

      // Paquets de 4 : [haut][m1][m2][bas]
      while (liste.length >= 4) {
        var haut = liste.shift();  // VMA max
        var bas  = liste.pop();    // VMA min

        // Essai de mixité sur les 2 moyens
        var m1 = null, m2 = null;
        var fIdx = indexOfSexe(liste, "F");
        var gIdx = indexOfSexe(liste, "G");

        if (fIdx !== -1 && gIdx !== -1 && fIdx !== gIdx) {
          var firstIdx = Math.min(fIdx, gIdx);
          var first = liste.splice(firstIdx, 1)[0];
          var secondSexe = (first.sexe || "").toUpperCase().indexOf("F") === 0 ? "G" : "F";
          var secondIdx = indexOfSexe(liste, secondSexe);
          if (secondIdx !== -1) {
            var second = liste.splice(secondIdx, 1)[0];
            m1 = first; m2 = second;
          }
        }
        if (!m1 || !m2) {
          m1 = m1 || liste.shift();
          m2 = m2 || liste.shift();
        }

        groupes.push({ classe: classe, membres: [haut, m1, m2, bas] });
      }

      if (liste.length) {
        liste.forEach(function(e){ restants.push(Object.assign({}, e, {classe: classe})); });
      }
    });

    renderGroupes(groupes, restants);
  } catch (err) {
    console.error("Erreur groupes ZENOS:", err);
    alert("Une erreur est survenue pendant la génération des groupes. (Voir console)");
  }
}

function indexOfSexe(arr, sexLetter) {
  sexLetter = (sexLetter || "").toUpperCase();
  for (var i=0; i<arr.length; i++) {
    var s = (arr[i].sexe || "").toUpperCase();
    if (s.indexOf(sexLetter) === 0) return i;
  }
  return -1;
}

// ====== RENDU ======
function renderGroupes(groupes, restants) {
  var cont = document.getElementById("groupes");
  var resteCont = document.getElementById("restants");
  if (!cont) return;

  cont.innerHTML = "";
  if (resteCont) resteCont.innerHTML = "";

  // Un tableau distinct par groupe
  groupes.forEach(function(g, idx){
    var table = document.createElement("table");
    table.className = "zenos-group";
    table.innerHTML =
      '<caption>'+('Groupe ' + (idx + 1) + ' — Classe ' + escapeHtml(g.classe)) + '</caption>' +
      '<thead>' +
        '<tr>' +
          '<th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th><th>Distance</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        g.membres.map(function(m, i){
          return '<tr style="background:'+(i % 2 ? '#eaf6ff' : '#fff')+'">' +
                   '<td>'+escapeHtml(m.nom || "")+'</td>' +
                   '<td>'+escapeHtml(m.prenom || "")+'</td>' +
                   '<td>'+escapeHtml(m.classe || "")+'</td>' +
                   '<td>'+escapeHtml(m.sexe || "")+'</td>' +
                   '<td>'+escapeHtml(m.vma || "")+'</td>' +
                   '<td>'+escapeHtml(m.distance || "")+'</td>' +
                 '</tr>';
        }).join("") +
      '</tbody>';
    cont.appendChild(table);
  });

  // Élèves non attribués
  if (restants.length && resteCont) {
    var titre = document.createElement("h3");
    titre.textContent = "Élèves non attribués à un groupe de 4";
    resteCont.appendChild(titre);

    var tableR = document.createElement("table");
    tableR.className = "zenos-group";
    tableR.innerHTML =
      '<thead>' +
        '<tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th><th>Distance</th></tr>' +
      '</thead>' +
      '<tbody>' +
        restants.map(function(e, i){
          return '<tr style="background:'+(i % 2 ? '#eaf6ff' : '#fff')+'">' +
                   '<td>'+escapeHtml(e.nom || "")+'</td>' +
                   '<td>'+escapeHtml(e.prenom || "")+'</td>' +
                   '<td>'+escapeHtml(e.classe || "")+'</td>' +
                   '<td>'+escapeHtml(e.sexe || "")+'</td>' +
                   '<td>'+escapeHtml(e.vma || "")+'</td>' +
                   '<td>'+escapeHtml(e.distance || "")+'</td>' +
                 '</tr>';
        }).join("") +
      '</tbody>';
    resteCont.appendChild(tableR);

    var p = document.createElement("p");
    p.className = "notice";
    p.textContent = "Ces élèves n’ont pas pu être intégrés dans un groupe complet de 4. L’enseignant peut les répartir manuellement.";
    resteCont.appendChild(p);
  }
}

// ====== EXPORTS ======
function exporterGroupesCSV() {
  var tables = document.querySelectorAll(".zenos-group");
  if (!tables.length) return;

  var csv = "Groupe,Nom,Prénom,Classe,Sexe,VMA,Distance\n";
  Array.prototype.forEach.call(tables, function(table, tIdx){
    var captionEl = table.querySelector("caption");
    var caption = captionEl ? captionEl.textContent : ("Groupe " + (tIdx+1));
    var rows = table.querySelectorAll("tbody tr");
    Array.prototype.forEach.call(rows, function(tr){
      var cells = Array.prototype.map.call(tr.querySelectorAll("td"), function(td){ return (td.textContent || "").trim(); });
      csv += caption + "," + cells.join(",") + "\n";
    });
  });

  var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "groupes_zenos.csv";
  a.click();
}

function exporterGroupesPDF() {
  var groupes = document.getElementById("groupes");
  var restants = document.getElementById("restants");

  var contentHtml =
    '<h1 style="text-align:center;">ZENOS TOUR</h1>' +
    (groupes ? groupes.innerHTML : "") +
    (restants ? restants.innerHTML : "") +
    '<div style="margin-top:24px;text-align:center;">' +
      'ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB' +
    '</div>';

  var win = window.open("", "_blank");
  win.document.write(
    '<html><head><title>Groupes ZENOS</title><meta charset="UTF-8" />' +
    '<style>body{font-family:Arial,sans-serif;}table{width:100%;border-collapse:collapse;margin-bottom:18px;}th,td{border:1px solid #000;padding:6px;text-align:center;}caption{font-weight:700;margin-bottom:6px;}tbody tr:nth-child(even){background:#f2f2f2;}</style>' +
    '</head><body>'+ contentHtml +'</body></html>'
  );
  win.document.close();
  win.print(); // "Enregistrer en PDF" via la boîte de dialogue d'impression
}

function imprimerGroupes() {
  var win = window.open("", "_blank");
  var groupes = document.getElementById("groupes");
  var restants = document.getElementById("restants");
  win.document.write(
    '<html><head><title>Impression - Groupes ZENOS</title><meta charset="UTF-8" />' +
    '<style>body{font-family:Arial,sans-serif;}table{width:100%;border-collapse:collapse;margin-bottom:18px;}th,td{border:1px solid #000;padding:6px;text-align:center;}caption{font-weight:700;margin-bottom:6px;}tbody tr:nth-child(even){background:#f2f2f2;}</style>' +
    '</head><body><h1 style="text-align:center;">ZENOS TOUR</h1>' +
    (groupes ? groupes.innerHTML : "") +
    (restants ? restants.innerHTML : "") +
    '<div style="margin-top:24px;text-align:center;">ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB</div>' +
    '</body></html>'
  );
  win.document.close();
  win.print();
}

function envoyerGroupesParMail() {
  var tables = document.querySelectorAll(".zenos-group");
  if (!tables.length) return;

  var corps = "Groupes ZENOS :%0A%0A";
  Array.prototype.forEach.call(tables, function(table, tIdx){
    var captionEl = table.querySelector("caption");
    var caption = captionEl ? captionEl.textContent : ("Groupe " + (tIdx+1));
    corps += encodeURIComponent(caption) + "%0A";
    var rows = table.querySelectorAll("tbody tr");
    Array.prototype.forEach.call(rows, function(tr){
      var row = Array.prototype.map.call(tr.querySelectorAll("td"), function(td){ return (td.textContent || "").trim(); }).join(" | ");
      corps += encodeURIComponent(row) + "%0A";
    });
    corps += "%0A";
  });

  var nonAttrib = document.querySelector("#restants table.zenos-group tbody");
  if (nonAttrib) {
    corps += encodeURIComponent("Élèves non attribués :") + "%0A";
    Array.prototype.forEach.call(nonAttrib.querySelectorAll("tr"), function(tr){
      var row = Array.prototype.map.call(tr.querySelectorAll("td"), function(td){ return (td.textContent || "").trim(); }).join(" | ");
      corps += encodeURIComponent(row) + "%0A";
    });
  }

  var lien = "mailto:?subject=" + encodeURIComponent("Groupes ZENOS") + "&body=" + corps + encodeURIComponent("Cordialement.");
  window.location.href = lien;
}

// ====== UTILS ======
function escapeHtml(s) {
  s = String(s);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
