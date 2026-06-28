# Systeme de jeu

## Intention

`Reunion Island Wisdom` n'est pas centre sur le combat.

> MAJ 2026-06-27 (ADR-015) : un combat PvE LEGER est ajoute sur decision de Shan. Il reste secondaire :
> l'exploration, l'entraide et la culture locale demeurent les piliers. Voir section « Combat » plus bas.
> Toujours PAS de PvP.

C'est avant tout un jeu social d'exploration locale :

- decouvrir La Reunion par zones ;
- aider des PNJ ;
- comprendre les lieux ;
- gerer des petits evenements collectifs ;
- debloquer titres, emotes et souvenirs.

Le fun vient de l'exploration, de la cooperation legere, de l'humour local, de la progression sociale et des events serveur.

## Piliers

| Pilier | Description | A eviter |
| --- | --- | --- |
| Exploration | Traverser zones, points de vue, ravines, littoral, volcan | Carte vide ou touristique plate |
| Entraide | Petites actions utiles pour PNJ/zone | Combat grind |
| Culture locale | Food, musique, meteo, relief, transport, sentiers | Caricature |
| Social leger | Chat, emotes, titres, regroupements | Systeme social lourd |
| Events serveur | Bouchon, cyclone, eruption, kabar | Events cosmetiques sans gameplay |

## Verbes joueur

V1 :

- marcher ;
- observer ;
- parler ;
- ramasser ;
- livrer ;
- inspecter ;
- attendre ;
- aider ;
- emote ;
- chatter.

V2 :

- cuisiner simple ;
- reparer ;
- guider ;
- proteger ;
- suivre un sentier ;
- jouer du kayamb ;
- preparer un sac.

Ajoute 2026-06-27 (ADR-015) :

- attaquer une cible PvE (combat leger).

Ajoute 2026-06-27 :

- sauter avec `Espace` ;
- collisionner avec les reliefs hauts au lieu de traverser les pentes/plateaux.

Pas en V1 :

- PvP ;
- trading ;
- economie ;
- housing ;
- craft complexe.

## Deplacement et collisions

Runtime actuel : `apps/game-client/src/game/GameApp.ts`, `InputController.ts`, `collision.ts`.

Logique V1 :

- le serveur recoit toujours une intention 2D (`x`, `z`, `cameraYaw`) ;
- le client predit la position locale pour garder une sensation immediate ;
- la hauteur `y` vient du heightfield terrain RGE ALTI quand le chunk est charge ;
- fallback : collision globale `reliefCollision`, puis hauteur `0` si asset absent ;
- `Espace` declenche un saut uniquement si le joueur est au sol ;
- gravite locale : la vitesse verticale descend jusqu'a retomber sur le sol sonde ;
- le joueur est recale au sol seulement quand il touche le heightfield en descente ;
- pendant un saut, le `y` n'est plus ecrase a chaque frame.

Resolution collision :

1. on propose une nouvelle position horizontale depuis l'input ;
2. on verifie si le point reste dans la zone jouable ;
3. on sonde la hauteur du sol a l'ancienne position et a la position cible ;
4. si la marche montante est trop haute, le deplacement est refuse ;
5. si la chute descendante est trop profonde, le deplacement est refuse ;
6. si le joueur est en l'air, un relief plus haut devient solide tant que le joueur n'a pas assez de hauteur pour le franchir ;
7. on tente un fallback axe X seul puis axe Z seul pour glisser contre les bords ;
8. les colliders ronds des props/blockout repoussent ensuite le joueur ;
9. si le push prop remet le joueur hors terrain valide, retour a la position precedente.

Limite connue :

- le saut est local client ; pour synchroniser les autres joueurs en vertical, ajouter `y`, `vy` ou un evenement `jump` au protocole serveur.

## Boucle minute

```txt
Voir un repere
-> s'approcher
-> comprendre le besoin
-> faire une action courte
-> recevoir feedback local
-> avancer vers un autre repere
```

Exemple :

```txt
Le joueur voit un panneau / PNJ
-> parle
-> apprend "route bouchee"
-> inspecte 3 cones
-> aide a debloquer un passage
-> gagne titre "Patience 974"
```

## Boucle session 10-20 min

```txt
Spawn zone
-> objectif court
-> exploration d'un sous-lieu
-> 1 a 3 interactions
-> event ou mini-resolution
-> recompense sociale
-> retour hub / transition zone
```

Objectifs :

- comprendre quoi faire en moins de 30 secondes ;
- finir une micro-quete en moins de 5 minutes ;
- recevoir un souvenir, titre ou emote ;
- pouvoir jouer seul ou a 2-5 sans friction.

## Progression

Progression horizontale.

Pas de puissance brute.

Deblocages :

- titres ;
- emotes ;
- badges de zone ;
- souvenirs ;
- acces narratif ;
- variantes cosmetiques ;
- connaissance carte ;
- raccourcis de voyage.

| Systeme | Exemples |
| --- | --- |
| Titres | `Patience 974`, `Veilleur Volcan`, `Pret Sentier` |
| Emotes | saluer, danser maloya, attendre bouchon, pointer volcan |
| Badges | Littoral, Kabar, Mafate, Fournaise |
| Souvenirs | ticket car jaune, kayamb, pierre volcan, carnet ravine |

## Quetes

Format quete V1 :

```txt
PNJ donne contexte
-> objectif visible
-> action courte
-> validation serveur
-> feedback
-> recompense
```

Contraintes :

- 1 objectif principal ;
- 3 actions max ;
- pas de journal complexe au debut ;
- texte court ;
- distance interaction validee serveur ;
- pas de quete dependante d'un asset non valide.

Types :

| Type | Exemple Reunion | Gameplay |
| --- | --- | --- |
| Inspection | cones Route du Littoral | trouver / inspecter |
| Livraison | barquette / ticket / sac | prendre / livrer |
| Preparation | sac Mafate | checklist courte |
| Observation | fumee Fournaise | atteindre point de vue |
| Social | kabar | emote / regroupement |
| Meteo | cyclone | se mettre a l'abri / signaler |

## Combat (PvE leger, ADR-015)

Ajoute le 2026-06-27. Reste secondaire vs exploration. Pas de PvP.

Principe :

- cibles = entites PvE stationnaires, placees par zone (`packages/content/data/combat-targets.json`) ;
- le joueur envoie une intention d'attaque ciblee ; le serveur tranche tout ;
- **aggro sur coup** : une cible ne riposte QUE sur un joueur qui l'a frappee recemment (fenetre d'aggro), et seulement tant qu'il reste a portee. Pas de degats par simple proximite ;
- mort joueur -> respawn au spawn de zone apres delai ; mort cible -> respawn apres delai.

Reglage (`combatConfig` dans `@riw/shared`) :

| Cle | Valeur | Role |
| --- | --- | --- |
| `playerMaxHealth` | 100 | PV joueur |
| `attackRange` | 4 | portee attaque joueur (serveur) |
| `attackCooldownMs` | 650 | cadence attaque joueur (anti-spam) |
| `attackDamage` | 18 | degats par coup joueur |
| `targetAggroRange` | 5 | portee (leash) de riposte d'une cible aggro |
| `targetAggroDurationMs` | 5000 | duree d'aggro apres un coup (sinon cible passive) |
| `playerRespawnMs` | 4000 | delai respawn joueur |

Data cible (par entree) : `maxHealth`, `contactDamage`, `attackCooldownMs`, `respawnMs`.

Placement actuel (`combat-targets.json`) :

- Ouest (depart par defaut, ADR-016) : 3 cibles intro sur le sentier blockout, difficulte croissante (`galet-roulant`, `remous-ravine`, `embacle-ravine`).
- Fournaise (`?visualZone=fournaise`) : 3 aleas du volcan (`braise-errante`, `gardien-scorie`, `souffle-enclos`).

Serveur authoritative (anti-triche) :

- portee, cooldown, degats, mort, respawn decides serveur ;
- intention validee Zod (`attackIntentSchema`) ; le client n'envoie qu'un `targetId` ;
- joueur mort gele (pas de deplacement) jusqu'au respawn.

Etat (2026-06-27) :

- rendu client des cibles (procedural basalte) : FAIT ;
- barre de vie joueur (HUD, composant design `.riw-gauge`) : FAIT ;
- input attaque (touche F + bouton tactile) : FAIT ;
- feedback de coup (flash cible, anim de mort, flash joueur) + SFX procedural Web Audio : FAIT ;
- recompense a la destruction : souvenir annonce (notif HUD), envoye serveur-authoritative. NB : pas encore stocke (inventaire serveur = backlog).

Reste :

- equilibrage au ressenti (knobs `combatConfig` + data par cible) ;
- stockage reel des souvenirs quand l'inventaire serveur existe ;
- validation visuelle `?mapDebug` du placement des cibles.

## Events serveur

Un event = etat global ou instancie qui change une zone.

V1 :

- `bouchon-route-littoral`
- `alerte-cyclone`
- `fumee-fournaise`
- `kabar-soir`

Contrat cible :

```ts
type WorldEvent = {
  id: string;
  zoneId: string;
  phase: "idle" | "starting" | "active" | "resolved";
  startsAt: number;
  endsAt: number;
  participants: string[];
};
```

Regles :

- serveur source de verite ;
- timer serveur ;
- recompense serveur ;
- client affiche seulement.

## Zones gameplay

| Zone | Role systeme | Premier gameplay |
| --- | --- | --- |
| Saint-Paul / Saint-Gilles | depart, mouvement, observation | suivre littoral, trouver repere |
| Saint-Denis | hub social | chat, emotes, PNJ |
| Route du Littoral | event collectif | bouchon, inspection, patience |
| Fournaise | exploration risque naturel | observation fumee, sentier |
| Mafate | endurance / orientation | sac, ravines, points de vue |
| Salazie | eau / cascade / meteo | chemins glissants, ravines |
| Cilaos | montagne / thermes | preparation, montee, repos |

## Ressources joueur

V1 minimal :

- inventaire souvenirs ;
- titres ;
- emotes ;
- progression quetes ;
- position sauvegardee.

Pas de stats RPG en V1.

Option V2 :

| Ressource | Usage |
| --- | --- |
| Energie | marche longue, events sentier |
| Patience | bouchon / attente sociale |
| Memoire locale | connaissance / badges |
| Confiance PNJ | debloque dialogues |

## HUD gameplay

Minimal.

Toujours visible :

- zone active ;
- objectif court ;
- zoom ;
- statut connexion.

Contextuel :

- prompt action ;
- feedback event ;
- chat ;
- pause ;
- debug `?mapDebug`.

Pas de :

- mini-map permanente au debut ;
- journal lourd ;
- barres RPG ;
- multiples cartes flottantes.

## Multijoueur

Objectif V1 :

- co-presence simple ;
- chat local ;
- event commun ;
- emotes visibles.

Regles :

- pas de trading ;
- pas de PvP ;
- pas de collision joueur-joueur au debut ;
- presence sociale > competition.

## Anti-triche

Le client envoie :

- intention mouvement ;
- intention interaction ;
- message chat ;
- intention emote.

Le serveur valide :

- vitesse ;
- position ;
- distance action ;
- cooldown ;
- etat event ;
- recompense.

## Ordre de build

1. Terrain fiable.
2. Zones + chunks.
3. PlayerView invisible + camera + HUD.
4. Objectif court sans PNJ.
5. Interaction serveur generique `inspect`.
6. Premier event : `bouchon-route-littoral`.
7. Reintroduction PNJ cible.
8. Emotes.
9. Inventaire souvenirs.
10. Sauvegarde position.

## Definition of Fun V1

Le prototype est bon si :

- on reconnait La Reunion sans texte explicatif ;
- on comprend ou aller ;
- on fait une action utile en moins de 2 minutes ;
- un autre joueur peut aider ou reagir ;
- la recompense donne envie de rester ;
- le ton reste local sans caricature.

## Liens

- [[20-systeme-jeu-zones]]
- [[20-references-visuelles]]
- [[09-direction-artistique]]
- [[iterations/2026-05-31-relief-source-audit]]
- [[iterations/2026-05-31-clean-level-base]]
- [[02-backlog]]
