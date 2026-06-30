# AGENTS.md - packages/content

## Secteur

Donnees pures du jeu.
Zones, PNJ, quetes, objets, emotes, cibles combat.

Fichiers pivots :

```txt
data/zones.json
data/npcs.json
data/quests.json
data/items.json
data/item-catalog.json
data/emotes.json
data/combat-targets.json
scripts/validate-content.ts
src/index.ts
```

## Lecture obligatoire

Avant patch content :

1. `../../CLAUDE.md`
2. `../../docs/obsidian/21-systeme-de-jeu.md`
3. `../../docs/obsidian/09-direction-artistique.md`
4. fichiers touches

## Regles content

- Donnees pures uniquement.
- Pas de Three.js.
- Pas de DOM.
- Pas de logique serveur cachee.
- Toute reference doit pointer vers un id existant.
- Toute zone doit rester dans `worldBounds`.
- Toute recompense doit etre coherent avec progression horizontale.
- Pas de stats RPG en V1.

## Zones V1

Zones gameplay cible :

- `saint-paul-saint-gilles`
- `saint-denis`
- `route-littoral`
- `piton-de-la-fournaise`
- `mafate`
- `salazie`
- `cilaos`

Ajouter une zone seulement si elle a role systeme + premier gameplay.

## Validation

```powershell
corepack pnpm validate:content
corepack pnpm --filter @riw/content typecheck
corepack pnpm --filter @riw/content lint
```
