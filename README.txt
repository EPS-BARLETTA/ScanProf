ScanProf — Correctif bouton “+ Ajouter un participant”
=====================================================

Contenu du ZIP :
- participants.html  → ajout du bouton et du <dialog> d’ajout
- participants.js    → logique d’ouverture, génération des champs (adaptés aux colonnes visibles), champs optionnels, sauvegarde localStorage

Installation (rapide) :
1) Sauvegardez vos fichiers actuels.
2) Remplacez `participants.html` et `participants.js` dans votre repo `ScanProf` par ceux de ce dossier.
3) Assurez-vous que votre page contient déjà le tableau des participants (thead/tbody). Le script lit ses colonnes pour générer les champs.
4) Pushez sur GitHub Pages comme d’habitude.

Notes :
- Le bouton s’adapte aux colonnes actuellement affichées (donc au dernier type de QR scanné).
- Vous pouvez ajouter des champs optionnels sans modifier l’entête du tableau (pas de colonnes fantômes).
- Les champs numériques (VMA, Distance, Vitesse, Points, Palier, Navette, Saut en longueur) sont parsés en nombres quand c’est possible.
- Le script tente d’appeler `window.renderParticipantsTable(list)` si elle existe pour re-render instantané ; sinon, il recharge la page.
