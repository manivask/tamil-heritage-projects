#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Zero-Dependency Content Extractor Local Server
Hosts a lightweight HTTP server exposing an API to scrape web pages and
transcribe YouTube videos. Interacts seamlessly with the frontend HTML UI.
Runs on Python's built-in server modules without requiring pip installations.
"""

import sys
import os
import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

# Add current directory to path to load local helper modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from web_scraper import scrape_url
from youtube_transcriber import extract_video_id, get_transcript

PORT = 5005

class ExtractorRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Override to log cleanly to stderr
        sys.stderr.write(f"[*] Server Log: {format % args}\n")

    def end_headers(self):
        # Enable CORS for local file:/// loads and web requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        # Pre-flight request support for CORS
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        # Route: Health check
        if parsed_url.path == '/' or parsed_url.path == '/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "running", "message": "Content Extractor API ready"}).encode('utf-8'))
            return
            
        # Route: Extractor API
        if parsed_url.path == '/extract':
            query_params = urllib.parse.parse_qs(parsed_url.query)
            target_url = query_params.get('url', [None])[0]
            
            if not target_url:
                self.send_error("Missing 'url' parameter in query string.", 400)
                return
            
            # Trim and clean URL
            target_url = target_url.strip()
            
            print(f"[*] API Request: Extracting URL: {target_url}", file=sys.stderr)
            
            # Check if YouTube
            video_id = extract_video_id(target_url)
            if video_id:
                content = get_transcript(video_id)
                source_type = "YouTube Transcript"
            else:
                content = scrape_url(target_url)
                source_type = "Webpage Text"
                
            is_success = not content.startswith("Error:")
            
            # Send JSON response
            self.send_response(200 if is_success else 500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            
            response_payload = {
                "success": is_success,
                "type": source_type,
                "url": target_url,
                "content": content if is_success else None,
                "error": content if not is_success else None
            }
            
            self.wfile.write(json.dumps(response_payload, ensure_ascii=False).encode('utf-8'))
            return

        # 404 Route
        self.send_response(404)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"404 Not Found")

    def send_error(self, message, code=500):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"success": False, "error": message}).encode('utf-8'))

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, ExtractorRequestHandler)
    print(f"==================================================", file=sys.stderr)
    print(f"[+] Content Extractor server running on port {PORT}...", file=sys.stderr)
    print(f"[+] API URL: http://localhost:{PORT}/extract?url=<URL>", file=sys.stderr)
    print(f"==================================================", file=sys.stderr)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[-] Server shutting down.", file=sys.stderr)
        httpd.server_close()

if __name__ == "__main__":
    run_server()
