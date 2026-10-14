# Text2Slide

**Text2Slide** est une application de bureau Windows (100% hors-ligne) conçue pour transformer, formater et exporter rapidement du texte brut vers Microsoft PowerPoint sous forme de diapositives élégantes et prêtes à l'emploi.

---

## 🚀 Fonctionnalités principales

- 📝 **Normalisation intelligente du texte**
  - Découpage automatique des blocs de texte par diapositive (selon 1, 2 ou 3 lignes par diapositive).
  - Respect des strophes/couplets existants ou regroupement sur mesure.
  - Séparation explicite possible par une ligne vide ou `---`.

- 📐 **Ajustement automatique de la taille ("Taille max auto")**
  - Calcul dynamique par recherche dichotomique de la taille de police maximale adaptée (entre 10 pt et 100 pt) sans débordement.
  - Détection visuelle et alertes en cas de dépassement de la zone de sécurité.

- 🎨 **Mise en page & Personnalisation avancée**
  - Choix du format de diapositive : Écran large (**16:9**) ou Standard (**4:3**).
  - Positionnement vertical : Automatique (centré pour les diapositives courtes), Toujours centré ou Toujours en haut.
  - Sélection de polices (Calibri, Arial, Segoe UI, Times New Roman, Georgia), interligne personnalisable.
  - Palettes de couleurs prédéfinies et sélecteur de couleurs personnalisées pour le texte et l'arrière-plan.
  - Options de titre automatique (première ligne courte considérée comme titre), mise en gras globale ou sur le titre seul.

- 📤 **Exportation & Copie vers PowerPoint**
  - **Exportation .pptx natif** : Génération directe de fichiers `.pptx` prêts à l'ouverture dans PowerPoint ou OpenOffice/LibreOffice.
  - **Copie sous forme de Plan** : Copie de l'ensemble des diapositives au format structuré pour un collage direct dans le volet *Affichage > Plan* de PowerPoint.
  - **Copie d'une diapositive** : Copie au format HTML enrichi ou texte brut avec le raccourci `Ctrl+Shift+C`.

- 🌓 **Interface moderne & Mode sombre**
  - Interface réactive intégrée avec basculement fluide entre mode clair et mode sombre.
  - Sauvegarde automatique des préférences dans l'application.

- 🔄 **Mises à jour automatiques**
  - Recherche et téléchargement automatique des mises à jour en arrière-plan via GitHub Releases (`electron-updater`).

---

## 🛠️ Stack technique

- **Framework Bureau** : [Electron 31](https://www.electronjs.org/)
- **UI & Frontend** : [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Outils de Build** : [electron-vite](https://electron-vite.org/), [Vite 5](https://vitejs.dev/)
- **Génération PPTX** : [pptxgenjs](https://gitbrent.github.io/PptxGenJS/)
- **Empaquetage & Auto-update** : [electron-builder](https://www.electron.build/), `electron-updater`

---

## 💻 Développement et construction

### Prérequis

- [Node.js](https://nodejs.org/) (version 18+ recommandée)
- `npm`

### Installation des dépendances

```bash
npm install
```

### Lancement en mode développement

Démarre l'application Electron avec le rechargement chaud (*Hot Reload*) :

```bash
npm run dev
```

### Exécution des tests unitaires

Exécute la suite de tests pour vérifier l'algorithme d'ajustement de texte et de calcul des dimensions de diapositives :

```bash
npm test
```

### Build et packaging local

Génère la compilation TypeScript/Vite et crée l'exécutable Windows (NSIS) sans publication :

```bash
npm run build
npm run pack
```

Le fichier exécutable généré se trouve dans le dossier `dist/`.

---

## 📦 Publication d'une nouvelle version (GitHub Releases)

1. Mettre à jour le numéro de version dans `package.json`.
2. S'assurer que le dépôt cible dans `package.json` sous la clé `build.publish` pointe vers `ImRanto/text2slide-app`.
3. Configurer votre jeton d'accès GitHub :

```bash
# Bash / Zsh
export GH_TOKEN="votre_token_github"

# PowerShell
$env:GH_TOKEN="votre_token_github"
```

4. Lancer le script de publication :

```bash
npm run release
```

`electron-builder` va compiler le projet, générer l'installateur Windows NSIS, et créer automatiquement une nouvelle Release sur GitHub avec les exécutables joints.

---

## ⌨️ Raccourcis et astuces

- **`Ctrl + Shift + C`** : Copie la diapositive actuellement sélectionnée dans le presse-papiers.
- **Collage dans PowerPoint** :
  - Pour importer l'ensemble du texte d'un coup : cliquez sur **Copier tout**, ouvrez PowerPoint, basculez en vue **Affichage > Plan** (ou *Outline View*) et collez (`Ctrl + V`). Chaque bloc deviendra une diapositive dédiée.

---

## 📄 Licence

Ce projet est sous licence propriétaire / réservée. Tous droits réservés.
