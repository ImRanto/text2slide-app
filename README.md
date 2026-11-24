# Text2Slide

**Text2Slide** est une application de bureau Windows (100% hors-ligne) conçue pour transformer, formater et exporter rapidement du texte brut vers Microsoft PowerPoint sous forme de diapositives élégantes et prêtes à l'emploi.

---

## 🚀 Fonctionnalités principales

- 📝 **Normalisation intelligente du texte**
  - Découpage automatique des blocs de texte par diapositive (selon 1, 2 ou 3 lignes par diapositive).
  - Respect des strophes/couplets existants ou regroupement sur mesure.
  - Séparation explicite possible par une ligne vide ou `---`.

- 🎵 **Paroles : sections, titre et saut de diapo forcé** *(nouveau)*
  - **Détection de sections** : `1-`, `1 -`, `[Verset 1]`, `Refrain:`… chaque marqueur démarre automatiquement une nouvelle diapositive.
  - **Affichage du marqueur sur la diapo** (activé par défaut) avec une case à cocher pour le masquer : « Afficher les marqueurs ».
  - **Titre automatique** : tout ce qui précède le premier marqueur devient la diapositive de titre, ou préfixez une ligne par `Titre:`.
  - **Saut de diapositive forcé** avec un `/` en fin de ligne.
  - **Normalisation compatible** : le bouton de nettoyage conserve marqueurs, titres et sauts forcés.
  - 👉 Voir le [guide d'utilisation des paroles](#-guide--saisir-des-paroles-sections-titre-et-sauts-de-diapo) ci-dessous.

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

- ❓ **Centre d'aide intégré** *(nouveau)*
  - Bouton **?** dans l'en-tête (ou touche **F1**) : guides d'utilisation par rubrique (démarrage rapide, paroles et sections, normalisation, mise en page, export, raccourcis, dépannage).
  - Bouton « Charger l'exemple dans l'éditeur » pour tester la syntaxe des paroles en un clic.
  - Fenêtre accessible : fermeture par `Échap` ou clic à l'extérieur, navigation au clavier, compatible mode sombre.

- 🌓 **Interface moderne & Mode sombre**
  - Interface réactive intégrée avec basculement fluide entre mode clair et mode sombre.
  - Sauvegarde automatique des préférences dans l'application.

- 🔄 **Mises à jour automatiques**
  - Recherche et téléchargement automatique des mises à jour en arrière-plan via GitHub Releases (`electron-updater`).

---

## 📖 Guide : saisir des paroles (sections, titre et sauts de diapo)

### 1. Les règles en un coup d'œil

| Vous écrivez | Effet |
|---|---|
| Une **ligne vide** ou `---` (seul sur sa ligne) | Nouvelle diapositive |
| Un **marqueur de section** seul sur sa ligne (`1-`, `[Refrain]`…) | Nouvelle diapositive, avec le marqueur affiché dessus |
| Un `/` **à la fin d'une ligne** | La diapositive se termine après cette ligne (le `/` n'est pas affiché) |
| Une ligne contenant **uniquement** `/` | Saut de diapositive |
| Du texte **avant le premier marqueur** | Diapositive de **titre** |
| `Titre: Mon chant` | Cette ligne devient un titre |

### 2. Marqueurs de section reconnus

Le marqueur doit être **seul sur sa ligne** (le texte des paroles va sur les lignes suivantes).

| Type | Exemples | Affiché sur la diapo |
|---|---|---|
| Numéro + tiret | `1-`, `1 -`, `2 –` | `1 -`, `2 -` |
| Numéro + point / parenthèse | `3.`, `4)` | `3.`, `4)` |
| Entre crochets | `[Verset 1]`, `[Refrain]`, `[Pont]` | `Verset 1`, `Refrain`, `Pont` |
| Numéro + crochets | `1 - [Verset 1]` | `1 - Verset 1` |
| Mot-clé | `Verset 2`, `Couplet 1`, `Refrain:`, `Pont`, `Intro`, `Bridge`, `Chorus` | tel quel (sans `:`) |

Mots-clés reconnus : *verset, couplet, strophe, refrain, pont, bridge, chorus, verse, intro, outro, coda, interlude, pré-refrain, pre-chorus* (majuscules/minuscules indifférentes).

> ⚠️ `1- Première ligne` (marqueur **suivi de texte sur la même ligne**) n'est **pas** un marqueur : cela évite de confondre une vraie ligne de paroles comme « 1 - 2 - 3 soleil » avec un marqueur. Mettez le marqueur sur sa propre ligne.

### 3. Titre du chant

- **Automatique** : tout ce qui précède le **premier marqueur** est le titre (plusieurs lignes possibles : titre, auteur, tonalité…). Les lignes vides dans cette zone ne la découpent pas.
- **Explicite** : préfixez une ligne par `Titre:` (ou `Title:`, `Chant:`, `Cantique:`, `Hymne:`). Seule cette ligne devient le titre, les lignes suivantes restent du texte normal.
- Dès qu'un texte contient des marqueurs, l'option **« Première ligne = titre »** est ignorée : les titres viennent uniquement de la zone avant le premier marqueur ou du préfixe `Titre:`.

### 4. Afficher ou masquer les marqueurs

Dans les paramètres, la case **« Afficher les marqueurs (1 -, Refrain…) »** est **cochée par défaut** : le marqueur est écrit en première ligne de la diapositive pour bien repérer le couplet.
Décochée, le marqueur sert uniquement à découper les diapositives et n'apparaît pas.
Si un couplet est réparti sur plusieurs diapositives, seule la première porte le marqueur.

### 5. Forcer une fin de diapositive avec `/`

```text
Dieu est si bon pour moi/
Il me garde chaque jour
Il m'aime tel que je suis
```

→ diapo 1 : « Dieu est si bon pour moi » ; diapo 2 : les deux lignes suivantes.

Un `/` seul sur une ligne fait la même chose. Le `/` au milieu d'une ligne (« et/ou ») n'a aucun effet.

### 6. Le bouton « Nettoyer / Normaliser »

Il regroupe les paroles par 1, 2 ou 3 lignes par diapositive, en respectant les éléments explicites :

- les marqueurs, les lignes `Titre:`, la zone de titre et les `/` sont **toujours conservés** (même si « Conserver les couplets existants » est décoché) ;
- un marqueur **ne compte pas** dans le nombre de lignes par diapositive : il reste attaché à la première diapo de son couplet ;
- un `/` devient une coupure de diapositive (ligne vide) ;
- relancer le nettoyage sur un texte déjà nettoyé ne change plus rien.

### 7. Exemple complet

Texte saisi :

```text
Titre: Grâce infinie
Auteur : Jean Dupont

1-
Ta grâce est plus grande
Que toutes mes fautes
Ta main me relève
Quand je tombe/
Et me rend la joie

[Refrain]
Grâce infinie, grâce infinie
Je chante ton nom
```

Résultat (marqueurs affichés, 2 lignes par diapo après nettoyage) :

| # | Diapositive |
|---|---|
| 1 | **Grâce infinie** (titre) + Auteur : Jean Dupont |
| 2 | `1 -` · Ta grâce est plus grande · Que toutes mes fautes |
| 3 | Ta main me relève · Quand je tombe |
| 4 | Et me rend la joie |
| 5 | `Refrain` · Grâce infinie, grâce infinie · Je chante ton nom |

### 8. Bonnes pratiques

- Mettez toujours le marqueur **sur sa propre ligne**.
- Utilisez `[Refrain]` à chaque répétition du refrain si vous voulez qu'il apparaisse à chaque fois.
- Plusieurs chants dans un même texte : séparez-les par `---` et commencez chacun par `Titre: …`.
- Pour une diapo d'instrumental ou de transition, un marqueur seul suffit (`[Intro]`) : il crée une diapo avec uniquement son libellé.

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

Exécute la suite de tests : algorithme d'ajustement de texte, calcul des dimensions de diapositives et analyse des paroles (marqueurs de section, titres, sauts `/`, normalisation) :

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
- **`F1`** : Ouvre ou ferme le centre d'aide (bouton **?** de l'en-tête). `Échap` le ferme.
- **Paroles** : mettez `1-`, `2-`, `[Refrain]` sur leur propre ligne pour créer les couplets, et terminez une ligne par `/` pour forcer une nouvelle diapositive (voir le [guide](#-guide--saisir-des-paroles-sections-titre-et-sauts-de-diapo)).
- **Collage dans PowerPoint** :
  - Pour importer l'ensemble du texte d'un coup : cliquez sur **Copier tout**, ouvrez PowerPoint, basculez en vue **Affichage > Plan** (ou *Outline View*) et collez (`Ctrl + V`). Chaque bloc deviendra une diapositive dédiée.

---

## 📄 Licence

Ce projet est sous licence propriétaire / réservée. Tous droits réservés.
