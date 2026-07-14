#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Wikidata Subdivisions Extractor for Tamil Nadu
Extracts:
1. Districts of Tamil Nadu
2. Revenue Divisions / Sub-districts
3. Taluks of Tamil Nadu
4. Legislative Assembly Constituencies of Tamil Nadu
5. Lok Sabha Constituencies of Tamil Nadu
Saves them into HTML data directory as subdivisions.json.
"""

import json
import urllib.request
import urllib.parse
import sys

WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

# SPARQL query to get all subdivisions, administrative units, and constituencies in Tamil Nadu
SPARQL_QUERY = """
SELECT DISTINCT ?item ?itemLabel ?itemLabelTa ?type WHERE {
  {
    # 1. Districts of Tamil Nadu
    ?item wdt:P31 wd:Q1958611 .
    ?item wdt:P131 wd:Q1445 .
    BIND("District" AS ?type)
  } UNION {
    # 2. Taluks of Tamil Nadu
    ?item wdt:P31/wdt:P279* wd:Q10861138 .
    ?item wdt:P131+ wd:Q1445 .
    BIND("Taluk" AS ?type)
  } UNION {
    # 3. Assembly Constituencies of Tamil Nadu
    ?item wdt:P31 wd:Q3534571 .
    BIND("Assembly Constituency" AS ?type)
  } UNION {
    # 4. Lok Sabha Constituencies in Tamil Nadu
    ?item wdt:P31 wd:Q5164287 .
    ?item wdt:P17 wd:Q668 . # India
    # Located in or represents Tamil Nadu
    { ?item wdt:P131 wd:Q1445 . } UNION { ?item wdt:P131/wdt:P131 wd:Q1445 . }
    BIND("Lok Sabha Constituency" AS ?type)
  } UNION {
    # 5. Revenue Divisions of Tamil Nadu (often styled as subdivision of India)
    ?item wdt:P31 wd:Q2634351 .
    ?item wdt:P131+ wd:Q1445 .
    BIND("Revenue Division" AS ?type)
  }
  
  # Fetch English label
  ?item rdfs:label ?itemLabel .
  FILTER(LANG(?itemLabel) = "en")
  
  # Fetch Optional Tamil label
  OPTIONAL {
    ?item rdfs:label ?itemLabelTa .
    FILTER(LANG(?itemLabelTa) = "ta")
  }
}
ORDER BY ?type ?itemLabel
"""

def fetch_subdivisions():
    print("[*] Contacting Wikidata SPARQL endpoint...")
    params = {
        'query': SPARQL_QUERY,
        'format': 'json'
    }
    url = WIKIDATA_SPARQL_ENDPOINT + "?" + urllib.parse.urlencode(params)
    
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'TamilGeographicFootprints/2.0 (manivask@gmail.com) Python-urllib'
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            bindings = data.get("results", {}).get("bindings", [])
            print(f"[+] Retrieved {len(bindings)} total records from Wikidata.")
            
            subdivisions = []
            seen_ids = set()
            
            for bind in bindings:
                item_uri = bind.get("item", {}).get("value", "")
                item_id = item_uri.split('/')[-1] if item_uri else ""
                
                # Deduplicate by item ID and type
                key = (item_id, bind.get("type", {}).get("value", ""))
                if not item_id or key in seen_ids:
                    continue
                seen_ids.add(key)
                
                en_name = bind.get("itemLabel", {}).get("value", "")
                ta_name = bind.get("itemLabelTa", {}).get("value", "")
                stype = bind.get("type", {}).get("value", "")
                
                # Standardize names: clean up "assembly constituency", "district", etc. if appended
                en_clean = en_name.replace(" Assembly constituency", "").replace(" District", "").replace(" district", "").replace(" Lok Sabha constituency", "")
                
                # If Tamil label is missing, fallback to English label
                if not ta_name:
                    ta_name = en_clean
                    
                subdivisions.append({
                    "id": en_clean.lower().replace(" ", "_"),
                    "en": en_clean,
                    "ta": ta_name,
                    "type": stype,
                    "search_term": en_clean
                })
                
            # Add back heritage terms for consistency
            heritage_terms = [
                {"id": "palani", "en": "Palani", "ta": "பழனி", "type": "Heritage Location", "search_term": "Palani"},
                {"id": "salam", "en": "Salem / Salam", "ta": "சேலம்", "type": "Heritage Location", "search_term": "Salem"},
                {"id": "pandi", "en": "Pandi", "ta": "பாண்டி", "type": "Heritage Location", "search_term": "Pandi"},
                {"id": "kanchi", "en": "Kanchi", "ta": "காஞ்சி", "type": "Heritage Location", "search_term": "Kanchipuram"},
                {"id": "chola", "en": "Chola", "ta": "சோழா", "type": "Heritage Location", "search_term": "Chola"}
            ]
            
            subdivisions = heritage_terms + subdivisions
            
            # Sort final list by English name (except heritage items at the top)
            heritage_len = len(heritage_terms)
            sorted_body = sorted(subdivisions[heritage_len:], key=lambda x: (x["type"], x["en"]))
            final_list = heritage_terms + sorted_body
            
            import os
            script_dir = os.path.dirname(os.path.abspath(__file__))
            output_file = os.path.join(script_dir, "..", "data", "subdivisions.json")
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(final_list, f, ensure_ascii=False, indent=2)
                
            print(f"[+] Saved {len(final_list)} entries to {output_file}")
            
    except Exception as e:
        print(f"[!] Error fetching subdivisions: {e}", file=sys.stderr)

if __name__ == "__main__":
    fetch_subdivisions()
