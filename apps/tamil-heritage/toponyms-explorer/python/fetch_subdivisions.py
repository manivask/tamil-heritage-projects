#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Wikidata Subdivisions Extractor for Tamil Nadu (Sequential Querying)
Extracts:
1. Districts of Tamil Nadu
2. Taluks of Tamil Nadu
3. Legislative Assembly Constituencies of Tamil Nadu
4. Lok Sabha Constituencies of Tamil Nadu
Saves them into HTML data directory as subdivisions.json.
"""

import json
import urllib.request
import urllib.parse
import sys
import os

WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

QUERIES = {
    "District": """
SELECT DISTINCT ?item ?itemLabel ?itemLabelTa WHERE {
  ?item wdt:P31 wd:Q1149652 .
  ?item wdt:P131 wd:Q1445 .
  ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = "en")
  OPTIONAL { ?item rdfs:label ?itemLabelTa . FILTER(LANG(?itemLabelTa) = "ta") }
}
""",
    "Taluk": """
SELECT DISTINCT ?item ?itemLabel ?itemLabelTa WHERE {
  ?item wdt:P31 wd:Q122987736 .
  ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = "en")
  OPTIONAL { ?item rdfs:label ?itemLabelTa . FILTER(LANG(?itemLabelTa) = "ta") }
}
""",
    "Assembly Constituency": """
SELECT DISTINCT ?item ?itemLabel ?itemLabelTa WHERE {
  ?item wdt:P31 wd:Q54375510 .
  ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = "en")
  OPTIONAL { ?item rdfs:label ?itemLabelTa . FILTER(LANG(?itemLabelTa) = "ta") }
}
""",
    "Lok Sabha Constituency": """
SELECT DISTINCT ?item ?itemLabel ?itemLabelTa WHERE {
  ?item wdt:P31 wd:Q47481352 .
  ?item wdt:P131 wd:Q1445 .
  ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = "en")
  OPTIONAL { ?item rdfs:label ?itemLabelTa . FILTER(LANG(?itemLabelTa) = "ta") }
}
"""
}

def query_wikidata(sparql_query):
    params = {
        'query': sparql_query,
        'format': 'json'
    }
    url = WIKIDATA_SPARQL_ENDPOINT + "?" + urllib.parse.urlencode(params)
    
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'TamilGeographicFootprints/2.0 (manivask@gmail.com) Python-urllib'
        }
    )
    
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def fetch_subdivisions():
    subdivisions = []
    seen_ids = set()
    
    # 1. Add Heritage locations first
    heritage_terms = [
        {"id": "palani", "en": "Palani", "ta": "பழனி", "type": "Heritage Location", "search_term": "Palani"},
        {"id": "salam", "en": "Salem / Salam", "ta": "சேலம்", "type": "Heritage Location", "search_term": "Salem"},
        {"id": "pandi", "en": "Pandi", "ta": "பாண்டி", "type": "Heritage Location", "search_term": "Pandi"},
        {"id": "kanchi", "en": "Kanchi", "ta": "காஞ்சி", "type": "Heritage Location", "search_term": "Kanchipuram"},
        {"id": "chola", "en": "Chola", "ta": "சோழா", "type": "Heritage Location", "search_term": "Chola"}
    ]
    subdivisions.extend(heritage_terms)
    
    temp_list = []
    
    for category, query in QUERIES.items():
        print(f"[*] Contacting Wikidata for category: {category}...")
        try:
            raw_data = query_wikidata(query)
            bindings = raw_data.get("results", {}).get("bindings", [])
            print(f"    [+] Found {len(bindings)} records.")
            
            for bind in bindings:
                item_uri = bind.get("item", {}).get("value", "")
                item_id = item_uri.split('/')[-1] if item_uri else ""
                
                key = (item_id, category)
                if not item_id or key in seen_ids:
                    continue
                seen_ids.add(key)
                
                en_name = bind.get("itemLabel", {}).get("value", "")
                ta_name = bind.get("itemLabelTa", {}).get("value", "")
                
                # Standardize names: clean up suffixes
                en_clean = en_name.replace(" Assembly constituency", "").replace(" District", "").replace(" district", "").replace(" Lok Sabha constituency", "").replace(" taluk", "").replace(" Taluk", "")
                
                if not ta_name:
                    ta_name = en_clean
                    
                temp_list.append({
                    "id": en_clean.lower().replace(" ", "_"),
                    "en": en_clean,
                    "ta": ta_name,
                    "type": category,
                    "search_term": en_clean
                })
        except Exception as e:
            print(f"[!] Error fetching category {category}: {e}", file=sys.stderr)
            
    # Sort non-heritage items by type and English name
    sorted_temp = sorted(temp_list, key=lambda x: (x["type"], x["en"]))
    subdivisions.extend(sorted_temp)
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(script_dir, "..", "data", "subdivisions.json")
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(subdivisions, f, ensure_ascii=False, indent=2)
        
    print(f"[+] Saved {len(subdivisions)} entries to {output_file}")

if __name__ == "__main__":
    fetch_subdivisions()
