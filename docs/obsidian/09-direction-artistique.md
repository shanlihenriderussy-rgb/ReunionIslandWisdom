# Direction Artistique — Reunion Island Wisdom

## Intention générale

Low-poly stylisé, tropical, lisible. Pas de réalisme, pas de caricature.
La Réunion doit être **reconnaissable** sans être une carte postale.

Registre visuel cible : chaleureux, vivant, légèrement magique.
Référence visuelle prioritaire depuis 2026-05-31 : board 6 images fourni par Shan, avec scènes low-poly tropicales très lisibles.
Références d'ambiance : Windwaker (clarté), A Short Hike (cosy), Spiritfarer (émotionnel).

References projet :

- Moodboards et palettes locales : [[20-references-visuelles]]
- Fichiers source : `docs/Refs`
- Avant toute zone / asset / biome : consulter la reference correspondante.

---

## Palette "Jour Tropical" — palette principale

| Rôle | Hex | Usage |
|---|---|---|
| Ciel | `#9ED3F2` | background + clear color |
| Brume | `#B9DCEF` | fog color (Three.js) |
| Soleil | `#FFE2A5` | DirectionalLight |
| Ciel hémisphère | `#E8F4FF` | HemisphereLight sky |
| Sol hémisphère | `#5F8E44` | HemisphereLight ground |
| Océan / lagon | `#19AECA` | PlaneGeometry ocean |
| Sol / plaza | `#C4956A` | terracotta réunionnais |
| Route | `#2D3030` | asphalte |
| Stripes route | `#F4C430` | car jaune yellow → accent brand |
| Car Jaune | `#F4C430` | brand color iconique, ne pas changer |
| Végétation claire | `#7DBE5C` | arbres, herbes |
| Végétation sombre | `#4A7C3F` | ombres végétation |
| Basalte / volcan | `#2A2624` | lava rocks, rocher noir |
| Terracotta foncé | `#8B4513` | détails sol, bordures |
| Créole mur | `#F5E6D0` | architecture (futur) |
| Créole toit | `#C0392B` | toits (futur) |
| Créole ferronnerie | `#2E8B8B` | fenêtres, balcons (futur) |

---

## Lumière — Saint-Denis Hub (zone par défaut)

```txt
Heure : fin de matinée (10h-11h)
Ambiance : chaleur douce, ombres courtes, lisible
```

| Lumière | Valeur actuelle | Valeur cible |
|---|---|---|
| Clear color | `#101410` | `#87CEEB` |
| Fog color | `#101410` | `#C0E0F0` |
| Fog near | 100 | 80 |
| Fog far | 230 | 220 |
| Hemi sky | `#DDE8FF` | `#D4E8FF` |
| Hemi ground | `#29351F` | `#4A7C3F` |
| Hemi intensity | 1.6 | 1.4 |
| Sun color | `#FFE2B0` | `#FFF0B0` |
| Sun intensity | 2.2 | 2.8 |
| Sun position | (18, 26, 12) | (18, 26, 12) → ok |

---

## Identité visuelle par zone

### Saint-Denis Hub
- Heure : matin chaud
- Fog : `#C0E0F0` clair
- Sol : terracotta `#C4956A`
- Architecture créole à intégrer progressivement
- Végétation dense en périphérie

### Route du Littoral
- Heure : après-midi, lumière rasante
- Fog : `#D4EEF4` plus marin
- Sol : asphalte noir, accotement basalte `#2A2624`
- Océan visible, palmiers côtiers
- Ambiance : circulation, tension comique

### Volcan / Plaine des Sables
- Heure : coucher de soleil, dramatique
- Fog : `#F0C8A0` orange chaud
- Sol : sable beige-gris `#C8B89A`, basalte `#2A2624`
- Lumière soleil orange `#FF8C42`, intensité haute
- Atmosphère : mystérieuse, épique

---

## Personnages

| Rôle | Couleur capsule | Notes |
|---|---|---|
| Joueur local | `#F2C66D` | golden, lisible sur fond clair |
| Joueur distant | `#6BC9B5` | teal, différencié |
| PNJ | `#E05F42` | orange-rouge vif → à garder |

Modèles : Kenney Mini Characters CC0.
Priorité V1 : même modèle pour tous → OK.
Priorité V2 : variation par genre/tenue (robe créole, bob, etc.)

---

## Props — base propre

Etat depuis 2026-05-31 :
- props placeholder retires du hub ;
- `mini-characters` garde uniquement les personnages de test ;
- Vierge procedurale = landmark temporaire ;
- sable ouest / sud-ouest = biome placeholder.

Etat depuis 2026-06-05 :
- assets regroupes par secteurs dans `WORLD_OBJECT_SECTORS` ;
- props terrestres replacés sur l'île, hors eau ;
- eau autorisée seulement pour ports/pontons/bateaux/epaves ;
- echelle monde passee a `targetLongestSide 220` pour rendre les personnages plus petits face a l'île.

Regle : **un prop doit justifier sa place**.
Chaque futur asset doit etre rattache a une zone, une quete, un role gameplay et un budget perf.
Props Reunion custom (kiosk, case creole, samoussa stand, Car Jaune final) -> GLB dedie apres validation level design.

---

## UI / HUD

Style V1 integre le 2026-06-06 : [[23-design-system-hud]].

Direction : platform-adventure tropical cartoon.

- DOM HUD par-dessus canvas Three.js.
- Panneaux basalte sombres avec contours noirs epais.
- Accent UI : `#F4C430` (Car Jaune yellow) pour action, quete, focus.
- Dialogue PNJ : cartouche bois clair.
- Boutons : relief cartoon avec lip sombre.
- Mobile : cibles tactiles >= 44 px.
- Pas d'import Google Fonts runtime ; fallback systeme si `Paytone One` / `Nunito` absentes.
- Pas de fausse jauge, minimap ou inventaire tant que le gameplay ne les fournit pas.

---

## Rendu terrain (2026-06-06)

- Sol des chunks RGE ALTI en **flat shading** (`flatShading: true` dans `ChunkStreamer.applyTerrainChunkMaterial`).
- Raison : le lissage des normales rendait le sol en "bouillie" floue. Les facettes nettes donnent le look low-poly du moodboard et laissent lire ravines/pentes.
- Couleurs par vertex (COLOR_0) deja generees par `build-lareunion-dem-terrain.mjs` (sable/herbe/roche/volcan selon altitude/pente).
- Geometrie chunks non-indexee -> flat shading sans surcout (meme nb de triangles).
- Si facettes trop grosses de pres : augmenter `--gridX/--gridZ` a la regeneration, ou micro-texture bruit tileable (decision a acter).

## Ce qu'il ne faut PAS faire

- Pas de HDR / bloom fort : on reste flat-ish low-poly.
- Pas de textures photo-réalistes : MeshStandardMaterial roughness 0.7+ partout.
- Pas de personnages ultra-réalistes dans la même scène que du Kenney.
- Pas de couleurs trop saturées isolées : la palette doit être cohérente.
- Pas de nuit permanente : le clear color sombre actuel doit être corrigé.

---

## Décisions liées

- [[04-decisions]] ADR-001 : Three.js + GLB
- [[05-asset-pipeline]] : Kenney CC0 uniquement en V1

## Prochaines étapes DA

- [ ] Valider palette sur écran mobile (couleurs moins saturées en outdoor)
- [ ] Définir style créole architecture V2 (Blender mockup)
- [ ] Créer 3 props Réunion custom V2 : kiosk, case créole, panneau ravine
- [ ] Valider tons avec testeurs réunionnais
## Cible board 6 images

Le jeu doit tendre vers des scenes jouables qui ressemblent au board fourni :

- plage ouest : lagon turquoise, sable clair, rochers noirs, ponton, barque, palmiers, petite case ;
- volcan : basalte noir, sol brun/gris, rochers anguleux, vegetation rare, silhouettes fortes ;
- Salazie : falaise verte, cascades, riviere turquoise, pont bois, vegetation dense ;
- Mafate / Cilaos : sentier montagne, ponts, tentes/campement, ravines, vues profondes ;
- Route du Littoral : falaise basaltique, ocean, chemin cotier lisible, rambardes/rochers ;
- Saint-Denis : place creole compacte, toits chauds, palmiers, murets, petit mobilier.

Implication level design : on ne cherche pas une carte geographique plate comme rendu final. La vue carte sert a se reperer. La vue jouable doit construire des dioramas par biome, avec relief, chemin, props et cadrage camera.

## Recette runtime B0 Global

Mise a jour 2026-06-06 18:31 +04:00 : [[iterations/2026-06-06-global-moodboard-runtime]]

Pour tendre vers le moodboard global, la bonne methode n'est pas de peindre toute la carte.

Ordre de production :

1. choisir une zone jouable ;
2. poser le chemin et les limites naturelles ;
3. ajouter les grappes d'assets autour du chemin ;
4. renforcer l'ambiance locale : eau, ecume, ciel, brume, lumiere ;
5. regler la camera pour cadrer la scene comme un diorama jouable ;
6. seulement ensuite remplacer les placeholders par assets Reunion custom.

Etat V1 :

- Saint-Paul / Saint-Gilles a une couche scenic dediee ;
- kiosk snack procedural ;
- palmiers, rochers, feuillages et panneaux regroupes autour du parcours ;
- ecume et patchs lagon proceduraux ;
- camera third-person abaissee.

Regle DA :

- Un biome = un vertical slice jouable complet.
- Ne pas remplir toute l'ile avec des props moyens.
- Construire des scenes fortes et lisibles, puis etendre.

## Rendu runtime actuel

- Tone mapping ACES + exposition chaude.
- Ciel/brume/eau recalés vers la cible board.
- Vue `?mapDebug` garde le HUD carte sans zones colorees.
- Zones colorees disponibles seulement via `?biomeDebug`.
- Terrain chunké : couleurs bakees dans les GLB depuis le generateur DEM, avec normales globales pour eviter les hachures nettes entre chunks.
- Sable : plus de ruban vectoriel runtime. Les zones sable sont fusionnees au terrain par vertex colors, uniquement sur Saint-Paul/Saint-Gilles, sud et nord-ouest basse altitude.
- Troisieme personne : camera rapprochee conservee. L'effet "joueur plus petit que la carte" vient de l'echelle monde, pas d'un recul camera.
- Iteration 2026-06-05 21:37 : mesh terrain passe a `320 x 288`, couleurs renforcees par altitude/secteur/pente, brume repoussee pour une meilleure lecture en vue carte.
