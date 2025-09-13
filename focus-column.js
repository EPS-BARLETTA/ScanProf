/**
 * ScanProf — Focus Colonne (affichage uniquement)
 * v1.1.0 — Garde toujours visibles: nom, prenom, classe + la colonne focalisée.
 */
(function(){
  const FOCUS_CONFIG = {
    TABLE_SELECTOR: 'table',
    ACTIONS_SELECTOR: '.actions',
    AUTO_INSERT_POSITION: 'afterbegin',
    LABEL_TEXT: 'Focus colonne :',
    ALL_TEXT: '— Toutes —',
    RESET_TEXT: 'Afficher tout',
    HIDDEN_CLASS: 'sp-hidden-col',
    CONTROLS_CLASS: 'focus-controls',
    ENABLE_MUTATION_OBSERVER: true,
    // Noms de colonnes à garder TOUJOURS visibles (normalisés en minuscules sans accent)
    BASE_ALWAYS_VISIBLE: ['nom','prenom','prénom','classe']
  };

  // Utils
  const slug = (s) => String(s||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .trim().toLowerCase();

  // Inject CSS léger
  function injectCSS(){
    if (document.getElementById('focus-column-style')) return;
    const css = `
      .${FOCUS_CONFIG.HIDDEN_CLASS}{display:none}
      .${FOCUS_CONFIG.CONTROLS_CLASS}{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
      .${FOCUS_CONFIG.CONTROLS_CLASS} label{font-weight:600}
      @media print{ .${FOCUS_CONFIG.HIDDEN_CLASS}{ display:table-cell !important } }
    `;
    const style = document.createElement('style');
    style.id = 'focus-column-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createControls(){
    const wrap = document.createElement('div');
    wrap.className = FOCUS_CONFIG.CONTROLS_CLASS;

    const label = document.createElement('label');
    label.setAttribute('for','focusColumnSelect');
    label.textContent = FOCUS_CONFIG.LABEL_TEXT;

    const select = document.createElement('select');
    select.id = 'focusColumnSelect';
    select.innerHTML = `<option value="__all__">${FOCUS_CONFIG.ALL_TEXT}</option>`;
    select.style.cursor = 'pointer';

    const resetBtn = document.createElement('button');
    resetBtn.id = 'resetFocusBtn';
    resetBtn.type = 'button';
    resetBtn.textContent = FOCUS_CONFIG.RESET_TEXT;
    resetBtn.className = 'button';

    wrap.appendChild(label);
    wrap.appendChild(select);
    wrap.appendChild(resetBtn);
    return wrap;
  }

  function getHeaderRow(table){
    const theadRow = table.querySelector('thead tr');
    if (theadRow) return theadRow;
    const firstBodyRow = table.querySelector('tbody tr');
    return firstBodyRow || null;
  }

  function getHeaderInfo(table){
    const headerRow = getHeaderRow(table);
    if (!headerRow) return { cells: [], labels: [], baseIdx: new Set() };
    const cells  = [...headerRow.children];
    const labels = cells.map(th => slug(th.textContent));
    const baseIdx = new Set();
    labels.forEach((lab, i) => {
      if (FOCUS_CONFIG.BASE_ALWAYS_VISIBLE.includes(lab)) baseIdx.add(i);
    });
    return { cells, labels, baseIdx };
  }

  function populateSelect(table, select){
    const prev = select.value;
    // reset except first
    for (let i = select.options.length - 1; i >= 1; i--) select.remove(i);

    const { labels } = getHeaderInfo(table);
    labels.forEach((lab, idx) => {
      const labelText = (lab || `Colonne ${idx+1}`);
      const opt = document.createElement('option');
      opt.value = String(idx);
      // Remettre quelques accents usuels
      const pretty = labelText.replace('prenom','prénom');
      opt.textContent = pretty.charAt(0).toUpperCase() + pretty.slice(1);
      select.appendChild(opt);
    });

    const possible = ['__all__', ...[...select.options].slice(1).map(o=>o.value)];
    select.value = possible.includes(prev) ? prev : '__all__';
  }

  function applyFocus(table, indexStr){
    const headerRow = getHeaderRow(table);
    if (!headerRow) return;
    const { baseIdx } = getHeaderInfo(table);

    const selectedIndex = (indexStr === '__all__') ? null : Number(indexStr);

    const rows = table.querySelectorAll('thead tr, tbody tr');
    rows.forEach(tr => {
      [...tr.children].forEach((cell, i) => {
        if (selectedIndex === null) {
          // Mode "Toutes" : tout afficher
          cell.classList.remove(FOCUS_CONFIG.HIDDEN_CLASS);
        } else {
          // Afficher si :
          // - colonne sélectionnée
          // - OU colonne de base (nom/prenom/classe)
          if (i === selectedIndex || baseIdx.has(i)) {
            cell.classList.remove(FOCUS_CONFIG.HIDDEN_CLASS);
          } else {
            cell.classList.add(FOCUS_CONFIG.HIDDEN_CLASS);
          }
        }
      });
    });
  }

  function mount(){
    injectCSS();

    const table = document.querySelector(FOCUS_CONFIG.TABLE_SELECTOR);
    if (!table) return;

    const actions = document.querySelector(FOCUS_CONFIG.ACTIONS_SELECTOR);
    const controls = createControls();
    if (actions){
      actions.insertAdjacentElement(FOCUS_CONFIG.AUTO_INSERT_POSITION, controls);
    } else {
      table.parentElement.insertBefore(controls, table);
    }

    const select = controls.querySelector('#focusColumnSelect');
    const resetBtn = controls.querySelector('#resetFocusBtn');

    populateSelect(table, select);
    applyFocus(table, '__all__');

    select.addEventListener('change', ()=> applyFocus(table, select.value));
    resetBtn.addEventListener('click', ()=> {
      select.value = '__all__';
      applyFocus(table, '__all__');
    });

    if (FOCUS_CONFIG.ENABLE_MUTATION_OBSERVER){
      const observer = new MutationObserver(()=>{
        const current = select.value;
        populateSelect(table, select);
        select.value = [...select.options].some(o=>o.value===current) ? current : '__all__';
        applyFocus(table, select.value);
      });
      observer.observe(table, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();