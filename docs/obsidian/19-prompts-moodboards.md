# 19 — Prompts GPT Image — Moodboards & style boards

> Lié à [[09-direction-artistique]] [[14-phase-3-contenu]] [[bible-reunion]] [[zones]].
> But : générer des **références visuelles** pour guider le dev. Pas des assets finaux.
> MAJ : 2026-05-31.

## Règles d'usage

- Sortie = **moodboard / style reference uniquement**. Jamais importé tel quel dans le jeu.
- Style imposé : **low-poly stylisé, lisible, mobile-first, pas de photo-réalisme** (voir [[09-direction-artistique]]).
- Ancrage Réunion réel : reliefs, littoral, créole. Pas de cliché touristique vide.
- Ranger les sorties dans `docs/obsidian/assets/moodboards/<theme>/` puis lier dans [[09-direction-artistique]].
- Réglages conseillés : format **16:9** (boards), **1:1** (palette/props sheet). Qualité haute.

## Bloc style commun (à préfixer/coller dans chaque prompt)

```txt
STYLE: stylized low-poly 3D game art, clean flat-shaded faces, soft toon lighting,
minimal texture detail, readable silhouettes, mobile-friendly low triangle count look,
subtle ambient occlusion, no photorealism, no hyperreal textures, no text, no watermark,
no UI overlay, cohesive color grading. Moodboard / style reference sheet layout,
multiple framed thumbnails arranged on a neutral dark grey board.
```

---

## A. Master moodboard — identité globale

```txt
Stylized low-poly 3D game moodboard for a Reunion Island MMORPG.
A reference board with 6 to 9 framed thumbnails on a neutral dark grey background.
Thumbnails show: a low-poly volcanic mountain ridge, a tropical west-coast lagoon with
turquoise water, deep green mountain cirque valleys, a basalt black-sand coastline,
lush ravines with waterfalls, warm creole-island light at golden hour.
STYLE: stylized low-poly 3D game art, flat-shaded faces, soft toon lighting, minimal
texture detail, readable silhouettes, mobile-friendly low-poly look, subtle ambient
occlusion, no photorealism, no text, no watermark, no UI. Cohesive warm tropical palette
(volcanic black, deep jungle green, ocean turquoise, warm sand, sky blue).
16:9 reference sheet.
```

---

## B. Moodboards par zone

Réutiliser le bloc style commun. Une zone par génération.

### B1. Saint-Paul / Saint-Gilles — littoral ouest (zone de départ)

```txt
Low-poly stylized game moodboard, west coast of a tropical island: calm turquoise lagoon,
coral reef line, light golden sand beach, low palm trees, small creole seaside village
rooftops in the distance, gentle hills behind. Bright sunny mood, relaxed starting-zone
feel. STYLE: stylized low-poly 3D, flat-shaded, soft toon light, readable shapes,
mobile-friendly, no photorealism, no text, no watermark. 16:9 reference sheet of 6 thumbnails.
```

### B2. Piton de la Fournaise — volcan actif

```txt
Low-poly stylized game moodboard, active basaltic shield volcano: dark hardened lava fields,
caldera, faint red glow vents, sparse vegetation, dramatic barren terrain, ash-grey and
volcanic-black palette with ember orange accents. Awe and danger mood. STYLE: stylized
low-poly 3D, flat-shaded, soft toon light, mobile-friendly, no photorealism, no text,
no watermark. 16:9 reference sheet of 6 thumbnails.
```

### B3. Cirque de Mafate — montagne isolée

```txt
Low-poly stylized game moodboard, remote mountain cirque: steep green ridges, deep valleys,
scattered small mountain cabins (ilet), narrow hiking trails, misty peaks, isolation and
adventure mood. Deep greens, slate rock, soft mist. STYLE: stylized low-poly 3D, flat-shaded,
soft toon light, mobile-friendly, no photorealism, no text, no watermark. 16:9 sheet, 6 thumbnails.
```

Complement terrain reel 2026-06-27 — hauts du Maido / Mafate :

```txt
Add a colder highland Maido/Mafate variant: heavy low clouds, mist rolling over ridges,
dark silhouettes of tamarind-like and cryptomeria-like trees, wind-bent shrubs, dry brown
grass, grey-green terrain, open moorland patches, distant ridges fading into blue-grey fog.
Keep it stylized low-poly and readable, not photorealistic. No imported photo texture.
```

### B4. Cirque de Salazie — eau & cascades

```txt
Low-poly stylized game moodboard, lush green mountain cirque full of waterfalls: tall thin
cascades, dense tropical vegetation, wet rock faces, rainbow mist, vivid saturated greens
and blues. Fresh, alive mood. STYLE: stylized low-poly 3D, flat-shaded, soft toon light,
mobile-friendly, no photorealism, no text, no watermark. 16:9 sheet, 6 thumbnails.
```

### B5. Cirque de Cilaos — thermes & montagne

```txt
Low-poly stylized game moodboard, high mountain village cirque: terraced lentil fields,
vineyards, thermal spa rooftops, sharp surrounding peaks, warm earthy palette with green
terraces. Calm highland mood. STYLE: stylized low-poly 3D, flat-shaded, soft toon light,
mobile-friendly, no photorealism, no text, no watermark. 16:9 sheet, 6 thumbnails.
```

### B6. Saint-Denis — hub urbain créole

```txt
Low-poly stylized game moodboard, creole capital city hub: colorful creole houses with
verandas and lambrequins, small market squares, palm-lined streets, low colonial-era
buildings, lively but cozy urban scale. Warm pastel facades, tropical greenery. STYLE:
stylized low-poly 3D, flat-shaded, soft toon light, mobile-friendly, no photorealism,
no text, no watermark. 16:9 sheet, 6 thumbnails.
```

### B7. Route du Littoral — axe côtier

```txt
Low-poly stylized game moodboard, iconic coastal cliff road: long road hugging tall basalt
cliffs above the ocean, rockfall netting, waves crashing below, dramatic scale. Greys,
ocean blue, sky. Travel and event mood. STYLE: stylized low-poly 3D, flat-shaded, soft
toon light, mobile-friendly, no photorealism, no text, no watermark. 16:9 sheet, 6 thumbnails.
```

---

## C. Style asset boards (guides de prod)

### C1. Palette de couleurs par zone

```txt
A clean color palette reference sheet for a stylized low-poly tropical island game.
Show 6 horizontal palette rows, each labeled by a color swatch group only (no text):
1 volcanic zone (blacks, ash grey, ember orange), 2 west lagoon (turquoise, sand, sky),
3 mountain cirque (deep greens, slate), 4 waterfalls cirque (vivid green, water blue),
5 creole city (warm pastels), 6 highland (earthy terracotta, terrace green).
Flat swatches, neutral dark background, organized grid. No photorealism, no text labels,
no watermark. 1:1 reference sheet.
```

### C2. Style sheet props low-poly (mobilier / nature)

```txt
Stylized low-poly 3D asset style sheet on a neutral grey studio background. Grid of small
isolated game props rendered consistently: palm tree, tropical plant, basalt rock, wooden
fence, market stall, water barrel, small creole house, signpost. Flat-shaded, soft toon
lighting, low triangle count look, consistent scale, readable silhouettes. Each prop
separated in its own cell. No photorealism, no text, no watermark. 1:1 asset board.
```

### C3. Style sheet avatars / PNJ

```txt
Stylized low-poly 3D character style sheet, neutral grey background. Row of simple
friendly humanoid characters with clean readable silhouettes, slightly stylized proportions,
flat-shaded clothing, soft toon shading. Diverse creole-island casual outfits, no faces in
high detail. T-pose and idle pose references side by side. Consistent height scale (1 unit
= 1 meter feel). No photorealism, no text, no watermark. 16:9 character reference board.
```

### C4. Material / shading reference (toon look)

```txt
A shading reference board for a stylized low-poly game: same low-poly rock and palm tree
shown under 4 lighting setups (morning, noon, golden hour, overcast), demonstrating soft
toon shading, gentle ambient occlusion, flat faces, no specular highlights, no photorealism.
Neutral dark background, 4 framed comparison cells. No text, no watermark. 16:9 sheet.
```

### C5. Terrain / biome silhouette board

```txt
Stylized low-poly terrain silhouette reference board for a volcanic tropical island:
side-profile thumbnails of distinct landforms — sharp volcanic peak, deep cirque valley,
coastal cliff, gentle lagoon shore, ravine canyon, rolling highland. Emphasis on readable
silhouettes and slope shapes for level design. Flat-shaded low-poly, neutral background.
No photorealism, no text, no watermark. 16:9 sheet, 6 thumbnails.
```

---

## D. Workflow

1. Générer board par board (zone + style sheets).
2. Trier dans `docs/obsidian/assets/moodboards/`.
3. Sélectionner les retenus → lier dans [[09-direction-artistique]] et trancher : palette, détail props, post-process.
4. Les boards deviennent la **référence opposable** pour valider chaque asset via [[05-asset-pipeline]].

## Rappel

Ces images guident la DA. Les assets jeu restent produits dans le pipeline (source/licence/budget perf). Pas d'import direct d'image IA comme texture/mesh.
