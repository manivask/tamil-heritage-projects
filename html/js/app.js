// Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
// Global Tamil Toponyms Explorer - Map & UI Logic

// Global state variables
let map;
let markersLayer;
let darkTileLayer;
let lightTileLayer;
let isDarkTheme = false; // Default to light theme (Apple style)
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

    // Default to light theme tiles
    lightTileLayer.addTo(map);

    markersLayer = L.layerGroup().addTo(map);
}

// Attach Event Listeners
function setupEventListeners() {
    initCombobox();
    
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const filterInput = document.getElementById("place-filter");

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

    // Setup feedback form listener
    const feedbackForm = document.getElementById("feedback-form");
    if (feedbackForm) {
        feedbackForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const messageInput = document.getElementById("feedback-message");
            const message = messageInput.value.trim();
            if (!message) return;
            
            const submitBtn = feedbackForm.querySelector("button");
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = "Sending... ⏳";
            
            try {
                const response = await fetch("https://formsubmit.co/ajax/manivask@gmail.com", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        message: message,
                        _subject: "Thank you note from Tamil Toponyms Explorer!"
                    })
                });
                
                if (response.ok) {
                    showToast("Thank you note sent successfully!", "success");
                    messageInput.value = "";
                } else {
                    throw new Error("Failed to send");
                }
            } catch (err) {
                console.error("Error sending feedback:", err);
                showToast("Could not send note. Please try again later.", "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
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
            // If live search, update combobox selection to matching keyword
            if (!isFallback) {
                const comboboxInput = document.getElementById("combobox-input");
                if (comboboxInput) {
                    comboboxInput.value = `LIVE: ${keyword.toUpperCase()}`;
                }
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

// 38 Districts of Tamil Nadu + Heritage Keywords
const DISTRICTS = [
    { id: "palani", en: "Palani (Heritage)", ta: "பழனி" },
    { id: "salam", en: "Salem / Salam", ta: "சேலம்" },
    { id: "pandi", en: "Pandi (Heritage)", ta: "பாண்டி" },
    { id: "kanchi", en: "Kanchi (Heritage)", ta: "காஞ்சி" },
    { id: "chola", en: "Chola (Heritage)", ta: "சோழா" },
    { id: "ariyalur", en: "Ariyalur", ta: "அரியலூர்" },
    { id: "chengalpattu", en: "Chengalpattu", ta: "செங்கல்பட்டு" },
    { id: "chennai", en: "Chennai", ta: "சென்னை" },
    { id: "coimbatore", en: "Coimbatore", ta: "கோயம்புத்தூர்" },
    { id: "cuddalore", en: "Cuddalore", ta: "கடலூர்" },
    { id: "dharmapuri", en: "Dharmapuri", ta: "தர்மபுரி" },
    { id: "dindigul", en: "Dindigul", ta: "திண்டுக்கல்" },
    { id: "erode", en: "Erode", ta: "ஈரோடு" },
    { id: "kallakurichi", en: "Kallakurichi", ta: "கள்ளக்குறிச்சி" },
    { id: "kanchipuram", en: "Kanchipuram", ta: "காஞ்சிபுரம்" },
    { id: "kanyakumari", en: "Kanyakumari", ta: "கன்னியாகுமரி" },
    { id: "karur", en: "Karur", ta: "கரூர்" },
    { id: "krishnagiri", en: "Krishnagiri", ta: "கிருஷ்ணகிரி" },
    { id: "madurai", en: "Madurai", ta: "மதுரை" },
    { id: "mayiladuthurai", en: "Mayiladuthurai", ta: "மயிலாடுதுறை" },
    { id: "nagapattinam", en: "Nagapattinam", ta: "நாகப்பட்டினம்" },
    { id: "namakkal", en: "Namakkal", ta: "நாமக்கல்" },
    { id: "nilgiris", en: "Nilgiris", ta: "நீலகிரி" },
    { id: "perambalur", en: "Perambalur", ta: "பெரம்பலூர்" },
    { id: "pudukkottai", en: "Pudukkottai", ta: "புதுக்கோட்டை" },
    { id: "ramanathapuram", en: "Ramanathapuram", ta: "ராமநாதபுரம்" },
    { id: "ranipet", en: "Ranipet", ta: "ராணிப்பேட்டை" },
    { id: "salem", en: "Salem", ta: "சேலம்" },
    { id: "sivaganga", en: "Sivaganga", ta: "சிவகங்கை" },
    { id: "tenkasi", en: "Tenkasi", ta: "தென்காசி" },
    { id: "thanjavur", en: "Thanjavur", ta: "தஞ்சாவூர்" },
    { id: "theni", en: "Theni", ta: "தேனி" },
    { id: "thoothukudi", en: "Thoothukudi", ta: "தூத்துக்குடி" },
    { id: "tiruchirappalli", en: "Tiruchirappalli", ta: "திருச்சிராப்பள்ளி" },
    { id: "tirunelveli", en: "Tirunelveli", ta: "திருநெல்வேலி" },
    { id: "tirupathur", en: "Tirupathur", ta: "திருப்பத்தூர்" },
    { id: "tiruppur", en: "Tiruppur", ta: "திருப்பூர்" },
    { id: "tiruvallur", en: "Tiruvallur", ta: "திருவள்ளூர்" },
    { id: "tiruvannamalai", en: "Tiruvannamalai", ta: "திருவண்ணாமலை" },
    { id: "tiruvarur", en: "Tiruvarur", ta: "திருவாரூர்" },
    { id: "vellore", en: "Vellore", ta: "வேலூர்" },
    { id: "viluppuram", en: "Viluppuram", ta: "விழுப்புரம்" },
    { id: "virudhunagar", en: "Virudhunagar", ta: "விருதுநகர்" }
];

// Initialize custom searchable combobox
function initCombobox() {
    const input = document.getElementById("combobox-input");
    const optionsList = document.getElementById("combobox-options");
    const container = input.closest(".combobox-container");
    
    // Set initial value
    input.value = "PALANI (பழனி)";
    
    // Render all options initially
    renderComboboxOptions(DISTRICTS);
    
    // Filter options as user types
    input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        const filtered = DISTRICTS.filter(d => 
            d.en.toLowerCase().includes(query) || 
            d.ta.includes(query)
        );
        renderComboboxOptions(filtered);
        optionsList.classList.remove("hidden");
    });
    
    // Show options on focus
    input.addEventListener("focus", () => {
        optionsList.classList.remove("hidden");
    });
    
    // Toggle on container click
    container.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.target.id === "combobox-input" || e.target.classList.contains("combobox-arrow")) {
            optionsList.classList.toggle("hidden");
        }
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener("click", () => {
        optionsList.classList.add("hidden");
    });
    
    function renderComboboxOptions(list) {
        optionsList.innerHTML = "";
        if (list.length === 0) {
            const li = document.createElement("li");
            li.className = "combobox-option";
            li.style.color = "var(--text-muted)";
            li.textContent = "No matches found";
            optionsList.appendChild(li);
            return;
        }
        
        list.forEach(d => {
            const li = document.createElement("li");
            li.className = "combobox-option";
            li.setAttribute("data-id", d.id);
            li.innerHTML = `
                <span class="english-text">${d.en}</span>
                <span class="tamil-text">${d.ta}</span>
            `;
            
            li.addEventListener("click", () => {
                input.value = `${d.en.toUpperCase()} (${d.ta})`;
                optionsList.classList.add("hidden");
                loadKeyword(d.id);
            });
            optionsList.appendChild(li);
        });
    }
}
