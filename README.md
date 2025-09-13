# Focus Colonne — Pack drop-in (ScanProf & co)

Ce mini-module **ajoute une option de filtre d’affichage** pour se focaliser sur **une seule colonne** d’un tableau HTML, **sans rien casser du reste** (données intactes, tri/exports inchangés).

## Installation ultra-simple

1. Copiez `focus-column.js` dans la racine du projet (ou dans `js/` si vous préférez).
2. Dans la page qui contient le tableau (ex. `participants.html`), **ajoutez une seule ligne** avant la fermeture de `</body>` :

```html
<script src="focus-column.js" defer></script>
```

> C’est tout. Le module s’injecte automatiquement dans la barre d’actions `.actions` si elle existe (à côté de vos boutons “Trier / Exporter / …”), sinon juste au‑dessus du tableau.

## Ce que ça fait

- Ajoute un sélecteur **“Focus colonne”** avec les libellés de l’en‑tête du tableau.
- Masque toutes les autres colonnes à l’écran (affichage uniquement).
- Bouton **“Afficher tout”** pour revenir à la vue complète.
- S’adapte **dynamiquement** si les colonnes changent (scan/import/tri), grâce à un `MutationObserver`.
- **Impression** : tout est ré‑affiché automatiquement (règle `@media print`).

## Compatibilité

- Fonctionne avec n’importe quel tableau (`<table>`). Par défaut, il prend le **premier** tableau de la page.
- Détecte la ligne d’en‑tête via `<thead>` si présent, sinon la première ligne du `<tbody>`.
- Si votre barre d’actions a un autre sélecteur que `.actions`, vous pouvez éditer en haut du fichier :

```js
const FOCUS_CONFIG = {
  TABLE_SELECTOR: 'table',
  ACTIONS_SELECTOR: '.actions',
  // ...
};
```

## Désinstallation / Neutralisation

Supprimez simplement la ligne `<script src="focus-column.js" defer></script>` de la page. Aucune autre trace ni side‑effect.

---

**Auteur :** ChatGPT — Pack “Focus Colonne” v1.0.0
