document.addEventListener("DOMContentLoaded", function () {
    const tableContainer = document.getElementById("groupes-container");
    const participants = JSON.parse(localStorage.getItem("participants")) || [];

    if (!participants.length) {
        tableContainer.innerHTML = "<p>Aucun participant enregistré.</p>";
        return;
    }

    // Vérification des données nécessaires
    if (!participants.every(p => p.vma && p.classe)) {
        tableContainer.innerHTML = "<p style='color:red;'>❌ Données incomplètes (VMA ou classe manquantes)</p>";
        return;
    }

    // Tri par VMA décroissante
    participants.sort((a, b) => b.vma - a.vma);

    // Séparation par sexe
    const hommes = participants.filter(p => p.sexe && p.sexe.toUpperCase() === "G");
    const femmes = participants.filter(p => p.sexe && p.sexe.toUpperCase() === "F");

    const groupes = [];
    const nonAttribues = [];

    // Création des groupes de 4 équilibrés
    while (hommes.length + femmes.length >= 4) {
        let groupe = [];

        // 1 VMA haute
        groupe.push(hommes.length ? hommes.shift() : femmes.shift());

        // 1 VMA basse
        groupe.push(femmes.length ? femmes.pop() : hommes.pop());

        // 2 moyens (en prenant 1H + 1F si possible)
        for (let i = 0; i < 2; i++) {
            if (hommes.length && femmes.length) {
                groupe.push(i % 2 === 0 ? hommes.shift() : femmes.shift());
            } else if (hommes.length) {
                groupe.push(hommes.shift());
            } else if (femmes.length) {
                groupe.push(femmes.shift());
            }
        }

        groupes.push(groupe);
    }

    // Élèves restants
    nonAttribues.push(...hommes, ...femmes);

    // Fonction pour créer un tableau HTML pour un groupe
    function creerTableau(titre, eleves) {
        let html = `<h3>${titre}</h3>`;
        html += `<table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse;width:100%;text-align:center;">
                    <thead style="background:#f2f2f2;">
                        <tr>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Classe</th>
                            <th>Sexe</th>
                            <th>VMA</th>
                        </tr>
                    </thead>
                    <tbody>`;
        eleves.forEach((e, index) => {
            html += `<tr style="background:${index % 2 === 0 ? "#fff" : "#f9f9f9"};">
                        <td>${e.nom || e.Nom}</td>
                        <td>${e.prenom || e.Prénom}</td>
                        <td>${e.classe || e.Classe}</td>
                        <td>${e.sexe || e.Sexe}</td>
                        <td>${e.vma || e.VMA}</td>
                    </tr>`;
        });
        html += `</tbody></table>`;
        return html;
    }

    // Affichage des groupes
    let contenuHTML = "";
    groupes.forEach((groupe, index) => {
        contenuHTML += creerTableau(`Groupe ${index + 1}`, groupe);
    });

    // Affichage des non-attribués
    if (nonAttribues.length) {
        contenuHTML += `<h3>Élèves non attribués</h3>`;
        contenuHTML += creerTableau("Non attribués", nonAttribues);
    }

    tableContainer.innerHTML = contenuHTML;
});
