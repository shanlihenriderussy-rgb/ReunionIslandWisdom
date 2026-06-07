# 23 - Design system HUD

> Lie a [[09-direction-artistique]] [[20-references-visuelles]] [[22-synthese-publique-neophyte]].
> Statut : INTEGRE V1.

## Source

Archive utilisateur :

```txt
C:\Users\Shan li\Downloads\Reunion Island Wisdom design system.zip
```

Integration repo :

```txt
docs/design-system/hud/
apps/game-client/src/design-tokens.css
apps/game-client/src/styles.css
```

## Direction

Le HUD doit suivre une direction **platform-adventure tropical cartoon** :

- panneaux basalte sombres ;
- contours noirs epais ;
- boutons jaunes en relief ;
- cartouches bois pour dialogues ;
- typographie arrondie type `Paytone One` / `Nunito` avec fallback systeme ;
- cibles tactiles de 44 px minimum ;
- lisibilite plein soleil mobile.

## Tokens principaux

- `--color-cta` : jaune Car Jaune / action.
- `--hud-panel` : panneau basalte translucide.
- `--hud-ink` : texte clair.
- `--hud-gold-ink` : libelles dorés.
- `--wood-panel` / `--wood-ink` : dialogue PNJ.
- `--sh-pop` / `--sh-cta` / `--sh-wood` : relief cartoon.
- `--touch-min` : cible tactile minimale.

## Runtime V1

Composants mis a jour :

- objectif ;
- statut connexion ;
- bouton pause ;
- toggle carte/jouer ;
- slider zoom ;
- chat ;
- prompt PNJ ;
- dialogue PNJ ;
- pause ;
- debug map.

Captures :

![[iterations/2026-06-06-design-system-hud/design-system-hud-desktop.png]]

![[iterations/2026-06-06-design-system-hud/design-system-hud-mobile-mapdebug.png]]

## Decisions

- Les tokens du ZIP sont conserves tels quels dans `docs/design-system/hud/tokens.css`.
- Le runtime charge une copie dans `apps/game-client/src/design-tokens.css`.
- Le board `.riw-*` reste en reference ; on ne renomme pas tout le HUD tant que les composants gameplay ne sont pas stabilises.
- Pas d'import externe Google Fonts en runtime. Le CSS declare les familles, mais laisse le fallback systeme si elles ne sont pas installees.
- Les composants non branches du mockup (gauges, minimap, reward, toast, inventaire) restent non actifs tant que le gameplay ne les porte pas.
- 2026-06-07 : joystick tactile + bouton action "E" branches pour le mobile. Visibles uniquement sur pointeur grossier (`@media (pointer: coarse)`), masques en pause / vue carte / modale. Alimentent `InputController` (`setTouchVector`, `pressInteract`), pas de logique gameplay cote HUD. Classes : `.hud-touch-controls`, `.hud-joystick`, `.hud-joystick__thumb`, `.hud-action-btn`.

## Limites

- Le HUD mobile `?mapDebug` reste dense en bas si le debug est affiche en meme temps que le chat.
- Les polices exactes dependent de la presence locale de `Paytone One` / `Nunito`.
- Les pictos du mockup ne sont pas encore migrés en composants runtime.

## Suite

- Migrer les composants HUD vers une nomenclature stable `.riw-*` quand le gameplay sera fige.
- Ajouter les pictos en SVG internes, pas via package externe.
- Creer une vraie minimap seulement quand le systeme de carte est defini.
