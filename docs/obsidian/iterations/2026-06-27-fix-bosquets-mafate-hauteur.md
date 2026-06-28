# 2026-06-27 - Fix : bosquets Mafate / Maido flottants

## Contexte

Screenshot Shan apres correction Claude : plusieurs bosquets sombres type tamarins / cryptomerias flottent encore au Maido.

## Cause

Ce n'etait pas la vegetation Ouest instanciee.

Les bosquets viennent de `apps/game-client/src/render/mafateAtmosphere.ts`.
Ils etaient tous poses avec :

```ts
MAFATE_CENTER.y + 0.35
```

Donc `y = 10.25` partout, quelle que soit la pente.

Sol reel echantillonne dans les heightfields de chunks :

```txt
-55.5,  8.5  -> 5.887
-45.8, 16.2  -> 7.583
-26.5, 18.8  -> 6.362
-55.2,-12.8  -> 4.958
```

Decalage observe : environ 2.7 a 5.3 unites trop haut.

## Diff

- `mafateAtmosphere.ts` charge le manifeste terrain chunks.
- Les bosquets lisent les heightfields RGE ALTI avant creation.
- Chaque bosquet est pose a `groundHeight(x,z) + 0.04`.
- Les troncs partent maintenant d'un pivot de base, au lieu d'un cylindre centre qui pouvait renforcer l'impression de flottement.

## Tests

- `corepack pnpm --filter @riw/game-client typecheck` OK.
- `corepack pnpm --filter @riw/game-client lint` OK.
- Test calcul hauteur : confirme que l'ancien `y=10.25` etait faux sur les 4 bosquets.

## Reste

- Recharger `http://127.0.0.1:5173/?visualZone=west&spawn=maido`.
- Confirmer visuellement que les bosquets sombres touchent le sol et ne percent pas le sentier.
