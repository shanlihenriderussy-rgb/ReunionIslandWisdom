import type { NetworkClient, NetworkSnapshot } from "../network/NetworkClient";
import type { InputController } from "../game/InputController";

export type HudDebugInfo = {
  fps: number;
  pos: [number, number, number];
  zone: string;
};

export type HudController = {
  element: HTMLDivElement;
  setInteractPrompt: (label: string | null) => void;
  setZone: (label: string) => void;
  setDebug: (info: HudDebugInfo | null) => void;
  update: (snapshot: NetworkSnapshot) => void;
  isPaused: () => boolean;
  isMapView: () => boolean;
  getCameraZoom: () => number;
  setObjectiveStage: (stage: 1 | 2 | 3) => void;
  dispose: () => void;
};

type ConnState = "connecting" | "online" | "offline";
const OFFLINE_AFTER_MS = 4000;
const START_OBJECTIVE_NPC_NAME = "Tatie Snack";
const ROUTE_OBJECTIVE_NPC_NAME = "Chauffeur Car Jaune";
const EXIT_OBJECTIVE_NPC_NAME = "Guide Maido";
const START_QUEST_TITLE = "Éveil de la Fournaise";

type InvItem = {
  name: string;
  category: string;
  desc: string;
  count: number;
  icon: string;
};

export function createHud(network: NetworkClient, input: InputController): HudController {
  const element = document.createElement("div");
  element.className = "hud";

  // --- Helper for inline SVGs ---
  function getSvg(name: string): string {
    switch (name) {
      case "heart":
        return `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
      case "lightning":
        return `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`;
      case "backpack":
        return `<svg viewBox="0 0 64 64" width="22" height="22" fill="none"><rect x="18" y="20" width="28" height="32" rx="6" fill="#8a5a30" stroke="#3e2715" stroke-width="2.5"/><path d="M18 24 Q32 14 46 24 L42 34 L22 34 Z" fill="#5e3c20" stroke="#3e2715" stroke-width="2"/><line x1="25" y1="34" x2="25" y2="52" stroke="#3e2715" stroke-width="2"/><line x1="39" y1="34" x2="39" y2="52" stroke="#3e2715" stroke-width="2"/><circle cx="25" cy="42" r="2" fill="#ffd700"/><circle cx="39" cy="42" r="2" fill="#ffd700"/></svg>`;
      case "map":
        return `<svg viewBox="0 0 64 64" width="22" height="22" fill="none"><polygon points="12,18 24,10 38,18 52,10 52,46 38,54 24,46 12,54" fill="#ecd7c0" stroke="#3e2715" stroke-width="2.5"/><polyline points="24,10 24,46" fill="none" stroke="#3e2715" stroke-width="1.5" stroke-dasharray="2,2"/><polyline points="38,18 38,54" fill="none" stroke="#3e2715" stroke-width="1.5" stroke-dasharray="2,2"/><path d="M18 36 Q28 26 34 38 Q42 46 48 30" fill="none" stroke="#ff4500" stroke-width="2" stroke-linecap="round" stroke-dasharray="2,3"/><circle cx="48" cy="30" r="3" fill="#ff4500"/></svg>`;
      case "gear":
        return `<svg viewBox="0 0 64 64" width="22" height="22" fill="none"><circle cx="32" cy="32" r="14" fill="#948b7f" stroke="#14110f" stroke-width="2.5"/><g fill="#948b7f" stroke="#14110f" stroke-width="2.5"><rect x="28" y="8" width="8" height="8" rx="1"/><rect x="28" y="48" width="8" height="8" rx="1"/><rect x="8" y="28" width="8" height="8" rx="1"/><rect x="48" y="28" width="8" height="8" rx="1"/></g><circle cx="32" cy="32" r="14" fill="#948b7f" stroke="none"/><circle cx="32" cy="32" r="6" fill="#14110f"/></svg>`;
      case "friends":
        return `<svg viewBox="0 0 64 64" width="22" height="22" fill="none"><path d="M16 48 C16 40 24 38 28 38 C32 38 40 40 40 48" fill="#948b7f" stroke="#14110f" stroke-width="2.5"/><circle cx="28" cy="26" r="8" fill="#948b7f" stroke="#14110f" stroke-width="2.5"/><path d="M34 50 C34 44 40 42 44 42 C48 42 54 44 54 50" fill="#635c53" stroke="#14110f" stroke-width="2" opacity="0.9"/><circle cx="44" cy="32" r="6" fill="#635c53" stroke="#14110f" stroke-width="2" opacity="0.9"/></svg>`;
      case "close":
        return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none"><path d="M18 6 L6 18 M6 6 L18 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
      case "mango":
        return `<svg viewBox="0 0 64 64" width="40" height="40" fill="none"><path d="M32 16 Q18 16 16 32 Q14 46 28 50 Q46 52 48 38 Q50 24 32 16" fill="#ffa500" stroke="#3e2715" stroke-width="2.5"/><path d="M32 16 Q36 8 46 4 Q38 12 32 16" fill="#228b22" stroke="#3e2715" stroke-width="2"/></svg>`;
      case "crystal":
        return `<svg viewBox="0 0 64 64" width="40" height="40" fill="none"><polygon points="32,8 50,24 40,54 24,54 14,24" fill="#00bfff" stroke="#0f4c5c" stroke-width="2.5"/><polygon points="32,8 32,54 40,54 50,24" fill="#1e90ff" opacity="0.7"/><polygon points="32,8 24,54 32,54" fill="#87cefa" opacity="0.5"/></svg>`;
      case "leaf":
        return `<svg viewBox="0 0 64 64" width="40" height="40" fill="none"><path d="M12 52 Q32 48 52 12 Q36 24 12 52" fill="#7dbe5c" stroke="#182a15" stroke-width="2.5"/><path d="M12 52 Q24 36 52 12 Q42 20 12 52" fill="#5fa341" opacity="0.7"/><line x1="12" y1="52" x2="52" y2="12" stroke="#182a15" stroke-width="2"/></svg>`;
      case "wood":
        return `<svg viewBox="0 0 64 64" width="40" height="40" fill="none"><ellipse cx="32" cy="24" rx="20" ry="12" fill="#ecd7c0" stroke="#3e2715" stroke-width="3"/><ellipse cx="32" cy="24" rx="14" ry="8" fill="none" stroke="#c4956a" stroke-width="1.5"/><ellipse cx="32" cy="24" rx="8" ry="4" fill="none" stroke="#c4956a" stroke-width="1.5"/><path d="M12 24 L12 40 Q32 52 52 40 L52 24 Q32 36 12 24 Z" fill="#8a5a30" stroke="#3e2715" stroke-width="3"/><ellipse cx="32" cy="24" rx="20" ry="12" fill="none" stroke="#3e2715" stroke-width="3"/></svg>`;
      case "meat":
        return `<svg viewBox="0 0 64 64" width="40" height="40" fill="none"><path d="M16 36 C8 24 24 8 36 16 C44 22 46 34 38 42 C30 50 22 44 16 36 Z" fill="#e5645a" stroke="#3c110d" stroke-width="2.5"/><circle cx="28" cy="26" r="6" fill="#fff"/><path d="M38 42 L50 50" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="48" cy="52" r="5" fill="#fff" stroke="#3c110d" stroke-width="2"/><circle cx="52" cy="48" r="5" fill="#fff" stroke="#3c110d" stroke-width="2"/></svg>`;
      case "flower":
        return `<svg viewBox="0 0 64 64" width="40" height="40" fill="none"><g fill="#9370db" stroke="#3e110d" stroke-width="2"><circle cx="32" cy="18" r="10"/><circle cx="44" cy="28" r="10"/><circle cx="39" cy="44" r="10"/><circle cx="25" cy="44" r="10"/><circle cx="20" cy="28" r="10"/></g><circle cx="32" cy="32" r="6" fill="#ffd700" stroke="#3e110d" stroke-width="2"/></svg>`;
      case "shell":
        return `<svg viewBox="0 0 64 64" width="40" height="40" fill="none"><path d="M16 44 Q14 26 28 16 Q44 6 50 18 Q54 32 40 44 Q28 52 16 44 Z" fill="#ecd7c0" stroke="#3e2715" stroke-width="2.5"/><path d="M16 44 Q26 36 34 26 Q40 18 50 18" fill="none" stroke="#3e2715" stroke-width="2"/></svg>`;
      case "potion":
        return `<svg viewBox="0 0 64 64" width="40" height="40" fill="none"><rect x="28" y="10" width="8" height="10" fill="#e2f6fa" stroke="#0f4c5c" stroke-width="2.5"/><rect x="26" y="8" width="12" height="3" rx="1" fill="#8a5a30" stroke="#3e2715" stroke-width="1.5"/><path d="M28 20 C18 24 14 36 14 48 C14 56 20 58 32 58 C44 58 50 56 50 48 C50 36 46 24 36 20 Z" fill="#e2f6fa" stroke="#0f4c5c" stroke-width="2.5" opacity="0.85"/><path d="M16 44 C16 44 24 42 32 44 C40 46 48 44 48 44 L48 48 C48 54 44 56 32 56 C20 56 16 54 16 48 Z" fill="#1e90ff" stroke="#0f4c5c" stroke-width="2"/></svg>`;
      case "tiki":
        return `<svg viewBox="0 0 64 64" width="56" height="56" fill="none"><rect x="20" y="14" width="24" height="40" rx="4" fill="#a0522d" stroke="#3e2715" stroke-width="3"/><path d="M24 14 Q20 2 12 0 Q18 8 22 14" fill="#ff4500"/><path d="M28 14 Q28 0 28 -4 Q32 8 32 14" fill="#ffd700"/><path d="M36 14 Q40 0 44 -2 Q40 8 38 14" fill="#32cd32"/><path d="M40 14 Q48 2 52 4 Q44 10 42 14" fill="#1e90ff"/><path d="M14 44 Q20 54 32 60 Q44 54 50 44 Q32 48 14 44" fill="#228b22" stroke="#3e2715" stroke-width="2"/><path d="M16 22 L32 26 L48 22 L32 30 Z" fill="#ff8c00" stroke="#3e2715" stroke-width="1.5"/><rect x="22" y="28" width="8" height="6" rx="2" fill="#ffd700" stroke="#3e2715" stroke-width="2"/><rect x="34" y="28" width="8" height="6" rx="2" fill="#ffd700" stroke="#3e2715" stroke-width="2"/><circle cx="26" cy="31" r="2" fill="#ff4500"/><circle cx="38" cy="31" r="2" fill="#ff4500"/><polygon points="32,26 28,40 36,40" fill="#ff4500" stroke="#3e2715" stroke-width="2"/><rect x="24" y="42" width="16" height="6" rx="1" fill="#fff" stroke="#3e2715" stroke-width="2"/><line x1="28" y1="42" x2="28" y2="48" stroke="#3e2715" stroke-width="1.5"/><line x1="32" y1="42" x2="32" y2="48" stroke="#3e2715" stroke-width="1.5"/><line x1="36" y1="42" x2="36" y2="48" stroke="#3e2715" stroke-width="1.5"/></svg>`;
      case "player":
        return `<svg viewBox="0 0 64 64" width="46" height="46" fill="none"><circle cx="32" cy="32" r="30" fill="#2a2624" stroke="#14110f" stroke-width="2"/><circle cx="32" cy="36" r="18" fill="#f2c66d"/><path d="M18 24 Q32 8 46 24 Q48 18 42 12 Q32 6 22 12 Q16 18 18 24" fill="#5e3c20"/><path d="M22 14 L20 8 L26 12 L28 6 L33 11 L37 6 L40 12 L46 9 L44 16" fill="#5e3c20"/><circle cx="26" cy="32" r="2.5" fill="#14110f"/><circle cx="38" cy="32" r="2.5" fill="#14110f"/><circle cx="27" cy="31" r="1" fill="#fff"/><circle cx="39" cy="31" r="1" fill="#fff"/><path d="M28 40 Q32 44 36 40" fill="none" stroke="#14110f" stroke-width="2" stroke-linecap="round"/><circle cx="22" cy="35" r="2" fill="#e5645a" opacity="0.6"/><circle cx="42" cy="35" r="2" fill="#e5645a" opacity="0.6"/></svg>`;
      default:
        return "";
    }
  }

  // --- STATE FOR MOCK ITEMS ---
  const inventoryItems: InvItem[] = [
    { name: "Fruit Péi", category: "Consommable", desc: "Restaure 300 points de vie.", count: 12, icon: "mango" },
    { name: "Cristal Bleu", category: "Ressource", desc: "Un cristal brillant récolté sur les hauteurs.", count: 7, icon: "crystal" },
    { name: "Feuille Verte", category: "Composant", desc: "Plante médicinale utilisée pour l'alchimie.", count: 9, icon: "leaf" },
    { name: "Bois de Tamarin", category: "Composant", desc: "Bois très résistant utilisé pour les constructions.", count: 16, icon: "wood" },
    { name: "Gigot Péi", category: "Nourriture", desc: "Restaure 150 points de vie.", count: 3, icon: "meat" },
    { name: "Fleur Jacaranda", category: "Composant", desc: "Une fleur violette rare qui embaume.", count: 4, icon: "flower" },
    { name: "Coquillage", category: "Ressource", desc: "Trouvé sur le littoral sablonneux.", count: 2, icon: "shell" },
    { name: "Potion de Vie", category: "Consommable", desc: "Restaure 500 points de vie instantanément.", count: 8, icon: "potion" }
  ];
  let selectedItemIndex = 0;

  // --- 1. TOP-LEFT PANEL (Player Card) ---
  const topLeftPanel = document.createElement("div");
  topLeftPanel.className = "hud-top-left";

  const playerCard = document.createElement("div");
  playerCard.className = "riw-panel hud-player-frame";

  const avatarContainer = document.createElement("div");
  avatarContainer.className = "hud-player-avatar";
  avatarContainer.innerHTML = getSvg("player");

  const levelBadge = document.createElement("div");
  levelBadge.className = "hud-level-badge";
  levelBadge.textContent = "25";
  avatarContainer.appendChild(levelBadge);

  const statsContainer = document.createElement("div");
  statsContainer.className = "hud-player-stats";

  // HP Bar
  const hpBar = document.createElement("div");
  hpBar.className = "hud-stat-bar";
  const hpFill = document.createElement("div");
  hpFill.className = "hud-stat-fill hp";
  hpFill.style.width = "100%";
  const hpLabel = document.createElement("div");
  hpLabel.className = "hud-stat-label";
  hpLabel.innerHTML = `${getSvg("heart")} 1250 / 1250`;
  hpBar.append(hpFill, hpLabel);

  // Mana Bar
  const manaBar = document.createElement("div");
  manaBar.className = "hud-stat-bar";
  const manaFill = document.createElement("div");
  manaFill.className = "hud-stat-fill mana";
  manaFill.style.width = "100%";
  const manaLabel = document.createElement("div");
  manaLabel.className = "hud-stat-label";
  manaLabel.innerHTML = `${getSvg("lightning")} 850 / 850`;
  manaBar.append(manaFill, manaLabel);

  statsContainer.append(hpBar, manaBar);
  playerCard.append(avatarContainer, statsContainer);
  topLeftPanel.appendChild(playerCard);

  // --- 2. TOP-CENTER BAR (Hexagon Menu Buttons) ---
  const topCenterBar = document.createElement("div");
  topCenterBar.className = "hud-top-center";

  const menuButtons = [
    { name: "bag", icon: "backpack", label: "Inventaire" },
    { name: "map", icon: "map", label: "Carte" },
    { name: "settings", icon: "gear", label: "Options" },
    { name: "friends", icon: "friends", label: "Social" }
  ] as const;

  const createdMenuButtons: HTMLDivElement[] = [];

  menuButtons.forEach((btn) => {
    const btnEl = document.createElement("div");
    btnEl.className = "hud-menu-btn-round";
    btnEl.setAttribute("title", btn.label);
    btnEl.innerHTML = getSvg(btn.icon);
    topCenterBar.appendChild(btnEl);
    createdMenuButtons.push(btnEl);
  });

  // --- 3. TOP-RIGHT CONTAINER (Minimap + Status Card) ---
  const topRightPanel = document.createElement("div");
  topRightPanel.className = "hud-top-right";

  const minimapCard = document.createElement("div");
  minimapCard.className = "hud-minimap-card";

  const minimapCircle = document.createElement("div");
  minimapCircle.className = "hud-minimap-circle";

  const minimapIsland = document.createElement("div");
  minimapIsland.className = "hud-minimap-island";
  const minimapCompass = document.createElement("div");
  minimapCompass.className = "hud-minimap-compass";
  minimapCompass.textContent = "N";
  minimapCircle.append(minimapIsland, minimapCompass);

  const statusCard = document.createElement("div");
  statusCard.className = "hud-status-card";

  const statusZone = document.createElement("div");
  statusZone.className = "hud-status-zone";
  statusZone.textContent = "Saint-Paul / Saint-Gilles";

  const statusPlayers = document.createElement("div");
  statusPlayers.className = "hud-status-players";

  const statusDot = document.createElement("span");
  statusDot.className = "hud-status-dot online";
  const statusLabel = document.createElement("span");
  statusLabel.textContent = "En ligne : 1";

  statusPlayers.append(statusDot, statusLabel);
  statusCard.append(statusZone, statusPlayers);
  minimapCard.append(minimapCircle, statusCard);
  topRightPanel.appendChild(minimapCard);

  // --- 4. LEFT-MIDDLE PANEL (Objectives) ---
  const leftMidPanel = document.createElement("div");
  leftMidPanel.className = "hud-left-mid";

  const objectivePanel = document.createElement("div");
  objectivePanel.className = "riw-panel riw-objective hud-objective-panel";

  const objHead = document.createElement("div");
  objHead.className = "riw-objective__head";
  objHead.innerHTML = `<strong>Objectif</strong>`;

  const objSteps = document.createElement("ul");
  objSteps.className = "riw-steps";

  const objStep1 = document.createElement("li");
  objStep1.className = "riw-step is-current";
  objStep1.innerHTML = `<span class="riw-step__box"></span> <span>Parle à Tatie Snack au départ du sentier.</span>`;

  const objStep2 = document.createElement("li");
  objStep2.className = "riw-step";
  objStep2.innerHTML = `<span class="riw-step__box"></span> <span>Suis le chemin vers le Chauffeur Car Jaune.</span>`;

  const objStep3 = document.createElement("li");
  objStep3.className = "riw-step";
  objStep3.innerHTML = `<span class="riw-step__box"></span> <span>Monte au point de vue Maïdo / Mafate.</span>`;

  objSteps.append(objStep1, objStep2, objStep3);
  objectivePanel.append(objHead, objSteps);
  leftMidPanel.appendChild(objectivePanel);

  // --- 5. BOTTOM AREA (Hotbar + docked Panels Grid) ---
  const bottomArea = document.createElement("div");
  bottomArea.className = "hud-bottom-area";

  // Hotbar floating above
  const hotbarWrapper = document.createElement("div");
  hotbarWrapper.className = "hud-hotbar-wrapper";

  const hotbarGrid = document.createElement("div");
  hotbarGrid.className = "hud-hotbar-grid";

  // Create 10 hotbar slots
  for (let i = 1; i <= 10; i += 1) {
    const slot = document.createElement("div");
    slot.className = "hud-hotbar-slot";
    const key = i === 10 ? 0 : i;
    slot.innerHTML = `<span class="hud-hotbar-key">${key}</span>`;
    // Add default spells/items icons from mockup into slots 1-6
    if (i === 1) {
      slot.innerHTML += `<span style="transform: scale(0.7); display:grid; place-items:center;">${getSvg("potion")}</span>`;
    } else if (i === 2) {
      slot.innerHTML += `<span style="transform: scale(0.7); display:grid; place-items:center;">${getSvg("wood")}</span>`;
    } else if (i === 3) {
      slot.innerHTML += `<span style="transform: scale(0.7); display:grid; place-items:center;">${getSvg("leaf")}</span>`;
    } else if (i === 4) {
      slot.innerHTML += `<span style="transform: scale(0.7); display:grid; place-items:center;">${getSvg("meat")}</span>`;
    } else if (i === 5) {
      slot.innerHTML += `<span style="transform: scale(0.7); display:grid; place-items:center;">${getSvg("tiki")}</span>`;
    } else if (i === 6) {
      slot.innerHTML += `<span style="transform: scale(0.7); display:grid; place-items:center;">${getSvg("crystal")}</span>`;
    }
    hotbarGrid.appendChild(slot);
  }

  const xpTracker = document.createElement("div");
  xpTracker.className = "hud-xp-tracker";
  const xpFill = document.createElement("div");
  xpFill.className = "hud-xp-fill";
  xpFill.style.width = "50%";
  const xpLabel = document.createElement("div");
  xpLabel.className = "hud-xp-label";
  xpLabel.textContent = "12500 / 25000 XP";
  xpTracker.append(xpFill, xpLabel);

  hotbarWrapper.append(hotbarGrid, xpTracker);
  bottomArea.appendChild(hotbarWrapper);

  // Bottom Panels Grid
  const bottomGrid = document.createElement("div");
  bottomGrid.className = "hud-bottom-grid";

  // Panel 1: Dialogue panel (wood style)
  const dialoguePanel = document.createElement("div");
  dialoguePanel.className = "riw-wood hud-dialogue-panel";
  // Masque tant qu'aucun PNJ ne parle : pas de cartouche vide en bas d'ecran.
  dialoguePanel.hidden = true;

  const dialogueTitle = document.createElement("div");
  dialogueTitle.className = "hud-panel-title hud-wood-title";
  dialogueTitle.innerHTML = `<span>Conversation</span>`;

  const dialogueContent = document.createElement("div");
  dialogueContent.className = "riw-dialogue";

  const dialogueTop = document.createElement("div");
  dialogueTop.className = "riw-dialogue__top";

  const dialoguePortrait = document.createElement("div");
  dialoguePortrait.className = "riw-portrait";
  dialoguePortrait.innerHTML = getSvg("tiki");

  const dialogueTextCol = document.createElement("div");
  dialogueTextCol.style.flex = "1";

  const dialogueName = document.createElement("strong");
  dialogueName.className = "riw-dialogue__name";
  dialogueName.textContent = "Aku Aku";

  const dialogueLine = document.createElement("p");
  dialogueLine.className = "riw-dialogue__line";
  dialogueLine.textContent = "Wouhou ! Belle journée pour une aventure à La Réunion !";

  dialogueTextCol.append(dialogueName, dialogueLine);
  dialogueTop.append(dialoguePortrait, dialogueTextCol);

  const dialogueAnswers = document.createElement("div");
  dialogueAnswers.className = "riw-dialogue__answers";
  const defaultCloseBtn = document.createElement("button");
  defaultCloseBtn.className = "riw-answer";
  defaultCloseBtn.innerHTML = `<span class="riw-key">Esc</span> <span>Fermer</span>`;
  defaultCloseBtn.addEventListener("click", () => resetDialogue());
  dialogueAnswers.appendChild(defaultCloseBtn);

  dialogueContent.append(dialogueTop, dialogueAnswers);
  dialoguePanel.append(dialogueTitle, dialogueContent);

  // Panel 2: Inventory panel (wood style)
  const invPanel = document.createElement("div");
  invPanel.className = "riw-wood hud-inventory-panel";

  const invTitle = document.createElement("div");
  invTitle.className = "hud-panel-title hud-wood-title";
  const invCount = document.createElement("span");
  const invClose = document.createElement("span");
  invClose.className = "hud-panel-close";
  invClose.title = "Fermer (I)";
  invClose.innerHTML = getSvg("close");
  invTitle.append(invCount, invClose);

  const invGrid = document.createElement("div");
  invGrid.className = "riw-inv-grid";

  const INV_CAPACITY = 40;

  // Function to render inventory slots
  function renderInventory(): void {
    invCount.textContent = `Sac à dos · ${inventoryItems.length} / ${INV_CAPACITY}`;
    invGrid.replaceChildren(
      ...inventoryItems.map((item, index) => {
        const slot = document.createElement("div");
        slot.className = "riw-slot";
        if (index === selectedItemIndex) {
          slot.classList.add("is-selected");
        }
        slot.innerHTML = `
          <div class="riw-slot__icon" style="display:grid; place-items:center;">${getSvg(item.icon)}</div>
          <span class="riw-slot__count">${item.count}</span>
        `;
        slot.addEventListener("click", () => {
          selectedItemIndex = index;
          renderInventory();
          renderInfoPanel();
        });
        return slot;
      })
    );
  }

  invPanel.append(invTitle, invGrid);

  // Panneau "Menu" vertical retire : la barre d'icones haut-centre (sac / carte /
  // reglages / social) couvre la navigation. Une touche = une action, pas de double menu.

  // Panel 4: Quest Window (basalt style)
  const questPanel = document.createElement("div");
  questPanel.className = "riw-panel hud-quest-panel";

  const questTitle = document.createElement("div");
  questTitle.className = "hud-panel-title";
  questTitle.innerHTML = `<span>Journal de quêtes</span> <span class="hud-panel-close" title="Fermer">${getSvg("close")}</span>`;
  questTitle.querySelector(".hud-panel-close")?.addEventListener("click", () => closeModals());

  const questBody = document.createElement("div");
  questBody.style.fontSize = "13px";
  questBody.style.display = "flex";
  questBody.style.flexDirection = "column";
  questBody.style.gap = "8px";
  questBody.innerHTML = `
    <div style="font-weight:bold; color:var(--hud-gold-ink);">${START_QUEST_TITLE}</div>
    <div style="color:var(--hud-ink-soft);">◆ Départ : snack de Saint-Paul / Saint-Gilles</div>
    <div style="color:var(--hud-ink-soft);">◆ Parcours : lagon → Car Jaune → ravine → point de vue Maïdo / Mafate</div>
    <div style="margin-top:8px; border-top:1px solid var(--hud-hairline); padding-top:8px;">
      <div style="font-weight:bold; color:var(--hud-gold-ink); font-size:11px; text-transform:uppercase;">Récompenses</div>
      <div style="display:flex; gap:12px; margin-top:4px; font-size:12px;">
        <span><b>XP</b> 150</span>
        <span><b>Item</b> Pierre de lave</span>
      </div>
    </div>
  `;
  questPanel.append(questTitle, questBody);

  // Panel 5: Right Column (Notifications + Info Window)
  const rightColumn = document.createElement("div");
  rightColumn.className = "hud-right-wrapper";

  // Notifications box
  const notificationsPanel = document.createElement("div");
  notificationsPanel.className = "hud-notifications-panel";
  notificationsPanel.style.display = "flex";
  notificationsPanel.style.flexDirection = "column";
  notificationsPanel.style.gap = "4px";

  // Info Window
  const infoPanel = document.createElement("div");
  infoPanel.className = "riw-panel hud-info-panel";

  const infoTitle = document.createElement("div");
  infoTitle.className = "hud-panel-title";
  infoTitle.innerHTML = `<span>Détails de l'objet</span>`;

  const infoContent = document.createElement("div");
  infoContent.className = "hud-info-detail";

  function renderInfoPanel(): void {
    const item = inventoryItems[selectedItemIndex];
    if (!item) {
      infoContent.innerHTML = `<div style="font-style:italic; color:var(--hud-ink-faint);">Aucun objet sélectionné.</div>`;
      return;
    }

    infoContent.innerHTML = `
      <div style="display:flex; gap:12px; align-items:center;">
        <div class="riw-slot" style="cursor:default; width:52px; height:52px;">
          <div class="riw-slot__icon" style="display:grid; place-items:center; transform:scale(0.8);">${getSvg(item.icon)}</div>
        </div>
        <div>
          <div class="hud-info-name">${item.name}</div>
          <div style="font-size:11px; color:var(--hud-ink-faint);">${item.category}</div>
        </div>
      </div>
      <div class="hud-info-desc" style="margin-top:8px;">${item.desc}</div>
      <button class="riw-btn riw-btn--sm" style="width:100%; margin-top:8px;">Utiliser (x${item.count})</button>
    `;

    infoContent.querySelector("button")?.addEventListener("click", () => {
      if (item.count > 0) {
        item.count -= 1;
        addNotification(`Vous utilisez ${item.name} !`);
        renderInventory();
        renderInfoPanel();
      }
    });
  }

  infoPanel.append(infoTitle, infoContent);
  rightColumn.append(notificationsPanel, infoPanel);

  // Bas de l'ecran : seulement dialogue (quand actif) + notifications. Plus de mur d'UI.
  bottomGrid.append(dialoguePanel, rightColumn);
  bottomArea.appendChild(bottomGrid);

  // --- Overlay modal centre (inventaire / quetes / menu) ---
  // Panneaux lourds sortis du flux permanent : ouverts a la demande, fermes par Echap.
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "hud-modal-overlay";
  modalOverlay.hidden = true;

  const modalShell = document.createElement("div");
  modalShell.className = "hud-modal-shell";

  // Inventaire + detail objet cote a cote dans la modale.
  const invModalBody = document.createElement("div");
  invModalBody.className = "hud-modal-inv-body";
  invModalBody.append(invPanel, infoPanel);

  // Menu vertical retire de la modale : redondant avec la barre d'icones haut-centre.
  // On garde inventaire (+ detail) et journal de quetes.
  modalShell.append(invModalBody, questPanel);
  modalOverlay.appendChild(modalShell);

  // Ferme la modale en cliquant le fond (hors panneaux).
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      closeModals();
    }
  });

  // --- Zoom control wrapper ---
  const zoomWrapper = document.createElement("div");
  zoomWrapper.className = "hud-zoom-wrapper";

  const zoomControl = document.createElement("div");
  zoomControl.className = "riw-zoom";

  const zoomInBtn = document.createElement("button");
  zoomInBtn.type = "button";
  zoomInBtn.className = "riw-zoom__btn";
  zoomInBtn.textContent = "+";

  const zoomRange = document.createElement("input");
  zoomRange.type = "range";
  zoomRange.min = "0";
  zoomRange.max = "100";
  zoomRange.value = "44";
  zoomRange.step = "1";
  zoomRange.setAttribute("aria-label", "Zoom camera");

  const zoomOutBtn = document.createElement("button");
  zoomOutBtn.type = "button";
  zoomOutBtn.className = "riw-zoom__btn";
  zoomOutBtn.textContent = "-";

  zoomControl.append(zoomInBtn, zoomRange, zoomOutBtn);
  zoomWrapper.appendChild(zoomControl);

  // --- Floating Chat Input (appears when Enter pressed) ---
  const chatInputContainer = document.createElement("div");
  chatInputContainer.style.position = "absolute";
  chatInputContainer.style.bottom = "240px";
  chatInputContainer.style.left = "50%";
  chatInputContainer.style.transform = "translateX(-50%)";
  chatInputContainer.style.width = "400px";
  chatInputContainer.style.pointerEvents = "auto";
  chatInputContainer.hidden = true;

  const chatInput = document.createElement("input");
  chatInput.className = "riw-chat__input";
  chatInput.placeholder = "Discuter (Entrée pour envoyer, Échap pour annuler)...";
  chatInput.maxLength = 100;
  chatInputContainer.appendChild(chatInput);

  // --- Interaction Prompt ---
  const interactPrompt = document.createElement("div");
  interactPrompt.className = "riw-prompt";
  interactPrompt.style.position = "absolute";
  interactPrompt.style.bottom = "240px";
  interactPrompt.style.left = "50%";
  interactPrompt.style.transform = "translateX(-50%)";
  interactPrompt.hidden = true;

  // --- Contrôles tactiles mobile (joystick + bouton action) ---
  // Visibles uniquement sur pointeur grossier (voir styles.css), masqués en pause/carte/modale.
  const touchControls = document.createElement("div");
  touchControls.className = "hud-touch-controls";

  const joystick = document.createElement("div");
  joystick.className = "hud-joystick";
  joystick.setAttribute("aria-label", "Joystick de déplacement");

  const joystickThumb = document.createElement("div");
  joystickThumb.className = "hud-joystick__thumb";
  joystick.appendChild(joystickThumb);

  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.className = "hud-action-btn";
  actionButton.innerHTML = `<span class="hud-action-btn__key">E</span>`;
  actionButton.setAttribute("aria-label", "Interagir");

  touchControls.append(joystick, actionButton);

  let joystickPointerId: number | null = null;

  function updateJoystick(event: PointerEvent): void {
    const rect = joystick.getBoundingClientRect();
    const max = rect.width / 2;
    if (max <= 0) {
      return;
    }
    let dx = event.clientX - (rect.left + max);
    let dy = event.clientY - (rect.top + max);
    const dist = Math.hypot(dx, dy);
    if (dist > max) {
      dx = (dx / dist) * max;
      dy = (dy / dist) * max;
    }
    joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;
    // x droite positif ; y vers le haut = avancer => z négatif.
    input.setTouchVector(dx / max, dy / max);
  }

  function releaseJoystick(event: PointerEvent): void {
    if (event.pointerId !== joystickPointerId) {
      return;
    }
    joystickPointerId = null;
    input.setTouchVector(0, 0);
    joystickThumb.style.transform = "translate(0, 0)";
  }

  joystick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    joystickPointerId = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    updateJoystick(event);
  });
  joystick.addEventListener("pointermove", (event) => {
    if (event.pointerId === joystickPointerId) {
      updateJoystick(event);
    }
  });
  joystick.addEventListener("pointerup", releaseJoystick);
  joystick.addEventListener("pointercancel", releaseJoystick);

  actionButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    input.pressInteract();
    actionButton.classList.add("is-active");
  });
  actionButton.addEventListener("pointerup", () => actionButton.classList.remove("is-active"));
  actionButton.addEventListener("pointercancel", () => actionButton.classList.remove("is-active"));

  // --- Menu pause (overlay) ---
  const pausePanel = document.createElement("div");
  pausePanel.className = "pause-panel riw-pause";
  pausePanel.hidden = true;
  pausePanel.style.position = "absolute";
  pausePanel.style.inset = "0";
  pausePanel.style.display = "none";
  pausePanel.style.flexDirection = "column";
  pausePanel.style.gap = "20px";
  pausePanel.style.alignItems = "center";
  pausePanel.style.justifyContent = "center";

  const pauseTitle = document.createElement("strong");
  pauseTitle.className = "riw-pause__title";
  pauseTitle.textContent = "Pause";

  const pauseControls = document.createElement("div");
  pauseControls.className = "riw-pause__keys";
  pauseControls.innerHTML = `
    <span><b>ZQSD / WASD</b> Se déplacer</span>
    <span><b>Souris</b> Tourner la caméra</span>
    <span><b>I</b> Sac à dos</span>
    <span><b>J</b> Journal de quêtes</span>
    <span><b>M</b> Carte</span>
    <span><b>Entrée</b> Discuter</span>
    <span><b>Échap</b> Fermer / Pause</span>
  `;

  const resumeBtn = document.createElement("button");
  resumeBtn.className = "riw-btn";
  resumeBtn.textContent = "Reprendre le Jeu";

  pausePanel.append(pauseTitle, pauseControls, resumeBtn);

  // --- Debug Panel ---
  const debugPanel = document.createElement("div");
  debugPanel.className = "riw-debug";
  debugPanel.hidden = true;

  element.append(
    topLeftPanel,
    topCenterBar,
    topRightPanel,
    leftMidPanel,
    bottomArea,
    modalOverlay,
    zoomWrapper,
    chatInputContainer,
    interactPrompt,
    touchControls,
    pausePanel,
    debugPanel
  );

  // --- HUD mock gate ---
  // Audit 2026-06-25 : le HUD mock (jauges HP/Mana/XP, minimap trompeuse, hotbar,
  // details objet) promet un gameplay inexistant -> no-go public. On le masque par
  // defaut ; on le reaffiche avec ?hudMock pour les captures de maquette / debug.
  // On garde le chrome reel : objectif de zone, zone, notifs, chat, carte, pause.
  const showMockHud = new URLSearchParams(window.location.search).has("hudMock");
  if (!showMockHud) {
    playerCard.hidden = true; // jauges HP/Mana + badge niveau 25 (mock)
    minimapCircle.hidden = true; // minimap SVG statique trompeuse (statusCard conserve)
    hotbarWrapper.hidden = true; // 10 slots + barre XP (mock)
    infoPanel.hidden = true; // details objet d'inventaire (mock)
    createdMenuButtons[0]?.style.setProperty("display", "none"); // bouton Sac (inventaire mock)
    createdMenuButtons[3]?.style.setProperty("display", "none"); // bouton Social (mock)
  }

  // --- STATE & INTERACTION LOGIC ---
  let paused = false;
  let mapView = new URLSearchParams(window.location.search).has("mapDebug");
  let firstUpdateAt = 0;
  let lastChatCount = -1;
  let objectiveStage: 0 | 1 | 2 | 3 = 0;

  // Render initial panels
  renderInventory();
  renderInfoPanel();

  // Show default notifications
  const welcomeControls = showMockHud
    ? "Touche I : sac · J : quêtes · M : carte."
    : "Touche J : quêtes · M : carte.";
  setTimeout(() => addNotification(`Bienvenue à La Réunion ! ${welcomeControls}`), 500);
  setTimeout(() => addNotification(`Nouvelle quête : ${START_QUEST_TITLE}.`), 2500);

  function addNotification(text: string): void {
    const line = document.createElement("div");
    line.className = "hud-notif-line";
    line.textContent = text;
    notificationsPanel.appendChild(line);
    // limit to 3 notifications
    while (notificationsPanel.children.length > 3) {
      notificationsPanel.removeChild(notificationsPanel.firstChild!);
    }
    // Fade out after 6 seconds
    setTimeout(() => {
      if (line.parentNode) {
        line.style.transition = "opacity 0.5s, transform 0.5s";
        line.style.opacity = "0";
        line.style.transform = "translateX(20px)";
        setTimeout(() => {
          if (line.parentNode) {
            notificationsPanel.removeChild(line);
          }
        }, 500);
      }
    }, 6000);
  }

  // Système de modale : un seul écran ouvert à la fois, indépendant de la pause.
  type ModalName = "inventory" | "quests";
  let openModal: ModalName | null = null;

  function showModal(name: ModalName): void {
    openModal = name;
    invModalBody.hidden = name !== "inventory";
    questPanel.hidden = name !== "quests";
    invModalBody.style.display = name === "inventory" ? "flex" : "none";
    questPanel.style.display = name === "quests" ? "flex" : "none";
    modalOverlay.hidden = false;
    element.classList.add("is-modal-open");
  }

  function closeModals(): void {
    openModal = null;
    modalOverlay.hidden = true;
    element.classList.remove("is-modal-open");
  }

  function toggleModal(name: ModalName): void {
    if (name === "inventory" && !showMockHud) {
      return;
    }
    if (openModal === name) {
      closeModals();
    } else {
      showModal(name);
    }
  }

  function togglePause(): void {
    paused = !paused;
    pausePanel.style.display = paused ? "flex" : "none";
    pausePanel.hidden = !paused;
    element.classList.toggle("is-paused", paused);
  }

  resumeBtn.addEventListener("click", () => {
    paused = false;
    pausePanel.style.display = "none";
    pausePanel.hidden = true;
    element.classList.remove("is-paused");
  });

  function toggleMapView(): void {
    mapView = !mapView;
    element.classList.toggle("is-map-view", mapView);
    addNotification(mapView ? "Vue Carte activée" : "Vue Jeu activée");
  }

  // Bind top bar buttons
  createdMenuButtons[0]?.addEventListener("click", () => toggleModal("inventory")); // Sac -> Inventaire
  createdMenuButtons[1]?.addEventListener("click", () => toggleMapView());           // Carte
  createdMenuButtons[2]?.addEventListener("click", () => togglePause());             // Réglages
  createdMenuButtons[3]?.addEventListener("click", () => addNotification("Le mode social arrive bientôt.")); // Social
  invClose.addEventListener("click", () => closeModals());

  // Zoom slider buttons
  zoomInBtn.addEventListener("click", () => {
    const val = Math.min(100, Number.parseInt(zoomRange.value, 10) + 10);
    zoomRange.value = val.toString();
  });
  zoomOutBtn.addEventListener("click", () => {
    const val = Math.max(0, Number.parseInt(zoomRange.value, 10) - 10);
    zoomRange.value = val.toString();
  });

  // Chat keyboard bindings
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      chatInput.blur();
      chatInputContainer.hidden = true;
      return;
    }
    if (event.key !== "Enter") {
      return;
    }
    event.stopPropagation();
    const text = chatInput.value.trim();
    if (text) {
      network.sendChat(text);
      chatInput.value = "";
    }
    chatInput.blur();
    chatInputContainer.hidden = true;
  });

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      if (paused || chatInput.disabled || document.activeElement === chatInput) {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
      chatInputContainer.hidden = false;
      chatInput.focus();
      return;
    }

    if (isEditableTarget(event.target)) {
      return;
    }

    const lower = event.key.toLowerCase();
    if (lower === "m") {
      toggleMapView();
      return;
    }
    if (lower === "i") {
      toggleModal("inventory");
      return;
    }
    if (lower === "j") {
      toggleModal("quests");
      return;
    }

    if (event.key === "Escape") {
      if (document.activeElement === chatInput) {
        return;
      }
      // Priorite de fermeture : modale > dialogue > pause.
      if (openModal) {
        closeModals();
        return;
      }
      if (network.getSnapshot().dialogue) {
        resetDialogue();
        return;
      }
      togglePause();
    }
  };
  window.addEventListener("keydown", onKeyDown);

  // Reinitialise et masque le cartouche de dialogue (PNJ par defaut Aku Aku).
  function resetDialogue(): void {
    network.clearDialogue();
    dialogueLine.textContent = "Wouhou ! Belle journée pour une aventure à La Réunion !";
    dialogueName.textContent = "Aku Aku";
    dialoguePortrait.innerHTML = getSvg("tiki");
    dialoguePanel.hidden = true;
  }

  function markStepDone(step: HTMLLIElement): void {
    step.classList.add("is-done");
    step.classList.remove("is-current");
    step.querySelector(".riw-step__box")!.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" style="opacity: 1; color: rgb(255, 255, 255);"><path d="M20 6 L9 17 L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
  }

  function setObjectiveStage(stage: 1 | 2 | 3): void {
    if (stage <= objectiveStage) {
      return;
    }

    if (stage >= 1) {
      markStepDone(objStep1);
      objStep2.classList.add("is-current");
      addNotification("Objectif : suis le chemin vers le Chauffeur Car Jaune.");
    }
    if (stage >= 2) {
      markStepDone(objStep2);
      objStep3.classList.add("is-current");
      addNotification("Objectif : monte au point de vue Maïdo / Mafate.");
    }
    if (stage >= 3) {
      markStepDone(objStep3);
      addNotification(`${START_QUEST_TITLE} validé.`);
    }

    objectiveStage = stage;
  }

  function applyConnState(state: ConnState, players: number): void {
    statusDot.className = `hud-status-dot ${state === "online" ? "online" : state === "connecting" ? "connecting" : "offline"}`;
    if (state === "connecting") {
      statusLabel.textContent = "Connexion...";
    } else if (state === "offline") {
      statusLabel.textContent = "Hors ligne";
    } else {
      statusLabel.textContent = `En ligne - ${players}`;
    }
  }

  return {
    element,
    setInteractPrompt(label) {
      const show = Boolean(label) && !paused;
      interactPrompt.hidden = !show;
      interactPrompt.innerHTML = show ? `<span class="riw-key-cap">E</span> <span>Parler à ${label}</span>` : "";
      actionButton.classList.toggle("has-target", show);
    },
    setZone(label) {
      statusZone.textContent = label;
    },
    setObjectiveStage(stage) {
      setObjectiveStage(stage);
    },
    setDebug(info) {
      if (!info) {
        debugPanel.hidden = true;
        return;
      }
      debugPanel.hidden = false;
      debugPanel.textContent = `${info.fps} fps | zone: ${info.zone} | pos: ${info.pos[0]}, ${info.pos[1]}, ${info.pos[2]}`;
    },
    update(snapshot) {
      const now = performance.now();
      if (firstUpdateAt === 0) {
        firstUpdateAt = now;
      }

      // Conn state
      let state: ConnState;
      if (snapshot.connected) {
        state = "online";
        chatInput.disabled = false;
      } else {
        state = now - firstUpdateAt > OFFLINE_AFTER_MS ? "offline" : "connecting";
        chatInput.disabled = true;
      }
      applyConnState(state, snapshot.players.length);

      // Active dialogue override
      if (snapshot.dialogue) {
        dialoguePanel.hidden = false;
        dialogueName.textContent = snapshot.dialogue.npcName;
        dialogueLine.textContent = snapshot.dialogue.line;
        // Customize portrait for specific npcs
        if (snapshot.dialogue.npcName.includes("Snack")) {
          dialoguePortrait.innerHTML = `<span style="font-size:32px;">👵</span>`;
        } else if (snapshot.dialogue.npcName.includes("Car Jaune")) {
          dialoguePortrait.innerHTML = `<span style="font-size:32px;">👨‍✈️</span>`;
        } else {
          dialoguePortrait.innerHTML = getSvg("player");
        }

        // Generation des reponses de dialogue.
        dialogueAnswers.replaceChildren();
        const closeBtn = document.createElement("button");
        closeBtn.className = "riw-answer";
        closeBtn.innerHTML = `<span class="riw-key">Échap</span> <span>Continuer</span>`;
        closeBtn.addEventListener("click", () => resetDialogue());
        dialogueAnswers.appendChild(closeBtn);

        if (snapshot.dialogue.npcName === START_OBJECTIVE_NPC_NAME) {
          setObjectiveStage(1);
        } else if (snapshot.dialogue.npcName === ROUTE_OBJECTIVE_NPC_NAME) {
          setObjectiveStage(2);
        } else if (snapshot.dialogue.npcName === EXIT_OBJECTIVE_NPC_NAME) {
          setObjectiveStage(3);
        }
      }

      // Update notifications on new chat messages
      const count = snapshot.chat.length;
      if (count !== lastChatCount) {
        if (lastChatCount !== -1 && count > lastChatCount) {
          const newMsg = snapshot.chat[count - 1];
          if (newMsg) {
            addNotification(`${newMsg.playerName}: ${newMsg.text}`);
          }
        }
        lastChatCount = count;
      }
    },
    isPaused() {
      return paused;
    },
    isMapView() {
      return mapView;
    },
    getCameraZoom() {
      const value = Number.parseInt(zoomRange.value, 10);
      return Number.isFinite(value) ? value / 100 : 0.44;
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
    }
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}
