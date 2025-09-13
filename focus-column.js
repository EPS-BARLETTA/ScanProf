/**
 * ScanProf — Focus Colonne (affichage uniquement)
 * Version: 1.0.0
 * Auteur: ChatGPT (pack drop-in)
 *
 * Ce module ajoute une option "Focus colonne" pour n'afficher qu'une colonne
 * d'un tableau HTML, sans toucher aux données ni au reste de l'application.
 * Il s'adapte dynamiquement aux colonnes (quel que soit l'outil qui a généré les clés).
 *
 * Installation minimale : ajouter ce script avec `defer` dans participants.html
 *   <script src="focus-column.js" defer></script>
 *
 * Optionnel : Vous pouvez changer le sélecteur de la barre d'actions via FOCUS_CONFIG.ACTIONS_SELECTOR
 */
(function(){
  const FOCUS_CONFIG = {
    TABLE_SELECTOR: 'table',               // Sélecteur du tableau cible
    ACTIONS_SELECTOR: '.actions',          // Où insérer les contrôles si présent
    AUTO_INSERT_POSITION: 'afterbegin',    // Position d'insertion dans la barre d'actions
    LABEL_TEXT: 'Focus colonne :',
    ALL_TEXT: '— Toutes —',
    RESET_TEXT: 'Afficher tout',
    HIDDEN_CLASS: 'sp-hidden-col',
    CONTROLS_CLASS: 'focus-controls',
    ENABLE_MUTATION_OBSERVER: true
  };

  // Injecte un mini CSS non intrusif
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
    resetBtn.className = 'button'; // profite du style bouton si présent

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

  function populateSelect(table, select){
    // Préserver valeur courante
    const prev = select.value;
    // Nettoyer, garder l'option 0 ("Toutes")
    for (let i = select.options.length - 1; i >= 1; i--) select.remove(i);

    const headerRow = getHeaderRow(table);
    if (!headerRow) return;

    [...headerRow.children].forEach((cell, idx) => {
      const label = (cell.textContent || '').trim() || `Colonne ${idx+1}`;
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = label;
      select.appendChild(opt);
    });

    // Restaurer choix si possible
    const possible = ['__all__', ...[...select.options].slice(1).map(o=>o.value)];
    select.value = possible.includes(prev) ? prev : '__all__';
  }

  function applyFocus(table, indexStr){
    const headerRow = getHeaderRow(table);
    if (!headerRow) return;
    const index = indexStr === '__all__' ? null : Number(indexStr);

    const rows = table.querySelectorAll('thead tr, tbody tr');
    rows.forEach(tr => {
      [...tr.children].forEach((cell, i) => {
        if (index === null || i === index){
          cell.classList.remove(FOCUS_CONFIG.HIDDEN_CLASS);
        } else {
          cell.classList.add(FOCUS_CONFIG.HIDDEN_CLASS);
        }
      });
    });
  }

  function mount(){
    injectCSS();

    const table = document.querySelector(FOCUS_CONFIG.TABLE_SELECTOR);
    if (!table) return; // rien à faire s'il n'y a pas de tableau (ex: page vide)

    // Trouver barre d'actions si elle existe, sinon insérer avant le tableau
    const actions = document.querySelector(FOCUS_CONFIG.ACTIONS_SELECTOR);
    const controls = createControls();
    if (actions){
      actions.insertAdjacentElement(FOCUS_CONFIG.AUTO_INSERT_POSITION, controls);
    } else {
      table.parentElement.insertBefore(controls, table);
    }

    const select = controls.querySelector('#focusColumnSelect');
    const resetBtn = controls.querySelector('#resetFocusBtn');

    // Init
    populateSelect(table, select);
    applyFocus(table, '__all__');

    // Events
    select.addEventListener('change', ()=> applyFocus(table, select.value));
    resetBtn.addEventListener('click', ()=> {
      select.value = '__all__';
      applyFocus(table, '__all__');
    });

    if (FOCUS_CONFIG.ENABLE_MUTATION_OBSERVER){
      const observer = new MutationObserver(()=>{
        const current = select.value;
        populateSelect(table, select);
        // conserver si possible
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