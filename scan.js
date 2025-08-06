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
        const newData = Array.isArray(data) ? data : [data];
        const updated = [...existing, ...newData];
        localStorage.setItem("eleves", JSON.stringify(updated));
      } catch (e) {
        alert("QR Code invalide ou format non pris en charge.");
      }

      window.location.href = "participants.html";
    },
    (errorMessage) => {}
  ).catch(err => {
    qrRegion.innerHTML = "<p>❌ Impossible d'accéder à la caméra.</p>";
  });
}
