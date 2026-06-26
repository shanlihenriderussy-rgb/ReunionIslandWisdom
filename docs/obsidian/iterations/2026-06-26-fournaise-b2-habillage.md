# 2026-06-26 — Fournaise : habillage fidèle au moodboard B2

> Lié à [[../12-phase-1-level-design]] [[../20-references-visuelles]] [[../09-direction-artistique]] [[../04-decisions]] (ADR-013).
> Lane : **Claude = zone Fournaise + continuité zones**. **Codex = Ouest (départ, spawn, fidélité B1)**. Division actée par Shan le 2026-06-26 pour éviter le clobber mutuel.

## Objectif

Rapprocher la zone Piton de la Fournaise du moodboard de référence **B2** (`docs/Refs/Moodboards par zone/B2. Piton de la Fournaise — volcan actif`), en pur procédural, sans nouvel asset externe, en conservant l'existant.

## Lecture B2 (références extraites)

- Champ de lave noire à **fissures incandescentes** (orange) entre les rochers de basalte.
- **Orgues basaltiques** (colonnes hexagonales) en signature.
- Fumerolles / panaches de vapeur, scories, basalte sombre.
- **Lumière chaude dramatique** près de la lave.
- Végétation rare en bordure (NON ajoutée ici : règle CLAUDE.md « pas de props décoratifs random » + hors périmètre DA acté basalte/scories/fumée).

## Diff (un seul fichier : `apps/game-client/src/render/fournaise.ts`)

Ajouts procéduraux, l'existant (rochers rebord, scories, fumerolles, cône, cairn, repère, lueur de lave) conservé :

- **Veines de lave** (`makeLavaCrack`) : 12 fines barres émissives additives posées au sol entre les rochers, seedées, centre du cratère évité. Animées (pulsation) via `updateFournaiseFx`.
- **Orgues basaltiques** (`makeBasaltColumns`) : grappe de 7 colonnes hexagonales (`CylinderGeometry` 6 côtés), hauteurs variées, posée au nord-est du rebord.
- **Lumière chaude du cratère** (`makeCraterLight`) : `PointLight` orange portée bornée (distance 18, decay 2), pulsation douce. Nouveau registre `lavaLights` + reset au rebuild (pas de fuite mémoire).

## Tests

- `typecheck` + `lint` client = **verts**.
- Live (`pnpm dev`) : **non vérifié** — serveur de dev tombé au moment du check (ports 5173/2567 fermés, ~10 process node = Codex édite l'Ouest en parallèle). Non relancé volontairement pour ne pas builder l'état mi-écrit de Codex.

## Risques / suite

- Intensité de la `PointLight` (base 6) réglée à l'aveugle (pas de live) : à ajuster au prochain run pour éviter sur/sous-exposition.
- Vérifier le rendu des veines additives en plein jour (peuvent être trop discrètes ou trop vives selon l'exposition `toneMappingExposure 1.28`).
- Quand Codex aura figé l'Ouest : relancer `pnpm dev`, se rendre à la Fournaise (ou la remettre temporairement en spawn), capturer, comparer à B2.
- Continuité autres zones (B3 Mafate, B4 Salazie, B5 Cilaos, B6 Saint-Denis, B7 Route du Littoral) : à habiller ensuite sur le même modèle procédural.
