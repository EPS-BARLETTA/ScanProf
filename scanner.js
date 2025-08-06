function startScanner() {
  const qrRegion = document.getElementById("reader");
  if (!qrRegion) return;

  const html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      html5QrCode.stop();
      qrRegion.innerHTML = "";

      let data;
      try {
        data = JSON.parse(decodedText);
      } catch (e) {
        alert("QR Code invalide.");
        return;
      }

      const newEntries = Array.isArray(data) ? data : [data];
      const existingEntries = JSON.parse(localStorage.getItem("eleves")) || [];

      const merged = [...existingEntries];

      newEntries.forEach(newEntry => {
        const isDuplicate = existingEntries.some(e =>
          e.Nom === newEntry.Nom &&
          e.Prénom === newEntry.Prénom &&
          e.Classe === newEntry.Classe
        );
        if (!isDuplicate) {
          merged.push(newEntry);
        }
      });

      localStorage.setItem("eleves", JSON.stringify(merged));

      // Redirige après 2 secondes avec message
      const resultDisplay = document.getElementById("scan-result");
      if (resultDisplay) {
        resultDisplay.innerText = "QR Code enregistré ✅";
        setTimeout(() => {
          window.location.href = "participants.html";
        }, 2000);
      } else {
        window.location.href = "participants.html";
      }
    },
    (errorMessage) => {}
  ).catch(err => {
    qrRegion.innerHTML = "<p>❌ Impossible d'accéder à la caméra.</p>";
  });
}
