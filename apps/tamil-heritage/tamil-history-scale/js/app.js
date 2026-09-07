// Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
// Tamil Heritage & History Scale - UI & Timeline Logic

let timelineEvents = [];
let liveEvents = [];
let activeCategory = "all";
let searchFilter = "";
let activeYear = 2026;
let isFetchingLive = false;
let searchTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    setupEventListeners();
    await loadEventsData();
}

function setupEventListeners() {
    // Theme Toggle
    const themeBtn = document.getElementById("theme-toggle");
    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        const isLight = document.body.classList.contains("light-theme");
        themeBtn.textContent = isLight ? "🌙" : "☀️";
    });

    // Search Input with Debounce live enrichment
    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", (e) => {
        searchFilter = e.target.value.toLowerCase().trim();
        renderTimeline();
        
        clearTimeout(searchTimeout);
        if (searchFilter.length > 2) {
            searchTimeout = setTimeout(() => {
                triggerLiveSearchForQuery(searchFilter);
            }, 850);
        }
    });

    // Category Filter Badges
    const filterBadges = document.querySelectorAll(".filter-badge");
    filterBadges.forEach(badge => {
        badge.addEventListener("click", (e) => {
            filterBadges.forEach(b => b.classList.remove("active"));
            badge.classList.add("active");
            activeCategory = badge.getAttribute("data-category");
            renderTimeline();
        });
    });

    // Era Zoom Range Slider
    const rangeSlider = document.getElementById("zoom-range-slider");
    const valueLabel = document.getElementById("zoom-value-label");
    
    rangeSlider.addEventListener("input", (e) => {
        activeYear = parseInt(e.target.value);
        updateYearLabel(activeYear, valueLabel);
        syncEpochButtons(activeYear);
    });

    rangeSlider.addEventListener("change", () => {
        handleYearChange();
    });

    // Quick Epoch Shortcuts
    const epochButtons = document.querySelectorAll(".epoch-btn");
    epochButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            epochButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeYear = parseInt(btn.getAttribute("data-year"));
            rangeSlider.value = activeYear;
            updateYearLabel(activeYear, valueLabel);
            handleYearChange();
        });
    });
}

function updateYearLabel(year, labelEl) {
    if (year < 0) {
        labelEl.textContent = `${Math.abs(year)} BCE`;
    } else {
        labelEl.textContent = `${year} CE`;
    }
}

function syncEpochButtons(year) {
    const epochButtons = document.querySelectorAll(".epoch-btn");
    let closestBtn = null;
    let minDiff = Infinity;

    epochButtons.forEach(btn => {
        btn.classList.remove("active");
        const btnYear = parseInt(btn.getAttribute("data-year"));
        const diff = Math.abs(btnYear - year);
        if (diff < minDiff) {
            minDiff = diff;
            closestBtn = btn;
        }
    });

    if (closestBtn && minDiff < 400) {
        closestBtn.classList.add("active");
    }
}

async function triggerLiveSearchForQuery(query) {
    // Check if we already have local results matching the search term
    const localMatches = timelineEvents.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
    );
    
    // Fallback to Wikipedia search only if local matches are low/absent
    if (localMatches.length >= 3) {
        return; 
    }
    
    isFetchingLive = true;
    showLoadingSpinner(true, `Searching the web live for "${query}"...`);
    
    try {
        // Query Wikipedia using generator=search to fetch extracts and pageimages (thumbnails) in one call
        const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query + ' Tamil')}&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=400&exintro=1&explaintext=1&exchars=250&format=json&origin=*`;
        
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            const pages = data.query?.pages || {};
            
            const fetched = Object.values(pages).map(item => {
                const cleanSnippet = (item.extract || "").trim();
                let category = "General History";
                const lowerText = (item.title + " " + cleanSnippet).toLowerCase();
                
                if (lowerText.includes("king") || lowerText.includes("dynasty") || lowerText.includes("chola") || lowerText.includes("pandya")) {
                    category = "Rulers & Kingdoms";
                } else if (lowerText.includes("book") || lowerText.includes("poet") || lowerText.includes("literature") || lowerText.includes("sangam")) {
                    category = "Literature & Arts";
                } else if (lowerText.includes("archaeology") || lowerText.includes("excavation") || lowerText.includes("temple")) {
                    category = "Culture & Heritage";
                }
                
                // Parse year from content
                let year = activeYear;
                const bceMatch = cleanSnippet.match(/\b(\d{3,4})\s*B\.?C\.?E?\.?\b/i);
                if (bceMatch) {
                    year = -parseInt(bceMatch[1]);
                } else {
                    const ceMatch = cleanSnippet.match(/\b(1\d{3}|20\d{2}|[5-9]\d{2})\b/);
                    if (ceMatch) {
                        year = parseInt(ceMatch[1]);
                    }
                }
                
                return {
                    title: item.title,
                    description: cleanSnippet + " (Discovered live from Wiki search)",
                    year: year,
                    date: year < 0 ? `BCE ${Math.abs(year)}` : `${year} CE`,
                    category: category,
                    link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
                    image: item.thumbnail?.source || "",
                    isLive: true
                };
            });
            
            fetched.forEach(fe => {
                if (!liveEvents.some(le => le.title === fe.title) && !timelineEvents.some(te => te.title === fe.title)) {
                    liveEvents.push(fe);
                }
            });
        }
    } catch (err) {
        console.warn("Live query search failed:", err);
    } finally {
        isFetchingLive = false;
        showLoadingSpinner(false);
        renderTimeline();
    }
}

async function handleYearChange() {
    liveEvents = []; // Reset live events
    renderTimeline();
    
    isFetchingLive = true;
    showLoadingSpinner(true, `Searching the web for year ${activeYear < 0 ? Math.abs(activeYear) + ' BCE' : activeYear + ' CE'}...`);
    
    try {
        const queryYear = activeYear < 0 ? `${Math.abs(activeYear)} BC` : `${activeYear}`;
        const query = `"${queryYear}" "Tamil"`;
        const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=400&exintro=1&explaintext=1&exchars=250&format=json&origin=*`;
        
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            const pages = data.query?.pages || {};
            
            liveEvents = Object.values(pages).map(item => {
                const cleanSnippet = (item.extract || "").trim();
                let category = "General History";
                const lowerText = (item.title + " " + cleanSnippet).toLowerCase();
                
                if (lowerText.includes("king") || lowerText.includes("dynasty") || lowerText.includes("chola") || lowerText.includes("pandya")) {
                    category = "Rulers & Kingdoms";
                } else if (lowerText.includes("book") || lowerText.includes("poet") || lowerText.includes("literature") || lowerText.includes("sangam")) {
                    category = "Literature & Arts";
                } else if (lowerText.includes("archaeology") || lowerText.includes("excavation") || lowerText.includes("temple")) {
                    category = "Culture & Heritage";
                }
                
                return {
                    title: item.title,
                    description: cleanSnippet + " (Discovered live from Wiki search)",
                    year: activeYear,
                    date: activeYear < 0 ? `BCE ${Math.abs(activeYear)}` : `${activeYear} CE`,
                    category: category,
                    link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
                    image: item.thumbnail?.source || "",
                    isLive: true
                };
            });
        }
    } catch (err) {
        console.warn("Could not fetch live search from Wikipedia:", err);
    } finally {
        isFetchingLive = false;
        showLoadingSpinner(false);
        renderTimeline();
    }
}

function showLoadingSpinner(show, message = "") {
    const container = document.getElementById("timeline-events-container");
    let spinnerEl = document.getElementById("live-spinner");
    
    if (show) {
        if (!spinnerEl) {
            spinnerEl = document.createElement("div");
            spinnerEl.id = "live-spinner";
            spinnerEl.className = "loading-state";
            spinnerEl.innerHTML = `
                <div class="spinner"></div>
                <p id="spinner-msg">${message || 'Searching the web...'}</p>
            `;
            container.prepend(spinnerEl);
        } else {
            document.getElementById("spinner-msg").textContent = message;
        }
    } else {
        if (spinnerEl) {
            spinnerEl.remove();
        }
    }
}

async function loadEventsData() {
    try {
        const response = await fetch("data/events.json?v=" + new Date().getTime());
        if (!response.ok) {
            throw new Error("Failed to fetch historical events data");
        }
        timelineEvents = await response.json();
        document.getElementById("stat-total-events").textContent = timelineEvents.length;
        renderTimeline();
    } catch (err) {
        console.error("Error loading events database:", err);
    }
}

function renderTimeline() {
    const container = document.getElementById("timeline-events-container");
    
    // Remove previous card elements (keeping spinner if loading)
    const spinner = document.getElementById("live-spinner");
    container.innerHTML = "";
    if (spinner) {
        container.appendChild(spinner);
    }

    // Helper to normalize Tamil spellings (e.g. Tolkappiyam / Tholkappiyam / Tolkāppiyam)
    const normalizeSpelling = (str) => {
        return str.toLowerCase()
                  .replace(/h/g, '')
                  .replace(/ā/g, 'a')
                  .replace(/ō/g, 'o')
                  .replace(/ē/g, 'e')
                  .replace(/ī/g, 'i')
                  .replace(/ū/g, 'u');
    };
    const normFilter = normalizeSpelling(searchFilter);

    // Filter static database events
    const filteredStatic = timelineEvents.filter(event => {
        const matchesYearRange = (searchFilter.length > 0 || Math.abs(event.year - activeYear) <= 500); // 500 years window for 10k timeline
        const matchesCategory = (activeCategory === "all" || event.category === activeCategory);
        const matchesSearch = (
            searchFilter.length === 0 ||
            normalizeSpelling(event.title).includes(normFilter) ||
            normalizeSpelling(event.description).includes(normFilter) ||
            normalizeSpelling(event.category).includes(normFilter)
        );
        return matchesYearRange && matchesCategory && matchesSearch;
    });

    // Filter live events
    const filteredLive = liveEvents.filter(event => {
        const matchesCategory = (activeCategory === "all" || event.category === activeCategory);
        const matchesSearch = (
            searchFilter.length === 0 ||
            normalizeSpelling(event.title).includes(normFilter) ||
            normalizeSpelling(event.description).includes(normFilter)
        );
        return matchesCategory && matchesSearch;
    });

    // Merge static and live events
    const allRenderedEvents = [...filteredStatic, ...filteredLive];

    if (allRenderedEvents.length === 0 && !isFetchingLive) {
        container.innerHTML = `
            <div class="empty-state">
                <p>🔍 No historical events found matching "${searchFilter}" near the selected era.</p>
                <p style="font-size: 12px; margin-top: 8px; color: var(--text-muted)">Try adjusting your search, moving the navigator slider, or picking another century epoch.</p>
            </div>
        `;
        return;
    }

    // Render timeline cards alternately
    allRenderedEvents.forEach((event, index) => {
        const sideClass = (index % 2 === 0) ? "" : "right-side";
        
        let catClass = "cat-general";
        if (event.category === "Rulers & Kingdoms") catClass = "cat-rulers";
        else if (event.category === "Literature & Arts") catClass = "cat-literature";
        else if (event.category === "Culture & Heritage") catClass = "cat-culture";
        else if (event.category === "Colonial Era") catClass = "cat-colonial";

        const badgeText = event.isLive ? `${event.category} • LIVE` : event.category;
        
        // Image banner element
        const imgHtml = event.image ? `<img src="${event.image}" class="event-image-banner" alt="${event.title}" loading="lazy">` : "";

        const card = document.createElement("article");
        card.className = `timeline-event-card ${sideClass} ${catClass}`;
        card.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="event-card-inner">
                ${imgHtml}
                <div class="event-header">
                    <span class="event-date-badge">${event.date}</span>
                    <span class="event-category-badge">${badgeText}</span>
                </div>
                <h3 class="event-title">${event.title}</h3>
                <p class="event-desc">${event.description}</p>
                <a href="${event.link}" target="_blank" rel="noopener" class="event-link">
                    Explore Reference ↗
                </a>
            </div>
        `;
        container.appendChild(card);
    });
}
