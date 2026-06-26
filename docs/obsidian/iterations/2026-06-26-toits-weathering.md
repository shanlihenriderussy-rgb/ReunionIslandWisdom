# 2026-06-26 — Weathering toits + report LUT (P2)

> Suite lot graphismes [[25-graphismes-ameliorations]]. Prise en compte de la passe
> de correction Codex [[2026-06-26-codex-correction-claude]] (baseline verte).

## Contexte

- Codex a validé/corrigé la passe Claude (fix TS gradient océan, HUD objectifs
  Saint-Paul/Saint-Gilles, zone initiale Ouest, chemin `westBlockout` vertex-color).
  typecheck/lint/build OK chez Codex.
- Reprise P2 sur baseline corrigée. Item visé : weathering toits + color grading.

## Diff

- `render/westScenic.ts`
  - `weatherRoof(geometry, material)` : gradient vertical en vertex colors sur les
    cônes de toit. Faîte éclairci (×1.05, soleil), avant-toit assombri (×0.72) +
    légère rouille (biais rouge en bas). Multiplie la teinte du matériau → couleur
    de base conservée. Pur runtime, aucun asset.
  - Cases créoles : `weatherRoof` sur le toit (matériau dédié).
  - Kiosk snack : matériau toit **cloné** avant weathering ; le panneau garde `roof`
    plat (le matériau était partagé toit+panneau → sinon vertexColors sans attribut
    couleur sur le panneau).

## Décision : LUT color grading reportée

- Le plan demandait une LUT `jourTropical` 16³ inline.
- Aucun pipeline post-process (`EffectComposer`) dans le projet.
- L'ajouter = pass plein écran + recompil shader, coût GPU mobile → contraire aux
  garde-fous ([[25-graphismes-ameliorations]] : "pas de recompil shader lourde mobile").
- Reporté : exposure (1.28) + `PCFSoftShadowMap` déjà en place couvrent l'essentiel
  du grading sans pipeline. Décision archi à acter avant d'implémenter la LUT.

## Tests

- Sanity node : brillance toit ∈ [0.72, 1.05] (faîte > avant-toit), rouge ≥ brillance
  partout (avant-toit plus chaud). OK.
- Panneau kiosk conserve `roof` plat (matériau non muté). Vérifié grep.
- Revue statique : pas de `any`, pas de DOM, pas de réseau. Conforme CLAUDE.md.
- typecheck/lint/build : à relancer sous Windows (sandbox `spawn EPERM`).

## Risques

- Vertex colors > 1.0 sur le faîte (1.1 max) : éclaircit légèrement, pas de clipping gênant.
- Subtil sur cône 4 segments ; lisible surtout en plan rapproché caméra "diorama".

## Suite

- Capture `?mapDebug` avant/après sous Windows.
- P2 restant : eau normalMap (en attente asset licencié) ; LUT si décision archi.
- P3 : instancing palmiers/rochers (perf, bundle > 500 kB signalé par Codex).
