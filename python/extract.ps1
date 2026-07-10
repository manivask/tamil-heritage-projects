# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
param(
    [string]$Keyword = "palani"
)

Write-Host "[*] Querying Wikidata for places containing '$Keyword'..."

$query = 'SELECT DISTINCT ?place ?placeLabel ?coords ?countryLabel ?typeLabel WHERE { SERVICE wikibase:mwapi { bd:serviceParam wikibase:endpoint "www.wikidata.org" . bd:serviceParam wikibase:api "EntitySearch" . bd:serviceParam mwapi:search "' + $Keyword.ToLower() + '" . bd:serviceParam mwapi:language "en" . ?place wikibase:apiOutputItem mwapi:item . } ?place wdt:P625 ?coords . ?place rdfs:label ?placeLabel . FILTER (LANG(?placeLabel) = "en") OPTIONAL { ?place wdt:P17 ?country . ?country rdfs:label ?countryLabel . FILTER (LANG(?countryLabel) = "en") } OPTIONAL { ?place wdt:P31 ?type . ?type rdfs:label ?typeLabel . FILTER (LANG(?typeLabel) = "en") } } LIMIT 2000'
$url = "https://query.wikidata.org/sparql?query=" + [uri]::EscapeDataString($query) + "&format=json"

$headers = @{
    "User-Agent" = "TamilGeographicFootprints/1.0 (maniv@example.com) PowerShell/7.0"
}

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    $bindings = $response.results.bindings
    Write-Host "[*] Raw results received: $($bindings.Count)"
}
catch {
    Write-Error "[!] Error querying Wikidata: $_"
    exit 1
}

$countries = @{}
$totalCount = 0

foreach ($bind in $bindings) {
    $placeUri = $bind.place.value
    $placeId = $placeUri.Split('/')[-1]
    $placeName = $bind.placeLabel.value
    $coordVal = $bind.coords.value
    $country = if ($bind.countryLabel.value) { $bind.countryLabel.value } else { "Unknown Country" }
    $placeType = if ($bind.typeLabel.value) { $bind.typeLabel.value } else { "Geographical Feature" }
    
    if ($coordVal -match "Point\(([^ ]+) ([^ ]+)\)") {
        $lon = [double]$Matches[1]
        $lat = [double]$Matches[2]
        
        $placeObj = [ordered]@{
            "id" = $placeId
            "name" = $placeName
            "type" = $placeType
            "lat" = $lat
            "lon" = $lon
            "link" = $placeUri
        }
        
        if (-not $countries.ContainsKey($country)) {
            $countries[$country] = [System.Collections.ArrayList]@()
        }
        
        # Check if already contains this place ID to avoid duplicates
        $exists = $false
        foreach ($p in $countries[$country]) {
            if ($p.id -eq $placeId) {
                $exists = $true
                break
            }
        }
        
        if (-not $exists) {
            $null = $countries[$country].Add($placeObj)
            $totalCount++
        }
    }
}

# Sort places in each country alphabetically
$sortedCountries = [ordered]@{}
foreach ($key in ($countries.Keys | Sort-Object)) {
    $sortedList = $countries[$key] | Sort-Object { $_.name }
    $sortedCountries[$key] = $sortedList
}

$output = [ordered]@{
    "keyword" = $Keyword
    "total_count" = $totalCount
    "country_count" = $countries.Count
    "countries" = $sortedCountries
}

# Ensure data directory exists
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputDir = Join-Path $scriptDir "..\html\data"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

$jsonOutput = $output | ConvertTo-Json -Depth 100
$filename = "$($Keyword.ToLower().Trim().Replace(' ', '_')).json"
$outputPath = Join-Path $outputDir $filename
[System.IO.File]::WriteAllText($outputPath, $jsonOutput, [System.Text.Encoding]::UTF8)

Write-Host "[+] Saved data to $outputPath"
Write-Host "=========================================="
Write-Host "Keyword Search: '$Keyword'"
Write-Host "Total Places Found: $totalCount"
Write-Host "Total Countries: $($countries.Count)"
Write-Host "=========================================="
