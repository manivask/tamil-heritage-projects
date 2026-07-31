// System Health Dashboard - UI Data Binding

document.addEventListener("DOMContentLoaded", () => {
    loadReportsIndex();
    loadReport("latest");

    // Dropdown change event
    const select = document.getElementById("report-select");
    select.addEventListener("change", (e) => {
        loadReport(e.target.value);
    });
});

// Load the list of available reports
async function loadReportsIndex() {
    try {
        const response = await fetch("reports/index.json?v=" + new Date().getTime());
        if (!response.ok) return; // No index found yet
        
        const index = await response.json();
        const select = document.getElementById("report-select");
        
        // Clear all except default "latest"
        select.innerHTML = '<option value="latest">Latest Live Diagnostics</option>';
        
        index.forEach(item => {
            const opt = document.createElement("option");
            opt.value = `reports/${item.file}`;
            opt.textContent = `Report: ${item.date}`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Error loading reports index:", err);
    }
}

// Fetch and render selected report
async function loadReport(reportKey) {
    let url = "reports/latest.json";
    let dateStr = "latest";
    
    if (reportKey !== "latest") {
        url = reportKey;
        // Extract YYYY-MM-DD from 'reports/report_YYYY-MM-DD.json'
        const match = reportKey.match(/report_(\d{4}-\d{2}-\d{2})\.json/);
        if (match) {
            dateStr = match[1];
        }
    }
    
    try {
        const response = await fetch(url + "?v=" + new Date().getTime());
        if (!response.ok) throw new Error("Failed to fetch report");
        
        const data = await response.json();
        renderReport(data);
        
        // Load the matching activity tracker report
        loadActivityReport(dateStr);
    } catch (err) {
        console.error("Error loading report:", err);
    }
}

// Load matching activity report
async function loadActivityReport(dateStr) {
    let url = "reports/active_latest.json";
    if (dateStr !== "latest") {
        url = `reports/activity_${dateStr}.json`;
    }
    
    try {
        const response = await fetch(url + "?v=" + new Date().getTime());
        if (!response.ok) {
            document.getElementById("activity-list").innerHTML = '<tr><td colspan="4" class="empty-row">No activity logged for this date.</td></tr>';
            return;
        }
        
        const data = await response.json();
        renderActivity(data);
    } catch (err) {
        console.error("Error loading activity report:", err);
        document.getElementById("activity-list").innerHTML = '<tr><td colspan="4" class="empty-row">No activity logged for this date.</td></tr>';
    }
}

// Bind JSON data to dashboard HTML elements
function renderReport(data) {
    // 1. Specs
    document.getElementById("spec-os").textContent = data.os;
    document.getElementById("spec-processor").textContent = data.processor;
    document.getElementById("spec-cores").textContent = data.cores;
    document.getElementById("spec-ram").textContent = `${data.ram_total_gb} GB`;
    
    // 2. Gauges
    // CPU
    document.getElementById("gauge-cpu-val").textContent = `${data.cpu_usage_percent}%`;
    document.getElementById("gauge-cpu-bar").style.width = `${data.cpu_usage_percent}%`;
    
    // RAM
    document.getElementById("gauge-ram-val").textContent = `${data.ram_usage_percent}%`;
    document.getElementById("gauge-ram-bar").style.width = `${data.ram_usage_percent}%`;
    
    // Temp (Heat)
    document.getElementById("gauge-temp-val").textContent = data.cpu_temp;
    let tempVal = parseFloat(data.cpu_temp) || 35;
    let heatPercent = Math.min(100, Math.max(0, ((tempVal - 30) / (90 - 30)) * 100));
    document.getElementById("gauge-temp-bar").style.width = `${heatPercent}%`;

    // 3. Process Table
    const tableBody = document.getElementById("process-list");
    tableBody.innerHTML = "";
    
    if (data.hogs && data.hogs.length > 0) {
        data.hogs.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.pid}</td>
                <td><strong>${p.name}</strong></td>
                <td class="num-col">${p.cpu_percent}%</td>
                <td class="num-col">${p.memory_percent}%</td>
            `;
            tableBody.appendChild(tr);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="4" class="empty-row">No processes logged.</td></tr>';
    }

    // 4. Diagnostics list
    const diagList = document.getElementById("diagnostics-list");
    diagList.innerHTML = "";
    
    if (data.recommendations && data.recommendations.length > 0) {
        data.recommendations.forEach(rec => {
            const div = document.createElement("div");
            
            // Set alert class based on critical keywords
            let cls = "diag-item";
            if (rec.includes("🚨") || rec.includes("Critical") || rec.includes("hogs") || rec.includes("Hogs")) {
                cls += " danger";
            } else if (rec.includes("⚠️") || rec.includes("High") || rec.includes("Load")) {
                cls += " warning";
            }
            
            div.className = cls;
            div.textContent = rec;
            diagList.appendChild(div);
        });
    } else {
        diagList.innerHTML = '<div class="diag-item">✅ System state is healthy. No issues detected.</div>';
    }
}

// Bind activity log data to HTML
function renderActivity(data) {
    const listBody = document.getElementById("activity-list");
    listBody.innerHTML = "";
    
    if (data.activities && data.activities.length > 0) {
        data.activities.forEach((act, idx) => {
            const share = ((act.seconds / data.total_active_seconds) * 100).toFixed(1);
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td><strong>${act.app}</strong></td>
                <td class="num-col">${act.formatted}</td>
                <td class="num-col">${share}%</td>
            `;
            listBody.appendChild(tr);
        });
    } else {
        listBody.innerHTML = '<tr><td colspan="4" class="empty-row">No activity logged.</td></tr>';
    }
}
