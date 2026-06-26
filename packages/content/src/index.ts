import type { ItemDefinition } from "@riw/shared";
import zonesJson from "../data/zones.json";
import npcsJson from "../data/npcs.json";
import questsJson from "../data/quests.json";
import itemsJson from "../data/items.json";
import itemCatalogJson from "../data/item-catalog.json";
import emotesJson from "../data/emotes.json";

export const zones = zonesJson;
export const npcs = npcsJson;
export const quests = questsJson;
export const items = itemsJson;
export const itemCatalog = itemCatalogJson as ItemDefinition[];
export const emotes = emotesJson;
