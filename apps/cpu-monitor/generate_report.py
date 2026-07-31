# CLI System Diagnostics Report Generator
# Redesigned to log daily reports under reports/ folder for web dashboard tracking

import os
import sys
import time
import json
import platform
import psutil

def get_top_hogs():
    proc_list = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            if proc.info['pid'] == os.getpid():
                continue
            proc_list.append(proc.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
            
    time.sleep(1.0)
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            for p in proc_list:
                if p['pid'] == proc.info['pid']:
                    p['cpu_percent'] = proc.info['cpu_percent']
                    p['memory_percent'] = proc.info['memory_percent']
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    proc_list.sort(key=lambda x: x['cpu_percent'] or 0.0, reverse=True)
    return proc_list[:5]

def generate():
    print("Collecting system metrics...")
    cpu_usage = psutil.cpu_percent(interval=1.0)
    ram = psutil.virtual_memory()
    hogs = get_top_hogs()
    
    ram_used = ram.used / (1024**3)
    ram_total = ram.total / (1024**3)
    
    # Check WMI temperatures
    temp_str = "Unavailable"
    if platform.system() == "Windows":
        try:
            import wmi
            w = wmi.WMI(namespace="root\\wmi")
            temp_info = w.MSAcpi_ThermalZoneTemperature()
            if temp_info:
                temp_str = f"{round((temp_info[0].CurrentTemperature / 10.0) - 273.15, 1)}°C"
        except Exception:
            pass

    hogs_table = "| PID | Process Name | CPU % | RAM % |\n| --- | --- | --- | --- |\n"
    hogs_data = []
    for h in hogs:
        cpu_val = h['cpu_percent'] or 0.0
        mem_val = h['memory_percent'] or 0.0
        hogs_table += f"| {h['pid']} | {h['name']} | {cpu_val:.1f}% | {mem_val:.1f}% |\n"
        hogs_data.append({
            "pid": h['pid'],
            "name": h['name'],
            "cpu_percent": round(cpu_val, 1),
            "memory_percent": round(mem_val, 1)
        })

    # Recommendations
    recommendations = []
    high_cpu_procs = [p for p in hogs if (p['cpu_percent'] or 0.0) > 15.0]
    if high_cpu_procs:
        h_names = ", ".join([p['name'] for p in high_cpu_procs])
        recommendations.append(f"Resource Hogs Detected: {h_names} are using significant CPU. This is the primary driver of heat and fan noise.")
    
    if cpu_usage > 50.0:
        recommendations.append("High CPU Load: Your processor is working hard. The cooling fans spin up automatically to control temperatures.")
    else:
        recommendations.append("Sustained Load: The CPU is currently stable. If the fan noise is loud while load is low, dust build-up or degraded thermal paste is likely the cause.")

    if ram.percent > 80.0:
        recommendations.append("High RAM Usage: Close browser tabs or background apps to avoid system slowdown.")

    date_str = time.strftime('%Y-%m-%d')
    time_str = time.strftime('%Y-%m-%d %H:%M:%S')

    # 1. Compile Markdown report content
    report_content = f"""# 💻 System Health & CPU Diagnostics Report

Generated on: {time_str}

## 📊 System Specifications
- **Operating System**: {platform.system()} {platform.release()}
- **Processor**: {platform.processor() if platform.processor() else 'Generic'}
- **CPU Cores**: {psutil.cpu_count(logical=False)} Physical | {psutil.cpu_count()} Logical
- **Total Installed Memory (RAM)**: {ram_total:.2f} GB

## 📈 Current Performance Metrics
- **Current CPU Load**: {cpu_usage:.1f}%
- **Current RAM Usage**: {ram.percent:.1f}% ({ram_used:.1f} / {ram_total:.1f} GB Used)
- **CPU Temperature**: {temp_str}

## 🔥 Top Resource Consumers
{hogs_table}

## 🩺 Diagnostic Analysis & Recommendations

### Why is my CPU Fan Noise increasing?
Laptop fans increase speed (producing whirring noise) as a direct response to **heat build-up** on the CPU. When multiple applications are run or a single application uses sustained CPU power, the processor consumes more wattage, heating up. The system automatically turns on fans to protect the chip from permanent thermal damage.

### Actionable Fixes to Reduce Fan Noise & Heat:
{chr(10).join(['- ' + r for r in recommendations])}
- **Windows Power Settings**: Go to Control Panel -> Power Options and choose the **Balanced** power plan. This allows Windows to throttle down CPU clocks when idle, reducing heat significantly.
- **Dust and Ventilation**: Ensure the laptop is placed on a hard, flat surface. Soft surfaces like beds block air vents, trapping heat. Clean out dust from exhaust ports.
- **Thermal Paste Renewal**: Since this is an older (but high configuration) laptop, the thermal paste between the CPU and the cooling block might have dried out over time. Renewing the paste can lower temperatures by up to 10-15°C!

---
*Report generated successfully by the CLI Diagnostic Tool.*
"""

    # 2. Compile JSON data structure
    json_data = {
        "date": time_str,
        "os": f"{platform.system()} {platform.release()}",
        "processor": platform.processor() if platform.processor() else "Generic",
        "cores": f"{psutil.cpu_count(logical=False)} Physical | {psutil.cpu_count()} Logical",
        "ram_total_gb": round(ram_total, 2),
        "cpu_usage_percent": round(cpu_usage, 1),
        "ram_usage_percent": round(ram.percent, 1),
        "ram_used_gb": round(ram_used, 1),
        "cpu_temp": temp_str,
        "hogs": hogs_data,
        "recommendations": recommendations
    }

    # Ensure reports folder exists
    base_dir = os.path.dirname(__file__)
    reports_dir = os.path.join(base_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    # Save daily Markdown report
    md_filename = f"report_{date_str}.md"
    md_path = os.path.join(reports_dir, md_filename)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    # Also save as fallback system_health_report.md
    with open(os.path.join(base_dir, "system_health_report.md"), "w", encoding="utf-8") as f:
        f.write(report_content)

    # Save daily JSON report
    json_filename = f"report_{date_str}.json"
    json_path = os.path.join(reports_dir, json_filename)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2)

    # Save latest.json
    latest_path = os.path.join(reports_dir, "latest.json")
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2)

    # Update index.json registry
    index_path = os.path.join(reports_dir, "index.json")
    index_data = []
    if os.path.exists(index_path):
        try:
            with open(index_path, "r", encoding="utf-8") as f:
                index_data = json.load(f)
        except Exception:
            pass

    # Record date in registry if not already present
    entry = {"date": date_str, "file": json_filename}
    if entry not in index_data:
        index_data.append(entry)
        # Sort by date descending
        index_data.sort(key=lambda x: x['date'], reverse=True)
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump(index_data, f, indent=2)

    print(f"Daily reports saved to reports/ folder.")

if __name__ == "__main__":
    generate()
