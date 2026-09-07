#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Prompt Generation Engine
Recursively scans application folders, applies smart token-optimization filtering,
analyzes tech stack / architecture, and produces complete self-contained LLM prompts.
"""

import os
import re
import json

# Default ignore patterns for token optimization
DEFAULT_IGNORE_DIRS = {
    'node_modules', '.git', '.github', '.idea', '.vscode', '__pycache__',
    '.venv', 'venv', 'env', '.artifacts', 'dist', 'build', '.next', '.cache',
    'coverage', '.pytest_cache', 'android', 'ios', 'apk'
}

DEFAULT_IGNORE_EXTENSIONS = {
    '.exe', '.bin', '.dll', '.so', '.dylib', '.iso', '.tar', '.gz', '.zip',
    '.7z', '.rar', '.pyc', '.pyo', '.pyd', '.db', '.sqlite', '.sqlite3',
    '.apk', '.aab', '.ipa', '.class', '.jar', '.war', '.ear',
    '.mp4', '.avi', '.mov', '.wmv', '.mkv', '.mp3', '.wav', '.ogg',
    '.ico', '.woff', '.woff2', '.ttf', '.eot', '.otf'
}

# Binary / heavy data extensions that should be summarized rather than embedded in full
LARGE_DATA_EXTENSIONS = {'.xlsx', '.xls', '.csv', '.parquet', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'}

def estimate_tokens(text: str) -> int:
    """Rough token estimation (approx 4 chars per token for code/english)."""
    return max(1, len(text) // 4)

def detect_tech_stack(files_list):
    """Detect technologies and frameworks based on file types and filenames."""
    techs = set()
    filenames = [os.path.basename(f) for f in files_list]
    extensions = {os.path.splitext(f)[1].lower() for f in files_list}

    if any(f.endswith('.html') for f in files_list):
        techs.add('HTML5')
    if any(f.endswith('.css') for f in files_list):
        techs.add('CSS3')
    if any(f.endswith('.js') for f in files_list) or any(f.endswith('.mjs') for f in files_list):
        techs.add('Vanilla JavaScript')
    if any(f.endswith('.jsx') or f.endswith('.tsx') for f in files_list):
        techs.add('React')
    if any(f.endswith('.ts') for f in files_list):
        techs.add('TypeScript')
    if any(f.endswith('.py') for f in files_list):
        techs.add('Python 3')
    if 'package.json' in filenames:
        techs.add('Node.js Ecosystem')
    if 'capacitor.config.json' in filenames or 'capacitor.config.ts' in filenames:
        techs.add('Capacitor Mobile Framework')
    if any('streamlit' in f.lower() for f in filenames):
        techs.add('Streamlit')
    if any(f.endswith('.sql') for f in files_list):
        techs.add('SQL / Database')

    return sorted(list(techs)) if techs else ['General Web Application']

def build_ascii_tree(dir_path, base_path=None, ignore_dirs=None, prefix=""):
    """Generate clean ASCII representation of directory structure."""
    if base_path is None:
        base_path = dir_path
    if ignore_dirs is None:
        ignore_dirs = DEFAULT_IGNORE_DIRS

    lines = []
    try:
        entries = sorted(os.listdir(dir_path), key=lambda s: (not os.path.isdir(os.path.join(dir_path, s)), s.lower()))
    except Exception:
        return []

    # Filter entries
    visible_entries = []
    for entry in entries:
        if entry in ignore_dirs or entry.startswith('.'):
            continue
        visible_entries.append(entry)

    total = len(visible_entries)
    for index, entry in enumerate(visible_entries):
        is_last = (index == total - 1)
        connector = "└── " if is_last else "├── "
        full_entry_path = os.path.join(dir_path, entry)

        if os.path.isdir(full_entry_path):
            lines.append(f"{prefix}{connector}{entry}/")
            sub_prefix = f"{prefix}{'    ' if is_last else '│   '}"
            lines.extend(build_ascii_tree(full_entry_path, base_path, ignore_dirs, sub_prefix))
        else:
            file_size_kb = os.path.getsize(full_entry_path) / 1024
            size_str = f" ({file_size_kb:.1f} KB)" if file_size_kb >= 1 else ""
            lines.append(f"{prefix}{connector}{entry}{size_str}")

    return lines

def scan_directory(app_dir, ignore_dirs=None, ignore_exts=None, max_file_size_kb=500):
    """
    Scans an app directory and categorizes files into code, configs, assets, and skipped.
    """
    if ignore_dirs is None:
        ignore_dirs = DEFAULT_IGNORE_DIRS
    if ignore_exts is None:
        ignore_exts = DEFAULT_IGNORE_EXTENSIONS

    app_dir = os.path.abspath(app_dir)
    scanned_files = []

    for root, dirs, files in os.walk(app_dir):
        # Modify dirs in-place to skip ignored directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs and not d.startswith('.')]

        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, app_dir).replace('\\', '/')
            ext = os.path.splitext(f)[1].lower()

            try:
                size_bytes = os.path.getsize(full_path)
            except OSError:
                continue

            size_kb = round(size_bytes / 1024, 2)
            
            # Classification
            is_ignored = ext in ignore_exts or size_kb > max_file_size_kb
            is_large_asset = ext in LARGE_DATA_EXTENSIONS
            is_code = ext in {'.html', '.htm', '.css', '.js', '.mjs', '.ts', '.jsx', '.tsx', '.py', '.json', '.md', '.txt', '.yaml', '.yml', '.sh', '.ps1', '.bat', '.sql'}

            scanned_files.append({
                'rel_path': rel_path,
                'full_path': full_path,
                'name': f,
                'ext': ext,
                'size_bytes': size_bytes,
                'size_kb': size_kb,
                'is_code': is_code,
                'is_large_asset': is_large_asset,
                'is_ignored': is_ignored,
                'default_include': (is_code and not is_ignored and size_kb <= max_file_size_kb)
            })

    # Sort files by directory and name
    scanned_files.sort(key=lambda x: x['rel_path'].lower())
    return scanned_files

def get_code_fence_lang(rel_path):
    """Returns syntax highlighting language tag based on file extension."""
    ext = os.path.splitext(rel_path)[1].lower()
    mapping = {
        '.html': 'html',
        '.htm': 'html',
        '.css': 'css',
        '.js': 'javascript',
        '.mjs': 'javascript',
        '.jsx': 'jsx',
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.py': 'python',
        '.json': 'json',
        '.md': 'markdown',
        '.txt': 'text',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.sh': 'bash',
        '.ps1': 'powershell',
        '.bat': 'batch',
        '.sql': 'sql',
        '.xml': 'xml',
        '.svg': 'xml'
    }
    return mapping.get(ext, '')

def generate_llm_prompt(app_dir, options=None):
    """
    Constructs a high quality, token-optimized single prompt containing everything
    needed to rebuild or extend the selected application.
    """
    if options is None:
        options = {}

    app_dir = os.path.abspath(app_dir)
    app_name = os.path.basename(app_dir)
    
    # Options
    selected_rel_paths = options.get('selected_files', None) # If None, use default_include
    llm_target = options.get('llm_target', 'Universal LLM')
    prompt_mode = options.get('prompt_mode', 'full_rebuild') # full_rebuild, architecture_spec, feature_extension, compact
    custom_instructions = options.get('custom_instructions', '').strip()
    strip_extra_whitespace = options.get('strip_extra_whitespace', True)
    
    # 1. Scan directory
    all_files = scan_directory(app_dir)
    
    if selected_rel_paths is not None:
        selected_set = set(selected_rel_paths)
        files_to_include = [f for f in all_files if f['rel_path'] in selected_set]
    else:
        files_to_include = [f for f in all_files if f['default_include']]

    # 2. Tech stack & structure
    tech_stack = detect_tech_stack([f['rel_path'] for f in all_files])
    ascii_tree_lines = build_ascii_tree(app_dir)
    tree_str = f"{app_name}/\n" + "\n".join(ascii_tree_lines) if ascii_tree_lines else f"{app_name}/"

    # 3. Read included files content
    included_files_content = []
    total_raw_characters = 0

    for item in files_to_include:
        full_path = item['full_path']
        rel_path = item['rel_path']
        lang = get_code_fence_lang(rel_path)
        
        try:
            with open(full_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
                
            if strip_extra_whitespace:
                # Remove excessive blank lines (> 2 consecutive empty lines)
                content = re.sub(r'\n{3,}', '\n\n', content).strip()

            total_raw_characters += len(content)
            included_files_content.append({
                'rel_path': rel_path,
                'lang': lang,
                'size_kb': item['size_kb'],
                'content': content
            })
        except Exception as e:
            included_files_content.append({
                'rel_path': rel_path,
                'lang': lang,
                'size_kb': item['size_kb'],
                'content': f"// [Error reading file: {str(e)}]"
            })

    # 4. Summarize skipped / binary asset files
    skipped_assets = [f for f in all_files if f not in files_to_include]
    asset_summary_lines = []
    for asset in skipped_assets:
        asset_summary_lines.append(f"- `{asset['rel_path']}` ({asset['size_kb']} KB) [{asset['ext'].replace('.', '').upper() if asset['ext'] else 'Data'}]")

    # 5. Build prompt parts according to mode & target LLM
    prompt_sections = []

    # Section A: Header & System Role
    prompt_sections.append(f"""# AI Developer Prompt: Rebuild "{app_name}" Application

> Target AI: {llm_target}
> Mode: {prompt_mode.replace('_', ' ').title()}
> Detected Tech Stack: {', '.join(tech_stack)}

## Role & Mission
You are an expert Principal Full-Stack Software Engineer and System Architect.
Below is the complete, self-contained specification, directory layout, and all source code files for the `{app_name}` project.
Your task is to analyze this codebase, understand its architecture, and execute the requested implementation or rebuild on the target system.
""")

    # Section B: Custom User Instructions if specified
    if custom_instructions:
        prompt_sections.append(f"""## Specific User Instructions
> [!IMPORTANT]
> The user provided these specific requirements:
{custom_instructions}
""")

    # Section C: Directory Architecture Tree
    prompt_sections.append(f"""## Project Directory Structure
Create the following directory layout:

```text
{tree_str}
```
""")

    # Section D: Non-code & Heavy Asset Notes if any
    if asset_summary_lines:
        assets_text = "\n".join(asset_summary_lines[:25])
        if len(asset_summary_lines) > 25:
            assets_text += f"\n... and {len(asset_summary_lines) - 25} other auxiliary files."
        prompt_sections.append(f"""## Auxiliary & Static Assets (Excluded from inline code to optimize tokens)
The following asset/data files are part of the project structure. If recreating them, generate sample mock data or placeholder files as needed:
{assets_text}
""")

    # Section E: Source Code Files
    prompt_sections.append("## Source Code Files")
    prompt_sections.append("Below are the complete source files for the application. Recreate each file in its exact relative path:")

    for file_info in included_files_content:
        file_header = f"### File: `{file_info['rel_path']}` ({file_info['size_kb']} KB)"
        file_block = f"```{file_info['lang']}\n{file_info['content']}\n```"
        prompt_sections.append(f"{file_header}\n\n{file_block}\n")

    # Section F: Execution & Run Instructions
    run_instructions = generate_run_instructions(app_name, tech_stack, [f['rel_path'] for f in all_files])
    prompt_sections.append(f"""## Setup, Execution & Verification Instructions
{run_instructions}
""")

    # Assemble Master Prompt
    full_prompt = "\n\n".join(prompt_sections)
    token_est = estimate_tokens(full_prompt)

    stats = {
        'app_name': app_name,
        'total_files_scanned': len(all_files),
        'included_files_count': len(files_to_include),
        'skipped_files_count': len(skipped_assets),
        'total_chars': len(full_prompt),
        'estimated_tokens': token_est,
        'tech_stack': tech_stack
    }

    return full_prompt, stats

def generate_run_instructions(app_name, tech_stack, file_paths):
    """Generate dynamic setup and execution instructions based on detected tech."""
    instructions = []
    
    has_html = any(f.endswith('.html') for f in file_paths)
    has_python = any(f.endswith('.py') for f in file_paths)
    has_node = 'package.json' in [os.path.basename(f) for f in file_paths]
    has_streamlit = any('streamlit' in f.lower() for f in file_paths)

    instructions.append("### 1. File Setup")
    instructions.append(f"- Create the root directory `{app_name}/` and save all files listed above into their corresponding relative paths.")

    if has_node:
        instructions.append("\n### 2. Node.js Dependencies")
        instructions.append("- Run `npm install` to install project dependencies.")

    if has_python:
        instructions.append("\n### 3. Python Environment")
        instructions.append("- Ensure Python 3.10+ is installed.")
        py_servers = [f for f in file_paths if 'server' in f.lower() or 'app.py' in f.lower() or 'main.py' in f.lower()]
        if py_servers:
            instructions.append(f"- To start the backend, run: `python {py_servers[0]}`")

    if has_streamlit:
        instructions.append("\n### 4. Running Streamlit Dashboard")
        streamlit_files = [f for f in file_paths if f.endswith('.py')]
        target_py = streamlit_files[0] if streamlit_files else "app.py"
        instructions.append(f"- Run: `streamlit run {target_py}`")
    elif has_html:
        instructions.append("\n### 4. Launching the Web Application")
        instructions.append("- Open `index.html` directly in any modern browser, or serve using `python -m http.server 8000` and navigate to `http://localhost:8000`.")

    instructions.append("\n### 5. Verification Checklist")
    instructions.append("- [ ] Verify all file paths match the structure tree.")
    instructions.append("- [ ] Check browser developer console (F12) for zero 404 or JS syntax errors.")
    instructions.append("- [ ] Test primary interactive features and user flows.")

    return "\n".join(instructions)
