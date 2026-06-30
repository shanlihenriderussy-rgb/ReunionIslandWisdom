# AGENTS.md - apps/game-server

## Secteur

Serveur temps reel Colyseus.
Source de verite gameplay.

Fichiers pivots :

```txt
src/index.ts
src/rooms/ReunionWorldRoom.ts
src/combat/CombatSystem.ts
src/progression/ProgressionStore.ts
Dockerfile
fly.toml
```

## Lecture obligatoire

Avant patch serveur :

1. `../../CLAUDE.md`
2. `../../docs/obsidian/13-phase-2-gameplay.md`
3. `../../docs/obsidian/21-systeme-de-jeu.md`
4. `../../docs/obsidian/24-hebergement-production.md` si infra/prod
5. fichiers touches

## Regles serveur

- Serveur authoritative.
- Le client n'envoie que des intentions.
- Toute entree reseau validee par Zod depuis `@riw/shared`.
- Cooldowns obligatoires pour chat/actions/combat.
- Distance interaction verifiee serveur.
- Anti-triche position/vitesse.
- Progression, souvenirs, quetes, recompenses : jamais decides par le client.
- Pas de secret dans le repo.
- Secrets prod via Fly secrets / variables serveur.

## Securite

Verifier a chaque diff :

- messages non valides rejetes ;
- pas de crash room sur input malforme ;
- pas d'IDOR entre joueurs ;
- pas de broadcast de donnees privees ;
- pas de spam chat/actions ;
- pas d'injection dans logs ou messages client.

## Validation

```powershell
corepack pnpm --filter @riw/game-server typecheck
corepack pnpm --filter @riw/game-server lint
corepack pnpm --filter @riw/game-server build
```

Si shared/content change aussi :

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
```
