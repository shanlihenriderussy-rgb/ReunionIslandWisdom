# Dialogue mobile — bottom sheet — 2026-06-27

## Contexte

Sur mobile tactile (≤640px + pointer: coarse), le panneau dialogue s'affichait comme un panel
flottant centré en bas — trop large pour la largeur d'écran, lisibilité médiocre, masquait le
décor sans tirer parti de la surface disponible.

## Changements

**`apps/game-client/src/styles.css`**

Ajouté dans `@media (max-width: 640px) and (pointer: coarse)` :

```css
.hud-dialogue-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  max-height: 52dvh;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.45);
  z-index: 90;
}
.hud-dialogue-panel .riw-dialogue {
  padding: var(--s-3) var(--s-4);
}
```

## Comportement

- Sheet glisse visuellement depuis le bas du viewport.
- Pleine largeur, coins ronds en haut (DA basalte sombre).
- Hauteur max 52dvh : le dialogue ne masque pas la moitié supérieure de l'écran (monde 3D visible).
- `overflow-y: auto` : les dialogues longs scrollent dans le sheet.
- `env(safe-area-inset-bottom)` : compatible iPhone avec barre système (encoche basse).
- `box-shadow` : séparation visuelle du sheet sur le rendu Three.js.
- Note UX : pendant un dialogue, le joystick est recouvert — comportement voulu (le joueur est
  en interaction, pas en déplacement).

## Refs

- [[02-backlog]] P1 "dialogue mobile bottom sheet"
- [[09-direction-artistique]] panels basalte sombre
