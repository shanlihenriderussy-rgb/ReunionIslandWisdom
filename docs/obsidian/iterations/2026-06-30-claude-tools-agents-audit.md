# 2026-06-30 08:20 - Claude - tools/AGENTS.md + audit AGENTS sectoriels

## Zone

Coordination repo, complement aux AGENTS.md crees par Codex la meme matinee.

## Diff

- Ajout de `tools/AGENTS.md` (manquant) : pipeline terrain RGE ALTI D974, sorties DEM, garde-fous sources, verification relief.
- Aucun fichier de Codex ecrase. Travail strictement complementaire (regle "ne pas modifier la meme note / le meme fichier").

## Audit des AGENTS.md de Codex (lecture seule)

- Racine + 7 sectoriels : coherents avec `CLAUDE.md`. RAS bloquant.
- `apps/game-server/AGENTS.md` cite `Dockerfile` + `fly.toml` : verifies presents. OK.
- `apps/game-client/AGENTS.md` cite `20-systeme-jeu-zones.md` : present. OK.
- Seul trou reel : `tools/` sans AGENTS.md alors que terrain = priorite #1. Comble ici.

## Validation

- Statique seulement : chemins/scripts confirmes contre le repo (find + head package.json + head build-lareunion-dem-terrain.mjs).
- Pas de typecheck/lint (aucun code TS touche, doc uniquement).

## Risques

- Dossier principal `main` dirty (642 fichiers non commits) + `.git/index.lock` non supprimable depuis sandbox. Plomberie git a faire par Shan sur la machine reelle.
- `codex&claude/sandbox-versions` : upstream `origin/...` gone. Ne pas pousser sans verifier le remote.
- AGENTS.md + cette note non commits tant qu'aucun commit explicite demande.

## Suite

- Commandes git d'hygiene (index.lock, prune worktrees) fournies a Shan dans le chat.
- Lane Claude respectee : direction / docs / audit. Implementation laissee a Codex.
