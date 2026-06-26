# 2026-06-26 - Update packages workspace

## Objectif

Mettre a jour les dependances pnpm du monorepo sans toucher aux changements runtime en cours.

## Diff dependances

- Racine :
  - `@eslint/js` `^9.28.0` -> `^10.0.1`
  - `eslint` `^9.28.0` -> `^10.5.0`
  - `typescript` `^5.8.3` -> `^6.0.3`
  - `typescript-eslint` `^8.33.1` -> `^8.62.0`
- Client :
  - `@dimforge/rapier3d-compat` `^0.15.0` -> `^0.19.3`
  - `colyseus.js` `^0.16.19` -> `^0.16.22`
  - `three` `^0.177.0` -> `^0.185.0`
  - `vite` `^6.3.5` -> `^8.1.0`
  - `zod` `^3.25.56` -> `^4.4.3`
  - `@tauri-apps/cli` `^2.1.0` -> `^2.11.3`
  - `@types/three` `^0.177.0` -> `^0.185.0`
  - `typescript` `^5.8.3` -> `^6.0.3`
- Serveur :
  - `@colyseus/ws-transport` `^0.16.5` -> `^0.17.13`
  - `colyseus` `^0.16.4` -> `^0.17.10`
  - `tsx` `^4.19.4` -> `^4.22.4`
  - `zod` `^3.25.56` -> `^4.4.3`
  - `@types/node` `^24.0.0` -> `^26.0.1`
  - `typescript` `^5.8.3` -> `^6.0.3`
- Packages workspace :
  - `typescript` `^5.8.3` -> `^6.0.3`
  - `zod` shared `^3.25.56` -> `^4.4.3`

## Pnpm

- Tentative `pnpm@11.9.0` via Corepack : refusee.
- Cause : policy `minimumReleaseAge` bloque plusieurs packages tres recents (`three`, `@types/three`, `bn.js`, `range-parser`).
- Decision : conserver `packageManager: pnpm@10.12.1` pour garder l'installation reproductible aujourd'hui sans relacher la politique supply-chain.

## Validation

- `corepack pnpm install` : OK.
- `corepack pnpm outdated -r` : aucun paquet restant.
- `corepack pnpm typecheck` : OK.
- `corepack pnpm lint` : OK.
- `corepack pnpm build` : OK.

## Warning restant

- Build client Vite 8 : chunk JS > 500 kB (`899.68 kB`, gzip `242.65 kB`).
- Dette deja connue : code splitting / GLB monolithique / taille bundle.
