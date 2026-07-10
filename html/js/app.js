// Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
// Global Tamil Toponyms Explorer - Map & UI Logic

// Global state variables
let map;
let markersLayer;
let darkTileLayer;
let lightTileLayer;
let isDarkTheme = true;
let currentData = null;
const markersMap = new Map(); // Keep track of Leaflet markers by place ID for direct opening

// Initialize map on DOM load
document.addEventListener("DOMContentLoaded", () => {
    initMap();
    setupEventListeners();
    
    // Load initial data (Palani)
    loadKeyword("palani");
});

// Initialize Leaflet Map
function initMap() {
    // Center map globally over India/Indian Ocean area initially
    map = L.map("map", {
        center: [20.0, 77.0],
        zoom: 3,
        minZoom: 2,
        maxBounds: [[-85, -180], [85, 180]]
    });

    // CartoDB Dark Matter tile layer for premium dark aesthetics
    darkTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    // CartoDB Positron tile layer for premium light aesthetics
    lightTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    // Default to dark theme tiles
    darkTileLayer.addTo(map);

    markersLayer = L.layerGroup().addTo(map);
}

// Attach Event Listeners
function setupEventListeners() {
    const select = document.getElementById("keyword-select");
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const filterInput = document.getElementById("place-filter");

    // Pre-extracted dropdown keyword select
    select.addEventListener("change", (e) => {
        loadKeyword(e.target.value);
    });

    // Live search click button
    searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();
        if (query) {
            triggerLiveSearch(query);
        } else {
            showToast("Please enter a search term", "error");
        }
    });

    // Live search Enter key press
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const query = searchInput.value.trim();
            if (query) {
                triggerLiveSearch(query);
            } else {
                showToast("Please enter a search term", "error");
            }
        }
    });

    // Filter sidebar place cards
    filterInput.addEventListener("input", (e) => {
        filterPlacesList(e.target.value.trim().toLowerCase());
    });

    // Theme toggle button click
    const themeToggle = document.getElementById("theme-toggle");
    themeToggle.addEventListener("click", toggleTheme);
}

// Manage Loading Overlay
function showLoading(message) {
    const overlay = document.getElementById("loading-overlay");
    const msg = document.getElementById("loading-message");
    msg.textContent = message || "Loading...";
    overlay.classList.remove("hidden");
}

function hideLoading() {
    const overlay = document.getElementById("loading-overlay");
    overlay.classList.add("hidden");
}

// Display Custom Toast Notification
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
        toast.style.animation = "toast-in 0.3s reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Load place data from static file, fallback to live Wikidata query if needed
async function loadKeyword(keyword) {
    showLoading(`Loading data for '${keyword.toUpperCase()}'...`);
    
    try {
        // Try fetching local pre-extracted JSON file
        const response = await fetch(`data/${keyword}.json`);
        if (!response.ok) {
            throw new Error(`Data file data/${keyword}.json not found`);
        }
        const data = await response.json();
        currentData = data;
        renderData(data);
        showToast(`Loaded ${data.total_count} places for keyword "${data.keyword.toUpperCase()}"`, "success");
        
        // Reset search input UI
        document.getElementById("search-input").value = "";
    } catch (err) {
        console.warn("[*] Local file load failed, querying Wikidata live instead...", err);
        // Fallback to Live Query
        await triggerLiveSearch(keyword, true);
    } finally {
        hideLoading();
    }
}

// Perform Live Wikidata SPARQL Query in the Browser
async function triggerLiveSearch(keyword, isFallback = false) {
    showLoading(`Querying Wikidata live for '${keyword.toUpperCase()}'...`);
    
    const sparqlQuery = `
      SELECT DISTINCT ?place ?placeLabel ?coords ?countryLabel ?typeLabel WHERE {
        SERVICE wikibase:mwapi {
          bd:serviceParam wikibase:endpoint "www.wikidata.org" .
          bd:serviceParam wikibase:api "EntitySearch" .
          bd:serviceParam mwapi:search "${keyword.toLowerCase()}" .
          bd:serviceParam mwapi:language "en" .
          ?place wikibase:apiOutputItem mwapi:item .
        }
        ?place wdt:P625 ?coords .
        ?place rdfs:label ?placeLabel .
        FILTER (LANG(?placeLabel) = "en")
        OPTIONAL {
          ?place wdt:P17 ?country .
          ?country rdfs:label ?countryLabel .
          FILTER (LANG(?countryLabel) = "en")
        }
        OPTIONAL {
          ?place wdt:P31 ?type .
          ?type rdfs:label ?typeLabel .
          FILTER (LANG(?typeLabel) = "en")
        }
      } LIMIT 2000
    `;

    const endpointUrl = 'https://query.wikidata.org/sparql';
    const fullUrl = endpointUrl + '?query=' + encodeURIComponent(sparqlQuery) + '&format=json';

    try {
        const response = await fetch(fullUrl, {
            headers: {
                'Accept': 'application/sparql-results+json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const rawData = await response.json();
        const parsedData = parseWikidataResponse(rawData, keyword);
        
        currentData = parsedData;
        renderData(parsedData);
        
        if (parsedData.total_count > 0) {
            showToast(`Found ${parsedData.total_count} places for "${keyword.toUpperCase()}" via live Wikidata!`, "success");
            // If live search, update dropdown selection to none or matching keyword
            if (!isFallback) {
                // Add temporary search result option to dropdown if not present
                const select = document.getElementById("keyword-select");
                
                // Remove existing temp live options
                const oldTemp = select.querySelector('option[data-temp="true"]');
                if (oldTemp) oldTemp.remove();
                
                // Add new temp option and select it
                const option = document.createElement("option");
                option.value = keyword.toLowerCase();
                option.textContent = `LIVE: ${keyword.toUpperCase()}`;
                option.setAttribute("data-temp", "true");
                option.selected = true;
                select.appendChild(option);
            }
        } else {
            showToast(`No places found for "${keyword}" on Wikidata`, "info");
        }
    } catch (err) {
        console.error("Live search query failed:", err);
        showToast("Live query failed. Check connection or retry.", "error");
    } finally {
        hideLoading();
    }
}

// Convert Wikidata SPARQL JSON into our country-grouped schema
function parseWikidataResponse(rawData, keyword) {
    const bindings = rawData.results.bindings || [];
    
    const parsed = {
        keyword: keyword,
        total_count: 0,
        country_count: 0,
        countries: {}
    };

    const seenIds = new Set();

    bindings.forEach(bind => {
        const placeUri = bind.place ? bind.place.value : "";
        const placeId = placeUri ? placeUri.split("/").pop() : "";

        if (!placeId || seenIds.has(placeId)) return;

        const name = bind.placeLabel ? bind.placeLabel.value : "";
        const coordVal = bind.coords ? bind.coords.value : "";
        const country = bind.countryLabel ? bind.countryLabel.value : "Unknown Country";
        const type = bind.typeLabel ? bind.typeLabel.value : "Geographical Feature";

        // Parse Point(longitude latitude)
        if (!coordVal || !coordVal.startsWith("Point(")) return;

        try {
            const cleanCoords = coordVal.replace("Point(", "").replace(")", "").trim();
            const parts = cleanCoords.split(" ");
            if (parts.length !== 2) return;

            const lon = parseFloat(parts[0]);
            const lat = parseFloat(parts[1]);

            if (isNaN(lat) || isNaN(lon)) return;

            seenIds.add(placeId);

            const placeObj = {
                id: placeId,
                name: name,
                type: type,
                lat: lat,
                lon: lon,
                link: placeUri
            };

            if (!parsed.countries[country]) {
                parsed.countries[country] = [];
            }

            parsed.countries[country].push(placeObj);
        } catch (e) {
            console.error("Error parsing coordinate:", coordVal, e);
        }
    });

    parsed.total_count = seenIds.size;
    parsed.country_count = Object.keys(parsed.countries).length;

    // Sort place items alphabetically in each country
    for (const country in parsed.countries) {
        parsed.countries[country].sort((a, b) => a.name.localeCompare(b.name));
    }

    return parsed;
}

// Render data onto Leaflet Map and Sidebar UI
function renderData(data) {
    // 1. Reset variables & elements
    markersLayer.clearLayers();
    markersMap.clear();
    const container = document.getElementById("places-container");
    container.innerHTML = "";
    
    // Update Stats counters
    document.getElementById("stat-places").textContent = data.total_count;
    document.getElementById("stat-countries").textContent = data.country_count;

    if (!data || data.total_count === 0) {
        container.innerHTML = `<div class="empty-state">No places found for "${data.keyword}".</div>`;
        return;
    }

    // Sort countries alphabetically for rendering
    const sortedCountries = Object.keys(data.countries).sort();
    const bounds = L.latLngBounds();

    // 2. Create Dynamic Accordion and Map Markers
    sortedCountries.forEach((countryName, index) => {
        const places = data.countries[countryName];
        
        // Country group panel
        const groupEl = document.createElement("div");
        groupEl.className = "country-group";
        // Expand the first country by default, collapse others
        if (index > 0) {
            groupEl.classList.add("collapsed");
        }

        // Country Header
        const headerEl = document.createElement("div");
        headerEl.className = "country-header";
        headerEl.innerHTML = `
            <div class="country-title">
                <span>📍</span>
                <span>${countryName}</span>
            </div>
            <span class="country-count">${places.length}</span>
        `;
        
        // Toggle Collapse/Expand
        headerEl.addEventListener("click", () => {
            groupEl.classList.toggle("collapsed");
        });

        // Places Container inside Country Group
        const placesContainerEl = document.createElement("div");
        placesContainerEl.className = "country-places";

        places.forEach(place => {
            // A. Create Map Marker
            const customIcon = L.divIcon({
                html: '<div class="marker-pin"></div>',
                className: 'custom-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -10]
            });

            const marker = L.marker([place.lat, place.lon], { icon: customIcon });
            
            // Custom Popup Design
            const popupContent = `
                <div class="popup-details">
                    <div class="popup-title">${place.name}</div>
                    <div class="popup-type">${place.type}</div>
                    <div class="popup-row"><strong>Country:</strong> ${countryName}</div>
                    <div class="popup-row"><strong>Coordinates:</strong> ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}</div>
                    <a href="${place.link}" target="_blank" rel="noopener" class="popup-link">View in Wikidata ↗</a>
                    <br>
                    <a href="https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}" target="_blank" rel="noopener" class="popup-link">Google Maps ↗</a>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
            markersMap.set(place.id, marker);
            bounds.extend([place.lat, place.lon]);

            // B. Create Place card inside sidebar
            const latDir = place.lat >= 0 ? 'N' : 'S';
            const lonDir = place.lon >= 0 ? 'E' : 'W';
            const coordsFormatted = `${Math.abs(place.lat).toFixed(3)}° ${latDir}, ${Math.abs(place.lon).toFixed(3)}° ${lonDir}`;

            const placeCard = document.createElement("div");
            placeCard.className = "place-item";
            placeCard.setAttribute("data-place-id", place.id);
            placeCard.innerHTML = `
                <div class="place-item-body">
                    <div class="place-name-row">
                        <span class="place-icon">📍</span>
                        <span class="place-name">${place.name}</span>
                    </div>
                    <div class="place-meta-row">
                        <span class="place-type-badge">${place.type}</span>
                        <span class="place-coords-text">${coordsFormatted}</span>
                    </div>
                </div>
            `;

            // Click listener: Smooth pan & zoom to the marker, open popup
            placeCard.addEventListener("click", () => {
                focusPlace(place, marker);
                
                // Highlight active place in sidebar
                document.querySelectorAll(".place-item").forEach(item => item.classList.remove("active"));
                placeCard.classList.add("active");
            });

            // Map marker opens sidebar details too
            marker.on("click", () => {
                // Highlight list item
                document.querySelectorAll(".place-item").forEach(item => item.classList.remove("active"));
                placeCard.classList.add("active");
                
                // Auto-expand this country's accordion if collapsed
                if (groupEl.classList.contains("collapsed")) {
                    groupEl.classList.remove("collapsed");
                }
                
                // Scroll the sidebar to bring the active place item into view
                placeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });

            placesContainerEl.appendChild(placeCard);
        });

        groupEl.appendChild(headerEl);
        groupEl.appendChild(placesContainerEl);
        container.appendChild(groupEl);
    });

    // Fit map view to bounds if points exist
    if (data.total_count > 0) {
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 9,
            animate: true,
            duration: 1.5
        });
    }
}

// Pan/Zoom to place coordinates, highlight it on map
function focusPlace(place, marker) {
    map.setView([place.lat, place.lon], 9, {
        animate: true,
        pan: { duration: 1.0 },
        zoom: { duration: 1.0 }
    });
    
    // Delay opening popup slightly for transition to complete
    setTimeout(() => {
        marker.openPopup();
    }, 400);
}

// Dynamic Filter Search in Sidebar
function filterPlacesList(searchTerm) {
    const groups = document.querySelectorAll(".country-group");
    
    groups.forEach(group => {
        const countryTitle = group.querySelector(".country-title").textContent.toLowerCase();
        const items = group.querySelectorAll(".place-item");
        let visibleCount = 0;
        
        items.forEach(item => {
            const placeName = item.querySelector(".place-name").textContent.toLowerCase();
            const placeType = item.querySelector(".place-type").textContent.toLowerCase();
            
            // Check if place details match search
            if (placeName.includes(searchTerm) || placeType.includes(searchTerm) || countryTitle.includes(searchTerm)) {
                item.style.display = "block";
                visibleCount++;
            } else {
                item.style.display = "none";
            }
        });
        
        // Show/hide country groups based on items visibility
        if (visibleCount > 0) {
            group.style.display = "block";
            // Expand group if filter is active
            if (searchTerm.length > 0) {
                group.classList.remove("collapsed");
            }
        } else {
            group.style.display = "none";
        }
    });
}

// Toggle between Dark Theme (CartoDB Dark Matter) and Light Theme (CartoDB Positron)
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    
    if (isDarkTheme) {
        document.body.classList.remove("light-theme");
        map.removeLayer(lightTileLayer);
        darkTileLayer.addTo(map);
        showToast("Switched to Dark Mode", "info");
    } else {
        document.body.classList.add("light-theme");
        map.removeLayer(darkTileLayer);
        lightTileLayer.addTo(map);
        showToast("Switched to Light Mode", "info");
    }
}
