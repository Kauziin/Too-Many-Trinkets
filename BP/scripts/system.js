import { world, system, ItemStack } from '@minecraft/server'

// =============================================================================
// TOO MANY TRINKETS — EVENT SYSTEM
// =============================================================================
// This script handles all event-driven trinket effects.
// Design principle: MINIMIZE onTick usage.
// 
// Categories:
//   1. On-Hurt effects (player takes damage)
//   2. On-Kill effects (player kills an entity)
//   3. On-Hit effects (player attacks an entity)
//   4. Conditional tag system (every 20 ticks, synced with RPG Core)
//   5. Item-use events (ender pearl refund, food reuse)
//   6. Block-break events (auto-smelt, fortune)
//   7. Universal Attractor (item magnet — requires tick)
// =============================================================================


// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const AUTO_SMELT_MAP = {
    // Ingots
    "minecraft:raw_iron": "minecraft:iron_ingot",
    "minecraft:raw_copper": "minecraft:copper_ingot",
    "minecraft:raw_gold": "minecraft:gold_ingot",
    "minecraft:ancient_debris": "minecraft:netherite_scrap",
    "utilitycraft:titanium": "utilitycraft:titanium_ingot",
    // Blocks
    "minecraft:raw_iron_block": "minecraft:iron_block",
    "minecraft:raw_copper_block": "minecraft:copper_block",
    "minecraft:raw_gold_block": "minecraft:gold_block",
    "utilitycraft:raw_titanium_block": "utilitycraft:titanium_block",

    "minecraft:sand": "minecraft:glass",
    "minecraft:red_sand": "minecraft:glass",
    "minecraft:cobblestone": "minecraft:stone",
    "minecraft:stone": "minecraft:smooth_stone"
};

const FORTUNE_ORES = [
    "minecraft:coal_ore", "minecraft:deepslate_coal_ore",
    "minecraft:iron_ore", "minecraft:deepslate_iron_ore",
    "minecraft:copper_ore", "minecraft:deepslate_copper_ore",
    "minecraft:gold_ore", "minecraft:deepslate_gold_ore",
    "minecraft:lapis_ore", "minecraft:deepslate_lapis_ore",
    "minecraft:redstone_ore", "minecraft:deepslate_redstone_ore",
    "minecraft:lit_redstone_ore", "minecraft:lit_deepslate_redstone_ore",
    "minecraft:diamond_ore", "minecraft:deepslate_diamond_ore",
    "minecraft:emerald_ore", "minecraft:deepslate_emerald_ore",
    "minecraft:nether_gold_ore",
    "minecraft:ancient_debris",
    "utilitycraft:deepslate_titanium_ore",
    "utilitycraft:deepslate_aetherium_ore", "utilitycraft:end_aetherium_ore"
];

// Silk Touch: block → item it should drop as (itself)
const SILK_TOUCH_MAP = {
    "minecraft:coal_ore": "minecraft:coal_ore",
    "minecraft:deepslate_coal_ore": "minecraft:deepslate_coal_ore",
    "minecraft:iron_ore": "minecraft:iron_ore",
    "minecraft:deepslate_iron_ore": "minecraft:deepslate_iron_ore",
    "minecraft:copper_ore": "minecraft:copper_ore",
    "minecraft:deepslate_copper_ore": "minecraft:deepslate_copper_ore",
    "minecraft:gold_ore": "minecraft:gold_ore",
    "minecraft:deepslate_gold_ore": "minecraft:deepslate_gold_ore",
    "minecraft:lapis_ore": "minecraft:lapis_ore",
    "minecraft:deepslate_lapis_ore": "minecraft:deepslate_lapis_ore",
    "minecraft:redstone_ore": "minecraft:redstone_ore",
    "minecraft:deepslate_redstone_ore": "minecraft:deepslate_redstone_ore",
    "minecraft:diamond_ore": "minecraft:diamond_ore",
    "minecraft:deepslate_diamond_ore": "minecraft:deepslate_diamond_ore",
    "minecraft:emerald_ore": "minecraft:emerald_ore",
    "minecraft:deepslate_emerald_ore": "minecraft:deepslate_emerald_ore",
    "minecraft:nether_gold_ore": "minecraft:nether_gold_ore",
    "minecraft:stone": "minecraft:stone",
    "minecraft:grass_block": "minecraft:grass_block",
    "minecraft:glass": "minecraft:glass",
    "minecraft:ice": "minecraft:ice",
    "minecraft:packed_ice": "minecraft:packed_ice",
    "minecraft:blue_ice": "minecraft:blue_ice",
    "minecraft:glowstone": "minecraft:glowstone",
    "minecraft:sea_lantern": "minecraft:sea_lantern",
    "minecraft:melon_block": "minecraft:melon_block",
    "minecraft:bookshelf": "minecraft:bookshelf"
};

// Mob categories — shared constants for utility logic and combat filters
const MOB_CATEGORIES = {
    hostile: [
        "minecraft:zombie", "minecraft:zombie_villager", "minecraft:husk", "minecraft:drowned",
        "minecraft:skeleton", "minecraft:stray", "minecraft:wither_skeleton", "minecraft:bogged",
        "minecraft:creeper", "minecraft:spider", "minecraft:cave_spider", "minecraft:silverfish",
        "minecraft:endermite", "minecraft:slime", "minecraft:magma_cube", "minecraft:witch",
        "minecraft:pillager", "minecraft:vindicator", "minecraft:evoker", "minecraft:ravager",
        "minecraft:phantom", "minecraft:blaze", "minecraft:ghast", "minecraft:hoglin",
        "minecraft:zoglin", "minecraft:piglin_brute", "minecraft:guardian", "minecraft:elder_guardian",
        "minecraft:shulker", "minecraft:warden", "minecraft:wither", "minecraft:ender_dragon", "minecraft:breeze"
    ],
    neutral: [
        "minecraft:enderman", "minecraft:piglin", "minecraft:spider", "minecraft:wolf",
        "minecraft:llama", "minecraft:bee", "minecraft:polar_bear", "minecraft:goat",
        "minecraft:iron_golem", "minecraft:zombie_pigman", "minecraft:zombified_piglin"
    ],
    passive: [
        "minecraft:cow", "minecraft:sheep", "minecraft:pig", "minecraft:chicken",
        "minecraft:rabbit", "minecraft:mooshroom", "minecraft:goat", "minecraft:horse",
        "minecraft:donkey", "minecraft:llama", "minecraft:turtle", "minecraft:frog",
        "minecraft:camel", "minecraft:sniffer", "minecraft:armadillo", "minecraft:cat",
        "minecraft:ocelot", "minecraft:axolotl", "minecraft:villager", "minecraft:villager_v2",
        "minecraft:allay", "minecraft:snow_golem"
    ],
    inanimate: [
        "minecraft:item", "minecraft:xp_orb", "minecraft:arrow", "minecraft:spectral_arrow",
        "minecraft:trident", "minecraft:fireball", "minecraft:small_fireball", "minecraft:dragon_fireball",
        "minecraft:wind_charge", "minecraft:shulker_bullet", "minecraft:snowball", "minecraft:egg",
        "minecraft:llama_spit", "minecraft:firework_rocket", "minecraft:boat", "minecraft:chest_boat",
        "minecraft:minecart", "minecraft:tnt_minecart", "minecraft:hopper_minecart", "minecraft:chest_minecart",
        "minecraft:furnace_minecart", "minecraft:armor_stand", "minecraft:painting", "minecraft:item_frame",
        "minecraft:leash_knot", "minecraft:fishing_hook"
    ]
};

const HOSTILE_MOB_TYPES = new Set(MOB_CATEGORIES.hostile);
const NEUTRAL_MOB_TYPES = new Set(MOB_CATEGORIES.neutral);
const PASSIVE_MOB_TYPES = MOB_CATEGORIES.passive;
const PASSIVE_MOB_TYPE_SET = new Set(MOB_CATEGORIES.passive);
const INANIMATE_ENTITY_TYPES = new Set(MOB_CATEGORIES.inanimate);

const PET_GOLEM_ENTITY_ID = "dorios:pet_iron_golem";
const PET_GOLEM_TAG = "dorios:pet_golem";
const PET_GOLEM_USE_COOLDOWN_TAG = "dorios:golem_totem_cd";
const PET_GOLEM_OWNER_TAG_PREFIX = "dorios:golem_owner_";

// Track falling state per player for Earthshaker Ring
const playerFallingState = new Map();

// Track each player's latest direct-hit damage dealt (for Venomous Slash Pendant)
const lastMeleeDamageByPlayer = new Map();

// Track Bunny Hoppers air-jump usage (2 extra jumps: second + third jump)
const bunnyAirJumps = new Map();

// Track Rocket Boots air-jump usage (strong up + forward boosts)
const rocketAirJumps = new Map();

// Running Shoes — sprint momentum stacks and release burst
const runningShoesState = new Map();

// Flippers — detect water exit for surf dash
const flippersState = new Map();

// Power Glove — sneak-jump air-hit slam state
const powerGloveState = new Map();

// Scarf of Invisibility — predator opening tracker
const scarfAmbushState = new Map();

// Golden Feather — short air-step hover control
const goldenFeatherState = new Map();

// Void Quiver — micro-cooldown to avoid duplicated trigger bursts
const voidQuiverCooldown = new Set();


// ─── 1. ON-HURT EFFECTS ──────────────────────────────────────────────────────

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource, damage }) => {
    if (hurtEntity?.typeId !== 'minecraft:player') return;

    const player = hurtEntity;
    const attacker = damageSource.damagingEntity;
    const cause = damageSource.cause;

    // Panic Necklace — Speed burst when hurt
    if (player.hasTag("dorios:panic_necklace")) {
        player.addEffect('speed', 100, { amplifier: 1, showParticles: false });
    }

    // Cross Necklace — Extended i-frames (Resistance X for 1s)
    if (player.hasTag("dorios:cross_necklace")) {
        player.addEffect('resistance', 20, { amplifier: 9, showParticles: false });
    }

    // Shock Pendant — 25% chance to strike attacker with lightning
    if (player.hasTag("dorios:shock_pendant") && attacker) {
        if (Math.random() < 0.25) {
            try {
                player.dimension.spawnEntity("minecraft:lightning_bolt", attacker.location);
            } catch { }
            // Extinguish player if on fire
            system.runTimeout(() => {
                try { 
                    player.extinguishFire(); 
                    const loc = player.location;
                    player.dimension.runCommand(`execute at ${loc.x} ${loc.y} ${loc.z} run fill ~12 ~12 ~12 ~-12 ~-12 ~-12 air replace fire`);
                } catch { }
            }, 5);
        }
    }

    // Flame Pendant — 40% chance to set attacker on fire
    if (player.hasTag("dorios:flame_pendant") && attacker) {
        if (Math.random() < 0.40) {
            try { attacker.setOnFire(10); } catch { }
        }
    }

    // Thorn Pendant — Retaliation Bloom (thorn aura when hurt)
    if (player.hasTag("dorios:thorn_pendant") && damage > 0) {
        try {
            const nearby = player.dimension.getEntities({
                location: player.location,
                maxDistance: 4,
                excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"]
            });

            const thornDamage = Math.min(Math.max(damage * 0.75, 2), 10);
            for (const entity of nearby) {
                if (!entity.getComponent?.('minecraft:health')) continue;
                if (!isHostileEntity(entity)) continue;
                entity.applyDamage(thornDamage, { cause: 'thorns', damagingEntity: player });
            }

            player.dimension.playSound("mob.evocation_illager.prepare_attack", player.location, {
                volume: 0.35,
                pitch: 1.35
            });
        } catch { }
    }

    // Bunny Hoppers — Cancel fall damage
    if (player.hasTag("dorios:bunny_hoppers") && cause === 'fall') {
        // Heal back the fall damage (since afterEvents can't cancel)
        system.runTimeout(() => {
            try {
                const health = player.getComponent('minecraft:health');
                if (health) {
                    health.setCurrentValue(Math.min(
                        health.currentValue + damage,
                        health.effectiveMax
                    ));
                }
            } catch { }
        }, 1);
    }

    // Whoopee Cushion — 5% chance to play fart sound when hurt
    if (player.hasTag("dorios:whoopee_cushion")) {
        if (Math.random() < 0.05) {
            try {
                player.dimension.playSound("mob.hoglin.angry", player.location, { volume: 1.0, pitch: 1.5 });
            } catch { }
        }
    }

    // Obsidian Skull — Fire resistance cooldown on fire damage
    if (player.hasTag("dorios:obsidian_skull") && (cause === 'fire' || cause === 'fire_tick' || cause === 'lava')) {
        if (!player.hasTag("dorios:obsidian_skull_cooldown")) {
            player.addEffect('fire_resistance', 600, { amplifier: 0, showParticles: true });
            player.addTag("dorios:obsidian_skull_cooldown");
            system.runTimeout(() => {
                try { player.removeTag("dorios:obsidian_skull_cooldown"); } catch { }
            }, 1200); // 60 second cooldown
        }
    }

    // Fall Regen Ring — Regeneration on fall damage
    if (player.hasTag("dorios:fall_regen_ring") && cause === 'fall') {
        player.addEffect('regeneration', 100, { amplifier: 1, showParticles: false });
    }

    // Mirror — 40% reflect melee damage back to attacker
    if (player.hasTag("dorios:mirror") && attacker && cause === 'entityAttack') {
        if (Math.random() < 0.40) {
            try { attacker.applyDamage(damage * 0.4); } catch { }
        }
    }

    // Voodoo — 40% redirect damage to nearby non-player/non-passive entity
    if (player.hasTag("dorios:voodoo") && cause === 'entityAttack') {
        if (Math.random() < 0.40) {
            try {
                const nearby = player.dimension.getEntities({
                    location: player.location,
                    maxDistance: 8,
                    excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:passive", "minecraft:dog", "minecraft:cat", "minecraft:fox", "minecraft:bee", "minecraft:villager", "minecraft:villager_v2"]
                });
                if (nearby.length > 0) {
                    const target = nearby[Math.floor(Math.random() * nearby.length)];
                    target.applyDamage(damage * 0.4);
                }
            } catch { }
        }
    }

    // Void Totem — Save from void damage
    if (player.hasTag("dorios:void_totem") && cause === 'void') {
        if (!player.hasTag("dorios:void_totem_cooldown")) {
            player.addTag("dorios:void_totem_cooldown");
            try {
                const spawnPoint = player.getSpawnPoint();
                player.teleport({x: 40, y: 68, z: 12}, player.dimension);
                player.addEffect('resistance', 100, { amplifier: 4, showParticles: true });
                player.addEffect('slow_falling', 300, { amplifier: 0, showParticles: false });
            } catch { }
            system.runTimeout(() => {
                try { player.removeTag("dorios:void_totem_cooldown"); } catch { }
            }, 6000); // 5 min cooldown
        }
    }

    // Weight — AoE damage to nearby entities on fall damage
    if (player.hasTag("dorios:weight") && cause === 'fall') {
        try {
            const nearby = player.dimension.getEntities({
                location: player.location,
                maxDistance: 4,
                excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:passive", "minecraft:dog", "minecraft:cat", "minecraft:fox", "minecraft:bee", "minecraft:villager", "minecraft:villager_v2"]
            });
            for (const entity of nearby) {
                entity.applyDamage(Math.min(damage * 0.5, 10));
            }
        } catch { }
    }

    // Gale Ring — Negate fall damage (heal it back, like Bunny Hoppers)
    if (player.hasTag("dorios:gale_ring") && cause === 'fall') {
        system.runTimeout(() => {
            try {
                const health = player.getComponent('minecraft:health');
                if (health) {
                    health.setCurrentValue(Math.min(
                        health.currentValue + damage,
                        health.effectiveMax
                    ));
                }
            } catch { }
        }, 1);
    }

    // Ender Ring — Auto-extinguish when taking fire damage
    if (player.hasTag("dorios:ender_ring") && (cause === 'fire' || cause === 'fire_tick' || cause === 'lava')) {
        system.runTimeout(() => {
            try { player.extinguishFire(); } catch { }
        }, 1);
    }

    // Ender Ring — Chorus-fruit teleport when HP drops below 4 hearts
    if (player.hasTag("dorios:ender_ring")) {
        try {
            const hp = player.getComponent('minecraft:health');
            if (hp && hp.currentValue <= 8 && !player.hasTag("dorios:ender_ring_cooldown")) {
                player.addTag("dorios:ender_ring_cooldown");
                // Teleport randomly within 8 blocks
                const angle = Math.random() * Math.PI * 2;
                const dist = 4 + Math.random() * 4;
                const tx = player.location.x + Math.cos(angle) * dist;
                const tz = player.location.z + Math.sin(angle) * dist;
                const ty = player.location.y;
                try {
                    player.teleport({ x: tx, y: ty, z: tz });
                    player.addEffect('resistance', 40, { amplifier: 4, showParticles: true });
                    player.addEffect('speed', 60, { amplifier: 1, showParticles: false });
                    player.dimension.playSound("mob.endermen.portal", player.location, { volume: 1.0 });
                } catch { }
                system.runTimeout(() => {
                    try { player.removeTag("dorios:ender_ring_cooldown"); } catch { }
                }, 600); // 30 second cooldown
            }
        } catch { }
    }

    // Heart from the Fourth Dimension — 75% chance to reflect full received damage to nearby hostiles
    if (player.hasTag("dorios:heart_from_the_fourth_dimension") && damage > 0) {
        if (Math.random() < 0.75) {
            try {
                const nearby = player.dimension.getEntities({
                    location: player.location,
                    maxDistance: 8,
                    excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb", "minecraft:passive", "minecraft:dog", "minecraft:cat", "minecraft:fox", "minecraft:bee", "minecraft:villager", "minecraft:villager_v2"]
                });

                for (const entity of nearby) {
                    if (!entity?.getComponent?.('minecraft:health')) continue;
                    if (!isHostileEntity(entity)) continue;
                    try {
                        entity.applyDamage(damage, {
                            cause: 'thorns',
                            damagingEntity: player
                        });
                    } catch { }
                }

                try {
                    player.dimension.playSound("random.anvil_land", player.location, { volume: 0.35, pitch: 1.6 });
                } catch { }
            } catch { }
        }
    }

    // Heart from the Fourth Dimension — Death save: revive to 4 hearts
    if (player.hasTag("dorios:heart_from_the_fourth_dimension")) {
        try {
            const hp = player.getComponent('minecraft:health');
            if (hp && hp.currentValue <= 2 && !player.hasTag("dorios:heart_4d_cooldown")) {
                player.addTag("dorios:heart_4d_cooldown");
                system.runTimeout(() => {
                    try {
                        const hpInner = player.getComponent('minecraft:health');
                        if (hpInner) {
                            hpInner.setCurrentValue(Math.min(8, hpInner.effectiveMax));
                        }
                        player.addEffect('resistance', 60, { amplifier: 4, showParticles: true });
                        player.addEffect('regeneration', 100, { amplifier: 2, showParticles: true });
                        player.addEffect('absorption', 200, { amplifier: 1, showParticles: true });
                        player.dimension.playSound("random.totem", player.location, { volume: 1.0 });
                    } catch { }
                }, 1);
                system.runTimeout(() => {
                    try { player.removeTag("dorios:heart_4d_cooldown"); } catch { }
                }, 6000); // 5 minute cooldown
            }
        } catch { }
    }
});

// Track direct melee damage dealt by players (used by Venomous Slash Pendant)
world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource, damage }) => {
    const attacker = damageSource?.damagingEntity;
    if (attacker?.typeId !== 'minecraft:player') return;
    if (hurtEntity?.typeId === 'minecraft:player') return;
    if (!hurtEntity?.getComponent?.('minecraft:health')) return;

    // Ignore non-positive values and keep at least 1 to avoid zero-damage slash
    const dealt = Math.max(1, Math.floor(damage ?? 0));
    if (dealt > 0) {
        lastMeleeDamageByPlayer.set(attacker.id, dealt);
    }
});

// Void Quiver — projectile hit chains into two falling arrows over nearby enemies
world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
    const attacker = damageSource?.damagingEntity;
    const cause = damageSource?.cause;

    if (attacker?.typeId !== 'minecraft:player') return;
    if (!attacker.hasTag("dorios:void_quiver")) return;
    if (cause !== 'projectile') return;
    if (!hurtEntity?.getComponent?.('minecraft:health')) return;
    if (hurtEntity.typeId === 'minecraft:player') return;
    if (voidQuiverCooldown.has(attacker.id)) return;

    voidQuiverCooldown.add(attacker.id);
    system.runTimeout(() => {
        voidQuiverCooldown.delete(attacker.id);
    }, 2);

    try {
        const nearby = attacker.dimension.getEntities({
            location: hurtEntity.location,
            maxDistance: 5,
            excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"]
        });

        let chainedArrows = 0;
        for (const target of nearby) {
            if (chainedArrows >= 2) break;
            if (!target?.isValid) continue;
            if (target.id === hurtEntity.id) continue;
            if (!target.getComponent?.('minecraft:health')) continue;
            if (!isEnemyEntity(target)) continue;

            spawnVoidArrow(attacker, target);
            chainedArrows++;
        }

        if (chainedArrows > 0) {
            attacker.dimension.playSound("crossbow.loading_end", hurtEntity.location, {
                volume: 0.35,
                pitch: 1.35
            });
        }
    } catch { }
});

// ─── 2. ON-KILL EFFECTS ──────────────────────────────────────────────────────

world.afterEvents.entityDie.subscribe(({ damageSource, deadEntity }) => {
    const player = damageSource.damagingEntity;
    if (player?.typeId !== 'minecraft:player') return;

    // Superstitious Hat — 33% chance per dropped item to duplicate
    if (player.hasTag("dorios:superstitious_hat")) {
        system.runTimeout(() => {
            try {
                const items = deadEntity.dimension.getEntities({
                    location: deadEntity.location,
                    maxDistance: 3,
                    type: "minecraft:item"
                });
                for (const itemEntity of items) {
                    if (Math.random() < 0.33) {
                        const itemStack = itemEntity.getComponent("minecraft:item")?.itemStack;
                        if (itemStack) {
                            deadEntity.dimension.spawnItem(itemStack, itemEntity.location);
                        }
                    }
                }
            } catch { }
        }, 5);
    }

    // Golden Hook — Spawn XP orbs based on mob's max health
    if (player.hasTag("dorios:golden_hook")) {
        try {
            const maxHealth = deadEntity.getComponent('minecraft:health')?.effectiveMax ?? 20;
            const orbCount = Math.min(Math.floor(maxHealth / 5), 30);
            for (let i = 0; i < orbCount; i++) {
                player.runCommand(`summon xp_orb ~ ~ ~`);
            }
        } catch { }
    }

    // Berserk Ring — Stacking Strength on kill (max amp 5, 5s)
    if (player.hasTag("dorios:berserk_ring")) {
        try {
            const current = player.getEffect('strength');
            const newAmp = Math.min((current?.amplifier ?? -1) + 1, 4);
            player.addEffect('strength', 100, { amplifier: newAmp, showParticles: false });
        } catch { }
    }

    // Dice — 25% chance per dropped item to duplicate
    if (player.hasTag("dorios:dice")) {
        system.runTimeout(() => {
            try {
                const items = deadEntity.dimension.getEntities({
                    location: deadEntity.location,
                    maxDistance: 3,
                    type: "minecraft:item"
                });
                for (const itemEntity of items) {
                    if (Math.random() < 0.25) {
                        const itemStack = itemEntity.getComponent("minecraft:item")?.itemStack;
                        if (itemStack) {
                            deadEntity.dimension.spawnItem(itemStack, itemEntity.location);
                        }
                    }
                }
            } catch { }
        }, 5);
    }

    // Pirate Hat — 20% chance per dropped item to duplicate
    if (player.hasTag("dorios:pirate_hat")) {
        system.runTimeout(() => {
            try {
                const items = deadEntity.dimension.getEntities({
                    location: deadEntity.location,
                    maxDistance: 3,
                    type: "minecraft:item"
                });
                for (const itemEntity of items) {
                    if (Math.random() < 0.20) {
                        const itemStack = itemEntity.getComponent("minecraft:item")?.itemStack;
                        if (itemStack) {
                            deadEntity.dimension.spawnItem(itemStack, itemEntity.location);
                        }
                    }
                }
            } catch { }
        }, 5);
    }

    // Necromancer Charm — 60% summon skeleton ally on kill
    if (player.hasTag("dorios:necromancer_charm")) {
        if (Math.random() < 0.60) {
            try {
                const skeleton = player.dimension.spawnEntity("minecraft:skeleton", deadEntity.location);
                skeleton.nameTag = "§5Undead Ally";
                skeleton.addEffect('strength', 600, { amplifier: 0, showParticles: false });
            } catch { }
        }
    }

    // Shepherd's Ring — Double drops when killing passive animals
    if (player.hasTag("dorios:shepherds_ring") && PASSIVE_MOB_TYPES.includes(deadEntity.typeId)) {
        system.runTimeout(() => {
            try {
                const items = deadEntity.dimension.getEntities({
                    location: deadEntity.location,
                    maxDistance: 3,
                    type: "minecraft:item"
                });
                for (const itemEntity of items) {
                    const itemStack = itemEntity.getComponent("minecraft:item")?.itemStack;
                    if (itemStack) {
                        deadEntity.dimension.spawnItem(itemStack, itemEntity.location);
                    }
                }
            } catch { }
        }, 5);
    }
});


// ─── 3. ON-HIT EFFECTS (Player attacks) ──────────────────────────────────────
// Note: Most on-hit effects are handled by RPG Core's stats system
// (fireAspect, knockback, lifeSteal, actives like wither).
// Only special mechanics that don't map to stats go here.

world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
    if (damagingEntity?.typeId !== 'minecraft:player') return;
    const player = damagingEntity;
    const target = hitEntity;

    // Venomous Slash Pendant — AoE slash: extra damage = previous hit damage + Fatal Poison II (3s)
    if (player.hasTag("dorios:venomous_slash_pendant") && !player.hasTag("dorios:venomous_slash_pendant_cd")) {
        try {
            player.addTag("dorios:venomous_slash_pendant_cd");
            system.runTimeout(() => {
                try { player.removeTag("dorios:venomous_slash_pendant_cd"); } catch { }
            }, 4);

            const previousHitDamage = Math.max(1, Math.min(lastMeleeDamageByPlayer.get(player.id) ?? 1, 20));
            const slashTargets = player.dimension.getEntities({
                location: target.location,
                maxDistance: 3,
                excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb", "minecraft:passive", "minecraft:dog", "minecraft:cat", "minecraft:fox", "minecraft:bee", "minecraft:villager", "minecraft:villager_v2"]
            });

            for (const entity of slashTargets) {
                if (!entity.getComponent('minecraft:health')) continue;

                try { player.runCommand(`damage @e[type=${entity.typeId},r=..3] ${previousHitDamage} entity_attack entity @p`); } catch { }
                try {
                    entity.addEffect('fatal_poison', 60, { amplifier: 1, showParticles: true });
                } catch { }
            }

            try {
                player.dimension.playSound("mob.evocation_illager.cast_spell", target.location, { volume: 0.6, pitch: 1.1 });
            } catch { }
        } catch { }
    }

    // Holy Dagger — Extra 2-6 damage to undead
    if (player.hasTag("dorios:holy_dagger")) {
        try {
            const id = target.typeId;
            if (id.includes('zombie') || id.includes('skeleton') || id.includes('phantom') ||
                id.includes('drowned') || id === 'minecraft:wither' || id.includes('husk') ||
                id.includes('stray') || id.includes('zoglin')) {
                const bonusDamage = 2 + Math.floor(Math.random() * 5);
                target.applyDamage(bonusDamage);
            }
        } catch { }
    }

    // Feral Claws — 15% chance to apply bleeding (1 dmg/sec for 3 sec)
    if (player.hasTag("dorios:feral_claws")) {
        if (Math.random() < 0.15) {
            try {
                let bleedTicks = 0;
                const bleedInterval = system.runInterval(() => {
                    try {
                        if (!target.isValid || bleedTicks >= 3) {
                            system.clearRun(bleedInterval);
                            return;
                        }
                        target.applyDamage(1);
                        bleedTicks++;
                    } catch { system.clearRun(bleedInterval); }
                }, 20);
            } catch { }
        }
    }

    // Golden Horn — Apply Weakness to Illagers
    if (player.hasTag("dorios:golden_horn")) {
        try {
            const id = target.typeId;
            if (id.includes('pillager') || id.includes('vindicator') || id.includes('evoker') ||
                id.includes('ravager') || id.includes('vex') || id.includes('witch')) {
                target.addEffect('weakness', 200, { amplifier: 1, showParticles: true });
            }
        } catch { }
    }

    // Guardian Fin — Undertow Pull while underwater
    if (player.hasTag("dorios:guardian_fin") && player.isInWater) {
        try {
            if (target.getComponent('minecraft:health')) {
                const dx = player.location.x - target.location.x;
                const dz = player.location.z - target.location.z;
                const dist = Math.sqrt(dx * dx + dz * dz) || 1;

                target.applyImpulse({
                    x: (dx / dist) * 0.55,
                    y: 0.06,
                    z: (dz / dist) * 0.55
                });
                target.addEffect('slowness', 30, { amplifier: 0, showParticles: false });
            }
        } catch { }
    }

    // Vampiric Glove — Overheal Window (turn spill lifesteal into absorption)
    if (player.hasTag("dorios:vampiric_glove") && !player.hasTag("dorios:vampiric_glove_overheal_cd")) {
        try {
            const hp = player.getComponent('minecraft:health');
            if (hp && hp.currentValue >= hp.effectiveMax - 0.5 && Math.random() < 0.35) {
                player.addTag("dorios:vampiric_glove_overheal_cd");
                player.addEffect('absorption', 80, { amplifier: 0, showParticles: false });
                system.runTimeout(() => {
                    try { player.removeTag("dorios:vampiric_glove_overheal_cd"); } catch { }
                }, 80);
            }
        } catch { }
    }

    // Scarf of Invisibility — Predator Opening (first strike after hidden buildup)
    if (player.hasTag("dorios:scarf_of_invisibility") && !player.hasTag("dorios:scarf_predator_cd")) {
        try {
            const ambush = scarfAmbushState.get(player.id);
            if (ambush?.predatorReady && target.getComponent('minecraft:health')) {
                target.applyDamage(6, { cause: 'entityAttack', damagingEntity: player });
                target.addEffect('weakness', 40, { amplifier: 0, showParticles: false });

                ambush.predatorReady = false;
                ambush.invisTicks = 0;
                scarfAmbushState.set(player.id, ambush);

                player.addTag("dorios:scarf_predator_cd");
                system.runTimeout(() => {
                    try { player.removeTag("dorios:scarf_predator_cd"); } catch { }
                }, 60);

                player.dimension.playSound("random.orb", player.location, { volume: 0.5, pitch: 1.4 });
            }
        } catch { }
    }

    // Power Glove — Sneak-jump + aerial hit arms a landing slam
    if (player.hasTag("dorios:power_glove")) {
        try {
            const state = powerGloveState.get(player.id);
            if (state?.armedTicks > 0 && !player.isOnGround) {
                state.slamReady = true;
                state.armedTicks = Math.max(state.armedTicks, 25);
                powerGloveState.set(player.id, state);
            }
        } catch { }
    }
});


// ─── 4. CONDITIONAL TAG SYSTEM ───────────────────────────────────────────────
// Runs every 20 ticks (synced with RPG Core's equipment check interval)
// This is the ONLY runInterval in this addon.

const TICK_FREQ = 1;
let tickCount = 0;

world.afterEvents.worldLoad.subscribe(() => {
    system.runInterval(() => {
        const players = world.getAllPlayers();
        tickCount += TICK_FREQ;
        if (tickCount >= 1000) tickCount = 0;

        for (const player of players) {
            // --- Universal Attractor (every tick, 12-block range, items + XP) ---
            if (player.hasTag("dorios:universal_attractor")) {
                attractItems(player, 12, 0.35);
            }

            // --- Magnetic Ring — Item magnet (every tick, 8-block range) ---
            if (player.hasTag("dorios:magnetic_ring")) {
                attractItems(player, 8, 0.04);
            }

            // --- Running Shoes — Momentum (every 2 ticks) ---
            if (!player.hasTag("dorios:running_shoes")) {
                runningShoesState.delete(player.id);
            } else if (tickCount % 2 === 0) {
                try {
                    const state = runningShoesState.get(player.id) ?? { stacks: 0, wasSprinting: false };

                    if (player.isSprinting && player.isOnGround) {
                        state.stacks = Math.min(state.stacks + 1, 20);
                        if (state.stacks >= 8) {
                            player.addEffect('speed', 12, { amplifier: 0, showParticles: false });
                        }
                        if (state.stacks >= 15) {
                            player.addEffect('speed', 12, { amplifier: 1, showParticles: false });
                        }
                    } else if (state.wasSprinting && state.stacks >= 8) {
                        const view = player.getViewDirection();
                        const burst = Math.min(0.25 + state.stacks * 0.02, 0.65);
                        player.applyImpulse({ x: view.x * burst, y: 0.16, z: view.z * burst });
                        player.addEffect('jump_boost', 24 + state.stacks * 2, { amplifier: 0, showParticles: false });
                        state.stacks = 0;
                    } else if (!player.isSprinting && state.stacks > 0) {
                        state.stacks = Math.max(0, state.stacks - 2);
                    }

                    state.wasSprinting = player.isSprinting;
                    runningShoesState.set(player.id, state);
                } catch { }
            }

            // --- Flippers — Surf Dash on water exit (every 2 ticks) ---
            if (!player.hasTag("dorios:flippers")) {
                flippersState.delete(player.id);
            } else if (tickCount % 2 === 0) {
                try {
                    const state = flippersState.get(player.id) ?? { wasInWater: false, cooldown: 0 };
                    if (state.cooldown > 0) state.cooldown--;

                    const justLeftWater = state.wasInWater && !player.isInWater;
                    if (justLeftWater && player.isSprinting && state.cooldown === 0) {
                        const view = player.getViewDirection();
                        player.applyImpulse({ x: view.x * 1.05, y: 0.14, z: view.z * 1.05 });
                        player.addEffect('speed', 30, { amplifier: 1, showParticles: false });
                        state.cooldown = 35;
                    }

                    state.wasInWater = player.isInWater;
                    flippersState.set(player.id, state);
                } catch { }
            }

            // --- Golden Feather — short hover while holding jump mid-air (every 2 ticks) ---
            if (!player.hasTag("dorios:golden_feather")) {
                goldenFeatherState.delete(player.id);
            } else if (tickCount % 2 === 0) {
                try {
                    const state = goldenFeatherState.get(player.id) ?? { holding: false, fuel: 14, cooldown: 0 };

                    if (player.isOnGround) {
                        state.fuel = 14;
                        state.holding = false;
                    }

                    if (state.cooldown > 0) state.cooldown--;

                    if (!player.isOnGround && state.holding && state.fuel > 0 && state.cooldown === 0) {
                        const vel = player.getVelocity();
                        if (vel.y < 0.15) {
                            player.applyImpulse({ x: 0, y: 0.065, z: 0 });
                        }
                        player.addEffect('slow_falling', 6, { amplifier: 0, showParticles: false });
                        state.fuel--;
                        if (state.fuel <= 0) {
                            state.holding = false;
                            state.cooldown = 20;
                        }
                    }

                    goldenFeatherState.set(player.id, state);
                } catch { }
            }

            // --- Power Glove — landing slam resolution (every 2 ticks) ---
            if (!player.hasTag("dorios:power_glove")) {
                powerGloveState.delete(player.id);
            } else if (tickCount % 2 === 0) {
                try {
                    const state = powerGloveState.get(player.id);
                    if (!state) {
                        // nothing to do
                    } else {
                        if (state.armedTicks > 0) state.armedTicks--;

                        if (state.slamReady && player.isOnGround) {
                            const nearby = player.dimension.getEntities({
                                location: player.location,
                                maxDistance: 4,
                                excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"]
                            });

                            for (const entity of nearby) {
                                if (!entity.getComponent?.('minecraft:health')) continue;
                                if (!isHostileEntity(entity)) continue;

                                const dx = entity.location.x - player.location.x;
                                const dz = entity.location.z - player.location.z;
                                const dist = Math.sqrt(dx * dx + dz * dz) || 1;

                                entity.applyDamage(6, { cause: 'entityAttack', damagingEntity: player });
                                entity.applyImpulse({
                                    x: (dx / dist) * 1.15,
                                    y: 0.35,
                                    z: (dz / dist) * 1.15
                                });
                            }

                            player.dimension.playSound("mob.ravager.stun", player.location, {
                                volume: 0.85,
                                pitch: 0.9
                            });

                            state.slamReady = false;
                            state.armedTicks = 0;
                        }

                        if (state.armedTicks <= 0 && !state.slamReady) {
                            powerGloveState.delete(player.id);
                        } else {
                            powerGloveState.set(player.id, state);
                        }
                    }
                } catch { }
            }

            // --- Heart from the Fourth Dimension — stop and launch nearby projectiles (4-block aura) ---
            if (player.hasTag("dorios:heart_from_the_fourth_dimension")) {
                try {
                    const nearbyEntities = player.dimension.getEntities({
                        location: player.location,
                        maxDistance: 6.5,
                        excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"]
                    });

                    for (const entity of nearbyEntities) {
                        if (!isProjectileEntity(entity)) continue;
                        try { entity.clearVelocity(); } catch { }
                        try { entity.applyImpulse({ x: 0, y: 255, z: 0 }); } catch { }
                    }
                } catch { }
            }

            // --- Bunny Hoppers — lightweight airborne handling (no expensive raytrace loop) ---
            if (!player.hasTag("dorios:bunny_hoppers")) {
                bunnyAirJumps.delete(player.id);
            } else if (tickCount % 2 === 0) {
                try {
                    if (player.isOnGround) {
                        bunnyAirJumps.set(player.id, 0);
                    } else {
                        // Keep brief slow_falling while airborne for softer landings
                        player.addEffect('slow_falling', 6, { amplifier: 0, showParticles: false });
                    }
                } catch { }
            }

            // --- Rocket Boots — airborne tracking (every 2 ticks) ---
            if (!player.hasTag("dorios:rocket_boots")) {
                rocketAirJumps.delete(player.id);
            } else if (tickCount % 2 === 0) {
                try {
                    if (player.isOnGround && !player.isSneaking) {
                        rocketAirJumps.set(player.id, 0);
                    }
                } catch { }
            }

            // --- Strider Shoes — lava walking + speed (every 1 ticks) ---
            if (player.hasTag("dorios:strider_shoes")) {
                try {
                    const feetBlock = player.dimension.getBlock(player.location);
                    const belowFeet = player.dimension.getBlock({
                        x: Math.floor(player.location.x),
                        y: Math.floor(player.location.y) - 0.6,
                        z: Math.floor(player.location.z)
                    });

                    const feetInLava = feetBlock?.typeId?.includes("lava") ?? false;
                    const aboveLava = belowFeet?.typeId?.includes("lava") ?? false;

                    if (feetInLava) {
                        // Float on lava surface: slow descent + upward push
                        player.addEffect('slow_falling', 4, { amplifier: 0, showParticles: false });
                        const vel = player.getVelocity();
                        if (vel.y < 0) {
                            player.applyImpulse({ x: 0.0, y: 0.225, z: 0.0 });
                        }
                        player.addEffect('speed', 6, { amplifier: 2, showParticles: false });
                    } else if (aboveLava) {
                        // Walking on lava surface — extra speed burst
                        player.addEffect('speed', 6, { amplifier: 4, showParticles: false });
                    }
                } catch { }
            }

            // Shadow Sneak Ring — Invisibility + Speed when sneaking
            if (player.hasTag("dorios:shadow_sneak_ring")) {
                if (player.isSneaking) {
                    player.addEffect('invisibility', 4, { amplifier: 0, showParticles: false });
                } else {
                    player.removeEffect('invisibility');
                }
            }

            // --- Cowboy Hat: Speed II to mount (every 5 ticks) ---
            if (tickCount % 5 === 0) {
                // Golem Totem — pet golem follow/protect/scare behavior
                try {
                    const petGolems = player.dimension.getEntities({
                        location: player.location,
                        maxDistance: 72,
                        type: PET_GOLEM_ENTITY_ID
                    });

                    for (const golem of petGolems) {
                        if (!isPetGolemOwnedBy(golem, player)) continue;
                        maintainPetGolem(player, golem);
                    }
                } catch { }

                if (player.hasTag("dorios:cowboy_hat")) {
                    try {
                        const riding = player.getComponent('minecraft:riding');
                        if (riding) {
                            const riddenEntities = player.dimension.getEntities({
                                location: player.location,
                                maxDistance: 2,
                                excludeTypes: ["minecraft:player", "minecraft:item"]
                            });
                            for (const mount of riddenEntities) {
                                mount.addEffect('speed', 40, { amplifier: 1, showParticles: false });
                            }
                        }
                    } catch { }
                }

                // Life Buoy — Float up when sneaking underwater
                if (player.hasTag("dorios:life_buoy")) {
                    try {
                        const headBlock = player.dimension.getBlock(player.getHeadLocation());
                        if (headBlock?.typeId === 'minecraft:water' && player.isSneaking) {
                            player.applyKnockback({ x: 0, z: 0 }, 0, 0.35);
                        }
                    } catch { }
                }

                // Sprint Ring — Speed II + Strength I while sprinting
                if (player.hasTag("dorios:sprint_ring")) {
                    try {
                        if (player.isSprinting) {
                            player.addEffect('speed', 40, { amplifier: 1, showParticles: false });
                            player.addEffect('strength', 40, { amplifier: 0, showParticles: false });
                        }
                    } catch { }
                }

                // Deep Sea Ring — Pressure Shield (stronger with depth)
                if (player.hasTag("dorios:deep_sea_ring")) {
                    try {
                        if (player.isInWater) {
                            const y = player.location.y;
                            let amplifier = -1;

                            if (y <= 16) amplifier = 2;      // Resistance III
                            else if (y <= 32) amplifier = 1; // Resistance II
                            else if (y <= 48) amplifier = 0; // Resistance I

                            if (amplifier >= 0) {
                                player.addEffect('resistance', 30, { amplifier, showParticles: false });
                            }
                        }
                    } catch { }
                }

                // Heroic Ring — Rally Aura (players + villagers + golems)
                if (player.hasTag("dorios:heroic_ring")) {
                    try {
                        const allies = player.dimension.getEntities({
                            location: player.location,
                            maxDistance: 8,
                            excludeTypes: ["minecraft:item", "minecraft:xp_orb"]
                        });

                        for (const ally of allies) {
                            if (ally.typeId === "minecraft:player") {
                                ally.addEffect('strength', 40, { amplifier: 0, showParticles: false });
                                ally.addEffect('resistance', 40, { amplifier: 0, showParticles: false });
                                continue;
                            }

                            if (isVillagerOrGolem(ally)) {
                                ally.addEffect('strength', 40, { amplifier: 0, showParticles: false });
                                ally.addEffect('resistance', 40, { amplifier: 0, showParticles: false });
                                ally.addEffect('regeneration', 40, { amplifier: 0, showParticles: false });
                                ally.addEffect('speed', 40, { amplifier: 1, showParticles: false }); // Speed II
                            }
                        }
                    } catch { }
                }

                // Scarf of Invisibility — build predator opening while hidden
                if (player.hasTag("dorios:scarf_of_invisibility")) {
                    try {
                        const state = scarfAmbushState.get(player.id) ?? { invisTicks: 0, predatorReady: false };
                        if (player.getEffect('invisibility')) {
                            state.invisTicks = Math.min(state.invisTicks + 5, 200);
                            if (state.invisTicks >= 40) {
                                state.predatorReady = true;
                            }
                        } else {
                            state.invisTicks = 0;
                            state.predatorReady = false;
                        }
                        scarfAmbushState.set(player.id, state);
                    } catch { }
                } else {
                    scarfAmbushState.delete(player.id);
                }

                // Gravity Ring — Pull nearby hostile mobs toward the player
                if (player.hasTag("dorios:gravity_ring")) {
                    try {
                        const nearby = player.dimension.getEntities({
                            location: player.location,
                            maxDistance: 6,
                            excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb",
                                "minecraft:villager", "minecraft:villager_v2", "minecraft:dog",
                                "minecraft:cat", "minecraft:fox", "minecraft:bee"]
                        });
                        for (const entity of nearby) {
                            if (!entity.getComponent('minecraft:health')) continue;
                            const dx = player.location.x - entity.location.x;
                            const dy = player.location.y - entity.location.y;
                            const dz = player.location.z - entity.location.z;
                            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                            if (dist < 1) continue;
                            const pullStrength = 0.25;
                            entity.applyImpulse({
                                x: (dx / dist) * pullStrength,
                                y: (dy / dist) * pullStrength * 0.5,
                                z: (dz / dist) * pullStrength
                            });
                        }
                    } catch { }
                }

                // Earthshaker Ring — Track falling state for AoE stomp on landing
                if (player.hasTag("dorios:earthshaker_ring")) {
                    try {
                        const velocity = player.getVelocity();
                        const wasAirborne = playerFallingState.get(player.id) || false;
                        const isAirborne = !player.isOnGround && velocity.y < -0.3;

                        if (isAirborne) {
                            playerFallingState.set(player.id, true);
                        } else if (wasAirborne && player.isOnGround) {
                            playerFallingState.set(player.id, false);
                            // AoE stomp!
                            const fallSpeed = Math.abs(velocity.y);
                            const stompDamage = Math.min(Math.floor(fallSpeed * 8), 12);
                            if (stompDamage >= 2) {
                                const nearby = player.dimension.getEntities({
                                    location: player.location,
                                    maxDistance: 5,
                                    excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"]
                                });
                                for (const entity of nearby) {
                                    if (!entity.getComponent('minecraft:health')) continue;
                                    entity.applyDamage(stompDamage);
                                    // Push entities outward
                                    const dx = entity.location.x - player.location.x;
                                    const dz = entity.location.z - player.location.z;
                                    const eDist = Math.sqrt(dx * dx + dz * dz) || 1;
                                    entity.applyImpulse({
                                        x: (dx / eDist) * 0.8,
                                        y: 0.4,
                                        z: (dz / eDist) * 0.8
                                    });
                                }
                                player.dimension.playSound("mob.ravager.stun", player.location, { volume: 0.8, pitch: 0.7 });
                            }
                        }
                    } catch { }
                }

                // Rooted Boots — Nature boost or nature withdrawal
                if (player.hasTag("dorios:rooted_boots")) {
                    try {
                        const blockBelow = player.dimension.getBlock({
                            x: Math.floor(player.location.x),
                            y: Math.floor(player.location.y) - 1,
                            z: Math.floor(player.location.z)
                        });
                        if (isNatureBlock(blockBelow)) {
                            // On nature: speed II + regen 3 + manual heal
                            player.addEffect('speed', 12, { amplifier: 1, showParticles: false });
                            player.addEffect('regeneration', 12, { amplifier: 2, showParticles: false });
                            const health = player.getComponent('minecraft:health');
                            if (health && health.currentValue < health.effectiveMax) {
                                health.setCurrentValue(Math.min(health.currentValue + 0.5, health.effectiveMax));
                            }
                            try { player.removeEffect('slowness'); } catch { }
                        } else {
                            // Off nature: slowness I + regen 1 + scare creepers (ocelot family)
                            player.addEffect('slowness', 12, { amplifier: 0, showParticles: false });
                            player.addEffect('regeneration', 12, { amplifier: 0, showParticles: false });
                            scareCreepers(player);
                        }
                    } catch { }
                }

                // Aqua Dashers — Magma block protection
                if (player.hasTag("dorios:aqua_dashers")) {
                    try {
                        const blockBelow = player.dimension.getBlock({
                            x: Math.floor(player.location.x),
                            y: Math.floor(player.location.y) - 1,
                            z: Math.floor(player.location.z)
                        });
                        if (blockBelow?.typeId?.includes('magma')) {
                            player.addEffect('fire_resistance', 12, { amplifier: 0, showParticles: false });
                        }
                    } catch { }
                }
            }

            // --- Every 10 ticks ---
            if (tickCount % 10 === 0) {
                // Monocle — Show looked-at mob health on action bar
                if (player.hasTag("dorios:monocle")) {
                    try {
                        getComponent(player, 'minecraft:lookingAt')?.lookedAtEntity?.getComponent('minecraft:health')?.currentValue;
                    } catch { }
                }

                // Frost Ring — AoE Slowness I aura to nearby enemies
                if (player.hasTag("dorios:frost_ring")) {
                    try {
                        const nearby = player.dimension.getEntities({
                            location: player.location,
                            maxDistance: 5,
                            excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb",
                                "minecraft:villager", "minecraft:villager_v2", "minecraft:dog",
                                "minecraft:cat", "minecraft:fox", "minecraft:bee"]
                        });
                        for (const entity of nearby) {
                            if (!entity.getComponent('minecraft:health')) continue;
                            entity.addEffect('slowness', 30, { amplifier: 0, showParticles: false });
                        }
                    } catch { }
                }
            }

            // --- Every 20 ticks: conditional tags ---
            if (tickCount % 20 !== 0) continue;

            // Obsidian Skull — Fire resistance when NOT in lava
            if (player.hasTag("dorios:obsidian_skull")) {
                try {
                    const feetBlock = player.dimension.getBlock(player.location);
                    const headBlock = player.dimension.getBlock(player.getHeadLocation());
                    const inLava = (feetBlock?.typeId?.includes('lava') && headBlock?.typeId?.includes('lava'));

                    if (inLava) {
                        player.removeTag("dorios:obsidian_skull_tag");
                    } else {
                        player.addTag("dorios:obsidian_skull_tag");
                    }
                } catch {
                    player.addTag("dorios:obsidian_skull_tag");
                }
            } else {
                player.removeTag("dorios:obsidian_skull_tag");
            }

            // Kitty Slippers — Scare creepers away
            if (player.hasTag("dorios:kitty_slippers")) {
                scareCreepers(player);
            }

            // Feline Protection Ring — Scare creepers (same as kitty slippers)
            if (player.hasTag("dorios:feline_protection_ring")) {
                scareCreepers(player);
            }

            // Conduit Necklace — Conduit Power when underwater
            if (player.hasTag("dorios:conduit_necklace")) {
                try {
                    const headBlock = player.dimension.getBlock(player.getHeadLocation());
                    if (headBlock?.typeId === 'minecraft:water') {
                        player.addTag("dorios:conduit_necklace_tag");
                    } else {
                        player.removeTag("dorios:conduit_necklace_tag");
                    }
                } catch {
                    player.removeTag("dorios:conduit_necklace_tag");
                }
            } else {
                player.removeTag("dorios:conduit_necklace_tag");
            }

            // Divine Protection Ring — Resistance when HP < 8 (4 hearts)
            if (player.hasTag("dorios:devine_protection_ring")) {
                try {
                    const hp = player.getComponent('minecraft:health');
                    if (hp && hp.currentValue < 8) {
                        player.addTag("dorios:devine_protection_ring_tag");
                    } else {
                        player.removeTag("dorios:devine_protection_ring_tag");
                    }
                } catch {
                    player.removeTag("dorios:devine_protection_ring_tag");
                }
            } else {
                player.removeTag("dorios:devine_protection_ring_tag");
            }           

            // Void Star — Calm nearby endermen
            if (player.hasTag("dorios:void_star")) {
                try {
                    const endermen = player.dimension.getEntities({
                        location: player.location,
                        maxDistance: 8,
                        type: "minecraft:enderman"
                    });
                    for (const enderman of endermen) {
                        enderman.addEffect('weakness', 40, { amplifier: 9, showParticles: false });
                        enderman.addEffect('slowness', 40, { amplifier: 2, showParticles: false });
                    }
                } catch { }
            }

            // Holy Necklace — Fire nearby undead every 20 ticks
            if (player.hasTag("dorios:holy_necklace")) {
                try {
                    const undead = player.dimension.getEntities({
                        location: player.location,
                        maxDistance: 8,
                        excludeTypes: ["minecraft:player", "minecraft:item"]
                    });
                    for (const entity of undead) {
                        const id = entity.typeId;
                        if (id.includes('zombie') || id.includes('skeleton') || id.includes('phantom') ||
                            id.includes('drowned') || id.includes('husk') || id.includes('stray') ||
                            id.includes('zoglin') || id === 'minecraft:wither') {
                            entity.setOnFire(5);
                        }
                    }
                } catch { }
            }

            // Holy Grail — Heal HP at cost of XP every 20 ticks
            if (player.hasTag("dorios:holy_grail")) {
                try {
                    const hp = player.getComponent('minecraft:health');
                    if (hp && hp.currentValue < hp.effectiveMax && player.level > 0) {
                        hp.setCurrentValue(Math.min(hp.currentValue + 1, hp.effectiveMax));
                        player.addLevels(-1);
                    }
                } catch { }
            }

            // Tidal Ring — Conduit Power when underwater (conditional tag)
            if (player.hasTag("dorios:tidal_ring")) {
                try {
                    if (player.isInWater) {
                        player.addTag("dorios:tidal_ring_tag");
                    } else {
                        player.removeTag("dorios:tidal_ring_tag");
                    }
                } catch {
                    player.removeTag("dorios:tidal_ring_tag");
                }
            } else {
                player.removeTag("dorios:tidal_ring_tag");
            }

            // Umbrella — Resistance I during rain (weather protection)
            if (player.hasTag("dorios:umbrella")) {
                try {
                    // Check if it's raining and player is exposed to sky
                    if (player.dimension.id === 'minecraft:overworld') {
                        const headLoc = player.getHeadLocation();
                        const block = player.dimension.getBlock({ x: Math.floor(headLoc.x), y: Math.floor(headLoc.y) + 1, z: Math.floor(headLoc.z) });
                        // Simple sky exposure check: block above head is air
                        if (block?.typeId === 'minecraft:air') {
                            player.addEffect('resistance', 40, { amplifier: 0, showParticles: false });
                        }
                    }
                } catch { }
            }
        }
    }, TICK_FREQ);
});


// ─── 5. ITEM-USE EVENTS ──────────────────────────────────────────────────────

world.afterEvents.itemUse.subscribe(e => {
    const player = e.source;
    const item = e.itemStack;

    // Golem Totem — summon custom pet iron golem follower
    if (item?.typeId === 'dorios:golem_totem') {
        if (player.hasTag(PET_GOLEM_USE_COOLDOWN_TAG)) return;

        try {
            player.addTag(PET_GOLEM_USE_COOLDOWN_TAG);
            system.runTimeout(() => {
                try { player.removeTag(PET_GOLEM_USE_COOLDOWN_TAG); } catch { }
            }, 8);

            summonPetGolem(player);
            consumeHeldItem(player, 'dorios:golem_totem', 1);
        } catch { }
        return;
    }

    // Warp Drive — Prevent ender pearl consumption (refund)
    if (player.hasTag("dorios:warp_drive") && item?.typeId === 'minecraft:ender_pearl') {
        system.runTimeout(() => {
            try {
                const inv = player.getComponent('inventory')?.container;
                if (inv) {
                    inv.addItem(new ItemStack("minecraft:ender_pearl", 1));
                }
            } catch { }
        }, 3);
    }
});

// Pet Iron Golem interactions — stronger repair and iron-block absorption charge
try {
    world.afterEvents.playerInteractWithEntity.subscribe(e => {
        const player = e.player;
        const target = e.target;

        if (target?.typeId !== PET_GOLEM_ENTITY_ID) return;
        if (!isPetGolemOwnedBy(target, player)) return;

        const held = getHeldItem(player);
        if (!held) return;

        // Iron ingot: bonus repair (on top of entity interaction repair)
        if (held.typeId === 'minecraft:iron_ingot') {
            healEntity(target, 20);
            try {
                target.addEffect('regeneration', 60, { amplifier: 1, showParticles: true });
                target.dimension.playSound("irongolem.repair", target.location, { volume: 1.0, pitch: 1.1 });
            } catch { }
            return;
        }

        // Iron block: consume block + full-max-health equivalent absorption
        if (held.typeId === 'minecraft:iron_block') {
            const consumed = consumeHeldItem(player, 'minecraft:iron_block', 1);
            if (!consumed) return;

            healEntity(target, 80);

            const hp = target.getComponent('minecraft:health');
            const maxHealth = hp?.effectiveMax ?? 100;
            const absorptionLevels = Math.max(1, Math.ceil(maxHealth / 4));
            const amplifier = Math.min(255, absorptionLevels - 1);

            try {
                target.addEffect('absorption', 20 * 60 * 8, { amplifier, showParticles: true });
                target.addEffect('regeneration', 20 * 20, { amplifier: 2, showParticles: true });
                target.addEffect('resistance', 20 * 8, { amplifier: 1, showParticles: true });
                target.dimension.playSound("beacon.power", target.location, { volume: 0.75, pitch: 0.85 });
            } catch { }
        }
    });
} catch {
    // playerInteractWithEntity may not be available on all versions
}

// Eternal Steak & Everlasting Beef — Return item after eating
world.afterEvents.itemCompleteUse.subscribe(e => {
    const player = e.source;
    const item = e.itemStack;

    if (item?.typeId === 'dorios:eternal_steak' || item?.typeId === 'dorios:everlasting_beef') {
        system.runTimeout(() => {
            try {
                const inv = player.getComponent('inventory')?.container;
                if (inv) {
                    inv.addItem(new ItemStack(item.typeId, 1));
                }
            } catch { }
        }, 1);
    }

    // Onion Ring — Haste II for 15s after eating food
    if (player.hasTag("dorios:onion_ring")) {
        try {
            player.addEffect('haste', 300, { amplifier: 1, showParticles: false });
        } catch { }
    }
});


// ─── 6. BLOCK-BREAK EVENTS ───────────────────────────────────────────────────

world.afterEvents.playerBreakBlock.subscribe(e => {
    const player = e.player;
    const block = e.brokenBlockPermutation;
    const blockTypeId = block.type.id;

    // Pickaxe Heater — Auto-smelt ores
    if (player.hasTag("dorios:pickaxe_heater")) {
        system.runTimeout(() => {
            try {
                const items = player.dimension.getEntities({
                    location: e.block.location,
                    maxDistance: 2,
                    type: "minecraft:item"
                });
                for (const itemEntity of items) {
                    const stack = itemEntity.getComponent("minecraft:item")?.itemStack;
                    if (stack && AUTO_SMELT_MAP[stack.typeId]) {
                        const smeltedId = AUTO_SMELT_MAP[stack.typeId];
                        const amount = stack.amount;
                        const loc = itemEntity.location;
                        itemEntity.remove();
                        player.dimension.spawnItem(new ItemStack(smeltedId, amount), loc);
                    }
                }
            } catch { }
        }, 5);
    }

    // Lucky Scarf — Extra drops from ores
    if (player.hasTag("dorios:lucky_scarf") && FORTUNE_ORES.includes(blockTypeId)) {
        system.runTimeout(() => {
            try {
                const items = player.dimension.getEntities({
                    location: e.block.location,
                    maxDistance: 2,
                    type: "minecraft:item"
                });
                for (const itemEntity of items) {
                    if (Math.random() < 0.33) {
                        const stack = itemEntity.getComponent("minecraft:item")?.itemStack;
                        if (stack) {
                            player.dimension.spawnItem(new ItemStack(stack.typeId, 1), itemEntity.location);
                        }
                    }
                }
            } catch { }
        }, 5);
    }

    // Miner's Ring — 10% chance to duplicate ore drops
    if (player.hasTag("dorios:miners_ring") && FORTUNE_ORES.includes(blockTypeId)) {
        system.runTimeout(() => {
            try {
                const items = player.dimension.getEntities({
                    location: e.block.location,
                    maxDistance: 2,
                    type: "minecraft:item"
                });
                for (const itemEntity of items) {
                    if (Math.random() < 0.10) {
                        const stack = itemEntity.getComponent("minecraft:item")?.itemStack;
                        if (stack) {
                            player.dimension.spawnItem(new ItemStack(stack.typeId, 1), itemEntity.location);
                        }
                    }
                }
            } catch { }
        }, 6);
    }

    // Silk Glove — Silk touch: ores/special blocks drop themselves
    if (player.hasTag("dorios:silk_glove") && SILK_TOUCH_MAP[blockTypeId]) {
        system.runTimeout(() => {
            try {
                const items = player.dimension.getEntities({
                    location: e.block.location,
                    maxDistance: 2,
                    type: "minecraft:item"
                });
                // Remove all normal drops from this block
                for (const itemEntity of items) {
                    itemEntity.remove();
                }
                // Spawn the block item instead
                const silkId = SILK_TOUCH_MAP[blockTypeId];
                player.dimension.spawnItem(new ItemStack(silkId, 1), e.block.location);
            } catch { }
        }, 5);
    }
});


// ─── 7. PLAYER INPUT EVENTS ─────────────────────────────────────────────────

// Whoopee Cushion — 10% chance to play fart sound on sneak
try {
    world.afterEvents.playerButtonInput.subscribe(e => {
        const player = e.player;

        // Bunny Hoppers — second and third jumps with upward + forward impulse
        if (e.button === 'Jump' && e.newButtonState === 'Pressed' && player.hasTag("dorios:bunny_hoppers")) {
            try {
                // Reset when grounded; base jump remains vanilla
                if (player.isOnGround) {
                    bunnyAirJumps.set(player.id, 0);
                    return;
                }

                const usedAirJumps = bunnyAirJumps.get(player.id) ?? 0;
                if (usedAirJumps >= 2) return;

                const view = player.getViewDirection();
                const verticalBoost = usedAirJumps === 0 ? 0.1 : 0.12;
                const horizontalBoost = usedAirJumps === 0 ? 0.22 : 0.18;

                player.applyImpulse({
                    x: view.x * horizontalBoost,
                    y: verticalBoost,
                    z: view.z * horizontalBoost
                });

                // Smooth out fall after boosted jumps
                player.addEffect('slow_falling', 1, { amplifier: 0, showParticles: false });
                bunnyAirJumps.set(player.id, usedAirJumps + 1);
            } catch { }
        }

        // Rocket Boots — 1st air jump: strong upward rocket, 2nd air jump: strong forward dash
        if (e.button === 'Jump' && e.newButtonState === 'Pressed' && player.hasTag("dorios:rocket_boots")) {
            try {
                if (player.isOnGround) {
                    rocketAirJumps.set(player.id, 0);
                    return;
                }

                const usedRocketJumps = rocketAirJumps.get(player.id) ?? 0;
                if (usedRocketJumps >= 2) return;

                const view = player.getViewDirection();

                if (usedRocketJumps === 0) {
                    // 1st air jump — Rocket Launch (strong upward)
                    player.applyImpulse({ x: 0, y: 1.2, z: 0 });
                    player.dimension.playSound("firework.launch", player.location, { volume: 0.8, pitch: 1.2 });
                    // Slow fall for safe arc
                    player.addEffect('slow_falling', 30, { amplifier: 0, showParticles: false });
                } else {
                    // 2nd air jump — Rocket Dash (strong forward)
                    player.applyImpulse({
                        x: view.x * 3,
                        y: -0.1,
                        z: view.z * 3
                    });
                    player.dimension.playSound("firework.blast", player.location, { volume: 0.6, pitch: 0.9 });
                    player.addEffect('slow_falling', 40, { amplifier: 0, showParticles: false });
                }

                rocketAirJumps.set(player.id, usedRocketJumps + 1);
            } catch { }
        }

        // Rocket Thruster — absurd look-direction launch
        // Triggers ONLY when:
        // 1) player jumps while sneaking
        // 2) player jumps in air while NOT sneaking
        if (e.button === 'Jump' && e.newButtonState === 'Pressed' && player.hasTag("dorios:rocket_thruster")) {
            try {
                const isSneakingJump = player.isSneaking;
                const isAirJumpWithoutSneak = !player.isOnGround && !player.isSneaking;

                if (!isSneakingJump && !isAirJumpWithoutSneak) return;
                if (player.hasTag("dorios:rocket_thruster_cd")) return;

                player.addTag("dorios:rocket_thruster_cd");
                system.runTimeout(() => {
                    try { player.removeTag("dorios:rocket_thruster_cd"); } catch { }
                }, 6);

                const view = player.getViewDirection();
                const strength = isSneakingJump ? 4.0 : 3.4;
                const verticalFloor = isSneakingJump ? 0.45 : 0.18;

                player.applyImpulse({
                    x: view.x * strength,
                    y: view.y * strength + 0.05,
                    z: view.z * strength
                });

                // Keep the rocket feel controlled after burst
                player.addEffect('slow_falling', 30, { amplifier: 0, showParticles: false });
                player.dimension.playSound("firework.launch", player.location, {
                    volume: 1.0,
                    pitch: isSneakingJump ? 0.85 : 1.1
                });
            } catch { }
        }

        // Power Glove — arm slam by jumping while sneaking
        if (e.button === 'Jump' && e.newButtonState === 'Pressed' && player.hasTag("dorios:power_glove") && player.isSneaking) {
            try {
                powerGloveState.set(player.id, { armedTicks: 50, slamReady: false });
                player.dimension.playSound("mob.horse.jump", player.location, { volume: 0.5, pitch: 0.9 });
            } catch { }
        }

        // Golden Feather — hold Jump in air to air-step
        if (e.button === 'Jump' && player.hasTag("dorios:golden_feather")) {
            try {
                const state = goldenFeatherState.get(player.id) ?? { holding: false, fuel: 14, cooldown: 0 };

                if (e.newButtonState === 'Pressed' && !player.isOnGround) {
                    state.holding = true;
                } else if (e.newButtonState === 'Released' || player.isOnGround) {
                    state.holding = false;
                }

                goldenFeatherState.set(player.id, state);
            } catch { }
        }

        if (e.button === 'Sneak' && e.newButtonState === 'Pressed') {
            if (player.hasTag("dorios:whoopee_cushion")) {
                if (Math.random() < 0.10) {
                    try {
                        player.dimension.playSound("mob.hoglin.angry", player.location, { volume: 1.0, pitch: 1.5 });
                    } catch { }
                }
            }
        }
    });
} catch {
    // playerButtonInput may not be available on all versions
}


// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Attracts item entities and XP orbs within a given range towards the player.
 * @param {import("@minecraft/server").Player} player
 * @param {number} [range=8] Maximum attraction distance in blocks
 * @param {number} [speed=0.4] Attraction speed
 */
function attractItems(player, range = 8, speed = 0.4) {
    try {
        const items = player.dimension.getEntities({
            location: player.location,
            maxDistance: range,
            type: "minecraft:item"
        });
        const xpOrbs = player.dimension.getEntities({
            location: player.location,
            maxDistance: range,
            type: "minecraft:xp_orb"
        });
        const allEntities = [...items, ...xpOrbs];

        for (const item of allEntities) {
            const dx = player.location.x - item.location.x;
            const dy = player.location.y - item.location.y;
            const dz = player.location.z - item.location.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 0.5) continue;

            const nx = (dx / dist) * speed;
            const ny = (dy / dist) * speed;
            const nz = (dz / dist) * speed;

            item.applyImpulse({ x: nx, y: ny, z: nz });
        }
    } catch { }
}

/**
 * Determines whether an entity should be treated as hostile for AoE retaliation.
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean}
 */
function isHostileEntity(entity) {
    if (!entity || entity.typeId === "minecraft:player") return false;
    if (isInanimateEntity(entity)) return false;

    if (HOSTILE_MOB_TYPES.has(entity.typeId)) return true;

    try {
        const family = entity.getComponent('minecraft:type_family');
        if (family?.hasTypeFamily?.('monster')) return true;
    } catch { }

    // Fallback for entities without readable type_family component
    const id = entity?.typeId ?? "";
    return id.includes("zombie") || id.includes("skeleton") || id.includes("creeper") ||
        id.includes("spider") || id.includes("slime") || id.includes("witch") ||
        id.includes("pillager") || id.includes("vindicator") || id.includes("evoker") ||
        id.includes("ravager") || id.includes("phantom") || id.includes("enderman") ||
        id.includes("endermite") || id.includes("blaze") || id.includes("ghast") ||
        id.includes("magma_cube") || id.includes("hoglin") || id.includes("zoglin") ||
        id.includes("wither") || id.includes("warden") || id.includes("guardian") ||
        id.includes("drowned") || id.includes("husk") || id.includes("stray") ||
        id.includes("piglin") || id.includes("breeze");
}

/**
 * Determines whether an entity should be treated as neutral.
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean}
 */
function isNeutralEntity(entity) {
    if (!entity || entity.typeId === "minecraft:player") return false;
    if (NEUTRAL_MOB_TYPES.has(entity.typeId)) return true;

    try {
        const family = entity.getComponent('minecraft:type_family');
        if (family?.hasTypeFamily?.('neutral')) return true;
    } catch { }

    const id = entity?.typeId ?? "";
    return id.includes("enderman") || id.includes("piglin") || id.includes("wolf") || id.includes("llama") || id.includes("bee");
}

/**
 * Determines whether an entity is passive.
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean}
 */
function isPassiveEntity(entity) {
    if (!entity) return false;
    if (PASSIVE_MOB_TYPE_SET.has(entity.typeId)) return true;

    try {
        const family = entity.getComponent('minecraft:type_family');
        if (family?.hasTypeFamily?.('animal')) return true;
    } catch { }

    return false;
}

/**
 * Determines whether an entity is inanimate.
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean}
 */
function isInanimateEntity(entity) {
    if (!entity) return true;
    return INANIMATE_ENTITY_TYPES.has(entity.typeId);
}

/**
 * Utility predicate for enemy-targeting mechanics.
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean}
 */
function isEnemyEntity(entity) {
    if (!entity || entity.typeId === "minecraft:player") return false;
    if (isInanimateEntity(entity)) return false;
    if (isPassiveEntity(entity)) return false;
    return isHostileEntity(entity) || isNeutralEntity(entity);
}

/**
 * Determines whether an entity is a projectile that should be neutralized by 4D Heart.
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean}
 */
function isProjectileEntity(entity) {
    if (!entity || entity.typeId === "minecraft:player") return false;

    try {
        if (entity.getComponent('minecraft:projectile')) return true;
    } catch { }

    const id = entity?.typeId ?? "";
    return id.includes("arrow") ||
        id.includes("trident") ||
        id.includes("fireball") ||
        id.includes("small_fireball") ||
        id.includes("dragon_fireball") ||
        id.includes("wind_charge") ||
        id.includes("shulker_bullet") ||
        id.includes("snowball") ||
        id.includes("egg") ||
        id.includes("llama_spit") ||
        id.includes("firework_rocket");
}

/**
 * Determines whether an entity is a village ally target for Heroic Ring aura.
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean}
 */
function isVillagerOrGolem(entity) {
    if (!entity) return false;
    const id = entity.typeId ?? "";
    if (id === "minecraft:villager" || id === "minecraft:villager_v2" ||
        id === "minecraft:iron_golem" || id === "minecraft:snow_golem") {
        return true;
    }

    try {
        const family = entity.getComponent('minecraft:type_family');
        if (family?.hasTypeFamily?.('villager') || family?.hasTypeFamily?.('golem')) {
            return true;
        }
    } catch { }

    return false;
}

/**
 * Spawns the Void Quiver chain arrow above a target.
 * @param {import("@minecraft/server").Player} player
 * @param {import("@minecraft/server").Entity} target
 */
function spawnVoidArrow(player, target) {
    try {
        const spreadX = (Math.random() - 0.5) * 0.8;
        const spreadZ = (Math.random() - 0.5) * 0.8;
        const spawnLocation = {
            x: target.location.x + spreadX,
            y: target.location.y + 3.6,
            z: target.location.z + spreadZ
        };

        const arrow = player.dimension.spawnEntity('minecraft:arrow', spawnLocation);
        try {
            arrow.teleport(spawnLocation, { facingLocation: target.location });
        } catch { }

        const dx = target.location.x - spawnLocation.x;
        const dy = target.location.y - spawnLocation.y;
        const dz = target.location.z - spawnLocation.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

        arrow.applyImpulse({
            x: (dx / dist) * 0.22,
            y: -0.95,
            z: (dz / dist) * 0.22
        });
    } catch {
        // Fallback: if projectile spawn fails, still deliver a small chain-hit
        try {
            target.applyDamage(4, { cause: 'entityAttack', damagingEntity: player });
        } catch { }
    }
}

/**
 * Controls custom pet golem follow / protection heuristics.
 * @param {import("@minecraft/server").Player} owner
 * @param {import("@minecraft/server").Entity} golem
 */
function maintainPetGolem(owner, golem) {
    if (!owner || !golem?.isValid) return;

    try {
        const dxOwner = owner.location.x - golem.location.x;
        const dyOwner = owner.location.y - golem.location.y;
        const dzOwner = owner.location.z - golem.location.z;
        const ownerDist = Math.sqrt(dxOwner * dxOwner + dyOwner * dyOwner + dzOwner * dzOwner);

        // Hard catch-up teleport if too far
        if (ownerDist > 28) {
            golem.teleport({
                x: owner.location.x + (Math.random() - 0.5) * 2,
                y: owner.location.y,
                z: owner.location.z + (Math.random() - 0.5) * 2
            }, owner.dimension);
        } else if (ownerDist > 4.5) {
            // Soft follow impulse
            golem.applyImpulse({
                x: (dxOwner / ownerDist) * 0.25,
                y: Math.max(-0.05, Math.min((dyOwner / Math.max(ownerDist, 1)) * 0.06, 0.12)),
                z: (dzOwner / ownerDist) * 0.25
            });
        }

        // Smart threat focus around owner
        const threats = owner.dimension.getEntities({
            location: owner.location,
            maxDistance: 12,
            excludeTypes: ["minecraft:item", "minecraft:xp_orb", "minecraft:player"]
        });

        let nearestThreat = undefined;
        let nearestThreatDistance = Infinity;

        for (const entity of threats) {
            if (!entity?.isValid || entity.id === golem.id) continue;
            if (!entity.getComponent?.('minecraft:health')) continue;
            if (!isEnemyEntity(entity)) continue;

            const dx = entity.location.x - owner.location.x;
            const dy = entity.location.y - owner.location.y;
            const dz = entity.location.z - owner.location.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < nearestThreatDistance) {
                nearestThreatDistance = dist;
                nearestThreat = entity;
            }
        }

        if (nearestThreat) {
            const dx = nearestThreat.location.x - golem.location.x;
            const dy = nearestThreat.location.y - golem.location.y;
            const dz = nearestThreat.location.z - golem.location.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

            golem.applyImpulse({
                x: (dx / dist) * 0.3,
                y: Math.max(-0.04, Math.min((dy / dist) * 0.08, 0.14)),
                z: (dz / dist) * 0.3
            });
        }

        // Creeper fear reinforcement (plus cat family on entity itself)
        const creepers = owner.dimension.getEntities({
            location: golem.location,
            maxDistance: 8,
            type: "minecraft:creeper"
        });
        for (const creeper of creepers) {
            const dx = creeper.location.x - golem.location.x;
            const dz = creeper.location.z - golem.location.z;
            const dist = Math.sqrt(dx * dx + dz * dz) || 1;
            creeper.applyKnockback({ x: dx / dist, z: dz / dist }, 0.8);
        }

        // Minor survivability autopilot at low HP
        const hp = golem.getComponent('minecraft:health');
        if (hp && hp.currentValue <= hp.effectiveMax * 0.25) {
            golem.addEffect('regeneration', 40, { amplifier: 1, showParticles: false });
            golem.addEffect('resistance', 20, { amplifier: 0, showParticles: false });
        }
    } catch { }
}

/**
 * Summons and binds a pet golem to its owner.
 * @param {import("@minecraft/server").Player} player
 */
function summonPetGolem(player) {
    const view = player.getViewDirection();
    const spawnLocation = {
        x: player.location.x + view.x * 1.5,
        y: player.location.y,
        z: player.location.z + view.z * 1.5
    };

    const golem = player.dimension.spawnEntity(PET_GOLEM_ENTITY_ID, spawnLocation);
    const ownerTag = getPetOwnerTag(player);

    golem.addTag(PET_GOLEM_TAG);
    golem.addTag(ownerTag);
    try { golem.triggerEvent('minecraft:from_player'); } catch { }

    golem.nameTag = `§aSentinel of ${player.name}`;

    try {
        golem.addEffect('resistance', 20 * 20, { amplifier: 0, showParticles: false });
        golem.addEffect('regeneration', 20 * 12, { amplifier: 0, showParticles: false });
        player.dimension.playSound("mob.irongolem.hit", spawnLocation, {
            volume: 0.6,
            pitch: 0.85
        });
    } catch { }
}

/**
 * Generates stable owner tag payload for pet entities.
 * @param {import("@minecraft/server").Player} player
 * @returns {string}
 */
function getPetOwnerTag(player) {
    const namePart = (player.name ?? "owner")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 12);

    const idPart = (player.id ?? player.name ?? "id")
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(-8)
        .toLowerCase();

    return `${PET_GOLEM_OWNER_TAG_PREFIX}${namePart}_${idPart}`;
}

/**
 * Checks if a pet golem belongs to a specific player.
 * @param {import("@minecraft/server").Entity} golem
 * @param {import("@minecraft/server").Player} player
 * @returns {boolean}
 */
function isPetGolemOwnedBy(golem, player) {
    if (!golem || golem.typeId !== PET_GOLEM_ENTITY_ID) return false;
    if (!golem.hasTag(PET_GOLEM_TAG)) return false;
    return golem.hasTag(getPetOwnerTag(player));
}

/**
 * Reads player's held item stack.
 * @param {import("@minecraft/server").Player} player
 * @returns {import("@minecraft/server").ItemStack | undefined}
 */
function getHeldItem(player) {
    try {
        const inv = player.getComponent('inventory')?.container;
        if (!inv) return undefined;
        return inv.getItem(player.selectedSlotIndex);
    } catch {
        return undefined;
    }
}

/**
 * Consumes item from the selected slot if it matches expected type.
 * @param {import("@minecraft/server").Player} player
 * @param {string} expectedTypeId
 * @param {number} amount
 * @returns {boolean}
 */
function consumeHeldItem(player, expectedTypeId, amount = 1) {
    try {
        const inv = player.getComponent('inventory')?.container;
        if (!inv) return false;

        const slot = player.selectedSlotIndex;
        const held = inv.getItem(slot);
        if (!held || held.typeId !== expectedTypeId) return false;

        if (held.amount > amount) {
            held.amount -= amount;
            inv.setItem(slot, held);
        } else {
            inv.setItem(slot, undefined);
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Heals a living entity by a flat amount.
 * @param {import("@minecraft/server").Entity} entity
 * @param {number} amount
 */
function healEntity(entity, amount) {
    try {
        const hp = entity.getComponent('minecraft:health');
        if (!hp) return;
        hp.setCurrentValue(Math.min(hp.currentValue + amount, hp.effectiveMax));
    } catch { }
}

/**
 * Checks whether a block is a nature/plant block (grass, dirt, moss, flowers, crops, etc.).
 * Used by Rooted Boots to determine conditional buffs.
 * @param {import("@minecraft/server").Block} block
 * @returns {boolean}
 */
function isNatureBlock(block) {
    if (!block) return false;
    try {
        // Check vanilla block tags first
        if (block.hasTag("plant") || block.hasTag("dirt") || block.hasTag("log") ||
            block.hasTag("leaves") || block.hasTag("wood") || block.hasTag("crop") ||
            block.hasTag("fertilize_area")) return true;
        // Fall back to typeId pattern matching
        const id = block.typeId;
        return id.includes("grass") || id.includes("dirt") || id.includes("moss") ||
            id.includes("mud") || id.includes("podzol") || id.includes("mycelium") ||
            id.includes("farmland") || id.includes("rooted") || id.includes("leaves") ||
            id.includes("log") || id.includes("vine") || id.includes("fern") ||
            id.includes("bush") || id.includes("flower") || id.includes("azalea") ||
            id.includes("mangrove") || id.includes("cherry") || id.includes("bamboo") ||
            id.includes("dripleaf") || id.includes("spore") || id.includes("sapling");
    } catch { return false; }
}

/**
 * Scares creepers within 6 blocks by applying speed away from the player.
 * @param {import("@minecraft/server").Player} player
 */
function scareCreepers(player) {
    try {
        const creepers = player.dimension.getEntities({
            location: player.location,
            maxDistance: 6,
            type: "minecraft:creeper"
        });

        for (const creeper of creepers) {
            const dx = creeper.location.x - player.location.x;
            const dz = creeper.location.z - player.location.z;
            const dist = Math.sqrt(dx * dx + dz * dz) || 1;

            // Push creeper away
            creeper.applyKnockback(
                { x: dx / dist, z: dz / dist },
                0.5
            );
        }
    } catch { }
}
