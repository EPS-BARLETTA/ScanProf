function startScanner() {
  const qrRegion = document.getElementById("reader");
  const resultDisplay = document.getElementById("scan-result");
  if (!qrRegion) return;

  const scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      try {
        const data = JSON.parse(decodedText);
        const existing = JSON.parse(localStorage.getItem("eleves")) || [];
        const incoming = Array.isArray(data) ? data : [data];

        // push sans doublons (nom+prenom+classe)
        incoming.forEach(entry => {
          if (!existing.some(e => e.nom === entry.nom && e.prenom === entry.prenom && e.classe === entry.classe)) {
            existing.push(entry);
          }
        });

        localStorage.setItem("eleves", JSON.stringify(existing));
        if (resultDisplay) {
          resultDisplay.innerText = "✅ QR Code enregistré. Vous pouvez scanner un autre.";
          setTimeout(() => (resultDisplay.innerText = ""), 1200);
        }
      } catch {
        if (resultDisplay) {
          resultDisplay.innerText = "❌ QR Code invalide ou format non pris en charge.";
          setTimeout(() => (resultDisplay.innerText = ""), 1200);
        }
      }
    },
    () => { /* onIgnoreScan */ }
  ).catch(() => {
    qrRegion.innerHTML = "<p>❌ Impossible d'accéder à la caméra.</p>";
  });
}

window.onload = startScanner;
