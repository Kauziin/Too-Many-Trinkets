# Fix glyphs in ALL lang files (pt_BR, pt_PT, es_ES, es_MX + fix whoopee_cushion in en_US)
# Strategy: Find each item line by key, then insert glyphs at numeric stat value positions.
# Stat values are language-independent (same numbers in all translations).

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
$SLC= [char]0xE13C  # Slowness
$IV = [char]0xE13A  # Invisibility

$base = "c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Too Many Trinkets\RP\texts"
$log = @()

# ============================================================
# Step 1: Fix whoopee_cushion double glyph in en_US  
# ============================================================
$enFile = "$base\en_US.lang"
$enText = [System.IO.File]::ReadAllText($enFile, [System.Text.Encoding]::UTF8)
$doubleS = "${S}${S}"  # Two consecutive speed glyphs
if ($enText.Contains($doubleS)) {
    $enText = $enText.Replace($doubleS, $S)
    [System.IO.File]::WriteAllText($enFile, $enText, (New-Object System.Text.UTF8Encoding $false))
    $log += "en_US: Fixed whoopee_cushion double glyph"
}

# ============================================================
# Step 2: Define glyph insertions for each item
# ============================================================
# Format: @{ key = @( @(old_pattern, new_pattern), ... ) }
# Patterns use numeric values as anchors (language-independent)
# We process the line found by item key

# Helper: creates a replacement function for a specific line
function AddGlyphsToLine {
    param([string]$line, [array]$replacements)
    $result = $line
    foreach($r in $replacements) {
        $old = $r[0]; $new = $r[1]
        if($result.Contains($old)) {
            $result = $result.Replace($old, $new)
        }
    }
    return $result
}

# Item glyph definitions
# For OLD section (suffix: value[glyph]): pattern pairs like ("+5%", "+5%[S]")
# For R&R section (prefix: [glyph]value): pattern pairs like ("\n+3 ", "\n[A]+3 ")

$itemGlyphs = @{
    # --- OLD SECTION (suffix) ---
    "night_vision_goggles" = @(
        @("\n+ I", "\n+${NV} I")
    )
    "snorkel" = @(
        @("\n+30% ", "\n+30%${W} "),
        @("\n+ I", "\n+${CD} I")
    )
    "villager_hat" = @(
        @("\n+ I", "\n+${SP} I")
    )
    "whoopee_cushion" = @(
        @("\n+5%", "\n+5%${S}")
    )
    "cross_necklace" = @(
        @("| +6 ", "| +6${H} "),
        @("\n+ I ", "\n+${RS} I ")
    )
    "feral_claws" = @(
        @("\n+3 |", "\n+3${A} |")
    )
    "steadfast_spikes" = @(
        @("| +2 |", "| +2${H} |")
    )
    "universal_attractor" = @(
        @("\n+10% ", "\n+10%${S} ")
    )
    "crystal_heart" = @(
        @("\n+16 ", "\n+16${H} "),
        @("\n+ I", "\n+${RG} I")
    )
    "plastic_drinking_hat" = @(
        @("\n+2 |", "\n+2${H} |"),
        @("| +5 ", "| +5${RG} "),
        @("\n+ I", "\n+${SA} I")
    )
    "novelty_drinking_hat" = @(
        @("\n+10% |", "\n+10%${S} |"),
        @("| +3 ", "| +3${RG} "),
        @("\n+ I", "\n+${SA} I")
    )
    "umbrella" = @(
        @("\n+ I ", "\n+${SF} I "),
        @("\n+${RS} I (", "\n+${RS} I (")  # skip if already done
    )
    # --- R&R / NEW SECTION (prefix) ---
    "holy_necklace" = @(
        @("\n+3 |", "\n${A}+3 |"),
        @("| +2 ", "| ${H}+2 ")
    )
    "holy_dagger" = @(
        @("\n+3 ", "\n${A}+3 ")
    )
    "mirror" = @(
        @("\n+2 |", "\n${H}+2 |")
    )
    "berserk_ring" = @(
        @("\n+4 |", "\n${A}+4 |")
    )
    "vampire_ring" = @(
        @("\n+2 |", "\n${A}+2 |")
    )
    "sprint_ring" = @(
        @("\n+15% ", "\n${S}+15% "),
        @("\n+ II |", "\n+${SP} II |"),
        @("| + I ", "| +${ST} I "),
        @("|  I ", "| +${ST} I ")
    )
    "gale_ring" = @(
        @("\n+ I ", "\n+${SF} I ")
    )
    "shepherds_ring" = @(
        @("\n+2 |", "\n${H}+2 |"),
        @("| +1 ", "| ${RG}+1 ")
    )
    "tidal_ring" = @(
        @("\n+50% ", "\n${W}+50% "),
        @("\n+ I ", "\n+${CD} I ")
    )
    "earthshaker_ring" = @(
        @("\n+3 |", "\n${A}+3 |")
    )
    "ender_ring" = @(
        @("\n+2 |", "\n${A}+2 |"),
        @("| +10% ", "| ${S}+10% ")
    )
    "heart_from_the_fourth_dimension" = @(
        @("\n+20 |", "\n${H}+20 |")
    )
}

# ============================================================
# Step 3: Process each non-EN lang file
# ============================================================
$langFiles = @('pt_BR', 'pt_PT', 'es_ES', 'es_MX')

foreach($lang in $langFiles) {
    $file = "$base\$lang.lang"
    $text = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    $changed = $false
    
    foreach($itemKey in $itemGlyphs.Keys) {
        $fullKey = "item.dorios:${itemKey}="
        
        # Find the line
        $lines = $text -split "`n"
        $lineIdx = -1
        for($i = 0; $i -lt $lines.Count; $i++) {
            if($lines[$i].StartsWith($fullKey)) { $lineIdx = $i; break }
        }
        
        if($lineIdx -eq -1) {
            $log += "${lang}: NOT FOUND: $itemKey"
            continue
        }
        
        $originalLine = $lines[$lineIdx]
        
        # Check if line already has the expected glyph count
        $currentGlyphs = [regex]::Matches($originalLine, '[\uE000-\uF8FF]').Count
        
        # Get expected count based on replacements
        $testLine = $originalLine
        foreach($r in $itemGlyphs[$itemKey]) {
            $testLine = $testLine.Replace($r[0], $r[1])
        }
        $expectedGlyphs = [regex]::Matches($testLine, '[\uE000-\uF8FF]').Count
        
        if($currentGlyphs -ge $expectedGlyphs) {
            # Already has glyphs
            continue
        }
        
        # Apply replacements
        $newLine = AddGlyphsToLine $originalLine $itemGlyphs[$itemKey]
        
        if($newLine -ne $originalLine) {
            $text = $text.Replace($originalLine, $newLine)
            $addedGlyphs = [regex]::Matches($newLine, '[\uE000-\uF8FF]').Count - $currentGlyphs
            $log += "${lang}: OK: $itemKey (+${addedGlyphs} glyphs)"
            $changed = $true
        } else {
            $log += "${lang}: NO MATCH: $itemKey"
        }
    }
    
    if($changed) {
        [System.IO.File]::WriteAllText($file, $text, (New-Object System.Text.UTF8Encoding $false))
        $log += "${lang}: FILE SAVED"
    } else {
        $log += "${lang}: NO CHANGES"
    }
    $log += ""
}

# ============================================================
# Step 4: Handle umbrella's Resistance line specially
# ============================================================
# The umbrella's second effect "Resistance I (Outdoors)" needs to become "+[RS] I (Outdoors)"
# But the text might be translated differently in each lang
foreach($lang in $langFiles) {
    $file = "$base\$lang.lang"
    $text = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    $lines = $text -split "`n"
    for($i = 0; $i -lt $lines.Count; $i++) {
        if($lines[$i] -match '^item\.dorios:umbrella=') {
            $line = $lines[$i]
            # Check if umbrella has the Resistance glyph
            if(-not $line.Contains($RS)) {
                # Find pattern ending with "(Outdoors)" or similar - just look for RS insertion point
                # The umbrella should have 2 glyphs: SF (slow falling) and RS (resistance)
                # If only SF was added, we need to add RS before the resistance text
                # Match pattern: things like "Resistance I", "Resistência I", "Resistencia I"  
                $pattern = '\\n(Resist\w+\s+I\s)'
                if($line -match $pattern) {
                    $old = $matches[0]
                    $new = "\n+${RS} I "
                    # Only replace the "Resistance" part, keeping the rest
                    # Actually, let's match more carefully:
                    if($line -match '(\\nResist\w+\s+I\s+\([^)]+\))') {
                        $oldPart = $matches[1]
                        # Extract just the condition part like "(Outdoors)" / "(Ao ar livre)"
                        if($oldPart -match '\(([^)]+)\)') {
                            $condition = $matches[0]
                            $newPart = "\n+${RS} I $condition"
                            $line = $line.Replace($oldPart, $newPart)
                            $lines[$i] = $line
                            $text = $lines -join "`n"
                            [System.IO.File]::WriteAllText($file, $text, (New-Object System.Text.UTF8Encoding $false))
                            $log += "${lang}: umbrella: Added RS glyph for Resistance line"
                        }
                    }
                }
            }
        }
    }
}

$log | Out-File "c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Too Many Trinkets\glyph_fix_all_log.txt" -Encoding UTF8
Write-Output "Done. See glyph_fix_all_log.txt"
