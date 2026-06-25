import { Client, Room } from "colyseus";
import { npcs, zones } from "@riw/content";
import {
  chatMessageSchema,
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

type ClientAuth = {
  name?: string;
};

type PlayerRuntimeState = PlayerSnapshotDto;

const maxChatEntries = 8;
const chatCooldownMs = 900;
const interactionCooldownMs = 500;
const startZone = zones.find((zone) => zone.id === "saint-paul-saint-gilles") ?? zones[0];

export class ReunionWorldRoom extends Room {
  maxClients = 50;
  private readonly players = new Map<string, PlayerRuntimeState>();
  private readonly moveIntents = new Map<string, MoveIntent>();
  private readonly lastChatAt = new Map<string, number>();
  private readonly lastInteractionAt = new Map<string, number>();
  private readonly chat: ChatEntryDto[] = [];
  private activeEvent = "parcours-ouest";

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
      lastSequence: 0
    };

    this.players.set(client.sessionId, player);
    client.send("snapshot", this.createSnapshot());
    this.broadcastSnapshot();
  }

  onLeave(client: Client): void {
    this.players.delete(client.sessionId);
    this.moveIntents.delete(client.sessionId);
    this.lastChatAt.delete(client.sessionId);
    this.lastInteractionAt.delete(client.sessionId);
    this.broadcastSnapshot();
  }

  private update(deltaTimeMs: number): void {
    const deltaSeconds = deltaTimeMs / 1000;
    let changed = false;

    for (const [sessionId, intent] of this.moveIntents) {
      const player = this.players.get(sessionId);
      if (!player) {
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
      chat: this.chat,
      activeEvent: this.activeEvent
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomSpawnCoordinate(origin: number): number {
  return Math.round((origin + Math.random() * 1.2 - 0.6) * 10) / 10;
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
