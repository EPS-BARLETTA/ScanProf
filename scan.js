let participants = JSON.parse(localStorage.getItem('participants')) || [];

function renderTable() {
  const tbody = document.querySelector('#resultTable tbody');
  tbody.innerHTML = '';

  const sorted = [...participants].sort((a, b) => {
    return (a.nom + a.prenom).localeCompare(b.nom + b.prenom);
  });

  sorted.forEach(p => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.nom || ''}</td>
      <td>${p.classe || ''}</td>
      <td>${p.sexe || ''}</td>
      <td>${p.distance || ''}</td>
      <td>${p.vitesse || ''}</td>
      <td>${p.vma || ''}</td>
    `;
    tbody.appendChild(row);
  });
}

function handleScan(content) {
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      data.forEach(d => participants.push(d));
    } else {
      participants.push(data);
    }

    localStorage.setItem('participants', JSON.stringify(participants));
    renderTable();
  } catch (err) {
    alert("Erreur de lecture QR code");
  }
}

function setupQRScanner() {
  const html5QrCode = new Html5Qrcode("reader");

  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      const cameraId = devices[0].id;
      html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        (decodedText, decodedResult) => {
          html5QrCode.stop().then(() => {
            handleScan(decodedText);
            setTimeout(() => setupQRScanner(), 1000);
          });
        }
      );
    }
  }).catch(err => {
    console.error(err);
    alert("Impossible d'accéder à la caméra");
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  setupQRScanner();

  document.getElementById('download').addEventListener('click', () => {
    let csv = "Nom,Classe,Sexe,Distance,Vitesse,VMA\n";
    participants.forEach(p => {
      csv += `${p.nom || ''},${p.classe || ''},${p.sexe || ''},${p.distance || ''},${p.vitesse || ''},${p.vma || ''}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "participants.csv";
    link.click();
  });
});
