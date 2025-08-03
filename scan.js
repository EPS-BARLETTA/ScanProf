const html5QrCode = new Html5Qrcode("reader");
const config = { fps: 10, qrbox: 250 };

html5QrCode.start(
  { facingMode: "environment" },
  config,
  (decodedText, decodedResult) => {
    let eleves = [];

    try {
      const data = JSON.parse(decodedText);

      if (Array.isArray(data)) {
        // JSON = tableau d'élèves (ex : RunStats)
        eleves = data;
      } else if (typeof data === "object") {
        // JSON = un seul élève
        eleves = [data];
      }
    } catch (e) {
      document.getElementById("status").innerText = "QR code invalide ou non JSON.";
      return;
    }

    const liste = JSON.parse(localStorage.getItem("eleves") || "[]");
    let ajoutCount = 0;

    eleves.forEach(eleve => {
      if (
        eleve.nom && eleve.prenom && eleve.classe &&
        typeof eleve.vma !== "undefined" && !isNaN(parseFloat(eleve.vma))
      ) {
        const existe = liste.some(e =>
          e.nom === eleve.nom &&
          e.prenom === eleve.prenom &&
          e.classe === eleve.classe
        );

        if (!existe) {
          liste.push(eleve);
          ajoutCount++;
        }
      }
    });

    if (ajoutCount > 0) {
      liste.sort((a, b) => a.nom.localeCompare(b.nom));
      localStorage.setItem("eleves", JSON.stringify(liste));
      document.getElementById("status").innerText = `✅ ${ajoutCount} élève(s) ajouté(s)`;
    } else {
      document.getElementById("status").innerText = `⚠️ Aucun nouvel élève ajouté`;
    }
  },
  (errorMessage) => {
    // Ignorer les erreurs de lecture
  }
).catch(err => {
  document.getElementById("status").innerText = "Erreur d’accès à la caméra";
});
