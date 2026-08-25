$file = "c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Too Many Trinkets\RP\texts\en_US.lang"
$text = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Glyph characters
$H  = [char]0xE116  # Health
$A  = [char]0xE117  # Attack
$S  = [char]0xE118  # Speed %
$W  = [char]0xE119  # Water Speed %
$RG = [char]0xE110  # Regeneration
$NV = [char]0xE149  # Night Vision
$HA = [char]0xE11E  # Haste
$SA = [char]0xE12B  # Saturation
$JU = [char]0xE12E  # Jump Boost
$SF = [char]0xE13F  # Slow Falling
$RS = [char]0xE139  # Resistance
$SP = [char]0xE13B  # Speed effect / Village Hero
$ST = [char]0xE13D  # Strength
$CD = [char]0xE14A  # Conduit Power
$WT = [char]0xE14B  # Wither
$PS = [char]0xE14C  # Poison
$FA = [char]0xE14D  # Fire Aspect
$SL = [char]0xE13C  # Slowness
$IV = [char]0xE13A  # Invisibility

$log = @()
$original = $text

function DoReplace {
    param($old, $new, $name)
    if ($script:text.Contains($old)) {
        $script:text = $script:text.Replace($old, $new)
        $script:log += "OK: $name"
    } else {
        $script:log += "MISS: $name"
    }
}

# =========================================================================
# OLD SECTION items (suffix pattern: +value[glyph])
# =========================================================================

# night_vision_goggles: \n+ I → \n+[NV] I
DoReplace "see through the darkness. \n+ I" "see through the darkness. \n+${NV} I" "night_vision_goggles"

# snorkel: \n+30% \n+ I → \n+30%[W] \n+[CD] I
DoReplace "underwater exploration. \n+30% \n+ I" "underwater exploration. \n+30%${W} \n+${CD} I" "snorkel"

# villager_hat: \n+3% Crit Chance \n+ I → add [SP] for Village Hero
DoReplace "treat you as a hero. \n+3% Crit Chance \n+ I" "treat you as a hero. \n+3% Crit Chance \n+${SP} I" "villager_hat"

# whoopee_cushion: \n+5% → \n+5%[S]
DoReplace "when you move. \n+5%" "when you move. \n+5%${S}" "whoopee_cushion"

# cross_necklace: +6 \n+ I → +6[H] \n+[RS] I
DoReplace "| +6 \n+ I on hit (3s)" "| +6${H} \n+${RS} I on hit (3s)" "cross_necklace"

# feral_claws: +3 → +3[A]
DoReplace "critical strikes. \n+3 | +12%" "critical strikes. \n+3${A} | +12%" "feral_claws"

# steadfast_spikes: +2 → +2[H]
DoReplace "KB Resist | +2 | +5% Thorns" "KB Resist | +2${H} | +5% Thorns" "steadfast_spikes"

# universal_attractor: +10% → +10%[S]
DoReplace "toward you. \n+10% \nItem Magnet" "toward you. \n+10%${S} \nItem Magnet" "universal_attractor"

# crystal_heart: +16 \n+ I → +16[H] \n+[RG] I
DoReplace "your vitality. \n+16 \n+ I" "your vitality. \n+16${H} \n+${RG} I" "crystal_heart"

# plastic_drinking_hat: +2 | +5 \n+ I → +2[H] | +5[RG] \n+[SA] I
DoReplace "all times. \n+2 | +5 \n+ I" "all times. \n+2${H} | +5${RG} \n+${SA} I" "plastic_drinking_hat"

# novelty_drinking_hat: +10% | +3 \n+ I → +10%[S] | +3[RG] \n+[SA] I
DoReplace "and moving. \n+10% | +3 \n+ I" "and moving. \n+10%${S} | +3${RG} \n+${SA} I" "novelty_drinking_hat"

# umbrella: + I \nResistance I → +[SF] I \n+[RS] I
DoReplace "\n+ I \nResistance I (Outdoors)" "\n+${SF} I \n+${RS} I (Outdoors)" "umbrella"

# =========================================================================
# R&R / NEW SECTION items (prefix pattern: [glyph]+value)
# =========================================================================

# holy_necklace: +3 | +2 → [A]+3 | [H]+2
DoReplace "holy fire. \n+3 | +2 \nHoly" "holy fire. \n${A}+3 | ${H}+2 \nHoly" "holy_necklace"

# holy_dagger: +3 → [A]+3
DoReplace "undead creatures. \n+3 \n+2-6" "undead creatures. \n${A}+3 \n+2-6" "holy_dagger"

# mirror: +2 | +5% Thorns → [H]+2 | +5% Thorns
DoReplace "at attackers. \n+2 | +5% Thorns" "at attackers. \n${H}+2 | +5% Thorns" "mirror"

# berserk_ring: +4 | +5% Crit Multi → [A]+4 | +5% Crit Multi
DoReplace "max level V, 5s). \n+4 | +5% Crit Multi" "max level V, 5s). \n${A}+4 | +5% Crit Multi" "berserk_ring"

# vampire_ring: +2 | +35% Lifesteal → [A]+2 | +35% Lifesteal
DoReplace "dealt as health. \n+2 | +35% Lifesteal" "dealt as health. \n${A}+2 | +35% Lifesteal" "vampire_ring"

# sprint_ring: +15% \n+ II |  I → [S]+15% \n+[SP] II | +[ST] I
DoReplace "while sprinting. \n+15% \n+ II |  I while sprinting" "while sprinting. \n${S}+15% \n+${SP} II | +${ST} I while sprinting" "sprint_ring"

# gale_ring: + I → +[SF] I
DoReplace "fall damage. \n+1 Extra Jump \n+ I \nNo" "fall damage. \n+1 Extra Jump \n+${SF} I \nNo" "gale_ring"

# shepherds_ring: +2 | +1 → [H]+2 | [RG]+1
DoReplace "animals. \n+2 | +1 \nDouble" "animals. \n${H}+2 | ${RG}+1 \nDouble" "shepherds_ring"

# tidal_ring: +50% \n+ I → [W]+50% \n+[CD] I
DoReplace "submerged. \n+50% \n+ I when" "submerged. \n${W}+50% \n+${CD} I when" "tidal_ring"

# earthshaker_ring: +3 | +2 Knockback → [A]+3 | +2 Knockback
DoReplace "nearby foes. \n+3 | +2 Knockback" "nearby foes. \n${A}+3 | +2 Knockback" "earthshaker_ring"

# ender_ring: +2 | +10% → [A]+2 | [S]+10%
DoReplace "at low HP. \n+2 | +10% \nFire" "at low HP. \n${A}+2 | ${S}+10% \nFire" "ender_ring"

# heart_from_the_fourth_dimension: +20 | +30% → [H]+20 | +30%
DoReplace "near death. \n+20 | +30% Damage" "near death. \n${H}+20 | +30% Damage" "heart_from_the_fourth_dimension"

# =========================================================================
# Save
# =========================================================================
if ($text -ne $original) {
    [System.IO.File]::WriteAllText($file, $text, (New-Object System.Text.UTF8Encoding $false))
    $log += "=== FILE SAVED ==="
} else {
    $log += "=== NO CHANGES ==="
}

$log | Out-File "c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Too Many Trinkets\glyph_fix_log.txt" -Encoding UTF8
Write-Output "Done. Check glyph_fix_log.txt"
