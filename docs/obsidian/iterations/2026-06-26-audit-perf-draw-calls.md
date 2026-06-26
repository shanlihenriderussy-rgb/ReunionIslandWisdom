# 2026-06-26 - Audit perf draw calls

## Scope

- Mesure runtime via `?perfDebug`.
- Probe limite a `window.__RIW_PERF__` : FPS lisse, frame ms, `renderer.info.render`, `renderer.info.memory`, programmes shader, enfants scene.
- Captures Playwright Edge headless.

## Resultats

| Vue | FPS median | Frame ms median | Draw calls | Triangles | Geometries | Textures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop gameplay | 143.2 | 6.98 | 128 | 194575 | 142 | 37 |
| Mobile Pixel 5 | 143.5 | 6.97 | 106 | 147497 | 118 | 34 |
| Carte debug | 143.4 | 6.97 | 246 | 475818 | 222 | 43 |

Captures :

- `docs/obsidian/iterations/2026-06-26-audit-perf-draw-calls/desktop.png`
- `docs/obsidian/iterations/2026-06-26-audit-perf-draw-calls/mobile-pixel5.png`
- `docs/obsidian/iterations/2026-06-26-audit-perf-draw-calls/mapdebug.png`

## Findings

- Gameplay Ouest : budget draw calls acceptable apres P3 instancing.
- Mobile : cout rendu inferieur au desktop car cadrage plus serre.
- Carte debug : cout presque double. Cible perf suivante = LOD/culling carte, pas instancing vegetation.
- Console : Colyseus offline en local attendu pendant ce test.
- Console desktop : plusieurs `Failed to fetch` sur chunks terrain et GLB Kenney pendant la session. Les fichiers existent dans `public/assets`; mesure desktop a donc une limite de validite et doit etre reprise apres stabilisation serveur/cache si on veut un chiffre release strict.

## Decision

- Garder `?perfDebug` comme outil de QA local.
- Ne pas ajouter SpectorJS au runtime.
- Prochain chantier perf : reduire la vue carte (`?mapDebug`) avec LOD terrain/props ou culling de details hors zone utile.
