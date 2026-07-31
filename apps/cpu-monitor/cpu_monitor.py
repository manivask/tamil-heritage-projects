# Python System Diagnostics & CPU Monitor Application
# Designer: AI Coding Assistant Pair Programming with Manivasagam Karunakaran

import os
import sys
import time
import platform
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import psutil

# Safe imports for Windows WMI temperature sensing
try:
    import wmi
    wmi_available = True
except ImportError:
    wmi_available = False

class CPUMonitorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("💻 CPU Monitor & System Diagnostics")
        self.root.geometry("820x620")
        self.root.resizable(False, False)
        
        # Sliding history for thermal and fan speed estimates
        self.cpu_history = []
        self.max_cpu = 0.0
        self.max_ram = 0.0
        self.peak_process = "None"
        self.peak_process_usage = 0.0
        self.start_time = time.time()
        
        self.setup_styles()
        self.create_widgets()
        self.update_metrics()
        
    def setup_styles(self):
        # Premium dark theme styling
        self.root.configure(bg="#0f172a") # Slate-900 background
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Style configurations
        self.style.configure(".", background="#0f172a", foreground="#f8fafc")
        self.style.configure("TLabel", background="#0f172a", foreground="#e2e8f0", font=("Segoe UI", 10))
        self.style.configure("Header.TLabel", background="#0f172a", foreground="#38b6ff", font=("Segoe UI", 16, "bold"))
        self.style.configure("SubHeader.TLabel", background="#0f172a", foreground="#94a3b8", font=("Segoe UI", 9))
        
        # Cards
        self.style.configure("Card.TFrame", background="#1e293b", relief="solid", borderwidth=0)
        self.style.configure("CardLabel.TLabel", background="#1e293b", foreground="#f1f5f9", font=("Segoe UI", 11, "bold"))
        
        # Progress bars
        self.style.configure("CPU.Horizontal.TProgressbar", thickness=15, troughcolor="#334155", background="#0071e3")
        self.style.configure("RAM.Horizontal.TProgressbar", thickness=15, troughcolor="#334155", background="#10b981")
        self.style.configure("Heat.Horizontal.TProgressbar", thickness=15, troughcolor="#334155", background="#f5a623")
        
        # Buttons
        self.style.configure("Primary.TButton", background="#0071e3", foreground="#ffffff", font=("Segoe UI", 10, "bold"), padding=8)
        self.style.map("Primary.TButton", background=[("active", "#005bb5")])
        self.style.configure("Secondary.TButton", background="#334155", foreground="#f1f5f9", font=("Segoe UI", 10, "bold"), padding=8)
        self.style.map("Secondary.TButton", background=[("active", "#475569")])

    def create_widgets(self):
        # --- Top Header Area ---
        header_frame = ttk.Frame(self.root, padding=(20, 15, 20, 10))
        header_frame.pack(fill="x")
        
        title_label = ttk.Label(header_frame, text="💻 CPU Monitor & System Diagnostics", style="Header.TLabel")
        title_label.pack(anchor="w")
        
        specs = f"OS: {platform.system()} {platform.release()} | CPU: {platform.processor() if platform.processor() else 'Generic'} | Cores: {psutil.cpu_count(logical=False)} ({psutil.cpu_count()} Logical)"
        specs_label = ttk.Label(header_frame, text=specs, style="SubHeader.TLabel")
        specs_label.pack(anchor="w", pady=(2, 0))
        
        # --- Main Body (2 Columns) ---
        body_frame = ttk.Frame(self.root, padding=(20, 5, 20, 10))
        body_frame.pack(fill="both", expand=True)
        
        # Left Column: Gauges & Estimates
        left_col = ttk.Frame(body_frame, width=380)
        left_col.pack(side="left", fill="both", expand=True, padx=(0, 10))
        
        # CPU Live Gauge Card
        self.cpu_card = ttk.Frame(left_col, style="Card.TFrame", padding=15)
        self.cpu_card.pack(fill="x", pady=(0, 10))
        ttk.Label(self.cpu_card, text="⚙️ CPU Usage (Total)", style="CardLabel.TLabel").pack(anchor="w")
        
        self.cpu_lbl = ttk.Label(self.cpu_card, text="0.0%", font=("Segoe UI", 24, "bold"), foreground="#38b6ff", background="#1e293b")
        self.cpu_lbl.pack(anchor="w", pady=5)
        
        self.cpu_bar = ttk.Progressbar(self.cpu_card, style="CPU.Horizontal.TProgressbar", length=340, mode="determinate")
        self.cpu_bar.pack(fill="x")
        
        # RAM Live Gauge Card
        self.ram_card = ttk.Frame(left_col, style="Card.TFrame", padding=15)
        self.ram_card.pack(fill="x", pady=(0, 10))
        ttk.Label(self.ram_card, text="📦 Memory (RAM) Usage", style="CardLabel.TLabel").pack(anchor="w")
        
        self.ram_lbl = ttk.Label(self.ram_card, text="0.0% (0 / 0 GB)", font=("Segoe UI", 22, "bold"), foreground="#10b981", background="#1e293b")
        self.ram_lbl.pack(anchor="w", pady=5)
        
        self.ram_bar = ttk.Progressbar(self.ram_card, style="RAM.Horizontal.TProgressbar", length=340, mode="determinate")
        self.ram_bar.pack(fill="x")
        
        # Thermal & Fan Speed Card
        self.thermal_card = ttk.Frame(left_col, style="Card.TFrame", padding=15)
        self.thermal_card.pack(fill="x")
        ttk.Label(self.thermal_card, text="🔥 Estimated Thermal & Fan Load", style="CardLabel.TLabel").pack(anchor="w")
        
        self.temp_lbl = ttk.Label(self.thermal_card, text="Temperature: --°C", font=("Segoe UI", 12, "bold"), foreground="#f5a623", background="#1e293b")
        self.temp_lbl.pack(anchor="w", pady=(5, 2))
        
        self.fan_lbl = ttk.Label(self.thermal_card, text="Fan Speed: Quiet 🔇", font=("Segoe UI", 12, "bold"), foreground="#f5a623", background="#1e293b")
        self.fan_lbl.pack(anchor="w", pady=(0, 5))
        
        self.heat_bar = ttk.Progressbar(self.thermal_card, style="Heat.Horizontal.TProgressbar", length=340, mode="determinate")
        self.heat_bar.pack(fill="x")
        
        # Right Column: Process Monitor
        right_col = ttk.Frame(body_frame, width=380)
        right_col.pack(side="right", fill="both", expand=True, padx=(10, 0))
        
        proc_card = ttk.Frame(right_col, style="Card.TFrame", padding=15)
        proc_card.pack(fill="both", expand=True)
        ttk.Label(proc_card, text="🔥 Top Resource Consumers", style="CardLabel.TLabel").pack(anchor="w")
        
        # Process list treeview
        self.tree = ttk.Treeview(proc_card, columns=("pid", "name", "cpu", "mem"), show="headings", height=8)
        self.tree.heading("pid", text="PID")
        self.tree.heading("name", text="Application Name")
        self.tree.heading("cpu", text="CPU %")
        self.tree.heading("mem", text="RAM %")
        
        self.tree.column("pid", width=50, anchor="center")
        self.tree.column("name", width=160, anchor="w")
        self.tree.column("cpu", width=65, anchor="center")
        self.tree.column("mem", width=65, anchor="center")
        self.tree.pack(fill="both", expand=True, pady=10)
        
        # Diagnostic recommendations textbox
        ttk.Label(proc_card, text="💡 Diagnostics & Fixes:", style="CardLabel.TLabel").pack(anchor="w")
        self.diag_text = tk.Text(proc_card, height=4, wrap="word", bg="#0f172a", fg="#94a3b8", font=("Segoe UI", 9), borderwidth=1, relief="solid")
        self.diag_text.pack(fill="x", pady=(5, 0))
        self.diag_text.insert("1.0", "Analyzing system state...")
        self.diag_text.configure(state="disabled")
        
        # --- Bottom Control Panel ---
        ctrl_frame = ttk.Frame(self.root, padding=(20, 10, 20, 20))
        ctrl_frame.pack(fill="x")
        
        report_btn = ttk.Button(ctrl_frame, text="📄 Generate Health Report", style="Primary.TButton", command=self.generate_report)
        report_btn.pack(side="left", padx=(0, 10))
        
        clear_btn = ttk.Button(ctrl_frame, text="🔄 Reset Statistics", style="Secondary.TButton", command=self.reset_stats)
        clear_btn.pack(side="left")
        
        self.status_lbl = ttk.Label(ctrl_frame, text="Updates live every 1.5s", style="SubHeader.TLabel")
        self.status_lbl.pack(side="right", pady=5)

    def get_hardware_temperature(self):
        # WMI Temperature Query for Windows (if available)
        if platform.system() == "Windows" and wmi_available:
            try:
                w = wmi.WMI(namespace="root\\wmi")
                # Queries standard ACPI thermal zone sensors
                temperature_info = w.MSAcpi_ThermalZoneTemperature()
                if temperature_info:
                    # Temp is returned in tenths of Kelvins, convert to Celsius
                    kelvin = temperature_info[0].CurrentTemperature
                    celsius = (kelvin / 10.0) - 273.15
                    return round(celsius, 1)
            except Exception:
                pass
        
        # psutil temperature fallback for Linux/Mac
        if hasattr(psutil, "sensors_temperatures"):
            try:
                temps = psutil.sensors_temperatures()
                if "coretemp" in temps:
                    return round(temps["coretemp"][0].current, 1)
                elif temps:
                    # Return first available sensor reading
                    for key, val in temps.items():
                        if val:
                            return round(val[0].current, 1)
            except Exception:
                pass
        
        return None

    def update_metrics(self):
        # 1. Fetch CPU & RAM
        cpu_val = psutil.cpu_percent()
        ram = psutil.virtual_memory()
        
        # Update peak stats
        if cpu_val > self.max_cpu:
            self.max_cpu = cpu_val
        if ram.percent > self.max_ram:
            self.max_ram = ram.percent
            
        # Update labels and progress bars
        self.cpu_lbl.configure(text=f"{cpu_val}%")
        self.cpu_bar["value"] = cpu_val
        
        ram_used_gb = ram.used / (1024**3)
        ram_total_gb = ram.total / (1024**3)
        self.ram_lbl.configure(text=f"{ram.percent}% ({ram_used_gb:.1f} / {ram_total_gb:.1f} GB)")
        self.ram_bar["value"] = ram.percent
        
        # 2. Estimate temperature and Fan Noise based on sliding window
        self.cpu_history.append(cpu_val)
        if len(self.cpu_history) > 8: # keep last 12 seconds
            self.cpu_history.pop(0)
        avg_cpu = sum(self.cpu_history) / len(self.cpu_history)
        
        # Try to query real sensor first
        temp = self.get_hardware_temperature()
        if temp is None:
            # Smart Thermal Estimation Model: Correlate load duration to heat build-up
            # Simple simulation: base temp of 40C + CPU load influence
            estimated_temp = 40.0 + (avg_cpu * 0.45)
            # Add thermal mass delay (spikes don't instantly heat the CPU to max)
            temp = round(estimated_temp, 1)
            
        self.temp_lbl.configure(text=f"Estimated CPU Temp: {temp}°C")
        
        # Est fan noise stages based on estimated/actual temperature
        if temp < 55:
            fan_speed = "Quiet 🔇 (Minimal RPM)"
            fan_color = "#38b6ff" # Soft Blue
            heat_val = 25
        elif temp < 68:
            fan_speed = "Humming 🔉 (Moderate RPM)"
            fan_color = "#10b981" # Green
            heat_val = 50
        elif temp < 78:
            fan_speed = "Loud Whirring 🔊 (High RPM - Cooling down!)"
            fan_color = "#f5a623" # Orange
            heat_val = 75
        else:
            fan_speed = "Turbine Mode 🚀 (Max RPM - High Workload Heat!)"
            fan_color = "#ef4444" # Red
            heat_val = 100
            
        self.fan_lbl.configure(text=f"Estimated Fan Noise: {fan_speed}")
        self.fan_lbl.configure(foreground=fan_color)
        self.temp_lbl.configure(foreground=fan_color)
        self.heat_bar["value"] = heat_val
        
        # 3. Fetch Top Hogs
        proc_list = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                # Ignore self to avoid interference
                if proc.info['pid'] == os.getpid():
                    continue
                proc_list.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
                
        # Sort by CPU usage first, then Memory
        proc_list.sort(key=lambda x: x['cpu_percent'] or 0.0, reverse=True)
        top_hogs = proc_list[:5]
        
        # If no active CPU hogs, show RAM hogs
        if not top_hogs or sum(p['cpu_percent'] or 0.0 for p in top_hogs) < 5.0:
            proc_list.sort(key=lambda x: x['memory_percent'] or 0.0, reverse=True)
            top_hogs = proc_list[:5]
            
        # Update Treeview list
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        for p in top_hogs:
            pid = p['pid']
            name = p['name']
            cpu = f"{p['cpu_percent']:.1f}" if p['cpu_percent'] is not None else "0.0"
            mem = f"{p['memory_percent']:.1f}" if p['memory_percent'] is not None else "0.0"
            self.tree.insert("", "end", values=(pid, name, cpu, mem))
            
            # Track peak hog
            cpu_num = float(cpu)
            if cpu_num > self.peak_process_usage:
                self.peak_process_usage = cpu_num
                self.peak_process = name

        # 4. Diagnostics Engine & Recommendations
        recommendations = []
        
        # Diagnose CPU spikes
        high_cpu_procs = [p for p in top_hogs if (p['cpu_percent'] or 0.0) > 20.0]
        if high_cpu_procs:
            hogs_names = ", ".join([p['name'] for p in high_cpu_procs])
            recommendations.append(f"⚠️ {hogs_names} is using heavy CPU resources. This is causing your processor to generate extra heat and trigger high fan speed noise.")
            
        # Overall CPU diagnostics
        if avg_cpu > 65.0:
            recommendations.append("🔥 High sustained CPU load detected. Your fan is running fast to cool down the processor. Recommend closing heavy applications.")
        else:
            if not recommendations:
                recommendations.append("✅ CPU workload is stable. Fan noise should remain low. System temperatures are within healthy limits.")

        # RAM diagnostics
        if ram.percent > 82.0:
            recommendations.append("🚨 High memory (RAM) usage. Close unused browser tabs or resource-heavy processes to prevent slowing down.")

        # Windows power plan advice
        if avg_cpu > 40.0:
            recommendations.append("💡 TIP: Check if your Windows Power Plan is set to 'Balanced' instead of 'High Performance' to allow the CPU to throttle down when idle.")

        # Update diagnostic textbox
        self.diag_text.configure(state="normal")
        self.diag_text.delete("1.0", tk.END)
        self.diag_text.insert("1.0", "\n\n".join(recommendations))
        self.diag_text.configure(state="disabled")

        # Re-schedule update loop
        self.root.after(1500, self.update_metrics)

    def reset_stats(self):
        self.max_cpu = 0.0
        self.max_ram = 0.0
        self.peak_process = "None"
        self.peak_process_usage = 0.0
        self.cpu_history.clear()
        show_toast_msg("Statistics Reset", "Peak usages and history have been cleared.")

    def generate_report(self):
        # Generate and save a detailed system diagnostic markdown report
        uptime_seconds = time.time() - self.start_time
        uptime_str = f"{int(uptime_seconds // 60)}m {int(uptime_seconds % 60)}s"
        
        report_content = f"""# 💻 System Health & CPU Diagnostics Report
Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}
Uptime under Monitor: {uptime_str}

## 📊 System Specifications
- **Operating System**: {platform.system()} {platform.release()} ({platform.version()})
- **Processor**: {platform.processor() if platform.processor() else 'Generic'}
- **CPU Cores**: {psutil.cpu_count(logical=False)} Physical | {psutil.cpu_count()} Logical
- **Total Installed Memory (RAM)**: {psutil.virtual_memory().total / (1024**3):.2f} GB

## 📈 Peak Performance Stats Captured
- **Peak CPU Load**: {self.max_cpu:.1f}%
- **Peak RAM Usage**: {self.max_ram:.1f}%
- **Heavy Resource Consumer**: {self.peak_process} (Spiked up to {self.peak_process_usage:.1f}% CPU)

## 🩺 Diagnostic Analysis & Recommendations

### Why is my CPU Fan Noise increasing?
Laptop fans increase speed (producing noise) as a direct response to **heat build-up** on the CPU. When multiple applications are run or a single application uses sustained CPU power, the processor consumes more wattage, heating up. The system automatically turns on fans to protect the chip from permanent thermal damage.

### Actionable Fixes to Reduce Fan Noise & Heat:
1. **Identify the Hogs**: Open Task Manager (`Ctrl + Shift + Esc`) and sort processes by CPU. Close applications that consume more than 15-20% CPU when not in active use.
2. **Dust and Ventilation**: Ensure the laptop is placed on a hard, flat surface. Soft surfaces like beds block air vents, trapping heat. Clean out dust from exhaust ports using compressed air.
3. **Windows Power Settings**:
   - Go to Control Panel -> Power Options.
   - Choose the **Balanced** power plan. This allows Windows to turn down CPU core clocks when idle, reducing heat significantly.
4. **Browser Management**: Modern browsers run individual processes for each tab. Close background tabs that you are not actively reading.
5. **Thermal Paste Renewal**: Since this is an older (but high configuration) laptop, the thermal paste between the CPU and the cooling block might have dried out over time, reducing cooling efficiency. Renewing the paste can lower temperatures by up to 10-15°C!

*Report compiled by the CPU Monitor Tool.*
"""
        
        # Prompt user to choose where to save report
        file_path = filedialog.asksaveasfilename(
            defaultextension=".md",
            filetypes=[("Markdown Files", "*.md"), ("Text Files", "*.txt")],
            initialfile="system_health_report.md",
            title="Save Diagnostics Report"
        )
        
        if file_path:
            try:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(report_content)
                messagebox.showinfo("Success", f"Health report saved successfully to:\n{file_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Could not save report: {e}")

def show_toast_msg(title, message):
    # Simple alert modal fallback
    messagebox.showinfo(title, message)

if __name__ == "__main__":
    # Ensure Tkinter runs correctly
    root = tk.Tk()
    app = CPUMonitorApp(root)
    root.mainloop()
