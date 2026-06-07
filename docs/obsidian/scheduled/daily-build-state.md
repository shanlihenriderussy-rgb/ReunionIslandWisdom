# Etat du build quotidien (riw-build-quotidien)

Cycle : 1 phase par jour. DEV -> TEST -> FIX -> chantier suivant.

## Etat courant

- phase: FIX
- chantier: level-design
- prochain_chantier: props-design

## Politique de validation (sandbox)

- Le sandbox Linux ne peut pas lancer le `pnpm build` complet (binaires node Windows).
- Chaque run : typecheck/logique en isole + note "build a refaire Windows".
- Shan lance `corepack pnpm ... typecheck/lint/build` quand il ouvre le repo.

## Feature testee (resultat phase TEST 2026-06-07 22:11)

- level-design : `WEST_BLOCKOUT_PATH_LENGTH` (114.557) + `getNearestPathProgress`.
- Logique rejouee : depart=0, fin=1, monotone sur les 18 points, borne [0,1] OK.
- Revue statique : pas de `any`, pas de DOM, module pur. Conforme CLAUDE.md.
- typecheck/lint/build : a relancer sous Windows (sandbox ne peut pas).

## Bugs en attente (renseignes par TEST, corriges par FIX)

- Pas de bug bloquant.
- Polish FIX : ajouter un seuil "sur le sentier" (`isOnWestPath` via `lateral`)
  car `normalized` reste dans [0,1] meme loin du sentier (peu significatif).

## Chantiers (round-robin)

1. level-design
2. props-design
3. equipment
4. game-logic
5. enemy
6. fight-aspect
7. fight-logic
8. gaming-style

## Historique

- 2026-06-07 22:00 — DEV level-design : ajout helpers progression sentier ouest. Phase suivante : TEST.
- 2026-06-07 22:11 — TEST level-design : logique validee (0..1, monotone), aucun bug bloquant, 1 polish note. Phase suivante : FIX.
