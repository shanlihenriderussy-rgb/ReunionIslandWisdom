# 14 — Phase 3 : Contenu

> Lié à [[10-build-plan]] [[08-quests]] [[05-asset-pipeline]] [[09-direction-artistique]] [[bible-reunion]].
> Statut : BLOQUÉ par Phase 2.

## Objectif

Remplir les zones validées avec PNJ, quêtes, items et assets — chacun justifié.

## Pipeline asset (gate obligatoire avant tout ajout)

Avant un asset, renseigner dans [[05-asset-pipeline]] :

```txt
zone cible · quête liée · rôle gameplay · style · source/licence
budget triangles/textures · collision attendue · note Obsidian
```

Interdit : props random, mélange de styles, assets sans licence, texture photo-réaliste sans décision DA, marques réelles.

## Données contenu (`packages/content`)

- Zones : métadonnées, spawns, ambiance.
- PNJ : identité locale, dialogues créole/français, rôle.
- Quêtes : objectifs, étapes, récompenses, conditions serveur.
- Items : stats, rareté, usage.

## Tâches

- [ ] Définir 3–5 quêtes ancrées (lieux/culture réels) → [[08-quests]].
- [ ] Set PNJ zone de départ (rôle + dialogue).
- [ ] Set items de base (cohérent low-poly).
- [ ] Réintroduction assets validés un par un (décision explicite, pas les anciens placeholders Kenney).
- [ ] Réintroduire PNJ visibles + avatars distants (actuellement non rendus).
- [ ] LOD + atlas textures pour budget mobile.

## Critères de sortie

- [ ] Zone de départ « habitée » : PNJ, quêtes enchaînables, items obtenables.
- [ ] Chaque asset tracé dans le pipeline.
- [ ] Perf mobile tenue avec contenu chargé.
