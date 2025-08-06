function startScanner() {
  const qrRegion = document.getElementById("reader");
  if (!qrRegion) return;

  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      try {
        const data = JSON.parse(decodedText);
        const existing = JSON.parse(localStorage.getItem("eleves")) || [];
        const newData = Array.isArray(data) ? data : [data];

        const merged = [...existing];
        newData.forEach(entry => {
          if (!merged.some(e =>
            e.Nom === entry.Nom &&
            e.Prénom === entry.Prénom &&
            e.Classe === entry.Classe
          )) {
            merged.push(entry);
          }
        });

        localStorage.setItem("eleves", JSON.stringify(merged));
        alert("QR Code enregistré !");
      } catch (e) {
        alert("QR Code invalide ou format non pris en charge.");
      }
    },
    (errorMessage) => {}
  ).catch(err => {
    qrRegion.innerHTML = "<p>❌ Impossible d'accéder à la caméra.</p>";
  });
}
