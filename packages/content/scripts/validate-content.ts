import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { worldBounds, itemCatalogSchema, combatTargetCatalogSchema } from "@riw/shared";

// Équivalent pour ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");

// Schémas de validation
const positionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite()
});

const spawnSchema = positionSchema.extend({
  yaw: z.number().finite()
});

const zoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  spawn: spawnSchema,
  description: z.string().min(1)
});

const npcSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  zoneId: z.string().min(1),
  position: positionSchema,
  line: z.string().min(1)
});

const questSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  giverNpcId: z.string().min(1),
  objective: z.string().min(1),
  rewardTitle: z.string().min(1)
});

const itemsSchema = z.array(z.string().min(1));
const emotesSchema = z.array(z.string().min(1));

function readJsonFile(filename: string): any {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Fichier de données requis manquant : ${filepath}`);
  }
  const content = fs.readFileSync(filepath, "utf-8");
  return JSON.parse(content);
}

function validate() {
  console.log("=== Lancement de la validation des données de jeu (Gouvernance) ===");

  // 1. Chargement des fichiers
  const zones = readJsonFile("zones.json");
  const npcs = readJsonFile("npcs.json");
  const quests = readJsonFile("quests.json");
  const items = readJsonFile("items.json");
  const itemCatalog = readJsonFile("item-catalog.json");
  const emotes = readJsonFile("emotes.json");
  const combatTargets = readJsonFile("combat-targets.json");

  // 2. Validation par schéma Zod
  console.log("- Validation structurelle avec Zod...");
  z.array(zoneSchema).parse(zones);
  z.array(npcSchema).parse(npcs);
  z.array(questSchema).parse(quests);
  itemsSchema.parse(items);
  itemCatalogSchema.parse(itemCatalog);
  emotesSchema.parse(emotes);
  combatTargetCatalogSchema.parse(combatTargets);

  // 3. Validation de l'intégrité référentielle
  console.log("- Validation de l'intégrité référentielle...");
  const zoneIds = new Set(zones.map((z: any) => z.id));
  const npcIds = new Set(npcs.map((n: any) => n.id));

  for (const npc of npcs) {
    if (!zoneIds.has(npc.zoneId)) {
      throw new Error(`Erreur de référence : Le PNJ "${npc.id}" est affecté à une zone inexistante "${npc.zoneId}".`);
    }
  }

  for (const quest of quests) {
    if (!npcIds.has(quest.giverNpcId)) {
      throw new Error(`Erreur de référence : La quête "${quest.id}" a pour donneur un PNJ inexistant "${quest.giverNpcId}".`);
    }
  }

  // 3b. Cohérence catalogue d'objets <-> liste d'IDs items.json
  const itemIds = new Set(items as string[]);
  const catalogIds = new Set((itemCatalog as Array<{ id: string }>).map((entry) => entry.id));

  for (const entry of itemCatalog as Array<{ id: string }>) {
    if (!itemIds.has(entry.id)) {
      throw new Error(`Erreur de référence : L'objet du catalogue "${entry.id}" n'existe pas dans items.json.`);
    }
  }

  for (const id of itemIds) {
    if (!catalogIds.has(id)) {
      throw new Error(`Erreur de complétude : L'objet "${id}" de items.json n'a pas de définition dans item-catalog.json.`);
    }
  }

  // 4. Validation des limites géographiques (spatiales)
  console.log("- Validation des limites géographiques...");
  const checkBounds = (x: number, z: number, label: string) => {
    if (x < worldBounds.minX || x > worldBounds.maxX || z < worldBounds.minZ || z > worldBounds.maxZ) {
      throw new Error(
        `Erreur spatiale : Position hors-limites pour ${label} (coordonnées [${x}, ${z}], limites autorisées [${worldBounds.minX} à ${worldBounds.maxX}, ${worldBounds.minZ} à ${worldBounds.maxZ}]).`
      );
    }
  };

  for (const zone of zones) {
    checkBounds(zone.spawn.x, zone.spawn.z, `le spawn de la zone "${zone.id}"`);
  }

  for (const npc of npcs) {
    checkBounds(npc.position.x, npc.position.z, `le PNJ "${npc.id}"`);
  }

  for (const target of combatTargets) {
    if (!zoneIds.has(target.zoneId)) {
      throw new Error(`Erreur de référence : La cible combat "${target.id}" est affectée à une zone inexistante "${target.zoneId}".`);
    }
    checkBounds(target.position.x, target.position.z, `la cible combat "${target.id}"`);
  }

  // 5. Unicité des identifiants
  console.log("- Validation de l'unicité des IDs...");
  const verifyUniqueness = (array: any[], key: string, typeLabel: string) => {
    const seen = new Set();
    for (const entry of array) {
      const value = entry[key];
      if (seen.has(value)) {
        throw new Error(`Erreur d'unicité : L'ID "${value}" est présent plusieurs fois pour le type ${typeLabel}.`);
      }
      seen.add(value);
    }
  };

  verifyUniqueness(zones, "id", "Zone");
  verifyUniqueness(npcs, "id", "PNJ");
  verifyUniqueness(quests, "id", "Quête");
  verifyUniqueness(itemCatalog, "id", "Objet (catalogue)");
  verifyUniqueness(combatTargets, "id", "Cible combat");

  // Unicité dans les listes simples
  const verifyListUniqueness = (array: string[], label: string) => {
    const seen = new Set();
    for (const val of array) {
      if (seen.has(val)) {
        throw new Error(`Erreur d'unicité : L'élément "${val}" est en double dans la liste des ${label}.`);
      }
      seen.add(val);
    }
  };
  verifyListUniqueness(items, "objets");
  verifyListUniqueness(emotes, "emotes");

  console.log("✅ Toutes les données ont été validées avec succès !");
}

try {
  validate();
} catch (err: any) {
  console.error("\n❌ ÉCHEC DE LA VALIDATION DES DONNÉES :");
  console.error(err.message || err);
  process.exit(1);
}
