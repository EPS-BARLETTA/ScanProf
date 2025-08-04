# 📱 ScanProf

**ScanProf** est une application web conçue pour scanner des QR codes générés par d'autres applications comme **RunStats**. Elle permet de collecter, trier et exploiter des données élèves, notamment dans le cadre du projet ZENOS Tour.

---

## ✅ Fonctionnalités

### 📸 Scan des QR codes
- L'application utilise la caméra de l'appareil (iPad ou smartphone) pour scanner les QR codes.
- Elle fonctionne **hors ligne**.
- Les données sont enregistrées **localement** sans doublons et triées **par ordre alphabétique**.

### 📋 Résumé des données
- Un tableau de tous les élèves scannés est affiché dans la page **Résumé**.
- Un bouton permet d’**importer un fichier CSV** si besoin.
- Les données peuvent être **exportées au format CSV**.

### ⚙️ Tri personnalisé
- Un bouton **Accéder au tri** permet de générer un tableau trié selon les **critères détectés automatiquement** dans les données.
- Le tri est dynamique et s'adapte à chaque application source (par exemple : distance, VMA, vitesse, difficulté…).

### 🧠 Groupe ZENOS Tour
- **Fonctionnalité spécifique à RunStats**.
- Accessible via un bouton “Groupe ZENOS Tour” depuis la page de tri.
- Génère des groupes **hétérogènes de 4 élèves** en fonction :
  - de la **VMA** (1 forte, 2 moyennes, 1 faible)
  - de la **mixité**
  - et de la **classe** (évite de regrouper tous les plus forts ou une seule classe).
- Ajoute une **visualisation graphique (radar)** pour montrer l’équilibre des groupes.
- 📎 **Uniquement compatible avec des fichiers générés par l'application RunStats.**

### 🖨️ Impression
- Tous les tableaux (tri ou groupes) sont imprimables via le bouton **"Imprimer"**.

---

## 📦 Structure des fichiers

- `index.html` : Page d’accueil
- `scan.js` : Script de scan QR
- `resume.html` : Page de résumé des élèves
- `tri.html` : Tri dynamique selon critères
- `tri.js` : Script du tri automatique
- `groupe-zenos.html` : Génération de groupes ZENOS Tour
- `zenos.js` : Script pour créer les groupes et générer le graphique radar
- `README.md` : Ce fichier

---

## 📌 Notes
- Pour utiliser la page **Groupe ZENOS Tour**, les QR codes doivent contenir les champs :
  - `Nom`, `Prénom`, `Classe`, `Sexe`, `Distance`, `Vitesse`, `VMA`
- Toute application web souhaitant être compatible avec ScanProf doit :
  - Générer un QR code au **format JSON**, contenant les mêmes clés que celles listées ci-dessus.
  - Fournir une exportation **CSV avec les mêmes entêtes**.

---

## 📧 Contact
**Équipe EPS - Lycée Vauban - Luxembourg**
