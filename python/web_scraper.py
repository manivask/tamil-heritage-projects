#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Web Page Scraper Utility
Fetches any webpage and extracts the raw textual content, stripping HTML tags,
scripts, styles, headers, and navigation bars to save LLM context tokens.
Uses only the Python standard library for zero-dependency execution.
"""

import sys
import urllib.request
import urllib.parse
from html.parser import HTMLParser
import re

class WebPageHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_blocks = []
        self.in_ignored_tag = False
        self.ignored_tags = {'script', 'style', 'nav', 'footer', 'header', 'aside', 'head', 'noscript', 'iframe'}
        self.current_tag = ""

    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        if tag in self.ignored_tags:
            self.in_ignored_tag = True
        
        # Add spacing for block-level elements to preserve layout readability
        if tag in {'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr'}:
            self.text_blocks.append("\n")

    def handle_endtag(self, tag):
        if tag in self.ignored_tags:
            self.in_ignored_tag = False
        if tag in {'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr'}:
            self.text_blocks.append("\n")

    def handle_data(self, data):
        if self.in_ignored_tag:
            return
        
        cleaned = data.strip()
        if cleaned:
            # Clean up duplicate whitespace/tabs
            cleaned = re.sub(r'[ \t]+', ' ', cleaned)
            self.text_blocks.append(cleaned)

    def get_clean_text(self):
        full_text = "".join(self.text_blocks)
        # Collapse multiple empty newlines into at most double newlines
        collapsed = re.sub(r'\n{3,}', '\n\n', full_text)
        return collapsed.strip()

def scrape_url(url):
    print(f"[*] Fetching: {url}...", file=sys.stderr)
    req = urllib.request.Request(
        url,
        headers={
            # Standard browser User-Agent to avoid scraping blocks
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            encoding = response.info().get_content_charset() or 'utf-8'
            html_content = response.read().decode(encoding, errors='ignore')
            
            parser = WebPageHTMLParser()
            parser.feed(html_content)
            return parser.get_clean_text()
            
    except Exception as e:
        print(f"[!] Scrape failed: {e}", file=sys.stderr)
        return f"Error: Scrape failed - {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python web_scraper.py <url>")
        sys.exit(1)
        
    target_url = sys.argv[1]
    result = scrape_url(target_url)
    print(result)
