const html5QrCode = new Html5Qrcode("reader");

const config = { fps: 10, qrbox: 250 };

html5QrCode.start(
  { facingMode: "environment" },
  config,
  (decodedText, decodedResult) => {
    try {
      const eleve = JSON.parse(decodedText);
      const liste = JSON.parse(localStorage.getItem("eleves") || "[]");

      // Vérifie s’il existe déjà (même nom + prénom)
      const existe = liste.some(e => e.nom === eleve.nom && e.prenom === eleve.prenom);
      if (!existe) {
        liste.push(eleve);
        liste.sort((a, b) => a.nom.localeCompare(b.nom));
        localStorage.setItem("eleves", JSON.stringify(liste));
        document.getElementById("status").innerText = `✅ ${eleve.prenom} ${eleve.nom} ajouté`;
      } else {
        document.getElementById("status").innerText = `⚠️ ${eleve.prenom} ${eleve.nom} déjà scanné`;
      }
    } catch (e) {
      document.getElementById("status").innerText = "QR code invalide";
    }
  },
  (errorMessage) => {
    // Erreurs ignorées en continu
  }
).catch(err => {
  document.getElementById("status").innerText = "Erreur d’accès à la caméra";
});
