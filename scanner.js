function startScanner() {
  const qrRegion = document.getElementById("reader");
  const resultDisplay = document.getElementById("scan-result");
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

        const updated = [...existing];

        newData.forEach(entry => {
          if (!isDuplicate(existing, entry)) {
            updated.push(entry);
          }
        });

        localStorage.setItem("eleves", JSON.stringify(updated));
        resultDisplay.innerText = "✅ QR Code enregistré. Vous pouvez scanner un autre.";

      } catch (e) {
        resultDisplay.innerText = "❌ QR Code invalide ou format non pris en charge.";
      }

      // Redémarrer le scan automatiquement après 1.5 secondes
      setTimeout(() => {
        resultDisplay.innerText = "";
        html5QrCode.stop().then(() => {
          startScanner(); // relancer le scan
        });
      }, 1500);
    },
    (errorMessage) => {
      // Pas d'affichage d'erreur à chaque scan échoué
    }
  ).catch(err => {
    qrRegion.innerHTML = "<p>❌ Impossible d'accéder à la caméra.</p>";
  });
}

function isDuplicate(dataArray, entry) {
  return dataArray.some(e =>
    e.nom === entry.nom &&
    e.prenom === entry.prenom &&
    e.classe === entry.classe
  );
}

window.onload = startScanner;
