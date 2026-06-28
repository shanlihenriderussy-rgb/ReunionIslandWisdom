# 2026-06-27 - HUD design system HTML applique

## Source

Fichier fourni par Shan :

```txt
C:\Users\Shan li\Downloads\_Divers\Reunion Island Wisdom — HUD Design System.html
C:\Users\Shan li\Downloads\_Divers\Reunion Island Wisdom — HUD Design System_files\tokens.css
```

## Changements

- Tokens HUD resynchronises depuis l'export HTML vers :
  - `docs/design-system/hud/tokens.css`
  - `apps/game-client/src/design-tokens.css`
- Fallback ajoute sur `.riw-panel` :
  - `background-color: var(--hud-panel)`
  - `background-image: var(--hud-weave, none)`
- Runtime HUD raccorde aux primitives :
  - boutons haut-centre : `.riw-iconbtn`
  - mini-carte : `.riw-minimap`
  - statut connexion : `.riw-status` + `data-state`

## Notes

- Pas d'import Google Fonts runtime.
- `board.css` fourni reste une reference visuelle. Il n'est pas copie tel quel pour ne pas ecraser les correctifs runtime recents.
- Les anciennes variantes locales "coins carres" et "trame tapa" restent documentees dans `04-decisions.md`.

## Validation

- OK : `corepack pnpm --filter @riw/game-client typecheck`.
- OK : `corepack pnpm --filter @riw/game-client lint`.
- OK : `corepack pnpm --filter @riw/game-client build`.
- OK : le bundle prod contient les tokens du fichier fourni (`--hud-panel` 82%, `--r-disc:50%`) et les classes `.riw-iconbtn`, `.riw-minimap`, `.riw-status`.
- Limite : Chrome headless a produit une capture noire pour le jeu WebGL. Controle visuel runtime a refaire dans le navigateur ouvert de Shan.
