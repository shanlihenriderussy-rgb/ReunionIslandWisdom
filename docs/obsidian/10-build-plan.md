# 10 — Plan de build complet (design → prod)

> Doc maître. Couvre tout le cycle : vision, design, technique, contenu, prod, live ops.
> Lié à [[00-dashboard]] [[01-roadmap]] [[02-backlog]] [[04-decisions]] [[09-direction-artistique]].
> MAJ : 2026-05-31.

## 0. Synthèse

MMORPG 3D web/PWA situé à La Réunion. Exploration low-poly, crédible localement, mobile/web first.
Priorité absolue actuelle : **terrain fiable (IGN RGE ALTI D974) + level design propre**.
Aucun asset/personnage tant que le terrain n'est pas validé en `?mapDebug`.

État figé au 2026-05-31 : tous placeholders retirés, joueur invisible, PNJ non rendus, map = outil d'inspection terrain.

## 1. Vision produit

| Axe | Décision |
|-----|----------|
| Genre | MMORPG exploration / vie locale, PvE social |
| Plateforme | Web desktop + PWA mobile (Android prioritaire) |
| Style | Low-poly stylisé, lisible, léger |
| Ancrage | Géographie + culture réunionnaises réelles |
| Boucle cœur | Explorer → découvrir → quêtes locales → progresser → social |
| Anti-objectif | Pas de démo générique, pas de props random, pas de melange de styles |

Piliers d'expérience :
1. **Île crédible** — relief, littoral, cirques, ravines reconnaissables.
2. **Culture vivante** — noms, lieux, créole, mémoire locale (voir [[bible-reunion]]).
3. **Accessible mobile** — perf Android moyen de gamme, offline-tolérant.

## 2. Phases macro

```txt
Phase 0  Fondations terrain      ← EN COURS
Phase 1  Level design zones
Phase 2  Gameplay cœur (déplacement, interaction, quêtes)
Phase 3  Contenu (zones, PNJ, quêtes, items)
Phase 4  Multijoueur robuste
Phase 5  Pré-prod / polish / perf
Phase 6  Prod / déploiement
Phase 7  Live ops
```

Règle d'enchaînement : on ne passe pas à la phase N+1 sans critère de sortie de la phase N validé.
