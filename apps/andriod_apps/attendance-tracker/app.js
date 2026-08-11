// Authorized Personnel PIN Mapping (Updated for 8 Committee Members, 4 Principals & 4 VPs)
const AUTHORIZED_PINS = {
    "9900": { role: "President", name: "Senthamil Arasan" },
    
    // Principals (1 per location)
    "9001": { role: "Principal", name: "Kavin Selvam", location: "Chennai Cholai" },
    "9002": { role: "Principal", name: "Ezhil Tamilarasan", location: "Madurai Malar" },
    "9003": { role: "Principal", name: "Kailash Balan", location: "Kovai Kani" },
    "9004": { role: "Principal", name: "Mugilan Pugazh", location: "Nellai Neer" },
    
    // Vice Principals (1 per location)
    "9101": { role: "Vice Principal", name: "Amudha Kumar", location: "Chennai Cholai" },
    "9102": { role: "Vice Principal", name: "Kamali Chitra", location: "Madurai Malar" },
    "9103": { role: "Vice Principal", name: "Yazhini Nila", location: "Kovai Kani" },
    "9104": { role: "Vice Principal", name: "Oviya Thenmozhi", location: "Nellai Neer" },
    
    // 7 Committee Members (Total 8 including President)
    "1001": { role: "Committee Member", name: "Bharathi Raja" },
    "1002": { role: "Committee Member", name: "Elango Mani" },
    "1003": { role: "Committee Member", name: "Kavitha Sundar" },
    "1004": { role: "Committee Member", name: "Muthu Pandian" },
    "1005": { role: "Committee Member", name: "Nila Govindan" },
    "1006": { role: "Committee Member", name: "Selvam Nambi" },
    "1007": { role: "Committee Member", name: "Senthamil Thambi" }
};

const LOCATIONS = ["Chennai Cholai", "Madurai Malar", "Kovai Kani", "Nellai Neer"];
const GRADES = ["LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];

// 1. Generate 80 Teachers: 2 assigned teachers per class (grade) per location
const DEFAULT_TEACHERS = [];
const teacherFirstNames = ["Anbarasan", "Bharathi", "Elango", "Kavitha", "Muthu", "Nila", "Selvam", "Senthamil", "Tamilselvi", "Valarmathi", "Arul", "Chitra", "Devan", "Ezhil", "Iniyan"];
const teacherLastNames = ["Kumar", "Selvam", "Rajan", "Sundaram", "Pandian", "Arasan", "Thambi", "Vasagam", "Nambi", "Govindan"];

let t_index = 1;
LOCATIONS.forEach(loc => {
    GRADES.forEach(gr => {
        for (let t_num = 1; t_num <= 2; t_num++) {
            const fname = teacherFirstNames[t_index % teacherFirstNames.length];
            const lname = teacherLastNames[t_index % teacherLastNames.length];
            DEFAULT_TEACHERS.push({
                ID: `T${String(t_index).padStart(3, '0')}`,
                Name: `${fname} ${lname}`,
                Location: loc,
                "Class Assignment": gr,
                Email: `${fname.toLowerCase()}.${lname.toLowerCase()}@school.com`,
                Phone: `987-654-3${String(t_index).padStart(3, '0')}`
            });
            t_index++;
        }
    });
});

// 2. Generate 90 Students: Clean First and Last names (no initials)
const DEFAULT_STUDENTS = [];
const studentFirstNames = ["Aadhavan", "Abinaya", "Akilan", "Amudhan", "Anbarasu", "Arul", "Balan", "Chitra", "Devan", "Ezhil", "Iniyan", "Kailash", "Kamali", "Kavin", "Kumaran", "Madhi", "Mugilan", "Nila", "Oviya", "Pugazh"];
const studentLastNames = ["Kumar", "Selvam", "Rajan", "Sundaram", "Pandian", "Arasan", "Thambi", "Vasagam", "Nambi", "Govindan"];

for (let i = 0; i < 90; i++) {
    const fname = studentFirstNames[(i * 3) % studentFirstNames.length];
    const lname = studentLastNames[(i * 7) % studentLastNames.length];
    DEFAULT_STUDENTS.push({
        ID: `S${String(i + 1).padStart(3, '0')}`,
        Name: `${fname} ${lname}`,
        Location: LOCATIONS[i % LOCATIONS.length],
        Grade: GRADES[i % GRADES.length],
        "Parent Email": `parent${i + 1}@example.com`
    });
}

// 3. Committee Members Registry List (1 President + 7 Members)
const COMMITTEE_ROSTER = [
    { ID: "C01", Name: "Senthamil Arasan", Role: "President (Committee 1)" },
    { ID: "C02", Name: "Bharathi Raja", Role: "Committee Member 2" },
    { ID: "C03", Name: "Elango Mani", Role: "Committee Member 3" },
    { ID: "C04", Name: "Kavitha Sundar", Role: "Committee Member 4" },
    { ID: "C05", Name: "Muthu Pandian", Role: "Committee Member 5" },
    { ID: "C06", Name: "Nila Govindan", Role: "Committee Member 6" },
    { ID: "C07", Name: "Selvam Nambi", Role: "Committee Member 7" },
    { ID: "C08", Name: "Senthamil Thambi", Role: "Committee Member 8" }
];

// App State
let appState = {
    currentLocation: LOCATIONS[0],
    currentTab: "Students", 
    currentFilter: "all",  
    searchQuery: "",
    currentUserRole: null,
    
    teachers: [...DEFAULT_TEACHERS],
    students: [...DEFAULT_STUDENTS],
    
    attendance: {
        Teachers: {},
        Students: {}
    },
    
    lockedDates: [],
    attestations: {},
    logs: []
};

const TARGET_EMAIL = "manivask@gmail.com";

// DOM Elements
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("excel-file-input");
const fileInfoBar = document.getElementById("file-info-bar");
const loadedFileName = document.getElementById("loaded-file-name");
const attendanceTbody = document.getElementById("attendance-tbody");
const currentSheetTitle = document.getElementById("current-sheet-title");
const thInfo = document.getElementById("th-info");

// Stats
const badgeStudents = document.getElementById("badge-students");
const badgeTeachers = document.getElementById("badge-teachers");
const badgeCommittee = document.getElementById("badge-committee");
const statPresent = document.getElementById("stat-present");
const statAbsent = document.getElementById("stat-absent");
const statUnmarked = document.getElementById("stat-unmarked");

// Simulation
const enableSimCheckbox = document.getElementById("enable-sim");
const simDateInput = document.getElementById("sim-date");
const simTimeInput = document.getElementById("sim-time");
const estCurrentTimeSpan = document.getElementById("est-current-time");
const effectiveDateSpan = document.getElementById("effective-date");
const timeWindowStatusDiv = document.getElementById("time-window-status");
const statusTitleSpan = document.getElementById("status-title");
const statusTimeSpan = document.getElementById("status-time");

// Security Gate
const pinGateOverlay = document.getElementById("pin-gate-overlay");
const pinEntryInput = document.getElementById("pin-entry");
const pinErrorMsg = document.getElementById("pin-error-msg");
const activeUserRoleSpan = document.getElementById("active-user-role");

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
    const nowEst = getEstDateTime(new Date());
    simDateInput.value = nowEst.toISOString().split('T')[0];
    simTimeInput.value = String(nowEst.getHours()).padStart(2, '0') + ":" + String(nowEst.getMinutes()).padStart(2, '0');
    
    loadStateFromLocalStorage();
    checkAccessGate();
    setupDragAndDrop();
    
    setInterval(updateDateTimeAndRules, 1000);
    updateDateTimeAndRules();
    
    renderList();
});

// Access Gate Authorization Checking
function checkAccessGate() {
    if (appState.currentUserRole) {
        pinGateOverlay.style.display = "none";
        document.getElementById("main-app-container").style.filter = "none";
        document.getElementById("main-app-container").style.pointerEvents = "auto";
        activeUserRoleSpan.textContent = appState.currentUserRole.name + ` (${appState.currentUserRole.role})`;
    } else {
        pinGateOverlay.style.display = "flex";
        document.getElementById("main-app-container").style.filter = "blur(10px)";
        document.getElementById("main-app-container").style.pointerEvents = "none";
        activeUserRoleSpan.textContent = "Visitor";
        pinEntryInput.focus();
    }
}

function handlePinInput() {
    const pin = pinEntryInput.value;
    if (pin.length === 4) {
        if (AUTHORIZED_PINS[pin]) {
            appState.currentUserRole = AUTHORIZED_PINS[pin];
            pinErrorMsg.style.display = "none";
            pinEntryInput.value = "";
            
            logActivity(`Access Authorized: ${appState.currentUserRole.name} logged in`);
            
            saveStateToLocalStorage();
            checkAccessGate();
            updateDateTimeAndRules();
            renderList();
        } else {
            pinErrorMsg.style.display = "block";
            pinEntryInput.value = "";
            pinEntryInput.focus();
        }
    }
}

function lockAppAccess() {
    if (appState.currentUserRole) {
        logActivity(`Access Revoked: ${appState.currentUserRole.name} logged out`);
    }
    appState.currentUserRole = null;
    saveStateToLocalStorage();
    checkAccessGate();
}

// Audit Logging
function logActivity(message) {
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const logItem = `[${timestamp} EST] ${message}`;
    appState.logs.unshift(logItem);
    saveStateToLocalStorage();
    renderAuditLogs();
}

function renderAuditLogs() {
    const auditList = document.getElementById("audit-list");
    if (appState.logs.length === 0) {
        auditList.innerHTML = `<div class="audit-empty">No activity logs recorded yet. Changes made will appear here.</div>`;
        return;
    }
    auditList.innerHTML = appState.logs.map(log => `<div class="audit-item">${log}</div>`).join("");
}

function toggleAuditLogs() {
    const auditBody = document.getElementById("audit-body");
    const toggleIcon = document.getElementById("audit-toggle-icon");
    if (auditBody.style.display === "none") {
        auditBody.style.display = "block";
        toggleIcon.textContent = "▲";
    } else {
        auditBody.style.display = "none";
        toggleIcon.textContent = "▼";
    }
}

// Drag and drop setup
function setupDragAndDrop() {
    dropZone.addEventListener("click", () => fileInput.click());
    
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });
    
    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });
    
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            handleExcelFile(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleExcelFile(e.target.files[0]);
        }
    });
}

// Convert UTC or local date to America/New_York Date object
function getEstDateTime(date) {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const dateMap = {};
    parts.forEach(p => dateMap[p.type] = p.value);
    
    return new Date(
        dateMap.year,
        dateMap.month - 1,
        dateMap.day,
        dateMap.hour,
        dateMap.minute,
        dateMap.second
    );
}

// Check if current logged in user can bypass locks (is Principal or VP)
function canBypassLock() {
    if (!appState.currentUserRole) return false;
    const role = appState.currentUserRole.role;
    return role === "Principal" || role === "Vice Principal";
}

// Time and rules validation
function updateDateTimeAndRules() {
    let now;
    if (enableSimCheckbox.checked) {
        const simDateStr = simDateInput.value;
        const simTimeStr = simTimeInput.value;
        now = new Date(`${simDateStr}T${simTimeStr}:00`);
    } else {
        now = getEstDateTime(new Date());
    }
    
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    estCurrentTimeSpan.textContent = now.toLocaleTimeString('en-US', timeOptions) + " EST";
    
    const dayOfWeek = now.getDay();
    let effectiveDate = new Date(now);
    
    if (dayOfWeek !== 5) {
        const daysToFriday = (5 - dayOfWeek + 7) % 7;
        effectiveDate.setDate(now.getDate() + daysToFriday);
    }
    
    const dateStr = effectiveDate.toISOString().split('T')[0];
    effectiveDateSpan.textContent = dateStr + " (Friday)";
    
    const isFriday = now.getDay() === 5;
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const timeVal = hour * 60 + minutes;
    
    const windowStart = 18 * 60; // 6:00 PM
    const windowEnd = 22 * 60;   // 10:00 PM
    
    const isWithinTimeWindow = isFriday && (timeVal >= windowStart && timeVal < windowEnd);
    const isDateLocked = appState.lockedDates.includes(dateStr);
    
    // Manage Attestation checks (Principals & VPs can toggle anytime)
    const attestVpCheck = document.getElementById("attest-vp");
    const attestPrincipalCheck = document.getElementById("attest-principal");
    
    const dateAttestation = appState.attestations[dateStr] || { vp: false, principal: false };
    attestVpCheck.checked = dateAttestation.vp;
    attestPrincipalCheck.checked = dateAttestation.principal;
    
    if (isDateLocked && !canBypassLock()) {
        attestVpCheck.disabled = true;
        attestPrincipalCheck.disabled = true;
    } else {
        attestVpCheck.disabled = false;
        attestPrincipalCheck.disabled = false;
    }
    
    timeWindowStatusDiv.className = "time-window-status";
    handleAttestationChange(); 
    
    if (isDateLocked) {
        timeWindowStatusDiv.classList.add("locked");
        statusTitleSpan.textContent = "Attendance Locked";
        if (canBypassLock()) {
            statusTimeSpan.textContent = "Principal Bypass Mode";
        } else {
            statusTimeSpan.textContent = `${dateStr} Submitted`;
        }
    } else if (isWithinTimeWindow) {
        timeWindowStatusDiv.classList.add("active");
        statusTitleSpan.textContent = "Window Active";
        const minutesLeft = windowEnd - timeVal;
        statusTimeSpan.textContent = `Closes in ${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`;
    } else {
        timeWindowStatusDiv.classList.add("outside-hours");
        statusTitleSpan.textContent = "Session Closed";
        if (isFriday && timeVal >= windowEnd) {
            statusTimeSpan.textContent = "Closed for Today";
        } else {
            statusTimeSpan.textContent = "Opens Friday 6 PM EST";
        }
    }
}

// Checkbox change handler for attestations
function handleAttestationChange() {
    const activeDate = getActiveDateString();
    const isDateLocked = appState.lockedDates.includes(activeDate);
    const submitBtn = document.getElementById("btn-submit-attendance");
    
    const vpAttested = document.getElementById("attest-vp").checked;
    const principalAttested = document.getElementById("attest-principal").checked;
    
    const oldVp = appState.attestations[activeDate]?.vp || false;
    const oldPrin = appState.attestations[activeDate]?.principal || false;
    
    if (!appState.attestations[activeDate]) {
        appState.attestations[activeDate] = { vp: false, principal: false };
    }
    
    if (vpAttested !== oldVp) {
        logActivity(`${appState.currentUserRole?.name || "Someone"} changed VP Attestation to ${vpAttested ? "Checked" : "Unchecked"} for date ${activeDate}`);
    }
    if (principalAttested !== oldPrin) {
        logActivity(`${appState.currentUserRole?.name || "Someone"} changed Principal Attestation to ${principalAttested ? "Checked" : "Unchecked"} for date ${activeDate}`);
    }
    
    appState.attestations[activeDate].vp = vpAttested;
    appState.attestations[activeDate].principal = principalAttested;
    saveStateToLocalStorage();
    
    if (isDateLocked && !canBypassLock()) {
        submitBtn.disabled = true;
        submitBtn.textContent = "🔒 Attendance Submitted & Locked";
        return;
    }
    
    if (vpAttested && principalAttested) {
        submitBtn.disabled = false;
        if (isDateLocked) {
            submitBtn.textContent = "✉️ Re-Submit Attendance (Correction)";
        } else {
            submitBtn.textContent = "✉️ Submit with PIN Verification";
        }
    } else {
        submitBtn.disabled = true;
        submitBtn.textContent = "✍️ Awaiting Principal & VP Sign-Off";
    }
}

// Toggle simulation panel collapse
function toggleSimPanel() {
    const simBody = document.getElementById("sim-body");
    const toggleIcon = document.getElementById("sim-toggle-icon");
    if (simBody.style.display === "none") {
        simBody.style.display = "flex";
        toggleIcon.textContent = "▲";
    } else {
        simBody.style.display = "none";
        toggleIcon.textContent = "▼";
    }
}

// Quick Scenario helper
function setQuickScenario(dateStr, timeStr) {
    enableSimCheckbox.checked = true;
    simDateInput.value = dateStr;
    simTimeInput.value = timeStr;
    updateDateTimeAndRules();
    renderList();
}

// Handle imported Excel File
function handleExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Extract Teachers
            if (workbook.Sheets["Teachers"]) {
                const teachersJson = XLSX.utils.sheet_to_json(workbook.Sheets["Teachers"]);
                if (teachersJson.length > 0 && teachersJson[0].Name) {
                    appState.teachers = teachersJson.map((t, idx) => ({
                        ID: t.ID || `T${idx+1}`,
                        Name: t.Name,
                        Location: t.Location || LOCATIONS[0],
                        "Class Assignment": t["Class Assignment"] || GRADES[0],
                        Email: t.Email || "",
                        Phone: t.Phone || ""
                    }));
                    
                    parseHistoricalAttendance("Teachers", workbook.Sheets["Teachers"]);
                }
            }
            
            // Extract Students
            if (workbook.Sheets["Students"]) {
                const studentsJson = XLSX.utils.sheet_to_json(workbook.Sheets["Students"]);
                if (studentsJson.length > 0 && studentsJson[0].Name) {
                    appState.students = studentsJson.map((s, idx) => ({
                        ID: s.ID || `S${String(idx+1).padStart(3, '0')}`,
                        Name: s.Name,
                        Location: s.Location || LOCATIONS[0],
                        Grade: s.Grade || GRADES[0],
                        "Parent Email": s["Parent Email"] || ""
                    }));
                    
                    parseHistoricalAttendance("Students", workbook.Sheets["Students"]);
                }
            }
            
            loadedFileName.textContent = file.name;
            fileInfoBar.style.display = "flex";
            dropZone.style.display = "none";
            
            logActivity(`Imported database spreadsheet: ${file.name}`);
            saveStateToLocalStorage();
            renderList();
            
            alert("Excel sheet loaded successfully!");
        } catch (err) {
            console.error(err);
            alert("Error parsing Excel file. Make sure sheets 'Teachers' and 'Students' with 'Location' columns are present.");
        }
    };
    reader.readAsArrayBuffer(file);
}

// Parse columns with Friday date formats (YYYY-MM-DD) from sheet
function parseHistoricalAttendance(tabName, sheet) {
    const json = XLSX.utils.sheet_to_json(sheet);
    if (json.length === 0) return;
    
    const keys = Object.keys(json[0]);
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    
    keys.forEach(key => {
        if (datePattern.test(key)) {
            if (!appState.attendance[tabName][key]) {
                appState.attendance[tabName][key] = {};
            }
            if (!appState.lockedDates.includes(key)) {
                appState.lockedDates.push(key);
            }
            if (!appState.attestations[key]) {
                appState.attestations[key] = { vp: true, principal: true };
            }
            
            json.forEach(row => {
                const id = row.ID;
                const status = String(row[key]).trim().toLowerCase();
                if (status === "present" || status === "p") {
                    appState.attendance[tabName][key][id] = "present";
                } else if (status === "absent" || status === "a") {
                    appState.attendance[tabName][key][id] = "absent";
                }
            });
        }
    });
}

function getActiveDateString() {
    let now;
    if (enableSimCheckbox.checked) {
        now = new Date(`${simDateInput.value}T${simTimeInput.value}:00`);
    } else {
        now = getEstDateTime(new Date());
    }
    
    const dayOfWeek = now.getDay();
    let effectiveDate = new Date(now);
    if (dayOfWeek !== 5) {
        const daysToFriday = (5 - dayOfWeek + 7) % 7;
        effectiveDate.setDate(now.getDate() + daysToFriday);
    }
    return effectiveDate.toISOString().split('T')[0];
}

// Set individual attendance status with Lock Bypass for Principals & VPs
function setAttendance(id, status) {
    const activeDate = getActiveDateString();
    const isLocked = appState.lockedDates.includes(activeDate);
    
    if (isLocked && !canBypassLock()) {
        alert("This record is locked and cannot be edited.");
        return;
    }
    
    const tab = appState.currentTab;
    const item = tab === "Students" ? appState.students.find(s => s.ID === id) : appState.teachers.find(t => t.ID === id);
    const oldStatus = appState.attendance[tab][activeDate]?.[id] || "Unmarked";
    
    if (!appState.attendance[tab][activeDate]) {
        appState.attendance[tab][activeDate] = {};
    }
    
    appState.attendance[tab][activeDate][id] = status;
    
    const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
    const displayOld = oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1);
    
    if (isLocked && canBypassLock()) {
        logActivity(`🔒 LOCKED CORRECTION: ${appState.currentUserRole?.name} (${appState.currentUserRole?.role}) updated locked date ${activeDate} record of ${item.Name} (${id}) from ${displayOld} to ${displayStatus}`);
    } else {
        logActivity(`${appState.currentUserRole?.name} (${appState.currentUserRole?.role}) changed ${item.Name} (${id}) status from ${displayOld} to ${displayStatus} at ${appState.currentLocation}`);
    }
    
    saveStateToLocalStorage();
    renderList();
}

// Switch tabs
function switchTab(tabName) {
    appState.currentTab = tabName;
    
    document.getElementById("tab-students").classList.toggle("active", tabName === "Students");
    document.getElementById("tab-teachers").classList.toggle("active", tabName === "Teachers");
    document.getElementById("tab-committee").classList.toggle("active", tabName === "Committee");
    
    currentSheetTitle.textContent = tabName === "Students" ? "Students List" : tabName === "Teachers" ? "Teachers List" : "Committee Roster";
    thInfo.textContent = tabName === "Students" ? "Grade" : tabName === "Teachers" ? "Class Assignment" : "Role";
    
    const gridBar = document.getElementById("grid-controls-bar");
    const statusFiltersGroup = document.getElementById("status-filters-group");
    const selectionStatsGroup = document.getElementById("selection-stats-container");
    const thStatusCol = document.getElementById("th-status-col");
    
    if (tabName === "Committee") {
        gridBar.style.display = "none";
        selectionStatsGroup.style.display = "none";
        thStatusCol.textContent = "Status Check";
    } else {
        gridBar.style.display = "flex";
        statusFiltersGroup.style.display = "flex";
        selectionStatsGroup.style.display = "flex";
        thStatusCol.textContent = "Status";
    }
    
    renderList();
}

// Filter lists
function setFilter(filterType) {
    appState.currentFilter = filterType;
    document.querySelectorAll(".filters button").forEach(btn => {
        btn.classList.remove("active");
    });
    
    const targetIdx = filterType === 'all' ? 0 : filterType === 'present' ? 1 : filterType === 'absent' ? 2 : 3;
    document.querySelectorAll(".filters button")[targetIdx].classList.add("active");
    
    renderList();
}

function filterList() {
    appState.searchQuery = document.getElementById("search-input").value.toLowerCase();
    renderList();
}

function handleLocationChange() {
    appState.currentLocation = document.getElementById("location-select").value;
    renderList();
}

// Render list & stats
function renderList() {
    const tab = appState.currentTab;
    const activeDate = getActiveDateString();
    const isLocked = appState.lockedDates.includes(activeDate);
    
    const totalStudentsAtLoc = appState.students.filter(s => s.Location === appState.currentLocation).length;
    const totalTeachersAtLoc = appState.teachers.filter(t => t.Location === appState.currentLocation).length;
    
    badgeStudents.textContent = totalStudentsAtLoc;
    badgeTeachers.textContent = totalTeachersAtLoc;
    badgeCommittee.textContent = COMMITTEE_ROSTER.length;
    
    if (tab === "Committee") {
        attendanceTbody.innerHTML = "";
        COMMITTEE_ROSTER.forEach(member => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${member.ID}</strong></td>
                <td>${member.Name}</td>
                <td>${member.Role}</td>
                <td class="center-align"><span class="locked-cell present">Registered</span></td>
            `;
            attendanceTbody.appendChild(tr);
        });
        document.getElementById("empty-state").style.display = "none";
        return;
    }
    
    const allItems = tab === "Students" ? appState.students : appState.teachers;
    const items = allItems.filter(item => item.Location === appState.currentLocation);
    
    let presentCount = 0;
    let absentCount = 0;
    let unmarkedCount = 0;
    
    items.forEach(item => {
        const status = appState.attendance[tab][activeDate]?.[item.ID];
        if (status === "present") presentCount++;
        else if (status === "absent") absentCount++;
        else unmarkedCount++;
    });
    
    statPresent.textContent = presentCount;
    statAbsent.textContent = absentCount;
    statUnmarked.textContent = unmarkedCount;
    
    attendanceTbody.innerHTML = "";
    let filteredCount = 0;
    
    items.forEach(item => {
        const status = appState.attendance[tab][activeDate]?.[item.ID];
        
        if (appState.currentFilter === "present" && status !== "present") return;
        if (appState.currentFilter === "absent" && status !== "absent") return;
        if (appState.currentFilter === "unmarked" && status) return;
        
        const matchName = item.Name.toLowerCase().includes(appState.searchQuery);
        const matchID = item.ID.toLowerCase().includes(appState.searchQuery);
        if (!matchName && !matchID) return;
        
        filteredCount++;
        const tr = document.createElement("tr");
        const infoVal = tab === "Students" ? item.Grade : item["Class Assignment"];
        
        let statusControlHtml = "";
        // Lock controls ONLY if date is locked AND logged in user is NOT Principal or VP
        if (isLocked && !canBypassLock()) {
            const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unmarked";
            const statusClass = status ? status : "unmarked";
            statusControlHtml = `<span class="locked-cell ${statusClass}">${displayStatus}</span>`;
        } else {
            statusControlHtml = `
                <div class="status-selector">
                    <button class="status-opt present ${status === 'present' ? 'active' : ''}" onclick="setAttendance('${item.ID}', 'present')">P</button>
                    <button class="status-opt absent ${status === 'absent' ? 'active' : ''}" onclick="setAttendance('${item.ID}', 'absent')">A</button>
                </div>
            `;
        }
        
        tr.innerHTML = `
            <td><strong>${item.ID}</strong></td>
            <td>${item.Name}</td>
            <td>${infoVal}</td>
            <td class="center-align">${statusControlHtml}</td>
        `;
        attendanceTbody.appendChild(tr);
    });
    
    document.getElementById("empty-state").style.display = filteredCount === 0 ? "block" : "none";
}

// Generate blank template sheet with SheetJS
function generateSampleExcelTemplate() {
    const wb = XLSX.utils.book_new();
    
    const wsTeachers = XLSX.utils.json_to_sheet(DEFAULT_TEACHERS);
    const wsStudents = XLSX.utils.json_to_sheet(DEFAULT_STUDENTS);
    const wsCommittee = XLSX.utils.json_to_sheet(COMMITTEE_ROSTER);
    
    XLSX.utils.book_append_sheet(wb, wsTeachers, "Teachers");
    XLSX.utils.book_append_sheet(wb, wsStudents, "Students");
    XLSX.utils.book_append_sheet(wb, wsCommittee, "Committee");
    
    XLSX.writeFile(wb, "tamil_school_template_v4.xlsx");
}

// Export excel with new date column + Audit Logs sheet added
function exportExcel() {
    const wb = XLSX.utils.book_new();
    const activeDate = getActiveDateString();
    
    // 1. Prepare teachers sheet
    const teachersData = appState.teachers.map(t => {
        const row = { ID: t.ID, Name: t.Name, Location: t.Location, "Class Assignment": t["Class Assignment"], Email: t.Email, Phone: t.Phone };
        appState.lockedDates.forEach(date => {
            row[date] = appState.attendance.Teachers[date]?.[t.ID] || "";
        });
        if (!appState.lockedDates.includes(activeDate)) {
            row[activeDate] = appState.attendance.Teachers[activeDate]?.[t.ID] || "";
        }
        return row;
    });
    
    // 2. Prepare students sheet
    const studentsData = appState.students.map(s => {
        const row = { ID: s.ID, Name: s.Name, Location: s.Location, Grade: s.Grade, "Parent Email": s["Parent Email"] };
        appState.lockedDates.forEach(date => {
            row[date] = appState.attendance.Students[date]?.[s.ID] || "";
        });
        if (!appState.lockedDates.includes(activeDate)) {
            row[activeDate] = appState.attendance.Students[activeDate]?.[s.ID] || "";
        }
        return row;
    });
    
    // 3. Prepare Audit Logs Sheet
    const logsData = appState.logs.map((logLine, index) => ({
        "Log Number": index + 1,
        "Activity Details": logLine
    }));
    
    const wsTeachers = XLSX.utils.json_to_sheet(teachersData);
    const wsStudents = XLSX.utils.json_to_sheet(studentsData);
    const wsLogs = XLSX.utils.json_to_sheet(logsData);
    const wsCommittee = XLSX.utils.json_to_sheet(COMMITTEE_ROSTER);
    
    XLSX.utils.book_append_sheet(wb, wsTeachers, "Teachers");
    XLSX.utils.book_append_sheet(wb, wsStudents, "Students");
    XLSX.utils.book_append_sheet(wb, wsLogs, "Audit Logs");
    XLSX.utils.book_append_sheet(wb, wsCommittee, "Committee");
    
    XLSX.writeFile(wb, `tamil_school_attendance_${activeDate}.xlsx`);
}

// Submit attendance
function submitAttendance() {
    const activeDate = getActiveDateString();
    
    const unmarkedTeachers = appState.teachers.filter(t => !appState.attendance.Teachers[activeDate]?.[t.ID]);
    const unmarkedStudents = appState.students.filter(s => !appState.attendance.Students[activeDate]?.[s.ID]);
    
    if (unmarkedTeachers.length > 0 || unmarkedStudents.length > 0) {
        const confirmSubmit = confirm(`Warning: You have unmarked records across locations (${unmarkedTeachers.length} teachers, ${unmarkedStudents.length} students). Do you want to submit anyway?`);
        if (!confirmSubmit) return;
    }
    
    const confirmPin = prompt("Enter your 4-digit authorization PIN to sign and submit today's attendance:");
    if (!confirmPin) {
        alert("Submission cancelled. PIN is required.");
        return;
    }
    
    if (!AUTHORIZED_PINS[confirmPin]) {
        alert("Invalid PIN. Submission aborted.");
        return;
    }
    
    const signingUser = AUTHORIZED_PINS[confirmPin];
    
    if (!appState.lockedDates.includes(activeDate)) {
        appState.lockedDates.push(activeDate);
    }
    
    logActivity(`Attendance submitted & locked for date ${activeDate} by ${signingUser.name} (${signingUser.role})`);
    saveStateToLocalStorage();
    
    // Prepare Email parameters
    let emailBody = `Tamil School Attendance Report - Friday ${activeDate}\n`;
    emailBody += `===========================================\n`;
    emailBody += `Submitted by: ${signingUser.name} (${signingUser.role})\n`;
    emailBody += `Status: Verified & Attested by VP & Principal\n`;
    emailBody += `===========================================\n\n`;
    
    LOCATIONS.forEach(loc => {
        const locTeachers = appState.teachers.filter(t => t.Location === loc);
        const locStudents = appState.students.filter(s => s.Location === loc);
        
        const pT = locTeachers.filter(t => appState.attendance.Teachers[activeDate]?.[t.ID] === "present");
        const aT = locTeachers.filter(t => appState.attendance.Teachers[activeDate]?.[t.ID] === "absent");
        const pS = locStudents.filter(s => appState.attendance.Students[activeDate]?.[s.ID] === "present");
        const aS = locStudents.filter(s => appState.attendance.Students[activeDate]?.[s.ID] === "absent");
        
        emailBody += `📍 LOCATION: ${loc}\n`;
        emailBody += `-------------------------------------------\n`;
        emailBody += `- Teachers: Present: ${pT.length}/${locTeachers.length} | Absent: ${aT.length}/${locTeachers.length}\n`;
        if (aT.length > 0) {
            emailBody += `  Absent Teachers: ${aT.map(t => t.Name).join(", ")}\n`;
        }
        emailBody += `- Students: Present: ${pS.length}/${locStudents.length} | Absent: ${aS.length}/${locStudents.length}\n`;
        if (aS.length > 0) {
            emailBody += `  Absent Students: ${aS.map(s => s.Name).join(", ")}\n`;
        }
        emailBody += `\n`;
    });
    
    emailBody += `===========================================\n`;
    emailBody += `Generated by Tamil School Attendance Portal.\n`;
    
    const subject = encodeURIComponent(`Tamil School Attendance & Auditing Report - Friday ${activeDate}`);
    const body = encodeURIComponent(emailBody);
    
    const mailtoUrl = `mailto:${TARGET_EMAIL}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    
    updateDateTimeAndRules();
    renderList();
    exportExcel();
}

// LocalStorage helpers
function saveStateToLocalStorage() {
    localStorage.setItem("attendance_tracker_state_v4", JSON.stringify({
        teachers: appState.teachers,
        students: appState.students,
        attendance: appState.attendance,
        lockedDates: appState.lockedDates,
        attestations: appState.attestations,
        currentUserRole: appState.currentUserRole,
        logs: appState.logs
    }));
}

function loadStateFromLocalStorage() {
    const saved = localStorage.getItem("attendance_tracker_state_v4");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.teachers) appState.teachers = parsed.teachers;
            if (parsed.students) appState.students = parsed.students;
            if (parsed.attendance) appState.attendance = parsed.attendance;
            if (parsed.lockedDates) appState.lockedDates = parsed.lockedDates;
            if (parsed.attestations) appState.attestations = parsed.attestations;
            if (parsed.currentUserRole) appState.currentUserRole = parsed.currentUserRole;
            if (parsed.logs) appState.logs = parsed.logs;
        } catch (e) {
            console.error("Error loading LocalStorage state", e);
        }
    }
    renderAuditLogs();
}

function clearLoadedFile() {
    if (confirm("Are you sure you want to remove the loaded spreadsheet and revert to defaults? Any unsaved data will be lost.")) {
        localStorage.removeItem("attendance_tracker_state_v4");
        appState.teachers = [...DEFAULT_TEACHERS];
        appState.students = [...DEFAULT_STUDENTS];
        appState.attendance = { Teachers: {}, Students: {} };
        appState.lockedDates = [];
        appState.attestations = {};
        appState.currentUserRole = null;
        appState.logs = [];
        
        fileInfoBar.style.display = "none";
        dropZone.style.display = "flex";
        fileInput.value = "";
        
        checkAccessGate();
        renderList();
        renderAuditLogs();
    }
}

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("attendance_tracker_theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
}

if (localStorage.getItem("attendance_tracker_theme") === "light") {
    document.body.classList.remove("dark-mode");
}
