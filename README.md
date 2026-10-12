# Text2Slide

Application de bureau Windows 100% hors-ligne pour formater et copier du texte vers PowerPoint.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Build local

```bash
npm run build
npm run pack
```

## Publication GitHub Releases

1. Mettre à jour la version dans `package.json`.
2. Vérifier que le dépôt GitHub est bien `ImRanto/Text2Slide`.
3. Définir le token GitHub :

```bash
export GH_TOKEN=your_token_here
```

4. Publier la release :

```bash
npm run release
```

Notes :
- `electron-builder` publie ensuite la release GitHub avec la version courante.
- Le packaging est configuré pour Windows NSIS avec `oneClick: true` et `perMachine: false`.
- Le client cherche automatiquement les mises à jour en production et affiche un message d’installation s’il y a une nouvelle version.
