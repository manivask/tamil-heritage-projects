#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Tamil History & Heritage Event Fetcher
Fetches historical events related to Tamil culture, Madras, Tamil Nadu, and heritage.
Supports events ranging from 8000 BCE (10,000 years ago) to the present day.
Fetches page images (thumbnails) directly from Wikipedia API.
"""

import os
import json
import urllib.request
import urllib.parse
import sys
import re

WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"

def fetch_thumbnails(titles, headers):
    """Fetches article thumbnails in batches from Wikipedia API."""
    if not titles:
        return {}
    
    thumbnails = {}
    # Batch titles (maximum 50 per batch allowed by Wikipedia API)
    batch_size = 40
    for i in range(0, len(titles), batch_size):
        batch_titles = list(titles)[i:i+batch_size]
        params = {
            "action": "query",
            "prop": "pageimages",
            "piprop": "thumbnail",
            "pithumbsize": 400,
            "titles": "|".join(batch_titles),
            "format": "json"
        }
        url = WIKIPEDIA_API_URL + "?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                pages = res_data.get("query", {}).get("pages", {})
                for page_id, page_data in pages.items():
                    title = page_data.get("title", "")
                    thumb_url = page_data.get("thumbnail", {}).get("source", "")
                    if title and thumb_url:
                        thumbnails[title] = thumb_url
        except Exception as e:
            print(f"[!] Error fetching thumbnails batch: {e}", file=sys.stderr)
            
    return thumbnails

def search_wikipedia_history():
    queries = [
        "Attirampakkam Paleolithic archaeology",
        "Stone age Tamil Nadu",
        "Neolithic Tamil Nadu",
        "Iron age Tamil Nadu",
        "Keezhadi excavation archaeology",
        "Sangam literature age",
        "Tolkaappiyam date",
        "Chola empire kings",
        "Pandya dynasty history",
        "Chera dynasty history",
        "Pallava dynasty temples",
        "Thiruvalluvar Thirukkural",
        "Silappatikaram epic",
        "Rajaraja Chola Tanjore",
        "Madras Presidency colonial",
        "Anti-Hindi agitations Tamil Nadu",
        "Thirumalai Nayak palace Madurai",
        "Veerapandiya Kattabomman rebellion",
        "Velu Nachiyar sivaganga",
        "Maruthu Pandiyar brothers British",
        "Subramania Bharati poet",
        "Kambar Ramavataram Tamil",
        "Bharathidasan poetry",
        "Manimekalai epic",
        "Civaka Cintamani epic",
        "Adichanallur archaeological site",
        "Kodumanal excavation findings",
        "Kaveripoompattinam port Chola",
        "Korkai Pandyan port",
        "Muziris Chera port",
        "Kumari Kandam lemuria theory",
        "U. V. Swaminatha Iyer Tamil manuscript",
        "Orissa Balu ocean current maritime",
        "Nammalvar organic farming Vanagam",
        "Dravidian languages family origin"
    ]
    
    events = []
    seen_titles = set()
    headers = {
        'User-Agent': 'TamilHistoryScale/3.0 (manivask@gmail.com) Python-urllib'
    }
    
    raw_results = []
    
    # 1. Scrape Wikipedia search results
    for q in queries:
        print(f"[*] Querying Wikipedia: '{q}'...")
        params = {
            "action": "query",
            "list": "search",
            "srsearch": q,
            "utf8": 1,
            "format": "json",
            "srlimit": 20
        }
        url = WIKIPEDIA_API_URL + "?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers=headers)
        
        try:
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                results = res_data.get("query", {}).get("search", [])
                
                for item in results:
                    title = item.get("title", "")
                    if title in seen_titles:
                        continue
                    seen_titles.add(title)
                    raw_results.append(item)
        except Exception as e:
            print(f"[!] Error querying: {e}", file=sys.stderr)
            
    # 2. Fetch page thumbnails in batch
    all_titles = {item.get("title") for item in raw_results if item.get("title")}
    print(f"[*] Fetching thumbnails for {len(all_titles)} unique articles...")
    thumbnails_map = fetch_thumbnails(all_titles, headers)
    
    # 3. Process search results
    for item in raw_results:
        title = item.get("title", "")
        snippet = item.get("snippet", "")
        clean_snippet = re.sub(r'<[^>]+>', '', snippet)
        
        # Deduce category
        category = "General History"
        lower_text = (title + " " + clean_snippet).lower()
        if any(x in lower_text for x in ["king", "ruler", "chola", "pandya", "pallava", "emperor", "dynasty", "rajendra"]):
            category = "Rulers & Kingdoms"
        elif any(x in lower_text for x in ["book", "poem", "literature", "poet", "author", "write", "sangam", "tolkappiyam", "epic"]):
            category = "Literature & Arts"
        elif any(x in lower_text for x in ["temple", "worship", "excavation", "archaeology", "keezhadi", "history", "heritage", "paleolithic", "stone age"]):
            category = "Culture & Heritage"
        elif any(x in lower_text for x in ["madras", "british", "colonial", "east india"]):
            category = "Colonial Era"
        
        # Parse year
        year = None
        
        # Match BC or BCE years
        bce_match = re.search(r'\b(\d{3,4})\s*B\.?C\.?E?\.?\b', clean_snippet, re.IGNORECASE)
        if bce_match:
            year = -int(bce_match.group(1))
        else:
            # Match CE years
            ce_match = re.search(r'\b(1\d{3}|20\d{2}|[5-9]\d{2})\b', clean_snippet)
            if ce_match:
                year = int(ce_match.group(1))
                
        # Default to approximate year if match fails but keywords indicate an era
        if year is None:
            if "attirampakkam" in lower_text or "paleolithic" in lower_text:
                year = -8000 # Map to start of our timeline scale (10,000 years back)
            elif "stone age" in lower_text:
                year = -5000
            elif "neolithic" in lower_text:
                year = -3000
            elif "keezhadi" in lower_text or "excavation" in lower_text:
                year = -580
            elif "sangam" in lower_text or "tolkappiyam" in lower_text:
                year = -300
            elif "rajaraja" in lower_text:
                year = 985
            else:
                continue
                
        event_obj = {
            "title": title,
            "description": clean_snippet,
            "year": year,
            "date": f"{year}-01-01" if year > 0 else f"BCE {abs(year)}",
            "category": category,
            "link": f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}",
            "image": thumbnails_map.get(title, "") # Append thumbnail if exists
        }
        events.append(event_obj)
        
    events.sort(key=lambda x: x["year"])
    return events

def main():
    events = search_wikipedia_history()
    
    # Curated, authoritative list of historical milestones spanning 10,000 years (8000 BCE to current)
    curated_timeline = [
        {
            "title": "Attirampakkam Paleolithic Site Findings",
            "description": "Archaeological excavations at Attirampakkam near Chennai show evidence of human activity and Acheulian stone tools dating back over 1.5 million years, making it one of the oldest Paleolithic sites in the world.",
            "year": -8000,
            "date": "BCE 8000 (Prehistory)",
            "category": "Culture & Heritage",
            "link": "https://en.wikipedia.org/wiki/Attirampakkam",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Hand_axe_attirampakkam.jpg/400px-Hand_axe_attirampakkam.jpg"
        },
        {
            "title": "Neolithic Settlements in Tamil Nadu",
            "description": "Emergence of early farming, pastoralism, and polished stone axes in the hills of northern Tamil Nadu, marking the transition from hunter-gatherers to village settlements.",
            "year": -3000,
            "date": "BCE 3000 (Neolithic Era)",
            "category": "Culture & Heritage",
            "link": "https://en.wikipedia.org/wiki/Stone_Age_in_India",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Neolithic_celts.jpg/400px-Neolithic_celts.jpg"
        },
        {
            "title": "Ancient Keezhadi Civilisation & Archaeological Findings",
            "description": "Carbon dating of artifacts excavated at Keezhadi reveals an urban civilization existing in Tamil Nadu during the Sangam era, dated back to the 6th century BCE.",
            "year": -580,
            "date": "BCE 580",
            "category": "Culture & Heritage",
            "link": "https://en.wikipedia.org/wiki/Keezhadi_excavation",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Keezhadi_excavation_site_pots.jpg/400px-Keezhadi_excavation_site_pots.jpg"
        },
        {
            "title": "Composition of Tolkāppiyam",
            "description": "Tolkāppiyam, the most ancient Tamil grammar book and a masterpiece of Tamil literature, is estimated to have been composed around the 3rd Century BCE.",
            "year": -300,
            "date": "BCE 300",
            "category": "Literature & Arts",
            "link": "https://en.wikipedia.org/wiki/Tolk%C4%81ppiyam",
            "image": ""
        },
        {
            "title": "Writing of Thirukkural by Thiruvalluvar",
            "description": "The classical Tamil language text consisting of 1,330 couplets (kurals) on ethics, love, and political economy, was authored by the poet-philosopher Thiruvalluvar.",
            "year": -31,
            "date": "BCE 31",
            "category": "Literature & Arts",
            "link": "https://en.wikipedia.org/wiki/Thirukkural",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Valluvar_Statue_by_Night.jpg/400px-Valluvar_Statue_by_Night.jpg"
        },
        {
            "title": "Karikala Chola Constructs the Grand Anicut (Kallanai)",
            "description": "The legendary Chola King Karikalan constructed the Grand Anicut dam across the Kaveri river, which remains one of the oldest water-regulation structures still in use today.",
            "year": 150,
            "date": "150 CE",
            "category": "Rulers & Kingdoms",
            "link": "https://en.wikipedia.org/wiki/Kallanai",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Kallanai_Dam_in_Trichy.jpg/400px-Kallanai_Dam_in_Trichy.jpg"
        },
        {
            "title": "Rajaraja Chola I Ascends the Throne",
            "description": "Rajaraja I became the Chola emperor, initiating a golden era of military expansion, naval power, and temple architecture, including building Brihadisvara Temple.",
            "year": 985,
            "date": "985 CE",
            "category": "Rulers & Kingdoms",
            "link": "https://en.wikipedia.org/wiki/Rajaraja_I",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Rajaraja_Chola_Portrait.jpg/400px-Rajaraja_Chola_Portrait.jpg"
        },
        {
            "title": "Consecration of Thanjavur Brihadisvara Temple",
            "description": "The massive Hindu temple dedicated to Shiva was consecrated by Rajaraja Chola I, showcasing the height of Dravidian architecture.",
            "year": 1010,
            "date": "1010 CE",
            "category": "Culture & Heritage",
            "link": "https://en.wikipedia.org/wiki/Brihadisvara_Temple,_Thanjavur",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Brihadisvara_Temple%2C_Thanjavur.jpg/400px-Brihadisvara_Temple%2C_Thanjavur.jpg"
        },
        {
            "title": "Rajendra Chola's Southeast Asian Naval Expedition",
            "description": "Emperor Rajendra Chola I launched naval raids against the Srivijaya kingdom in modern-day Indonesia and Malaysia, establishing Chola influence in Southeast Asia.",
            "year": 1025,
            "date": "1025 CE",
            "category": "Rulers & Kingdoms",
            "link": "https://en.wikipedia.org/wiki/Chola_expedition_to_Srivijaya",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Rajendra_Chola_Gangaikondacholapuram_sculpture.jpg/400px-Rajendra_Chola_Gangaikondacholapuram_sculpture.jpg"
        }
    ]
    
    # Merge, duplicate checks, and save
    for item in curated_timeline:
        # Check if already in events list, replace if local version is richer
        existing_index = next((i for i, e in enumerate(events) if e["title"].lower() == item["title"].lower()), None)
        if existing_index is not None:
            # Overwrite with richer curated entry
            events[existing_index] = item
        else:
            events.append(item)
            
    events.sort(key=lambda x: x["year"])
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.abspath(os.path.join(script_dir, "..", "data"))
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, "events.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
        
    print(f"\n[+] Successfully saved {len(events)} events to {output_path}")

if __name__ == "__main__":
    main()
