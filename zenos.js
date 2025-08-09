// zenos.js — normalisation des classes + un seul tableau par classe ou "Tous"
// Compatible iPad/Safari (ES5)

document.addEventListener("DOMContentLoaded", function () {
  var all = safeParse(localStorage.getItem("eleves")) || [];

  // Normalise les classes en amont
  for (var i = 0; i < all.length; i++) {
    if (all[i]) all[i].classe = canonClasse(all[i].classe || all[i].Classe || "");
  }

  // Construit la liste des classes uniques (après normalisation)
  var classes = uniqueClasses(all);
  var select = document.getElementById("classe-select");
  if (select) {
    // Ajoute l’option “Tous (classe ignorée)”
    var optTous = document.createElement("option");
    optTous.value = "__TOUS__";
    optTous.textContent = "Tous (classe ignorée)";
    select.appendChild(optTous);

    // Puis chaque classe normalisée
    classes.sort();
    for (var j = 0; j < classes.length; j++) {
      var op = document.createElement("option");
      op.value = classes[j];
      op.textContent = classes[j];
      select.appendChild(op);
    }
  }

  // Branche bouton
  var btn = document.getElementById("btn-generer-zenos");
  if (btn) btn.addEventListener("click", genererGroupesZenos);

  // Si 1 seule classe, la sélectionner par défaut
  var titre = document.getElementById("titre-classe");
  if (select && classes.length === 1) {
    select.value = classes[0];
    if (titre) titre.textContent = "Classe " + classes[0];
    genererGroupesZenos();
  } else if (titre) {
    titre.textContent = "Tous (classe ignorée)";
  }
});

function safeParse(text) {
  try { return JSON.parse(text || "[]"); } catch (e) { return []; }
}

// Normalisation robuste : "5ème A", "5emeA", "5 A", "5a" → "5A"
function canonClasse(raw) {
  if (!raw) return "";
  var s = String(raw).toUpperCase();
  // enlève accents
  s = s.replace(/[ÉÈÊ]/g, "E").replace(/[ÀÂÄ]/g, "A").replace(/[ÙÛÜ]/g, "U").replace(/[ÎÏ]/g, "I").replace(/[ÔÖ]/g, "O").replace(/[Ç]/g, "C");
  // enlève espaces/points/tirets/underscores
  s = s.replace(/[\s._-]+/g, "");
  // remplace "EME"/"EM" par "E"
  s = s.replace(/EME/g, "E").replace(/EM/g, "E");
  // cas communs : 5E A → 5A
  s = s.replace(/^(\d+)E([A-Z])$/, "$1$2");
  // pattern "5A"
  var m = s.match(/^(\d+)([A-Z])$/);
  if (m) return m[1] + m[2];
  // "5EME A" → 5A
  m = s.match(/^(\d+)E?ME?([A-Z])$/);
  if (m) return m[1] + m[2];
  // Dernier recours : chiffre + lettre
  m = s.match(/^(\d+).*?([A-Z])$/);
  if (m) return m[1] + m[2];
  return s;
}

function uniqueClasses(all) {
  var set = {};
  for (var i = 0; i < all.length; i++) {
    if (all[i] && all[i].classe) set[all[i].classe] = true;
  }
  var out = [];
  for (var k in set) out.push(k);
  return out;
}

function genererGroupesZenos() {
  var all = safeParse(localStorage.getItem("eleves")) || [];
  // normalise encore (au cas où nouveaux scans)
  for (var i = 0; i < all.length; i++) {
    if (all[i]) all[i].classe = canonClasse(all[i].classe || all[i].Classe || "");
  }

  var select = document.getElementById("classe-select");
  var choix = select && select.value ? select.value : "__TOUS__";

  var candidats = [];
  for (var j = 0; j < all.length; j++) {
    var e = all[j] || {};
    if (e.vma === undefined || e.vma === "") continue;
    var v = Number(e.vma);
    if (isNaN(v)) continue;
    if (choix !== "__TOUS__" && (e.classe || "") !== choix) continue;

    candidats.push({
      nom: e.nom || e.Nom || "",
      prenom: e.prenom || e.Prénom || "",
      classe: e.classe || "",
      sexe: e.sexe || e.Sexe || "",
      distance: e.distance || e.Distance || "",
      vma: v
    });
  }

  var titre = document.getElementById("titre-classe");
  if (titre) titre.textContent = (choix === "__TOUS__") ? "Tous (classe ignorée)" : ("Classe " + choix);

  if (candidats.length < 4) {
    alert("Pas assez d'élèves valides (VMA) pour former des groupes.");
    return;
  }

  // Tri VMA décroissante
  candidats.sort(function(a,b){ return b.vma - a.vma; });

  // Groupes de 4 : [haut][milieu][milieu][bas]
  var groupes = [];
  var reste = candidats.slice();
  while (reste.length >= 4) {
    var haut = reste.shift();
    var bas  = reste.pop();
    var m1   = reste.shift();
    var m2   = reste.length ? reste.shift() : null;
    var pack = [haut, m1, m2, bas].filter(Boolean);
    if (pack.length === 4) groupes.push(pack);
    else { for (var r = 0; r < pack.length; r++) reste.unshift(pack[r]); break; }
  }
  var nonAttribues = reste;

  renderTableauGroupes(groupes, nonAttribues);
}

function renderTableauGroupes(groupes, nonAttribues) {
  var groupesDiv = document.getElementById("groupes");
  var restantsDiv = document.getElementById("restants");
  if (groupesDiv) groupesDiv.innerHTML = "";
  if (restantsDiv) restantsDiv.innerHTML = "";
  if (!groupesDiv) return;

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
    var colorClass = (g % 2 === 0) ? "group-blue" : "group-white";

    for (var i = 0; i < groupe.length; i++) {
      var e = groupe[i];
      var tr = document.createElement("tr");
      tr.className = colorClass;

      if (i === 0) {
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
      '<tbody>' + nonAttribues.map(function(e){
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

function exporterGroupesCSV() {
  var table = document.querySelector("table.zenos-unique");
  if (!table) return;
  var rows = table.querySelectorAll("tr");
  var csv = [];
  for (var i=0; i<rows.length; i++) {
    if (rows[i].className === "separator-row") continue;
    var cells = rows[i].querySelectorAll("th,td");
    if (!cells.length) continue;
    var line = [];
    for (var c=0; c<cells.length; c++) {
      var txt = (cells[c].textContent || "").trim();
      if (txt.indexOf(",") !== -1) txt = '"' + txt.replace(/"/g, '""') + '"';
      line.push(txt);
    }
    csv.push(line.join(","));
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
    '<style>table{width:100%;border-collapse:collapse;margin-bottom:18px;}th,td{border:1px solid #000;padding:6px;text-align:center;}thead th{background:#eef5ff;}tr.group-blue td{background:#e6f2ff;}tr.group-white td{background:#fff;}tr.separator-row td{height:8px;border:none;background:transparent;}.unassigned thead th{background:#ffe9cc}.unassigned tbody td{background:#fff4e6}</style>' +
    '</head><body>' +
    '<h1 style="text-align:center;">ZENOS TOUR</h1>' +
    zone.innerHTML +
    '<div style="margin-top:24px;text-align:center;">ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB</div>' +
    '</body></html>'
  );
  win.document.close();
  win.print();
}

function exporterGroupesPDF() { imprimerGroupes(); }

// --- NOUVEAU format de mail (Groupe X + "Nom Prénom" lignes) ---
function envoyerGroupesParMail() {
  var table = document.querySelector("table.zenos-unique");
  if (!table) return;

  var rows = table.querySelectorAll("tbody tr");
  var corps = "Bonjour, voici les groupes générés par ScanProf pour lancer le défi ZENOS Tour. Bonne course !%0A%0A";

  var courant = "";      // "Groupe X"
  var lignesGrp = [];    // lignes "Nom Prénom"

  for (var i = 0; i < rows.length; i++) {
    var tr = rows[i];
    if (tr.className === "separator-row") {
      if (courant && lignesGrp.length) {
        corps += encodeURIComponent(courant) + "%0A";
        corps += encodeURIComponent(lignesGrp.join("%0A")) + "%0A%0A";
      }
      courant = ""; lignesGrp = [];
      continue;
    }

    var tds = tr.querySelectorAll("td");
    if (tds.length === 7) {
      if (courant && lignesGrp.length) {
        corps += encodeURIComponent(courant) + "%0A";
        corps += encodeURIComponent(lignesGrp.join("%0A")) + "%0A%0A";
        lignesGrp = [];
      }
      courant = (tds[0].textContent || "Groupe").trim();
      var nom = (tds[1].textContent || "").trim();
      var prenom = (tds[2].textContent || "").trim();
      lignesGrp.push(nom + " " + prenom);
    } else if (tds.length === 6) {
      var n = (tds[0].textContent || "").trim();
      var p = (tds[1].textContent || "").trim();
      lignesGrp.push(n + " " + p);
    }
  }
  if (courant && lignesGrp.length) {
    corps += encodeURIComponent(courant) + "%0A";
    corps += encodeURIComponent(lignesGrp.join("%0A")) + "%0A%0A";
  }

  var mailto = "mailto:?subject=" + encodeURIComponent("Groupes ZENOS") + "&body=" + corps;
  window.location.href = mailto;
}
