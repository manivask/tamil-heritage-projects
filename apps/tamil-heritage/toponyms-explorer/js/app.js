// Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
// Global Tamil Toponyms Explorer - Kid-Friendly Interactive Game Logic

// Global state variables
let map;
let markersLayer;
let darkTileLayer;
let lightTileLayer;
let isDarkTheme = false; 
let currentData = null;
const markersMap = new Map(); 
let subdivisionsData = []; 
let audioContext = null;

// Toponyms Detective Quest State
const clickedPlaces = new Set();
const QUEST_TARGET = 3;

// Initialize app on DOM load
document.addEventListener("DOMContentLoaded", async () => {
    initMap();
    setupEventListeners();
    setupQuestUI();
    
    // Load subdivisions list dynamically
    try {
        const response = await fetch("data/subdivisions.json?v=" + new Date().getTime());
        if (response.ok) {
            subdivisionsData = await response.json();
            initCombobox();
        }
    } catch (err) {
        console.error("Failed to load subdivisions list:", err);
    }
    
    // Load initial data (Palani)
    loadKeyword("palani");
});

// Initialize Leaflet Map
function initMap() {
    map = L.map("map", {
        center: [20.0, 77.0],
        zoom: 3,
        minZoom: 2,
        maxBounds: [[-85, -180], [85, 180]]
    });

    // Bright, colorful, kid-friendly tile layer (Voyager)
    lightTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    // POSITRON fallback
    darkTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    // Default to light theme tiles
    lightTileLayer.addTo(map);

    markersLayer = L.layerGroup().addTo(map);
}

// Sound Synthesizer Node
function playQuestSound(success = true) {
    // Initialize audio context
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContextClass();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    gain.connect(audioContext.destination);

    if (success) {
        // Happy ding-ding double chime!
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        osc1.type = "sine";
        osc2.type = "sine";
        
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.setValueAtTime(880.00, now + 0.12); // A5
        osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        osc1.start();
        osc2.start();
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
    } else {
        // High Fanfare chord for Badge unlock!
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major chord C5-E5-G5-C6
        notes.forEach((freq, idx) => {
            const osc = audioContext.createOscillator();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            
            osc.connect(gain);
            osc.start();
            osc.stop(now + 1.3);
        });
    }
}

// Quest UI Setup
function setupQuestUI() {
    const modalClose = document.getElementById("modal-close-btn");
    const modal = document.getElementById("achievement-modal");
    
    if (modalClose) {
        modalClose.addEventListener("click", () => {
            modal.classList.remove("show");
        });
    }
}

// Handle discovery tracking
function discoverPlace(placeId) {
    if (clickedPlaces.has(placeId)) return;
    
    clickedPlaces.add(placeId);
    const count = Math.min(QUEST_TARGET, clickedPlaces.size);
    
    // Update progress label & bar width
    document.getElementById("quest-count").textContent = `${count} / ${QUEST_TARGET}`;
    const progressPercent = (count / QUEST_TARGET) * 100;
    document.getElementById("quest-progress-bar").style.width = `${progressPercent}%`;
    
    if (clickedPlaces.size === QUEST_TARGET) {
        // Unlock badge!
        setTimeout(() => {
            playQuestSound(false); // Fanfare sound!
            document.getElementById("achievement-modal").classList.add("show");
        }, 600);
    } else {
        playQuestSound(true); // Short chime!
    }
}

// Map place category type to emojis
function getPlaceEmoji(type) {
    const t = type.toLowerCase();
    if (t.includes("mountain") || t.includes("hill") || t.includes("ridge") || t.includes("peak") || t.includes("volcano")) return "⛰️";
    if (t.includes("island") || t.includes("lake") || t.includes("river") || t.includes("stream") || t.includes("ocean") || t.includes("sea") || t.includes("reservoir")) return "🏝️";
    if (t.includes("city") || t.includes("town") || t.includes("village") || t.includes("settlement") || t.includes("commune") || t.includes("municipality")) return "🏢";
    if (t.includes("temple") || t.includes("church") || t.includes("mosque") || t.includes("ruins") || t.includes("monument") || t.includes("archaeological") || t.includes("historic")) return "⛩️";
    if (t.includes("forest") || t.includes("park") || t.includes("nature") || t.includes("reserve")) return "🌳";
    return "📍";
}

// Attach Event Listeners
function setupEventListeners() {
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const filterInput = document.getElementById("place-filter");

    searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();
        if (query) {
            triggerLiveSearch(query);
        } else {
            showToast("Please enter a search term", "error");
        }
    });

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

    filterInput.addEventListener("input", (e) => {
        filterPlacesList(e.target.value.trim().toLowerCase());
    });

    const themeToggle = document.getElementById("theme-toggle");
    themeToggle.addEventListener("click", toggleTheme);

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
    
    setTimeout(() => {
        toast.style.animation = "toast-in 0.3s reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Load place data from static file, fallback to live Wikidata query if needed
async function loadKeyword(keyword) {
    showLoading(`Loading data for '${keyword.toUpperCase()}'...`);
    
    try {
        const response = await fetch(`data/${keyword}.json?v=` + new Date().getTime());
        if (!response.ok) {
            throw new Error(`Data file data/${keyword}.json not found`);
        }
        const data = await response.json();
        currentData = data;
        renderData(data);
        showToast(`Loaded ${data.total_count} places for keyword "${data.keyword.toUpperCase()}"`, "success");
        
        document.getElementById("search-input").value = "";
    } catch (err) {
        console.warn("[*] Local file load failed, querying Wikidata live instead...", err);
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

    for (const country in parsed.countries) {
        parsed.countries[country].sort((a, b) => a.name.localeCompare(b.name));
    }

    return parsed;
}

// Render data onto Leaflet Map and Sidebar UI
function renderData(data) {
    markersLayer.clearLayers();
    markersMap.clear();
    const container = document.getElementById("places-container");
    container.innerHTML = "";
    
    document.getElementById("stat-places").textContent = data.total_count;
    document.getElementById("stat-countries").textContent = data.country_count;

    if (!data || data.total_count === 0) {
        container.innerHTML = `<div class="empty-state">No places found for "${data.keyword}".</div>`;
        return;
    }

    const sortedCountries = Object.keys(data.countries).sort();
    const bounds = L.latLngBounds();

    sortedCountries.forEach((countryName, index) => {
        const places = data.countries[countryName];
        
        const groupEl = document.createElement("div");
        groupEl.className = "country-group";
        if (index > 0) {
            groupEl.classList.add("collapsed");
        }

        const headerEl = document.createElement("div");
        headerEl.className = "country-header";
        headerEl.innerHTML = `
            <div class="country-title">
                <span>📍</span>
                <span>${countryName}</span>
            </div>
            <span class="country-count">${places.length}</span>
        `;
        
        headerEl.addEventListener("click", () => {
            groupEl.classList.toggle("collapsed");
        });

        const placesContainerEl = document.createElement("div");
        placesContainerEl.className = "country-places";

        places.forEach(place => {
            const placeEmoji = getPlaceEmoji(place.type);

            // Custom kid-friendly emoji pin marker
            const customIcon = L.divIcon({
                html: `<div class="marker-emoji-pin" style="background: white; border: 3px solid var(--color-primary); border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; width: 36px; height: 36px; transition: transform 0.2s;">${placeEmoji}</div>`,
                className: 'custom-marker',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18]
            });

            const marker = L.marker([place.lat, place.lon], { icon: customIcon });
            
            const popupContent = `
                <div class="popup-details" style="font-family: var(--font-body); font-size: 0.9rem;">
                    <div class="popup-title" style="font-weight: 800; font-size: 1.05rem; margin-bottom: 4px; color: var(--color-primary);">${place.name}</div>
                    <div class="popup-type" style="font-weight: 600; font-size: 0.8rem; text-transform: uppercase; color: var(--color-accent); margin-bottom: 8px;">${placeEmoji} ${place.type}</div>
                    <div class="popup-row"><strong>Country:</strong> ${countryName}</div>
                    <div class="popup-row"><strong>Coordinates:</strong> ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}</div>
                    <div style="margin-top: 8px; display: flex; gap: 8px;">
                        <a href="${place.link}" target="_blank" rel="noopener" class="popup-link" style="color: var(--color-primary); text-decoration: none; font-weight: bold; font-size: 0.8rem;">Wikidata ↗</a>
                        <a href="https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}" target="_blank" rel="noopener" class="popup-link" style="color: var(--color-primary); text-decoration: none; font-weight: bold; font-size: 0.8rem;">Google Maps ↗</a>
                    </div>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
            markersMap.set(place.id, marker);
            bounds.extend([place.lat, place.lon]);

            const latDir = place.lat >= 0 ? 'N' : 'S';
            const lonDir = place.lon >= 0 ? 'E' : 'W';
            const coordsFormatted = `${Math.abs(place.lat).toFixed(3)}° ${latDir}, ${Math.abs(place.lon).toFixed(3)}° ${lonDir}`;

            const placeCard = document.createElement("div");
            placeCard.className = "place-item";
            placeCard.setAttribute("data-place-id", place.id);
            placeCard.innerHTML = `
                <div class="place-item-body">
                    <div class="place-name-row">
                        <span class="place-icon">${placeEmoji}</span>
                        <span class="place-name">${place.name}</span>
                    </div>
                    <div class="place-meta-row">
                        <span class="place-type-badge">${place.type}</span>
                        <span class="place-coords-text">${coordsFormatted}</span>
                    </div>
                </div>
            `;

            placeCard.addEventListener("click", () => {
                focusPlace(place, marker);
                discoverPlace(place.id); // Track quest progress
                
                document.querySelectorAll(".place-item").forEach(item => item.classList.remove("active"));
                placeCard.classList.add("active");
            });

            marker.on("click", () => {
                discoverPlace(place.id); // Track quest progress
                
                document.querySelectorAll(".place-item").forEach(item => item.classList.remove("active"));
                placeCard.classList.add("active");
                
                if (groupEl.classList.contains("collapsed")) {
                    groupEl.classList.remove("collapsed");
                }
                
                placeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });

            placesContainerEl.appendChild(placeCard);
        });

        groupEl.appendChild(headerEl);
        groupEl.appendChild(placesContainerEl);
        container.appendChild(groupEl);
    });

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
            const placeType = item.querySelector(".place-type-badge").textContent.toLowerCase();
            
            if (placeName.includes(searchTerm) || placeType.includes(searchTerm) || countryTitle.includes(searchTerm)) {
                item.style.display = "block";
                visibleCount++;
            } else {
                item.style.display = "none";
            }
        });
        
        if (visibleCount > 0) {
            group.style.display = "block";
            if (searchTerm.length > 0) {
                group.classList.remove("collapsed");
            }
        } else {
            group.style.display = "none";
        }
    });
}

// Toggle between Dark/Light Tile layers
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    
    if (isDarkTheme) {
        document.body.classList.remove("light-theme");
        map.removeLayer(lightTileLayer);
        darkTileLayer.addTo(map);
        showToast("Switched to Dark Mode 🌙", "info");
    } else {
        document.body.classList.add("light-theme");
        map.removeLayer(darkTileLayer);
        lightTileLayer.addTo(map);
        showToast("Switched to Light Mode ☀️", "info");
    }
}

// Initialize custom searchable combobox
function initCombobox() {
    const input = document.getElementById("combobox-input");
    const optionsList = document.getElementById("combobox-options");
    const container = input.closest(".combobox-container");
    
    input.value = "PALANI (பழனி)";
    renderComboboxOptions(subdivisionsData);
    
    input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        const filtered = subdivisionsData.filter(d => 
            d.en.toLowerCase().includes(query) || 
            d.ta.includes(query) ||
            d.type.toLowerCase().includes(query)
        );
        renderComboboxOptions(filtered);
        optionsList.classList.remove("hidden");
    });
    
    input.addEventListener("focus", () => {
        optionsList.classList.remove("hidden");
    });
    
    container.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.target.id === "combobox-input" || e.target.classList.contains("combobox-arrow")) {
            optionsList.classList.toggle("hidden");
        }
    });
    
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
        
        const visibleList = list.slice(0, 100);
        
        visibleList.forEach(d => {
            const li = document.createElement("li");
            li.className = "combobox-option";
            li.setAttribute("data-id", d.id);
            li.innerHTML = `
                <div class="option-left" style="display: flex; flex-direction: column; gap: 2px;">
                    <span class="english-text" style="font-weight: 500;">${d.en}</span>
                    <span class="tamil-text" style="font-size: 11px; color: var(--text-muted);">${d.ta}</span>
                </div>
                <span class="type-badge">${d.type}</span>
            `;
            
            li.addEventListener("click", () => {
                input.value = `${d.en.toUpperCase()} (${d.ta})`;
                optionsList.classList.add("hidden");
                loadKeyword(d.search_term || d.id);
            });
            optionsList.appendChild(li);
        });
        
        if (list.length > 100) {
            const li = document.createElement("li");
            li.className = "combobox-option";
            li.style.color = "var(--text-muted)";
            li.style.fontSize = "12px";
            li.style.justifyContent = "center";
            li.textContent = `Showing 100 of ${list.length} matches. Type to refine...`;
            optionsList.appendChild(li);
        }
    }
}
