# 2026-06-05 20:37 - Playtest visuel terrain IGN `?mapDebug`

## Contexte

- URL testee : `http://localhost:5173/?mapDebug`.
- Capture : `output/playwright/mapdebug-ign-streamer-final.png`.
- Source terrain : `IGN RGE ALTI D974`.
- Streamer : chunks `4 x 4`, vue Carte = tous les chunks, vue Jouer = anneau autour du joueur.

## Resultat visuel

- Ile complete visible en vue carte.
- Piton des Neiges / massif central lisible.
- Piton de la Fournaise lisible au sud-est.
- Cirques et ravines lisibles en lecture globale.
- Littoral ouest Saint-Paul / Saint-Gilles coherent.
- Artefact haut-gauche supprime en ignorant les chunks `triangles <= 0`.

## Points a surveiller

- Le relief est techniquement fiable, mais le rendu reste tres uniforme : trop vert, pas assez biome.
- L'exageration verticale doit etre reglee apres comparaison avec refs.
- Les props restent approximatifs et doivent etre remplaces par dioramas jouables par zone.
- FPS observe sur capture : environ `20 fps` en vue carte avec tous chunks charges. A profiler sur desktop/mobile.

## Verdict

Validation carte : OK.

Suite conseillee :

1. Reglage `verticalExaggeration`.
2. Coloration/materials par biome.
3. Vue jouable Saint-Paul / Saint-Gilles en diorama.
