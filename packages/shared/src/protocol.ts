import { z } from "zod";

export const worldRoomName = "reunion_world";

export const playerIdSchema = z.string().min(1).max(80);

export const vector3Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite()
});

export const moveIntentSchema = z.object({
  sequence: z.number().int().nonnegative(),
  x: z.number().min(-1).max(1),
  z: z.number().min(-1).max(1),
  cameraYaw: z.number().finite()
});

export const chatMessageSchema = z.object({
  text: z.string().trim().min(1).max(180)
});

export const interactIntentSchema = z.object({
  targetId: z.string().min(1).max(120)
});

export const dialogueOpenedSchema = z.object({
  npcId: z.string().min(1).max(120),
  npcName: z.string().min(1).max(80),
  line: z.string().min(1).max(280)
});

export const playerSnapshotSchema = z.object({
  id: playerIdSchema,
  name: z.string().min(1).max(24),
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
  yaw: z.number().finite(),
  lastSequence: z.number().int().nonnegative()
});

export const chatEntrySchema = z.object({
  id: z.string().min(1),
  playerId: playerIdSchema,
  playerName: z.string().min(1).max(24),
  text: z.string().min(1).max(180),
  createdAt: z.number().int().nonnegative()
});

export const serverSnapshotSchema = z.object({
  players: z.array(playerSnapshotSchema),
  chat: z.array(chatEntrySchema),
  activeEvent: z.string().min(1)
});

export type Vector3Dto = z.infer<typeof vector3Schema>;
export type MoveIntent = z.infer<typeof moveIntentSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type InteractIntent = z.infer<typeof interactIntentSchema>;
export type DialogueOpened = z.infer<typeof dialogueOpenedSchema>;
export type PlayerSnapshotDto = z.infer<typeof playerSnapshotSchema>;
export type ChatEntryDto = z.infer<typeof chatEntrySchema>;
export type ServerSnapshot = z.infer<typeof serverSnapshotSchema>;

export const serverTickRate = 20;
export const playerMoveSpeed = 5.2;
export const npcInteractionDistance = 3.2;
export const worldBounds = {
  minX: -110,
  maxX: 110,
  minZ: -102.2,
  maxZ: 102.2
} as const;
