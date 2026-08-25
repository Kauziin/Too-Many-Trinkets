import { world, system } from '@minecraft/server'

let rpgCoreDetected = false;

world.afterEvents.worldLoad.subscribe(() => {
    for (const value of Object.values(trinkets)) {
        system.sendScriptEvent("dorios:register_stat_data", JSON.stringify(value));
    }

    system.runTimeout(() => {
        if (!rpgCoreDetected) {
            world.sendMessage(
                "§c[Too Many Trinkets] Required dependency missing: Dorios RPG Core.\n" +
                "§7Please download it from §eCurseForge §7or §eMCPEDL§7."
            );
            system.runTimeout(() => {
                if (!rpgCoreDetected) {
                    world.sendMessage(
                        "§c[Too Many Trinkets] Required dependency missing: Dorios RPG Core.\n" +
                        "§7Please download it from §eCurseForge §7or §eMCPEDL§7."
                    );
                }
            }, 3600);
        }
    }, 300);
})

system.afterEvents.scriptEventReceive.subscribe(e => {
    if (e.id !== "dorios:stat_data_registered" || rpgCoreDetected) return;

    try {
        const data = JSON.parse(e.message);
        if (data?.registered == true) {
            rpgCoreDetected = true;
            system.runTimeout(() => {
                world.sendMessage(
                    "§a[Too Many Trinkets] Dorios RPG Core initialized successfully."
                );
            }, 300);
        }
    } catch { }
});


// =============================================================================
// TRINKET REGISTRY — v2.0 (Rebalanced & Enhanced)
// =============================================================================
// Each trinket entry defines:
//   trinket: slot name or array of slot names
//     Supported slots: head, body, feet, boots2, necklace, ring, ring2,
//       charm, charm2, talisman, gauntlet, heartycharm, doll, witherring,
//       heavyring, archaiccharm, amulet, face, belt, earring
//   stats: { statName: value } — additive modifiers to player stats
//   passives: { effectName: level } — permanent status effects on the player
//   actives: { effectName: level } — effects applied TO enemies on hit
//   immunities: ['EffectName'] — blocks these effects from being applied
//   loot: { biomes: [...], structures: [...] } — where the item spawns
//   drops: [{ entity, chance, conditions? }] — mob drop chances
//
// CHANGES v2.0:
//   - Multi-slot support: feet → ["feet", "boots2"], charm → ["charm", "charm2"]
//   - Fixed amulet trinkets using wrong slot
//   - Voodoo Doll moved to doll slot
//   - Buffed rare trinkets (Running Shoes, Universal Attractor, etc.)
//   - Added slow_falling to fall-protection trinkets
//   - Added unique effects (Miner's Ring ore dupe, Feral Claws bleed, etc.)
//   - Significantly reduced loot spawn chances
//   - Redistributed loot across all 3 dimensions
//   - Diversified mob drops (piglins, hoglins, endermites, etc.)
// =============================================================================

const trinkets = {

    // =========================================================================
    // HEAD SLOT
    // =========================================================================

    head: {
        // Night Vision Goggles — Permanent Night Vision
        "dorios:night_vision_goggles": {
            trinket: "face",
            passives: {
                night_vision: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:phantom", chance: 0.04 }
            ]
        },

        // Snorkel — Water Breathing + swim speed
        "dorios:snorkel": {
            trinket: "face",
            stats: {
                waterSpeed: 30
            },
            passives: {
                water_breathing: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:beach", chance: 0.08 },
                    { biome: "minecraft:ocean", chance: 0.08 },
                    { biome: "minecraft:deep_ocean", chance: 0.12 },
                    { biome: "minecraft:cold_ocean", chance: 0.08 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.12 },
                    { biome: "minecraft:lukewarm_ocean", chance: 0.08 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.12 }
                ]
            },
            drops: [
                { entity: "minecraft:drowned", chance: 0.02 },
                { entity: "minecraft:guardian", chance: 0.03 }
            ]
        },

        // Villager Hat — Hero of the Village + crit chance
        "dorios:villager_hat": {
            trinket: "head",
            stats: {
                critChance: 3
            },
            passives: {
                village_hero: 1
            },
            loot: {
                structures: [
                    { structure: "pillager_outpost", chance: 0.10 }
                ]
            },
            drops: [
                { entity: "minecraft:pillager", chance: 0.02 },
                { entity: "minecraft:vindicator", chance: 0.03 }
            ]
        },

        // Cowboy Hat — Speed boost + mount speed (event in system.js)
        "dorios:cowboy_hat": {
            trinket: "head",
            stats: {
                speed: 20
            },
            loot: {
                structures: [
                    { structure: "desert_pyramid", chance: 0.08 },
                    { structure: "pillager_outpost", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:pillager", chance: 0.02 },
                { entity: "minecraft:husk", chance: 0.02 }
            ]
        },

        // Superstitious Hat — 33% loot dupe on kill (event in system.js)
        // BUFFED: +8 critChance (rare find)
        "dorios:superstitious_hat": {
            trinket: "head",
            stats: {
                critChance: 8
            },
            loot: {
                structures: [
                    { structure: "desert_pyramid", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:witch", chance: 0.04 },
                { entity: "minecraft:evoker", chance: 0.05 }
            ]
        },

        // Angler's Hat — Speed + luck while fishing area
        "dorios:anglers_hat": {
            trinket: "head",
            stats: {
                speed: 10
            },
            passives: {
                luck: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:beach", chance: 0.06 },
                    { biome: "minecraft:ocean", chance: 0.06 },
                    { biome: "minecraft:deep_ocean", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:drowned", chance: 0.02 }
            ]
        },

        // Whoopee Cushion — Joke item, fart sounds (events in system.js)
        "dorios:whoopee_cushion": {
            trinket: "head",
            stats: {
                speed: 5
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:zombie", chance: 0.01 }
            ]
        },

        // Pirate Hat — 20% loot dupe on kill (event in system.js)
        // BUFFED: +10 critChance (buried treasure item)
        "dorios:pirate_hat": {
            trinket: "head",
            stats: {
                critChance: 10
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.01 },
                    { structure: "buried_treasure", chance: 0.12 }
                ]
            },
            drops: [
                { entity: "minecraft:drowned", chance: 0.0201 },
                { entity: "minecraft:pillager", chance: 0.02 }
            ]
        }
    },

    // =========================================================================
    // NECKLACE SLOT
    // =========================================================================

    necklace: {
        // Panic Necklace — Speed burst when hurt (event in system.js)
        "dorios:panic_necklace": {
            trinket: ["necklace", "charm", "archaiccharm", "charm2"],
            stats: {
                speed: 20,
                health: 2
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:creeper", chance: 0.03 }
            ]
        },

        // Cross Necklace — Extended i-frames when hurt (event in system.js)
        // BUFFED: +6 health
        "dorios:cross_necklace": {
            trinket: ["necklace", "charm", "archaiccharm", "charm2"],
            stats: {
                damageReduction: 10,
                health: 6
            },
            loot: {
                structures: [
                    { structure: "desert_pyramid", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:zombie", chance: 0.02 },
                { entity: "minecraft:husk", chance: 0.02 }
            ]
        },

        // Shock Pendant — 25% lightning strike on attacker (event in system.js)
        "dorios:shock_pendant": {
            trinket: ["necklace", "charm", "archaiccharm", "charm2"],
            stats: {
                attack: 2,
                thorns: 5
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.03 }
                ]
            },
            drops: [
                { entity: "minecraft:breeze", chance: 0.05 },
                { entity: "minecraft:creeper", chance: 0.02 }
            ]
        },

        // Flame Pendant — 40% ignite attacker (event in system.js)
        "dorios:flame_pendant": {
            trinket: ["necklace", "charm", "archaiccharm", "charm2"],
            stats: {
                fireAspect: 3
            },
            loot: {
                structures: [
                    { structure: "ruined_portal", chance: 0.08 },
                    { structure: "nether_fortress", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:blaze", chance: 0.04 },
                { entity: "minecraft:magma_cube", chance: 0.03 }
            ]
        },

        // Venomous Slash Pendant — AoE slash on hit using previous-hit damage (event in system.js)
        "dorios:venomous_slash_pendant": {
            trinket: ["necklace", "charm", "archaiccharm", "charm2"],
            stats: {
                attack: 3,
                critChance: 5
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.03 }
                ]
            },
            drops: [
                { entity: "minecraft:cave_spider", chance: 0.04 },
                { entity: "minecraft:spider", chance: 0.03 }
            ]
        },

        // Thorn Pendant — High thorns + health
        // BUFFED: thorns 15 → 20
        "dorios:thorn_pendant": {
            trinket: ["necklace", "charm", "archaiccharm", "charm2"],
            stats: {
                thorns: 20,
                health: 2
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.05 }
                ]
            },
            drops: [
                { entity: "minecraft:guardian", chance: 0.03 },
                { entity: "minecraft:pufferfish", chance: 0.04 }
            ]
        },

        // Lucky Scarf — Fortune-like ore drops (event in system.js)
        "dorios:lucky_scarf": {
            trinket: ["necklace", "charm", "archaiccharm", "charm2"],
            stats: {
                critChance: 10
            },
            loot: {
                structures: [
                    { structure: "desert_pyramid", chance: 0.04 },
                    { structure: "pillager_outpost", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:witch", chance: 0.03 }
            ]
        },

        // Scarf of Invisibility — Permanent Invisibility + speed
        "dorios:scarf_of_invisibility": {
            trinket: ["necklace", "charm", "archaiccharm", "charm2"],
            stats: {
                speed: 15
            },
            passives: {
                invisibility: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.03 }
                ]
            },
            drops: [
                { entity: "minecraft:phantom", chance: 0.03 },
                { entity: "minecraft:enderman", chance: 0.02 }
            ]
        },

        // Conduit Necklace — Conduit Power when underwater (event in system.js)
        "dorios:conduit_necklace": {
            trinket: ["necklace", "charm", "archaiccharm", "charm2"],
            stats: {
                waterSpeed: 30
            },
            loot: {
                biomes: [
                    { biome: "minecraft:ocean", chance: 0.04 },
                    { biome: "minecraft:deep_ocean", chance: 0.08 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.08 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:elder_guardian", chance: 0.06 }
            ]
        },
        "dorios:conduit_necklace_tag": {
            passives: {
                conduit_power: 1
            }
        },

        // Holy Necklace — Burns nearby undead (event in system.js)
        // BUFFED: smite-like aura + attack
        "dorios:holy_necklace": {
            trinket: ["necklace", "charm", "archaiccharm", "charm2"],
            stats: {
                attack: 3,
                health: 2
            },
            loot: {
                structures: [
                    { structure: "pillager_outpost", chance: 0.06 },
                    { structure: "desert_pyramid", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:zombie", chance: 0.02 },
                { entity: "minecraft:skeleton", chance: 0.02 },
                { entity: "minecraft:wither_skeleton", chance: 0.03 }
            ]
        }
    },

    // =========================================================================
    // BODY SLOT
    // =========================================================================

    body: {
        // Charm of Shrinking — Speed + damage reduction
        "dorios:charm_of_shrinking": {
            trinket: "body",
            stats: {
                speed: 20,
                damageReduction: 10
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:cave_spider", chance: 0.03 }
            ]
        },

        // Charm of Sinking — Massive water speed + conduit power
        "dorios:charm_of_sinking": {
            trinket: "body",
            stats: {
                waterSpeed: 50
            },
            passives: {
                conduit_power: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:ocean", chance: 0.04 },
                    { biome: "minecraft:deep_ocean", chance: 0.08 },
                    { biome: "minecraft:cold_ocean", chance: 0.04 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.08 },
                    { biome: "minecraft:lukewarm_ocean", chance: 0.04 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:elder_guardian", chance: 0.06 },
                { entity: "minecraft:guardian", chance: 0.03 }
            ]
        },

        // Void Quiver — Projectile hits trigger chain arrows over nearby enemies (event in system.js)
        "dorios:void_quiver": {
            trinket: "body",
            stats: {
                critChance: 4
            },
            loot: {
                structures: [
                    { structure: "pillager_outpost", chance: 0.04 },
                    { structure: "default", chance: 0.02 }
                ]
            },
            drops: [
                { entity: "minecraft:skeleton", chance: 0.03 },
                { entity: "minecraft:stray", chance: 0.03 },
                { entity: "minecraft:pillager", chance: 0.02 }
            ]
        }
    },

    // =========================================================================
    // GAUNTLET SLOT
    // =========================================================================

    gauntlet: {
        // Fire Gauntlet — Fire Aspect + attack
        "dorios:fire_gauntlet": {
            trinket: "gauntlet",
            stats: {
                attack: 1,
                fireAspect: 5
            },
            loot: {
                structures: [
                    { structure: "nether_fortress", chance: 0.08 },
                    { structure: "bastion", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:blaze", chance: 0.04 },
                { entity: "minecraft:piglin_brute", chance: 0.03 }
            ]
        },

        // Feral Claws — High crit + 15% bleed on hit (event in system.js)
        // BUFFED: bleeding effect on crit
        "dorios:feral_claws": {
            trinket: "gauntlet",
            stats: {
                attack: 3,
                critChance: 12,
                critMulti: 20
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.05 }
                ]
            },
            drops: [
                { entity: "minecraft:cave_spider", chance: 0.04 },
                { entity: "minecraft:spider", chance: 0.03 }
            ]
        },

        // Power Glove — High attack + knockback
        "dorios:power_glove": {
            trinket: "gauntlet",
            stats: {
                attack: 4,
                knockback: 10
            },
            loot: {
                structures: [
                    { structure: "bastion", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:piglin_brute", chance: 0.04 },
                { entity: "minecraft:hoglin", chance: 0.03 }
            ]
        },

        // Digging Claws — Haste + minor attack
        "dorios:digging_claws": {
            trinket: "gauntlet",
            stats: {
                attack: 1
            },
            passives: {
                haste: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:zombie", chance: 0.02 },
                { entity: "minecraft:spider", chance: 0.02 }
            ]
        },

        // Pocket Piston — Knockback + attack
        "dorios:pocket_piston": {
            trinket: "gauntlet",
            stats: {
                attack: 2,
                knockback: 15
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.05 }
                ]
            },
            drops: [
                { entity: "minecraft:breeze", chance: 0.05 },
                { entity: "minecraft:iron_golem", chance: 0.02 }
            ]
        },

        // Pickaxe Heater — Auto-smelt ores (event in system.js)
        "dorios:pickaxe_heater": {
            trinket: "gauntlet",
            stats: {
                attack: 1
            },
            passives: {
                haste: 1
            },
            loot: {
                structures: [
                    { structure: "nether_fortress", chance: 0.06 },
                    { structure: "bastion", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:blaze", chance: 0.03 },
                { entity: "minecraft:magma_cube", chance: 0.02 }
            ]
        },

        // Withered Bracelet — Wither on hit + Wither immunity
        "dorios:withered_bracelet": {
            trinket: "gauntlet",
            stats: {
                attack: 2
            },
            actives: {
                wither: 1
            },
            immunities: ['Wither'],
            loot: {
                structures: [
                    { structure: "nether_fortress", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:wither_skeleton", chance: 0.04 },
                { entity: "minecraft:skeleton", chance: 0.02 }
            ]
        },

        // Steadfast Spikes — Knockback resistance + thorns
        // BUFFED: knockbackRes 50 → 60
        "dorios:steadfast_spikes": {
            trinket: "gauntlet",
            stats: {
                knockbackRes: 60,
                health: 2,
                thorns: 5
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:iron_golem", chance: 0.03 },
                { entity: "minecraft:hoglin", chance: 0.02 }
            ]
        },

        // Freezing Glove — Slowness on hit
        "dorios:freezing_glove": {
            trinket: "gauntlet",
            stats: {
                attack: 1
            },
            actives: {
                slowness: 2
            },
            loot: {
                biomes: [
                    { biome: "minecraft:frozen_peaks", chance: 0.06 },
                    { biome: "minecraft:ice_plains", chance: 0.06 },
                    { biome: "minecraft:ice_plains_spikes", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:stray", chance: 0.04 },
                { entity: "minecraft:bogged", chance: 0.03 }
            ]
        },

        // Holy Dagger — Extra 2-6 damage to undead (event in system.js)
        // BUFFED: 1-4 → 2-6 bonus damage
        "dorios:holy_dagger": {
            trinket: "gauntlet",
            stats: {
                attack: 3
            },
            loot: {
                structures: [
                    { structure: "pillager_outpost", chance: 0.06 },
                    { structure: "desert_pyramid", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:wither_skeleton", chance: 0.04 },
                { entity: "minecraft:zombie", chance: 0.02 }
            ]
        },

        // Silk Glove — Silk-touch: ores drop the block itself (event in system.js)
        // Passive: Haste II for faster mining
        "dorios:silk_glove": {
            trinket: "gauntlet",
            stats: {
                attack: 1
            },
            passives: {
                haste: 2
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.03 }
                ]
            },
            drops: [
                { entity: "minecraft:cave_spider", chance: 0.03 },
                { entity: "minecraft:spider", chance: 0.02 }
            ]
        }
    },

    // =========================================================================
    // RING SLOT
    // =========================================================================

    ring: {
        // Golden Hook — Bonus XP on kill (event in system.js)
        "dorios:golden_hook": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                attack: 2
            },
            loot: {
                structures: [
                    { structure: "desert_pyramid", chance: 0.06 },
                    { structure: "bastion", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:piglin_brute", chance: 0.03 },
                { entity: "minecraft:piglin", chance: 0.02 }
            ]
        },

        // Onion Ring — Saturation + Strength after eating (event in system.js)
        "dorios:onion_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                health: 4
            },
            passives: {
                saturation: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.05 }
                ]
            },
            drops: [
                { entity: "minecraft:zombie", chance: 0.01 },
                { entity: "minecraft:hoglin", chance: 0.02 }
            ]
        },

        // Vampiric Glove — Life Steal + attack
        "dorios:vampiric_glove": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                lifeSteal: 8,
                attack: 1
            },
            loot: {
                structures: [
                    { structure: "bastion", chance: 0.06 },
                    { structure: "nether_fortress", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:piglin_brute", chance: 0.03 },
                { entity: "minecraft:piglin", chance: 0.02 }
            ]
        },

        // Falling Resistance Ring — Slow Falling + health
        // BUFFED: Added slow_falling for actual fall protection
        "dorios:falling_resistance_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                health: 2
            },
            passives: {
                slow_falling: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:phantom", chance: 0.03 },
                { entity: "minecraft:enderman", chance: 0.02 }
            ]
        },

        // Deep Sea Ring — Water breathing + swim speed
        "dorios:deep_sea_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                waterSpeed: 30
            },
            passives: {
                water_breathing: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:deep_ocean", chance: 0.08 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.08 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:drowned", chance: 0.03 },
                { entity: "minecraft:guardian", chance: 0.03 }
            ]
        },

        // Fall Regen Ring — Regen on fall damage (event in system.js)
        // BUFFED: Added slow_falling to actually soften falls
        "dorios:fall_regen_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                health: 2,
                healthRegen: 1
            },
            passives: {
                slow_falling: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.05 }
                ]
            },
            drops: [
                { entity: "minecraft:phantom", chance: 0.02 },
                { entity: "minecraft:endermite", chance: 0.04 }
            ]
        },

        // Heroic Ring — Hero of the Village + health
        "dorios:heroic_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                health: 4
            },
            passives: {
                village_hero: 1
            },
            loot: {
                structures: [
                    { structure: "pillager_outpost", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:pillager", chance: 0.02 },
                { entity: "minecraft:ravager", chance: 0.04 }
            ]
        },

        // Miner's Ring — Haste + 10% ore drop dupe (event in system.js)
        // BUFFED: Added unique 10% ore duplication mechanic
        "dorios:miners_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                attack: 1
            },
            passives: {
                haste: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.05 }
                ]
            },
            drops: [
                { entity: "minecraft:zombie", chance: 0.02 },
                { entity: "minecraft:cave_spider", chance: 0.03 }
            ]
        },

        // Sprint Ring — Speed II + Strength I while sprinting (event in system.js)
        // Uses Entity API: player.isSprinting
        "dorios:sprint_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                speed: 15
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 },
                    { structure: "pillager_outpost", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:pillager", chance: 0.02 },
                { entity: "minecraft:spider", chance: 0.02 }
            ]
        },

        // Gale Ring — Slow falling + fall damage negation (event in system.js)
        // Uses Entity API: player.isFalling, getVelocity()
        "dorios:gale_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                extraJumps: 1
            },
            passives: {
                slow_falling: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:phantom", chance: 0.03 },
                { entity: "minecraft:breeze", chance: 0.04 }
            ]
        },

        // Shepherd's Ring — Double drops from animals on kill (event in system.js)
        // Uses Entity API: entity type checks for passive mobs
        "dorios:shepherds_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                health: 2,
                healthRegen: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:plains", chance: 0.04 },
                    { biome: "minecraft:savanna", chance: 0.04 },
                    { biome: "minecraft:flower_forest", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:pillager", chance: 0.02 },
                { entity: "minecraft:zombie", chance: 0.01 }
            ]
        },

        // Frost Ring — AoE Slowness aura to nearby enemies (event in system.js)
        // Uses Entity API: dimension.getEntities() + addEffect()
        "dorios:frost_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                damageReduction: 5
            },
            loot: {
                biomes: [
                    { biome: "minecraft:frozen_peaks", chance: 0.06 },
                    { biome: "minecraft:ice_plains", chance: 0.06 },
                    { biome: "minecraft:ice_plains_spikes", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:stray", chance: 0.04 },
                { entity: "minecraft:bogged", chance: 0.03 }
            ]
        }
    },

    // =========================================================================
    // CHARM SLOT (supports charm + charm2 for most items)
    // =========================================================================

    charm: {
        // Obsidian Skull — Fire resistance when not in lava (event in system.js)
        "dorios:obsidian_skull": {
            trinket: ["charm", "charm2"],
            stats: {
                health: 4
            },
            immunities: ['Fatal_poison'],
            loot: {
                structures: [
                    { structure: "ruined_portal", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:magma_cube", chance: 0.03 },
                { entity: "minecraft:blaze", chance: 0.02 }
            ]
        },
        "dorios:obsidian_skull_tag": {
            passives: {
                fire_resistance: 1
            }
        },

        // Antidote Vessel — Poison/Wither/Hunger immunity
        "dorios:antidote_vessel": {
            trinket: ["charm", "charm2"],
            stats: {
                health: 2
            },
            immunities: ['Poison', 'Wither', 'Hunger'],
            loot: {
                structures: [
                    { structure: "default", chance: 0.03 }
                ]
            },
            drops: [
                { entity: "minecraft:witch", chance: 0.04 },
                { entity: "minecraft:cave_spider", chance: 0.03 }
            ]
        },

        // Cloud in a Bottle — Extra jump + slow falling
        // BUFFED: Added slow_falling for better air control
        "dorios:cloud_in_a_bottle": {
            trinket: ["charm", "charm2"],
            stats: {
                extraJumps: 1,
                speed: 10
            },
            passives: {
                slow_falling: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.05 }
                ]
            },
            drops: [
                { entity: "minecraft:phantom", chance: 0.03 },
                { entity: "minecraft:breeze", chance: 0.04 }
            ]
        },

        // Universal Attractor — 12-block item + XP magnet (event in system.js)
        // BUFFED: Range 8 → 12, now also attracts XP orbs
        "dorios:universal_attractor": {
            trinket: ["charm", "charm2"],
            stats: {
                speed: 10
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:iron_golem", chance: 0.02 }
            ]
        },

        // Warp Drive — Ender pearl refund (event in system.js) + End theme
        "dorios:warp_drive": {
            trinket: ["charm", "charm2"],
            stats: {
                speed: 10,
                extraJumps: 1
            },
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.04,
                        conditions: {
                            dimension: "minecraft:the_end"
                        }
                    }
                ]
            },
            drops: [
                { entity: "minecraft:enderman", chance: 0.02 },
                { entity: "minecraft:endermite", chance: 0.05 }
            ]
        },

        // Dice — 25% loot dupe on kill (event in system.js)
        "dorios:dice": {
            trinket: ["charm", "charm2"],
            stats: {
                critChance: 5
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:zombie", chance: 0.01 },
                { entity: "minecraft:skeleton", chance: 0.01 }
            ]
        },

        // Golden Horn — Weakness to Illagers on hit (event in system.js)
        "dorios:golden_horn": {
            trinket: ["charm", "charm2"],
            stats: {
                attack: 2
            },
            loot: {
                structures: [
                    { structure: "pillager_outpost", chance: 0.10 }
                ]
            },
            drops: [
                { entity: "minecraft:pillager", chance: 0.03 },
                { entity: "minecraft:vindicator", chance: 0.03 }
            ]
        },

        // Holy Grail — HP regen at cost of XP (event in system.js)
        "dorios:holy_grail": {
            trinket: ["charm", "charm2"],
            stats: {
                health: 4,
                healthRegen: 3
            },
            loot: {
                structures: [
                    { structure: "desert_pyramid", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:wither_skeleton", chance: 0.03 },
                { entity: "minecraft:evoker", chance: 0.04 }
            ]
        },

        // Mirror — 40% reflect melee damage (event in system.js)
        // BUFFED: 30% → 40% reflect, 0.3x → 0.4x damage
        "dorios:mirror": {
            trinket: ["charm", "charm2"],
            stats: {
                thorns: 5,
                health: 2
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.03 }
                ]
            },
            drops: [
                { entity: "minecraft:witch", chance: 0.03 },
                { entity: "minecraft:creeper", chance: 0.02 }
            ]
        },

        // Necromancer Charm — 60% summon skeleton ally on kill (event in system.js)
        "dorios:necromancer_charm": {
            trinket: ["charm", "charm2"],
            stats: {
                attack: 2
            },
            loot: {
                structures: [
                    { structure: "nether_fortress", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:wither_skeleton", chance: 0.04 },
                { entity: "minecraft:skeleton", chance: 0.02 }
            ]
        },

        // Void Star — Calm nearby endermen (event in system.js)
        "dorios:void_star": {
            trinket: ["charm", "charm2"],
            stats: {
                health: 2
            },
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.05,
                        conditions: {
                            dimension: "minecraft:the_end"
                        }
                    }
                ]
            },
            drops: [
                { entity: "minecraft:enderman", chance: 0.02 },
                { entity: "minecraft:endermite", chance: 0.05 }
            ]
        },

        // Weight — AoE damage on fall (event in system.js)
        "dorios:weight": {
            trinket: ["charm", "charm2"],
            stats: {
                health: 4,
                knockback: 10
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:iron_golem", chance: 0.03 },
                { entity: "minecraft:hoglin", chance: 0.02 }
            ]
        },

        // Golden Feather — Speed + Slow Falling
        "dorios:golden_feather": {
            trinket: ["charm", "charm2"],
            stats: {
                speed: 10
            },
            passives: {
                slow_falling: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.05 }
                ]
            },
            drops: [
                { entity: "minecraft:phantom", chance: 0.03 },
                { entity: "minecraft:chicken", chance: 0.04 }
            ]
        },

        // Umbrella — Slow falling + Resistance during rain (event in system.js)
        // Uses Entity API: player.isFalling, dimension weather check
        "dorios:umbrella": {
            trinket: ["charm", "charm2"],
            stats: {
                damageReduction: 5
            },
            passives: {
                slow_falling: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.05 }
                ]
            },
            drops: [
                { entity: "minecraft:zombie", chance: 0.01 },
                { entity: "minecraft:skeleton", chance: 0.01 }
            ]
        }
    },

    // =========================================================================
    // DOLL SLOT (moved from charm)
    // =========================================================================

    doll: {
        // Voodoo Doll — 40% redirect damage to nearby entity (event in system.js)
        "dorios:voodoo": {
            trinket: "doll",
            stats: {
                thorns: 5
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.03 }
                ]
            },
            drops: [
                { entity: "minecraft:witch", chance: 0.04 },
                { entity: "minecraft:evoker", chance: 0.03 }
            ]
        }
    },

    // =========================================================================
    // HEARTY CHARM SLOT
    // =========================================================================

    heartycharm: {
        // Crystal Heart — Massive health + regen
        "dorios:crystal_heart": {
            trinket: "heartycharm",
            stats: {
                health: 16,
                healthRegen: 1
            },
            loot: {
                structures: [
                    { structure: "desert_pyramid", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:warden", chance: 0.10 },
                { entity: "minecraft:elder_guardian", chance: 0.04 }
            ]
        },

        // Heart from the Fourth Dimension — Supreme defensive charm (event in system.js)
        // 14 extra hearts, 35% damage reduction, full negative-effect immunity
        // 75% chance to reflect received damage to nearby hostiles + projectile control aura
        "dorios:heart_from_the_fourth_dimension": {
            trinket: "heartycharm",
            stats: {
                health: 28,
                damageReduction: 35
            },
            passives: {
                regeneration: 2,
                fire_resistance: 1
            },
            immunities: ['Poison', 'Wither', 'Hunger', 'Weakness', 'Mining_fatigue', 'Slowness', 'Nausea', 'Levitation', 'Darkness', 'Blindness', 'Fatal_poison', 'Bad_omen', 'Instant_damage'],
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.02,
                        conditions: {
                            dimension: "minecraft:the_end"
                        }
                    }
                ]
            },
            drops: [
                { entity: "minecraft:warden", chance: 0.004 },
                { entity: "minecraft:ender_dragon", chance: 0.15 }
            ]
        }
    },

    // =========================================================================
    // TALISMAN SLOT
    // =========================================================================

    talisman: {
        // Chorus Totem — End-themed utility talisman
        "dorios:chorus_totem": {
            trinket: "talisman",
            stats: {
                health: 4,
                speed: 10
            },
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.06,
                        conditions: {
                            dimension: "minecraft:the_end"
                        }
                    }
                ]
            },
            drops: [
                { entity: "minecraft:enderman", chance: 0.03 },
                { entity: "minecraft:shulker", chance: 0.04 }
            ]
        },

        // Helium Flamingo — Extra jump + slow falling
        // BUFFED: Added slow_falling for safety
        "dorios:helium_flamingo": {
            trinket: "talisman",
            stats: {
                extraJumps: 1,
                speed: 10
            },
            passives: {
                slow_falling: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:phantom", chance: 0.04 },
                { entity: "minecraft:breeze", chance: 0.03 }
            ]
        },

        // Void Totem — Save from void (event in system.js)
        "dorios:void_totem": {
            trinket: "talisman",
            stats: {
                health: 4,
                speed: 10
            },
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.04,
                        conditions: {
                            dimension: "minecraft:the_end"
                        }
                    }
                ]
            },
            drops: [
                { entity: "minecraft:enderman", chance: 0.03 },
                { entity: "minecraft:shulker", chance: 0.03 }
            ]
        }
    },

    // =========================================================================
    // FEET SLOT (supports feet + boots2 — equip two different boots)
    // =========================================================================

    feet: {
        // Running Shoes — Pure speed boost
        // BUFFED: speed 30 → 50 (rare overworld find)
        "dorios:running_shoes": {
            trinket: ["feet", "boots2"],
            stats: {
                speed: 50
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.06 },
                    { structure: "pillager_outpost", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:pillager", chance: 0.02 },
                { entity: "minecraft:spider", chance: 0.02 }
            ]
        },

        // Bunny Hoppers — Jump Boost + no fall damage (event in system.js)
        // BUFFED: Added slow_falling for graceful landings
        "dorios:bunny_hoppers": {
            trinket: ["feet", "boots2"],
            stats: {
                extraJumps: 2,
                speed: 10
            },
            passives: {
                jump_boost: 2
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:rabbit", chance: 0.03 },
                { entity: "minecraft:slime", chance: 0.02 }
            ]
        },

        // Kitty Slippers — Creeper repellent (event in system.js)
        "dorios:kitty_slippers": {
            trinket: ["feet", "boots2"],
            stats: {
                speed: 20,
                critChance: 5
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.05 }
                ]
            },
            drops: [
                { entity: "minecraft:creeper", chance: 0.02 },
                { entity: "minecraft:ocelot", chance: 0.04 }
            ]
        },

        // Flippers — Swim speed
        "dorios:flippers": {
            trinket: ["feet", "boots2"],
            stats: {
                waterSpeed: 80,
                speed: 10
            },
            loot: {
                biomes: [
                    { biome: "minecraft:beach", chance: 0.06 },
                    { biome: "minecraft:ocean", chance: 0.06 },
                    { biome: "minecraft:deep_ocean", chance: 0.10 },
                    { biome: "minecraft:cold_ocean", chance: 0.06 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.10 },
                    { biome: "minecraft:lukewarm_ocean", chance: 0.06 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.10 }
                ]
            },
            drops: [
                { entity: "minecraft:drowned", chance: 0.02 },
                { entity: "minecraft:guardian", chance: 0.02 }
            ]
        },

        // Rooted Boots — Nature tank boots (conditional: nature = speed + regen 3; else = slow + regen 1 + creeper scare)
        "dorios:rooted_boots": {
            trinket: ["feet", "boots2"],
            stats: {
                health: 4,
                damageReduction: 10
            },
            loot: {
                biomes: [
                    { biome: "minecraft:jungle", chance: 0.08 },
                    { biome: "minecraft:jungle_hills", chance: 0.08 },
                    { biome: "minecraft:jungle_edge", chance: 0.08 },
                    { biome: "minecraft:jungle_mutated", chance: 0.08 },
                    { biome: "minecraft:bamboo_jungle", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:spider", chance: 0.02 }
            ]
        },

        // Aqua Dashers — Massive water speed + water breathing
        "dorios:aqua_dashers": {
            trinket: ["feet", "boots2"],
            stats: {
                waterSpeed: 100,
                speed: 15
            },
            passives: {
                water_breathing: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:ocean", chance: 0.03 },
                    { biome: "minecraft:deep_ocean", chance: 0.06 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.06 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:elder_guardian", chance: 0.05 },
                { entity: "minecraft:guardian", chance: 0.02 }
            ]
        },

        // Snowshoes — Ice terrain specialist
        "dorios:snowshoes": {
            trinket: ["feet", "boots2"],
            stats: {
                speed: 25,
                damageReduction: 15
            },
            immunities: ['Slowness'],
            loot: {
                biomes: [
                    { biome: "minecraft:frozen_peaks", chance: 0.06 },
                    { biome: "minecraft:ice_mountains", chance: 0.06 },
                    { biome: "minecraft:ice_plains", chance: 0.06 },
                    { biome: "minecraft:ice_plains_spikes", chance: 0.08 },
                    { biome: "minecraft:cold_taiga", chance: 0.06 }
                ]
            },
            drops: [
                { entity: "minecraft:stray", chance: 0.04 },
                { entity: "minecraft:bogged", chance: 0.03 }
            ]
        },

        // Strider Shoes — Lava mobility + fire resistance
        "dorios:strider_shoes": {
            trinket: ["feet", "boots2"],
            stats: {
                lavaSpeed: 200,
                speed: 15
            },
            passives: {
                fire_resistance: 1
            },
            loot: {
                structures: [
                    { structure: "nether_fortress", chance: 0.06 },
                    { structure: "bastion", chance: 0.04 },
                    { structure: "ruined_portal", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:strider", chance: 0.03 },
                { entity: "minecraft:magma_cube", chance: 0.02 }
            ]
        },

        // Floater Boots — Water speed + water breathing
        "dorios:floater_boots": {
            trinket: ["feet", "boots2"],
            stats: {
                waterSpeed: 80
            },
            passives: {
                water_breathing: 1
            },
            loot: {
                biomes: [
                    { biome: "minecraft:ocean", chance: 0.04 },
                    { biome: "minecraft:deep_ocean", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:drowned", chance: 0.03 },
                { entity: "minecraft:guardian", chance: 0.02 }
            ]
        },

        // Anti-Slip Boots — Ice mobility + Slowness immunity
        "dorios:anti_slip_boots": {
            trinket: ["feet", "boots2"],
            stats: {
                speed: 25,
                damageReduction: 5
            },
            immunities: ['Slowness'],
            loot: {
                biomes: [
                    { biome: "minecraft:frozen_peaks", chance: 0.06 },
                    { biome: "minecraft:ice_plains", chance: 0.06 },
                    { biome: "minecraft:ice_plains_spikes", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:stray", chance: 0.03 },
                { entity: "minecraft:bogged", chance: 0.03 }
            ]
        },

        // Rocket Boots — Strong impulse jumps (1st air = rocket up, 2nd air = rocket forward)
        "dorios:rocket_boots": {
            trinket: ["feet", "boots2"],
            stats: {
                extraJumps: 2,
                speed: 10
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:breeze", chance: 0.04 },
                { entity: "minecraft:phantom", chance: 0.02 }
            ]
        },

        // Guardian Fin — Swim speed + land speed
        "dorios:guardian_fin": {
            trinket: ["feet", "boots2"],
            stats: {
                waterSpeed: 60,
                speed: 10
            },
            loot: {
                biomes: [
                    { biome: "minecraft:deep_ocean", chance: 0.08 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.08 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:guardian", chance: 0.04 },
                { entity: "minecraft:drowned", chance: 0.02 }
            ]
        }
    },

    // =========================================================================
    // AMULET SLOT
    // =========================================================================

    amulet: {
        // Plastic Drinking Hat — Permanent Saturation + regen
        "dorios:plastic_drinking_hat": {
            trinket: "head",
            stats: {
                health: 2,
                healthRegen: 5
            },
            passives: {
                saturation: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:zombie", chance: 0.01 }
            ]
        },

        // Novelty Drinking Hat — Saturation + speed variant
        "dorios:novelty_drinking_hat": {
            trinket: "head",
            stats: {
                speed: 10,
                healthRegen: 3
            },
            passives: {
                saturation: 1
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:skeleton", chance: 0.01 }
            ]
        }
    },

    // =========================================================================
    // FACE SLOT
    // =========================================================================

    face: {
        // Golden Skull — Dark combat face trinket
        "dorios:golden_skull": {
            trinket: "face",
            stats: {
                attack: 3,
                critChance: 10
            },
            loot: {
                structures: [
                    { structure: "nether_fortress", chance: 0.06 },
                    { structure: "bastion", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:wither_skeleton", chance: 0.05 },
                { entity: "minecraft:piglin_brute", chance: 0.03 }
            ]
        },

        // Monocle — Display mob health (event in system.js) + perception
        "dorios:monocle": {
            trinket: "face",
            stats: {
                critChance: 6
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.05 }
                ]
            },
            drops: [
                { entity: "minecraft:skeleton", chance: 0.02 },
                { entity: "minecraft:spider", chance: 0.02 }
            ]
        }
    },

    // =========================================================================
    // RING 2 SLOT
    // =========================================================================

    ring2: {
        // Divine Protection Ring — Resistance when HP < 4 hearts (event in system.js)
        "dorios:devine_protection_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                health: 4,
                damageReduction: 5
            },
            loot: {
                structures: [
                    { structure: "desert_pyramid", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:zombie", chance: 0.02 },
                { entity: "minecraft:husk", chance: 0.02 }
            ]
        },
        "dorios:devine_protection_ring_tag": {
            passives: {
                resistance: 2
            }
        },

        // Feline Protection Ring — Scare creepers (event in system.js)
        "dorios:feline_protection_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                health: 2,
                speed: 10
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:creeper", chance: 0.02 },
                { entity: "minecraft:ocelot", chance: 0.03 }
            ]
        },

        // Magnetic Ring — Item magnet 8-block range (event in system.js)
        "dorios:magnetic_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                speed: 5
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:iron_golem", chance: 0.02 },
                { entity: "minecraft:zombie", chance: 0.01 }
            ]
        },

        // Shadow Sneak Ring — Invisibility + Speed while sneaking (event in system.js)
        "dorios:shadow_sneak_ring": {
            trinket: ["ring", "ring2", "rings"],
            stats: {
                speed: 10
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.03 }
                ]
            },
            drops: [
                { entity: "minecraft:phantom", chance: 0.03 },
                { entity: "minecraft:enderman", chance: 0.02 }
            ]
        },
        "dorios:shadow_sneak_ring_tag": {
            passives: {
                invisibility: 1,
                speed: 1
            }
        }
    },

    // =========================================================================
    // HEAVY RING SLOT
    // =========================================================================

    heavyring: {
        // Berserk Ring — Stacking Strength on kill (event in system.js)
        // BUFFED: attack 3 → 4
        "dorios:berserk_ring": {
            trinket: ["heavyring", "witherring"],
            stats: {
                attack: 4,
                critMulti: 5
            },
            loot: {
                structures: [
                    { structure: "bastion", chance: 0.06 },
                    { structure: "nether_fortress", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:piglin_brute", chance: 0.04 },
                { entity: "minecraft:hoglin", chance: 0.03 }
            ]
        },

        // Vampire Ring — High lifesteal
        // BUFFED: lifeSteal 30 → 35
        "dorios:vampire_ring": {
            trinket: ["heavyring", "witherring"],
            stats: {
                lifeSteal: 35,
                attack: 2
            },
            loot: {
                structures: [
                    { structure: "bastion", chance: 0.05 },
                    { structure: "nether_fortress", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:piglin_brute", chance: 0.03 },
                { entity: "minecraft:piglin", chance: 0.02 },
                { entity: "minecraft:hoglin", chance: 0.02 }
            ]
        },

        // Anti-Curse Ring — Full negative effect immunity
        "dorios:anti_curse_ring": {
            trinket: ["heavyring", "witherring"],
            stats: {
                health: 4,
                damageReduction: 5
            },
            immunities: ['Poison', 'Wither', 'Hunger', 'Weakness', 'Mining_fatigue', 'Slowness', 'Nausea', 'Levitation', 'Darkness', 'Fatal_Poison', 'Bad_omen'],
            loot: {
                structures: [
                    { structure: "nether_fortress", chance: 0.03 }
                ]
            },
            drops: [
                { entity: "minecraft:witch", chance: 0.05 },
                { entity: "minecraft:evoker", chance: 0.04 }
            ]
        },

        // Tidal Ring — Conduit Power + Dolphin's Grace when underwater (event in system.js)
        // Uses Entity API: player.isInWater via conditional tag
        "dorios:tidal_ring": {
            trinket: ["heavyring", "witherring"],
            stats: {
                waterSpeed: 50
            },
            loot: {
                biomes: [
                    { biome: "minecraft:deep_ocean", chance: 0.04 },
                    { biome: "minecraft:deep_cold_ocean", chance: 0.04 },
                    { biome: "minecraft:deep_lukewarm_ocean", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:elder_guardian", chance: 0.05 },
                { entity: "minecraft:guardian", chance: 0.03 }
            ]
        },
        "dorios:tidal_ring_tag": {
            passives: {
                conduit_power: 1
            }
        },

        // Earthshaker Ring — AoE stomp on landing from height (event in system.js)
        // Uses Entity API: player.isFalling, player.isOnGround, applyImpulse()
        "dorios:earthshaker_ring": {
            trinket: ["heavyring", "witherring"],
            stats: {
                attack: 3,
                knockback: 2
            },
            loot: {
                structures: [
                    { structure: "bastion", chance: 0.04 },
                    { structure: "nether_fortress", chance: 0.03 }
                ]
            },
            drops: [
                { entity: "minecraft:warden", chance: 0.06 },
                { entity: "minecraft:iron_golem", chance: 0.03 }
            ]
        },

        // Gravity Ring — Pull nearby enemies toward you every 5 ticks (event in system.js)
        // Uses Entity API: entity.applyImpulse() for gravitational pull
        "dorios:gravity_ring": {
            trinket: ["heavyring", "witherring"],
            stats: {
                knockbackRes: 20
            },
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.03,
                        conditions: {
                            dimension: "minecraft:the_end"
                        }
                    }
                ]
            },
            drops: [
                { entity: "minecraft:enderman", chance: 0.02 },
                { entity: "minecraft:shulker", chance: 0.03 }
            ]
        },

        // Ender Ring — Auto-extinguish fire + teleport save when near death (event in system.js)
        // Uses Entity API: player.extinguishFire(), player.teleport()
        "dorios:ender_ring": {
            trinket: ["heavyring", "witherring"],
            stats: {
                attack: 2,
                speed: 10
            },
            loot: {
                structures: [
                    {
                        structure: "default",
                        chance: 0.03,
                        conditions: {
                            dimension: "minecraft:the_end"
                        }
                    }
                ]
            },
            drops: [
                { entity: "minecraft:enderman", chance: 0.03 },
                { entity: "minecraft:shulker", chance: 0.03 }
            ]
        }
    },

    // =========================================================================
    // BELT SLOT
    // =========================================================================

    belt: {
        // Life Buoy — Float up underwater when sneaking (event in system.js)
        "dorios:life_buoy": {
            trinket: "belt",
            stats: {
                waterSpeed: 30,
                health: 2
            },
            loot: {
                biomes: [
                    { biome: "minecraft:beach", chance: 0.06 },
                    { biome: "minecraft:ocean", chance: 0.06 },
                    { biome: "minecraft:deep_ocean", chance: 0.08 }
                ]
            },
            drops: [
                { entity: "minecraft:drowned", chance: 0.03 },
                { entity: "minecraft:guardian", chance: 0.02 }
            ]
        },

        // Rocket Thruster — Speed + extra jump + slow falling
        // ULTRA RARE: Phantom-only drop (0.001%)
        "dorios:rocket_thruster": {
            trinket: "belt",
            stats: {
                speed: 20,
                extraJumps: 1
            },
            passives: {
                slow_falling: 1
            },
            drops: [
                { entity: "minecraft:phantom", chance: 0.00001 }
            ]
        },

        // Premium Pillow — High health regeneration
        "dorios:premium_pillow": {
            trinket: "belt",
            stats: {
                health: 2,
                healthRegen: 5
            },
            loot: {
                structures: [
                    { structure: "default", chance: 0.04 }
                ]
            },
            drops: [
                { entity: "minecraft:zombie", chance: 0.01 }
            ]
        }
    }
}
