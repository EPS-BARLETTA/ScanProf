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

      // 🔁 Conversion des clés minuscules → format attendu
      const formatKeys = (entry) => ({
        Nom: entry.nom || entry.Nom || "",
        Prénom: entry.prenom || entry.Prénom || "",
        Classe: entry.classe || entry.Classe || "",
        Sexe: entry.sexe || entry.Sexe || "",
        Distance: entry.distance || entry.Distance || "",
        Vitesse: entry.vitesse || entry.Vitesse || "",
        VMA: entry.vma || entry.VMA || ""
      });

      const merged = [...existingEntries];

      newEntries.forEach(raw => {
        const entry = formatKeys(raw);
        const isDuplicate = existingEntries.some(e =>
          e.Nom === entry.Nom &&
          e.Prénom === entry.Prénom &&
          e.Classe === entry.Classe
        );
        if (!isDuplicate) {
          merged.push(entry);
        }
      });

      localStorage.setItem("eleves", JSON.stringify(merged));

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
