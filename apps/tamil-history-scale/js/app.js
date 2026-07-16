// Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
// Tamil Heritage & History Scale - UI & Timeline Logic

let timelineEvents = [];
let activeCategory = "all";
let searchFilter = "";

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
}

async function loadEventsData() {
    const container = document.getElementById("timeline-events-container");
    try {
        // Cache-busting URL parameter
        const response = await fetch("data/events.json?v=" + new Date().getTime());
        if (!response.ok) {
            throw new Error("Failed to fetch historical events data");
        }
        timelineEvents = await response.json();
        
        // Populate initial stats
        document.getElementById("stat-total-events").textContent = timelineEvents.length;
        
        renderTimeline();
    } catch (err) {
        console.error("Error loading events database:", err);
        container.innerHTML = `
            <div class="empty-state">
                <p>⚠️ Failed to load historical scale database. Check console details.</p>
            </div>
        `;
    }
}

function renderTimeline() {
    const container = document.getElementById("timeline-events-container");
    container.innerHTML = "";

    // Filter events
    const filteredEvents = timelineEvents.filter(event => {
        const matchesCategory = (activeCategory === "all" || event.category === activeCategory);
        const matchesSearch = (
            event.title.toLowerCase().includes(searchFilter) ||
            event.description.toLowerCase().includes(searchFilter) ||
            event.category.toLowerCase().includes(searchFilter)
        );
        return matchesCategory && matchesSearch;
    });

    if (filteredEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>🔍 No historical events match your search or filter criteria.</p>
            </div>
        `;
        return;
    }

    // Render cards alternately (left/right)
    filteredEvents.forEach((event, index) => {
        const sideClass = (index % 2 === 0) ? "" : "right-side";
        
        // CSS category class mapping
        let catClass = "cat-general";
        if (event.category === "Rulers & Kingdoms") catClass = "cat-rulers";
        else if (event.category === "Literature & Arts") catClass = "cat-literature";
        else if (event.category === "Culture & Heritage") catClass = "cat-culture";
        else if (event.category === "Colonial Era") catClass = "cat-colonial";

        // Format Date nicely: YYYY-MM-DD to DD Month YYYY
        let formattedDate = event.date;
        try {
            const dateObj = new Date(event.date);
            if (!isNaN(dateObj)) {
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                formattedDate = dateObj.toLocaleDateString('en-US', options);
            }
        } catch(e) {}

        const card = document.createElement("article");
        card.className = `timeline-event-card ${sideClass} ${catClass}`;
        card.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="event-card-inner">
                <div class="event-header">
                    <span class="event-date-badge">${formattedDate}</span>
                    <span class="event-category-badge">${event.category}</span>
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
