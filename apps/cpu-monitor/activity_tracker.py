# Background Activity Tracker & App Usage Monitor
# Logs foreground app usage times and copies startup batch files automatically

import os
import sys
import time
import json
import ctypes
from datetime import datetime
import psutil

# Windows Win32 API functions via ctypes
GetForegroundWindow = ctypes.windll.user32.GetForegroundWindow
GetWindowThreadProcessId = ctypes.windll.user32.GetWindowThreadProcessId

def get_active_process_name():
    hwnd = GetForegroundWindow()
    if not hwnd:
        return "Idle/Unknown"
        
    pid = ctypes.c_ulong()
    GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    
    try:
        proc = psutil.Process(pid.value)
        return proc.name()
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        return "System/Unknown"

def format_duration(seconds):
    if seconds < 60:
        return f"{seconds}s"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m {seconds % 60}s"
    hours = minutes // 60
    return f"{hours}h {minutes % 60}m"

def save_daily_report(activity_log, date_str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    reports_dir = os.path.join(base_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)
    
    # Sort activity descending by duration
    sorted_activity = sorted(activity_log.items(), key=lambda x: x[1], reverse=True)
    total_seconds = sum(activity_log.values())
    
    # 1. Generate Markdown Report
    time_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    md_content = f"""# 📊 Daily App Activity Log

Report Date: {date_str} (Last Updated: {time_str})
Total Active Tracking Time: {format_duration(total_seconds)}

## ⏱️ Application Usage Breakdown
| Rank | Application Process | Time Active | Share % |
| --- | --- | --- | --- |
"""
    for idx, (app, sec) in enumerate(sorted_activity, 1):
        share = (sec / total_seconds * 100) if total_seconds > 0 else 0
        md_content += f"| {idx} | `{app}` | {format_duration(sec)} | {share:.1f}% |\n"
        
    md_content += """
---
*Log captured and written by the Background Activity Tracker.*
"""
    
    md_path = os.path.join(reports_dir, f"activity_{date_str}.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
        
    # Also save as fallback main activity_report.md
    with open(os.path.join(base_dir, "activity_report.md"), "w", encoding="utf-8") as f:
        f.write(md_content)

    # 2. Generate JSON Report
    json_data = {
        "date": date_str,
        "last_updated": time_str,
        "total_active_seconds": total_seconds,
        "total_active_formatted": format_duration(total_seconds),
        "activities": [{"app": app, "seconds": sec, "formatted": format_duration(sec)} for app, sec in sorted_activity]
    }
    
    json_path = os.path.join(reports_dir, f"activity_{date_str}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2)
        
    # Save active_latest.json
    latest_path = os.path.join(reports_dir, "active_latest.json")
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2)

    # Update index.json registry with activity report
    index_path = os.path.join(reports_dir, "activity_index.json")
    index_data = []
    if os.path.exists(index_path):
        try:
            with open(index_path, "r", encoding="utf-8") as f:
                index_data = json.load(f)
        except Exception:
            pass

    entry = {"date": date_str, "file": f"activity_{date_str}.json"}
    if entry not in index_data:
        index_data.append(entry)
        index_data.sort(key=lambda x: x['date'], reverse=True)
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump(index_data, f, indent=2)

def install_startup_script():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    python_exe = "C:\\Users\\maniv\\AppData\\Local\\Python\\bin\\python.exe"
    script_path = os.path.join(base_dir, "activity_tracker.py")
    bat_content = f"""@echo off
start /B "" "{python_exe}" "{script_path}"
"""
    
    # Save bat locally in app directory
    bat_path = os.path.join(base_dir, "start_tracker.bat")
    with open(bat_path, "w", encoding="utf-8") as f:
        f.write(bat_content)
    print(f"Created start_tracker.bat at {bat_path}")

    # Copy to User Windows Startup folder
    startup_dir = os.path.join(os.environ['APPDATA'], 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup')
    startup_bat_path = os.path.join(startup_dir, "start_tracker.bat")
    try:
        with open(startup_bat_path, "w", encoding="utf-8") as f:
            f.write(bat_content)
        print(f"Installed startup runner at {startup_bat_path}")
    except Exception as e:
        print(f"Warning: Could not install in Windows Startup folder: {e}")

def main():
    print("Initializing Background Activity Tracker...")
    install_startup_script()
    
    activity_log = {}
    date_str = datetime.now().strftime('%Y-%m-%d')
    
    # Load existing log for today if it exists
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "reports", f"activity_{date_str}.json")
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                saved = json.load(f)
                for act in saved.get("activities", []):
                    activity_log[act["app"]] = act["seconds"]
            print(f"Loaded existing activity log for {date_str}.")
        except Exception:
            pass
            
    print("Tracking active apps. Sample rate: 5s. Report cycle: 60s.")
    
    last_save = time.time()
    
    try:
        while True:
            # Check if date changed (midnight crossover)
            current_date = datetime.now().strftime('%Y-%m-%d')
            if current_date != date_str:
                # Save final log for the day and swap
                save_daily_report(activity_log, date_str)
                activity_log = {}
                date_str = current_date
            
            # Identify active app
            active_app = get_active_process_name()
            activity_log[active_app] = activity_log.get(active_app, 0) + 5
            
            # Save logs every 15 seconds during active tracking
            if time.time() - last_save >= 15:
                save_daily_report(activity_log, date_str)
                last_save = time.time()
                
            time.sleep(5.0)
            
    except KeyboardInterrupt:
        print("Tracker stopped by user. Saving final log...")
        save_daily_report(activity_log, date_str)
    except Exception as e:
        print(f"Critical error in tracker loop: {e}")
        save_daily_report(activity_log, date_str)

if __name__ == "__main__":
    main()
