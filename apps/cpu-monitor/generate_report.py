# CLI System Diagnostics Report Generator
# Writes a health report directly to system_health_report.md

import os
import sys
import time
import platform
import psutil

def get_top_hogs():
    proc_list = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            if proc.info['pid'] == os.getpid():
                continue
            # Collect CPU metrics over a short interval
            proc_list.append(proc.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
            
    # Quick measurement cycle
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
    
    # Check WMI temperatures if Windows
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
    for h in hogs:
        hogs_table += f"| {h['pid']} | {h['name']} | {h['cpu_percent']:.1f}% | {h['memory_percent']:.1f}% |\n"

    # Diagnostics recommendations
    recommendations = []
    high_cpu_procs = [p for p in hogs if (p['cpu_percent'] or 0.0) > 15.0]
    if high_cpu_procs:
        h_names = ", ".join([p['name'] for p in high_cpu_procs])
        recommendations.append(f"- **Resource Hogs Detected**: {h_names} are using significant CPU. This is the primary driver of heat and fan noise.")
    
    if cpu_usage > 50.0:
        recommendations.append("- **High CPU Load**: Your processor is working hard. The cooling fans spin up automatically to control temperatures.")
    else:
        recommendations.append("- **Sustained Load**: The CPU is currently stable. If the fan noise is loud while load is low, dust build-up or degraded thermal paste is likely the cause.")

    if ram.percent > 80.0:
        recommendations.append("- **High RAM Usage**: Close browser tabs or background apps to avoid system slowdown.")

    report_content = f"""# 💻 System Health & CPU Diagnostics Report

Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}

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
{chr(10).join(recommendations)}
- **Windows Power Settings**: Go to Control Panel -> Power Options and choose the **Balanced** power plan. This allows Windows to throttle down CPU clocks when idle, reducing heat significantly.
- **Dust and Ventilation**: Ensure the laptop is placed on a hard, flat surface. Soft surfaces like beds block air vents, trapping heat. Clean out dust from exhaust ports.
- **Thermal Paste Renewal**: Since this is an older (but high configuration) laptop, the thermal paste between the CPU and the cooling block might have dried out over time. Renewing the paste can lower temperatures by up to 10-15°C!

---
*Report generated successfully by the CLI Diagnostic Tool.*
"""

    report_path = os.path.join(os.path.dirname(__file__), "system_health_report.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)
    print(f"Report successfully saved to {report_path}")

if __name__ == "__main__":
    generate()
