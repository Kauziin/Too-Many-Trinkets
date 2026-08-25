# ============================================================
# Comprehensive glyph fix for ALL lang files
# Fixes: whoopee_cushion double glyph in en_US
#        + inserts missing glyphs in pt_BR, pt_PT, es_ES, es_MX
# ============================================================

$H  = [char]0xE116  # Health
$A  = [char]0xE117  # Attack
$S  = [char]0xE118  # Speed %
$W  = [char]0xE119  # Water Speed %
$RG = [char]0xE110  # Regeneration
$NV = [char]0xE149  # Night Vision
$SA = [char]0xE12B  # Saturation
$SF = [char]0xE13F  # Slow Falling
$RS = [char]0xE139  # Resistance
$SP = [char]0xE13B  # Speed effect / Village Hero
$ST = [char]0xE13D  # Strength
$CD = [char]0xE14A  # Conduit Power

$base = "c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Too Many Trinkets\RP\texts"
$log = @()

# ============================================================
# Step 1: Fix whoopee_cushion double glyph in en_US
# ============================================================
$enFile = "$base\en_US.lang"
$enText = [System.IO.File]::ReadAllText($enFile, [System.Text.Encoding]::UTF8)
$doubleS = "${S}${S}"
if ($enText.Contains($doubleS)) {
    $enText = $enText.Replace($doubleS, $S)
    [System.IO.File]::WriteAllText($enFile, $enText, (New-Object System.Text.UTF8Encoding $false))
    $log += "en_US: Fixed whoopee_cushion double glyph"
} else {
    $log += "en_US: No double glyph found (already fixed or not present)"
}

# ============================================================
# Step 2: Define per-item glyph insertion function
# ============================================================
# For each item, apply targeted .Replace() operations on its line.
# OLD SECTION items use SUFFIX glyphs: +value[glyph]
# R&R/NEW items use PREFIX glyphs: [glyph]+value
# Effect levels always use: +[glyph] LEVEL

function Fix-ItemLine {
    param([string]$itemKey, [string]$line, [string]$lang)
    
    $result = $line
    
    switch ($itemKey) {
        # ========== OLD SECTION (suffix glyphs) ==========
        "night_vision_goggles" {
            # +[NV] I (night vision effect)
            $result = $result.Replace('\n+ I', "\n+${NV} I")
        }
        "villager_hat" {
            # +[SP] I (village hero effect)
            $result = $result.Replace('\n+ I', "\n+${SP} I")
        }
        "whoopee_cushion" {
            # +5%[S] (speed suffix)
            $result = $result.Replace('\n+5%', "\n+5%${S}")
        }
        "cross_necklace" {
            # | +6[H]  (health suffix)
            $result = $result.Replace('| +6 ', "| +6${H} ")
            # +[RS] I  (resistance effect)
            $result = $result.Replace('\n+ I ', "\n+${RS} I ")
        }
        "feral_claws" {
            # +3[A] | (attack suffix)
            $result = $result.Replace('\n+3 |', "\n+3${A} |")
        }
        "steadfast_spikes" {
            # | +2[H] | (health suffix)
            $result = $result.Replace('| +2 |', "| +2${H} |")
        }
        "universal_attractor" {
            # +10%[S] (speed suffix) - before "\nItem Magnet" text
            $result = $result.Replace('\n+10% \n', "\n+10%${S} \n")
        }
        "crystal_heart" {
            # +16[H] (health suffix)
            $result = $result.Replace('\n+16 ', "\n+16${H} ")
            # +[RG] I (regen effect)
            $result = $result.Replace('\n+ I', "\n+${RG} I")
        }
        "umbrella" {
            # +[SF] I (slow falling) - first effect line, followed by \n
            $result = $result.Replace('\n+ I \n', "\n+${SF} I \n")
            # +[RS] I (resistance) - second effect, was originally "Resistência/Resistencia"
            $result = $result.Replace("\nResist${([char]0x00EA)}ncia I (", "\n+${RS} I (")  # pt: ê
            $result = $result.Replace("`nResistencia I (", "`n+${RS} I (")  # es
            # Handle both with simple approach
            if ($result.Contains('\nResist')) {
                # Portuguese: Resistência
                $result = $result -replace '\\nResist[^\s]+ I \(', "\n+${RS} I ("
            }
        }
        
        # ========== R&R / NEW SECTION (prefix glyphs) ==========
        "holy_necklace" {
            # [A]+3 | (attack prefix)
            $result = $result.Replace('\n+3 |', "\n${A}+3 |")
            # | [H]+2 (health prefix)
            $result = $result.Replace('| +2 \n', "| ${H}+2 \n")
        }
        "holy_dagger" {
            # [A]+3 (attack prefix)
            $result = $result.Replace('\n+3 \n', "\n${A}+3 \n")
        }
        "mirror" {
            # [H]+2 | (health prefix)
            $result = $result.Replace('\n+2 |', "\n${H}+2 |")
        }
        "berserk_ring" {
            # [A]+4 | (attack prefix)
            $result = $result.Replace('\n+4 |', "\n${A}+4 |")
        }
        "vampire_ring" {
            # [A]+2 | (attack prefix)
            $result = $result.Replace('\n+2 |', "\n${A}+2 |")
        }
        "sprint_ring" {
            # [S]+15% (speed prefix)
            $result = $result.Replace('\n+15% ', "\n${S}+15% ")
            # +[SP] II | (speed effect)
            $result = $result.Replace('\n+ II |', "\n+${SP} II |")
            # +[ST] I (strength effect) - was stripped to "|  I"
            $result = $result.Replace('|  I ', "| +${ST} I ")
        }
        "gale_ring" {
            # +[SF] I (slow falling effect) - between "Extra Jump" and "No Fall"
            $result = $result.Replace('\n+ I \n', "\n+${SF} I \n")
        }
        "shepherds_ring" {
            # [H]+2 | (health prefix)
            $result = $result.Replace('\n+2 |', "\n${H}+2 |")
            # | [RG]+1 (regen prefix)
            $result = $result.Replace('| +1 \n', "| ${RG}+1 \n")
        }
        "tidal_ring" {
            # [W]+50% (water speed prefix)
            $result = $result.Replace('\n+50% ', "\n${W}+50% ")
            # +[CD] I (conduit power effect)
            $result = $result.Replace('\n+ I ', "\n+${CD} I ")
        }
        "earthshaker_ring" {
            # [A]+3 | (attack prefix)
            $result = $result.Replace('\n+3 |', "\n${A}+3 |")
        }
        "ender_ring" {
            # [A]+2 | (attack prefix)
            $result = $result.Replace('\n+2 |', "\n${A}+2 |")
            # | [S]+10% (speed prefix)
            $result = $result.Replace('| +10% ', "| ${S}+10% ")
        }
        "heart_from_the_fourth_dimension" {
            # [H]+20 | (health prefix)
            $result = $result.Replace('\n+20 |', "\n${H}+20 |")
        }
    }
    
    return $result
}

# ============================================================
# Step 3: Process each non-EN lang file
# ============================================================
$langFiles = @('pt_BR', 'pt_PT', 'es_ES', 'es_MX')

# Items that need fixing in ALL 4 non-EN files (19 items)
$commonItems = @(
    'berserk_ring', 'cross_necklace', 'crystal_heart', 'earthshaker_ring',
    'ender_ring', 'gale_ring', 'heart_from_the_fourth_dimension', 'holy_dagger',
    'mirror', 'night_vision_goggles', 'shepherds_ring', 'sprint_ring',
    'steadfast_spikes', 'tidal_ring', 'umbrella', 'universal_attractor',
    'vampire_ring', 'villager_hat', 'whoopee_cushion'
)

# Items that ADDITIONALLY need fixing in pt_BR and es_MX only
$extraItems = @('feral_claws', 'holy_necklace')

foreach ($lang in $langFiles) {
    $file = "$base\$lang.lang"
    $text = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    $changed = $false
    
    # Determine which items to fix for this language
    $itemsToFix = $commonItems
    if ($lang -eq 'pt_BR' -or $lang -eq 'es_MX') {
        $itemsToFix = $commonItems + $extraItems
    }
    
    foreach ($itemKey in $itemsToFix) {
        $fullKey = "item.dorios:${itemKey}="
        
        # Find the line start and end
        $idx = $text.IndexOf($fullKey)
        if ($idx -eq -1) {
            $log += "${lang}: NOT FOUND: $itemKey"
            continue
        }
        
        # Find end of line (next real newline or end of file)
        $endIdx = $text.IndexOf("`n", $idx)
        if ($endIdx -eq -1) { $endIdx = $text.Length }
        
        $originalLine = $text.Substring($idx, $endIdx - $idx)
        
        # Count current glyphs
        $currentGlyphs = ([regex]::Matches($originalLine, '[\uE000-\uF8FF]')).Count
        
        # Apply glyph fixes
        $newLine = Fix-ItemLine -itemKey $itemKey -line $originalLine -lang $lang
        
        # Count new glyphs
        $newGlyphs = ([regex]::Matches($newLine, '[\uE000-\uF8FF]')).Count
        $added = $newGlyphs - $currentGlyphs
        
        if ($newLine -ne $originalLine -and $added -gt 0) {
            $text = $text.Remove($idx, $originalLine.Length).Insert($idx, $newLine)
            $log += "${lang}: OK: $itemKey (+${added} glyphs, now ${newGlyphs})"
            $changed = $true
        } elseif ($currentGlyphs -gt 0) {
            # Already has glyphs, skip silently
        } else {
            $log += "${lang}: NO CHANGE: $itemKey (current: ${currentGlyphs} glyphs)"
        }
    }
    
    if ($changed) {
        [System.IO.File]::WriteAllText($file, $text, (New-Object System.Text.UTF8Encoding $false))
        $log += "${lang}: FILE SAVED"
    } else {
        $log += "${lang}: NO CHANGES NEEDED"
    }
    $log += ""
}

# ============================================================
# Step 4: Special handling for umbrella Resistance line
# The regex in Fix-ItemLine may not work perfectly for all langs
# Do a targeted fix for umbrella's Resistance line
# ============================================================
foreach ($lang in $langFiles) {
    $file = "$base\$lang.lang"
    $text = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    
    $umbreKey = "item.dorios:umbrella="
    $idx = $text.IndexOf($umbreKey)
    if ($idx -eq -1) { continue }
    
    $endIdx = $text.IndexOf("`n", $idx)
    if ($endIdx -eq -1) { $endIdx = $text.Length }
    $line = $text.Substring($idx, $endIdx - $idx)
    
    # Check if the Resistance glyph (RS = E139) is present
    if (-not $line.Contains($RS)) {
        $newLine = $line
        # Try Portuguese pattern
        $newLine = $newLine -replace '\\nResist\S+ I \(', "\n+${RS} I ("
        
        if ($newLine -ne $line) {
            $text = $text.Remove($idx, $line.Length).Insert($idx, $newLine)
            [System.IO.File]::WriteAllText($file, $text, (New-Object System.Text.UTF8Encoding $false))
            $log += "${lang}: UMBRELLA: Added Resistance glyph via regex"
        }
    }
}

$log += ""
$log += "=== DONE ==="

$logPath = "c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Too Many Trinkets\glyph_fix_final_log.txt"
$log | Out-File $logPath -Encoding UTF8
Write-Output ($log -join "`n")
