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

// --- Equipement / inventaire (data cote serveur) ---
// Source de verite partagee client/serveur pour les definitions d'objets.

export const itemCategorySchema = z.enum([
  "consommable",
  "equipement",
  "ressource",
  "cle",
  "instrument"
]);

export const equipmentSlotSchema = z.enum([
  "tete",
  "corps",
  "pieds",
  "accessoire",
  "main",
  "aucun"
]);

export const itemDefinitionSchema = z
  .object({
    id: z.string().min(1).max(60),
    name: z.string().min(1).max(60),
    category: itemCategorySchema,
    slot: equipmentSlotSchema,
    stackable: z.boolean(),
    maxStack: z.number().int().min(1).max(999),
    weight: z.number().min(0).max(100),
    description: z.string().min(1).max(200)
  })
  .superRefine((item, ctx) => {
    // Un objet equipable a un slot reel ; les autres restent "aucun".
    if (item.category === "equipement" && item.slot === "aucun") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `L'objet equipement "${item.id}" doit avoir un slot different de "aucun".`,
        path: ["slot"]
      });
    }
    // Coherence du stack : non empilable => maxStack 1.
    if (!item.stackable && item.maxStack !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `L'objet non empilable "${item.id}" doit avoir maxStack = 1.`,
        path: ["maxStack"]
      });
    }
  });

export const itemCatalogSchema = z.array(itemDefinitionSchema);

export type ItemCategory = z.infer<typeof itemCategorySchema>;
export type EquipmentSlot = z.infer<typeof equipmentSlotSchema>;
export type ItemDefinition = z.infer<typeof itemDefinitionSchema>;

export const serverTickRate = 20;
export const playerMoveSpeed = 5.2;
export const npcInteractionDistance = 3.2;
export const worldBounds = {
  minX: -110,
  maxX: 110,
  minZ: -102.2,
  maxZ: 102.2
} as const;
