# Systeme de jeu

## Intention

`Reunion Island Wisdom` n'est pas un MMO de combat.

C'est un jeu social d'exploration locale :

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

Pas en V1 :

- combat ;
- PvP ;
- trading ;
- economie ;
- housing ;
- craft complexe.

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
