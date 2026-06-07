const kenneyBase = "/assets/vendor/kenney";
const terrainBase = "/assets/terrain";

export const assetSources = {
  kenneyMiniCharactersZip: "packages/assets/sources/kenney/kenney_mini-characters.zip",
  kenneyNatureKitZip: "packages/assets/sources/kenney/kenney_nature-kit.zip",
  kenneyPirateKitZip: "packages/assets/sources/kenney/kenney_pirate-kit.zip",
  kenneyPlatformerKitZip: "packages/assets/sources/kenney/kenney_platformer-kit.zip",
  kenneySurvivalKitZip: "packages/assets/sources/kenney/kenney_survival-kit.zip",
  laReunionStl: "packages/assets/sources/lareunion/LaReunion.stl",
  laReunionRgeAlti: "packages/assets/sources/lareunion/rgealti",
  laReunionOsmOutline: "packages/assets/sources/lareunion/lareunion-osm-outline.geojson"
} as const;

export const terrainAssets = {
  laReunion: {
    vectorMap: `${terrainBase}/lareunion/lareunion-vector-map.glb`,
    vectorManifest: `${terrainBase}/lareunion/vector-map-manifest.json`,
    reliefMap: `${terrainBase}/lareunion/lareunion-relief-map.glb`,
    heightfield: `${terrainBase}/lareunion/lareunion-heightfield.json`,
    reliefCollision: `${terrainBase}/lareunion/lareunion-relief-collision.json`,
    reliefManifest: `${terrainBase}/lareunion/relief-map-manifest.json`,
    chunkManifest: `${terrainBase}/lareunion/chunks/manifest.json`,
    chunks: [
      `${terrainBase}/lareunion/chunks/lareunion-terrain-0.glb`,
      `${terrainBase}/lareunion/chunks/lareunion-terrain-1.glb`,
      `${terrainBase}/lareunion/chunks/lareunion-terrain-2.glb`,
      `${terrainBase}/lareunion/chunks/lareunion-terrain-3.glb`
    ],
    manifest: `${terrainBase}/lareunion/chunks/manifest.json`
  }
} as const;

export const assetLicenses = {
  kenneyMiniCharacters: `${kenneyBase}/mini-characters/License.txt`,
  kenneyNatureKit: `${kenneyBase}/nature-kit/License.txt`,
  kenneyPirateKit: `${kenneyBase}/pirate-kit/License.txt`,
  kenneyPlatformerKit: `${kenneyBase}/platformer-kit/License.txt`,
  kenneySurvivalKit: `${kenneyBase}/survival-kit/License.txt`
} as const;

export const kenneyAssets = {
  characters: {
    femaleA: `${kenneyBase}/mini-characters/glb/character-female-a.glb`,
    femaleB: `${kenneyBase}/mini-characters/glb/character-female-b.glb`,
    femaleC: `${kenneyBase}/mini-characters/glb/character-female-c.glb`,
    maleA: `${kenneyBase}/mini-characters/glb/character-male-a.glb`,
    maleB: `${kenneyBase}/mini-characters/glb/character-male-b.glb`,
    maleC: `${kenneyBase}/mini-characters/glb/character-male-c.glb`
  },
  aids: {
    glasses: `${kenneyBase}/mini-characters/glb/aid-glasses.glb`,
    sunglasses: `${kenneyBase}/mini-characters/glb/aid-sunglasses.glb`,
    mask: `${kenneyBase}/mini-characters/glb/aid-mask.glb`
  },
  platformer: {
    barrel: `${kenneyBase}/platformer-kit/glb/barrel.glb`,
    arrow: `${kenneyBase}/platformer-kit/glb/arrow.glb`,
    grassLarge: `${kenneyBase}/platformer-kit/glb/block-grass-large.glb`,
    grassLow: `${kenneyBase}/platformer-kit/glb/block-grass-low.glb`,
    grassLong: `${kenneyBase}/platformer-kit/glb/block-grass-long.glb`,
    rocks: `${kenneyBase}/platformer-kit/glb/rocks.glb`,
    sign: `${kenneyBase}/platformer-kit/glb/sign.glb`,
    stones: `${kenneyBase}/platformer-kit/glb/stones.glb`
  },
  survival: {
    barrel: `${kenneyBase}/survival-kit/glb/barrel.glb`,
    barrelOpen: `${kenneyBase}/survival-kit/glb/barrel-open.glb`,
    bottle: `${kenneyBase}/survival-kit/glb/bottle.glb`,
    bottleLarge: `${kenneyBase}/survival-kit/glb/bottle-large.glb`,
    box: `${kenneyBase}/survival-kit/glb/box.glb`,
    boxLarge: `${kenneyBase}/survival-kit/glb/box-large.glb`,
    bucket: `${kenneyBase}/survival-kit/glb/bucket.glb`,
    campfirePit: `${kenneyBase}/survival-kit/glb/campfire-pit.glb`,
    chest: `${kenneyBase}/survival-kit/glb/chest.glb`,
    fence: `${kenneyBase}/survival-kit/glb/fence.glb`,
    grass: `${kenneyBase}/survival-kit/glb/grass.glb`,
    grassLarge: `${kenneyBase}/survival-kit/glb/grass-large.glb`,
    planks: `${kenneyBase}/survival-kit/glb/resource-planks.glb`,
    rockA: `${kenneyBase}/survival-kit/glb/rock-a.glb`,
    rockB: `${kenneyBase}/survival-kit/glb/rock-b.glb`,
    rockC: `${kenneyBase}/survival-kit/glb/rock-c.glb`,
    rockFlat: `${kenneyBase}/survival-kit/glb/rock-flat.glb`,
    rockFlatGrass: `${kenneyBase}/survival-kit/glb/rock-flat-grass.glb`,
    signpost: `${kenneyBase}/survival-kit/glb/signpost.glb`,
    structure: `${kenneyBase}/survival-kit/glb/structure.glb`,
    structureRoof: `${kenneyBase}/survival-kit/glb/structure-roof.glb`,
    tent: `${kenneyBase}/survival-kit/glb/tent.glb`,
    tree: `${kenneyBase}/survival-kit/glb/tree.glb`,
    treeTall: `${kenneyBase}/survival-kit/glb/tree-tall.glb`,
    workbench: `${kenneyBase}/survival-kit/glb/workbench.glb`
  },
  pirate: {
    boatRowLarge: `${kenneyBase}/pirate-kit/glb/boat-row-large.glb`,
    boatRowSmall: `${kenneyBase}/pirate-kit/glb/boat-row-small.glb`,
    cannon: `${kenneyBase}/pirate-kit/glb/cannon.glb`,
    chest: `${kenneyBase}/pirate-kit/glb/chest.glb`,
    flagPirate: `${kenneyBase}/pirate-kit/glb/flag-pirate.glb`,
    palmBend: `${kenneyBase}/pirate-kit/glb/palm-bend.glb`,
    palmDetailedStraight: `${kenneyBase}/pirate-kit/glb/palm-detailed-straight.glb`,
    palmStraight: `${kenneyBase}/pirate-kit/glb/palm-straight.glb`,
    patchSand: `${kenneyBase}/pirate-kit/glb/patch-sand.glb`,
    patchSandFoliage: `${kenneyBase}/pirate-kit/glb/patch-sand-foliage.glb`,
    platformDock: `${kenneyBase}/pirate-kit/glb/structure-platform-dock.glb`,
    rocksSandA: `${kenneyBase}/pirate-kit/glb/rocks-sand-a.glb`,
    rocksSandB: `${kenneyBase}/pirate-kit/glb/rocks-sand-b.glb`,
    rocksSandC: `${kenneyBase}/pirate-kit/glb/rocks-sand-c.glb`,
    shipWreck: `${kenneyBase}/pirate-kit/glb/ship-wreck.glb`
  },
  nature: {
    bridgeWood: `${kenneyBase}/nature-kit/glb/bridge_wood.glb`,
    campfireStones: `${kenneyBase}/nature-kit/glb/campfire_stones.glb`,
    cliffRock: `${kenneyBase}/nature-kit/glb/cliff_rock.glb`,
    cliffLargeRock: `${kenneyBase}/nature-kit/glb/cliff_large_rock.glb`,
    cliffWaterfallRock: `${kenneyBase}/nature-kit/glb/cliff_waterfall_rock.glb`,
    cliffWaterfallTopRock: `${kenneyBase}/nature-kit/glb/cliff_waterfallTop_rock.glb`,
    flowerRedA: `${kenneyBase}/nature-kit/glb/flower_redA.glb`,
    grassLarge: `${kenneyBase}/nature-kit/glb/grass_large.glb`,
    grassLeafsLarge: `${kenneyBase}/nature-kit/glb/grass_leafsLarge.glb`,
    palmDetailedTall: `${kenneyBase}/nature-kit/glb/tree_palmDetailedTall.glb`,
    plantBush: `${kenneyBase}/nature-kit/glb/plant_bush.glb`,
    plantBushLarge: `${kenneyBase}/nature-kit/glb/plant_bushLarge.glb`,
    treeDetailed: `${kenneyBase}/nature-kit/glb/tree_detailed.glb`,
    treePalm: `${kenneyBase}/nature-kit/glb/tree_palm.glb`
  }
} as const;
