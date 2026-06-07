# 16 — Phases 5 & 6 : Pré-prod, polish & déploiement

> Lié à [[10-build-plan]] [[03-playtests]] [[05-asset-pipeline]].
> Statut : BLOQUÉ par Phase 4.

## Phase 5 — Pré-prod / polish / perf

### Objectif
Stabiliser, optimiser, rendre l'expérience présentable.

### Tâches
- [ ] Budget perf mobile chiffré (FPS, draw calls, mémoire, taille bundle).
- [ ] LOD terrain + assets, frustum culling, instancing.
- [ ] Streaming zones (chargement progressif).
- [ ] PWA : manifest, service worker, cache assets, install Android.
- [ ] Audio (ambiances locales), UI/HUD polish, accessibilité.
- [ ] Onboarding joueur (première session lisible).
- [ ] Campagne playtests structurés → [[03-playtests]].
- [ ] Pass sécurité complet (checklist CLAUDE.md).

### Critères de sortie
- [ ] Cible FPS tenue desktop + mobile.
- [ ] Aucune erreur console critique.
- [ ] PWA installable et jouable offline (zone départ).

## Phase 6 — Prod / déploiement

### Cible infra — ACTÉE 2026-06-07 (ADR-007, voir [[24-hebergement-production]])
- Client statique : **Cloudflare Pages** (build Vite, bande passante illimitée pour les GLB).
- Serveur Colyseus : **Fly.io** region `jnb` (WebSocket persistant, machine sans sleep).
- Liaison : `wss://riw-game-server.fly.dev` via `VITE_GAME_SERVER_URL`.
- Secrets : env vars Cloudflare + `fly secrets`, jamais côté client.
- Scaffold posé (Dockerfile, fly.toml, /health, .env.production). Déploiement réel à exécuter par Shan.

### Tâches
- [ ] Pipeline CI : typecheck + lint + build sur PR.
- [ ] Build prod client + déploiement Cloudflare Pages.
- [ ] Déploiement serveur Fly.io + scaling rooms.
- [ ] Domaine + HTTPS + WSS.
- [ ] Monitoring (logs, erreurs, métriques rooms).
- [ ] Sauvegarde persistance joueurs.
- [ ] Plan rollback.

### Critères de sortie
- [ ] Build prod reproductible via CI.
- [ ] Client prod parle au serveur prod (WSS).
- [ ] Monitoring actif, rollback testé.
