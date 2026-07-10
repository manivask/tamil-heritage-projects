#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Wikidata Geographic Place Extractor
Extracts global places matching a keyword name, groups them by country,
and saves them as structured JSON files for web visualization.
"""

import os
import sys
import json
import urllib.request
import urllib.parse
import argparse

# SPARQL query template to search Wikidata for places containing a name
WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

SPARQL_QUERY_TEMPLATE = """
SELECT DISTINCT ?place ?placeLabel ?coords ?countryLabel ?typeLabel WHERE {{
  # Search using Wikidata's search service index
  SERVICE wikibase:mwapi {{
    bd:serviceParam wikibase:endpoint "www.wikidata.org" .
    bd:serviceParam wikibase:api "EntitySearch" .
    bd:serviceParam mwapi:search "{keyword}" .
    bd:serviceParam mwapi:language "en" .
    ?place wikibase:apiOutputItem mwapi:item .
  }}
  
  # Filter coordinates
  ?place wdt:P625 ?coords .
  
  # English label
  ?place rdfs:label ?placeLabel .
  FILTER (LANG(?placeLabel) = "en")
  
  # Optional: country relationship
  OPTIONAL {{
    ?place wdt:P17 ?country .
    ?country rdfs:label ?countryLabel .
    FILTER (LANG(?countryLabel) = "en")
  }}
  
  # Optional: instance of (place type)
  OPTIONAL {{
    ?place wdt:P31 ?type .
    ?type rdfs:label ?typeLabel .
    FILTER (LANG(?typeLabel) = "en")
  }}
}}
LIMIT 2000
"""

def search_wikidata(keyword):
    """Queries Wikidata for places matching the keyword."""
    print(f"[*] Querying Wikidata for places containing: '{keyword}'...")
    
    query = SPARQL_QUERY_TEMPLATE.format(keyword=keyword.lower())
    params = {
        'query': query,
        'format': 'json'
    }
    url = WIKIDATA_SPARQL_ENDPOINT + "?" + urllib.parse.urlencode(params)
    
    req = urllib.request.Request(
        url, 
        headers={
            # Wikidata requires a descriptive User-Agent or it blocks requests
            'User-Agent': 'TamilGeographicFootprints/1.0 (maniv@example.com) Python-urllib'
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return parse_wikidata_results(data, keyword)
    except Exception as e:
        print(f"[!] Error querying Wikidata: {e}", file=sys.stderr)
        return None

def parse_wikidata_results(data, keyword):
    """Parses raw SPARQL response into a clean, grouped structure."""
    bindings = data.get("results", {}).get("bindings", [])
    print(f"[*] Raw results received: {len(bindings)}")
    
    grouped_data = {
        "keyword": keyword,
        "total_count": 0,
        "country_count": 0,
        "countries": {}
    }
    
    seen_places = set()  # Avoid duplicates
    
    for bind in bindings:
        place_uri = bind.get("place", {}).get("value", "")
        # Extract Wikidata ID from URI
        place_id = place_uri.split('/')[-1] if place_uri else ""
        
        if place_id in seen_places:
            continue
            
        place_name = bind.get("placeLabel", {}).get("value", "")
        coord_val = bind.get("coords", {}).get("value", "")
        country = bind.get("countryLabel", {}).get("value", "Unknown Country")
        place_type = bind.get("typeLabel", {}).get("value", "Geographical Feature")
        
        # Parse coords: Point(longitude latitude)
        if not coord_val or not coord_val.startswith("Point("):
            continue
            
        try:
            # Point(-73.9 40.7) -> longitude, latitude
            coords_clean = coord_val.replace("Point(", "").replace(")", "").strip()
            parts = coords_clean.split()
            if len(parts) != 2:
                continue
            lon = float(parts[0])
            lat = float(parts[1])
        except ValueError:
            continue
            
        seen_places.add(place_id)
        
        place_obj = {
            "id": place_id,
            "name": place_name,
            "type": place_type,
            "lat": lat,
            "lon": lon,
            "link": place_uri
        }
        
        if country not in grouped_data["countries"]:
            grouped_data["countries"][country] = []
            
        grouped_data["countries"][country].append(place_obj)
    
    # Calculate stats
    grouped_data["total_count"] = len(seen_places)
    grouped_data["country_count"] = len(grouped_data["countries"])
    
    # Sort places in each country alphabetically by name
    for country in grouped_data["countries"]:
        grouped_data["countries"][country].sort(key=lambda x: x["name"])
        
    return grouped_data

def save_and_report(data, output_dir):
    """Saves output JSON file and prints summary to console."""
    if not data or data["total_count"] == 0:
        print("[!] No places found to save.")
        return
        
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{data['keyword'].lower().strip().replace(' ', '_')}.json"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"\n[+] Success! Data saved to: {filepath}")
    print("=" * 60)
    print(f"Keyword Search: '{data['keyword']}'")
    print(f"Total Places Found: {data['total_count']}")
    print(f"Total Countries: {data['country_count']}")
    print("-" * 60)
    
    # Sort countries by count descending for printing
    sorted_countries = sorted(
        data["countries"].items(), 
        key=lambda item: len(item[1]), 
        reverse=True
    )
    
    for country, places in sorted_countries:
        print(f" - {country}: {len(places)} place(s)")
        for p in places[:3]:  # Print first 3 as examples
            print(f"    * {p['name']} ({p['type']}) @ [{p['lat']:.4f}, {p['lon']:.4f}]")
        if len(places) > 3:
            print(f"    * ... and {len(places) - 3} more")
            
    print("=" * 60)

def main():
    parser = argparse.ArgumentParser(description="Extract places from Wikidata matching a pattern.")
    parser.add_argument("keyword", type=str, nargs="?", default="Palani", help="Keyword to search (default: Palani)")
    parser.add_argument("--outdir", type=str, default=None, help="Directory to save output JSON files")
    args = parser.parse_args()
    
    keyword = args.keyword
    
    # Resolve default output directory to '../../html/data' relative to this script
    if args.outdir:
        output_dir = args.outdir
    else:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_dir = os.path.abspath(os.path.join(script_dir, "..", "html", "data"))
        
    data = search_wikidata(keyword)
    if data:
        save_and_report(data, output_dir)
    else:
        print("[!] Failed to extract data.")

if __name__ == "__main__":
    main()
