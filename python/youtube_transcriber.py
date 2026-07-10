#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
YouTube Video & Shorts Transcripter
Extracts transcript text from any YouTube video or YouTube Short using the
official closed caption track api. If the required library is missing,
it self-heals by dynamically installing the package at runtime.
"""

import sys
import os
import re
import subprocess

# Self-healing dependency installation
try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    print("[*] youtube-transcript-api is missing. Installing dependency...", file=sys.stderr)
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "youtube-transcript-api", "--quiet"])
        from youtube_transcript_api import YouTubeTranscriptApi
        print("[+] Dependency installed successfully!", file=sys.stderr)
    except Exception as e:
        print(f"[!] Dynamic dependency installation failed: {e}", file=sys.stderr)
        print("Please run: pip install youtube-transcript-api", file=sys.stderr)
        sys.exit(1)

def extract_video_id(url):
    """
    Extracts the 11-character video ID from various YouTube URL formats,
    including watch links, mobile links, short links, and YouTube Shorts.
    """
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
            
    # Fallback: check if the URL is just the 11-char ID itself
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url.strip()):
        return url.strip()
        
    return None

def format_timestamp(seconds):
    """Formats raw seconds into mm:ss format."""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"

def get_transcript(video_id):
    """Fetches and formats transcript from YouTube API."""
    print(f"[*] Fetching transcript for video ID: {video_id}...", file=sys.stderr)
    
    try:
        # Request English and Tamil transcripts
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'ta', 'en-US'])
        
        formatted_transcript = []
        last_marker_time = -60  # Print timestamp every 60 seconds
        
        for item in transcript_list:
            start = item['start']
            text = item['text'].replace('\n', ' ').strip()
            
            # Add a timestamp header block every 1 minute
            if start - last_marker_time >= 60:
                timestamp = format_timestamp(start)
                formatted_transcript.append(f"\n[{timestamp}]\n")
                last_marker_time = start
                
            formatted_transcript.append(text)
            
        full_text = " ".join(formatted_transcript)
        # Clean up spacing around timestamp headers
        cleaned_text = re.sub(r'\s*\n\s*', '\n', full_text)
        return cleaned_text.strip()
        
    except Exception as e:
        error_msg = str(e)
        if "No transcript found" in error_msg:
            return "Error: Transcripts/Subtitles are disabled or not available for this video."
        return f"Error: Failed to fetch transcript - {error_msg}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python youtube_transcriber.py <youtube_url_or_video_id>")
        sys.exit(1)
        
    input_source = sys.argv[1]
    vid = extract_video_id(input_source)
    
    if not vid:
        print("Error: Invalid YouTube URL or Video ID format.")
        sys.exit(1)
        
    result_text = get_transcript(vid)
    print(result_text)
