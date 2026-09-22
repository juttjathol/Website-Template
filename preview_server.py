import http.server
import socketserver
import urllib.request
import urllib.parse

PORT = 8081
WRANGLER_PORT = 8787

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if not path.startswith('/api/'):
            if path == '/' or (path.count('/') <= 1 and '.' not in path.split('/')[-1] or path.split('/')[-1] == ''):
                path = '/frontend/index.html'
            else:
                path = '/frontend' + path
        return http.server.SimpleHTTPRequestHandler.translate_path(self, path)
    def do_GET(self):
        if self.path.startswith('/api/'):
            try:
                url = f'http://localhost:{WRANGLER_PORT}{self.path}'
                with urllib.request.urlopen(url, timeout=5) as resp:
                    self.send_response(resp.status)
                    for k,v in resp.headers.items():
                        if k.lower() not in ('transfer-encoding', 'content-length', 'connection'):
                            self.send_header(k, v)
                    self.end_headers()
                    self.wfile.write(resp.read())
            except Exception as e:
                self.send_error(502, str(e))
            return
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
    def do_POST(self):
        if self.path.startswith('/api/'):
            try:
                url = f'http://localhost:{WRANGLER_PORT}{self.path}'
                data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
                req = urllib.request.Request(url, data=data, headers=dict(self.headers))
                with urllib.request.urlopen(req, timeout=5) as resp:
                    self.send_response(resp.status)
                    for k,v in resp.headers.items():
                        if k.lower() not in ('transfer-encoding', 'content-length', 'connection'):
                            self.send_header(k, v)
                    self.end_headers()
                    self.wfile.write(resp.read())
            except Exception as e:
                self.send_error(502, str(e))
            return
        self.send_error(405)

with socketserver.TCPServer(("0.0.0.0", PORT), ProxyHandler) as httpd:
    print(f"Preview server running at http://0.0.0.0:{PORT}")
    httpd.serve_forever()
