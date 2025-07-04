import re
import os
import json
import time
import threading
import socket
from typing import Dict, List, Set
from urllib.parse import unquote, urlparse
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime

import requests
from colorama import Fore, Style, init

from flask import Flask, Response, request as flask_request
from flask_cors import CORS

init(autoreset=True)

if os.name == 'nt':
    os.system('cls')
else:
    os.system('clear')

class Config:
    WAF_PORT = 8080
    BACKEND_URL = "http://localhost:8000"
    BANNED_IPS_FILE = "banned_ips.json"
    LOG_FILE = "waf_access.log"

    MAX_REQUESTS = 100
    TIME_WINDOW = 60
    MAX_VIOLATIONS = 3
    VIOLATION_WINDOW = 300

    SQL_PATTERNS = [
        r"(?i)\bunion\s+select\b",
        r"(?i)\bor\s+\d+\s*=\s*\d+",
        r"(?i)\band\s+\d+\s*=\s*\d+",
        r"(?i)\bdrop\s+table\b",
        r"(?i)\bdelete\s+from\b",
        r"(?i)\binsert\s+into\b",
        r"(?i)\bupdate\s+.*\bset\b",
        r"(?i)\bexec\s+xp_",
        r"(?i)\bwaitfor\s+delay\b",
        r"(?i)\bbenchmark\s*\(",
        r"(?i)\bsleep\s*\(",
        r"(?i)\bpg_sleep\s*\(",
        r"(?i)\bselect\s+.*\bfrom\s+information_schema",
        r"(?i)\bselect\s+.*\bfrom\s+sys\.",
        r"(?i)\bselect\s+.*\bfrom\s+mysql\.",
        r"(?i)\bselect\s+.*\bfrom\s+pg_",
        r"(?i)'\s*or\s+1\s*=\s*1\s*--",
        r"(?i)'\s*or\s+1\s*=\s*1\s*#",
        r"(?i)'\s*or\s+'[^']*'\s*=\s*'[^']*",
        r"(?i)'\s*and\s+1\s*=\s*2\s*--",
        r"(?i)'\s*union\s+select",
        r"(?i)%27\s*or\s+1%3d1",
        r"(?i)%27\s*union\s+select",
        r"(?i)\|\|\s*'[^']*'\s*=\s*'[^']*'",
    ]

    XSS_PATTERNS = [
        r"(?i)<script[^>]*>.*?</script[^>]*>",
        r"(?i)<script[^>]*>",
        r"(?i)javascript\s*:",
        r"(?i)on\w+\s*=\s*[\"'][^\"']*[\"']",
        r"(?i)on\w+\s*=\s*[^>\s]+",
        r"(?i)<iframe[^>]*>",
        r"(?i)<object[^>]*>",
        r"(?i)<embed[^>]*>",
        r"(?i)<applet[^>]*>",
        r"(?i)expression\s*\(",
        r"(?i)vbscript\s*:",
        r"(?i)<img[^>]*onerror[^>]*>",
        r"(?i)<svg[^>]*onload[^>]*>",
        r"(?i)alert\s*\(",
        r"(?i)confirm\s*\(",
        r"(?i)prompt\s*\(",
        r"(?i)document\.cookie",
        r"(?i)document\.write",
        r"(?i)eval\s*\(",
        r"(?i)<\s*\w+[^>]*on\w+[^>]*>",
    ]

    PRIVATE_IP_PATTERNS = [
        r"^127\.",
        r"^localhost$",
        r"^169\.254\.",
        r"^10\.",
        r"^192\.168\.",
        r"^172\.(1[6-9]|2[0-9]|3[0-1])\.",
        r"^0\.",
        r"^::1$",
        r"^fc00:",
        r"^fe80:",
    ]

class SecurityDetector:
    @staticmethod
    def detect_sql_injection(data: str) -> bool:
        return any(re.search(p, data, re.IGNORECASE | re.MULTILINE) for p in Config.SQL_PATTERNS)

    @staticmethod
    def detect_xss(data: str) -> bool:
        return any(re.search(p, data, re.IGNORECASE | re.MULTILINE) for p in Config.XSS_PATTERNS)

    @staticmethod
    def detect_path_traversal(path: str) -> bool:
        patterns = [r"\.\.[\\/]|%2e%2e|etc[\\/]passwd|windows[\\/]system32|boot\.ini|win\.ini"]
        return any(re.search(p, path, re.IGNORECASE) for p in patterns)

    @staticmethod
    def detect_ssrf(request_data: str) -> bool:
        url_patterns = [
            r"https?://[^\s\"'<>]+",
            r"url\s*=\s*[\"']?([^\"'\s<>]+)[\"']?",
            r"target\s*=\s*[\"']?([^\"'\s<>]+)[\"']?",
            r"host\s*=\s*[\"']?([^\"'\s<>]+)[\"']?",
            r"server\s*=\s*[\"']?([^\"'\s<>]+)[\"']?",
        ]
        
        for pattern in url_patterns:
            matches = re.findall(pattern, request_data, re.IGNORECASE)
            for match in matches:
                url = match if isinstance(match, str) else match[0] if match else ""
                if url and SecurityDetector._is_private_target(url):
                    return True
        return False

    @staticmethod
    def _is_private_target(target: str) -> bool:
        try:
            if not target.startswith(('http://', 'https://')):
                target = 'http://' + target
            
            parsed = urlparse(target)
            hostname = parsed.hostname
            
            if not hostname:
                return True
            
            try:
                ip = socket.gethostbyname(hostname)
            except socket.gaierror:
                return True
            
            for pattern in Config.PRIVATE_IP_PATTERNS:
                if re.match(pattern, ip):
                    return True
                if re.match(pattern, hostname):
                    return True
            
            return False
        except:
            return True

class IPManager:
    def __init__(self):
        self.banned_ips: Set[str] = set()
        self.banned_ips_lock = threading.Lock()
        self.request_log: Dict[str, List[float]] = {}
        self.rate_limit_lock = threading.Lock()
        self.violations: Dict[str, List[float]] = {}
        self.violations_lock = threading.Lock()

    def load_banned_ips(self):
        try:
            with open(Config.BANNED_IPS_FILE, "r") as f:
                self.banned_ips = set(json.load(f))
        except:
            self.banned_ips.clear()

    def save_banned_ips(self):
        with open(Config.BANNED_IPS_FILE, "w") as f:
            json.dump(list(self.banned_ips), f)

    def is_banned(self, ip):
        return ip in self.banned_ips

    def ban_ip(self, ip):
        with self.banned_ips_lock:
            self.banned_ips.add(ip)
            self.save_banned_ips()

    def unban_ip(self, ip):
        with self.banned_ips_lock:
            self.banned_ips.discard(ip)
            self.save_banned_ips()

    def is_rate_limited(self, ip):
        now = time.time()
        with self.rate_limit_lock:
            timestamps = self.request_log.get(ip, [])
            timestamps = [ts for ts in timestamps if now - ts < Config.TIME_WINDOW]
            if len(timestamps) >= Config.MAX_REQUESTS:
                self.request_log[ip] = timestamps
                return True
            timestamps.append(now)
            self.request_log[ip] = timestamps
            return False

    def record_violation(self, ip):
        now = time.time()
        with self.violations_lock:
            timestamps = self.violations.get(ip, [])
            timestamps = [ts for ts in timestamps if now - ts < Config.VIOLATION_WINDOW]
            timestamps.append(now)
            self.violations[ip] = timestamps
            
            if len(timestamps) >= Config.MAX_VIOLATIONS:
                self.ban_ip(ip)
                return True
            return False

class Logger:
    @staticmethod
    def log_security_event(event_type: str, ip: str, details: str = ""):
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "type": "security_event",
            "event_type": event_type,
            "client_ip": ip,
            "details": details
        }
        
        print(f"{Fore.RED}[{timestamp}] [{event_type}] {ip} - {details}{Style.RESET_ALL}")
        
        try:
            with open(Config.LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception as e:
            print(f"{Fore.YELLOW}[LOGGING_ERROR] Failed to write to log file: {e}{Style.RESET_ALL}")

    @staticmethod
    def log_ban_event(ip: str, reason: str = ""):
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "type": "ban_event",
            "client_ip": ip,
            "reason": reason
        }
        
        print(f"{Fore.MAGENTA}[{timestamp}] [IP_BANNED] {ip} - {reason}{Style.RESET_ALL}")
        
        try:
            with open(Config.LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception as e:
            print(f"{Fore.YELLOW}[LOGGING_ERROR] Failed to write to log file: {e}{Style.RESET_ALL}")

    @staticmethod
    def log_access(ip: str, method: str, path: str, status: int):
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "type": "access_log",
            "client_ip": ip,
            "method": method,
            "path": path,
            "status": status
        }
        
        color = Fore.GREEN if status < 400 else Fore.RED
        print(f"{color}[{timestamp}] [ACCESS] {ip} {method} {path} - {status}{Style.RESET_ALL}")
        
        try:
            with open(Config.LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception as e:
            print(f"{Fore.YELLOW}[LOGGING_ERROR] Failed to write to log file: {e}{Style.RESET_ALL}")

    @staticmethod
    def get_recent_logs(limit=50):
        try:
            with open(Config.LOG_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()[-limit:]
                return [json.loads(line) for line in lines]
        except:
            return []

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

from werkzeug.serving import make_server

class WAFHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, ip_manager: IPManager, **kwargs):
        self.ip_manager = ip_manager
        self.detector = SecurityDetector()
        self.logger = Logger()
        super().__init__(*args, **kwargs)

    def do_GET(self): self.handle_request()
    def do_POST(self): self.handle_request()
    def do_PUT(self): self.handle_request()
    def do_DELETE(self): self.handle_request()
    def do_PATCH(self): self.handle_request()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def handle_request(self):
        client_ip = self.client_address[0]

        if self.path.startswith("/admin"):
            if self.path == "/admin/stats":
                banned_ips_list = list(self.ip_manager.banned_ips)
                self.send_json({
                    "rate_limit": {
                        "max": Config.MAX_REQUESTS,
                        "window": Config.TIME_WINDOW
                    },
                    "bannedIPs": banned_ips_list,
                    "totalBannedIPs": len(banned_ips_list)
                })
                return
            elif self.path == "/admin/logs":
                raw_logs = Logger.get_recent_logs()
                logs = []
                for entry in raw_logs:
                    log_type = entry.get("type")
                    if log_type == "security_event":
                        logs.append({
                            "timestamp": entry.get("timestamp"),
                            "ip": entry.get("client_ip"),
                            "eventType": entry.get("event_type"),
                            "details": entry.get("details", "")
                        })
                    elif log_type == "ban_event":
                        logs.append({
                            "timestamp": entry.get("timestamp"),
                            "ip": entry.get("client_ip"),
                            "eventType": "IP_BANNED",
                            "details": entry.get("reason", "")
                        })
                self.send_json(logs)
                return
            elif self.path.startswith("/admin/unban"):
                ip = self.path.split("/")[-1]
                self.ip_manager.unban_ip(ip)
                self.send_json({"status": "unbanned", "ip": ip})
                return
            elif self.path.startswith("/admin/ban"):
                ip = self.path.split("/")[-1]
                self.ip_manager.ban_ip(ip)
                self.send_json({"status": "banned", "ip": ip})
                return
            elif self.path == "/admin/config" and self.command == "GET":
                try:
                    with open("waf_config.json", "r") as f:
                        config_data = json.load(f)
                except Exception:
                    config_data = {
                        "maxRequests": Config.MAX_REQUESTS,
                        "timeWindow": Config.TIME_WINDOW,
                        "banDuration": getattr(Config, "BAN_DURATION", 10),
                        "backendUrl": Config.BACKEND_URL
                    }
                self.send_json(config_data)
                return
            elif self.path == "/admin/config" and self.command == "POST":
                content_length = int(self.headers.get('Content-Length', 0))
                body_bytes = self.rfile.read(content_length) if content_length > 0 else b''
                try:
                    config_data = json.loads(body_bytes.decode())
                    Config.MAX_REQUESTS = config_data.get("maxRequests", Config.MAX_REQUESTS)
                    Config.TIME_WINDOW = config_data.get("timeWindow", Config.TIME_WINDOW)
                    setattr(Config, "BAN_DURATION", config_data.get("banDuration", getattr(Config, "BAN_DURATION", 10)))
                    Config.BACKEND_URL = config_data.get("backendUrl", Config.BACKEND_URL)
                    with open("waf_config.json", "w") as f:
                        json.dump(config_data, f)
                    self.send_json({"status": "success", "config": config_data})
                except Exception as e:
                    self.send_error_response(400, f"Invalid config: {e}")
                return

        if self.ip_manager.is_banned(client_ip):
            self.logger.log_access(client_ip, self.command, self.path, 403)
            self.send_error_response(403, "Your IP is banned")
            return

        if self.ip_manager.is_rate_limited(client_ip):
            self.logger.log_security_event("RATE_LIMIT", client_ip, f"Exceeded {Config.MAX_REQUESTS} requests in {Config.TIME_WINDOW}s")
            self.logger.log_access(client_ip, self.command, self.path, 429)
            self.send_error_response(429, "Too many requests")
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b''
        body = body_bytes.decode(errors='ignore')
        decoded_path = unquote(self.path)
        combined = f"{decoded_path} {body}"

        if self.detector.detect_xss(combined):
            self.logger.log_security_event("XSS", client_ip, combined[:100])
            auto_banned = self.ip_manager.record_violation(client_ip)
            if auto_banned:
                self.logger.log_ban_event(client_ip, "Automatic ban after 3 security violations")
            self.logger.log_access(client_ip, self.command, self.path, 403)
            self.send_error_response(403, "XSS attack detected")
            return

        if self.detector.detect_path_traversal(decoded_path):
            self.logger.log_security_event("PATH_TRAVERSAL", client_ip, decoded_path)
            auto_banned = self.ip_manager.record_violation(client_ip)
            if auto_banned:
                self.logger.log_ban_event(client_ip, "Automatic ban after 3 security violations")
            self.logger.log_access(client_ip, self.command, self.path, 403)
            self.send_error_response(403, "Path traversal detected")
            return

        if self.detector.detect_sql_injection(combined):
            self.logger.log_security_event("SQL_INJECTION", client_ip, combined[:100])
            auto_banned = self.ip_manager.record_violation(client_ip)
            if auto_banned:
                self.logger.log_ban_event(client_ip, "Automatic ban after 3 security violations")
            self.logger.log_access(client_ip, self.command, self.path, 403)
            self.send_error_response(403, "SQL injection detected")
            return

        if self.detector.detect_ssrf(combined):
            self.logger.log_security_event("SSRF", client_ip, combined[:100])
            auto_banned = self.ip_manager.record_violation(client_ip)
            if auto_banned:
                self.logger.log_ban_event(client_ip, "Automatic ban after 3 security violations")
            self.logger.log_access(client_ip, self.command, self.path, 403)
            self.send_error_response(403, "SSRF attack detected")
            return

        self.forward_request(body_bytes)

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:5173')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Max-Age', '86400')

    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Permissions-Policy', 'geolocation=(), microphone=()')
        self.send_header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message, "status": code}).encode())

    def send_json(self, data):
        self.send_response(200)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def forward_request(self, body_bytes):
        client_ip = self.client_address[0]
        target_url = Config.BACKEND_URL + self.path
        
        try:
            headers = {k: v for k, v in self.headers.items() if k.lower() not in ["connection"]}
            response = requests.request(
                method=self.command,
                url=target_url,
                headers=headers,
                data=body_bytes,
                timeout=10
            )
            self.send_response(response.status_code)
            for h, v in response.headers.items():
                if h.lower() not in ['transfer-encoding', 'connection']:
                    self.send_header(h, v)
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('X-Frame-Options', 'DENY')
            self.send_header('Referrer-Policy', 'no-referrer')
            self.send_header('Permissions-Policy', 'geolocation=(), microphone=()')
            self.send_header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(response.content)
            
            self.logger.log_access(client_ip, self.command, self.path, response.status_code)
        except Exception as e:
            self.logger.log_security_event("FORWARD_ERROR", client_ip, str(e))
            self.logger.log_access(client_ip, self.command, self.path, 502)
            self.send_error_response(502, "Error forwarding request")

def create_handler(ip_manager):
    def handler(*args, **kwargs):
        return WAFHandler(*args, ip_manager=ip_manager, **kwargs)
    return handler

def run_waf_server():
    ip_manager = IPManager()
    ip_manager.load_banned_ips()
    server = HTTPServer(('', Config.WAF_PORT), create_handler(ip_manager))
    print(f"NexusWAF running on port {Config.WAF_PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Shutting down...")
        server.server_close()
        ip_manager.save_banned_ips()

@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def waf_proxy(path):
    return Response("NexusWAF is running", status=200)

def main():
    run_waf_server()

if __name__ == '__main__':
    main()