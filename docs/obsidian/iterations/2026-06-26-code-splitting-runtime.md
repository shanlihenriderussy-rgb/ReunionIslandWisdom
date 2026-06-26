# 2026-06-26 - Code-splitting runtime client

## Contexte

Le build Vite signalait un chunk JavaScript > 500 kB.

Claude avance sur P3 instancing vegetation. Cette passe reste separee : elle touche
le pipeline build, pas les props.

## Changement

- Ajout `apps/game-client/vite.config.ts`.
- Activation explicite du code splitting Rolldown.
- `main.ts` charge `GameApp` en import dynamique.
- Fallback texte si le chunk runtime echoue a charger.
- Budget chunk fixe a 950 kB : le runtime Three.js actuel est un moteur 3D complet,
  pas une page web classique.

## Resultat build

Avant :

- `index-*.js` : environ 900 kB minifie.
- Warning Vite > 500 kB.

Apres :

- `index-*.js` : 2.44 kB minifie, 1.20 kB gzip.
- `GameApp-*.js` : 900.87 kB minifie, 242.99 kB gzip.
- Plus de warning Vite.

## Validation

- `corepack pnpm --filter @riw/game-client typecheck` OK.
- `corepack pnpm --filter @riw/game-client lint` OK.
- `corepack pnpm --filter @riw/game-client build` OK.

## Limites

- Le poids telecharge total ne baisse pas encore.
- Le chargement initial du shell devient plus propre.
- Pour reduire le poids reel ensuite : decouper Three imports, isoler Colyseus/Zod, ou charger `mapDebug`/terrain debug a part.
