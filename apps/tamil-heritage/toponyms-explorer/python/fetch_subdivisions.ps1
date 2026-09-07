# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
# Optimized PowerShell script to extract Tamil Nadu subdivisions sequentially with correct Wikidata QIDs.

$ErrorActionPreference = "Stop"

$queries = @{
    "District" = @"
SELECT DISTINCT ?item ?itemLabel ?itemLabelTa WHERE {
  ?item wdt:P31 wd:Q1149652 .
  ?item wdt:P131 wd:Q1445 .
  ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = "en")
  OPTIONAL { ?item rdfs:label ?itemLabelTa . FILTER(LANG(?itemLabelTa) = "ta") }
}
"@
    "Taluk" = @"
SELECT DISTINCT ?item ?itemLabel ?itemLabelTa WHERE {
  ?item wdt:P31 wd:Q122987736 .
  ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = "en")
  OPTIONAL { ?item rdfs:label ?itemLabelTa . FILTER(LANG(?itemLabelTa) = "ta") }
}
"@
    "Assembly Constituency" = @"
SELECT DISTINCT ?item ?itemLabel ?itemLabelTa WHERE {
  ?item wdt:P31 wd:Q54375510 .
  ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = "en")
  OPTIONAL { ?item rdfs:label ?itemLabelTa . FILTER(LANG(?itemLabelTa) = "ta") }
}
"@
    "Lok Sabha Constituency" = @"
SELECT DISTINCT ?item ?itemLabel ?itemLabelTa WHERE {
  ?item wdt:P31 wd:Q47481352 .
  ?item wdt:P131 wd:Q1445 .
  ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = "en")
  OPTIONAL { ?item rdfs:label ?itemLabelTa . FILTER(LANG(?itemLabelTa) = "ta") }
}
"@
}

$endpoint = "https://query.wikidata.org/sparql"
$headers = @{
    "User-Agent" = "TamilGeographicFootprints/2.0 (manivask@gmail.com) PowerShell-InvokeWebRequest"
    "Accept" = "application/sparql-results+json"
}

$subdivisions = [System.Collections.Generic.List[Object]]::new()
$seen = @{}

# 1. Add Heritage locations first
$heritage = @(
    [PSCustomObject]@{ id = "palani"; en = "Palani"; ta = "பழனி"; type = "Heritage Location"; search_term = "Palani" }
    [PSCustomObject]@{ id = "salam"; en = "Salem / Salam"; ta = "சேலம்"; type = "Heritage Location"; search_term = "Salem" }
    [PSCustomObject]@{ id = "pandi"; en = "Pandi"; ta = "பாண்டி"; type = "Heritage Location"; search_term = "Pandi" }
    [PSCustomObject]@{ id = "kanchi"; en = "Kanchi"; ta = "காஞ்சி"; type = "Heritage Location"; search_term = "Kanchipuram" }
    [PSCustomObject]@{ id = "chola"; en = "Chola"; ta = "சோழா"; type = "Heritage Location"; search_term = "Chola" }
)
foreach ($h in $heritage) {
    $subdivisions.Add($h)
}

# 2. Query each category sequentially
$tempList = [System.Collections.Generic.List[Object]]::new()

foreach ($key in $queries.Keys) {
    Write-Host "[*] Querying Wikidata for category: $key..."
    $query = $queries[$key]
    $uri = $endpoint + "?query=" + [Uri]::EscapeDataString($query) + "&format=json"
    
    try {
        $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
        $bindings = $response.results.bindings
        Write-Host "    [+] Found $($bindings.Count) records."
        
        foreach ($bind in $bindings) {
            $item_uri = $bind.item.value
            $item_id = $item_uri.Split('/')[-1]
            
            $seenKey = "$item_id-$key"
            if ($seen.ContainsKey($seenKey)) { continue }
            $seen[$seenKey] = $true
            
            $en_name = $bind.itemLabel.value
            $ta_name = if ($bind.itemLabelTa) { $bind.itemLabelTa.value } else { "" }
            
            # Clean names: strip common suffixes for cleaner display in combobox
            $en_clean = $en_name.Replace(" Assembly constituency", "").Replace(" District", "").Replace(" district", "").Replace(" Lok Sabha constituency", "").Replace(" taluk", "").Replace(" Taluk", "")
            
            if ([string]::IsNullOrEmpty($ta_name)) {
                $ta_name = $en_clean
            }
            
            $tempList.Add([PSCustomObject]@{
                id = $en_clean.ToLower().Replace(" ", "_")
                en = $en_clean
                ta = $ta_name
                type = $key
                search_term = $en_clean
            })
        }
    } catch {
        Write-Warning "Failed to query category $($key): $($_.Exception.Message)"
    }
}

# Sort non-heritage items by Type and English Name
$sortedTemp = $tempList | Sort-Object type, en
foreach ($item in $sortedTemp) {
    $subdivisions.Add($item)
}

$outputDir = Join-Path $PSScriptRoot "../data"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

$outputPath = Join-Path $outputDir "subdivisions.json"
$subdivisions | ConvertTo-Json -Depth 4 | Out-File -FilePath $outputPath -Encoding utf8

Write-Host "[+] Saved $($subdivisions.Count) entries to $outputPath"
