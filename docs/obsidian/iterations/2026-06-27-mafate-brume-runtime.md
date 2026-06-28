# 2026-06-27 - Mafate : brume des hauts en runtime

## But

Traduire la reference photo "hauts du Maido / Mafate" dans le jeu sans importer la photo comme texture.

## Fait

- Ajout d'une couche `MafateHighlandAtmosphere` en pur Three.js.
- Brume basse low-poly repoussee vers les plans lointains.
- Nuages lourds froids au-dessus des reliefs.
- Bosquets sombres stylises type tamarins / vegetation de hauts.
- Debug spawn Maido decale pour ne plus rentrer dans le guide / marqueur.
- Correctif camera 2026-06-27 :
  - bosquets sombres reduits et repousses en bord de scene ;
  - spawn debug Maido recule sur l'approche du rempart pour eviter terrain/arbre plein cadre en portrait.
- Transition dynamique d'ambiance selon la distance au biome Mafate :
  - ciel plus gris-bleu ;
  - fog plus proche ;
  - hemisphere light moins tropical ;
  - soleil moins chaud.

## Fichiers

- `apps/game-client/src/render/mafateAtmosphere.ts`
- `apps/game-client/src/render/world.ts`
- `apps/game-client/src/game/GameApp.ts`

## Validation

- `corepack pnpm --filter @riw/game-client typecheck` OK.
- `corepack pnpm --filter @riw/game-client lint` OK.
- Capture : `output/playwright/mafate-brume-runtime-final3.png`.
- Comparaison ambiance :
  - depart ouest : `output/playwright/west-atmosphere-check.png` ;
  - Maido / Mafate : `output/playwright/mafate-atmosphere-check.png`.
- Correctif obstruction portrait : `output/playwright/mafate-spawn-offset-final.png`.

## Note DA

La zone reste low-poly lisible. La brume ne doit pas couvrir le joueur ou le chemin. Elle sert surtout a detacher les plans de relief et a casser le rendu "vert tropical clair" du Maido.
