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
      resultDisplay.innerText = "QR Code enregistré ✅";

      try {
        const data = JSON.parse(decodedText);
        const existing = JSON.parse(localStorage.getItem("eleves")) || [];
        const newData = Array.isArray(data) ? data : [data];

        // Ajouter sans doublons
        newData.forEach(entry => {
          if (!existing.some(e => e.nom === entry.nom && e.prenom === entry.prenom && e.classe === entry.classe)) {
            existing.push(entry);
          }
        });

        localStorage.setItem("eleves", JSON.stringify(existing));
      } catch (e) {
        alert("QR Code invalide ou format non pris en charge.");
      }

      // Redirige vers les participants
      setTimeout(() => {
        window.location.href = "participants.html";
      }, 1000);
    },
    (errorMessage) => {
      // Silencieux : ignore les erreurs de scan
    }
  ).catch(err => {
    qrRegion.innerHTML = "<p>❌ Impossible d'accéder à la caméra.</p>";
  });
}

window.onload = startScanner;
