// Ancient Tamil Maritime Trade & Voyage Simulator
// Script Designer / AI Prompt Engineer: Manivasagam Karunakaran

// Simulator State
let map;
let ports = [];
let markersLayer;
let routeLayer;
let turtleLayer;
let shipMarker = null;
let currentSimulation = null;
let audioContext = null;
let ambientOscillators = [];
let isMuted = true;

// Ship Speeds & Morale modifiers
const VESSEL_TYPES = {
    catamaran: { name: "Chera Catamaran (Kattu-maram)", speed: 7, safety: 0.4, capacity: 50, icon: "⛵" },
    nava: { name: "Chola Navy Nava", speed: 5, safety: 0.85, capacity: 150, icon: "🚢" },
    sanggu: { name: "Pandya Merchant Ship (Thoni)", speed: 4, safety: 0.7, capacity: 200, icon: "⛵" }
};

// Monsoons
const MONSOONS = {
    southwest: { name: "Southwest Monsoon (SW to NE)", dir: [1, 1], desc: "Favorable for voyages from Africa/Rome to India, and India to East Asia." },
    northeast: { name: "Northeast Monsoon (NE to SW)", dir: [-1, -1], desc: "Favorable for returning from East Asia to India, and India to the Red Sea." }
};

// Initialize app
document.addEventListener("DOMContentLoaded", async () => {
    initMap();
    await loadPorts();
    setupSimulatorControls();
});

// Initialize Leaflet Map
function initMap() {
    // Centered around the Indian Ocean, showing Rome to China
    map = L.map("map", {
        center: [14.0, 78.0],
        zoom: 4,
        minZoom: 3,
        maxZoom: 10,
        maxBounds: [[-45, 10], [55, 150]]
    });

    // Premium dark tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    turtleLayer = L.layerGroup().addTo(map);
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
        showToast("Error loading ports data", "danger");
    }
}

// Populate dropdown selectors
function populatePortDropdowns() {
    const originSelect = document.getElementById("origin-port");
    const destSelect = document.getElementById("destination-port");

    originSelect.innerHTML = "";
    destSelect.innerHTML = "";

    ports.forEach(port => {
        // Tamil ports are main origins, foreign ports can be destination
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
        
        const customIcon = L.divIcon({
            html: `<div class="${markerClass}"></div>`,
            className: "port-marker",
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker = L.marker(port.coordinates, { icon: customIcon });
        
        // Popup layout
        const popupContent = `
            <div>
                <h3>${port.name}</h3>
                <p><strong>Region:</strong> ${port.region}</p>
                <p>${port.description}</p>
                <div style="margin-top: 8px; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
                    <div>🟢 <strong>Exports:</strong> ${port.exports.join(", ")}</div>
                    <div>🔴 <strong>Imports:</strong> ${port.imports.join(", ")}</div>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
    });
}

// Draw Turtle Migration layers (Orissa Balu context)
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
            color: "#e2b83c",
            weight: 2,
            dashArray: "4, 10",
            opacity: 0.6
        });
        turtleLayer.addLayer(line);
    });
}

// Audio Synthesizer (Ambient Sound Engine)
function initAudio() {
    if (audioContext) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    
    // Create soft wind/ocean noise using oscillator and filter
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
    filter.frequency.setValueAtTime(200, audioContext.currentTime);
    
    // LFO to modulate filter for wave effect
    const lfo = audioContext.createOscillator();
    lfo.frequency.value = 0.15; // Slow wave breathing
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 100;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.015, audioContext.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    whiteNoise.start();
    lfo.start();

    // Wood creak generator periodically
    setInterval(() => {
        if (isMuted || !currentSimulation) return;
        playWoodCreak();
    }, 8000);
}

function playWoodCreak() {
    if (!audioContext || isMuted) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(80, audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(30, audioContext.currentTime + 1.5);

    gain.gain.setValueAtTime(0.01, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);

    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 1.6);
}

function playArrivalBell() {
    if (!audioContext || isMuted) return;
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    osc2.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5

    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.0);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioContext.destination);

    osc1.start();
    osc2.start();
    osc1.stop(audioContext.currentTime + 2.2);
    osc2.stop(audioContext.currentTime + 2.2);
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

// Generate intermediate bezier points for realistic routing instead of straight line through continents
function generateVoyagePath(originCoords, destCoords) {
    // Generate curved sea lanes to dodge main landmasses (simple routing helper)
    const path = [originCoords];
    
    const lat1 = originCoords[0];
    const lng1 = originCoords[1];
    const lat2 = destCoords[0];
    const lng2 = destCoords[1];
    
    // Muziris (West India) to Berenike (Red Sea)
    if (lng1 < 80 && lng2 < 40) {
        // Go via Socotra Island to enter Gulf of Aden
        path.push([12.0, 54.0]);
        path.push([11.8, 43.5]); // Bab el-Mandeb
    }
    // Coromandel (East India) to Red Sea
    else if (lng1 > 78 && lng2 < 40) {
        path.push([6.0, 79.8]);  // South Sri Lanka
        path.push([10.0, 70.0]); // Maldives/Laccadive Sea
        path.push([12.0, 54.0]); // Socotra
        path.push([11.8, 43.5]); // Bab-el-Mandeb
    }
    // Muziris (West India) to Southeast Asia (Kedah)
    else if (lng1 < 78 && lng2 > 95) {
        path.push([5.9, 80.0]);  // South Sri Lanka
        path.push([6.0, 95.0]);  // Northern Sumatra
    }
    // East India to Southeast Asia
    else if (lng1 > 78 && lng2 > 95 && lng2 < 110) {
        path.push([6.0, 95.0]); // Northern Sumatra
    }
    // India to China (Guangzhou)
    else if (lng2 > 110) {
        if (lng1 < 78) path.push([5.9, 80.0]);
        path.push([6.0, 95.0]); // Northern Sumatra
        path.push([1.3, 103.8]); // Singapore Strait
        path.push([10.0, 110.0]); // South China Sea
    }
    
    path.push(destCoords);
    
    // Interpolate points for smooth ship animation
    const interpolated = [];
    for (let i = 0; i < path.length - 1; i++) {
        const start = path[i];
        const end = path[i+1];
        const steps = 40; // granularity
        
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
        showToast("Origin and Destination cannot be the same!", "danger");
        return;
    }

    const originPort = ports.find(p => p.id === originId);
    const destPort = ports.find(p => p.id === destId);
    const vessel = VESSEL_TYPES[vesselType];

    // Initialize UI Status
    document.getElementById("start-voyage-btn").style.display = "none";
    document.getElementById("stop-voyage-btn").style.display = "block";
    clearConsole();
    
    writeConsole(`📋 Initiating trade voyage: ${vessel.name}`, "system");
    writeConsole(`⚓ Port of Origin: ${originPort.name}`);
    writeConsole(`📍 Port of Destination: ${destPort.name}`);
    writeConsole(`📦 Primary Cargo Loaded: ${cargo}`);
    writeConsole(`💨 Navigating season: ${MONSOONS[monsoon].name}`);

    // Generate voyage coordinates
    const pathCoords = generateVoyagePath(originPort.coordinates, destPort.coordinates);

    // Draw routing line
    routeLayer.clearLayers();
    const routeLine = L.polyline(pathCoords, {
        color: "#00f2fe",
        weight: 3,
        dashArray: "10, 10",
        opacity: 0.85
    }).addTo(routeLayer);
    
    // Zoom map to show entire path
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    // Set custom ship marker
    const shipIcon = L.divIcon({
        html: `<div class="ship-icon">${vessel.icon}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
    shipMarker = L.marker(originPort.coordinates, { icon: shipIcon }).addTo(routeLayer);

    // Calculate trade profit factor (Roman gold vs Pepper vs Chinese Silk)
    let profitPotential = 500;
    if (cargo === "Black Pepper" && destId === "berenike") profitPotential = 2500;
    else if (cargo === "Gulf Pearls" && destId === "guangzhou") profitPotential = 3000;
    else if (cargo === "Roman Gold Coins" && ["musiri", "poompuhar", "korkai"].includes(destId)) profitPotential = 1500;

    currentSimulation = {
        path: pathCoords,
        currentIndex: 0,
        vessel: vessel,
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
    currentSimulation.intervalId = setInterval(simulationStep, 150);
}

// Stop current simulation
function stopVoyage() {
    if (currentSimulation) {
        clearInterval(currentSimulation.intervalId);
        currentSimulation = null;
        writeConsole("🛑 Voyage cancelled by command.", "danger");
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

// Single step execution of the voyage
function simulationStep() {
    if (!currentSimulation) return;

    const sim = currentSimulation;
    sim.currentIndex++;

    if (sim.currentIndex >= sim.path.length) {
        // Destination Arrived!
        clearInterval(sim.intervalId);
        shipMarker.setLatLng(sim.destination.coordinates);
        
        const finalGold = Math.round(sim.maxProfit * (sim.morale / 100) * (sim.cargoCondition / 100));
        sim.goldEarned = finalGold;
        updateHUD();
        
        writeConsole(`🎉 Welcome to ${sim.destination.name}!`, "system");
        writeConsole(`💰 Trade mission successful! Earned ${finalGold} Roman Aurii.`, "system");
        writeConsole(`🚢 Crew Morale: ${sim.morale}% | Cargo Condition: ${sim.cargoCondition}%`);
        
        playArrivalBell();
        showToast(`Arrived at ${sim.destination.name}!`, "success");
        
        document.getElementById("start-voyage-btn").style.display = "block";
        document.getElementById("stop-voyage-btn").style.display = "none";
        currentSimulation = null;
        return;
    }

    const currentLoc = sim.path[sim.currentIndex];
    shipMarker.setLatLng(currentLoc);

    // Calculate progression metrics
    sim.distanceTraveled += 75; // simulated miles
    updateHUD();

    // Dynamic events based on coordinates / ticks
    const tick = sim.currentIndex;
    
    // Periodical events
    if (tick === 10) {
        writeConsole("🌊 Leaving coastal waters. Entering deep ocean swells.");
    }
    
    // Monsoon winds influence speed & log
    if (tick === 25) {
        const windHelp = checkMonsoonInfluence(sim.origin.coordinates, sim.destination.coordinates, sim.monsoon);
        if (windHelp > 0) {
            writeConsole("💨 Crew catches seasonal monsoon winds! Sailing speed increased.", "system");
        } else {
            writeConsole("🌬️ Headwinds encountered. Sailing speeds slowed down.", "danger");
            sim.morale -= 5;
        }
    }

    // Random encounters based on safety index
    if (Math.random() < (1.0 - sim.vessel.safety) * 0.04) {
        triggerStormEvent();
    } else if (Math.random() < 0.015) {
        triggerTradeFleetMeet();
    }

    // Ensure values don't go below 0
    sim.morale = Math.max(0, sim.morale);
    sim.cargoCondition = Math.max(0, sim.cargoCondition);
}

// Analyze if chosen monsoon matches trade direction
function checkMonsoonInfluence(origin, dest, monsoon) {
    const isGoingEast = dest[1] > origin[1];
    if (monsoon === "southwest" && isGoingEast) return 1;
    if (monsoon === "northeast" && !isGoingEast) return 1;
    return -1;
}

// Storm Encounter Event
function triggerStormEvent() {
    const sim = currentSimulation;
    if (!sim) return;

    const damage = Math.round(15 + Math.random() * 20);
    const moraleLoss = Math.round(10 + Math.random() * 15);
    sim.cargoCondition -= damage;
    sim.morale -= moraleLoss;

    writeConsole(`⛈️ Severe storm encountered! Vessel battered by large waves. Cargo condition -${damage}%, Crew morale -${moraleLoss}%`, "danger");
    showToast("Storm Encountered!", "error");
}

// Trade Meeting Event
function triggerTradeFleetMeet() {
    const sim = currentSimulation;
    if (!sim) return;

    sim.morale = Math.min(100, sim.morale + 10);
    writeConsole("⛵ Encountered a friendly merchant guild fleet (Ayyavole 500). Exchanged fresh water. Morale improved (+10%).");
}

// Sidebar Log Utilities
function writeConsole(text, type = "") {
    const consoleLog = document.getElementById("console-log-content");
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    
    // Add timestamps
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
    document.getElementById("hud-morale").textContent = `${sim.morale}%`;
    document.getElementById("hud-cargo-cond").textContent = `${sim.cargoCondition}%`;
    document.getElementById("hud-gold").textContent = `${sim.goldEarned} Aurii`;
    document.getElementById("hud-distance").textContent = `${sim.distanceTraveled} mi`;
}

function resetHUD() {
    document.getElementById("hud-morale").textContent = "-";
    document.getElementById("hud-cargo-cond").textContent = "-";
    document.getElementById("hud-gold").textContent = "0 Aurii";
    document.getElementById("hud-distance").textContent = "0 mi";
}

// Toast Notifications
function showToast(text, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = text;
    
    // Simple color code
    if (type === "danger" || type === "error") {
        toast.style.borderColor = "#ff5252";
    } else {
        toast.style.borderColor = "#00f2fe";
    }
    
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}
