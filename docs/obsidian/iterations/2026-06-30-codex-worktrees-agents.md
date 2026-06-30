# 2026-06-30 08:10 - Codex - Worktrees propres + AGENTS sectoriels

## Zone

Coordination repo, branches permanentes et consignes agents.

## Diff

- Creation de deux worktrees propres hors dossier principal :
  - `C:\Users\Shan li\Documents\RIW-worktrees\sandbox` sur `codex&claude/sandbox-versions` ;
  - `C:\Users\Shan li\Documents\RIW-worktrees\iterations` sur `codex&claude/iterations-permanent`.
- Ajout d'un `AGENTS.md` racine.
- Ajout de `AGENTS.md` sectoriels :
  - `apps/game-client` ;
  - `apps/game-server` ;
  - `packages/shared` ;
  - `packages/content` ;
  - `packages/assets` ;
  - `docs/obsidian` ;
  - `docs/design-system/hud`.

## Validation

- `git worktree list --porcelain` : worktrees visibles.
- `git -C C:\Users\Shan li\Documents\RIW-worktrees\sandbox status --short --branch` : clean.
- `git -C C:\Users\Shan li\Documents\RIW-worktrees\iterations status --short --branch` : clean.

## Risques

- Le dossier principal reste dirty avant/apres cette passe. C'etait deja le cas.
- La branche `codex&claude/sandbox-versions` signale un upstream `origin/...` gone. Ne pas pousser sans verifier le remote cible.
- Les fichiers `AGENTS.md` sont non commits tant qu'aucun commit explicite n'est demande.

## Suite

- Utiliser `iterations` pour les petites passes continues.
- Utiliser `sandbox` pour upgrades, tests visuels et experimentations.
- Merger vers `main` seulement apres validation typecheck/lint/build et revue du diff.
