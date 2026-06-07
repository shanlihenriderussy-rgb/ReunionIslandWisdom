import { Client, Room } from "colyseus.js";
import {
  dialogueOpenedSchema,
  serverSnapshotSchema,
  worldRoomName,
  type DialogueOpened,
  type MoveIntent
} from "@riw/shared";

type PlayerSnapshot = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
};

type ChatSnapshot = {
  id: string;
  playerName: string;
  text: string;
};

export type NetworkSnapshot = {
  connected: boolean;
  sessionId: string | null;
  players: PlayerSnapshot[];
  chat: ChatSnapshot[];
  activeEvent: string;
  dialogue: DialogueOpened | null;
};

export class NetworkClient {
  private readonly client = new Client(getServerUrl());
  private room: Room | null = null;
  private snapshot: NetworkSnapshot = {
    connected: false,
    sessionId: null,
    players: [],
    chat: [],
    activeEvent: "connexion",
    dialogue: null
  };

  async connect(): Promise<void> {
    try {
      const playerName = `Joueur-${Math.floor(Math.random() * 900 + 100)}`;
      this.room = await this.client.joinOrCreate(worldRoomName, { name: playerName });
      this.snapshot = { ...this.snapshot, connected: true, sessionId: this.room.sessionId };

      this.room.onMessage("snapshot", (message: unknown) => {
        const result = serverSnapshotSchema.safeParse(message);
        if (!result.success) {
          return;
        }

        this.snapshot = {
          connected: true,
          sessionId: this.room?.sessionId ?? null,
          players: result.data.players.map((player) => ({
            id: player.id,
            name: player.name,
            x: player.x,
            y: player.y,
            z: player.z,
            yaw: player.yaw
          })),
          chat: result.data.chat.map((entry) => ({
            id: entry.id,
            playerName: entry.playerName,
            text: entry.text
          })),
          activeEvent: result.data.activeEvent,
          dialogue: this.snapshot.dialogue
        };
      });

      this.room.onMessage("dialogueOpened", (message: unknown) => {
        const result = dialogueOpenedSchema.safeParse(message);
        if (!result.success) {
          return;
        }

        this.snapshot = {
          ...this.snapshot,
          dialogue: result.data
        };
      });
    } catch (error) {
      console.error("Colyseus connection failed", error);
    }
  }

  sendMove(intent: MoveIntent): void {
    if (!this.room) {
      return;
    }

    this.room.send("move", intent);
  }

  sendChat(text: string): void {
    if (!this.room) {
      return;
    }

    this.room.send("chat", { text });
  }

  sendInteract(targetId: string): void {
    if (!this.room) {
      return;
    }

    this.room.send("interact", { targetId });
  }

  clearDialogue(): void {
    this.snapshot = {
      ...this.snapshot,
      dialogue: null
    };
  }

  getSnapshot(): NetworkSnapshot {
    return this.snapshot;
  }

  disconnect(): void {
    void this.room?.leave();
    this.room = null;
  }
}

function getServerUrl(): string {
  const explicitUrl = import.meta.env["VITE_GAME_SERVER_URL"];
  if (typeof explicitUrl === "string" && explicitUrl.length > 0) {
    return explicitUrl;
  }

  return "ws://localhost:2567";
}
