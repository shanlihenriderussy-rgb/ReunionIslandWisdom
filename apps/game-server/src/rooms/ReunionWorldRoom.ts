import { Client, Room } from "colyseus";
import { combatTargets, npcs, quests, zones } from "@riw/content";
import {
  attackIntentSchema,
  chatMessageSchema,
  combatConfig,
  interactIntentSchema,
  npcInteractionDistance,
  moveIntentSchema,
  playerMoveSpeed,
  serverTickRate,
  worldBounds,
  type ChatEntryDto,
  type MoveIntent,
  type PlayerSnapshotDto,
  type ServerSnapshot
} from "@riw/shared";
import { CombatSystem } from "../combat/CombatSystem.js";
import { ProgressionStore } from "../progression/ProgressionStore.js";

// Index PNJ donneur -> quetes a decouvrir (derive du content une seule fois).
// Parler a un PNJ donneur revele sa/ses quete(s) dans la progression joueur.
const questsByGiverNpc = buildQuestsByGiverNpc();

type ClientAuth = {
  name?: string;
};

type PlayerRuntimeState = PlayerSnapshotDto;

const maxChatEntries = 8;
const chatCooldownMs = 900;
const interactionCooldownMs = 500;
type ZoneDefinition = (typeof zones)[number];

// Zone de depart = Ouest (Saint-Paul / Saint-Gilles), choix Shan 2026-06-27 (aligne client getInitialSpawn).
const startZone = resolveStartZone();

export class ReunionWorldRoom extends Room {
  maxClients = 50;
  private readonly players = new Map<string, PlayerRuntimeState>();
  private readonly moveIntents = new Map<string, MoveIntent>();
  private readonly lastChatAt = new Map<string, number>();
  private readonly lastInteractionAt = new Map<string, number>();
  private readonly chat: ChatEntryDto[] = [];
  private readonly combat = new CombatSystem(combatTargets);
  private readonly progression = new ProgressionStore();
  private readonly respawnAt = new Map<string, number>();
  // Event derive de la zone de depart reelle (coherence : evite "eveil-fournaise" en depart Ouest).
  private activeEvent = `eveil-${startZone.id}`;

  onCreate(): void {
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), 1000 / serverTickRate);

    this.onMessage("move", (client, message: unknown) => {
      const result = moveIntentSchema.safeParse(message);
      if (!result.success) {
        return;
      }

      this.moveIntents.set(client.sessionId, result.data);
    });

    this.onMessage("chat", (client, message: unknown) => {
      const player = this.players.get(client.sessionId);
      if (!player) {
        return;
      }

      const now = Date.now();
      const previous = this.lastChatAt.get(client.sessionId) ?? 0;
      if (now - previous < chatCooldownMs) {
        return;
      }

      const result = chatMessageSchema.safeParse(message);
      if (!result.success) {
        return;
      }

      this.lastChatAt.set(client.sessionId, now);
      this.appendChat(player, result.data.text);
      this.broadcastSnapshot();
    });

    this.onMessage("interact", (client, message: unknown) => {
      const player = this.players.get(client.sessionId);
      if (!player) {
        return;
      }

      const now = Date.now();
      const previous = this.lastInteractionAt.get(client.sessionId) ?? 0;
      if (now - previous < interactionCooldownMs) {
        return;
      }

      const result = interactIntentSchema.safeParse(message);
      if (!result.success) {
        return;
      }

      const npc = npcs.find((candidate) => candidate.id === result.data.targetId);
      if (!npc) {
        return;
      }

      const distance = Math.hypot(player.x - npc.position.x, player.z - npc.position.z);
      if (distance > npcInteractionDistance) {
        return;
      }

      this.lastInteractionAt.set(client.sessionId, now);
      client.send("dialogueOpened", {
        npcId: npc.id,
        npcName: npc.name,
        line: npc.line
      });

      // Progression serveur-authoritative : parler a un PNJ donneur revele sa/ses quete(s).
      let progressed = false;
      for (const questId of questsByGiverNpc.get(npc.id) ?? []) {
        if (this.progression.discoverQuest(client.sessionId, questId)) {
          progressed = true;
        }
      }
      if (progressed) {
        this.sendProgression(client);
      }
    });

    this.onMessage("attack", (client, message: unknown) => {
      const player = this.players.get(client.sessionId);
      if (!player) {
        return;
      }

      const result = attackIntentSchema.safeParse(message);
      if (!result.success) {
        return;
      }

      // Portee + cooldown + degats decides par le serveur.
      const outcome = this.combat.attack(player, result.data.targetId, Date.now());
      if (outcome.ok) {
        if (outcome.killed) {
          // Recompense serveur-authoritative : envoyee uniquement au tueur.
          const def = combatTargets.find((target) => target.id === result.data.targetId);
          if (def) {
            client.send("targetDefeated", {
              targetId: def.id,
              targetName: def.name,
              reward: def.reward
            });
            // Le souvenir est desormais stocke dans la progression joueur (dedup serveur).
            if (this.progression.addSouvenir(client.sessionId, def.reward)) {
              this.sendProgression(client);
            }
          }
        }
        this.broadcastSnapshot();
      }
    });
  }

  onJoin(client: Client, options: ClientAuth): void {
    const player: PlayerRuntimeState = {
      id: client.sessionId,
      name: sanitizeName(options.name),
      x: randomSpawnCoordinate(startZone.spawn.x),
      y: startZone.spawn.y,
      z: randomSpawnCoordinate(startZone.spawn.z),
      yaw: startZone.spawn.yaw,
      health: combatConfig.playerMaxHealth,
      maxHealth: combatConfig.playerMaxHealth,
      alive: true,
      lastSequence: 0
    };

    this.players.set(client.sessionId, player);
    this.progression.ensure(client.sessionId);
    client.send("snapshot", this.createSnapshot());
    this.sendProgression(client);
    this.broadcastSnapshot();
  }

  onLeave(client: Client): void {
    this.players.delete(client.sessionId);
    this.moveIntents.delete(client.sessionId);
    this.lastChatAt.delete(client.sessionId);
    this.lastInteractionAt.delete(client.sessionId);
    this.respawnAt.delete(client.sessionId);
    this.combat.forgetPlayer(client.sessionId);
    this.progression.forget(client.sessionId);
    this.broadcastSnapshot();
  }

  private sendProgression(client: Client): void {
    // Envoye uniquement au joueur concerne (progression = etat prive, pas de broadcast).
    client.send("progression", this.progression.snapshot(client.sessionId));
  }

  private update(deltaTimeMs: number): void {
    const deltaSeconds = deltaTimeMs / 1000;
    const now = Date.now();
    let changed = false;

    for (const [sessionId, intent] of this.moveIntents) {
      const player = this.players.get(sessionId);
      if (!player) {
        continue;
      }

      // Un joueur mort ne bouge pas tant qu'il n'a pas respawn.
      if (!player.alive) {
        continue;
      }

      const length = Math.hypot(intent.x, intent.z);
      const normalizedX = length > 0 ? intent.x / length : 0;
      const normalizedZ = length > 0 ? intent.z / length : 0;

      if (length === 0) {
        player.lastSequence = intent.sequence;
        continue;
      }

      const sin = Math.sin(intent.cameraYaw);
      const cos = Math.cos(intent.cameraYaw);
      const worldX = normalizedX * cos + normalizedZ * sin;
      const worldZ = normalizedZ * cos - normalizedX * sin;

      player.x = clamp(player.x + worldX * playerMoveSpeed * deltaSeconds, worldBounds.minX, worldBounds.maxX);
      player.z = clamp(player.z + worldZ * playerMoveSpeed * deltaSeconds, worldBounds.minZ, worldBounds.maxZ);
      player.yaw = Math.atan2(worldX, worldZ);
      player.lastSequence = intent.sequence;
      changed = true;
    }

    // Combat : respawn cibles + riposte sur joueurs a portee.
    const combatEvents = this.combat.update(now, this.players.values());
    for (const event of combatEvents) {
      if (event.type === "playerKilled" && !this.respawnAt.has(event.playerId)) {
        this.respawnAt.set(event.playerId, now + combatConfig.playerRespawnMs);
      }
      changed = true;
    }

    // Respawn des joueurs morts dont le delai est ecoule.
    for (const [sessionId, at] of this.respawnAt) {
      if (now < at) {
        continue;
      }
      const player = this.players.get(sessionId);
      this.respawnAt.delete(sessionId);
      if (!player) {
        continue;
      }
      player.x = randomSpawnCoordinate(startZone.spawn.x);
      player.y = startZone.spawn.y;
      player.z = randomSpawnCoordinate(startZone.spawn.z);
      player.yaw = startZone.spawn.yaw;
      player.health = player.maxHealth;
      player.alive = true;
      this.moveIntents.delete(sessionId);
      this.combat.forgetPlayer(sessionId);
      changed = true;
    }

    if (changed) {
      this.broadcastSnapshot();
    }
  }

  private appendChat(player: PlayerRuntimeState, text: string): void {
    this.chat.push({
      id: `${Date.now()}-${player.id}`,
      playerId: player.id,
      playerName: player.name,
      text: sanitizeChat(text),
      createdAt: Date.now()
    });

    while (this.chat.length > maxChatEntries) {
      this.chat.shift();
    }
  }

  private broadcastSnapshot(): void {
    this.broadcast("snapshot", this.createSnapshot());
  }

  private createSnapshot(): ServerSnapshot {
    return {
      players: Array.from(this.players.values()),
      combatants: this.combat.snapshots(),
      chat: this.chat,
      activeEvent: this.activeEvent
    };
  }
}

function buildQuestsByGiverNpc(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const quest of quests) {
    const list = index.get(quest.giverNpcId);
    if (list) {
      list.push(quest.id);
    } else {
      index.set(quest.giverNpcId, [quest.id]);
    }
  }
  return index;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomSpawnCoordinate(origin: number): number {
  return Math.round((origin + Math.random() * 1.2 - 0.6) * 10) / 10;
}

function resolveStartZone(): ZoneDefinition {
  const zone = zones.find((candidate) => candidate.id === "saint-paul-saint-gilles") ?? zones[0];
  if (!zone) {
    throw new Error("@riw/content : aucune zone de depart definie (zones.json vide).");
  }
  return zone;
}

function sanitizeName(name: string | undefined): string {
  if (!name) {
    return "Zoreil mystere";
  }

  return name.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 24) || "Zoreil mystere";
}

function sanitizeChat(text: string): string {
  return text.replace(/[<>]/g, "").slice(0, 180);
}
