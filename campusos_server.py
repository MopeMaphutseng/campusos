#!/usr/bin/env python3
"""Static file server with HTTP Range support (required for HTML5 video)."""
import os
import re
import sys
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8082

mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("image/jpeg", ".jpeg")
mimetypes.add_type("image/jpeg", ".jpg")


class RangeHandler(BaseHTTPRequestHandler):
    # Avoid one stalled/slow connection ever blocking a worker thread.
    timeout = 30

    def do_GET(self):
        parsed = urlparse(self.path)
        path = os.path.normpath(os.path.join(ROOT, parsed.path.lstrip("/")))
        if parsed.path == "/" or parsed.path == "":
            path = os.path.join(ROOT, "index.html")
        # SPA fallback: app routes (e.g. /admin) have no file extension, so
        # serve index.html and let the client-side router take over.
        if (not path.startswith(ROOT) or not os.path.isfile(path)) and \
                not os.path.splitext(parsed.path)[1]:
            path = os.path.join(ROOT, "index.html")
        if not path.startswith(ROOT) or not os.path.isfile(path):
            self.send_error(404)
            return

        content_type, _ = mimetypes.guess_type(path)
        if content_type is None:
            content_type = "application/octet-stream"
        content_type += "; charset=utf-8" if content_type.startswith("text/") else ""

        size = os.path.getsize(path)
        range_header = self.headers.get("Range")
        start, end = 0, size - 1

        if range_header:
            m = re.match(r"bytes=(\d*)-(\d*)", range_header)
            if m:
                s, e = m.group(1), m.group(2)
                start = int(s) if s else 0
                end = int(e) if e else size - 1
                end = min(end, size - 1)

            self.send_response(206)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Accept-Ranges", "bytes")
            length = end - start + 1
        else:
            self.send_response(200)
            length = size

        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(length))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        with open(path, "rb") as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                chunk = f.read(min(65536, remaining))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except BrokenPipeError:
                    break
                remaining -= len(chunk)

    def log_message(self, fmt, *args):
        sys.stdout.write(f"[campusos-server] {fmt % args}\n")
        sys.stdout.flush()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), RangeHandler)
    server.daemon_threads = True
    print(f"CampusOS server (threaded, Range support) on port {PORT}, root={ROOT}")
    server.serve_forever()
