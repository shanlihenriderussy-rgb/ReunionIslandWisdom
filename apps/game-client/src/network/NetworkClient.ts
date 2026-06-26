import { Client, type Room, type RoomAvailable, type SeatReservation } from "colyseus.js";
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
  private readonly serverUrl = getServerUrl();
  private readonly client = new Client(this.serverUrl);
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
      this.room = await this.joinOrCreateRoom(playerName);
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

  openLocalDialogue(dialogue: DialogueOpened): void {
    this.snapshot = {
      ...this.snapshot,
      dialogue
    };
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

  private async joinOrCreateRoom(playerName: string): Promise<Room> {
    const response = await fetch(getMatchmakeUrl(this.serverUrl, worldRoomName), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: playerName })
    });

    const payload: unknown = await response.json();
    if (!response.ok) {
      throw new Error(getMatchmakeError(payload, response.status));
    }

    return this.client.consumeSeatReservation(normalizeSeatReservation(payload));
  }
}

function getServerUrl(): string {
  const explicitUrl = import.meta.env["VITE_GAME_SERVER_URL"];
  if (typeof explicitUrl === "string" && explicitUrl.length > 0) {
    return explicitUrl;
  }

  return "ws://localhost:2567";
}

type LegacyRoomReservation = RoomAvailable & {
  processId: string;
  publicAddress?: string;
};

type LegacySeatReservation = Omit<SeatReservation, "room"> & {
  room: LegacyRoomReservation;
};

function getMatchmakeUrl(serverUrl: string, roomName: string): string {
  const url = new URL(serverUrl);
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = `${url.pathname.replace(/\/$/, "")}/matchmake/joinOrCreate/${encodeURIComponent(roomName)}`;
  return url.toString();
}

function normalizeSeatReservation(payload: unknown): LegacySeatReservation {
  if (!isRecord(payload)) {
    throw new Error("Invalid Colyseus seat reservation.");
  }

  const legacyRoom = payload["room"];
  if (isRecord(legacyRoom)) {
    return {
      room: normalizeReservationRoom(legacyRoom),
      sessionId: readRequiredString(payload, "sessionId"),
      ...readOptionalReservationFields(payload)
    };
  }

  return {
    room: normalizeReservationRoom(payload),
    sessionId: readRequiredString(payload, "sessionId"),
    ...readOptionalReservationFields(payload)
  };
}

function normalizeReservationRoom(payload: Record<string, unknown>): LegacyRoomReservation {
  const room: LegacyRoomReservation = {
    name: readRequiredString(payload, "name"),
    roomId: readRequiredString(payload, "roomId"),
    processId: readRequiredString(payload, "processId"),
    clients: readOptionalNumber(payload, "clients") ?? 0,
    maxClients: readOptionalNumber(payload, "maxClients") ?? 0
  };

  const publicAddress = readOptionalString(payload, "publicAddress");
  if (publicAddress) {
    room.publicAddress = publicAddress;
  }

  return room;
}

function readOptionalReservationFields(payload: Record<string, unknown>): Pick<LegacySeatReservation, "devMode" | "protocol" | "reconnectionToken"> {
  const fields: Pick<LegacySeatReservation, "devMode" | "protocol" | "reconnectionToken"> = {};
  const protocol = readOptionalString(payload, "protocol");
  const reconnectionToken = readOptionalString(payload, "reconnectionToken");

  if (protocol) {
    fields.protocol = protocol;
  }
  if (reconnectionToken) {
    fields.reconnectionToken = reconnectionToken;
  }
  if (payload["devMode"] === true) {
    fields.devMode = true;
  }

  return fields;
}

function getMatchmakeError(payload: unknown, status: number): string {
  if (isRecord(payload) && typeof payload["error"] === "string") {
    return payload["error"];
  }

  return `Colyseus matchmake failed (${status}).`;
}

function readRequiredString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid Colyseus seat reservation: missing ${key}.`);
  }

  return value;
}

function readOptionalString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readOptionalNumber(payload: Record<string, unknown>, key: string): number | undefined {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
