// Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
// Tamil Heritage & History Scale - UI & Timeline Logic

let timelineEvents = [];
let liveEvents = [];
let activeCategory = "all";
let searchFilter = "";
let activeYear = 2026;
let isFetchingLive = false;

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

    // Search Input
    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", (e) => {
        searchFilter = e.target.value.toLowerCase().trim();
        renderTimeline();
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

    if (closestBtn && minDiff < 300) {
        closestBtn.classList.add("active");
    }
}

async function handleYearChange() {
    liveEvents = []; // Reset live events
    renderTimeline();
    
    // Fetch live events from Wikipedia for the selected year
    isFetchingLive = true;
    showLoadingSpinner(true);
    
    try {
        const queryYear = activeYear < 0 ? `${Math.abs(activeYear)} BC` : `${activeYear}`;
        const searchTerms = [
            `"${queryYear}" "Tamil"`,
            `"${queryYear}" "Madras"`,
            `"${queryYear}" "Chola"`,
            `"${queryYear}" "Pandya"`
        ];
        
        // Randomly pick one or use the primary query to find events
        const query = searchTerms[0];
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            const results = data.query?.search || [];
            
            liveEvents = results.map(item => {
                const cleanSnippet = item.snippet.replace(/<[^>]+>/g, '');
                
                // Deduce category
                let category = "General History";
                const lowerText = (item.title + " " + cleanSnippet).toLowerCase();
                if (lowerText.includes("king") || lowerText.includes("dynasty") || lowerText.includes("chola") || lowerText.includes("pandya")) {
                    category = "Rulers & Kingdoms";
                } else if (lowerText.includes("book") || lowerText.includes("poet") || lowerText.includes("literature") || lowerText.includes("sangam")) {
                    category = "Literature & Arts";
                }
                
                return {
                    title: item.title,
                    description: cleanSnippet + " (Discovered live from Wiki search)",
                    year: activeYear,
                    date: activeYear < 0 ? `BCE ${Math.abs(activeYear)}` : `${activeYear} CE`,
                    category: category,
                    link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
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

function showLoadingSpinner(show) {
    const container = document.getElementById("timeline-events-container");
    let spinnerEl = document.getElementById("live-spinner");
    
    if (show) {
        if (!spinnerEl) {
            spinnerEl = document.createElement("div");
            spinnerEl.id = "live-spinner";
            spinnerEl.className = "loading-state";
            spinnerEl.innerHTML = `
                <div class="spinner"></div>
                <p>Searching the web for historical information about year ${activeYear < 0 ? Math.abs(activeYear) + ' BCE' : activeYear + ' CE'}...</p>
            `;
            container.prepend(spinnerEl);
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

    // Filter static database events based on proximity to selected activeYear (within ±250 years)
    const filteredStatic = timelineEvents.filter(event => {
        const yearDiff = Math.abs(event.year - activeYear);
        const matchesYearRange = (yearDiff <= 350); // Show events near the selected year
        
        const matchesCategory = (activeCategory === "all" || event.category === activeCategory);
        const matchesSearch = (
            event.title.toLowerCase().includes(searchFilter) ||
            event.description.toLowerCase().includes(searchFilter) ||
            event.category.toLowerCase().includes(searchFilter)
        );
        return matchesYearRange && matchesCategory && matchesSearch;
    });

    // Filter live events
    const filteredLive = liveEvents.filter(event => {
        const matchesCategory = (activeCategory === "all" || event.category === activeCategory);
        const matchesSearch = (
            event.title.toLowerCase().includes(searchFilter) ||
            event.description.toLowerCase().includes(searchFilter)
        );
        return matchesCategory && matchesSearch;
    });

    // Merge static and live events
    const allRenderedEvents = [...filteredStatic, ...filteredLive];

    if (allRenderedEvents.length === 0 && !isFetchingLive) {
        container.innerHTML = `
            <div class="empty-state">
                <p>🔍 No historical events found near ${activeYear < 0 ? Math.abs(activeYear) + ' BCE' : activeYear + ' CE'}.</p>
                <p style="font-size: 12px; margin-top: 8px; color: var(--text-muted)">Try moving the slider or selecting another century epoch.</p>
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

        const card = document.createElement("article");
        card.className = `timeline-event-card ${sideClass} ${catClass}`;
        card.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="event-card-inner">
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
