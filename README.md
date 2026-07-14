<!-- Script Designer / AI Prompt Engineer : Manivasagam Karunakaran -->
# Thirukkural Facts Finder & Global Tamil Toponyms Explorer Portal

This workspace contains a portal page and multiple web applications organized under the `apps/` directory for clean modularity, making it ready for GitHub.

## Workspace Structure

```
c:\Users\maniv\all_ide_code_ws\
├── apps/
│   ├── thirukkural-facts-finder/
│   │   ├── css/facts.css               # Styles for Facts Finder
│   │   ├── js/facts_app.js             # Core Logic for Facts Finder
│   │   ├── data/thirukkural.json       # Couplet dataset
│   │   ├── python/                     # Scraping and verification scripts
│   │   │   ├── fetch_kurals.py
│   │   │   └── verify_kurals.py
│   │   └── index.html                  # Thirukkural Facts Finder App
│   │
│   ├── toponyms-explorer/
│   │   ├── css/styles.css              # Custom Map Styles
│   │   ├── js/app.js                   # Leaflet Map & Wikidata Query Logic
│   │   ├── data/                       # Pre-extracted JSON place datasets
│   │   │   ├── palani.json
│   │   │   └── salam.json
│   │   ├── python/                     # Toponyms SPARQL extractors
│   │   │   ├── extract.py
│   │   │   ├── extract.ps1
│   │   │   ├── fetch_subdivisions.py
│   │   │   └── fetch_subdivisions.ps1
│   │   └── index.html                  # Global Toponyms Explorer App
│   │
│   ├── biographies/
│   │   ├── images/                     # Dynamic downloaded biography images
│   │   ├── thiruvalluvar.png
│   │   ├── nammalvar.html              # Nammalvar Slideshow biography
│   │   └── orissa_balu.html            # Orissa Balu Slideshow biography
│   │
│   └── content-extractor/
│       ├── python/                     # Server backend and utility scripts
│       │   ├── extractor_server.py
│       │   ├── web_scraper.py
│       │   └── youtube_transcriber.py
│       └── index.html                  # Extractor Tool UI
│
├── index.html                          # Main Portal page linking all apps
└── README.md                           # This documentation file
```

---

## How to Run

### 1. View the Apps
- **Main Portal**: Open **[index.html](file:///c:/Users/maniv/all_ide_code_ws/index.html)** in any modern web browser to access all projects.
- **Thirukkural Facts Finder**: Open **[apps/thirukkural-facts-finder/index.html](file:///c:/Users/maniv/all_ide_code_ws/apps/thirukkural-facts-finder/index.html)** directly.
- **Global Tamil Toponyms Explorer**: Open **[apps/toponyms-explorer/index.html](file:///c:/Users/maniv/all_ide_code_ws/apps/toponyms-explorer/index.html)** directly.

### 2. Extract New Name Datasets
If you want to extract names globally and pre-load them in the HTML dropdown:

#### Option A: Using PowerShell (No installation needed on Windows!)
Navigate to the directory and run:
```powershell
cd apps/toponyms-explorer/python
powershell -ExecutionPolicy Bypass -File extract.ps1 <keyword>
```
*Example:*
```powershell
powershell -ExecutionPolicy Bypass -File extract.ps1 Madurai
```
This searches Wikidata and saves `madurai.json` to the `apps/toponyms-explorer/data/` folder.

#### Option B: Using Python
Navigate to the directory and run:
```bash
cd apps/toponyms-explorer/python
python extract.py <keyword>
```
*Example:*
```bash
python extract.py Chola
```
This writes the corresponding JSON file directly into the local `data/` folder.

---

## Technical Details

The query interface leverages **Wikidata SPARQL (WDQS)**. To prevent query timeouts, the search has been highly optimized using Wikidata's **MediaWiki Search Service (`EntitySearch`)** which runs on their index in milliseconds, rather than doing database-wide regex scans:

```sparql
SERVICE wikibase:mwapi {
  bd:serviceParam wikibase:endpoint "www.wikidata.org" .
  bd:serviceParam wikibase:api "EntitySearch" .
  bd:serviceParam mwapi:search "palani" .
  bd:serviceParam mwapi:language "en" .
  ?place wikibase:apiOutputItem mwapi:item .
}
```
This query is run natively in both extractors and directly in your browser (`app.js`) when executing a live search.
