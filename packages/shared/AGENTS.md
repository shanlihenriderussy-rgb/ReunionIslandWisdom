# AGENTS.md - packages/shared

## Secteur

Contrats partages client/serveur.
Schemas Zod, types, constantes gameplay.

Fichier pivot :

```txt
src/protocol.ts
```

## Lecture obligatoire

Avant patch :

1. `../../CLAUDE.md`
2. `../../docs/obsidian/13-phase-2-gameplay.md`
3. `../../docs/obsidian/21-systeme-de-jeu.md`
4. fichiers touches

## Regles shared

- Zod est la source de validation runtime.
- Tout message reseau entrant doit avoir un schema.
- Pas de logique Three.js, DOM ou Colyseus ici.
- Pas de schema permissif pour aller vite.
- Evolutions compatibles si possible.
- Si rupture de contrat : documenter dans Obsidian.
- Exporter types via `z.infer`.

## Items / equipement

Invariant actif :

- `equipement` + `instrument` => `slot != "aucun"`;
- autres categories => `slot == "aucun"`;
- non empilable => `maxStack == 1`.

Toute modification doit conserver des tests negatifs dans `packages/content/scripts/validate-content.ts`.

## Validation

```powershell
corepack pnpm --filter @riw/shared typecheck
corepack pnpm --filter @riw/shared lint
corepack pnpm --filter @riw/shared build
corepack pnpm validate:content
```
