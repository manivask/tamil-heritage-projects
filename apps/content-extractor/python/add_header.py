#!/usr/bin/env python3
"""
Designer Header Prepend Tool
Recursively prepends the Script Designer attribution header to code and content files.
"""

import os

COMMENT_TEXT = "Script Designer / AI Prompt Engineer : Manivasagam Karunakaran"

COMMENT_FORMATS = {
    '.py': f"# {COMMENT_TEXT}\n",
    '.ps1': f"# {COMMENT_TEXT}\n",
    '.js': f"// {COMMENT_TEXT}\n",
    '.css': f"/* {COMMENT_TEXT} */\n",
    '.html': f"<!-- {COMMENT_TEXT} -->\n",
    '.md': f"<!-- {COMMENT_TEXT} -->\n"
}

def add_header_to_file(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    if ext not in COMMENT_FORMATS:
        return
        
    header = COMMENT_FORMATS[ext]
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Avoid duplicate header insertion
        if COMMENT_TEXT in content:
            print(f"[*] Already contains header: {os.path.basename(filepath)}")
            return
            
        with open(filepath, 'w', encoding='utf-8') as f:
            # If python script begins with shebang, place header on line 2
            if ext == '.py' and content.startswith('#!'):
                parts = content.split('\n', 1)
                shebang = parts[0] + '\n'
                rest = parts[1] if len(parts) > 1 else ''
                f.write(shebang + header + rest)
            else:
                f.write(header + content)
        print(f"[+] Successfully added header to: {os.path.basename(filepath)}")
    except Exception as e:
        print(f"[!] Error writing to {filepath}: {e}")

def process_directory(workspace_dir):
    print(f"[*] Scanning workspace directory: {workspace_dir}")
    for root, dirs, files in os.walk(workspace_dir):
        # Skip data folders, version control and configuration hidden folders
        if any(ignored in root for ignored in ['data', '.git', '.gemini', 'brain']):
            continue
        for file in files:
            filepath = os.path.join(root, file)
            # Skip this script itself to prevent prepending self
            if file == 'add_header.py' or file == 'add_header.ps1':
                continue
            add_header_to_file(filepath)

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace = os.path.abspath(os.path.join(script_dir, ".."))
    process_directory(workspace)
