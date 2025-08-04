document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("participantsTable");
  const thead = document.getElementById("tableHeader");
  const tbody = table.querySelector("tbody");
  const sortButtonsContainer = document.getElementById("sortButtons");
  const importInput = document.getElementById("importCsvInput");

  let data = [];

  function renderTable(dataToRender) {
    tbody.innerHTML = "";

    dataToRender.forEach(eleve => {
      const row = document.createElement("tr");
      Object.values(eleve).forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
  }

  function renderHeader(keys) {
    thead.innerHTML = "";
    keys.forEach(key => {
      const th = document.createElement("th");
      th.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      thead.appendChild(th);
    });
  }

  function renderSortButtons(keys) {
    sortButtonsContainer.innerHTML = "";
    keys.forEach(key => {
      const btn = document.createElement("button");
      btn.textContent = `Trier par ${key}`;
      btn.addEventListener("click", () => {
        const sorted = [...data].sort((a, b) => {
          if (!isNaN(parseFloat(a[key])) && !isNaN(parseFloat(b[key]))) {
            return parseFloat(b[key]) - parseFloat(a[key]); // tri décroissant
          }
          return a[key].localeCompare(b[key]); // tri alphabétique
        });
        renderTable(sorted);
      });
      sortButtonsContainer.appendChild(btn);
    });
  }

  function loadFromLocalStorage() {
    const eleves = JSON.parse(localStorage.getItem("eleves") || "[]");
    if (eleves.length > 0) {
      data = eleves;
      const keys = Object.keys(eleves[0]);
      renderHeader(keys);
      renderSortButtons(keys);
      renderTable(eleves);
    }
  }

  function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result.trim();
      const lines = text.split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      const parsedData = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj = {};
        headers.forEach((h, i) => {
          const val = values[i]?.trim();
          obj[h] = !isNaN(val) && val !== "" ? parseFloat(val) : val;
        });
        return obj;
      });

      if (parsedData.length > 0) {
        data = parsedData;
        renderHeader(headers);
        renderSortButtons(headers);
        renderTable(parsedData);
      }
    };
    reader.readAsText(file);
  }

  importInput.addEventListener("change", handleCSVImport);
  loadFromLocalStorage();
});
