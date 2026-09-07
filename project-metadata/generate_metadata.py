import os
import json
import re
import html
from pathlib import Path

# Setup paths relative to the script location
SCRIPT_DIR = Path(__file__).resolve().parent
WORKSPACE_DIR = SCRIPT_DIR.parent
APPS_DIR = WORKSPACE_DIR / "apps"
OUTPUT_MD = SCRIPT_DIR / "project_master.md"
OUTPUT_HTML = SCRIPT_DIR / "project_master.html"

# Ensure output directory exists
SCRIPT_DIR.mkdir(parents=True, exist_ok=True)

def get_file_stats(app_path):
    """Recursively scans files in an app directory to compute size and file-type distribution."""
    stats = {
        "file_count": 0,
        "total_size": 0,
        "extensions": {},
        "files_list": []
    }
    
    # Exclude common directories to avoid noise
    exclude_dirs = {".git", "__pycache__", "node_modules", "venv", ".idea", ".vscode", "images", "assets"}
    
    for root, dirs, files in os.walk(app_path):
        # In-place modification to skip excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            file_path = Path(root) / file
            # Skip binary files or metadata we don't care about
            if file.startswith('.') or file_path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.mp3', '.wav', '.ogg']:
                continue
                
            try:
                size = file_path.stat().st_size
                stats["file_count"] += 1
                stats["total_size"] += size
                
                ext = file_path.suffix.lower() or "no-extension"
                stats["extensions"][ext] = stats["extensions"].get(ext, 0) + size
                
                rel_path = file_path.relative_to(WORKSPACE_DIR)
                stats["files_list"].append({
                    "path": str(rel_path).replace("\\", "/"),
                    "name": file,
                    "size": size,
                    "ext": ext
                })
            except Exception as e:
                # Silently ignore files with permission/read issues
                pass
                
    return stats

def extract_meta_from_html(html_path):
    """Parses HTML file to extract title and description meta tag."""
    title = ""
    description = ""
    try:
        content = html_path.read_text(encoding='utf-8', errors='ignore')
        # Title match
        title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
        if title_match:
            title = title_match.group(1).strip()
            
        # Description match
        desc_match = re.search(r'<meta\s+[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', content, re.IGNORECASE | re.DOTALL)
        if not desc_match:
            desc_match = re.search(r'<meta\s+[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']', content, re.IGNORECASE | re.DOTALL)
        if desc_match:
            description = desc_match.group(1).strip()
    except Exception:
        pass
    return title, description

def extract_meta_from_python(py_path):
    """Extracts docstrings or initial comments from Python file."""
    description = ""
    try:
        content = py_path.read_text(encoding='utf-8', errors='ignore')
        # Look for module-level docstring
        doc_match = re.match(r'^\s*("""|\'\'\')(.*?)\1', content, re.DOTALL)
        if doc_match:
            description = doc_match.group(2).strip()
        else:
            # Look for leading comments
            lines = content.splitlines()
            comments = []
            for line in lines:
                line = line.strip()
                if line.startswith("#"):
                    comments.append(line.lstrip("#").strip())
                elif not line:
                    continue
                else:
                    break
            if comments:
                description = " ".join(comments)
    except Exception:
        pass
    return description

def extract_readme_content(readme_path):
    """Extracts first section or overview from README.md."""
    try:
        content = readme_path.read_text(encoding='utf-8', errors='ignore')
        lines = content.splitlines()
        extracted = []
        for line in lines:
            if line.startswith("#"):
                continue  # skip titles
            if line.strip():
                extracted.append(line.strip())
            if len(extracted) >= 3:  # grab first 3 paragraphs/lines
                break
        return " ".join(extracted)
    except Exception:
        return ""

def scan_apps():
    """Scans the apps folder and returns a list of dictionaries with details for each app."""
    apps_data = []
    
    if not APPS_DIR.exists():
        print(f"Apps directory not found at {APPS_DIR}")
        return apps_data
        
    for item in sorted(APPS_DIR.iterdir()):
        if item.is_dir():
            app_name = item.name
            app_path = item
            
            # 1. File statistics
            stats = get_file_stats(app_path)
            
            # 2. Extract metadata
            title = app_name.replace("-", " ").title()
            description = ""
            entry_points = []
            
            # Find entry points
            html_files = list(app_path.glob("*.html"))
            py_files = list(app_path.glob("*.py"))
            readme_files = list(app_path.glob("README.md")) + list(app_path.glob("readme.md"))
            
            # Extract info based on what is available
            if readme_files:
                readme_desc = extract_readme_content(readme_files[0])
                if readme_desc:
                    description = readme_desc
                    
            if html_files:
                for h in html_files:
                    h_title, h_desc = extract_meta_from_html(h)
                    rel_h = str(h.relative_to(WORKSPACE_DIR)).replace("\\", "/")
                    entry_points.append({"type": "HTML", "path": rel_h, "name": h.name})
                    if not description and h_desc:
                        description = h_desc
                    if h_title:
                        title = h_title
                        
            if py_files:
                for p in py_files:
                    p_desc = extract_meta_from_python(p)
                    rel_p = str(p.relative_to(WORKSPACE_DIR)).replace("\\", "/")
                    entry_points.append({"type": "Python", "path": rel_p, "name": p.name})
                    if not description and p_desc:
                        description = p_desc
                        
            # Default fallback description
            if not description:
                description = f"Application folder containing project assets, source code, and configuration for {title}."
                
            # Detect primary technologies
            tech_stack = []
            extensions_detected = [ext.replace(".", "").upper() for ext in stats["extensions"].keys()]
            
            if "HTML" in extensions_detected:
                tech_stack.append("HTML5")
            if "CSS" in extensions_detected:
                tech_stack.append("CSS3")
            if "JS" in extensions_detected:
                tech_stack.append("JavaScript")
            if "PY" in extensions_detected:
                tech_stack.append("Python")
            if "JSON" in extensions_detected:
                tech_stack.append("JSON Data")
            if "SH" in extensions_detected or "PS1" in extensions_detected:
                tech_stack.append("Shell Scripting")
                
            # If no code files found but directory is populated, mark as Static Resource
            if not tech_stack:
                tech_stack = ["Static Assets"]
                
            apps_data.append({
                "name": app_name,
                "display_name": title,
                "description": description,
                "path": str(app_path.relative_to(WORKSPACE_DIR)).replace("\\", "/"),
                "entry_points": entry_points,
                "tech_stack": tech_stack,
                "file_count": stats["file_count"],
                "total_size_kb": round(stats["total_size"] / 1024, 2),
                "extensions_breakdown": stats["extensions"],
                "files": stats["files_list"]
            })
            
    return apps_data

def generate_markdown(apps_data):
    """Generates the project_master.md file containing detailed specs for all apps."""
    lines = []
    lines.append("# Workspace Master Instruction & Project Index")
    lines.append("")
    lines.append("> [!NOTE]")
    lines.append("> This is an automatically generated index. Running the Python script in this directory parses all workspace apps, computes codebase statistics, and updates this document.")
    lines.append("")
    lines.append("## Workspace Overview")
    lines.append("")
    lines.append(f"- **Total Applications**: {len(apps_data)}")
    total_files = sum(app["file_count"] for app in apps_data)
    total_size = sum(app["total_size_kb"] for app in apps_data)
    lines.append(f"- **Total Source Files**: {total_files}")
    lines.append(f"- **Total Codebase Size**: {round(total_size, 2)} KB")
    lines.append("")
    lines.append("## Table of Contents")
    for app in apps_data:
        anchor = app["name"].lower().replace(" ", "-")
        lines.append(f"- [{app['display_name']}](#{anchor})")
    lines.append("")
    lines.append("---")
    lines.append("")
    
    for app in apps_data:
        lines.append(f"## {app['display_name']}")
        lines.append("")
        lines.append(f"**Directory**: [`apps/{app['name']}`](file:///../apps/{app['name']})")
        lines.append(f"**Tech Stack**: " + ", ".join([f"`{tech}`" for tech in app["tech_stack"]]))
        lines.append(f"**File Count**: {app['file_count']} files | **Size**: {app['total_size_kb']} KB")
        lines.append("")
        lines.append("### Description")
        lines.append(app["description"])
        lines.append("")
        
        if app["entry_points"]:
            lines.append("### Entry Points")
            for ep in app["entry_points"]:
                lines.append(f"- **{ep['type']}**: [{ep['name']}](file:///../{ep['path']})")
            lines.append("")
            
        # Extension distribution
        lines.append("### Language & File Composition")
        lines.append("| Extension | Size (KB) | Percentage |")
        lines.append("| --- | --- | --- |")
        
        total_bytes = sum(app["extensions_breakdown"].values())
        for ext, ext_size in sorted(app["extensions_breakdown"].items(), key=lambda item: item[1], reverse=True):
            ext_kb = round(ext_size / 1024, 2)
            pct = round((ext_size / total_bytes * 100), 1) if total_bytes > 0 else 0
            lines.append(f"| `{ext}` | {ext_kb} KB | {pct}% |")
        lines.append("")
        
        # Files hierarchy list
        lines.append("<details>")
        lines.append(f"<summary>View File Index ({len(app['files'])} files)</summary>")
        lines.append("")
        for f in sorted(app["files"], key=lambda item: item["path"]):
            lines.append(f"- [{f['path']}](file:///../{f['path']}) ({round(f['size'] / 1024, 2)} KB)")
        lines.append("</details>")
        lines.append("")
        lines.append("---")
        lines.append("")
        
    OUTPUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated Markdown master document: {OUTPUT_MD}")

def generate_html(apps_data):
    """Generates the project_master.html dashboard with beautiful donut charts for each app."""
    # Build list of cards HTML
    cards_html = []
    
    for idx, app in enumerate(apps_data):
        # Calculate extension percentages for the donut chart SVG
        ext_breakdown = app["extensions_breakdown"]
        total_bytes = sum(ext_breakdown.values())
        
        sorted_exts = sorted(ext_breakdown.items(), key=lambda x: x[1], reverse=True)
        
        # Build SVG Donut segments
        # Circumference of circle with r=15.91549430918954 is 100
        # stroke-dasharray = "percent gap"
        stroke_segments = []
        legend_items = []
        current_offset = 0
        
        colors = ["#ff5e62", "#0071e3", "#30cfd0", "#a1c4fd", "#fbc2eb", "#ffe066", "#4facfe"]
        
        for i, (ext, size) in enumerate(sorted_exts):
            pct = round((size / total_bytes * 100), 1) if total_bytes > 0 else 0
            if pct <= 0:
                continue
            color = colors[i % len(colors)]
            stroke_segments.append(
                f'<circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" '
                f'stroke="{color}" stroke-width="4" stroke-dasharray="{pct} {100 - pct}" stroke-dashoffset="{100 - current_offset + 25}"></circle>'
            )
            legend_items.append(
                f'<div class="legend-item">'
                f'  <span class="legend-dot" style="background-color: {color};"></span>'
                f'  <span class="legend-text">{ext} ({pct}%)</span>'
                f'</div>'
            )
            current_offset += pct
            
        donut_svg = f"""
        <div class="donut-container">
            <svg width="100%" height="100%" viewBox="0 0 42 42" class="donut">
                <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="var(--card-bg)"></circle>
                <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--donut-bg-ring)" stroke-width="2.5"></circle>
                {" ".join(stroke_segments)}
                <g class="donut-text">
                    <text x="50%" y="46%" class="donut-number">{app['file_count']}</text>
                    <text x="50%" y="64%" class="donut-label">Files</text>
                </g>
            </svg>
        </div>
        """
        
        tech_badges = "".join([f'<span class="tech-badge">{tech}</span>' for tech in app["tech_stack"]])
        
        # Link to first entry point or directory
        launch_link = f"../{app['entry_points'][0]['path']}" if app["entry_points"] else f"../{app['path']}"
        action_text = f"Launch {app['entry_points'][0]['name']}" if app["entry_points"] else "Explore Directory"
        
        cards_html.append(f"""
        <div class="app-card" id="app-{app['name']}">
            <div class="app-header">
                <h3 class="app-title">{app['display_name']}</h3>
                <span class="app-size">{app['total_size_kb']} KB</span>
            </div>
            
            <p class="app-desc">{html.escape(app['description'])}</p>
            
            <div class="tech-badges-container">
                {tech_badges}
            </div>
            
            <div class="donut-section">
                {donut_svg}
                <div class="donut-legend">
                    { "".join(legend_items) }
                </div>
            </div>
            
            <a href="{launch_link}" class="app-action-btn" target="_blank">
                {action_text} <span>&rarr;</span>
            </a>
        </div>
        """)
        
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Workspace dashboard and project overview showing statistics and status for all active applications.">
    <title>Workspace Projects Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-color: #0b0f19;
            --card-bg: #151c2c;
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --accent: #3b82f6;
            --accent-glow: rgba(59, 130, 246, 0.15);
            --border-color: rgba(255, 255, 255, 0.08);
            --donut-bg-ring: #1e293b;
            --font-display: 'Outfit', sans-serif;
            --font-body: 'Inter', sans-serif;
        }}

        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}

        body {{
            background-color: var(--bg-color);
            color: var(--text-primary);
            font-family: var(--font-body);
            min-height: 100vh;
            padding: 3rem 1.5rem;
        }}

        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}

        header {{
            text-align: center;
            margin-bottom: 4rem;
        }}

        .badge {{
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.2);
            color: var(--accent);
            padding: 0.5rem 1.25rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: inline-block;
            margin-bottom: 1rem;
            font-family: var(--font-display);
        }}

        h1 {{
            font-family: var(--font-display);
            font-size: 3rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}

        .subtitle {{
            color: var(--text-secondary);
            font-size: 1.15rem;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
        }}

        .stats-summary {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
            margin-bottom: 3.5rem;
        }}

        .stat-card {{
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            padding: 1.5rem;
            border-radius: 16px;
            text-align: center;
        }}

        .stat-val {{
            font-family: var(--font-display);
            font-size: 2.25rem;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 0.25rem;
        }}

        .stat-lbl {{
            color: var(--text-secondary);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}

        .apps-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
        }}

        .app-card {{
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }}

        .app-card:hover {{
            transform: translateY(-5px);
            border-color: rgba(59, 130, 246, 0.4);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--accent-glow);
        }}

        .app-header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }}

        .app-title {{
            font-family: var(--font-display);
            font-size: 1.4rem;
            font-weight: 700;
            color: #ffffff;
        }}

        .app-size {{
            font-size: 0.85rem;
            color: var(--text-secondary);
            background: rgba(255, 255, 255, 0.05);
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            border: 1px solid var(--border-color);
        }}

        .app-desc {{
            color: var(--text-secondary);
            font-size: 0.95rem;
            line-height: 1.5;
            margin-bottom: 1.5rem;
            flex-grow: 1;
        }}

        .tech-badges-container {{
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
        }}

        .tech-badge {{
            font-size: 0.75rem;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.06);
            color: #e5e7eb;
            padding: 0.3rem 0.75rem;
            border-radius: 9999px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }}

        .donut-section {{
            display: flex;
            align-items: center;
            gap: 1.5rem;
            background: rgba(0, 0, 0, 0.15);
            padding: 1.25rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.03);
        }}

        .donut-container {{
            width: 90px;
            height: 90px;
            flex-shrink: 0;
        }}

        .donut-segment {{
            transform-origin: center;
            transition: stroke-dasharray 0.3s ease;
        }}

        .donut-text {{
            font-family: var(--font-display);
            text-anchor: middle;
        }}

        .donut-number {{
            fill: #ffffff;
            font-size: 8px;
            font-weight: 700;
        }}

        .donut-label {{
            fill: var(--text-secondary);
            font-size: 4px;
            font-weight: 500;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }}

        .donut-legend {{
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }}

        .legend-item {{
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}

        .legend-dot {{
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }}

        .legend-text {{
            font-size: 0.8rem;
            color: var(--text-secondary);
        }}

        .app-action-btn {{
            background: var(--accent);
            color: #ffffff;
            text-decoration: none;
            padding: 0.85rem;
            border-radius: 12px;
            text-align: center;
            font-weight: 600;
            font-size: 0.95rem;
            font-family: var(--font-display);
            transition: background 0.2s ease, transform 0.1s ease;
            display: block;
        }}

        .app-action-btn:hover {{
            background: #2563eb;
        }}

        .app-action-btn:active {{
            transform: scale(0.98);
        }}

        footer {{
            text-align: center;
            margin-top: 5rem;
            color: var(--text-secondary);
            font-size: 0.85rem;
            border-top: 1px solid var(--border-color);
            padding-top: 2rem;
        }}

        @media (max-width: 768px) {{
            .stats-summary {{
                grid-template-columns: 1fr;
            }}
            .apps-grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="badge">Master Workspace Dashboard</div>
            <h1>Workspace Applications Index</h1>
            <p class="subtitle">A visual overview of the files, technology distribution, and entry points for all projects in this workspace.</p>
        </header>

        <section class="stats-summary">
            <div class="stat-card">
                <div class="stat-val">{len(apps_data)}</div>
                <div class="stat-lbl">Total Applications</div>
            </div>
            <div class="stat-card">
                <div class="stat-val">{sum(app['file_count'] for app in apps_data)}</div>
                <div class="stat-lbl">Active Code Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-val">{round(sum(app['total_size_kb'] for app in apps_data), 2)} KB</div>
                <div class="stat-lbl">Total Repository Size</div>
            </div>
        </section>

        <main class="apps-grid">
            {"".join(cards_html)}
        </main>

        <footer>
            <p>&copy; 2026 Workspace Project Mapper. Regenerated automatically on run.</p>
        </footer>
    </div>
</body>
</html>
"""
    OUTPUT_HTML.write_text(html_content, encoding="utf-8")
    print(f"Generated HTML dashboard: {OUTPUT_HTML}")

if __name__ == "__main__":
    print("Scanning apps directory...")
    apps = scan_apps()
    
    print(f"Found {len(apps)} applications.")
    
    generate_markdown(apps)
    generate_html(apps)
    print("Workspace documentation updated successfully!")
