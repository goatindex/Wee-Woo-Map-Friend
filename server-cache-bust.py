#!/usr/bin/env python3
"""
Cache-busting HTTP server for development
Adds aggressive cache-busting headers to force browser cache invalidation
"""

import http.server
import socketserver
import os
import mimetypes
from datetime import datetime

class CacheBustingHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add aggressive cache-busting headers
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Last-Modified', datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT'))
        self.send_header('ETag', f'"{datetime.now().timestamp()}"')
        
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        super().end_headers()
    
    def do_GET(self):
        # Add cache-busting query parameter to all requests
        if '?' not in self.path:
            self.path += f'?cb={datetime.now().timestamp()}'
        elif 'cb=' not in self.path:
            self.path += f'&cb={datetime.now().timestamp()}'
        
        super().do_GET()
    
    def log_message(self, format, *args):
        # Enhanced logging with timestamps
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def run_server(port=8000):
    """Start the cache-busting server"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", port), CacheBustingHTTPRequestHandler) as httpd:
        print(f"🚀 Cache-busting server running on http://localhost:{port}")
        print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("🔄 All requests will include cache-busting headers")
        print("🛑 Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    run_server()
