// Ancient Tamil Maritime Trade & Voyage Simulator
// Redesigned for Kids & Learners

// Simulator State
let map;
let ports = [];
let markersLayer;
let routeLayer;
let turtleLayer;
let decorationLayer;
let shipMarker = null;
let currentSimulation = null;
let audioContext = null;
let isMuted = true;

// Ship Speeds & Morale modifiers
const VESSEL_TYPES = {
    catamaran: { name: "Chera Catamaran (Kattu-maram)", speed: 7, safety: 0.5, capacity: 50, icon: "images/catamaran.png" },
    nava: { name: "Chola Navy Nava", speed: 5, safety: 0.9, capacity: 150, icon: "images/nava.png" },
    sanggu: { name: "Pandya Merchant Ship (Thoni)", speed: 4, safety: 0.75, capacity: 200, icon: "images/thoni.png" }
};

// Monsoons
const MONSOONS = {
    southwest: { name: "Southwest Monsoon (SW to NE)", dir: [1, 1], desc: "💨 Winds blow from Africa towards India! Perfect for sailing east." },
    northeast: { name: "Northeast Monsoon (NE to SW)", dir: [-1, -1], desc: "🌬️ Winds blow from China/India towards the west! Perfect for sailing home." }
};

// Port Quizzes Database
const PORT_QUIZZES = {
    musiri: {
        question: "What did Roman traders buy in huge amounts from Musiri? (Also called 'Malabar Gold'!)",
        choices: [
            { text: "🌿 Black Pepper", correct: true },
            { text: "🍫 Chocolate", correct: false },
            { text: "🍍 Pineapples", correct: false }
        ],
        trivia: "Musiri was world-famous for Black Pepper. Romans loved it so much they paid in pure gold coins!"
    },
    poompuhar: {
        question: "Poompuhar is located at the mouth of which famous river?",
        choices: [
            { text: "🌊 Kaveri River", correct: true },
            { text: "🌊 Nile River", correct: false },
            { text: "🌊 Ganges River", correct: false }
        ],
        trivia: "Poompuhar was a grand city where the Kaveri river meets the ocean. Ancient poems describe giant ships loading goods here."
    },
    korkai: {
        question: "What precious shiny treasure did Pandya divers search for under the sea at Korkai?",
        choices: [
            { text: "💎 Natural Pearls", correct: true },
            { text: "🪙 Pirate Gold Chests", correct: false },
            { text: "🍀 Seaweed Soup", correct: false }
        ],
        trivia: "Korkai pearls were considered the most beautiful and expensive pearls in the whole Roman Empire!"
    },
    arikamedu: {
        question: "Arikamedu was an ancient factory town famous for making what?",
        choices: [
            { text: "🔮 Glass Beads & Pottery", correct: true },
            { text: "🧸 Wooden Teddy Bears", correct: false },
            { text: "🚲 Iron Bicycles", correct: false }
        ],
        trivia: "Archaeologists found thousands of Roman amphorae (wine jars) and tiny beautiful glass beads made here!"
    },
    berenike: {
        question: "How did traders carry spices from Berenike across the Egyptian desert to the Nile river?",
        choices: [
            { text: "🐪 Camels (Desert Ships)", correct: true },
            { text: "🚂 Steam Trains", correct: false },
            { text: "🚲 Wooden Bicycles", correct: false }
        ],
        trivia: "Berenike was a desert port. Camels carried spices for days to the Nile River, where they were shipped to Rome!"
    },
    hover: {
        question: "Are you ready to trade?",
        choices: [
            { text: "Yes! 🪙", correct: true },
            { text: "No", correct: false }
        ],
        trivia: "You reached the destination safely."
    },
    kadaram: {
        question: "What useful metal was Kadaram (in modern Malaysia) famous for trading?",
        choices: [
            { text: "🔩 Tin", correct: true },
            { text: "💎 Diamonds", correct: false },
            { text: "⚡ Vibranium", correct: false }
        ],
        trivia: "The Chola Emperor built a strong alliance with Kadaram to protect trade routes of tin and aromatic woods."
    },
    guangzhou: {
        question: "What luxury soft fabric did Tamil merchants trade for in Guangzhou, China?",
        choices: [
            { text: "👕 Silk", correct: true },
            { text: "👖 Denim Jeans", correct: false },
            { text: "🧥 Woolen Coats", correct: false }
        ],
        trivia: "Tamil merchant guilds like the 'Ayyavole 500' sailed all the way to China to exchange pearls and pepper for precious silk!"
    }
};

// Initialize app
document.addEventListener("DOMContentLoaded", async () => {
    initMap();
    await loadPorts();
    setupSimulatorControls();
    addMapDecorations();
});

// Initialize Leaflet Map with kid-friendly layout
function initMap() {
    map = L.map("map", {
        center: [14.0, 78.0],
        zoom: 4,
        minZoom: 3,
        maxZoom: 8,
        maxBounds: [[-40, 10], [50, 140]]
    });

    // Bright, colorful, kid-friendly tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    turtleLayer = L.layerGroup().addTo(map);
    decorationLayer = L.layerGroup().addTo(map);
}

// Add cute animated/clickable sea creatures to make the map fun
function addMapDecorations() {
    decorationLayer.clearLayers();

    // Friendly Dolphin
    const dolphinMarker = L.marker([8.0, 68.0], {
        icon: L.divIcon({
            html: '<div style="font-size: 2.2rem; cursor: pointer; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.15));">🐬</div>',
            className: 'sea-creature',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }).addTo(decorationLayer);
    
    dolphinMarker.bindPopup(`
        <div style="text-align: center;">
            <h3>🐬 Playful Dolphin</h3>
            <p>Dolphins love swimming alongside Chera catamarans! They bring good luck to the crew.</p>
            <button class="modal-btn primary-btn" onclick="playDolphinSound()" style="padding: 4px 10px; font-size: 0.8rem; border-radius: 8px;">Hear Dolphin! 🎵</button>
        </div>
    `);

    // Friendly Whale
    const whaleMarker = L.marker([-2.0, 85.0], {
        icon: L.divIcon({
            html: '<div style="font-size: 2.5rem; cursor: pointer; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.15));">🐳</div>',
            className: 'sea-creature',
            iconSize: [45, 45],
            iconAnchor: [22, 22]
        })
    }).addTo(decorationLayer);
    
    whaleMarker.bindPopup(`
        <div style="text-align: center;">
            <h3>🐳 Gentle Blue Whale</h3>
            <p>The blue whale is the biggest animal on Earth! It sings deep songs in the Indian Ocean.</p>
        </div>
    `);

    // Cute Sea Monster
    const krakenMarker = L.marker([4.0, 93.0], {
        icon: L.divIcon({
            html: '<div style="font-size: 2.3rem; cursor: pointer; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.15));">🐙</div>',
            className: 'sea-creature',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }).addTo(decorationLayer);
    
    krakenMarker.bindPopup(`
        <div style="text-align: center;">
            <h3>🐙 Friendly Octopus</h3>
            <p>"Hello Captains! I'm not a scary monster. I just wanted to wave hello with all my 8 arms!"</p>
        </div>
    `);
}

// Load ports data from JSON
async function loadPorts() {
    try {
        const response = await fetch("data/ports.json?v=" + new Date().getTime());
        if (!response.ok) throw new Error("Failed to load ports.json");
        ports = await response.json();
        
        populatePortDropdowns();
        renderPortMarkers();
    } catch (err) {
        console.error(err);
        showToast("Error loading ports data 😢", "danger");
    }
}

// Populate dropdown selectors
function populatePortDropdowns() {
    const originSelect = document.getElementById("origin-port");
    const destSelect = document.getElementById("destination-port");

    originSelect.innerHTML = "";
    destSelect.innerHTML = "";

    ports.forEach(port => {
        const isTamilPort = ["musiri", "poompuhar", "korkai", "arikamedu"].includes(port.id);
        
        const originOpt = document.createElement("option");
        originOpt.value = port.id;
        originOpt.textContent = `${port.name} (${port.region})`;
        if (!isTamilPort) originOpt.disabled = true; // Tamil ports as starting point
        originSelect.appendChild(originOpt);

        const destOpt = document.createElement("option");
        destOpt.value = port.id;
        destOpt.textContent = `${port.name} (${port.region})`;
        destSelect.appendChild(destOpt);
    });

    // Default selection
    originSelect.value = "musiri";
    destSelect.value = "berenike";
}

// Render Port Markers on map
function renderPortMarkers() {
    markersLayer.clearLayers();

    ports.forEach(port => {
        const isTamilPort = ["musiri", "poompuhar", "korkai", "arikamedu"].includes(port.id);
        const markerClass = isTamilPort ? "port-marker-inner" : "port-marker-inner foreign";
        
        // Use cute emoji representing the port's personality
        let portEmoji = "🏛️";
        if (port.id === "musiri") portEmoji = "🌿";
        else if (port.id === "poompuhar") portEmoji = "🏰";
        else if (port.id === "korkai") portEmoji = "💎";
        else if (port.id === "arikamedu") portEmoji = "🏺";
        else if (port.id === "berenike") portEmoji = "🐪";
        else if (port.id === "kadaram") portEmoji = "🪵";
        else if (port.id === "guangzhou") portEmoji = "⛩️";

        const customIcon = L.divIcon({
            html: `<div class="${markerClass}">${portEmoji}</div>`,
            className: "port-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const marker = L.marker(port.coordinates, { icon: customIcon });
        
        const popupContent = `
            <div style="font-family: var(--font-body); font-size: 0.9rem;">
                <h3>${port.name}</h3>
                <p><strong>Region:</strong> ${port.region}</p>
                <p>${port.description}</p>
                <div style="margin-top: 8px; font-size: 0.82rem; border-top: 2px dashed #d3e2f2; padding-top: 6px;">
                    <div style="color: #2e7d32;">📤 <strong>Exports:</strong> ${port.exports.join(", ")}</div>
                    <div style="color: #c62828;">📥 <strong>Imports:</strong> ${port.imports.join(", ")}</div>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
    });
}

// Draw Sea Turtle Migration layers with custom kids icon
function toggleTurtleRoutes(show) {
    turtleLayer.clearLayers();
    if (!show) return;

    // Define coordinates simulating seasonal sea turtle nesting migrations in Indian Ocean
    const pathways = [
        // East Coast India down to Indonesia/Australia
        [[8.63, 78.04], [6.0, 80.0], [2.0, 85.0], [-2.0, 95.0], [-6.0, 105.0]],
        // West Coast India to East Africa
        [[10.21, 76.21], [7.0, 70.0], [3.0, 60.0], [-1.0, 50.0], [-4.0, 39.0]]
    ];

    pathways.forEach(path => {
        const line = L.polyline(path, {
            color: "#4caf50",
            weight: 4,
            dashArray: "6, 12",
            opacity: 0.75
        });
        turtleLayer.addLayer(line);

        // Put a little turtle marker in the middle of each route
        const midPointIndex = Math.floor(path.length / 2);
        const turtlePos = path[midPointIndex];
        const turtleMarker = L.marker(turtlePos, {
            icon: L.divIcon({
                html: '<img src="images/turtle.png" alt="Turtle" style="width: 32px; height: 32px; animation: bounceIllustration 3s infinite;">',
                className: 'turtle-swim-icon',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })
        });
        turtleMarker.bindPopup(`
            <div style="text-align: center;">
                <h3>🐢 Turtle Navigators!</h3>
                <p>Ancient Tamil sailors watched nesting sea turtles and followed their ocean currents to travel safely!</p>
            </div>
        `);
        turtleLayer.addLayer(turtleMarker);
    });
}

// Play Audio synthetics
function initAudio() {
    if (audioContext) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    
    // Create soft wind/ocean noise
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioContext.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(250, audioContext.currentTime);
    
    // LFO wave effect
    const lfo = audioContext.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 80;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.015, audioContext.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    whiteNoise.start();
    lfo.start();

    // Wood creak
    setInterval(() => {
        if (isMuted || !currentSimulation) return;
        playWoodCreak();
    }, 9000);
}

function playWoodCreak() {
    if (!audioContext || isMuted) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(70, audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(25, audioContext.currentTime + 1.8);

    gain.gain.setValueAtTime(0.008, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.8);

    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 1.9);
}

// Cheerful sound when picking choices / answers correct
function playChimeSound(success = true) {
    if (!audioContext || isMuted) return;
    
    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    gain.connect(audioContext.destination);

    if (success) {
        // High double ding!
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.15); // E5
        osc2.frequency.setValueAtTime(783.99, now + 0.15); // G5

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        osc1.start();
        osc2.start();
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
    } else {
        // Low sad buzzer
        const osc = audioContext.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(130, now + 0.4);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.455);

        osc.connect(gain);
        osc.start();
        osc.stop(now + 0.5);
    }
}

function playDolphinSound() {
    if (!audioContext || isMuted) return;
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.linearRampToValueAtTime(2500, now + 0.25);
    osc.frequency.linearRampToValueAtTime(1500, now + 0.5);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(now + 0.7);
}

// Simulator Setup
function setupSimulatorControls() {
    const startBtn = document.getElementById("start-voyage-btn");
    const stopBtn = document.getElementById("stop-voyage-btn");
    const turtleCheckbox = document.getElementById("turtle-migration-toggle");
    const muteBtn = document.getElementById("mute-audio-btn");

    startBtn.addEventListener("click", startVoyage);
    stopBtn.addEventListener("click", stopVoyage);
    
    turtleCheckbox.addEventListener("change", (e) => {
        toggleTurtleRoutes(e.target.checked);
    });

    muteBtn.addEventListener("click", () => {
        isMuted = !isMuted;
        muteBtn.textContent = isMuted ? "🔇 Sound Off" : "🔊 Sound On";
        if (!isMuted) {
            initAudio();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }
    });

    // Populate monsoon desc
    const monsoonSelect = document.getElementById("monsoon-season");
    const monsoonDesc = document.getElementById("monsoon-desc");
    monsoonSelect.addEventListener("change", () => {
        monsoonDesc.textContent = MONSOONS[monsoonSelect.value].desc;
    });
    monsoonDesc.textContent = MONSOONS[monsoonSelect.value].desc;
}

// Smooth sea route generation
function generateVoyagePath(originCoords, destCoords) {
    const path = [originCoords];
    const lat1 = originCoords[0];
    const lng1 = originCoords[1];
    const lat2 = destCoords[0];
    const lng2 = destCoords[1];
    
    // Muziris to Berenike
    if (lng1 < 80 && lng2 < 40) {
        path.push([12.0, 54.0]);
        path.push([11.8, 43.5]); 
    }
    // Coromandel (East India) to Red Sea
    else if (lng1 > 78 && lng2 < 40) {
        path.push([6.0, 79.8]);  
        path.push([10.0, 70.0]); 
        path.push([12.0, 54.0]); 
        path.push([11.8, 43.5]); 
    }
    // Muziris to Southeast Asia
    else if (lng1 < 78 && lng2 > 95) {
        path.push([5.9, 80.0]);  
        path.push([6.0, 95.0]);  
    }
    // East India to Southeast Asia
    else if (lng1 > 78 && lng2 > 95 && lng2 < 110) {
        path.push([6.0, 95.0]); 
    }
    // India to China (Guangzhou)
    else if (lng2 > 110) {
        if (lng1 < 78) path.push([5.9, 80.0]);
        path.push([6.0, 95.0]); 
        path.push([1.3, 103.8]); 
        path.push([10.0, 110.0]); 
    }
    
    path.push(destCoords);
    
    const interpolated = [];
    for (let i = 0; i < path.length - 1; i++) {
        const start = path[i];
        const end = path[i+1];
        const steps = 40; 
        
        for (let j = 0; j < steps; j++) {
            const t = j / steps;
            const lat = start[0] + (end[0] - start[0]) * t;
            const lng = start[1] + (end[1] - start[1]) * t;
            interpolated.push([lat, lng]);
        }
    }
    interpolated.push(destCoords);
    return interpolated;
}

// Start Voyage simulation
function startVoyage() {
    if (currentSimulation) {
        stopVoyage();
    }

    const originId = document.getElementById("origin-port").value;
    const destId = document.getElementById("destination-port").value;
    const vesselType = document.getElementById("vessel-type").value;
    const cargo = document.getElementById("cargo-type").value;
    const monsoon = document.getElementById("monsoon-season").value;

    if (originId === destId) {
        showToast("Origin and Destination cannot be the same! 🛑", "danger");
        return;
    }

    const originPort = ports.find(p => p.id === originId);
    const destPort = ports.find(p => p.id === destId);
    const vessel = VESSEL_TYPES[vesselType];

    // Initialize UI Status
    document.getElementById("start-voyage-btn").style.display = "none";
    document.getElementById("stop-voyage-btn").style.display = "block";
    clearConsole();
    
    writeConsole(`📋 Voyage registered: ${vessel.name}`, "system");
    writeConsole(`⚓ Starting Port: ${originPort.name}`);
    writeConsole(`📍 Destination Port: ${destPort.name}`);
    writeConsole(`📦 Cargo Loaded: ${cargo}`);
    writeConsole(`💨 Sailing with: ${MONSOONS[monsoon].name}`);

    // Generate voyage coordinates
    const pathCoords = generateVoyagePath(originPort.coordinates, destPort.coordinates);

    // Draw routing line
    routeLayer.clearLayers();
    const routeLine = L.polyline(pathCoords, {
        color: "#0071e3",
        weight: 4,
        dashArray: "12, 12",
        opacity: 0.85
    }).addTo(routeLayer);
    
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    // Set custom kid-friendly ship icon
    const shipIcon = L.divIcon({
        html: `<div class="ship-icon"><img src="${vessel.icon}" alt="vessel"></div>`,
        iconSize: [45, 45],
        iconAnchor: [22, 22]
    });
    shipMarker = L.marker(originPort.coordinates, { icon: shipIcon }).addTo(routeLayer);

    let profitPotential = 500;
    if (cargo === "Black Pepper" && destId === "berenike") profitPotential = 2500;
    else if (cargo === "Gulf Pearls" && destId === "guangzhou") profitPotential = 3000;
    else if (cargo === "Roman Gold Coins" && ["musiri", "poompuhar", "korkai"].includes(destId)) profitPotential = 1500;

    currentSimulation = {
        path: pathCoords,
        currentIndex: 0,
        vessel: vessel,
        vesselType: vesselType,
        cargo: cargo,
        origin: originPort,
        destination: destPort,
        monsoon: monsoon,
        morale: 100,
        goldEarned: 0,
        distanceTraveled: 0,
        maxProfit: profitPotential,
        cargoCondition: 100,
        intervalId: null
    };

    updateHUD();

    // Start tick loop
    currentSimulation.intervalId = setInterval(simulationStep, 200);
}

// Stop simulation
function stopVoyage() {
    if (currentSimulation) {
        clearInterval(currentSimulation.intervalId);
        currentSimulation = null;
        writeConsole("🛑 Voyage cancelled by the Captain.", "danger");
    }
    
    if (shipMarker) {
        routeLayer.removeLayer(shipMarker);
        shipMarker = null;
    }
    routeLayer.clearLayers();
    
    document.getElementById("start-voyage-btn").style.display = "block";
    document.getElementById("stop-voyage-btn").style.display = "none";
    
    resetHUD();
}

// Interactive Choice Popup
function showChoiceModal(title, text, illustration, option1, option2) {
    // Pause simulation
    if (currentSimulation) {
        clearInterval(currentSimulation.intervalId);
    }

    const modal = document.getElementById("game-modal");
    document.getElementById("modal-badge").textContent = "ADVENTURE";
    document.getElementById("modal-badge").style.background = "#ffd60a";
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-text").textContent = text;
    document.getElementById("modal-illustration").textContent = illustration;

    const choicesDiv = document.getElementById("modal-choices");
    choicesDiv.innerHTML = "";

    const btn1 = document.createElement("button");
    btn1.className = "modal-btn primary-btn";
    btn1.textContent = option1.text;
    btn1.onclick = () => {
        playChimeSound(true);
        option1.action();
        closeChoiceModal();
    };

    const btn2 = document.createElement("button");
    btn2.className = "modal-btn secondary-btn";
    btn2.textContent = option2.text;
    btn2.onclick = () => {
        playChimeSound(true);
        option2.action();
        closeChoiceModal();
    };

    choicesDiv.appendChild(btn1);
    choicesDiv.appendChild(btn2);
    modal.classList.add("show");
}

function closeChoiceModal() {
    document.getElementById("game-modal").classList.remove("show");
    // Resume simulation
    if (currentSimulation) {
        currentSimulation.intervalId = setInterval(simulationStep, 200);
    }
}

// Single step execution
function simulationStep() {
    if (!currentSimulation) return;

    const sim = currentSimulation;
    sim.currentIndex++;

    if (sim.currentIndex >= sim.path.length) {
        // Destination Arrived! Let's do a quiz!
        clearInterval(sim.intervalId);
        shipMarker.setLatLng(sim.destination.coordinates);
        triggerPortQuiz();
        return;
    }

    const currentLoc = sim.path[sim.currentIndex];
    shipMarker.setLatLng(currentLoc);

    // Progression metrics
    sim.distanceTraveled += 75; 
    updateHUD();

    const tick = sim.currentIndex;
    
    if (tick === 10) {
        writeConsole("🌊 Leaving coastal waters. Waves are getting bigger and fun!");
    }
    
    // Monsoon winds influence speed
    if (tick === 25) {
        const windHelp = checkMonsoonInfluence(sim.origin.coordinates, sim.destination.coordinates, sim.monsoon);
        if (windHelp > 0) {
            writeConsole("💨 Crew catches seasonal monsoon winds! Sailing speed increased! 🚀", "system");
        } else {
            writeConsole("🌬️ Headwinds encountered! Sailing is slower and harder.", "danger");
            sim.morale -= 8;
            updateHUD();
        }
    }

    // Kid interactive choices during storm
    if (tick === 30 && Math.random() < 0.8) {
        triggerInteractiveStorm();
    } 
    // Kid friendly sea-life helper encounter
    else if (tick === 15 && Math.random() < 0.7) {
        triggerDolphinEncounter();
    }
}

function triggerInteractiveStorm() {
    const sim = currentSimulation;
    if (!sim) return;

    showChoiceModal(
        "⛈️ Huge Storm Ahead!",
        "A fierce tropical storm is battering your ship! As the Captain, what is your command?",
        "⛈️",
        {
            text: "⛵ Take down sails & wait (Safe, but loses speed)",
            action: () => {
                sim.morale -= 5;
                sim.cargoCondition -= 2;
                writeConsole("⛈️ Safe choice! Sails lowered. You rode out the storm with minimal cargo damage, but lost speed.", "system");
                updateHUD();
            }
        },
        {
            text: "🌊 Sail fast through the storm (Risky!)",
            action: () => {
                const damage = Math.round(15 + Math.random() * 15);
                const loss = Math.round(10 + Math.random() * 10);
                sim.cargoCondition -= damage;
                sim.morale -= loss;
                writeConsole(`⛈️ Bumpy ride! High waves crashed on deck. Cargo damaged -${damage}%, Morale lost -${loss}%.`, "danger");
                updateHUD();
                playChimeSound(false);
            }
        }
    );
}

function triggerDolphinEncounter() {
    const sim = currentSimulation;
    if (!sim) return;

    showChoiceModal(
        "🐬 Bubbly Dolphins!",
        "A friendly pod of dolphins is jumping next to your ship! The crew is excited. Do you feed them some fish cargo?",
        "🐬",
        {
            text: "🐟 Yes, share some food! (Boosts crew morale)",
            action: () => {
                sim.morale = Math.min(100, sim.morale + 15);
                writeConsole("🐬 The dolphins perform flips in joy! Crew morale increased by 15%!", "system");
                updateHUD();
                playDolphinSound();
            }
        },
        {
            text: "📦 No, save our cargo!",
            action: () => {
                writeConsole("⛵ You sailed past the dolphins. The crew is a bit sad but cargo is safe.", "system");
            }
        }
    );
}

// Port Quiz Arrival Interaction
function triggerPortQuiz() {
    const sim = currentSimulation;
    if (!sim) return;

    const quiz = PORT_QUIZZES[sim.destination.id] || {
        question: "Congratulations on arriving! Are you ready to trade?",
        choices: [
            { text: "Yes! 🪙", correct: true },
            { text: "No", correct: false }
        ],
        trivia: "You made it to the port safely."
    };

    const modal = document.getElementById("game-modal");
    document.getElementById("modal-badge").textContent = "PORT ARRIVAL QUIZ";
    document.getElementById("modal-badge").style.background = "#4caf50";
    document.getElementById("modal-badge").style.color = "#ffffff";
    document.getElementById("modal-title").textContent = `🎉 Arrived at ${sim.destination.name}!`;
    document.getElementById("modal-text").textContent = `Captain, answer this trivia to trade your cargo for maximum gold coins:\n\n${quiz.question}`;
    document.getElementById("modal-illustration").textContent = "🏛️";

    const choicesDiv = document.getElementById("modal-choices");
    choicesDiv.innerHTML = "";

    quiz.choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.className = "modal-btn secondary-btn";
        btn.textContent = choice.text;
        btn.onclick = () => {
            if (choice.correct) {
                playChimeSound(true);
                finishVoyage(true, quiz.trivia);
            } else {
                playChimeSound(false);
                finishVoyage(false, quiz.trivia);
            }
        };
        choicesDiv.appendChild(btn);
    });

    modal.classList.add("show");
}

function finishVoyage(correctAnswer, triviaText) {
    document.getElementById("game-modal").classList.remove("show");
    const sim = currentSimulation;
    if (!sim) return;

    let quizBonus = correctAnswer ? 500 : 100;
    const baseGold = Math.round(sim.maxProfit * (sim.morale / 100) * (sim.cargoCondition / 100));
    const finalGold = baseGold + quizBonus;
    sim.goldEarned = finalGold;
    updateHUD();

    writeConsole(`🎉 Welcome to ${sim.destination.name}!`, "system");
    if (correctAnswer) {
        writeConsole(`⭐ Quiz Correct! You earned a +500 Gold Coins bonus!`, "system");
    } else {
        writeConsole(`💡 Quiz Incorrect. You got a +100 Gold Coins consolation prize.`, "danger");
    }
    writeConsole(`💡 Did you know? ${triviaText}`);
    writeConsole(`🪙 Total Trade earnings: ${finalGold} Gold Coins!`, "system");

    showToast(`Arrived! Earned ${finalGold} Gold! 🪙`, "success");

    document.getElementById("start-voyage-btn").style.display = "block";
    document.getElementById("stop-voyage-btn").style.display = "none";
    currentSimulation = null;
}

// Analyze monsoon influence
function checkMonsoonInfluence(origin, dest, monsoon) {
    const isGoingEast = dest[1] > origin[1];
    if (monsoon === "southwest" && isGoingEast) return 1;
    if (monsoon === "northeast" && !isGoingEast) return 1;
    return -1;
}

// Sidebar Log Utilities
function writeConsole(text, type = "") {
    const consoleLog = document.getElementById("console-log-content");
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    entry.innerHTML = `<span>[${timeStr}]</span> ${text}`;
    consoleLog.appendChild(entry);
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

function clearConsole() {
    document.getElementById("console-log-content").innerHTML = "";
}

// HUD Panel State Modifiers
function updateHUD() {
    if (!currentSimulation) return;
    const sim = currentSimulation;
    document.getElementById("hud-morale").textContent = `${sim.morale}% 😊`;
    document.getElementById("hud-cargo-cond").textContent = `${sim.cargoCondition}% 📦`;
    document.getElementById("hud-gold").textContent = `${sim.goldEarned} 🪙`;
    document.getElementById("hud-distance").textContent = `${sim.distanceTraveled} mi 🗺️`;
}

function resetHUD() {
    document.getElementById("hud-morale").textContent = "-";
    document.getElementById("hud-cargo-cond").textContent = "-";
    document.getElementById("hud-gold").textContent = "0 🪙";
    document.getElementById("hud-distance").textContent = "0 mi 🗺️";
}

// Toast Notifications
function showToast(text, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = text;
    
    if (type === "danger" || type === "error") {
        toast.style.borderColor = "#ff4757";
    } else {
        toast.style.borderColor = "#0071e3";
    }
    
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}
