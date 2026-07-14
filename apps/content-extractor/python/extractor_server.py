#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Zero-Dependency Content Extractor Local Server
Hosts a lightweight HTTP server exposing APIs to scrape web pages,
transcribe YouTube videos, and update the Tamil Heritage portal dynamically.
Runs on Python's built-in server modules without requiring pip installations.
"""

import sys
import os
import json
import urllib.parse
import urllib.request
import re
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

# Add current directory to path to load local helper modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from web_scraper import scrape_url
from youtube_transcriber import extract_video_id, get_transcript

PORT = 5005

def save_content_to_portal(url, content):
    """
    Classifies the content, downloads any first available image,
    and updates the corresponding profile slideshow html page.
    """
    try:
        content_lower = content.lower()
        url_lower = url.lower()
        
        # 1. Classify target pioneer
        is_nammalvar = any(k in content_lower or k in url_lower for k in ["nammalvar", "nammazhvar", "organic", "farming", "soil", "agriculture", "vanagam"])
        is_orissa_balu = any(k in content_lower or k in url_lower for k in ["orissa", "balu", "turtle", "oceanography", "seafaring", "kumari kandam", "maritime"])
        
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        if is_nammalvar:
            target_file = os.path.join(base_dir, "apps", "biographies", "nammalvar.html")
            pioneer_name = "G. Nammalvar"
        elif is_orissa_balu:
            target_file = os.path.join(base_dir, "apps", "biographies", "orissa_balu.html")
            pioneer_name = "Orissa Balu"
        else:
            return False, "Could not classify the content automatically. Please ensure the page content mentions 'Balu' or 'Nammalvar' to route it."
            
        if not os.path.exists(target_file):
            return False, f"Target biography file not found: {target_file}"
            
        # 2. Extract and download first image if the source is a webpage (and not YouTube)
        local_img_ref = ""
        if not ("youtube.com" in url or "youtu.be" in url):
            try:
                # Scrape the page for images
                req = urllib.request.Request(
                    url, 
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
                )
                with urllib.request.urlopen(req, timeout=8) as resp:
                    page_html = resp.read().decode('utf-8', errors='ignore')
                    
                    # Regex to find image links
                    img_matches = re.findall(r'<img[^>]+src="([^"]+\.(?:jpg|jpeg|png)(?:\?[^"]*)?)"', page_html, re.IGNORECASE)
                    img_url = None
                    for candidate in img_matches:
                        cand_low = candidate.lower()
                        if "logo" not in cand_low and "icon" not in cand_low and "avatar" not in cand_low:
                            img_url = candidate
                            break
                    if not img_url and len(img_matches) > 0:
                        img_url = img_matches[0]
                        
                    if img_url:
                        # Make absolute URL
                        if img_url.startswith("//"):
                            img_url = "https:" + img_url
                        elif img_url.startswith("/"):
                            parsed_uri = urllib.parse.urlparse(url)
                            img_url = f"{parsed_uri.scheme}://{parsed_uri.netloc}{img_url}"
                            
                        # Download image locally to html/images
                        images_dir = os.path.join(base_dir, "apps", "biographies", "images")
                        os.makedirs(images_dir, exist_ok=True)
                        
                        timestamp = int(time.time())
                        img_filename = f"scraped_{timestamp}.jpg"
                        dest_path = os.path.join(images_dir, img_filename)
                        
                        urllib.request.urlretrieve(img_url, dest_path)
                        local_img_ref = f"images/{img_filename}"
                        print(f"[+] Downloaded image to: {local_img_ref}", file=sys.stderr)
            except Exception as e:
                print(f"[!] Warning: Failed to download images from webpage: {e}", file=sys.stderr)
                
        # 3. Format paragraphs into clean HTML
        formatted_paragraphs = []
        for paragraph in content.split("\n\n"):
            para_clean = paragraph.strip()
            if para_clean:
                # Escape HTML tags for safety
                para_escaped = para_clean.replace("<", "&lt;").replace(">", "&gt;")
                formatted_paragraphs.append(f'<p style="font-size:0.85rem; line-height:1.5; color:var(--text-secondary); margin-bottom:8px;">{para_escaped}</p>')
                
        paragraphs_html = "\n".join(formatted_paragraphs)
        
        image_html = ""
        if local_img_ref:
            image_html = f'''
            <div style="margin-bottom: 12px; border-radius: 12px; overflow: hidden; max-height: 240px; border: 1px solid var(--border-color);">
                <img src="{local_img_ref}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            '''
            
        new_entry_html = f'''
        <div style="background:#ffffff; padding: 1.5rem; border-radius: 16px; margin-top: 1rem; border: 1px solid var(--border-color); text-align: left; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
            <p style="font-size:0.8rem; font-weight:700; color:var(--color-primary); margin-bottom:8px; text-transform: uppercase; letter-spacing: 0.05em;">
                Saved Article Links: <a href="{url}" target="_blank" style="color: var(--color-primary); text-decoration: underline;">{url[:60]}...</a>
            </p>
            {image_html}
            {paragraphs_html}
        </div>
        <!-- APPEND_CONTENT_MARKER -->
        '''
        
        # 4. Replace content marker inside target file
        with open(target_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        if "<!-- APPEND_CONTENT_MARKER -->" in html_content:
            updated_html = html_content.replace("<!-- APPEND_CONTENT_MARKER -->", new_entry_html)
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(updated_html)
            return True, f"Successfully saved extracted content to {pioneer_name} profile page."
        else:
            return False, "Could not find target insert marker in the HTML page."
            
    except Exception as e:
        return False, f"Exception during save: {str(e)}"


class ExtractorRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        sys.stderr.write(f"[*] Server Log: {format % args}\n")

    def end_headers(self):
        # Enable CORS for local file:/// loads and web requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        if parsed_url.path == '/' or parsed_url.path == '/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "running", "message": "Content Extractor API ready"}).encode('utf-8'))
            return
            
        if parsed_url.path == '/extract':
            query_params = urllib.parse.parse_qs(parsed_url.query)
            target_url = query_params.get('url', [None])[0]
            
            if not target_url:
                self.send_error("Missing 'url' parameter in query string.", 400)
                return
            
            target_url = target_url.strip()
            print(f"[*] API Request: Extracting URL: {target_url}", file=sys.stderr)
            
            video_id = extract_video_id(target_url)
            if video_id:
                content = get_transcript(video_id)
                source_type = "YouTube Transcript"
            else:
                content = scrape_url(target_url)
                source_type = "Webpage Text"
                
            is_success = not content.startswith("Error:")
            
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

        self.send_response(404)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"404 Not Found")

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        if parsed_url.path == '/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                url = data.get('url', '').strip()
                content = data.get('content', '').strip()
                
                if not url or not content:
                    self.send_error("Missing 'url' or 'content' in request body.", 400)
                    return
                
                print(f"[*] API Request: Saving content for URL: {url}", file=sys.stderr)
                success, message = save_content_to_portal(url, content)
                
                self.send_response(200 if success else 400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response_payload = {
                    "success": success,
                    "message": message,
                    "error": None if success else message
                }
                self.wfile.write(json.dumps(response_payload).encode('utf-8'))
                
            except Exception as e:
                self.send_error(f"Internal server error: {str(e)}", 500)
            return

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
