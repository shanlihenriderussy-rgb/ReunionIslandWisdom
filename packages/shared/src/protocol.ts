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
  health: z.number().min(0),
  maxHealth: z.number().positive(),
  alive: z.boolean(),
  lastSequence: z.number().int().nonnegative()
});

export const chatEntrySchema = z.object({
  id: z.string().min(1),
  playerId: playerIdSchema,
  playerName: z.string().min(1).max(24),
  text: z.string().min(1).max(180),
  createdAt: z.number().int().nonnegative()
});

// --- Combat (override bible 2026-06-27, voir ADR-015) ---
// PvE leger, serveur authoritative : le client envoie une intention d'attaque,
// le serveur decide portee, cooldown, degats, mort et respawn.

export const attackIntentSchema = z.object({
  targetId: z.string().min(1).max(120)
});

// Envoye au tueur quand une cible est detruite (recompense serveur-authoritative).
export const targetDefeatedSchema = z.object({
  targetId: z.string().min(1).max(120),
  targetName: z.string().min(1).max(60),
  reward: z.string().min(1).max(80)
});

export const combatantSnapshotSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(60),
  zoneId: z.string().min(1).max(60),
  x: z.number().finite(),
  z: z.number().finite(),
  health: z.number().min(0),
  maxHealth: z.number().positive(),
  alive: z.boolean()
});

export const serverSnapshotSchema = z.object({
  players: z.array(playerSnapshotSchema),
  combatants: z.array(combatantSnapshotSchema),
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
export type AttackIntent = z.infer<typeof attackIntentSchema>;
export type TargetDefeated = z.infer<typeof targetDefeatedSchema>;
export type CombatantSnapshotDto = z.infer<typeof combatantSnapshotSchema>;
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

// Categories qui se portent sur un slot (equipement classique + instrument tenu en main).
// Toute autre categorie doit rester slot "aucun".
export const equippableCategories = ["equipement", "instrument"] as const satisfies readonly ItemCategory[];

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
    const isEquippable = (equippableCategories as readonly ItemCategory[]).includes(item.category);
    // Invariant slot dans les deux sens.
    // 1. Categorie equipable => slot reel obligatoire.
    if (isEquippable && item.slot === "aucun") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `L'objet equipable "${item.id}" (${item.category}) doit avoir un slot different de "aucun".`,
        path: ["slot"]
      });
    }
    // 2. Categorie non equipable => slot doit etre "aucun".
    if (!isEquippable && item.slot !== "aucun") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `L'objet non equipable "${item.id}" (${item.category}) doit avoir le slot "aucun".`,
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

// --- Reglage combat (source unique client/serveur) ---
export const combatConfig = {
  playerMaxHealth: 100,
  // portee serveur d'une attaque joueur -> cible
  attackRange: 4,
  // cadence d'attaque joueur (anti-spam, serveur authoritative)
  attackCooldownMs: 650,
  // degats par attaque joueur
  attackDamage: 18,
  // portee (leash) a laquelle une cible AGGRO riposte sur son attaquant
  targetAggroRange: 5,
  // duree d'aggro apres un coup : une cible ne riposte QUE si on l'a frappee recemment
  // (pas de degats non provoques par simple proximite)
  targetAggroDurationMs: 5000,
  // delai avant respawn d'un joueur mort
  playerRespawnMs: 4000
} as const;

// Definition data d'une cible PvE (placee par zone, voir packages/content).
export const combatTargetDefinitionSchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(60),
  zoneId: z.string().min(1).max(60),
  position: z.object({
    x: z.number().finite(),
    z: z.number().finite()
  }),
  maxHealth: z.number().int().positive().max(9999),
  // degats infliges au joueur a portee, par tick d'attaque de la cible
  contactDamage: z.number().int().min(0).max(999),
  // cadence d'attaque de la cible
  attackCooldownMs: z.number().int().min(100).max(60000),
  // delai de reapparition apres destruction
  respawnMs: z.number().int().min(500).max(600000),
  // souvenir gagne a la destruction (progression horizontale, voir 21-systeme-de-jeu)
  reward: z.string().min(1).max(80)
});

export const combatTargetCatalogSchema = z.array(combatTargetDefinitionSchema);

export type CombatTargetDefinition = z.infer<typeof combatTargetDefinitionSchema>;
