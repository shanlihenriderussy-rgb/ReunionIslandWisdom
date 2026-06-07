export const zones = [
  {
    id: "piton-de-la-fournaise",
    name: "Piton de la Fournaise",
    // Spawn sur le rebord nord du cratere Dolomieu, face au sommet (sud).
    // Coordonnees monde ancrees sur le sommet RGE ALTI verifie (2610 m a world 65.9 / -37).
    spawn: { x: 65.9, y: 9, z: -35, yaw: 3.14 },
    description: "Zone de depart : volcan actif du sud-est, rebord de l'Enclos Fouque, cone central, vue sur le Piton des Neiges au nord-ouest."
  },
  {
    id: "saint-paul-saint-gilles",
    name: "Saint-Paul / Saint-Gilles",
    spawn: { x: -78, y: 1.38, z: 6, yaw: -0.45 },
    description: "Premier blockout jouable : plage ouest, chemin, ravine basse et montee vers le point de vue Maido / Mafate."
  },
  {
    id: "route-littoral",
    name: "Route du Littoral",
    spawn: { x: -60, y: 1.65, z: -36, yaw: -0.35 },
    description: "Mini-zone event autour du bouchon serveur."
  }
] as const;

export const npcs = [
  {
    id: "tatie-snack",
    name: "Tatie Snack",
    zoneId: "saint-paul-saint-gilles",
    position: { x: -78.5, y: 1.18, z: 7.5 },
    line: "Prends un bouchon, puis suis le chemin Saint-Paul / Saint-Gilles : snack, Car Jaune, ravine, point de vue Maido sur Mafate."
  },
  {
    id: "guide-volcan",
    name: "Guide Volcan",
    zoneId: "saint-paul-saint-gilles",
    position: { x: -56, y: 2.76, z: -31 },
    line: "Le sud mene vers la Fournaise, mais commence par passer la ravine."
  },
  {
    id: "chauffeur-car-jaune",
    name: "Chauffeur Car Jaune",
    zoneId: "saint-paul-saint-gilles",
    position: { x: -70, y: 1.16, z: -16 },
    line: "Le passage est bloque plus bas. Suis les marqueurs et verifie la ravine."
  },
  {
    id: "maitre-kabar",
    name: "Maitre Kabar",
    zoneId: "saint-paul-saint-gilles",
    position: { x: -82, y: 2.04, z: 17 },
    line: "Le lagon donne le rythme. Repere bien le debut du sentier."
  },
  {
    id: "agent-sentier",
    name: "Agent Sentier",
    zoneId: "saint-paul-saint-gilles",
    position: { x: -58, y: 2.35, z: -33 },
    line: "Sortie sud validee. La suite devra monter vers les hauts."
  },
  {
    id: "vendeuse-marche",
    name: "Vendeuse Marche",
    zoneId: "saint-paul-saint-gilles",
    position: { x: -76, y: 1.33, z: 3 },
    line: "Le chemin est encore en blockout. Note les pentes qui te genent."
  },
  {
    id: "meteore-cyclone",
    name: "Meteore Cyclone",
    zoneId: "saint-paul-saint-gilles",
    position: { x: -74, y: 0.94, z: -8 },
    line: "Sur la cote ouest, le temps change vite. Garde une sortie lisible."
  },
  {
    id: "gardien-ravine",
    name: "Gardien Ravine",
    zoneId: "saint-paul-saint-gilles",
    position: { x: -64, y: 2.18, z: -25 },
    line: "Une ravine, ca se respecte. Le joueur doit comprendre ou ne pas aller."
  },
  {
    id: "danseuse-maloya",
    name: "Danseuse Maloya",
    zoneId: "saint-paul-saint-gilles",
    position: { x: -80, y: 2.31, z: 19 },
    line: "Le belvedere doit respirer. Pas trop de props, juste le bon rythme."
  },
  {
    id: "ancien-volcan",
    name: "Ancien Volcan",
    zoneId: "saint-paul-saint-gilles",
    position: { x: -55, y: 3.24, z: -28 },
    line: "Au-dela, on preparera la transition vers les hauts et le volcan."
  },
  {
    id: "guide-maido",
    name: "Guide Maido",
    zoneId: "saint-paul-saint-gilles",
    position: { x: -36, y: 9.86, z: 8 },
    line: "Regarde en face : c'est Mafate. Le chemin doit donner cette sensation de rempart."
  }
] as const;

export const quests = [
  {
    id: "premier-tour-saint-paul-saint-gilles",
    title: "Premier tour Saint-Paul / Saint-Gilles",
    giverNpcId: "tatie-snack",
    objective: "Parler a Tatie Snack, suivre le chemin vers le Car Jaune, puis monter au point de vue Maido / Mafate.",
    rewardTitle: "Bouchon vapeur"
  },
  {
    id: "bouchon-route-littoral",
    title: "Bouchon Route du Littoral",
    giverNpcId: "chauffeur-car-jaune",
    objective: "Inspecter 3 cones sur la route.",
    rewardTitle: "Patience 974"
  },
  {
    id: "kayamb-kabar",
    title: "Le kayamb du kabar",
    giverNpcId: "maitre-kabar",
    objective: "Retrouver le kayamb perdu pres de la place.",
    rewardTitle: "Rythme Local"
  },
  {
    id: "sac-mafate",
    title: "Sac pour Mafate",
    giverNpcId: "agent-sentier",
    objective: "Verifier eau, lampe et casse-croute.",
    rewardTitle: "Pret Sentier"
  },
  {
    id: "epices-marche",
    title: "Epices du marche",
    giverNpcId: "vendeuse-marche",
    objective: "Retrouver la caisse d'epices.",
    rewardTitle: "Nez Fin"
  },
  {
    id: "fumee-fournaise",
    title: "Fumee Fournaise",
    giverNpcId: "ancien-volcan",
    objective: "Observer le signal volcan.",
    rewardTitle: "Veilleur Volcan"
  }
] as const;

export const items = [
  "barquette-cari",
  "rougail-saucisse",
  "bouchon-vapeur",
  "samoussa-piment",
  "bonbon-piment",
  "kayamb",
  "ticket-car-jaune",
  "cone-route-littoral",
  "gourde-sentier",
  "lampe-frontale",
  "carte-mafate",
  "sachet-epices",
  "pierre-volcan",
  "cape-cyclone",
  "casquette-974",
  "sandales-marche",
  "badge-kabar",
  "carnet-ravine",
  "panier-marche",
  "titre-patience-974"
] as const;

export const emotes = ["saluer", "danser-maloya", "attendre-bouchon", "pointer-volcan", "applaudir-kabar"] as const;
