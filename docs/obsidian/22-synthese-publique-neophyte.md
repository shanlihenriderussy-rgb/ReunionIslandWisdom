# 22 - Synthese publique neophyte

## Role du fichier

Ce fichier sert de journal lisible pour un public non technique.

Objectif :

- expliquer le projet sans jargon ;
- garder une trace datee des evolutions ;
- resumer les decisions importantes ;
- rendre le projet presentable a des personnes qui ne connaissent pas les details techniques.

Regle de mise a jour :

- chaque prompt important doit ajouter une entree datee et heuree ;
- l'entree peut etre courte si rien de concret n'a change ;
- l'entree doit rester comprehensible pour un lecteur non averti ;
- les details techniques restent dans les fichiers specialises, mais sont traduits ici en impact simple.

Format :

```txt
## YYYY-MM-DD HH:mm - Titre

Resume public :
- ...

Impact pour le projet :
- ...

Statut :
- ...
```

## 2026-05-31 17:20 - Mise en place du journal public

Resume public :

- Creation d'un journal dedie aux personnes non techniques.
- Ce journal expliquera regulierement ou en est le jeu, ce qui a change, et pourquoi c'est important.
- Le but est de pouvoir presenter le projet sans obliger le lecteur a comprendre le code, les formats 3D, les pipelines terrain ou les decisions internes.

Impact pour le projet :

- Les prochaines evolutions devront aussi etre racontees ici sous forme de synthese claire.
- `CLAUDE.md` et `instruction.md` pointent vers ce journal pour que les agents pensent a le mettre a jour.
- Le projet gagne une couche de communication publique separee de la documentation technique.

Statut :

- Fichier cree.
- Premiere regle de mise a jour posee.
- A maintenir a chaque prompt qui change le projet, meme legerement.

## 2026-06-07 10:18 - Commandes tactiles pour mobile

Resume public :

- Sur telephone, on peut maintenant deplacer le personnage et interagir au doigt.
- En bas a gauche : un joystick rond pour marcher dans toutes les directions.
- En bas a droite : un bouton "E" pour parler / interagir. Il s'allume en jaune quand un personnage est a portee.
- Ces commandes n'apparaissent que sur ecran tactile ; sur ordinateur le clavier/souris reste inchange.
- Elles disparaissent quand le jeu est en pause, en vue carte ou avec un menu ouvert.

Impact pour le projet :

- Le jeu devient jouable sur mobile sans clavier, conforme a la cible "mobile/web first".
- Aucun nouveau composant lourd ni dependance ajoutee : joystick et bouton sont en HTML/CSS internes.
- Le joystick alimente le meme systeme de deplacement que le clavier (pas de logique gameplay dupliquee).

Statut :

- Integre cote client (joystick + bouton action).
- A valider en jeu sur `http://localhost:5173/` (mobile ou DevTools mode tactile).
- typecheck/lint a relancer en local (non executables dans l'environnement courant).

## 2026-05-31 17:30 - Prompt de reference visuelle pour construire la carte

Resume public :

- Creation d'un prompt d'image pour produire un board de 6 references visuelles.
- Le board servira a imaginer les parties de la carte avec les assets deja disponibles dans le projet.
- L'objectif est de guider la construction visuelle du monde sans partir dans une direction trop technique ou trop realiste.

Impact pour le projet :

- La direction artistique reste low-poly, lisible et adaptee mobile.
- Les zones importantes de La Reunion sont traduites en scenes simples : plage, volcan, cirques, cascades, cote basaltique, village creole.
- Le prompt demande une image utile pour fabriquer la carte, pas une illustration marketing.

Statut :

- Prompt pret a utiliser dans GPT Image.

## 2026-05-31 17:38 - Relief et biomes de l'ile

Resume public :

- La carte a ete recalee a partir de l'image de relief de La Reunion fournie dans les references.
- Les grandes zones naturelles sont maintenant posees : plage et lagon a l'ouest, ville au nord, route littorale au nord-ouest, cirques au centre, volcan au sud-est, sud sauvage en bas de l'ile.

Impact pour le projet :

- Les futurs assets et quetes peuvent etre places dans une zone claire au lieu d'etre poses au hasard.
- La carte debug montre les zones par couleurs pour verifier rapidement la coherence.

Statut :

- Base de placement integree.
- Relief precis encore bloque par l'absence des donnees IGN RGE ALTI dans le projet.

## 2026-05-31 17:51 - Cible visuelle du jeu

Resume public :

- La cible visuelle du jeu a ete clarifiee avec un board de 6 images : plage tropicale, volcan noir, cascades, sentiers de montagne, route littorale et place creole.
- Le jeu doit ressembler a des scenes low-poly colorees et lisibles, pas a une carte technique plate.

Impact pour le projet :

- La vue carte reste utile pour se reperer.
- La vue jouable doit devenir une suite de petits dioramas par biome, avec chemins, reliefs, vegetation, rochers et batiments adaptes.
- Le rendu a ete rechauffe : ciel plus clair, eau plus lagon, lumiere plus cartoon.

Statut :

- Direction artistique mise a jour.
- Premier ajustement runtime applique.
- Les assets definitifs par zone restent a produire ou importer.

## 2026-05-31 18:11 - Vrai relief de l'ile integre

Resume public :

- Les vraies donnees d'altitude officielles de La Reunion (IGN RGE ALTI, 128 tuiles a 5 metres de precision) ont ete integrees.
- Le relief du jeu est maintenant genere a partir de ces donnees reelles, plus a partir d'un fichier approximatif.

Impact pour le projet :

- Les montagnes, cirques, ravines et le littoral correspondent enfin a la vraie geographie de l'ile.
- Le terrain est decoupe en 16 morceaux (chunks) prets a etre charges petit a petit pour rester fluide sur mobile.

Statut :

- Terrain genere. Validation visuelle en vue carte a faire.
- Etape suivante : reglage du niveau de relief et chargement progressif des morceaux.

## 2026-06-05 18:05 - Relief IGN confirme

Resume public :

- Le terrain a ete regenere avec les donnees IGN RGE ALTI.
- Le fichier de controle indique maintenant bien que la source est IGN, pas l'ancien STL approximatif.
- La carte est decoupee en 16 morceaux pour preparer un chargement progressif.

Impact pour le projet :

- Le projet peut passer au branchement du chargement de terrain par morceaux.
- Les credits devront mentionner IGN, car cette donnee officielle impose une attribution.

Statut :

- Manifest terrain confirme.
- Validation visuelle Browser non terminee : le Browser a bloque la navigation locale pendant le test automatique.

## 2026-06-05 14:37 - Chargement progressif du terrain (streaming)

Resume public :

- Le terrain reel de l'ile est maintenant decoupe en 16 morceaux charges automatiquement autour du joueur.
- Seuls les morceaux proches sont charges ; les autres sont liberes. Objectif : rester fluide, surtout sur mobile.

Impact pour le projet :

- Le jeu ne charge plus toute l'ile d'un coup.
- Securite donnees : le systeme refuse tout terrain qui ne vient pas des donnees officielles IGN.

Statut :

- Streaming actif dans le code.
- Verification a l'ecran a faire au prochain rechargement de l'onglet de jeu.

## 2026-06-05 18:39 - Streaming terrain verifie cote code

Resume public :

- Le chargement progressif du terrain a ete controle dans le code.
- Une correction a ete ajoutee pour eviter que l'ancien terrain complet reste affiche en meme temps que les morceaux charges.

Impact pour le projet :

- Le terrain est pret pour une validation visuelle en carte.
- Les prochains travaux peuvent se concentrer sur le rendu des zones et le reglage du relief.

Statut :

- Compilation, verification TypeScript, lint et build client OK.
- Validation visuelle Browser encore a faire sur l'onglet local.

## 2026-06-05 18:54 - Correction vue carte terrain

Resume public :

- La validation visuelle a montre que la vue carte n'affichait qu'une partie de l'ile.
- Le systeme chargeait seulement les morceaux proches du joueur, ce qui est bon en jeu, mais mauvais pour une carte globale.

Impact pour le projet :

- La vue carte charge maintenant toute l'ile.
- La vue jouable garde le chargement progressif autour du joueur pour rester legere.

Statut :

- Correctif applique.
- Nouvelle validation visuelle a faire apres compilation.

## 2026-06-05 19:01 - Nettoyage artefact terrain

Resume public :

- La carte complete s'affichait, mais un morceau vide creait un artefact visuel dans l'ocean.
- Le jeu ignore maintenant les morceaux de terrain vides.

Impact pour le projet :

- La carte est plus propre.
- Le chargement progressif evite de charger des morceaux inutiles hors de l'ile.

Statut :

- Correctif applique.
- Validation visuelle relancee ensuite.

## 2026-06-05 20:37 - Carte relief validee

Resume public :

- La carte de La Reunion affiche maintenant l'ile complete avec son relief officiel.
- Les grandes formes de l'ile sont lisibles : massif central, volcan, ravines, cirques et littoral ouest.

Impact pour le projet :

- Le socle terrain est assez fiable pour passer au reglage visuel du relief et aux zones jouables.
- La vue carte charge toute l'ile, tandis que la vue jouable gardera un chargement plus leger autour du joueur.

Statut :

- Validation carte OK.
- Prochaine etape : regler l'exageration verticale et le rendu par biome.

## 2026-06-05 20:55 - Base visuelle terrain stabilisee

Resume public :

- Une tentative de coloration automatique du terrain a montre des blocs visibles entre les morceaux de carte.
- Cette approche a ete retiree pour garder une carte propre.

Impact pour le projet :

- Le terrain garde une couleur verte temporaire uniforme.
- Les vraies couleurs par biome devront etre generees proprement dans le pipeline terrain, pas ajoutees vite fait au chargement.

Statut :

- Base visuelle stabilisee.
- Prochaine etape technique : ajouter les couleurs par biome au generateur de terrain.

## 2026-06-05 21:08 - Carte agrandie et textures terrain appliquees

Resume public :

- La carte de La Reunion a ete agrandie pour que les personnages paraissent plus petits face a l'ile.
- Les couleurs du terrain sont maintenant integrees directement dans les morceaux 3D : verts, reliefs rocheux, zones volcaniques et sable discret sur certaines cotes.
- Les anciennes bandes jaunes de sable ont ete retirees.
- Les objets sont maintenant ranges par secteurs : ouest, volcan, cirques, Saint-Denis, route littorale, hauts.

Impact pour le projet :

- La carte ressemble moins a un prototype plat et davantage a une base d'ile jouable.
- Le sable ne forme plus une couche posee par-dessus la carte : il fait partie du terrain.
- Les objets decoratifs ne flottent plus dans l'eau ; seuls les pontons, ports, bateaux et epaves peuvent rester en mer.

Statut :

- Compilation, lint et build OK.
- Captures desktop/mobile ajoutees dans `docs/obsidian/playtests/2026-06-05-scale220-baked-sand/`.
- Prochaine etape : vrai blockout level design par secteur, puis assets specifiques a chaque zone.

## 2026-06-05 21:37 - Relief plus lisible

Resume public :

- Le terrain a ete regenere avec une definition plus fine.
- Les montagnes, ravines, cirques et zones volcaniques ressortent davantage.
- La brume a ete adoucie pour que la vue carte montre mieux l'ile complete.

Impact pour le projet :

- La carte sert mieux de base pour dessiner les prochains chemins et zones jouables.
- Les regions naturelles commencent a etre lisibles sans avoir besoin de gros panneaux ou de couleurs debug.
- Le rendu reste en style low-poly, mais moins plat.

Statut :

- TypeScript, lint, generation terrain et build OK.
- Captures desktop/mobile ajoutees dans `docs/obsidian/playtests/2026-06-05-terrain320-readability/`.
- Prochaine etape logique : blockout jouable du secteur Saint-Paul / Saint-Gilles.

## 2026-06-06 09:31 - Premier parcours jouable Saint-Paul / Saint-Gilles

Resume public :

- Le projet passe d'une carte peinte a une premiere zone jouable.
- Le joueur apparait maintenant sur le secteur Saint-Paul / Saint-Gilles.
- Un chemin principal relie le littoral, un point snack, un arret Car Jaune, une ravine et une sortie vers le sud.
- Des limites naturelles temporaires encadrent le parcours : rochers, ravine et crete.
- Les personnages importants du debut sont regroupes sur ce chemin, avec un prompt visible pour parler a Tatie Snack.

Impact pour le projet :

- Le jeu commence a avoir une vraie lecture de level design : ou marcher, ou s'arreter, ou parler, ou sortir de la zone.
- Les prochains assets ne seront plus poses au hasard : ils devront servir le parcours, les quetes et les limites naturelles.
- Le secteur ouest devient la base de travail pour la premiere quete jouable.

Statut :

- TypeScript, lint et build OK.
- Captures desktop/mobile ajoutees dans `docs/obsidian/playtests/2026-06-06-west-blockout/`.
- Limites connues : quelques noms peuvent se chevaucher, et le serveur doit encore suivre parfaitement le relief pendant les deplacements.

## 2026-06-06 18:31 - Passage du moodboard vers une scene jouable

Resume public :

- Le moodboard global a ete analyse pour comprendre comment atteindre ce rendu en jeu.
- La meilleure methode retenue est de construire une zone forte a la fois, plutot que de decorer toute l'ile d'un coup.
- Le secteur Saint-Paul / Saint-Gilles a recu une premiere couche visuelle : palmiers, rochers, vegetation, kiosk snack, panneaux, ecume et lagon.
- La camera jouable a ete abaissee pour se rapprocher d'un cadrage de scene, moins "carte vue du dessus".

Impact pour le projet :

- Le jeu commence a se rapprocher du style des images de reference.
- Les assets sont maintenant poses en grappes autour du chemin et des points de quete.
- La prochaine logique est de finaliser ce premier diorama ouest avant de copier la methode aux autres biomes.

Statut :

- TypeScript, lint et build OK.
- Captures ajoutees dans `docs/obsidian/iterations/2026-06-06-global-moodboard-runtime/`.
- Limites restantes : plage encore trop decoupee, chemin encore trop blockout, assets Reunion custom a produire.

## 2026-06-06 18:42 - Design system HUD integre

Resume public :

- Le design system fourni dans l'archive a ete integre au projet.
- Le HUD du jeu adopte maintenant un style plus cartoon tropical : panneaux sombres epais, contours noirs, boutons jaunes en relief, dialogue bois, meilleure lisibilite mobile.
- Les sources du design system sont conservees dans le repo pour servir de reference.

Impact pour le projet :

- L'interface se rapproche davantage de l'identite visuelle du jeu.
- Les futurs elements d'interface devront utiliser les memes tokens et regles.
- Les composants non encore utiles au gameplay, comme minimap, jauges ou inventaire, restent en reference et ne sont pas actives artificiellement.

Statut :

- Runtime HUD mis a jour.
- Captures desktop/mobile ajoutees dans `docs/obsidian/iterations/2026-06-06-design-system-hud/`.
- TypeScript et lint OK au moment de l'integration.

## 2026-06-06 21:00 - Finalisation de la vegetation seedee, des collisions et des PNJ

Resume public :

- Nettoyage des anciens fichiers de placement d'objets (worldObjects et westScenic) au profit du nouveau generateur de vegetation seedee et deterministe.
- Integration propre des nouveaux composants de vegetation et de decor sans erreur de compilation.
- Validation de l'echelle des PNJ (ajustee a celle du joueur) et de leurs animations d'attente (idle) procedurale ou par animation GLTF.
- Nettoyage des anciennes collisions circulaires pour eviter les blocages invisibles autour des arbres.

Impact pour le projet :

- Le code du client de jeu est propre et debarrasse des dechets d'anciennes versions (imports/exports morts).
- Le typecheck, le linter et le build finalisent desormais sans aucune erreur ni avertissement.
- Le jeu est pret pour la verification visuelle et les tests d'exploration de la zone ouest (Saint-Paul / Saint-Gilles).

Statut :

- Validation typecheck, lint et build 100% OK.
- Fichiers orphelins supprimes.
- tsconfig.check.json mis a jour.
- Pret pour test en jeu sur http://localhost:5173/?mapDebug.

## 2026-06-07 22:00 - Le jeu sait maintenant ou on en est sur le chemin de la cote ouest

Demarrage d'un rythme de developpement quotidien automatique : chaque soir, le
projet avance d'une petite pierre. Un jour on ajoute une fonction, le lendemain
on la teste, le surlendemain on corrige, puis on passe au sujet suivant (decor,
objets, equipement, combat, ennemis, etc.).

Premiere pierre posee ce soir, cote "decor / parcours" :

- Le jeu peut desormais calculer, pour n'importe quelle position du joueur, ou
  il se trouve le long du chemin cotier de Saint-Paul / Saint-Gilles : tout au
  debut (0 %), au milieu, ou arrive a la sortie sud (100 %).
- Il sait aussi si le joueur s'est eloigne du chemin et de combien.

Concretement : c'est la base pour afficher plus tard "ou suis-je" a l'ecran et
pour construire une boucle d'exploration simple sans dependre d'un personnage.

Statut :

- Petite fonction ajoutee, testee en isole (resultats coherents : debut a 0 %,
  fin a 100 %).
- Verification complete (lint/build) a refaire sur la machine Windows.
- Rien de visible n'a change en jeu pour l'instant : c'est une fondation.

## 2026-06-07 - Lisibilite du HUD en version mobile

Resume public :

- Sur petit ecran (telephone), les elements du haut se chevauchaient : carte du joueur, boutons de menu, mini-carte et panneau d'objectif se marchaient dessus.
- Ajout d'une disposition mobile dediee : a gauche on empile carte joueur, boutons de menu, puis objectif ; a droite la mini-carte avec le statut, puis le zoom en dessous.
- Tailles reduites et bornees (avatar, barres de vie/energie, boutons, mini-carte, emplacements de la barre d'action) pour aerer et rester lisibles en plein soleil.
- Suppression de la bande sombre vide en bas d'ecran quand aucun dialogue ni notification n'est affiche.

Impact pour le projet :

- Le HUD mobile ne se chevauche plus et reste lisible sur les largeurs courantes de telephone.
- Changement purement visuel (CSS), pas de logique de jeu touchee.

Statut :

- Patch CSS dans `apps/game-client/src/styles.css` (nouvelle media query `<= 640px` pour le HUD runtime).
- A verifier en jeu : `http://localhost:5173/` en vue mobile.

## 2026-06-07 11:10 - Choix de l'hebergement pour mettre le jeu en ligne

Resume public :

- Question posee : ou et comment heberger le jeu, gratuitement et efficacement ?
- Le jeu se decoupe en deux morceaux a heberger separement :
  - le "client" = ce qui s'affiche dans le navigateur (le decor, l'interface) ; ce sont juste des fichiers a distribuer ;
  - le "serveur" = le programme toujours allume qui gere le monde partage et les joueurs connectes en temps reel.
- Decision : le client ira sur **Cloudflare Pages** (rapide, gratuit, sans limite de trafic, parfait pour les fichiers 3D un peu lourds) et le serveur sur **Fly.io** (machine qui reste allumee en permanence, connexion temps reel, region de Johannesburg qui est la plus proche de La Reunion).
- Pourquoi pas tout au meme endroit : un serveur de jeu temps reel a besoin de rester allume et de garder une connexion ouverte avec chaque joueur, ce que les hebergements "fichiers seuls" ne savent pas faire.

Impact pour le projet :

- Tous les fichiers de configuration necessaires au deploiement ont ete prepares dans le projet (recette de fabrication du serveur, reglages Fly.io, adresse du serveur cote client).
- Le serveur repond maintenant a une petite verification de sante ("/health") pour que l'hebergeur sache qu'il fonctionne.
- Il reste a Shan a creer les comptes Cloudflare et Fly.io puis a lancer les commandes de mise en ligne (compte requis, ne peut pas etre fait a sa place).
- Gratuit suffit pour les tests et demonstrations ; un vrai lancement avec beaucoup de joueurs demandera de passer le serveur en payant plus tard.

Statut :

- Fondations de mise en ligne posees, deploiement reel a declencher par Shan.
- Detail technique complet : voir [[24-hebergement-production]].

## 2026-06-07 11:20 - Verification automatique a chaque modification du jeu

Resume public :

- Mise en place d'un "controle qualite" automatique : a chaque fois qu'une
  modification est proposee sur le projet (ou envoyee), une machine verifie
  toute seule que le code tient debout.
- Trois controles : le code est-il coherent (types), bien ecrit (style), et
  se construit-il sans erreur (build) ?
- Si un controle echoue, on le voit immediatement, avant que le probleme
  n'arrive sur la version en ligne.

Impact pour le projet :

- Moins de risque de casser le jeu sans s'en rendre compte.
- Cette verification ne met PAS le jeu en ligne toute seule : la mise en ligne
  reste une action manuelle et volontaire (securite).
- Necessite que le projet soit heberge sur GitHub pour s'activer.

Statut :

- Recette de verification ajoutee (`.github/workflows/ci.yml`).
- S'activera automatiquement des le premier envoi du projet sur GitHub.

## 2026-06-07 11:35 - Mise en ligne automatique (une fois le projet sur GitHub)

Resume public :

- Ajout d'une "mise en ligne automatique" : apres chaque verification reussie,
  la nouvelle version du jeu peut partir toute seule en ligne (le decor cote
  navigateur et le serveur du monde partage).
- Securite : cette automatisation est **eteinte par defaut**. Elle ne s'allumera
  que lorsque Shan aura cree les comptes d'hebergement, range les cles d'acces
  en lieu sur, et bascule un interrupteur dedie. Avant ca, rien ne part en ligne.
- Preparation du depot de code : le projet est pret a etre envoye sur GitHub
  (la plateforme qui declenche verification puis mise en ligne).

Impact pour le projet :

- Quand tout sera branche, le cycle devient : Shan modifie -> verification
  automatique -> mise en ligne automatique. Plus rapide, moins d'erreurs manuelles.
- Les actions qui demandent les comptes personnels de Shan (creer le depot
  GitHub, les comptes Fly.io et Cloudflare, ranger les cles) restent a sa main :
  elles ne peuvent pas etre faites a sa place.

Statut :

- Recette de mise en ligne ajoutee (`.github/workflows/deploy.yml`), desactivee
  tant que l'interrupteur de securite n'est pas active.
- Marche a suivre detaillee (envoi GitHub + activation) : voir [[24-hebergement-production]] section 9.

## 2026-06-07 22:11 — On verifie la fonction "ou suis-je sur le chemin"

Deuxieme etape du rythme quotidien : on teste la petite fonction ajoutee hier.

- On a refait le calcul de zero, sur les 18 reperes du chemin cotier ouest.
- Resultat : tout au depart = 0 %, point de vue Maido / Mafate = 100 %, et la
  progression augmente bien regulierement entre les deux. Pas d'incoherence.
- Aucun bug bloquant trouve.

Un seul point note pour la suite : si le joueur est tres loin du chemin, le
pourcentage reste affiche mais ne veut plus dire grand-chose. On ajoutera donc,
a l'etape correction, une verification "est-ce que je suis vraiment sur le
chemin ?" avant d'afficher un lieu.

Verification complete (lint/build) toujours a refaire sur l'ordinateur de Shan.

## 2026-06-07 11:50 - La partie commence maintenant au volcan

Resume public :

- Changement d'entree dans le jeu : on ne demarre plus sur la cote ouest mais
  directement en haut du **Piton de la Fournaise**, le volcan emblematique de
  l'ile, dans le sud-est.
- Le joueur apparait sur le rebord du grand cratere (Dolomieu), face au sommet.
- Premier objectif (sans personnage pour l'instant, juste de l'exploration) :
  1. rejoindre le rebord du cratere,
  2. observer l'enclos et le cone central,
  3. reperer au loin le Piton des Neiges (le plus haut sommet de l'ile).
- La zone de la cote ouest deja construite n'est PAS supprimee : elle devient
  la deuxieme zone.

Comment on a place le volcan au bon endroit :

- On s'est servi des donnees d'altitude officielles de l'ile : le point le plus
  haut du sud-est correspond pile au sommet reel du volcan (environ 2610 m).
  Le depart est donc cale sur la vraie geographie, pas pose au hasard.

Impact pour le projet :

- L'arrivee dans le jeu est tout de suite plus spectaculaire (paysage de volcan).
- Aucun nouvel objet 3D ajoute pour l'instant : on respecte la regle "le decor
  detaille vient apres, zone par zone". Ici on utilise le relief brut du terrain.

Statut :

- Depart, objectif et nom de zone basules sur le volcan.
- A tester en jeu : apparition sur le rebord, lecture du cratere, pas de chute
  hors-sol. Verification technique a faire sur l'ordinateur de Shan.
- Detail : voir [[12-phase-1-level-design]] et [[04-decisions]] ADR-008.

## 2026-06-07 12:05 - Premiers decors sur le volcan

Resume public :

- Le volcan n'est plus un terrain nu : on a ajoute des decors.
- Des rochers de lave (basalte sombre et scorie rougeatre) entourent le rebord
  du cratere, et quelques rochers sont disperses autour pour donner de la matiere.
- Trois reperes guident le joueur, un par etape de l'objectif : un cairn au point
  de depart, un marqueur sur le cone central, et un poteau-fleche pointant vers le
  Piton des Neiges au loin.
- Important : ces decors sont entierement fabriques "a la main" en code, pas pris
  dans une banque d'objets exterieure. On respecte la regle du projet (pas d'objets
  generiques au hasard, style maison coherent).

Impact pour le projet :

- La zone de depart est tout de suite plus lisible et plus "volcan".
- Aucun fichier d'objet 3D externe ajoute : c'est leger et coherent visuellement.

Statut :

- Decors poses, ancres au sol du terrain. A regarder en jeu (rendu, position au sol).
- Detail technique : [[iterations/2026-06-07-fournaise-props]].
