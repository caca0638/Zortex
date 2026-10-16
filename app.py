import os
import sys
import time
import socket
import threading
import subprocess
import webbrowser
import json
import shutil
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

# Windows CP1254/CP437/OEM terminal kodlama uyumlulugu
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

"""
=============================================================================
  ZORTEX: CYBER SURVIVOR - STANDALONE DESKTOP APPLICATION RUNNER
=============================================================================
Bu script, Zortex'i bagimsiz bir masaustu uygulamasi (Standalone Desktop App)
olarak baslatir. Microsoft Edge veya Google Chrome'un yerlesik "--app" modunu
kullanarak tarayici cubugu, sekmeler ve menuler olmadan tam tesekkullu bir
konsol / masaustu oyunu penceresi acar.
Ayni zamanda guvenli ve atomik save API'si (/api/save) sunar.
=============================================================================
"""

APP_DIR = os.path.dirname(os.path.abspath(__file__))

def get_external_profile_dir():
    """Servis edilen webroot kokunun DISINDA harici profil ve save dizini belirler."""
    appdata = os.environ.get('APPDATA') or os.environ.get('LOCALAPPDATA')
    if appdata and os.path.isdir(appdata):
        return os.path.join(appdata, "ZortexCyberSurvivor", ".app_profile")
    return os.path.join(os.path.expanduser("~"), ".zortex_cyber_survivor", ".app_profile")

PROFILE_DIR = get_external_profile_dir()
SAVE_FILE = os.path.join(PROFILE_DIR, "save_data.json")
SAVE_LOCK = threading.Lock()
MAX_BODY_SIZE = 1 * 1024 * 1024  # 1 MB

def migrate_legacy_save():
    """Mevcut kayitlarin kaybolmamasi icin eski konumdan (.app_profile) yeni konuma tek seferlik tasima yapar."""
    legacy_dir = os.path.join(APP_DIR, ".app_profile")
    if not os.path.exists(legacy_dir):
        return

    os.makedirs(PROFILE_DIR, exist_ok=True)
    legacy_save = os.path.join(legacy_dir, "save_data.json")
    new_save = os.path.join(PROFILE_DIR, "save_data.json")

    # 1. save_data.json aktarimi
    if os.path.exists(legacy_save):
        try:
            if not os.path.exists(new_save):
                shutil.copy2(legacy_save, new_save)
                print(f"  [*] Eski kayit basariyla yeni konuma aktarildi: {new_save}")
            elif os.path.getsize(new_save) == 0 and os.path.getsize(legacy_save) > 0:
                shutil.copy2(legacy_save, new_save)
                print(f"  [*] Yeni konumdaki bos kayit eski kayit ile guncellendi: {new_save}")
        except Exception as err:
            print(f"  [!] Kayit aktarim hatasi: {err}")

    # 2. Diger profil dosyalari varsa aktar
    try:
        for item in os.listdir(legacy_dir):
            s = os.path.join(legacy_dir, item)
            d = os.path.join(PROFILE_DIR, item)
            if not os.path.exists(d):
                if os.path.isdir(s):
                    shutil.copytree(s, d)
                else:
                    shutil.copy2(s, d)
    except Exception as err:
        print(f"  [!] Profil dosyalari aktarim uyarisi: {err}")

    # 3. Eski .app_profile klasorunu webroot disina tasimak icin kokten kaldir
    try:
        shutil.rmtree(legacy_dir, ignore_errors=True)
        if not os.path.exists(legacy_dir):
            print("  [*] Eski .app_profile dizini servis edilen kokun disina tasindi.")
    except Exception as err:
        print(f"  [!] Eski .app_profile temizlenemedi: {err}")

def is_valid_save_schema(data):
    """Save API icin beklenen sema dogrulamasi."""
    if not isinstance(data, dict):
        return False
    if "profiles" not in data or not isinstance(data["profiles"], dict):
        return False
    if "activeProfile" in data and not (isinstance(data["activeProfile"], str) or data["activeProfile"] is None):
        return False
    if "savedAt" in data and not isinstance(data["savedAt"], (int, float)):
        return False
    for pname, pdata in data["profiles"].items():
        if not isinstance(pname, str) or not isinstance(pdata, dict):
            return False
    return True

def find_free_port(start_port=8080, max_tries=50):
    for port in range(start_port, start_port + max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port

def find_browser_app_executable():
    """Windows'ta Edge veya Chrome uygulama modunu destekleyen calistiriciyi bulur."""
    candidates = [
        # Microsoft Edge (Windows 10/11'de varsayilan kurulu)
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe"),
        # Google Chrome
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None

class QuietHandler(SimpleHTTPRequestHandler):
    extensions_map = SimpleHTTPRequestHandler.extensions_map.copy()
    extensions_map.update({
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.json': 'application/json',
        '.vert': 'text/plain',
        '.frag': 'text/plain',
        '.glsl': 'text/plain',
    })

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=APP_DIR, **kwargs)

    def log_message(self, format, *args):
        # Konsol ciktisini temiz tutmak icin HTTP erisim loglarini sustur
        pass

    def end_headers(self):
        # Cift Cache-Control basligini onlemek icin tamponu kontrol et
        headers_buf = getattr(self, '_headers_buffer', [])
        has_cache_control = any(h.lower().startswith(b'cache-control:') for h in headers_buf)
        if not has_cache_control:
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def _get_server_port(self):
        server_port = getattr(self.server, 'server_port', None)
        if not server_port and hasattr(self.server, 'server_address'):
            server_port = self.server.server_address[1]
        return server_port

    def _is_allowed_origin(self, origin):
        """Yalnizca sunucunun kendi kokenine (http://127.0.0.1:PORT veya http://localhost:PORT) izin verilir."""
        if not origin:
            return False
        server_port = self._get_server_port()
        allowed = set()
        if server_port:
            allowed.add(f"http://127.0.0.1:{server_port}")
            allowed.add(f"http://localhost:{server_port}")
            allowed.add(f"https://127.0.0.1:{server_port}")
            allowed.add(f"https://localhost:{server_port}")
        clean_origin = origin.strip().rstrip('/').lower()
        return clean_origin in {a.rstrip('/').lower() for a in allowed}

    def _validate_host_and_origin(self):
        """
        DNS Rebinding ve Cross-Origin guvenlik dogrulamasi:
        1. Host basligi: 127.0.0.1:PORT veya localhost:PORT olmali. Degilse 403.
        2. Origin basligi: Eger istekte Origin varsa ve sunucunun kendi kokeni degilse 403 ve istek ISLENMEZ.
        """
        server_port = self._get_server_port()
        allowed_hosts = set()
        if server_port:
            allowed_hosts.add(f"127.0.0.1:{server_port}")
            allowed_hosts.add(f"localhost:{server_port}")
        allowed_hosts.add("127.0.0.1")
        allowed_hosts.add("localhost")

        # 1. Host basligi kontrolu (DNS Rebinding korumasi)
        host = self.headers.get('Host', '').strip().lower()
        if not host or host not in allowed_hosts:
            self.send_response(403)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": "Forbidden: Invalid Host header"}).encode('utf-8'))
            return False

        # 2. Origin basligi kontrolu (istekte Origin varsa ve sunucu kokeni degilse 403)
        origin = self.headers.get('Origin')
        if origin and not self._is_allowed_origin(origin):
            self.send_response(403)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": "Forbidden: Untrusted Origin"}).encode('utf-8'))
            return False

        return True

    def _send_cors(self):
        """CORS: Yalnizca sunucunun kendi kokeni ise baslik eklenir."""
        origin = self.headers.get('Origin')
        if origin and self._is_allowed_origin(origin):
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Cache-Control')
            self.send_header('Vary', 'Origin')

    def do_OPTIONS(self):
        if not self._validate_host_and_origin():
            return
        clean_path = self.path.split('?')[0]
        if clean_path.startswith('/api/'):
            self.send_response(204)
            self._send_cors()
            self.end_headers()
        else:
            super().do_OPTIONS()

    def do_GET(self):
        if not self._validate_host_and_origin():
            return

        clean_path = self.path.split('?')[0]

        # Guvenlik: Servis edilen dizindeki noktali/gizli dosyalara erisimi engelle
        normalized_path = clean_path.replace('\\', '/')
        parts = normalized_path.strip('/').split('/')
        if any(part.startswith('.') for part in parts if part):
            self.send_response(404)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": "Not Found"}).encode('utf-8'))
            return

        if clean_path == '/api/save':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self._send_cors()
            self.end_headers()
            with SAVE_LOCK:
                if os.path.exists(SAVE_FILE):
                    try:
                        with open(SAVE_FILE, 'r', encoding='utf-8') as f:
                            saved_content = json.load(f)
                        payload = json.dumps({"status": "ok", "data": saved_content}, ensure_ascii=False)
                    except Exception as err:
                        payload = json.dumps({"status": "error", "message": str(err)}, ensure_ascii=False)
                else:
                    payload = json.dumps({"status": "ok", "data": None}, ensure_ascii=False)
            self.wfile.write(payload.encode('utf-8'))
        elif clean_path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "server": "Zortex Server 2.0"}).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if not self._validate_host_and_origin():
            return

        # 1. Content-Type kontrolu: application/json degilse 415
        content_type = self.headers.get('Content-Type', '')
        main_content_type = content_type.split(';')[0].strip().lower()
        if main_content_type != 'application/json':
            self.send_response(415)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self._send_cors()
            self.end_headers()
            resp = json.dumps({"status": "error", "message": "Unsupported Media Type: Content-Type must be application/json"})
            self.wfile.write(resp.encode('utf-8'))
            return

        clean_path = self.path.split('?')[0]
        if clean_path == '/api/save':

            # 2. Boyut kontrolu (en fazla 1 MB) -> 413
            content_length_str = self.headers.get('Content-Length')
            if content_length_str is not None:
                try:
                    content_length = int(content_length_str)
                except (ValueError, TypeError):
                    content_length = -1
            else:
                content_length = -1

            if content_length > MAX_BODY_SIZE:
                self.send_response(413)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self._send_cors()
                self.end_headers()
                resp = json.dumps({"status": "error", "message": "Payload Too Large: maximum allowed body size is 1MB"})
                self.wfile.write(resp.encode('utf-8'))
                return

            if content_length < 0:
                body = self.rfile.read(MAX_BODY_SIZE + 1)
            else:
                body = self.rfile.read(content_length)

            if len(body) > MAX_BODY_SIZE:
                self.send_response(413)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self._send_cors()
                self.end_headers()
                resp = json.dumps({"status": "error", "message": "Payload Too Large: maximum allowed body size is 1MB"})
                self.wfile.write(resp.encode('utf-8'))
                return

            # 2. Gecerli JSON kontrolu -> 400
            try:
                data = json.loads(body.decode('utf-8'))
            except Exception:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self._send_cors()
                self.end_headers()
                resp = json.dumps({"status": "error", "message": "Bad Request: Body is not valid JSON"})
                self.wfile.write(resp.encode('utf-8'))
                return

            # 3. Beklenen sema kontrolu -> 400
            if not is_valid_save_schema(data):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self._send_cors()
                self.end_headers()
                resp = json.dumps({"status": "error", "message": "Bad Request: Body does not match expected schema"})
                self.wfile.write(resp.encode('utf-8'))
                return

            # 4. Atomik kayit islemi
            try:
                os.makedirs(PROFILE_DIR, exist_ok=True)
                tmp_file = SAVE_FILE + ".tmp"
                with SAVE_LOCK:
                    with open(tmp_file, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
                    os.replace(tmp_file, SAVE_FILE)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self._send_cors()
                self.end_headers()
                resp = json.dumps({"status": "ok", "message": "Save successful", "timestamp": time.time()})
                self.wfile.write(resp.encode('utf-8'))
            except Exception as err:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self._send_cors()
                self.end_headers()
                resp = json.dumps({"status": "error", "message": str(err)})
                self.wfile.write(resp.encode('utf-8'))
        else:
            self.send_response(404)
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": "Not Found"}).encode('utf-8'))


def start_server(port):
    migrate_legacy_save()
    server = ThreadingHTTPServer(('127.0.0.1', port), QuietHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    return server

def main():
    os.chdir(APP_DIR)
    migrate_legacy_save()
    os.makedirs(PROFILE_DIR, exist_ok=True)
    port = find_free_port(8080)
    server = start_server(port)
    app_url = f"http://127.0.0.1:{port}/index.html"

    print("=" * 64)
    print("  [+] ZORTEX: CYBER SURVIVOR - DESKTOP EDITION (TURBO MOD)")
    print("  [*] Grafik Motoru: PixiJS v8 (WebGL GPU Donanim Hizlandirma)")
    print("  [*] Gamepad / Oyun Kolu Destegi: AKTIF")
    print(f"  [*] Yerel Cekirdek: {app_url}")
    print("=" * 64)

    no_browser = any(arg in sys.argv for arg in ['--no-browser', '--server-only', '-s'])
    if no_browser:
        print("  [*] Sunucu yalnizca arka planda calisiyor (tarayici baslatilmadi).")
        print(f"  [*] Tarayicinizdan baglanmak icin: {app_url}")
        print("  [*] Durdurmak icin CTRL+C basin.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
        print("\n  [x] Zortex kapatildi.")
        server.shutdown()
        return

    browser_exe = find_browser_app_executable()
    if browser_exe:
        browser_name = os.path.basename(browser_exe)
        print(f"  [>] Masaustu Turbo Uygulama Modu Baslatiliyor ({browser_name})...")
        app_args = [
            browser_exe,
            f"--app={app_url}",
            f"--user-data-dir={PROFILE_DIR}",
            "--window-size=1366,768",
            "--start-maximized",
            "--app-id=zortex_cyber_survivor",
            "--disable-infobars",
            "--disable-extensions",
            "--autoplay-policy=no-user-gesture-required",
            "--enable-gamepad-extensions",
            "--ignore-gpu-blocklist",
            "--enable-gpu-rasterization",
            "--enable-zero-copy",
            "--gpu-no-context-lost",
            "--high-dpi-support=1"
        ]
        try:
            proc = subprocess.Popen(app_args)
            print("  [OK] Oyun penceresi acildi!")
            print("  [*] Kapatmak icin oyun penceresini kapatin veya bu konsolda CTRL+C basin.")
            
            # Surec takibi: Eger ayrik profile ile baslatildiysa pencere kapanana kadar bekle
            time.sleep(1.0)
            if proc.poll() is None:
                proc.wait()
            else:
                # Eger mevcut tarayiciya handoff olduysa yerel sunucuyu acik tut
                while True:
                    time.sleep(1)
        except KeyboardInterrupt:
            pass
        except Exception as e:
            print(f"  [!] Standart tarayiciya yonlendiriliyor: {e}")
            webbrowser.open(app_url)
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                pass
    else:
        print("  [*] Standart tarayici aciliyor...")
        webbrowser.open(app_url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

    print("\n  [x] Zortex kapatildi.")
    server.shutdown()

if __name__ == "__main__":
    main()
