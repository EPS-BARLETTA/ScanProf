
function startScanner() {
  const qrRegion = document.getElementById("reader");
  if (!qrRegion) return;

  const html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
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

          // Redirection vers participants après 2 secondes
          setTimeout(() => {
            window.location.href = "participants.html";
          }, 2000);

        } catch (e) {
          alert("⚠️ QR Code invalide ou mal formé.");
        }
      });
    },
    (_) => {}
  ).catch(err => {
    qrRegion.innerHTML = "<p>❌ Impossible d'accéder à la caméra.</p>";
  });
}
