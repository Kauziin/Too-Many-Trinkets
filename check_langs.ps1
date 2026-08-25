$langs = @('pt_BR','pt_PT','es_ES','es_MX')
$enBytes = [System.IO.File]::ReadAllBytes("c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Too Many Trinkets\RP\texts\en_US.lang")
$enText = [System.Text.Encoding]::UTF8.GetString($enBytes)
$enMap = @{}
foreach($line in ($enText -split "`n")) { if($line -match '^(item\.dorios:\w+)=') { $enMap[$matches[1]] = [regex]::Matches($line, '[\uE000-\uF8FF]').Count } }
$enKeys = $enMap.Keys | Sort-Object

$output = @()
foreach($lang in $langs) {
    $f = "c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Too Many Trinkets\RP\texts\$lang.lang"
    $t = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($f))
    $lMap = @{}
    foreach($line in ($t -split "`n")) { if($line -match '^(item\.dorios:\w+)=') { $lMap[$matches[1]] = [regex]::Matches($line, '[\uE000-\uF8FF]').Count } }
    
    $missing = @(); $wrongCount = @()
    foreach($key in $enKeys) {
        $short = $key.Replace('item.dorios:','')
        if(-not $lMap.ContainsKey($key)) { $missing += $short }
        elseif($enMap[$key] -ne $lMap[$key]) { $wrongCount += "${short}: EN=$($enMap[$key]) ${lang}=$($lMap[$key])" }
    }
    $output += "=== $lang ==="
    $output += "Missing keys ($($missing.Count)): $($missing -join ', ')"
    $output += "Glyph mismatches ($($wrongCount.Count)):"
    foreach($w in $wrongCount) { $output += "  $w" }
    $output += ""
}

$output | Out-File "c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Too Many Trinkets\lang_check.txt" -Encoding UTF8
Write-Output "Done"
