// Initialisation du scanner
const video = document.createElement("video");
const canvasElement = document.createElement("canvas");
const canvas = canvasElement.getContext("2d");
let scanning = false;

navigator.mediaDevices
  .getUserMedia({ video: { facingMode: "environment" } })
  .then(function(stream) {
    scanning = true;
    document.getElementById("scanner-container").appendChild(video);
    video.setAttribute("playsinline", true);
    video.srcObject = stream;
    video.play();
    requestAnimationFrame(tick);
  });

function tick() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

    if (code) {
      handleScan(code.data);
    }
  }

  if (scanning) {
    requestAnimationFrame(tick);
  }
}

function handleScan(data) {
  scanning = false;

  // Arrête la caméra
  video.srcObject.getTracks().forEach(track => track.stop());

  let scannedData;
  try {
    scannedData = JSON.parse(data);
  } catch (e) {
    alert("QR code invalide !");
    return;
  }

  // Récupérer les données déjà présentes
  const existingData = JSON.parse(localStorage.getItem("participants") || "[]");

  // Fusionner les nouvelles données (éviter les doublons)
  const mergedData = [...existingData];

  if (Array.isArray(scannedData)) {
    scannedData.forEach(newEntry => {
      if (!isDuplicate(existingData, newEntry)) {
        mergedData.push(newEntry);
      }
    });
  } else {
    if (!isDuplicate(existingData, scannedData)) {
      mergedData.push(scannedData);
    }
  }

  // Sauvegarder dans localStorage
  localStorage.setItem("participants", JSON.stringify(mergedData));

  // Rediriger vers la page des participants
  window.location.href = "participants.html";
}

function isDuplicate(dataArray, entry) {
  return dataArray.some(e =>
    e.Nom === entry.Nom &&
    e.Prénom === entry.Prénom &&
    e.Classe === entry.Classe
  );
}
