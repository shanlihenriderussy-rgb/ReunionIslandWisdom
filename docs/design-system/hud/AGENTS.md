# AGENTS.md - docs/design-system/hud

## Secteur

Reference design system HUD.

Fichiers pivots :

```txt
tokens.css
components.css
README.md
```

Runtime lie :

```txt
apps/game-client/src/design-tokens.css
apps/game-client/src/components.css
apps/game-client/src/ui/hud.ts
apps/game-client/src/styles.css
```

## Lecture obligatoire

1. `../../obsidian/23-design-system-hud.md`
2. `../../obsidian/09-direction-artistique.md`
3. fichiers touches

## Regles HUD

- Source active : export HTML/CSS fourni par Shan quand disponible.
- Garder les tokens docs et runtime synchronises.
- Pas d'import Google Fonts runtime.
- Cibles tactiles >= 44 px.
- Pas de gauges/minimap/inventaire fake si gameplay non fourni.
- Utiliser les primitives `.riw-*` existantes.
- Fallback sur `var(--hud-weave, none)` si token absent.

## Validation

```powershell
corepack pnpm --filter @riw/game-client typecheck
corepack pnpm --filter @riw/game-client lint
corepack pnpm --filter @riw/game-client build
```
