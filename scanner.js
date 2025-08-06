function startScanner() {
  const qrRegion = document.getElementById("reader");
  if (!qrRegion) return;

  const html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      console.log("QR scanné :", decodedText);

      // Stop et nettoyage de l'interface
      html5QrCode.stop().then(() => {
        html5QrCode.clear();
        qrRegion.innerHTML = "";

        try {
          const data = JSON.parse(decodedText);
          const existing = JSON.parse(localStorage.getItem("eleves")) || [];
          const newData = Array.isArray(data) ? data : [data];

          const updated = [...existing];
          newData.forEach(entry => {
            if (!updated.some(e =>
              e.Nom === entry.Nom &&
              e.Prénom === entry.Prénom &&
              e.Classe === entry.Classe
            )) {
              updated.push(entry);
            }
          });

          localStorage.setItem("eleves", JSON.stringify(updated));
          alert("✅ QR Code enregistré !");
        } catch (e) {
          alert("⚠️ QR Code invalide ou mal formé.");
        }
      });
    },
    (errorMessage) => {
      // Ne rien afficher sur erreur de scan silencieuse
    }
  ).catch(err => {
    qrRegion.innerHTML = "<p>❌ Impossible d'accéder à la caméra.</p>";
    console.error("Erreur démarrage scanner :", err);
  });
}
