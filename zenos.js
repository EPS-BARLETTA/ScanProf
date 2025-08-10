// zenos.js — Groupes ZENOS : 1H + 2M + 1B, mixité stricte si possible, sinon suggestions
document.addEventListener("DOMContentLoaded", function () {
  const all = safeParse(localStorage.getItem("eleves")) || [];

  // Normalise les classes une fois
  for (const e of all) {
    if (e) e.classe = canonClasse(e.classe || e.Classe || "");
  }

  // Remplit le select des classes
  const select = document.getElementById("classe-select");
  if (select) {
    const optTous = document.createElement("option");
    optTous.value = "__TOUS__";
    optTous.textContent = "Tous (classe ignorée)";
    select.appendChild(optTous);

    const classes = uniqueClasses(all).sort();
    for (const c of classes) {
      const op = document.createElement("option");
      op.value = c; op.textContent = c;
      select.appendChild(op);
    }
  }

  // Bouton générer
  const btn = document.getElementById("btn-generer-zenos");
  if (btn) btn.addEventListener("click", genererGroupesZenos);

  // Si 1 seule classe, on pré-sélectionne + on génère
  const titre = document.getElementById("titre-classe");
  if (select && uniqueClasses(all).length === 1) {
    select.value = uniqueClasses(all)[0];
    if (titre) titre.textContent = "Classe " + select.value;
    genererGroupesZenos();
  } else if (titre) {
    titre.textContent = "Tous (classe ignorée)";
  }
});

// ===== Helpers =====
function safeParse(t){ try{ return JSON.parse(t||"[]"); } catch(e){ return []; } }

// "5ème A", "5emeA", "5 a", "5a" → "5A"
function canonClasse(raw){
  if(!raw) return "";
  let s = String(raw).toUpperCase();
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");  // accents
  s = s.replace(/EME|ÈME/g,"");                           // EME
  s = s.replace(/[^A-Z0-9]/g,"");                         // suppr espaces/points
  // On garde “niveau+lettre” si possible (ex: 5A, 4B…), sinon s brut
  const m = s.match(/^(\d{1,2})([A-Z])$/);
  return m ? (m[1]+m[2]) : s;
}

function uniqueClasses(arr){
  const set = new Set();
  for(const e of arr){ if(e && e.classe) set.add(e.classe); }
  return Array.from(set);
}

function esc(s){ return String(s==null?"":s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function appendCell(tr, val){ const td=document.createElement("td"); td.textContent=val==null?"":String(val); tr.appendChild(td); }

function normSexe(s){
  const x = String(s||"").trim().toUpperCase();
  if (x.startsWith("F")) return "F";
  if (x.startsWith("G") || x.startsWith("M")) return "G"; // selon saisies
  return "X"; // inconnu
}

// Quartiles sur VMA (ascendant)
function quartileBuckets(listAsc){
  const n = listAsc.length;
  const q1 = Math.floor(n*0.25), q2 = Math.floor(n*0.5), q3 = Math.floor(n*0.75);
  const B = listAsc.slice(0, q1);
  const Mminus = listAsc.slice(q1, q2);
  const Mplus  = listAsc.slice(q2, q3);
  const H = listAsc.slice(q3);
  return {H, Mplus, Mminus, B};
}

// Prend un élément d’un “rôle” (bucket). sens = "high" (pop) ou "low" (shift)
function take(bucket, sens="low"){
  if (!bucket.length) return null;
  return sens==="high" ? bucket.pop() : bucket.shift();
}

// ===== Coeur : génération des groupes =====
function genererGroupesZenos(){
  const all = safeParse(localStorage.getItem("eleves")) || [];
  // normalise encore au cas où
  for(const e of all){ if(e) e.classe = canonClasse(e.classe || e.Classe || ""); }

  const select = document.getElementById("classe-select");
  const choix = select && select.value ? select.value : "__TOUS__";

  // Filtre candidats
  let cand = [];
  for(const e of all){
    const v = Number(e && e.vma);
    if (!isFinite(v)) continue;
    if (choix !== "__TOUS__" && canonClasse(e.classe) !== choix) continue;
    cand.push({
      nom: e.nom || e.Nom || "",
      prenom: e.prenom || e.Prénom || e.Prenom || "",
      classe: e.classe || "",
      sexe: normSexe(e.sexe || e.Sexe || ""),
      distance: e.distance || e.Distance || "",
      vma: v
    });
  }

  const titre = document.getElementById("titre-classe");
  if (titre) titre.textContent = (choix==="__TOUS__") ? "Tous (classe ignorée)" : ("Classe " + choix);

  if (cand.length < 4){ alert("Pas assez d'élèves valides (VMA) pour former des groupes."); return; }

  // Tri ascendant pour calculer les quartiles
  cand.sort((a,b)=> a.vma - b.vma);
  const {H, Mplus, Mminus, B} = quartileBuckets(cand);   // asc → B..H

  // Nombre de groupes complets
  const G = Math.floor(cand.length / 4);
  const groupes = [];
  // Copie des buckets (on va dépiler)
  const h = H.slice(), mp = Mplus.slice(), mm = Mminus.slice(), b = B.slice();

  // Construction “idéal” : [H, Mplus, Mminus, B]
  for (let g=0; g<G; g++){
    let gH = take(h, "high") || take(mp,"high") || take(mm,"high") || take(b,"high");
    let gM1 = take(mp,"high") || take(mm,"high") || take(h,"high") || take(b,"high");
    let gM2 = take(mm,"low")  || take(mp,"low")  || take(h,"low")  || take(b,"low");
    let gB = take(b,"low")    || take(mm,"low")  || take(mp,"low") || take(h,"low");

    const pack = [gH, gM1, gM2, gB].filter(Boolean);
    // Tag “rôle” pour équilibrage ultérieur (utile pour swaps propres)
    if (pack[0]) pack[0].role = "H";
    if (pack[1]) pack[1].role = "M+";
    if (pack[2]) pack[2].role = "M-";
    if (pack[3]) pack[3].role = "B";

    if (pack.length===4) groupes.push(pack);
    else break;
  }

  // Restants (jamais de groupes incomplets)
  const restants = [...h, ...mp, ...mm, ...b];

  // Équilibrage mixité (au moins 1F + 1G si c’est mathématiquement possible)
  const suggestions = balanceMixite(groupes);

  renderTableauGroupes(groupes, restants, suggestions);
}

// Essaie d’assurer au moins 1F + 1G par groupe via des swaps “même rôle”
function balanceMixite(groupes){
  const sug = []; // suggestions textuelles si on n’y arrive pas

  function countFG(g){
    let F=0,G=0;
    for (const e of g){ if (e.sexe==="F") F++; else if (e.sexe==="G") G++; }
    return {F,G};
  }

  // Indexe candidats par rôle et sexe
  function indexByRole(groups){
    const idx = {H:{F:[],G:[]}, "M+":{F:[],G:[]}, "M-":{F:[],G:[]}, B:{F:[],G:[]}};
    groups.forEach((g,gi)=>{
      g.forEach((e,ei)=>{
        const r = e.role || "M+";
        if (e.sexe==="F"||e.sexe==="G") idx[r][e.sexe].push({gi, ei});
      });
    });
    return idx;
  }

  // premier passage : corriger les groupes “sans F” ou “sans G”
  let changed = true; let passes = 0;
  while (changed && passes<4){
    changed = false; passes++;
    const idx = indexByRole(groupes);

    for (let gi=0; gi<groupes.length; gi++){
      const g = groupes[gi], c = countFG(g);
      if (c.F===0 || c.G===0){
        // cherche un swap rôle à rôle
        let done = false;
        for (const eIdx in g){
          const e = g[eIdx];
          const need = (c.F===0) ? "F" : "G";
          const have = (c.F===0) ? "G" : "F";
          if (e.sexe !== have) continue; // on ne remplace que le sexe “en trop”
          const role = e.role || "M+";
          const pool = idx[role][need]; // donneur dans même rôle
          const donor = pool.find(p => p.gi!==gi);
          if (donor){
            const d = groupes[donor.gi][donor.ei];
            // swap
            groupes[gi][eIdx] = d;
            groupes[donor.gi][donor.ei] = e;
            changed = true; done = true;
            break;
          }
        }
        if (!changed){
          // échec : on proposera une suggestion
          const want = (c.F===0) ? "F" : "G";
          sug.push(`Groupe ${gi+1} : ajouter 1 ${want} (échange avec un autre groupe dans le même quartile si possible).`);
        }
      }
    }
  }

  // Optionnel : tendre vers 2/2 (on laisse simple, l’exigence est “mixte”)
  return sug;
}

// ===== Rendu =====
function renderTableauGroupes(groupes, nonAttribues, suggestions){
  const groupesDiv = document.getElementById("groupes");
  const restantsDiv = document.getElementById("restants");
  if (groupesDiv) groupesDiv.innerHTML = "";
  if (restantsDiv) restantsDiv.innerHTML = "";
  if (!groupesDiv) return;

  const table = document.createElement("table");
  table.className = "zenos-unique";
  table.innerHTML =
    '<thead>' +
      '<tr><th>Groupe</th><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th><th>Distance</th></tr>' +
    '</thead><tbody></tbody>';
  groupesDiv.appendChild(table);

  const tbody = table.querySelector("tbody");
  for (let g=0; g<groupes.length; g++){
    const pack = groupes[g];
    for (let i=0; i<pack.length; i++){
      const e = pack[i];
      const tr = document.createElement("tr");
      if (i===0){
        const tdG = document.createElement("td");
        tdG.setAttribute("rowspan","4");
        tdG.style.fontWeight = "700";
        tdG.textContent = "Groupe " + (g+1);
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
    const sep = document.createElement("tr");
    sep.className = "separator-row";
    const sepTd = document.createElement("td");
    sepTd.setAttribute("colspan","7");
    sep.appendChild(sepTd);
    tbody.appendChild(sep);
  }

  // Restants
  if (nonAttribues && nonAttribues.length && restantsDiv){
    const h = document.createElement("div");
    h.className = "unassigned-title";
    h.textContent = "Élèves à attribuer manuellement car groupes complets :";
    restantsDiv.appendChild(h);

    const tabR = document.createElement("table");
    tabR.className = "unassigned";
    tabR.innerHTML =
      '<thead><tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>VMA</th><th>Distance</th></tr></thead>' +
      '<tbody>' +
      nonAttribues.map(e => (
        '<tr>' +
          '<td>'+esc(e.nom)+'</td>' +
          '<td>'+esc(e.prenom)+'</td>' +
          '<td>'+esc(e.classe)+'</td>' +
          '<td>'+esc(e.sexe)+'</td>' +
          '<td>'+esc(e.vma)+'</td>' +
          '<td>'+esc(e.distance)+'</td>' +
        '</tr>'
      )).join("") +
      '</tbody>';
    restantsDiv.appendChild(tabR);
  }

  // Suggestions mixité (si besoin)
  if (suggestions && suggestions.length && restantsDiv){
    const box = document.createElement("div");
    box.style.marginTop = "8px";
    box.style.color = "#b35b00";
    box.style.fontWeight = "600";
    box.textContent = "Mixité partielle : suggestions d’échanges";
    restantsDiv.appendChild(box);

    const ul = document.createElement("ul");
    ul.style.marginTop = "4px";
    for (const s of suggestions){
      const li = document.createElement("li");
      li.textContent = s;
      ul.appendChild(li);
    }
    restantsDiv.appendChild(ul);
  }
}

// ===== Exports (inchangés côté UI) =====
function exporterGroupesCSV(){
  const table = document.querySelector("table.zenos-unique");
  if (!table) return;
  const rows = table.querySelectorAll("tbody tr");
  const csv = [];
  csv.push(["Groupe","Nom","Prénom","Classe","Sexe","VMA","Distance"].join(","));
  let currentGroup = 0;
  let countInGroup = 0;
  for (const tr of rows){
    const tds = tr.querySelectorAll("td");
    if (!tds.length) continue;
    if (tds.length === 7) { // avec cellule "Groupe"
      currentGroup++; countInGroup = 0;
      const nom = tds[1].textContent.trim();
      const pre = tds[2].textContent.trim();
      const cla = tds[3].textContent.trim();
      const sex = tds[4].textContent.trim();
      const vma = tds[5].textContent.trim();
      const dis = tds[6].textContent.trim();
      csv.push([`Groupe ${currentGroup}`,nom,pre,cla,sex,vma,dis].map(qq=> {
        let t=qq; if (/,/.test(t)) t='"'+t.replace(/"/g,'""')+'"'; return t;
      }).join(","));
    } else {
      countInGroup++;
      const nom = tds[0].textContent.trim();
      const pre = tds[1].textContent.trim();
      const cla = tds[2].textContent.trim();
      const sex = tds[3].textContent.trim();
      const vma = tds[4].textContent.trim();
      const dis = tds[5].textContent.trim();
      csv.push([`Groupe ${currentGroup}`,nom,pre,cla,sex,vma,dis].map(qq=>{
        let t=qq; if (/,/.test(t)) t='"'+t.replace(/"/g,'""')+'"'; return t;
      }).join(","));
    }
  }
  const blob = new Blob(["\uFEFF"+csv.join("\n")], {type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "groupes_zenos.csv";
  a.click();
}

function imprimerGroupes(){
  const zone = document.getElementById("groupes-panel");
  if (!zone) return;
  const win = window.open("", "_blank");
  win.document.write(
    '<html><head><meta charset="UTF-8"><title>Impression - Groupes ZENOS</title>' +
    '<style>table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f2f2f2}tr.separator-row td{border:none;height:10px} .unassigned-title{margin:12px 0 6px;font-weight:700;color:#cc5200} .unassigned thead th{background:#ffe9cc}.unassigned tbody td{background:#fff4e6}</style>' +
    '</head><body>' +
    '<h1 style="text-align:center;">ZENOS TOUR</h1>' +
    zone.innerHTML +
    '<div style="margin-top:24px;text-align:center;">ScanProf - Équipe EPS Lycée Vauban - LUXEMBOURG - JB</div>' +
    '</body></html>'
  );
  win.document.close();
  try { win.focus(); win.print(); } catch(e){}
}

function exporterGroupesPDF(){ imprimerGroupes(); }

// Mail : sujet + groupes propres (sans %0A en double)
function envoyerGroupesParMail(){
  const table = document.querySelector("table.zenos-unique");
  if (!table) return;
  const classeTitre = (document.getElementById("titre-classe")?.textContent || "").trim();
  const subject = "Groupes ZENOS TOUR" + (classeTitre ? " – " + classeTitre : "");

  const rows = table.querySelectorAll("tbody tr");
  const lignes = [];
  lignes.push("Bonjour,");
  lignes.push("");
  if (classeTitre) lignes.push(classeTitre);
  lignes.push("Groupes ZENOS :");
  lignes.push("");

  let currentGroup = 0;
  for (const tr of rows){
    const tds = tr.querySelectorAll("td");
    if (!tds.length) continue;
    if (tds.length === 7){ currentGroup++; lignes.push("Groupe " + currentGroup + " :"); }
    const start = (tds.length === 7) ? 1 : 0;
    const nom = tds[start+0].textContent.trim();
    const pre = tds[start+1].textContent.trim();
    if (nom || pre) lignes.push(" - " + nom + " " + pre);
    if (tds.length === 7) lignes.push(""); // ligne blanche après 4 élèves
  }

  lignes.push("");
  lignes.push("Cordialement,");
  lignes.push("L’équipe ScanProf");

  const bodyText = lignes.join("\n");
  const mailto = "mailto:?subject=" + encodeURIComponent(subject) +
                 "&body=" + encodeURIComponent(bodyText);
  window.location.href = mailto;
}
