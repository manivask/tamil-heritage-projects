<!-- Script Designer / AI Prompt Engineer : Manivasagam Karunakaran -->
# Thirukkural Facts Finder & Global Tamil Toponyms Explorer

This workspace contains two main web applications:
1. **Thirukkural Facts Finder** (`html/thirukkural_facts_finder.html`): An interactive application to explore facts, search, and browse the 1330 couplets (Kurals) of Thirukkural.
2. **Global Tamil Toponyms Explorer** (`html/toponyms.html`): An interactive, dark-themed geographic explorer that pins and categorizes places named **Palani**, **Salam/Salem**, or any other search term globally.

## Workspace Structure

```
c:\Users\maniv\all_ide_code_ws\
├── python/
│   ├── extract.py             # Python Wikidata SPARQL data extractor
│   └── extract.ps1            # PowerShell Wikidata SPARQL data extractor (Windows native fallback)
├── html/
│   ├── css/
│   │   ├── styles.css         # Modern, glassmorphic dark-theme styles for Toponyms Explorer
│   │   └── facts.css          # Styles for Thirukkural Facts Finder
│   ├── js/
│   │   ├── app.js             # Leaflet map, live API queries, & UI logic for Toponyms Explorer
│   │   └── facts_app.js       # Core Javascript logic for Thirukkural Facts Finder
│   ├── data/
│   │   ├── palani.json        # Pre-extracted Palani location data
│   │   ├── salam.json         # Pre-extracted Salam location data
│   │   └── thirukkural.json   # Full structured dataset of 1330 Kurals
│   ├── thirukkural_facts_finder.html  # Thirukkural Facts Finder page
│   └── toponyms.html          # Global Tamil Toponyms Explorer page
└── README.md                  # This documentation file
```

---

## How to Run

### 1. View the Apps (No Installation Required!)
- **Thirukkural Facts Finder**: Open **[html/thirukkural_facts_finder.html](file:///c:/Users/maniv/all_ide_code_ws/html/thirukkural_facts_finder.html)** in any modern web browser to search and browse Kurals.
- **Global Tamil Toponyms Explorer**: Open **[html/toponyms.html](file:///c:/Users/maniv/all_ide_code_ws/html/toponyms.html)** in any modern web browser to view the interactive map.

### 2. Extract New Name Datasets
If you want to extract names globally and pre-load them in the HTML dropdown:

#### Option A: Using PowerShell (No installation needed on Windows!)
Open a PowerShell terminal, navigate to the project directory, and run:
```powershell
powershell -ExecutionPolicy Bypass -File python/extract.ps1 <keyword>
```
*Example:*
```powershell
powershell -ExecutionPolicy Bypass -File python/extract.ps1 Madurai
```
This will search Wikidata, group results by country, and save `madurai.json` to the `html/data` folder.

#### Option B: Using Python
Once you have Python 3 installed on your system, open your terminal and run:
```bash
python python/extract.py <keyword>
```
*Example:*
```bash
python python/extract.py Chola
```
This uses only the Python standard library (no pip packages required!) and creates the corresponding JSON file in the data folder.

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
