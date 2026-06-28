# 2026-06-27 - HUD : mini-carte runtime interactive

## Objectif

Remplacer la mini-carte mock par une mini-carte utile en jeu, sans ajouter de framework ni de dependance.

## Fait

- Mini-carte canvas dans `apps/game-client/src/ui/hud.ts`.
- Mise a jour temps reel via `HudController.setMapState`, appele chaque frame par `GameApp`.
- Donnees affichees :
  - joueur local + orientation ;
  - autres joueurs du snapshot ;
  - chemin Ouest ;
  - marqueurs de quete Ouest ;
  - biomes proches ;
  - cibles PvE vivantes/mortes ;
  - position et portee de carte.
- Interaction :
  - clic/tap mini-carte ou touche `M` -> bascule vue Carte ;
  - molette sur mini-carte -> change la portee affichee ;
  - etat actif visible sur la mini-carte et le bouton carte.
- HUD nettoye :
  - mini-carte gardee active meme sans `?hudMock` ;
  - journal de quetes retire les recompenses fake ;
  - journal affiche zone, event serveur, progression locale, cibles PvE ;
  - aide pause ajoute `Espace`, `F`, `M / mini-carte`.
- CSS :
  - canvas rond, focus visible, cible tactile ;
  - meta position/portee ;
  - zoom lateral decale sous le bloc carte/statut pour eviter les chevauchements ;
  - lignes de journal plus lisibles.

## Tests

- `corepack pnpm --filter @riw/game-client typecheck` OK.
- `corepack pnpm --filter @riw/game-client lint` OK.
- `corepack pnpm --filter @riw/game-client build` OK.
- Chrome desktop 1440x900 :
  - canvas mini-carte non vide ;
  - statut position affiche ;
  - pas de chevauchement zoom/statut apres correction.
- Chrome mobile 390x844 :
  - pas de chevauchement mini-carte / objectif ;
  - pas de chevauchement zoom / objectif.

## Limites

- Le sac reste masque hors `?hudMock` : inventaire serveur pas encore livre.
- La mini-carte affiche une lecture locale. Elle ne remplace pas encore une grande carte avec selection de destination.
- Les warnings Three.js visibles en console sont preexistants : `THREE.Clock` et `PCFSoftShadowMap` deprecies.
