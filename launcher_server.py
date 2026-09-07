#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Zero-Dependency Workspace Launcher & Service Control Server
Monitors local application ports, manages background dev processes,
and exposes REST APIs for the Developer Launcher Dashboard.
"""

import sys
import os
import json
import socket
import subprocess
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 5000
WORKSPACE_ROOT = os.path.abspath(os.path.dirname(__file__))

SERVICES_CONFIG = {
    'prompt_generator': {
        'name': 'AI App Prompt Generator',
        'port': 5006,
        'command': [sys.executable, os.path.join(WORKSPACE_ROOT, 'apps', 'prompt_generator', 'python', 'server.py')],
        'cwd': os.path.join(WORKSPACE_ROOT, 'apps', 'prompt_generator', 'python'),
        'url': 'http://localhost:5006'
    },
    'content_extractor': {
        'name': 'Content Extractor Backend',
        'port': 5005,
        'command': [sys.executable, os.path.join(WORKSPACE_ROOT, 'apps', 'content-extractor', 'python', 'extractor_server.py')],
        'cwd': os.path.join(WORKSPACE_ROOT, 'apps', 'content-extractor', 'python'),
        'url': 'http://localhost:5005'
    },
    'cpu_monitor': {
        'name': 'CPU Monitor Dashboard',
        'port': 8501,
        'command': ['streamlit', 'run', os.path.join(WORKSPACE_ROOT, 'apps', 'cpu-monitor', 'app.py'), '--server.port', '8501', '--server.headless', 'true'],
        'cwd': os.path.join(WORKSPACE_ROOT, 'apps', 'cpu-monitor'),
        'url': 'http://localhost:8501'
    }
}

running_processes = {}

def is_port_in_use(port):
    """Check if a TCP port is currently active on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex(('127.0.0.1', port)) == 0

class LauncherHandler(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/services':
            self.handle_services_status()
        elif parsed.path == '/api/status':
            self.handle_status()
        else:
            self.send_json_response({'error': 'Not found'}, status=404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
        try:
            body = json.loads(post_data)
        except Exception:
            body = {}

        if parsed.path == '/api/service/start':
            self.handle_start_service(body)
        elif parsed.path == '/api/service/stop':
            self.handle_stop_service(body)
        else:
            self.send_json_response({'error': 'Not found'}, status=404)

    def handle_status(self):
        self.send_json_response({
            'status': 'online',
            'server': 'Workspace Launcher API',
            'port': PORT,
            'python_version': sys.version.split()[0]
        })

    def handle_services_status(self):
        results = {}
        for key, conf in SERVICES_CONFIG.items():
            port = conf['port']
            online = is_port_in_use(port)
            proc_alive = (key in running_processes and running_processes[key].poll() is None)

            results[key] = {
                'name': conf['name'],
                'port': port,
                'url': conf['url'],
                'online': online or proc_alive,
                'managed': proc_alive
            }

        self.send_json_response({'services': results})

    def handle_start_service(self, body):
        key = body.get('service')
        if key not in SERVICES_CONFIG:
            self.send_json_response({'error': f'Unknown service: {key}'}, status=400)
            return

        conf = SERVICES_CONFIG[key]
        if is_port_in_use(conf['port']):
            self.send_json_response({'success': True, 'message': f'{conf["name"]} is already running on port {conf["port"]}.'})
            return

        try:
            # Start background subprocess
            proc = subprocess.Popen(
                conf['command'],
                cwd=conf['cwd'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            running_processes[key] = proc
            self.send_json_response({
                'success': True,
                'message': f'Started {conf["name"]} on port {conf["port"]}.',
                'pid': proc.pid
            })
        except Exception as e:
            self.send_json_response({'error': f'Failed to launch {conf["name"]}: {str(e)}'}, status=500)

    def handle_stop_service(self, body):
        key = body.get('service')
        if key not in SERVICES_CONFIG:
            self.send_json_response({'error': f'Unknown service: {key}'}, status=400)
            return

        conf = SERVICES_CONFIG[key]
        stopped = False

        if key in running_processes:
            try:
                running_processes[key].terminate()
                running_processes[key].kill()
                del running_processes[key]
                stopped = True
            except Exception:
                pass

        self.send_json_response({
            'success': True,
            'message': f'Stopped service {conf["name"]}.'
        })

    def send_json_response(self, data, status=200):
        resp = json.dumps(data, indent=2).encode('utf-8')
        self.send_response(status)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(resp)))
        self.end_headers()
        self.wfile.write(resp)

    def log_message(self, format, *args):
        sys.stderr.write(f"[LauncherServer] {self.address_string()} - {format%args}\n")

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, LauncherHandler)
    print("=====================================================")
    print(f"[OK] Workspace Services Launcher Server on port {PORT}")
    print(f"[URL] API URL: http://localhost:{PORT}")
    print("=====================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Launcher Server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
