# 2026-06-26 - Correction passe Claude visuelle

## Contexte

Claude avait avance sur la passe graphique : eau bicolore, houle, HUD mock gate,
camera, lumiere, Fournaise FX et allegeement terrain monolithique.

Verification Codex : typecheck, lint, build et captures navigateur.

## Bugs corriges

- `world.ts` : fix TypeScript sur l'attribut `position` de l'ocean gradient.
- HUD : objectifs Fournaise remplaces par objectifs actifs Saint-Paul / Saint-Gilles.
- HUD : inventaire mock masque vraiment en public ; la touche `I` ne l'ouvre plus sans `?hudMock`.
- `GameApp.ts` : zone initiale par defaut alignee sur Saint-Paul / Saint-Gilles.
- `westBlockout.ts` : chemin passe en `MeshBasicMaterial` vertex-color pour supprimer les entailles noires dues a l'eclairage des triangles inclines.
- `styles.css` : HUD mobile compacte, notifications remontees au-dessus des controles tactiles, joystick/action reduits sur pointeur tactile.

## Captures

- Avant correction HUD : `runtime-normal.png`
- Apres correction HUD : `runtime-normal-after-hud-fix.png`
- Apres correction chemin : `runtime-normal-after-trail-fix.png`
- Carte debug : `runtime-mapdebug.png`
- Suite desktop/mobile : dossier `2026-06-26-codex-correction-claude-suite/`
- Mobile apres CSS : `mobile-after-css.png`
- Mobile tactile Pixel 5 : `mobile-pixel5-after-css.png`

## Validation

- `corepack pnpm --filter @riw/game-client typecheck` OK.
- `corepack pnpm --filter @riw/game-client lint` OK.
- `corepack pnpm --filter @riw/game-client build` OK.
- Playtest navigateur local OK sur `http://localhost:5173/`.
- Capture desktop, mobile portrait et Pixel 5 OK.

## Risques restants

- Bundle JS toujours > 500 kB.
- Les props/PNJ visibles doivent rester lies a la boucle Ouest ; ne pas redevenir decoration gratuite.
- La passe visuelle n'est pas un audit final de toutes les zones.
- Console Playwright non collectee via `node -e` : le package CLI fonctionne pour les captures, mais le module `playwright` n'est pas exposé au `require` dans cette session Windows.
