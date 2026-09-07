#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Fetch, structure, and save Thirukkural data with sections, chapters, and explanations.
Downloads from nramc/thirukkural-api and saves to html/data/thirukkural.json.
"""

import urllib.request
import json
import os
import sys

def main():
    url = "https://raw.githubusercontent.com/nramc/thirukkural-api/master/public/data/kurals.json"
    print(f"[*] Downloading structured Thirukkural dataset from: {url}...")
    
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
        # The data is a dict with key 'kurals'
        kurals = data.get("kurals", [])
        print(f"[+] Downloaded {len(kurals)} kurals successfully.")
        
        # Verify count
        if len(kurals) != 1330:
            print(f"[!] Warning: Kural count is {len(kurals)} instead of 1330.")
            
        # Ensure target directory exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_dir = os.path.abspath(os.path.join(script_dir, "..", "data"))
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, "thirukkural.json")
        
        # Save structured JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"[+] Successfully saved {len(kurals)} kurals to: {output_path}")
        
    except Exception as e:
        print(f"[!] Error fetching/formatting dataset: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
