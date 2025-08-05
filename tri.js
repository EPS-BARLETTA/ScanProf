let participants = JSON.parse(localStorage.getItem("participants")) || [];

// Variables globales
let currentSortKey = "";
let filteredParticipants = [...participants];

// Dynamique : extraire les colonnes depuis le premier objet
function getColonnesDisponibles() {
  if (participants.length === 0) return [];
  return Object.keys(participants[0]);
}

// Remplir le menu déroulant de tri
function remplirMenuTri() {
  const triSelect = document.getElementById("triSelect");
  const colonnes = getColonnesDisponibles();
  colonnes.forEach(col => {
    const option = document.createElement("option");
    option.value = col;
    option.textContent = col.charAt(0).toUpperCase() + col.slice(1);
    triSelect.appendChild(option);
  });
}

// Appliquer un tri selon la clé sélectionnée
function trierDonnees() {
  const select = document.getElementById("triSelect");
  const cle = select.value;
  if (!cle) return;
  currentSortKey = cle;

  filteredParticipants.sort((a, b) => {
    const valA = a[cle]?.toString().toLowerCase() || "";
    const valB = b[cle]?.toString().toLowerCase() || "";
    return valA.localeCompare(valB, "fr");
  });

  afficherTableau(filteredParticipants);
}

// Rechercher dynamiquement
function filtrerTableau() {
  const searchValue = document.getElementById("searchInput").value.toLowerCase();

  filteredParticipants = participants.filter(participant =>
    Object.values(participant).some(val =>
      val?.toString().toLowerCase().includes(searchValue)
    )
  );

  // Re-trier si une clé est active
  if (currentSortKey) {
    trierDonnees();
  } else {
    afficherTableau(filteredParticipants);
  }
}

// Afficher le tableau avec données dynamiques
function afficherTableau(donnees) {
  const thead = document.getElementById("elevesTableHead");
  const tbody = document.getElementById("elevesTableBody");

  tbody.innerHTML = "";
  thead.innerHTML = "";

  if (donnees.length === 0) return;

  // Génère l’en-tête depuis les clés
  const keys = Object.keys(donnees[0]);
  const row = document.createElement("tr");
  keys.forEach(key => {
    const th = document.createElement("th");
    th.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    row.appendChild(th);
  });
  thead.appendChild(row);

  // Lignes de données
  donnees.forEach(el => {
    const tr = document.createElement("tr");
    keys.forEach(key => {
      const td = document.createElement("td");
      td.textContent = el[key];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// Export CSV
function exportCSV() {
  if (filteredParticipants.length === 0) return;

  const colonnes = Object.keys(filteredParticipants[0]);
  const lignes = filteredParticipants.map(p =>
    colonnes.map(col => `"${p[col] ?? ""}"`).join(",")
  );
  const csvContent = [colonnes.join(","), ...lignes].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "participants.csv";
  a.click();

  URL.revokeObjectURL(url);
}

// Navigation
function goHome() {
  window.location.href = "index.html";
}

function goZenos() {
  window.location.href = "groupe-zenos.html";
}

// Initialisation
window.addEventListener("DOMContentLoaded", () => {
  remplirMenuTri();
  afficherTableau(participants);
});
