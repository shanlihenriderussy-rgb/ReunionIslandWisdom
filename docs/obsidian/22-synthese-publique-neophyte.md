## 2026-06-29 18:10 - On a verifie que la memoire du jeu ne se trompe pas

En clair :

- Hier on a ajoute la « memoire de joueur » (quetes decouvertes + souvenirs gagnes). Aujourd'hui on l'a passee au banc d'essai.
- 33 controles automatiques : tous OK. Parler au bon personnage ajoute bien sa quete ; vaincre une creature ajoute bien son souvenir ; un doublon est ignore ; une liste pleine ne deborde pas ; quitter le jeu efface proprement la liste.
- On a aussi verifie les donnees du jeu : chaque quete pointe vers un personnage qui existe vraiment, et chaque recompense est unique (pas de melange entre deux creatures).
- Cote securite : cette liste n'est envoyee qu'a toi, jamais aux autres joueurs, et reste impossible a falsifier depuis ton ordinateur.

Impact :

- La brique « memoire de joueur » est jugee fiable. Aucun bug bloquant.
- Un seul petit detail cosmetique a peaufiner : l'ordre alphabetique des souvenirs avec accents (ex. « Eclat ») sera rendu plus naturel a la prochaine passe.

Statut :

- Test automatique : 33/33 OK.
- Verification technique complete sous Windows : a faire cote Shan (limite de l'environnement de test).
- Detail : [[iterations/2026-06-29-test-game-logic-progression]].

## 2026-06-29 15:23 - Le jeu se souvient enfin de ce que tu fais

En clair :

- Avant, quand tu parlais a un personnage ou que tu battais un ennemi, le jeu te montrait un message... puis oubliait tout aussitot. Rien n'etait garde.
- Maintenant, le serveur (l'ordinateur central du jeu, celui en qui on peut avoir confiance) tient une petite liste pour chaque joueur : les quetes decouvertes et les souvenirs gagnes.
- Parler au bon personnage ajoute sa quete a ta liste. Vaincre une creature ajoute son souvenir. Pas de doublon : un souvenir deja recu n'est pas recompte.
- C'est le serveur qui decide tout, pas ton ordinateur : impossible de tricher en s'inventant des recompenses.

Impact :

- Premiere vraie « memoire de joueur » : la base pour un futur inventaire et un journal de quetes.
- Ce que tu accomplis commence a compter et a rester.

Statut :

- Logique verifiee en test automatique (13 controles OK) : dedoublonnage, tri, refus des valeurs vides.
- Pour l'instant l'affichage a l'ecran de cette liste reste a brancher (prochaine etape) ; la sauvegarde longue duree viendra plus tard.
- A finaliser cote Shan : verification technique sous Windows.
- Detail : [[iterations/2026-06-29-progression-serveur-authoritative]].

## 2026-06-28 07:40 - Les routes epousent enfin le relief

En clair :

- Avant, les chemins et routes entre les zones etaient des barres droites posees a plat : elles flottaient au-dessus des vallees et s'enfoncaient dans les collines.
- Maintenant chaque route est « posee » sur le sol point par point : elle monte, descend et ondule avec le terrain.
- En bonus, le trace evite un peu les pentes les plus raides au lieu de foncer tout droit dedans.
- Le sol sur lequel on marche a ete recale pareil, donc le joueur suit la route au lieu de marcher dans le vide.

Impact :

- Les routes ont l'air credibles dans un relief aussi accidente que La Reunion.
- Premiere base pour de vrais itineraires (lacets, cols) plus tard.

Statut :

- Verifie en isole (relief de test) : routes qui suivent le sol, aucun trou, pentes raides adoucies.
- A finaliser cote Shan : verification en jeu (`?mapDebug`).
- Detail : [[iterations/2026-06-28-biomes-propres-v1]].

## 2026-06-28 07:08 - Cotes plus nettes + un petit ponton sur la cote est

En clair :

- Avant, le bord de l'ile faisait des « marches d'escalier » la ou la terre rencontre la mer (effet pixellise).
- On a corrige a la source : le trait de cote suit maintenant la vraie forme de l'ile, donc des bords plus doux tout autour.
- On a aussi ajoute un petit ponton en bois (embarcadere) sur la cote est. Il avance au-dessus de l'eau avec une plateforme en T au bout.
- On peut maintenant marcher sur son tablier et son ponton ; son usage de mission reste a definir.

Impact :

- L'ile parait plus soignee et credible vue de loin.
- La cote est gagne un point de repere, premiere brique pour un futur lieu (peche, transport...).

Statut :

- Verifie en isole : aucun triangle casse, trait de cote ~18 % plus lisse.
- Verifie cote code et runtime local : generation terrain relancee, typecheck/lint/build OK, jeu charge en `?mapDebug`.
- Detail : [[iterations/2026-06-28-littoral-lisse-embarcadere]].

## 2026-06-27 22:19 - Une vraie mini-carte jouable dans le HUD

En clair :

- La petite carte en haut a droite n'est plus une image decorative.
- Elle montre maintenant la position du joueur en direct, son orientation, le chemin Ouest, les points importants, les zones proches, les cibles et les autres joueurs connectes.
- Cliquer dessus, toucher dessus ou appuyer sur `M` bascule la vue Carte.
- La molette sur la mini-carte change la portee affichee.
- Le journal de quetes a ete nettoye : il ne promet plus de fausses recompenses. Il affiche seulement ce que le jeu sait vraiment.

Impact :

- Le HUD devient utile pour jouer, pas seulement joli.
- Le joueur peut se situer sans ouvrir une grande carte.
- L'interface reste lisible sur desktop et mobile.

Statut :

- Typecheck, lint et build client OK.
- Capture Chrome desktop + mobile OK : mini-carte non vide, pas de chevauchement avec objectif/zoom.
- Detail : [[iterations/2026-06-27-hud-minicarte-runtime]].

## 2026-06-27 21:57 - Deuxieme correction : les bosquets sombres du Maido touchent le sol

En clair :

- Apres la premiere correction, certains arbres sombres du cote Maido / Mafate flottaient encore.
- Ce n'etait pas le meme systeme de vegetation : ces bosquets etaient poses a une hauteur fixe, au lieu de lire le vrai relief.
- Correction : chaque bosquet lit maintenant la hauteur du morceau de terrain sur lequel il se trouve.
- Les troncs ont aussi ete repositionnes depuis leur base, pour eviter un decalage visuel.

Impact :

- Les silhouettes sombres inspirées des hauts de Mafate doivent maintenant coller au relief.
- Le bug venait d'un decor procedurale Mafate, pas de la vegetation Ouest deja corrigee.

Statut :

- Correction code faite. Typecheck et lint client OK.
- Verification visuelle a confirmer apres rechargement du jeu.
- Detail : [[iterations/2026-06-27-fix-bosquets-mafate-hauteur]].

## 2026-06-27 21:48 - Les arbres ne flottent plus

En clair :

- Sur une capture du jeu, des palmiers (en haut a gauche) flottaient au-dessus du sol.
- Cause : la vegetation se posait sur une carte du relief un peu differente de celle qu'on voit vraiment a l'ecran (et sur laquelle marche le joueur). D'ou le decalage.
- Correction : la vegetation se pose maintenant sur exactement le meme relief que le joueur -> elle touche le sol.
- Bonus : cette capture prouve que le jeu s'affiche bien (terrain, chemin, personnage, barre de vie). C'etait justement le point qu'on n'avait pas pu verifier au 1er test prod.

Statut :

- Correction faite. A reconfirmer a l'ecran apres rechargement (que tous les arbres/rochers touchent bien le sol).
- Detail : [[iterations/2026-06-27-fix-vegetation-flottante]].

## 2026-06-27 21:44 - Le terrain accepte maintenant les fichiers GeoTIFF

En clair :

- Le generateur de terrain sait maintenant travailler avec les fichiers `.asc` existants et les fichiers `.tif/.tiff`.
- La projection du relief est mieux documentee : le jeu sait que la source terrain est en RGR92 / UTM 40S, le systeme utilise a La Reunion.
- Le fichier de sortie pourra aussi indiquer le centre exact utilise pour placer l'ile dans le monde du jeu.
- On a pose la base technique pour un futur terrain plus leger sur mobile.

Impact :

- Moins de risque de relief decale.
- Meilleure base pour tester la marche, la camera et les collisions.
- Le LOD mobile n'est pas encore genere : c'est la prochaine etape terrain.

Statut :

- Patch pipeline et documentation faits.
- Les gros fichiers terrain publics devront etre regeneres pour contenir les nouveaux champs.
- Detail : [[11-phase-0-terrain]], [[04-decisions]] ADR-017.

## 2026-06-27 21:08 - Test production n°1 de la version 0.1.1

En clair :

- La version web installable `0.1.1` a été fabriquée correctement.
- Le fichier final existe : `reunion-island-wisdom-web-0.1.1-20260627-205439.zip`.
- Le cache de l'application Chrome est bien passé en `v0.1.1`, pour éviter que l'ancienne version reste coincée.
- Le serveur local répond, et deux clients peuvent se connecter au monde.
- Le combat côté serveur fonctionne : les cibles Ouest existent, on ne prend pas de dégâts sans attaquer, l'attaque à portée fait baisser la vie, une cible vaincue donne un souvenir, puis réapparaît.

Point important :

- Le test visuel dans Chrome n'a pas pu être terminé avec l'outil automatique : pas de capture fiable du jeu, pas de vérification de l'installation PWA.
- Donc la version est techniquement prête pour une passe de test, mais pas encore validée pour un vrai GO production.

Bugs/risques retenus :

- l'événement interne parle encore de la Fournaise alors que le départ est à l'Ouest ;
- le gros fichier de relief de 17 Mo est encore dans le paquet ;
- l'installation Chrome et la mise à jour PWA doivent être vérifiées manuellement.

Statut :

- Verdict : **NO-GO production complet** tant que Chrome/PWA et le rendu en jeu ne sont pas validés à l'écran.
- Détail : [[playtests/2026-06-27-test-prod-n1]].

## 2026-06-27 17:42 - Suite du 1er test prod : deux corrections

En clair :

- Le 1er test "comme en vrai" a montre que tout le cote serveur du combat marche (degats, mort, recompense, anti-triche). Mais le rendu a l'ecran et l'installation dans Chrome n'ont pas pu etre verifies (l'outil navigateur a calé). Verdict prudent : on attend une verif visuelle avant de dire "bon pour prod".
- En attendant, on a corrige deux details signales :
  1. Le jeu annoncait en interne un evenement "volcan" alors qu'on demarre a l'Ouest : c'est aligne sur la vraie zone de depart.
  2. Le gros fichier de relief (~17 Mo) etait encore embarque dans le paquet installable alors qu'il ne sert plus (le relief arrive maintenant par petits morceaux). On le retire du paquet -> telechargement bien plus leger. Le fichier reste dispo en secours cote developpement.

Impact :

- Paquet plus leger a la prochaine fabrication. Coherence interne retablie.
- Le verdict reste "pas encore bon pour prod" tant que l'affichage + l'installation Chrome ne sont pas valides a l'oeil.

Statut :

- Corrections faites cote code. A refabriquer + verifier a l'ecran sur la machine de Shan.
- Detail : [[playtests/2026-06-27-test-prod-n1]].

## 2026-06-27 16:16 - Le combat prend vie : impacts, sons, recompenses

En clair :

- Frapper une cible se voit et s'entend maintenant : la cible « tressaille » quand elle encaisse, joue une petite animation quand elle est detruite, et il y a des petits sons (coup, impact, destruction, joueur blesse).
- Les sons sont fabriques par le jeu lui-meme (de simples bips genere a la volee), pas des fichiers telecharges : zero souci de droits, et rien a installer.
- Quand le joueur prend des degats, l'ecran clignote brievement en rouge.
- A chaque cible vaincue, le joueur recoit un petit souvenir local (« Galet poli », « Cendre tiede »...) annonce a l'ecran. Pour l'instant c'est juste l'annonce : le rangement dans un vrai sac viendra avec l'inventaire.

Impact :

- Le combat devient lisible et satisfaisant, sans alourdir le jeu ni trahir l'esprit (exploration d'abord, combat leger).
- Tout ce qui compte (degats, mort, recompense) est decide par le serveur : pas de triche possible.

Statut :

- Code verifie (syntaxe). Verification technique complete + test a l'ecran (image + son) a faire sur la machine de Shan.
- Detail : [[iterations/2026-06-27-combat-core]].

## 2026-06-27 14:55 - Du combat des le depart (zone Ouest)

En clair :

- Comme le jeu demarre maintenant a l'Ouest, on y a place 3 cibles d'entrainement le long du chemin, de plus en plus coriaces : un « galet roulant », un « remous de ravine », puis un « embacle de ravine ».
- Elles sont posees pile sur le sentier, donc le joueur les croise naturellement en avancant, sans se retrouver coince dans un decor.
- Les cibles du volcan restent en place pour quand on visite la Fournaise.

Impact :

- Le combat est desormais jouable des le depart, sans reglage special.
- La difficulte monte doucement le long du chemin (bonne premiere prise en main).

Statut :

- Placement verifie automatiquement (sur le sentier, hors obstacles). Reste a confirmer a l'ecran (`?mapDebug`) que rien ne flotte ni ne s'enfonce.
- Detail : [[iterations/2026-06-27-combat-core]].

## 2026-06-27 14:45 - Synchronisation : depart a l'Ouest + barre de vie au style maison

En clair :

- On a synchronise le travail fait en parallele (un autre assistant, « Codex », avait ajoute le saut avec Espace et choisi le point de depart). Tout cohabite proprement.
- Decision prise : le jeu demarre par defaut a l'**Ouest** (Saint-Paul / Saint-Gilles), pas au volcan. Le volcan reste accessible avec un reglage special. Ecran et serveur sont maintenant d'accord sur ce point de depart (avant, ils se contredisaient).
- Consequence a connaitre : les cibles de combat sont au volcan. Donc au depart par defaut (l'Ouest), il n'y a pas encore de combat sous la main. Prochaine etape possible : poser des cibles a l'Ouest.
- La barre de vie du joueur a ete remise au « style maison » du jeu (le meme look que le reste de l'interface) au lieu d'un style provisoire.

Statut :

- Code aligne (depart Ouest cote ecran + serveur, barre de vie au design system). Re-verification technique + test a l'ecran a faire sur la machine de Shan.
- Detail : [[04-decisions]] ADR-016, [[iterations/2026-06-27-spawn-zone-sync]].

## 2026-06-27 14:25 - Preparer la version installable (0.1.1) pour Chrome

En clair :

- On prepare une nouvelle version du jeu, la `0.1.1`, qui contient tout le combat (cibles, barre de vie, attaque, et la correction des PV).
- Pour qu'on puisse l'installer comme une appli depuis Google Chrome, il y a un detail technique important : le navigateur garde l'ancienne version en memoire. On a donc « change l'etiquette » de cette memoire (le cache) pour forcer Chrome a prendre la nouvelle version au lieu de l'ancienne.
- La fabrication finale du programme (le « build ») se fait sur l'ordinateur de Shan sous Windows : le mode de travail actuel ne permet pas de la lancer ici. La marche a suivre exacte est notee dans le projet.

A retenir :

- Pour jouer au combat, il faut que le serveur du jeu soit allume (c'est lui qui gere les cibles et les degats). L'appli installee toute seule ne suffit pas.
- Le jeu demarre maintenant directement au volcan.

Statut :

- Version et cache mis a jour cote code. Build + installation a faire sur la machine de Shan.
- Procedure detaillee : [[25-programme-installable-mcp]] (section « Release v0.1.1 »).

## 2026-06-27 14:18 - Correction : on ne perd plus de vie sans raison

En clair :

- Probleme remonte : le personnage perdait de la vie tout seul, sans qu'on fasse rien.
- Cause : les cibles du volcan attaquaient tout joueur qui passait a cote, et le point d'apparition tombait pile au milieu d'elles. Resultat : on prenait des coups sans comprendre d'ou ils venaient.
- Correction : desormais une cible ne riposte que si on l'a frappee en premier (et seulement quelques secondes, tant qu'on reste pres d'elle). Plus aucun degat juste en passant a cote.
- En bonus : le jeu demarre maintenant directement au volcan (la ou sont les cibles), plus besoin d'un reglage special. L'ancienne zone Ouest reste accessible pour les tests.

Impact pour le projet :

- Le combat est juste : on choisit quand se battre.
- Le point de depart est enfin coherent entre l'ecran et le serveur.

Statut :

- Logique re-testee automatiquement (20 verifications, dont « aucun degat sans attaquer »). Test a l'ecran a faire sur la machine de Shan.
- Detail : [[iterations/2026-06-27-combat-core]].

## 2026-06-27 14:10 - Le combat devient visible et jouable

En clair :

- Suite de la matinee : avant, le combat existait seulement « dans les calculs » du serveur, rien a l'ecran. Maintenant on le voit et on peut le declencher.
- Les cibles du volcan apparaissent dans le jeu (formes de basalte/braise) avec une petite barre de vie au-dessus qui descend quand on les frappe.
- Le joueur a sa propre barre de vie a l'ecran (les vraies valeurs du serveur, pas une fausse jauge de demo).
- Pour attaquer : touche **F** sur ordinateur, ou un bouton **F** sur mobile. Le jeu vise automatiquement la cible la plus proche a portee. C'est toujours le serveur qui decide si le coup compte.

Impact pour le projet :

- Premiere boucle de combat reellement jouable : voir une cible, s'approcher, frapper, la vaincre, et la voir reapparaitre.
- A noter : a cause d'un reste de chantier en cours (le point de depart du jeu n'est pas encore aligne entre l'ecran et le serveur), il faut pour l'instant lancer le jeu en mode volcan (`?visualZone=fournaise`) pour se retrouver pres des cibles.

Statut :

- Code verifie (syntaxe + cohérence). Verification technique complete et test a l'ecran a faire sur la machine de Shan.
- Detail : [[iterations/2026-06-27-combat-core]].

## 2026-06-27 12:14 - Le jeu sait maintenant gerer un combat (leger)

En clair :

- Jusqu'ici, le jeu disait clairement « ce n'est pas un jeu de combat ». Shan a decide d'ajouter quand meme un combat, mais leger : on reste avant tout sur l'exploration et l'entraide.
- On a pose les bases cote serveur : le joueur a des points de vie, et il y a des cibles a affronter. Pour le depart, ce sont des aleas du volcan (une « braise errante », un « gardien de scorie », un « souffle de l'Enclos ») — pas des animaux ni des gens.
- Quand le joueur attaque, c'est le serveur (la partie qui fait foi) qui decide tout : est-il assez pres ? a-t-il le droit de frapper maintenant ? combien de degats ? La cible peut riposter. Si le joueur tombe a zero, il reapparait peu apres.
- Important : pas de combat entre joueurs (pas de PvP). On ne s'attaque qu'a des cibles du decor.

Impact pour le projet :

- C'est la fondation du combat. Tout est verrouille cote serveur, donc difficile a tricher.
- Les cibles sont rangees par zone, comme les decors : ca relie le combat au level design (on les placera la ou la zone le demande).
- A l'ecran, rien n'est encore visible : cette etape est invisible (logique seule). La suite : afficher les cibles, une barre de vie, et un bouton pour attaquer.

Statut :

- Logique de combat testee automatiquement (17 verifications passees) ; donnees des cibles verifiees (3 cibles, sans erreur). Verification technique complete a refaire sur la machine de Shan.
- A noter : le terrain « vrai relief » de l'ile est en fait deja en place depuis le 5 juin ; certaines notes du projet disaient encore le contraire (corrige).
- Detail : [[iterations/2026-06-27-combat-core]].

## 2026-06-26 22:31 - Une fiche d'identite pour chaque objet du jeu

En clair :

- Avant, les 20 objets du jeu (barquette cari, kayamb, lampe frontale, casquette 974...) n'etaient qu'une simple liste de noms, sans details.
- Maintenant chaque objet a une vraie fiche : son nom affiche, sa categorie (nourriture, equipement, ressource, objet de quete, instrument), l'endroit ou on le porte (tete, corps, pieds, accessoire, main), s'il s'empile ou non, son poids et une courte description.
- Un controle automatique verifie que chaque objet de la liste a bien sa fiche, et qu'il n'y a ni doublon ni incoherence (par exemple : un objet "equipement" doit avoir un emplacement ou le porter).

Impact pour le projet :

- C'est la fondation de l'inventaire et de l'equipement. Sans ces fiches, impossible de ramasser, porter ou recevoir un objet en recompense.
- Tout est range cote serveur (la partie qui fait foi), donc fiable et non trichable.
- Rien ne change a l'ecran aujourd'hui : c'est de la preparation. La suite (ramasser/porter les objets) viendra apres.

Statut :

- Donnees verifiees automatiquement (20 objets, controles passes). Verification technique complete a refaire sur la machine de Shan.
- Detail : [[iterations/2026-06-26-equipment-item-catalog]].

## 2026-06-26 11:22 - Interaction parler validee en ligne

En clair :

- Le bouton `E / Parler` fonctionne maintenant avec le serveur local actif.
- Le jeu passe bien en statut `En ligne`.
- Devant Tatie Snack, appuyer sur `E` ouvre le dialogue attendu.

Impact :

- La premiere boucle jouable est plus credible : connexion, personnage proche,
  prompt d'action, dialogue.
- Une incompatibilite technique entre le serveur Colyseus recent et le client
  JavaScript actuel a ete absorbee cote client.

Statut :

- Typecheck OK. Lint OK.
- Test navigateur Chrome headless OK.
- Detail : [[iterations/2026-06-26-interaction-e-fallback]].

## 2026-06-26 14:30 - Le volcan ressemble davantage à sa référence

En clair :

- On a décidé : le jeu démarre à l'Ouest (la plage), et c'est l'autre assistant (Codex) qui s'occupe de l'Ouest.
- De mon côté, je travaille le volcan (Piton de la Fournaise) pour qu'il colle à l'image de référence : des coulées de lave qui rougeoient au sol, des colonnes de basalte (les « orgues »), et une lumière chaude près du cratère.
- Tout est dessiné par le code (pas d'images importées), et on garde ce qui existait déjà.

Impact pour le projet :

- Chaque assistant a sa zone : pas de risque qu'on s'efface mutuellement le travail.
- Le volcan gagne en ambiance, fidèle au moodboard.

Statut :

- Fait au niveau code (contrôles techniques verts). Pas encore vu à l'écran : le serveur du jeu était arrêté (Codex travaillait en même temps). À revoir une fois sa passe terminée.
- Détail : [[iterations/2026-06-26-fournaise-b2-habillage]] et [[12-phase-1-level-design]].

## 2026-06-26 13:30 - Le jeu démarre maintenant sur le volcan

En clair :

- Avant, on commençait sur la plage de l'Ouest. Maintenant le jeu démarre vraiment sur le Piton de la Fournaise,
  le volcan du sud-est (c'était prévu, mais le code démarrait encore à la plage).
- Le panneau d'objectif affiche désormais des étapes liées au volcan : rejoindre le rebord du cratère,
  observer le cône, puis repérer le Piton des Neiges.
- Ces étapes se valident toutes seules quand on s'approche des bons endroits, sans personnage à qui parler.

Impact pour le projet :

- La première expérience du jeu correspond enfin à la décision prise (départ volcan).
- Testé en direct : on apparaît bien sur le volcan, les deux premières étapes se cochent au départ.

Statut :

- Fait et vérifié dans le jeu ; quelques réglages restent (étapes un peu trop rapprochées, hauteur de départ à surveiller).
- ⚠ Un autre assistant (Codex) travaillait en même temps sur le départ Ouest : il faudra choisir une seule direction.
- Détail : [[04-decisions]] (ADR-013) et [[12-phase-1-level-design]].

## 2026-06-26 12:10 - Interface : coins carres, ambiance plus tropicale

En clair :

- Tous les coins arrondis de l'interface du jeu (boutons, panneaux, barres, pastilles) ont ete redresses.
- Avant : coins tres arrondis, parfois en pilule ou en rond, look « appli moderne ».
- Maintenant : coins droits ou a peine adoucis (5 px maximum). Les petits points d'etat deviennent de mini carres.
- L'idee : un style plus « grave / tampon », moins lisse, plus original et plus en accord avec l'univers tropical.

Impact pour le projet :

- L'interface a une signature visuelle plus marquee et moins generique, sans rien casser : couleurs, textes et disposition ne bougent pas.
- Tout est pilote par un reglage central, donc facile a ajuster ou annuler.

Statut :

- Modification faite cote feuilles de style ; verification a l'ecran sous Windows a refaire.
- Ajout : une fine texture « tissu/serigraphie » sur les panneaux sombres, pour casser l'effet
  vitre lisse et renforcer le cote artisanal tropical. Discrete, sans gener la lecture du texte.
- Mise a jour (verifiee dans le jeu) : texture rendue un peu plus visible, et panneaux rendus plus opaques
  pour mieux lire le texte en plein soleil sur la plage. Lancement teste : tout s'affiche, plusieurs joueurs en ligne.
- Detail : [[04-decisions]] (ADR-012) et [[23-design-system-hud]].

## 2026-06-26 11:00 - Chasse aux bugs (tous types)

En clair :

- Passe complete a la recherche de bugs, du serveur au client.
- Deux corrections concretes :
  - L'image du jeu pouvait devenir noire si la fenetre etait redimensionnee a un
    moment ou elle n'avait pas encore de taille (calcul d'affichage invalide). Corrige.
  - Petit nettoyage interne sur l'effet de lave du volcan pour eviter une fuite
    memoire si la scene est reconstruite.
- Le reste a ete verifie et juge sain : protection contre la triche et les messages
  malveillants cote serveur (limites d'envoi, distances, nettoyage des textes),
  et aucune faille d'injection dans l'affichage du chat (texte affiche tel quel,
  jamais interprete comme du code).

Impact pour le projet :

- Rendu plus robuste, base technique plus sure avant d'ajouter du gameplay.

Statut :

- 2 bugs corriges, audit sans autre alerte bloquante. Verification compilateur
  (typecheck/lint/build) a relancer sous Windows.
- Detail : [[iterations/2026-06-26-bug-sweep]].

## 2026-06-26 09:22 - Decoupage du chargement du jeu

En clair :

- Le premier fichier JavaScript charge par la page est maintenant tres leger.
- Le gros moteur du jeu est charge juste apres, dans un fichier separe.
- Le message d'alerte Vite sur les gros fichiers ne bloque plus le build : on a mis un budget coherent avec un jeu 3D Three.js.

Impact pour le projet :

- La structure de chargement est plus propre pour une PWA et un programme installable.
- Le poids total du jeu ne baisse pas encore ; c'est un chantier suivant.

Statut :

- Typecheck OK. Lint OK. Build OK.
- Detail : [[iterations/2026-06-26-code-splitting-runtime]].

## 2026-06-26 08:28 - Correction de la passe graphique Claude

En clair :

- L'ecran de depart indiquait Saint-Paul / Saint-Gilles, mais les objectifs parlaient encore du volcan Fournaise. C'est corrige.
- Les objectifs affiches correspondent maintenant au parcours ouest : Tatie Snack, Car Jaune, ravine, point de vue Maido / Mafate.
- L'inventaire de maquette reste cache en public et ne s'ouvre plus au clavier sans option de debug.
- Les grandes traces noires sur le chemin ont ete supprimees en stabilisant le rendu du ruban de sentier.
- Sur mobile, les messages sont remontes au-dessus des controles tactiles. Le joystick et le bouton d'action prennent moins de place.

Impact pour le projet :

- L'ecran raconte mieux ce que le joueur fait vraiment.
- La passe graphique de Claude reste exploitable, mais corrigee avant d'empiler d'autres effets.

Statut :

- Typecheck OK. Lint OK. Build OK. Captures navigateur desktop/mobile OK.
- Detail : [[iterations/2026-06-26-codex-correction-claude]].

## 2026-06-26 07:20 - Reglage des fumerolles du volcan

Resume public :

- Sur le Piton de la Fournaise, le jeu affiche de petites colonnes de vapeur (les "fumerolles") qui sortent du sol, pour donner vie au volcan.
- Probleme repere la veille : selon le tirage aleatoire, une fumerolle pouvait se placer trop pres des reperes de l'objectif (le cairn et le cone central), au risque de gener la lecture de la scene.
- Correction du jour : on a ajoute une regle simple. Si une fumerolle tombe trop pres d'un repere, elle se decale automatiquement un peu sur le cote, sans changer le reste.

Impact concret :

- Le volcan reste lisible : la vapeur ne vient plus masquer les points importants a atteindre.
- Avec le reglage actuel, rien ne bouge a l'ecran (les fumerolles etaient deja assez ecartees) ; la regle sert de filet de securite pour les reglages futurs.
- En bonus, on a verifie que la vapeur ne fait plus de "halo" opaque devant les rochers.

Statut :

- Modification dans `apps/game-client/src/render/fournaise.ts`.
- Verifications de calcul faites ; controle visuel a confirmer en jeu (`?mapDebug`).

## 2026-06-26 05:18 - Vegetation cote ouest optimisee (performance)

En clair :

- Les palmiers et rochers de la cote ouest sont desormais affiches par "lots"
  identiques plutot qu'un par un. Pour la carte graphique, c'est beaucoup moins
  de travail a chaque image.
- Concretement : plus de fluidite sur telephone, un rendu plus stable, et on peut
  remettre de la densite de vegetation sans faire chuter les images par seconde.
- Le placement, la taille et l'inclinaison de chaque plante restent exactement
  comme avant : verifie au calcul, c'est identique au pixel pres.

Impact pour le projet :

- Base technique plus saine pour densifier la jungle de l'ouest sans ralentir.
- A noter : ca n'allege pas encore le poids de telechargement du jeu (le fichier
  programme). C'est un autre chantier, prevu juste apres.

Statut :

- Item P3 "instancing palmiers/rochers" applique. Verification Windows OK
  (typecheck, lint, build). Prochaines etapes : mesure des performances, puis
  decoupage du telechargement, et le filtre couleurs facon cinema seulement a la fin.
- Detail : [[iterations/2026-06-26-instancing-vegetation]], decision [[04-decisions]] ADR-011.

## 2026-06-26 04:51 - Toits patines + verification de la passe visuelle

En clair :

- Les toits des cases creoles et du snack ont maintenant un aspect "tole usee" :
  le haut accroche la lumiere, le bas est plus sombre avec une pointe de rouille.
  Plus realiste, sans aucune image importee (effet calcule a la volee).
- En parallele, la passe graphique precedente (lagon bicolore, houle, interface
  nettoyee, camera, volcan) a ete verifiee et corrigee : le jeu compile, tourne,
  et l'objectif affiche pointe desormais vers Saint-Paul / Saint-Gilles (la zone
  de depart reelle) au lieu du volcan.

Impact pour le projet :

- La cote ouest gagne en credibilite ; la base technique est confirmee "verte".

Statut :

- Item P2 "toits" applique. Le filtre de couleurs global facon cinema (LUT) est
  reporte : il demanderait une couche technique lourde pour les telephones, on s'en
  tient pour l'instant aux reglages de lumiere deja en place.
- Detail : [[iterations/2026-06-26-toits-weathering]], plan [[25-graphismes-ameliorations]].

## 2026-06-26 04:18 - Lagon bicolore et houle sur l'ecume

En clair :

- L'ocean n'est plus d'un seul bleu uni : turquoise lagon pres de la cote, bleu
  profond au large. Le degrade donne tout de suite une impression de profondeur.
- Les bandes d'ecume le long de la plage "respirent" maintenant : un leger
  va-et-vient de vagues (montee/descente de 2 cm sur 4 secondes), decale d'une
  bande a l'autre pour ne pas bouger en bloc.

Impact pour le projet :

- La cote ouest parait plus vivante et plus lisible sans ajouter le moindre objet.
- Aucune image/texture importee : effet 100 % code, conforme a la regle "style maison".

Statut :

- Item P2 "eau / lagon" du plan applique. Verification technique (typecheck/lint)
  et captures avant/apres a faire sous Windows.
- Detail : [[iterations/2026-06-26-eau-lagon-houle]], plan [[25-graphismes-ameliorations]].

## 2026-06-26 - Mise a jour des packages

Resume public :

- Les packages techniques du projet ont ete mis a jour.
- Le moteur web passe notamment sur des versions plus recentes de Vite, Three.js, TypeScript, ESLint, Zod, Colyseus et Tauri CLI.
- Le gestionnaire pnpm reste en version 10 pour eviter un blocage de securite lie a des paquets publies trop recemment.

Impact pour le projet :

- Le projet reste compatible avec les versions recentes de l'ecosysteme web/3D.
- Les controles automatiques passent toujours apres update.
- La dette principale reste la taille du paquet JavaScript.

Statut :

- Install OK. Typecheck OK. Lint OK. Build OK.
## 2026-06-25 07:45 - Premieres retouches graphiques appliquees

En clair :

- On a commence a appliquer le plan d'ameliorations, en suivant l'ordre prevu.
- Interface nettoyee : les fausses jauges de vie/energie, la mini-carte trompeuse,
  la barre d'objets et la fiche d'objet sont masquees. L'ecran ne promet plus un
  jeu plus avance qu'il ne l'est. (On peut tout reafficher avec une option cachee
  pour les maquettes.)
- Volcan plus vivant : une lueur de lave qui respire au fond du cratere, et les
  panaches de fumee ne "bavent" plus devant les rochers.
- Cone central pose sur un socle (il ne flotte plus), petit sommet clair ajoute
  au cairn de depart pour mieux reperer l'objectif.
- Camera abaissee facon maquette (vue plus immersive), couleurs un peu plus
  franches, ombres plus douces.
- Cote ouest : toits des cases en tons chauds, barque de peche peinte (coque rouge),
  cordage sur le ponton ; jungle du Maido moins dense pour rester lisible ; troncs
  d'arbres moins sombres.
- Chargement allege : on ne charge plus en double le gros fichier de relief quand
  le decoupage en morceaux fonctionne.

Impact pour le projet :

- Le jeu se lit mieux des le depart (volcan) et le long du sentier ouest.
- Aucun nouvel objet importe : on respecte la regle "style maison, pas d'objets au hasard".

Statut :

- Lot P1 (interface, volcan, allegement) + une partie du P2 (camera, lumiere, cote ouest,
  vegetation) appliques. Verification technique et captures avant/apres a faire sous Windows.
- Detail : [[iterations/2026-06-25-graphismes-v1-p1-p2]], plan complet [[25-graphismes-ameliorations]].

## 2026-06-25 07:00 - Plan d'ameliorations des graphismes

En clair :

- On a passe le jeu au crible pour lister tout ce qui peut etre rendu plus beau,
  sans changer le style « Jour Tropical » ni ajouter d'objets au hasard.
- La liste est rangee par priorite (P1 = a faire en premier, P3 = plus tard).

Ce qui passe en premier (P1) :

1. Nettoyer l'interface : on cache les jauges de vie/energie, la mini-carte et la
   barre d'objets tant que ces systemes n'existent pas vraiment. Aujourd'hui elles
   font croire a un jeu plus avance qu'il ne l'est : c'est juge bloquant.
2. Donner vie au volcan : une lueur de lave au fond du cratere + reglage des
   panaches de fumee pour qu'ils ne « bavent » plus devant les rochers.
3. Alleger le chargement : ne plus charger en double le gros fichier de relief
   quand le chargement par morceaux est actif (gain de fluidite, zero effet visuel).

Ensuite (P2/P3) : camera plus basse facon maquette, couleurs plus chaudes pour les
cases creoles, vagues d'ecume animees, plus de variete dans les palmiers, lumiere
orange dramatique au volcan, et des outils pour comparer le rendu aux images de
reference.

Statut :

- Liste figee comme document de reference : [[25-graphismes-ameliorations]].
- Aucun changement de jeu pour l'instant : c'est un plan. Les retouches viendront
  une par une, avec capture avant/apres a chaque fois.



Resume public :

- La zone Saint-Paul / Saint-Gilles a recu une passe pour mieux ressembler aux images de reference.
- Le lagon turquoise et l'ecume sont maintenant visibles en jeu normal, pas seulement dans la vue debug.
- De petits elements de decor proceduraux ont ete ajoutes : ponton, barque et maisons creoles en arriere-plan.
- Le sentier devient plus sable/terre claire, moins orange.

Impact pour le projet :

- La zone ouest commence a lire comme un vrai diorama de littoral reunionnais.
- Aucun asset externe ajoute : tout reste leger et genere par le code.
- La validation image reste necessaire avant de figer ce style.

Statut :

- Passe Codex appliquee. Typecheck, lint et build OK.
- Capture desktop ajoutee pour controle. Il reste un element clair trop proche du premier plan gauche a nettoyer.

## 2026-06-25 01:42 - Le jeu devient un vrai programme a installer

En clair :

- Jusqu'ici le jeu se lancait surtout en mode "developpement". On bascule
  maintenant vers un vrai programme que l'on peut installer et partager.
- Trois formes de sortie, une seule base de code :
  1. version web normale (a heberger en ligne) ;
  2. application installable depuis le navigateur (bouton "Installer", icone
     sur le bureau ou le telephone, fonctionne meme avec une connexion faible) ;
  3. programme Windows classique a installer (fichier `.msi` / `.exe`).
- Le jeu reste multijoueur : le programme installe se connecte toujours au
  serveur du monde partage en ligne (il n'embarque pas le serveur).
- On peut aussi fabriquer un fichier `.zip` pret a distribuer en une commande.

Comment c'est range :

- L'application Windows est construite avec un outil leger (Tauri) qui place le
  jeu dans une fenetre, sans alourdir le projet ni changer le moteur.
- Un petit "contrat" decrit qui fait quoi entre les assistants : un cote
  fabrique/teste/empaquette (Codex), l'autre tient la documentation et les
  decisions (Claude). C'est l'esprit "studio de production".

Securite :

- Le programme ne parle qu'au serveur officiel du jeu, en connexion chiffree.
- Aucune cle secrete cote joueur. Les gros fichiers de relief ne sont pas mis
  dans le paquet distribue.

Statut :

- Web installable (PWA) : en place.
- Paquet `.zip` web : commande prete (`cook:web`).
- Programme Windows : tout est prepare ; la fabrication du `.msi`/`.exe` se fait
  sur l'ordinateur de Shan (besoin de Rust + outils Windows).
- A surveiller : le gros fichier de relief de 18 Mo, a sortir du paquet plus tard.
- Detail technique : [[04-decisions]] ADR-009 et ADR-010,
  [[iterations/2026-06-25-desktop-tauri-shell]].

## 2026-06-25 01:29 - Verification des fumerolles du volcan

Resume public :

- Hier on a ajoute de petits panaches de vapeur autour du cratere du Piton de la Fournaise, pour rappeler que le volcan est vivant.
- Aujourd'hui on a verifie ce travail : la vapeur se pose bien au sol, reste discrete, et ne gene pas les reperes qui indiquent ou aller.
- Bonne nouvelle : rien ne bloque le joueur, on passe a travers la vapeur.

Impact pour le projet :

- Un petit detail d'ambiance de plus, sans alourdir le jeu (aucun objet lourd ajoute).
- Un mini-defaut a corriger demain : la vapeur transparente peut laisser un leger halo devant les rochers. Correction simple prevue.

Statut :

- Verification technique OK. Petite retouche programmee pour la prochaine etape.
- Detail : [[iterations/2026-06-25-test-fumarole]].

## 2026-06-25 06:10 - Interaction PNJ reparee

Resume public :

- La touche `E` etait bien detectee, mais le serveur croyait que le joueur etait ailleurs.
- Le client placait le joueur pres des personnages de l'ouest, pendant que le serveur le gardait au volcan.
- Le serveur refusait donc l'interaction par securite, car la distance semblait trop grande.

Impact pour le projet :

- La build de test revient temporairement sur la zone Ouest pour que les dialogues PNJ fonctionnent.
- Le chantier visuel global reste ouvert : il faudra choisir une seule zone active pour tout aligner proprement.

Statut :

- Correctif serveur applique. Validation en jeu a faire : s'approcher d'un PNJ et appuyer sur `E`.

## 2026-06-25 05:55 - Installeur Windows genere

Resume public :

- Le projet produit maintenant un zip web et un programme Windows installable.
- Deux formats desktop ont ete generes : un `.msi` et un `setup.exe`.
- Le meme client sert aux trois sorties : web, PWA, desktop.

Impact pour le projet :

- Reunion Island Wisdom n'est plus seulement une demo lancee en developpement.
- Le jeu peut maintenant etre transmis comme paquet de test.
- Il reste a alleger le paquet et a corriger la coherence visuelle avant demo publique.

Statut :

- Build web OK. Build desktop Tauri OK. Installeurs non signes, donc SmartScreen peut avertir.

## 2026-06-25 04:25 - Audit visuel global

Resume public :

- Un audit complet de l'ecran de jeu a ete lance apres les captures.
- Le probleme principal n'est pas seulement graphique : le decor montre une zone de l'ouest, tandis que les objectifs parlent encore du volcan.
- Plusieurs elements d'interface ressemblent a des fonctions finales alors qu'ils sont encore des maquettes.

Impact pour le projet :

- La prochaine correction doit d'abord choisir une seule zone active pour la demonstration.
- Ensuite seulement on nettoie le rendu : couches de decor, personnages, mini-carte, jauges et chemins.
- Objectif : que le joueur comprenne immediatement ou il est et quoi faire.

Statut :

- Audit documente. Build de demonstration publique en no-go tant que la coherence zone/HUD n'est pas corrigee.

## 2026-06-25 04:00 - Le decor suit mieux les pentes

Resume public :

- Les chemins, rochers et plantes de la zone ouest ont ete ajustes pour mieux suivre les pentes du terrain.
- Le rendu de la vegetation a ete adouci pour eviter les grosses masses noires visibles dans les captures.
- Le sol streamé par morceaux reçoit aussi un shader plus fondu.

Impact pour le projet :

- La scene parait moins posee a plat sur la montagne.
- Les objets s'integrent mieux au relief de La Reunion.
- Le rendu reste leger et compatible avec le style low-poly.

Statut :

- Validation technique OK. Reste a confirmer en image apres build hors sandbox.

## 2026-06-25 00:00 - Le jeu devient distribuable

Resume public :

- Le projet passe d'une version seulement lancee en developpement a une base de programme installable.
- Le jeu peut maintenant etre prepare comme une PWA : une application web installable via navigateur.
- Un script prepare aussi un zip de distribution pour transmettre/tester le client.

Impact pour le projet :

- On se rapproche d'un vrai cycle de production : construire, preparer, empaqueter.
- Les agents Claude/Codex ont maintenant un contrat local pour suivre ce pipeline sans improviser.
- Le moteur du jeu ne change pas : on garde Vite, Three.js et Colyseus.

Statut :

- Base technique posee. Zip de distribution genere avec succes le 2026-06-25. Reste a tester l'installation PWA dans Chrome/Edge.
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

## 2026-06-24 17:29 - Fumee sur le volcan de depart

Resume public :
- Le joueur commence son aventure sur le Piton de la Fournaise, le volcan actif de l'ile.
- On a ajoute de petites fumerolles : des panaches de vapeur qui sortent du sol autour du cratere.
- Tout est dessine par le code (pas d'image telechargee), dans le style low-poly du jeu.

Impact pour le projet :
- La zone de depart respire le volcan vivant des le premier regard.
- Ces fumees aident a comprendre ou on se trouve, sans texte.
- Aucun ralentissement notable : ce sont de tres petites formes.

Statut :
- Livre cote code. Reste a verifier en images dans le jeu (etape suivante du cycle).

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
- Decision : le client ira sur **Cloudflare Pages** et le serveur sur **Fly.io**.
- Pourquoi pas tout au meme endroit : un serveur de jeu temps reel doit rester allume et garder une connexion ouverte avec chaque joueur.

Impact pour le projet :

- Les fichiers de configuration necessaires au deploiement ont ete prepares.
- Le serveur repond a une verification de sante (`/health`).
- Il reste a Shan a creer les comptes Cloudflare et Fly.io puis a lancer les commandes de mise en ligne.

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

## 2026-06-15 18:53 — Le jeu sait quand tu es "sur le sentier" (cote ouest)

En clair :

- Le jeu suit deja ta progression le long du sentier ouest (de la plage de
  Saint-Paul jusqu'au point de vue du Maido).
- Probleme : meme si tu t'eloignais du chemin, le jeu continuait a dire ou tu en
  etais sur le parcours, comme si tu marchais toujours dessus.
- Correction du jour : le jeu mesure maintenant ta distance au chemin. Si tu es
  trop loin (au-dela d'environ 3,5 metres de jeu de part et d'autre), il considere
  que tu n'es plus "sur le sentier".

Impact pour le projet :

- Base propre pour, plus tard, afficher "lieu actuel" seulement quand c'est utile.
- Aucun objet ajoute, aucun changement visuel : juste une regle de calcul fiable.

Statut :

- Logique testee (6 cas sur 6 corrects). A revalider sous Windows.
- Detail technique : [[iterations/2026-06-15-west-path-onpath-threshold]].

## 2026-06-26 - Audit performance graphique

En clair :

- Le jeu a maintenant un mode de mesure cache (`?perfDebug`) pour compter le cout reel du rendu.
- En vue de jeu normale cote ouest, la scene reste dans un budget correct : environ 128 appels de dessin et 195k triangles.
- La vue carte/debug est le vrai point lourd : 246 appels de dessin et 476k triangles.

Impact :

- Les optimisations de vegetation faites juste avant vont dans le bon sens.
- Le prochain gros gain doit viser la carte : moins de details visibles quand on regarde toute l'ile de haut.

Statut :

- Mesure faite avec captures desktop, mobile et carte.
- Detail : [[iterations/2026-06-26-audit-perf-draw-calls]].

## 2026-06-26 - Lancement du jeu simplifie

En clair :

- Le projet a maintenant des commandes simples pour lancer le jeu.
- `corepack pnpm launch:web` lance le serveur local et le client web, puis ouvre le navigateur.
- `corepack pnpm stop:web` ferme proprement les services lances.
- `corepack pnpm launch:desktop` lance l'executable Windows.

Impact :

- Shan peut tester plus vite sans retenir les details Vite, Colyseus ou Tauri.
- Si Tauri CLI est bloque par Windows Application Control, le build desktop repasse par Cargo et produit quand meme `riw.exe`.

Statut :

- Fichiers de lancement ajoutes.
- Detail : [[iterations/2026-06-26-install-launch-files]].

## 2026-06-26 - Interaction parler corrigee

En clair :

- Le bouton `E / Parler` fonctionne maintenant meme si le serveur local n'est pas connecte.
- Quand le joueur est devant Tatie Snack, `E` ouvre tout de suite le dialogue.
- Le bouton d'action mobile fait la meme chose.

Impact :

- La premiere action du jeu n'a plus l'air cassee.
- Le serveur reste la source de verite pour les futures recompenses/progressions ; le correctif actuel sert au feedback de dialogue.

Statut :

- Test desktop touche `E` OK.
- Test mobile bouton action OK.
- Detail : [[iterations/2026-06-26-interaction-e-fallback]].

## 2026-06-27 - HUD recale sur le design system fourni

En clair :

- Shan a fourni une page HTML de reference pour le HUD.
- Le jeu reprend maintenant les couleurs, rayons, ombres et bases visuelles depuis ce fichier.
- La mini-carte, les boutons du haut et le statut de connexion utilisent mieux les composants communs du design system.

Impact :

- Le HUD est moins improvise fichier par fichier.
- Les prochains ajustements visuels partent d'une source claire.
- Les anciens essais locaux restent notes, mais ne sont plus la reference active.

Statut :

- Patch runtime et documentation faits.
- Detail : [[iterations/2026-06-27-hud-design-system-html]].

## 2026-06-27 19:22 - Verification du catalogue d'objets

En clair :

- Le jeu a une liste de 20 objets (plats creoles, gourde, lampe frontale, casquette 974, kayamb, etc.).
- Aujourd'hui on a verifie que cette liste est saine, sans se contenter de croire qu'elle l'etait.
- On a teste avec le meme outil de controle que celui du jeu : les 20 objets sont bien formes, sans doublon, et chaque objet de la liste a sa fiche complete.
- On a aussi essaye d'y glisser des objets faux (un equipement sans emplacement, une quantite impossible) : le controle les a bien refuses.

Detail repere :

- Le kayamb (instrument de musique) se tient en main. C'est voulu.
- Mais la regle actuelle ne verrouille que les "equipements". Un plat ou une cle pourrait, par erreur, recevoir un emplacement de port sans etre bloque.
- Ce n'est pas un bug visible aujourd'hui (les donnees sont propres), juste une securite a resserrer.

Impact :

- Le catalogue d'objets est fiable pour la suite (inventaire, recompenses de quete).
- La prochaine etape resserre la regle pour empecher toute erreur future.

Statut :

- Verification logique faite ici. Verification finale (typecheck/build) a refaire sous Windows.
- Detail : [[iterations/2026-06-27-test-equipment-catalogue]].

## 2026-06-27 19:40 - Regle plus stricte sur les objets

En clair :

- Hier on avait repere un petit angle mort : la regle qui range les objets laissait, en theorie, mettre un "emplacement de port" (tete, mains, pieds...) sur un objet qui ne se porte pas, comme un plat ou une cle.
- Aujourd'hui on a resserre la regle. Desormais :
  - les objets qui se portent (equipements, et les instruments comme le kayamb qu'on tient en main) DOIVENT avoir un emplacement ;
  - tous les autres (nourriture, cles, ressources) NE PEUVENT PAS en avoir.

Impact :

- Impossible de creer par erreur un objet incoherent.
- C'est le serveur qui controle, donc un joueur ne peut pas tricher en bricolant ses objets.
- Les 20 objets actuels respectent deja la regle : rien ne change a l'ecran.

Statut :

- Correctif fait et verifie. Verification finale (typecheck/build) a refaire sous Windows.
- Detail : [[iterations/2026-06-27-fix-equipment-invariant-slot]].

## 2026-06-28 - Plateformes et embarcadere marchables

En clair :

- Les grands blocs du depart Ouest ne sont plus juste decoratifs.
- Le joueur peut maintenant marcher dessus via des surfaces de collision dediees.
- L'embarcadere cote est a aussi un sol de gameplay : tablier + ponton en T.

Impact :

- Le visuel et le deplacement racontent la meme chose.
- Le ponton peut servir plus tard a une quete peche, transport ou depart bateau.
- La collision reste blockout : simple et stable, pas encore une physique Rapier complete.

Statut :

- Typecheck, lint et build OK.
- Test runtime `?mapDebug` OK, sans erreur console nouvelle.
- Detail : [[iterations/2026-06-28-littoral-lisse-embarcadere]].

Correctif supplementaire :

- Les dalles ont maintenant un volume lateral : on ne traverse plus leurs faces verticales.
- Les rochers qui bloquaient le joueur ont aussi un petit dessus marchable quand leur hauteur le permet.
- Ces objets ont une tolerance de montee locale : on ne rend pas toutes les falaises faciles, seulement les volumes prevus pour etre montables.
- Verification : au spawn montre par Shan, le joueur est remonte de `y=0.6` a `y=0.9`, donc il est porte par la dalle au lieu d'etre dedans.

## 2026-06-28 - Tous les biomes ont un blockout V0

En clair :

- Les autres zones ont maintenant chacune un signal visuel jouable.
- Route du Littoral : route noire, murets basaltiques, marqueurs jaunes.
- Saint-Denis : place creole, batiments, palmiers.
- Piton des Neiges : sommet/cairn.
- Mafate : pont de ravine et abri de sentier.
- Salazie : cascade, ruisseau, vegetation humide.
- Cilaos : bassin thermal, case, vegetation de cirque.
- Plaine des Palmistes : corridor vert humide.
- Sud Sauvage : cote basaltique, eau vive, vegetation dense.

Impact :

- La carte n'est plus seulement Ouest + Volcan.
- `?mapDebug` reste centre sur la vue propre.
- Les biomes bruts sont reserves a l'URL d'audit `?visualZone=all&mapDebug`.
- Ce sont des blockouts : ils cadrent la direction, pas des assets finaux.

Statut :

- Typecheck, lint et build OK.
- Runtime `?mapDebug` recharge OK, sans erreur console nouvelle.
- Detail : [[iterations/2026-06-28-biomes-blockout-v0]].

Suite V0+ :

- Les biomes sont maintenant relies par un reseau visible.
- Les routes ont une bande asphalte + trait jaune.
- Les sentiers ont une bande terre + pierres de rive.
- Chaque biome a gagne des details de lecture : tunnels Route Littoral, marche et scene maloya a Saint-Denis, lacets de montagne, ponts de Mafate/Salazie, vapeur Cilaos, brume Plaine des Palmistes, stacks basaltiques Sud Sauvage.
- Validation : typecheck, lint, build OK ; audit global reserve a `?visualZone=all&mapDebug`.

Correction qualite :

- Le chargement automatique de tous les blockouts dans `?mapDebug` etait trop sale visuellement.
- `?mapDebug` ne force plus `visualZone=all`.
- Les biomes V0+ restent en debug explicite seulement.

## 2026-06-28 16:21 +04:00 - Biomes repris proprement

En clair :

- Les biomes brouillons ont ete remplaces par une version plus sobre.
- On peut maintenant inspecter un biome a la fois avec `?visualZone=<nom-du-biome>&mapDebug`.
- Les chemins entre zones suivent mieux le relief : ils sont densifies, ajustes vers les pentes plus douces, puis transformes en petites surfaces marchables.

Impact :

- Moins de pollution visuelle.
- Les liaisons racontent mieux le denivele de La Reunion.
- La suite peut se faire zone par zone, sans remplir toute l'ile avec des objets moyens.

Statut :

- Typecheck et lint client OK.
- Detail : [[iterations/2026-06-28-biomes-propres-v1]].

## 2026-06-30 08:02 +04:00 - Catalogue equipment verrouille et zones V1 completees

En clair :

- Le controle automatique des objets teste maintenant aussi les erreurs attendues.
- Un consommable avec un emplacement d'equipement est refuse.
- Un instrument sans emplacement est refuse.
- Une cle avec un emplacement d'equipement est refusee.
- Le catalogue des zones contient maintenant aussi Saint-Denis, Mafate, Salazie et Cilaos.

Impact :

- L'inventaire part sur une base plus fiable.
- Les futures quetes peuvent cibler les 7 zones gameplay prevues.
- Aucune nouvelle interface ou connexion reseau n'a ete ajoutee.

Statut :

- Validation content OK.
- Detail : [[iterations/2026-06-30-zones-catalogue-garde-fou-equipment]].

## 2026-06-30 08:20 +04:00 - Consignes agents (AGENTS.md) completees pour le pipeline terrain

En clair :

- Le projet a maintenant des fiches de consignes (AGENTS.md) pour chaque partie du jeu, lues par les assistants Claude et Codex.
- Codex avait deja prepare la racine et 7 fiches le matin meme.
- Il manquait la fiche du dossier "tools" (la fabrique du relief de l'ile). Elle est ajoutee.
- Claude et Codex se partagent le travail sans se gener : chacun sa branche, chacun sa fiche, on ne touche pas le meme fichier en meme temps.

Impact :

- Moins de risque que les deux assistants se marchent dessus.
- Les regles du terrain (priorite #1 du projet) sont ecrites noir sur blanc.
- Rien n'a ete commit : ce sont des fichiers de consignes, en attente de ta validation.

Statut :

- Documentation seulement, aucune ligne de code de jeu modifiee.
- Detail : [[iterations/2026-06-30-claude-tools-agents-audit]].

## 2026-06-30 08:10 +04:00 - Deux espaces de travail propres pour avancer en parallele

En clair :

- Le projet a maintenant deux dossiers de travail separes : un pour les essais sandbox, un pour les iterations continues.
- Chaque agent doit lire des consignes adaptees a son secteur avant de modifier le jeu.
- Les consignes sont separees pour le client 3D, le serveur, les donnees, les assets, le HUD et Obsidian.

Impact :

- Codex et Claude peuvent avancer en parallele sans se marcher dessus.
- Les essais restent hors de la branche principale tant qu'ils ne sont pas valides.
- Le projet garde une meilleure separation entre production, experimentation et petites passes regulieres.

Statut :

- Worktrees sandbox et iterations crees.
- Fichiers `AGENTS.md` sectoriels ajoutes.
- Detail : [[iterations/2026-06-30-codex-worktrees-agents]].
