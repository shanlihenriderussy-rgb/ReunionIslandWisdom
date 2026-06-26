# 2026-06-26 — Instancing végétation Ouest (P3)

> Décision [[04-decisions]] ADR-011. Plan [[25-graphismes-ameliorations]] (P3).
> Scope strict : perf rendu (FPS/draw calls/densité/stabilité Ouest), PAS le bundle.

## Contexte

- Chaque prop de végétation = 1 sous-arbre GLB ajouté à la scène = autant de draw calls.
- Objectif : passer à `InstancedMesh` (1 GLB → N instances) sans changer le placement
  visuel ni les colliders.

## Diff

- `render/gltf.ts`
  - `buildGltfInstances(url, specs, options)` + type `GltfInstanceSpec`.
  - Charge le GLB une fois, applique `materialMode` (tuning végétation partagé),
    rejoue `normalizeModel` sur un template unique (reset `scale=1` à chaque instance),
    lit `leaf.matrixWorld`, compose `parentMatrix(position, tilt) * matrixWorld`.
  - 1 `InstancedMesh` par mesh unique du GLB ; `computeBoundingSphere` (culling correct).
  - Réutilise `normalizeModel` existant → zéro duplication des maths de placement.
- `render/westVegetation.ts`
  - Candidats acceptés regroupés par URL (`specsByUrl`), `instanceSpecFor` remplace `createProp`.
  - Pose asynchrone par GLB ; colliders inchangés (données, pas de draw call).
  - Import `attachGltf` retiré au profit de `buildGltfInstances`.

## Tests (sanity three réel, sandbox)

- Position monde d'un sommet : voie instancing vs ancien prop → delta **1.3e-15** (identique).
- Reset scale entre instances (template réutilisé) : scales `[1.5, 0.75, 3.0]` ==
  modèles neufs par hauteur → pas de dérive d'échelle.
- Revue statique : pas de `any`, pas de DOM, pas de réseau. Conforme CLAUDE.md.
- Windows : typecheck OK, lint OK, build OK (2026-06-26).
- FPS/draw calls réels : audit navigateur à faire.

## Risques

- Pas d'animation par-instance (végétation statique → OK). Vent futur = shader d'instance.
- Frustum culling au niveau de l'InstancedMesh (bornes incluant instances) : un cluster
  Ouest reste localisé, acceptable.
- Ordre de parcours des feuilles supposé stable entre instances (vrai : seules les
  transforms changent, pas la hiérarchie).

## Suite (ordre Shan)

1. ~~Instancing palmiers/rochers Ouest~~ (fait).
2. Audit perf draw calls (avant/après, mobile).
3. Code-splitting bundle (Vite/Rolldown ; lazy Rapier/Colyseus/Tauri ; séparer `mapDebug`).
4. LUT color grading en polish DA, après stabilisation caméra + biomes + matériaux.
- Aussi : boundary rocks Fournaise en instancing.
