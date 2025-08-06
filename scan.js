function startScanner() {
  const qrRegion = document.getElementById("reader");
  const resultDisplay = document.getElementById("scan-result");
  if (!qrRegion) return;

  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      html5QrCode.stop();
      qrRegion.innerHTML = "";
      resultDisplay.innerText = "";

      try {
        const data = JSON.parse(decodedText);
        const existing = JSON.parse(localStorage.getItem("eleves")) || [];
        const newEntries = Array.isArray(data) ? data : [data];

        // Ajouter chaque élève s’il n’est pas déjà présent
        newEntries.forEach(entry => {
          const isDuplicate = existing.some(e =>
            e.Nom === entry.Nom &&
            e.Prénom === entry.Prénom &&
            e.Classe === entry.Classe
          );
          if (!isDuplicate) {
            existing.push(entry);
          }
        });

        // Sauvegarde finale
        localStorage.setItem("eleves", JSON.stringify(existing));

        // Redirection
        window.location.href = "participants.html";

      } catch (e) {
        alert("QR Code invalide ou format non pris en charge.");
      }
    },
    (errorMessage) => {
      // Pas de message à chaque échec, on ignore
    }
  ).catch(err => {
    qrRegion.innerHTML = "<p>❌ Impossible d'accéder à la caméra.</p>";
  });
}
