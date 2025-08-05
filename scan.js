const html5QrCode = new Html5Qrcode("reader");

function onScanSuccess(decodedText) {
  try {
    const eleve = JSON.parse(decodedText);
    const eleves = JSON.parse(localStorage.getItem("eleves")) || [];
    const existe = eleves.some(e => e.Nom === eleve.Nom && e.Prénom === eleve.Prénom);

    if (!existe) {
      eleves.push(eleve);
      localStorage.setItem("eleves", JSON.stringify(eleves));
      alert(`✅ Élève ajouté : ${eleve.Prénom} ${eleve.Nom}`);
    } else {
      alert(`⚠️ Élève déjà scanné : ${eleve.Prénom} ${eleve.Nom}`);
    }

    html5QrCode.stop().then(() => {
      window.location.href = "tri.html";
    });

  } catch (err) {
    alert("❌ QR code invalide.");
  }
}

Html5Qrcode.getCameras().then(devices => {
  const backCam = devices.find(d => d.label.toLowerCase().includes("back")) || devices[0];
  if (!backCam) {
    alert("Aucune caméra disponible.");
    return;
  }

  html5QrCode.start(
    { deviceId: { exact: backCam.id } },
    { fps: 10, qrbox: 250 },
    onScanSuccess
  ).catch(err => {
    alert("Erreur lors de l'ouverture de la caméra : " + err);
  });
});
