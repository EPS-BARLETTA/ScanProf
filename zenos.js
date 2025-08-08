// zenos.js — un seul tableau par classe, groupes alternés bleu/blanc, restants en bas (orange)
// Compatible iPad/Safari (pas de replaceAll). ES5 style.

document.addEventListener("DOMContentLoaded", function () {
  // Remplit le sélecteur de classe si plusieurs classes dans les données
  var all = [];
  try {
    all = JSON.parse(localStorage.getItem("eleves") || "[]");
  } catch (e) {
    all = [];
  }

  var classes = uniqueClasses(all);
  var select = document.getElementById("classe-select");
  if (select) {
    if (classes.length === 0) {
      // rien
    } else if (classes.length === 1) {
      var opt = document.createElement("option");
      opt.value = classes[0];
      opt.textContent = classes[0];
      select.appendChild(opt);
    } else {
      // plusieurs classes : on propose de choisir
      classes.sort();
      for (var i = 0; i < classes.length; i++) {
        var op = document.createElement("option");
        op.value = classes[i];
        op.textContent = classes[i];
        select.appendChild(op);
      }
    }
  }

  // Branche le bouton
  var btn = document.getElementById("btn-generer-zenos");
  if (btn) btn.addEventListener("click", genererGroupesZenos);

  // Si une seule classe, on peut générer directement
  if (classes.length === 1) {
    var titre = document.getElementById("titre-classe");
    if (titre) titre.textContent = "Classe " + classes[0];
    genererGroupesZenos();
  }
});

function uniqueClasses(all) {
  var set = {};
  for (var i = 0; i < all.length; i++) {
    if (all[i] && all[i].classe) set[String(all[i].classe).trim()] = true;
  }
  var out = [];
  for (var k in set) out.push(k);
  return out;
}

function genererGroupesZenos() {
  var all = [];
  try {
    all = JSON.parse(localStorage.getItem("eleves") || "[]");
  } catch (e) {
    all = [];
  }

  // Filtrage par classe (si plusieurs)
  var select = document.getElementById("classe-select");
  var classeChoisie = select && select.value ? String(select.value).trim() : null;

  var candidats = [];
  for (var i = 0; i < all.length; i++) {
    var e = all[i] || {};
    if (e.vma === undefined || e.vma === "" || !e.classe) continue;
    if (classeChoisie && String(e.classe).trim() !== classeChoisie) continue;
    var v = Number(e.vma);
    if (isNaN(v)) continue;
    // normalise quelques champs
    candidats.push({
      nom: e.nom || e.Nom || "",
      prenom: e.prenom || e.Prénom || "",
      classe: String(e.classe).trim(),
      sexe: e.sexe || e.Sexe || "",
      distance: e.distance || e.Distance || "",
      vma: v
    });
  }

  if (candidats.length < 4) {
    alert("Pas assez d'élèves valides (VMA/Classe) pour former des groupes.");
    return;
  }

  // Tri VMA décroissante
  candidats.sort(function(a,b){ return b.vma - a.vma; });

  // Constitution des groupes de 4 : [haut][milieu][milieu][bas]
  var groupes = [];
  var reste = candidats.slice(); // copy
  while (reste.length >= 4) {
    var haut = reste.shift();
    var bas  = reste.pop();
    var m1   = reste.shift();
    var m2   = reste.length ? reste.shift() : null;
    var pack = [haut, m1, m2, bas].filter(Boolean);
    // si jamais moins de 4, re-bascule les restes
    if (pack.length === 4) groupes.push(pack);
    else { // improbable ici
      for (var r = 0; r < pack.length; r++) reste.unshift(pack[r]);
      break;
    }
  }
  var nonAttribues = reste;

  // Affichage tableau unique avec groupes alternés
  renderTableauGroupes(groupes, nonAttribues, classeChoisie || (candidats[0] ? candidats[0].classe : ""));
}

function renderTableauGroupes(groupes, nonAttribues, classe) {
  var groupesDiv = document.getElementById("groupes");
  var restantsDiv = document.getElementById("restants");
  var titre = document.getElementById("titre-classe");

  if (titre) titre.textContent = "Classe " + (classe || "");

  if (groupesDiv) groupesDiv.innerHTML = "";
  if (restantsDiv) restantsDiv.innerHTML = "";

  if (!groupesDiv) return;

  // Table unique
  var table = document.createElement("table");
  table.className = "zenos-unique";
  table.innerHTML =
    '<thead>' +
      '<tr>' +
        '<th style="width:110px;">Groupe</th>' +
        '<th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th><th>Distance</th>' +
      '</tr>' +
    '</thead>' +
    '<tbody id="tbody-zenos"></tbody>';

  groupesDiv.appendChild(table);

  var tbody = table.querySelector("#tbody-zenos");

  for (var g = 0; g < groupes.length; g++) {
    var groupe = groupes[g];
    var colorClass = (g % 2 === 0) ? "group-blue" : "group-white"; // alternance bleu/blanc

    for (var r = 0; r < groupe.length; r++) {
      var e = groupe[r];
      var tr = document.createElement("tr");
      tr.className = colorClass;

      if (r === 0) {
        var tdG = document.createElement("td");
        tdG.setAttribute("rowspan", "4");
        tdG.style.fontWeight = "700";
        tdG.textContent = "Groupe " + (g + 1);
        tr.appendChild(tdG);
      }

      appendCell(tr, e.nom);
      appendCell(tr, e.prenom);
      appendCell(tr, e.classe);
      appendCell(tr, e.sexe);
      appendCell(tr, e.vma);
      appendCell(tr, e.distance);

      tbody.appendChild(tr);
    }

    // ligne séparatrice
    var sep = document.createElement("tr");
    sep.className = "separator-row";
    var sepTd = document.createElement("td");
    sepTd.setAttribute("colspan", "7");
    sep.appendChild(sepTd);
    tbody.appendChild(sep);
  }

  // Restants
  if (nonAttribues && nonAttribues.length && restantsDiv) {
    var h = document.createElement("div");
    h.className = "unassigned-title";
    h.textContent = "Élèves à attribuer manuellement car groupes complets :";
    restantsDiv.appendChild(h);

    var tabR = document.createElement("table");
    tabR.className = "unassigned";
    tabR.innerHTML =
      '<thead>' +
        '<tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th><th>Distance</th></tr>' +
      '</thead>' +
      '<tbody>' + nonAttribues.map(function(e, i){
        return '<tr>' +
          '<td>' + esc(e.nom) + '</td>' +
          '<td>' + esc(e.prenom) + '</td>' +
          '<td>' + esc(e.classe) + '</td>' +
          '<td>' + esc(e.sexe) + '</td>' +
          '<td>' + esc(e.vma) + '</td>' +
          '<td>' + esc(e.distance) + '</td>' +
        '</tr>';
      }).join("") + '</tbody>';

    restantsDiv.appendChild(tabR);

    var note = document.createElement("div");
    note.className = "note";
    note.textContent = "Ces élèves n’ont pas pu être intégrés dans un groupe complet de 4.";
    restantsDiv.appendChild(note);
  }
}

// ====== OUTILS / EXPORTS ======
function appendCell(tr, val) {
  var td = document.createElement("td");
  td.textContent = (val === undefined || val === null) ? "" : String(val);
  tr.appendChild(td);
}

function esc(s) {
  s = String(s === undefined || s === null ? "" : s);
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

// Exporte le tableau principal (groupes)
function exporterGroupesCSV() {
  var table = document.querySelector("table.zenos-unique");
  if (!table) return;

  var rows = table.querySelectorAll("tr");
  var csv = [];
  for (var i=0; i<rows.length; i++) {
    var cells = rows[i].querySelectorAll("th,td");
    if (!cells.length) continue;
    var line = [];
    for (var c=0; c<cells.length; c++) {
      // ignorer la ligne séparatrice (cellule vide colspan)
      var txt = (cells[c].textContent || "").trim();
      if (rows[i].className === "separator-row") { line = []; break; }
      // Simple échappement CSV
      if (txt.indexOf(",") !== -1) txt = '"' + txt.replace(/"/g, '""') + '"';
      line.push(txt);
    }
    if (line.length) csv.push(line.join(","));
  }

  var blob = new Blob(["\uFEFF" + csv.join("\n")], { type: "text/csv;charset=utf-8;" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "groupes_zenos.csv";
  a.click();
}

function imprimerGroupes() {
  var zone = document.getElementById("groupes-panel");
  if (!zone) return;

  var win = window.open("", "_blank");
  win.document.write(
    '<html><head><meta charset="UTF-8"><title>Impression - Groupes ZENOS</title>' +
    '<style>table{width:100%;border-collapse:collapse;margin-bottom:18px;}th,td{border:1px solid #000;padding:6px;text-align:center;}thead th{background:#eef5ff;}tr.group-blue td{background:#e6f2ff;}tr.group-white td{background:#fff;}tr.separator-row td{height:8px;border:none;background:transparent;}</style>' +
    '</head><body>' +
    '<h1 style="text-align:center;">ZENOS TOUR</h1>' +
    zone.innerHTML +
    '<div style="margin-top:24px;text-align:center;">ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB</div>' +
    '</body></html>'
  );
  win.document.close();
  win.print();
}

function exporterGroupesPDF() {
  // Même rendu que impression → l’utilisateur choisit "Enregistrer en PDF"
  imprimerGroupes();
}

function envoyerGroupesParMail() {
  var table = document.querySelector("table.zenos-unique");
  if (!table) return;

  var rows = table.querySelectorAll("tbody tr");
  var body = "Groupes ZENOS (par classe)%0A%0A";
  for (var i=0; i<rows.length; i++) {
    if (rows[i].className === "separator-row") {
      body += "%0A";
      continue;
    }
    var cells = rows[i].querySelectorAll("td");
    var line = [];
    for (var c=0; c<cells.length; c++) {
      line.push((cells[c].textContent || "").trim());
    }
    body += encodeURIComponent(line.join(" | ")) + "%0A";
  }
  body += "%0A— ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB";

  var mailto = "mailto:?subject=" + encodeURIComponent("Groupes ZENOS - Classe " + (document.getElementById("titre-classe")?.textContent || "")) + "&body=" + body;
  window.location.href = mailto;
}
