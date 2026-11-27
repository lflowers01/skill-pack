"""Serve life-audit/outputs/dashboard.html on localhost and save what the user records.

Usage: python serve_dashboard.py <path-to-life-audit> [--port 8780] [--open]

GET  /       the dashboard
GET  /state  life-audit/checkins/state.json (or {})
POST /state  replaces state.json (JSON only, max 1 MB); previous version kept as state.json.bak

Binds to 127.0.0.1 only. Stdlib only.
"""
import argparse, json, os, sys, webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX = 1_000_000


def make_handler(root):
    page = os.path.join(root, "outputs", "dashboard.html")
    state = os.path.join(root, "checkins", "state.json")

    class H(BaseHTTPRequestHandler):
        def _send(self, code, body, ctype="application/json"):
            data = body.encode() if isinstance(body, str) else body
            self.send_response(code)
            self.send_header("Content-Type", ctype + "; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            path = self.path.split("?")[0]
            if path in ("/", "/index.html", "/dashboard.html"):
                with open(page, "rb") as f:
                    return self._send(200, f.read(), "text/html")
            if path == "/state":
                if os.path.exists(state):
                    with open(state, "rb") as f:
                        return self._send(200, f.read())
                return self._send(200, "{}")
            self._send(404, '{"error":"not found"}')

        def do_POST(self):
            if self.path.split("?")[0] != "/state":
                return self._send(404, '{"error":"not found"}')
            # JSON content type forces a CORS preflight, so other websites cannot post here.
            if not self.headers.get("Content-Type", "").startswith("application/json"):
                return self._send(415, '{"error":"json only"}')
            origin = self.headers.get("Origin")
            if origin and origin.split("//")[-1] != self.headers.get("Host"):
                return self._send(403, '{"error":"bad origin"}')
            n = int(self.headers.get("Content-Length") or 0)
            if n <= 0 or n > MAX:
                return self._send(413, '{"error":"size"}')
            raw = self.rfile.read(n)
            try:
                obj = json.loads(raw)
                assert isinstance(obj, dict)
            except Exception:
                return self._send(400, '{"error":"bad json"}')
            os.makedirs(os.path.dirname(state), exist_ok=True)
            if os.path.exists(state):
                os.replace(state, state + ".bak")
            tmp = state + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(obj, f, indent=1, ensure_ascii=False)
            os.replace(tmp, state)
            self._send(200, '{"ok":true}')

        def log_message(self, *a):
            pass

    return H


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root", help="path to the life-audit folder")
    ap.add_argument("--port", type=int, default=8780)
    ap.add_argument("--open", action="store_true")
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    if not os.path.exists(os.path.join(root, "outputs", "dashboard.html")):
        sys.exit("no outputs/dashboard.html in " + root)
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), make_handler(root))
    url = "http://127.0.0.1:%d/" % a.port
    print("serving " + url, flush=True)
    if a.open:
        webbrowser.open(url)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
