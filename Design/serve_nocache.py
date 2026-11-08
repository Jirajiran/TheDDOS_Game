"""Local static server with Cache-Control: no-store & Auto HTML Detection."""
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HOST = "127.0.0.1"
PORT = 8080


class NoCacheHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **getattr(SimpleHTTPRequestHandler, "extensions_map", {}),
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
        ".wasm": "application/wasm",
        ".svg": "image/svg+xml",
    }

    def do_GET(self):
        # หากเปิดมาที่ Root (/) แล้วหา index.html ไม่เจอ ให้เปิดไฟล์ .html ตัวแรกที่พบแทน
        if self.path in ("/", ""):
            if not os.path.exists("index.html"):
                html_files = [f for f in os.listdir(".") if f.lower().endswith(".html")]
                if html_files:
                    self.path = "/" + html_files[0]

        return super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        super().log_message(fmt, *args)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), NoCacheHandler)
    print(f"Local Server running at http://{HOST}:{PORT}/")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")