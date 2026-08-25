$text = [System.IO.File]::ReadAllText("c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Too Many Trinkets\RP\texts\en_US.lang", [System.Text.Encoding]::UTF8)
$output = @()
foreach($line in ($text -split "`n")) {
    if($line -match '^item\.dorios:(\w+)=') {
        $key = $matches[1]
        # Check for consecutive duplicate glyphs
        $doubles = [regex]::Matches($line, '([\uE000-\uF8FF])\1')
        if($doubles.Count -gt 0) {
            $codes = ($doubles | ForEach-Object { "U+{0:X4}" -f [int]$_.Groups[1].Value[0] }) -join ", "
            $output += "DOUBLE: $key ($codes)"
        }
        # Also verify total glyph count
        $total = [regex]::Matches($line, '[\uE000-\uF8FF]').Count
        if($total -gt 0) {
            $replaced = [regex]::Replace($line, '([\uE000-\uF8FF])', { param($m) "[U+{0:X4}]" -f [int]$m.Value[0] })
            # Get just the stat portion (after the last §f)
            $statPart = $replaced -split '§f' | Select-Object -Last 1
            $output += "$key ($total glyphs): $($statPart.TrimEnd())"
        }
    }
}
$output | Out-File "c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Too Many Trinkets\glyph_audit.txt" -Encoding UTF8
Write-Output "Done - $($output.Count) lines"
