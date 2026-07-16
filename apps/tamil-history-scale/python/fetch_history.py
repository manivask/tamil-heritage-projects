#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Tamil History & Heritage Event Fetcher
Fetches historical events related to Tamil culture, Madras, Tamil Nadu, and heritage.
Supports events ranging from 3000 BCE (5000 years ago) to the present day.
"""

import os
import json
import urllib.request
import urllib.parse
import sys
import re

WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"

def search_wikipedia_history():
    # Focused queries covering different eras in the 5,000-year timeline
    queries = [
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
        "Anti-Hindi agitations Tamil Nadu"
    ]
    
    events = []
    seen_titles = set()
    headers = {
        'User-Agent': 'TamilHistoryScale/2.0 (manivask@gmail.com) Python-urllib'
    }
    
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
                    
                    snippet = item.get("snippet", "")
                    clean_snippet = re.sub(r'<[^>]+>', '', snippet)
                    
                    # Deduce category
                    category = "General History"
                    lower_text = (title + " " + clean_snippet).lower()
                    if any(x in lower_text for x in ["king", "ruler", "chola", "pandya", "pallava", "emperor", "dynasty", "rajendra"]):
                        category = "Rulers & Kingdoms"
                    elif any(x in lower_text for x in ["book", "poem", "literature", "poet", "author", "write", "sangam", "tolkappiyam", "epic"]):
                        category = "Literature & Arts"
                    elif any(x in lower_text for x in ["temple", "worship", "excavation", "archaeology", "keezhadi", "history", "heritage"]):
                        category = "Culture & Heritage"
                    elif any(x in lower_text for x in ["madras", "british", "colonial", "east india"]):
                        category = "Colonial Era"
                    
                    # Try to extract a year from the snippet or title
                    year = None
                    
                    # Match "BC" or "BCE" years (e.g., 300 BC, 500 BCE)
                    bce_match = re.search(r'\b(\d{3,4})\s*B\.?C\.?E?\.?\b', clean_snippet, re.IGNORECASE)
                    if bce_match:
                        year = -int(bce_match.group(1))
                    else:
                        # Match CE years (e.g. 1900, 1010, 1947)
                        ce_match = re.search(r'\b(1\d{3}|20\d{2}|[5-9]\d{2})\b', clean_snippet)
                        if ce_match:
                            year = int(ce_match.group(1))
                            
                    # Default to approximate year if match fails but keyword indicates an era
                    if year is None:
                        if "keezhadi" in lower_text or "excavation" in lower_text:
                            year = -580  # Keezhadi carbon dating
                        elif "sangam" in lower_text or "tolkappiyam" in lower_text:
                            year = -300
                        elif "rajaraja" in lower_text:
                            year = 985
                        else:
                            continue # Skip events without clear time association
                            
                    event_obj = {
                        "title": title,
                        "description": clean_snippet,
                        "year": year,
                        "date": f"{year}-01-01" if year > 0 else f"BCE {abs(year)}",
                        "category": category,
                        "link": f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
                    }
                    events.append(event_obj)
        except Exception as e:
            print(f"[!] Error querying: {e}", file=sys.stderr)
            
    return events

def main():
    events = search_wikipedia_history()
    
    # Curated, authoritative list of historical milestones spanning 5,000 years (3000 BCE to current)
    curated_timeline = [
        {
            "title": "Ancient Keezhadi Civilisation & Archaeological Findings",
            "description": "Carbon dating of artifacts excavated at Keezhadi reveals an urban civilization existing in Tamil Nadu during the Sangam era, dated back to the 6th century BCE.",
            "year": -580,
            "date": "BCE 580",
            "category": "Culture & Heritage",
            "link": "https://en.wikipedia.org/wiki/Keezhadi_excavation"
        },
        {
            "title": "Composition of Tolkāppiyam",
            "description": "Tolkāppiyam, the most ancient Tamil grammar book and a masterpiece of Tamil literature, is estimated to have been composed around the 3rd Century BCE.",
            "year": -300,
            "date": "BCE 300",
            "category": "Literature & Arts",
            "link": "https://en.wikipedia.org/wiki/Tolk%C4%81ppiyam"
        },
        {
            "title": "Writing of Thirukkural by Thiruvalluvar",
            "description": "The classical Tamil language text consisting of 1,330 couplets (kurals) on ethics, love, and political economy, was authored by the poet-philosopher Thiruvalluvar.",
            "year": -31,
            "date": "BCE 31",
            "category": "Literature & Arts",
            "link": "https://en.wikipedia.org/wiki/Thirukkural"
        },
        {
            "title": "Karikala Chola Constructs the Grand Anicut (Kallanai)",
            "description": "The legendary Chola King Karikalan constructed the Grand Anicut dam across the Kaveri river, which remains one of the oldest water-regulation structures still in use today.",
            "year": 150,
            "date": "150 CE",
            "category": "Rulers & Kingdoms",
            "link": "https://en.wikipedia.org/wiki/Kallanai"
        },
        {
            "title": "Socio-political Era of Sangam Landscape",
            "description": "Early Tamil society was divided into five distinct ecological regions (Ainthinai): Kurinji, Mullai, Marutham, Neithal, and Palai, defining lifestyle and culture.",
            "year": -400,
            "date": "BCE 400",
            "category": "Culture & Heritage",
            "link": "https://en.wikipedia.org/wiki/Sangam_landscape"
        },
        {
            "title": "Rajaraja Chola I Ascends the Throne",
            "description": "Rajaraja I became the Chola emperor, initiating a golden era of military expansion, naval power, and temple architecture, including building Brihadisvara Temple.",
            "year": 985,
            "date": "985 CE",
            "category": "Rulers & Kingdoms",
            "link": "https://en.wikipedia.org/wiki/Rajaraja_I"
        },
        {
            "title": "Consecration of Thanjavur Brihadisvara Temple",
            "description": "The massive Hindu temple dedicated to Shiva was consecrated by Rajaraja Chola I, showcasing the height of Dravidian architecture.",
            "year": 1010,
            "date": "1010 CE",
            "category": "Culture & Heritage",
            "link": "https://en.wikipedia.org/wiki/Brihadisvara_Temple,_Thanjavur"
        },
        {
            "title": "Rajendra Chola's Southeast Asian Naval Expedition",
            "description": "Emperor Rajendra Chola I launched naval raids against the Srivijaya kingdom in modern-day Indonesia and Malaysia, establishing Chola influence in Southeast Asia.",
            "year": 1025,
            "date": "1025 CE",
            "category": "Rulers & Kingdoms",
            "link": "https://en.wikipedia.org/wiki/Chola_expedition_to_Srivijaya"
        },
        {
            "title": "Writing of Silappatikaram by Ilango Adigal",
            "description": "The earliest Tamil epic, Silappatikaram, detailing the tragic story of Kannagi and Kovalan, was composed, reflecting ancient Tamil society's morals.",
            "year": 250,
            "date": "250 CE",
            "category": "Literature & Arts",
            "link": "https://en.wikipedia.org/wiki/Silappatikaram"
        },
        {
            "title": "Founding of Madras (Chennai)",
            "description": "The British East India Company purchased the strip of land from local Vijayanagar governors, founding Fort St. George and establishing Madras.",
            "year": 1639,
            "date": "1639 CE",
            "category": "Colonial Era",
            "link": "https://en.wikipedia.org/wiki/Chennai"
        },
        {
            "title": "Introduction of the Tamil Printing Press",
            "description": "The first book in Tamil, Thambiran Vanakkam, was printed in Coulam (Kollam) by Jesuit missionary Henrique Henriques, making Tamil the first non-European language to be printed.",
            "year": 1578,
            "date": "1578 CE",
            "category": "Literature & Arts",
            "link": "https://en.wikipedia.org/wiki/Henrique_Henriques"
        }
    ]
    
    # Merge, deduplicate, and sort by year
    for item in curated_timeline:
        if not any(e["title"].lower() == item["title"].lower() for e in events):
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
