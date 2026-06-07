# 15 — Phase 4 : Multijoueur robuste

> Lié à [[10-build-plan]] [[13-phase-2-gameplay]].
> Statut : BLOQUÉ par Phase 2/3. Serveur Colyseus authoritative.

## Objectif

Passer du « 1 joueur validé serveur » à « N joueurs synchronisés, robuste, anti-triche ».

## Architecture

```txt
apps/game-server/src/index.ts
apps/game-server/src/rooms/ReunionWorldRoom.ts
packages/shared/src/protocol.ts
```

- Serveur = source de vérité (position, interaction, récompense, progression).
- Client = affichage + intentions.
- État partagé via schema Colyseus, messages validés Zod.

## Tâches

- [ ] Synchro position multi-joueurs (interpolation client).
- [ ] Rendu joueurs distants (réintroduction explicite).
- [ ] Gestion rooms / capacité / sharding zones.
- [ ] Réconciliation client (prédiction + correction serveur).
- [ ] Persistance joueur (progression, inventaire) — choix store à acter.
- [ ] Rate limiting + cooldowns globaux.
- [ ] Reconnexion / perte réseau (mobile, tunnels, 4G Réunion).

## Sécurité

- Anti-triche position/vitesse côté serveur.
- IDOR sur entités joueur/inventaire.
- Webhooks/services externes signés (HMAC) si présents.
- Pas de secret client.

## Critères de sortie

- [ ] N joueurs visibles et synchronisés sans désync notable.
- [ ] Triche position rejetée.
- [ ] Reconnexion propre après coupure réseau.
- [ ] Charge test basique (X joueurs/room) documentée.
