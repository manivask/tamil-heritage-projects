#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Zero-Dependency AI Prompt Generator Local HTTP Server
Exposes clean REST APIs to scan workspace apps, parse folder contents,
and generate token-optimized AI rebuild prompts.
"""

import sys
import os
import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

# Import local prompt engine
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import prompt_engine

PORT = 5006
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
APPS_DIR = os.path.join(WORKSPACE_ROOT, "apps")

class PromptGeneratorHandler(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == '/status':
            self.handle_status()
        elif path == '/api/apps':
            self.handle_list_apps()
        elif path.startswith('/api/browse'):
            query = urllib.parse.parse_qs(parsed_url.query)
            target_dir = query.get('path', [APPS_DIR])[0]
            self.handle_browse(target_dir)
        else:
            # Fallback to serve static app files if requested directly from server port
            self.handle_static_file(path)

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
        
        try:
            body = json.loads(post_data)
        except Exception:
            body = {}

        if path == '/api/scan':
            self.handle_scan(body)
        elif path == '/api/generate':
            self.handle_generate(body)
        elif path == '/api/save_prompt':
            self.handle_save_prompt(body)
        else:
            self.send_json_response({'error': 'Endpoint not found'}, status=404)

    def handle_status(self):
        self.send_json_response({
            'status': 'online',
            'workspace_root': WORKSPACE_ROOT.replace('\\', '/'),
            'apps_dir': APPS_DIR.replace('\\', '/'),
            'port': PORT
        })

    def handle_list_apps(self):
        apps = []
        
        # 1. Scan primary apps
        if os.path.exists(APPS_DIR):
            for item in sorted(os.listdir(APPS_DIR)):
                full_path = os.path.join(APPS_DIR, item)
                if os.path.isdir(full_path) and not item.startswith('.'):
                    if item == 'tamil-heritage':
                        # Scan sub-apps inside tamil-heritage
                        for sub in sorted(os.listdir(full_path)):
                            sub_full_path = os.path.join(full_path, sub)
                            if os.path.isdir(sub_full_path) and not sub.startswith('.'):
                                files = prompt_engine.scan_directory(sub_full_path)
                                tech_stack = prompt_engine.detect_tech_stack([f['rel_path'] for f in files])
                                total_size_kb = sum(f['size_kb'] for f in files)
                                code_files_count = sum(1 for f in files if f['default_include'])
                                description = self.extract_app_description(sub_full_path)
                                apps.append({
                                    'name': f"tamil-heritage/{sub}",
                                    'category': 'Tamil Heritage',
                                    'path': sub_full_path.replace('\\', '/'),
                                    'rel_path': f"apps/tamil-heritage/{sub}",
                                    'file_count': len(files),
                                    'code_files_count': code_files_count,
                                    'total_size_kb': round(total_size_kb, 1),
                                    'tech_stack': tech_stack,
                                    'description': description
                                })
                    else:
                        files = prompt_engine.scan_directory(full_path)
                        tech_stack = prompt_engine.detect_tech_stack([f['rel_path'] for f in files])
                        total_size_kb = sum(f['size_kb'] for f in files)
                        code_files_count = sum(1 for f in files if f['default_include'])
                        description = self.extract_app_description(full_path)

                        apps.append({
                            'name': item,
                            'category': 'Applications',
                            'path': full_path.replace('\\', '/'),
                            'rel_path': f"apps/{item}",
                            'file_count': len(files),
                            'code_files_count': code_files_count,
                            'total_size_kb': round(total_size_kb, 1),
                            'tech_stack': tech_stack,
                            'description': description
                        })

        # 2. Scan utilities
        utils_dir = os.path.join(WORKSPACE_ROOT, "utilities")
        if os.path.exists(utils_dir):
            for item in sorted(os.listdir(utils_dir)):
                full_path = os.path.join(utils_dir, item)
                if os.path.isdir(full_path) and not item.startswith('.'):
                    files = prompt_engine.scan_directory(full_path)
                    tech_stack = prompt_engine.detect_tech_stack([f['rel_path'] for f in files])
                    total_size_kb = sum(f['size_kb'] for f in files)
                    code_files_count = sum(1 for f in files if f['default_include'])
                    description = self.extract_app_description(full_path)

                    apps.append({
                        'name': f"utilities/{item}",
                        'category': 'Utilities & Operations',
                        'path': full_path.replace('\\', '/'),
                        'rel_path': f"utilities/{item}",
                        'file_count': len(files),
                        'code_files_count': code_files_count,
                        'total_size_kb': round(total_size_kb, 1),
                        'tech_stack': tech_stack,
                        'description': description
                    })

        self.send_json_response({'apps': apps, 'total_apps': len(apps)})

    def extract_app_description(self, app_path):
        index_file = os.path.join(app_path, "index.html")
        if os.path.exists(index_file):
            try:
                with open(index_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read(2048)
                    import re
                    m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']', content, re.IGNORECASE)
                    if m:
                        return m.group(1)
            except Exception:
                pass
        return "Interactive application in workspace."

    def handle_scan(self, body):
        target_path = body.get('path', '')
        if not target_path:
            self.send_json_response({'error': 'Missing "path" parameter'}, status=400)
            return

        # Resolve relative to workspace if not absolute
        if not os.path.isabs(target_path):
            target_path = os.path.join(WORKSPACE_ROOT, target_path)

        target_path = os.path.abspath(target_path)
        if not os.path.exists(target_path) or not os.path.isdir(target_path):
            self.send_json_response({'error': f'Folder does not exist: {target_path}'}, status=404)
            return

        files = prompt_engine.scan_directory(target_path)
        tree_lines = prompt_engine.build_ascii_tree(target_path)
        tech_stack = prompt_engine.detect_tech_stack([f['rel_path'] for f in files])

        self.send_json_response({
            'app_name': os.path.basename(target_path),
            'target_path': target_path.replace('\\', '/'),
            'files': files,
            'tree': "\n".join(tree_lines),
            'tech_stack': tech_stack,
            'total_files': len(files),
            'default_included': sum(1 for f in files if f['default_include'])
        })

    def handle_generate(self, body):
        target_path = body.get('path', '')
        if not target_path:
            self.send_json_response({'error': 'Missing "path" parameter'}, status=400)
            return

        if not os.path.isabs(target_path):
            target_path = os.path.join(WORKSPACE_ROOT, target_path)

        target_path = os.path.abspath(target_path)
        if not os.path.exists(target_path) or not os.path.isdir(target_path):
            self.send_json_response({'error': f'Folder not found: {target_path}'}, status=404)
            return

        options = {
            'selected_files': body.get('selected_files'),
            'llm_target': body.get('llm_target', 'Universal LLM'),
            'prompt_mode': body.get('prompt_mode', 'full_rebuild'),
            'custom_instructions': body.get('custom_instructions', ''),
            'strip_extra_whitespace': body.get('strip_extra_whitespace', True)
        }

        try:
            prompt_text, stats = prompt_engine.generate_llm_prompt(target_path, options)
            self.send_json_response({
                'success': True,
                'prompt': prompt_text,
                'stats': stats
            })
        except Exception as e:
            self.send_json_response({'error': f'Error generating prompt: {str(e)}'}, status=500)

    def handle_save_prompt(self, body):
        prompt_text = body.get('prompt', '')
        filename = body.get('filename', 'generated_prompt.txt')
        save_dir = os.path.join(WORKSPACE_ROOT, "apps", "prompt_generator", "saved_prompts")
        os.makedirs(save_dir, exist_ok=True)
        
        save_path = os.path.join(save_dir, filename)
        with open(save_path, 'w', encoding='utf-8') as f:
            f.write(prompt_text)

        self.send_json_response({
            'success': True,
            'saved_path': save_path.replace('\\', '/')
        })

    def handle_browse(self, dir_path):
        if not os.path.isabs(dir_path):
            dir_path = os.path.join(WORKSPACE_ROOT, dir_path)
        dir_path = os.path.abspath(dir_path)

        if not os.path.exists(dir_path) or not os.path.isdir(dir_path):
            self.send_json_response({'error': 'Directory does not exist'}, status=404)
            return

        items = []
        try:
            for name in sorted(os.listdir(dir_path)):
                if name.startswith('.'):
                    continue
                p = os.path.join(dir_path, name)
                is_dir = os.path.isdir(p)
                items.append({
                    'name': name,
                    'path': p.replace('\\', '/'),
                    'is_dir': is_dir,
                    'size_kb': round(os.path.getsize(p)/1024, 2) if not is_dir else 0
                })
        except Exception as e:
            self.send_json_response({'error': str(e)}, status=500)
            return

        self.send_json_response({
            'current_path': dir_path.replace('\\', '/'),
            'parent_path': os.path.dirname(dir_path).replace('\\', '/'),
            'items': items
        })

    def handle_static_file(self, req_path):
        app_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        if req_path == '/' or req_path == '/index.html':
            target_file = os.path.join(app_root, "index.html")
        else:
            clean_path = req_path.lstrip('/')
            target_file = os.path.join(app_root, clean_path)

        if os.path.exists(target_file) and os.path.isfile(target_file):
            content_type = 'text/html; charset=utf-8'
            if target_file.endswith('.css'):
                content_type = 'text/css'
            elif target_file.endswith('.js'):
                content_type = 'application/javascript'
            elif target_file.endswith('.json'):
                content_type = 'application/json'

            try:
                with open(target_file, 'rb') as f:
                    data = f.read()
                self.send_response(200)
                self.send_cors_headers()
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self.send_json_response({'error': str(e)}, status=500)
        else:
            self.send_json_response({'error': 'File not found'}, status=404)

    def send_json_response(self, data, status=200):
        response_bytes = json.dumps(data, indent=2).encode('utf-8')
        self.send_response(status)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def log_message(self, format, *args):
        # Concise logging
        sys.stderr.write(f"[PromptGenServer] {self.address_string()} - {format%args}\n")

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, PromptGeneratorHandler)
    print("=====================================================")
    print(f"[OK] AI App Prompt Generator Server running on port {PORT}")
    print(f"[URL] Open in browser: http://localhost:{PORT}")
    print(f"[ROOT] Workspace Root: {WORKSPACE_ROOT}")
    print("=====================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Prompt Generator Server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
