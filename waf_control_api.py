from flask import Flask, jsonify
import subprocess
import signal
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

waf_process = None
waf_command = ["python", "waf_proxy.py"]

@app.route("/start", methods=["POST"])
def start_waf():
    global waf_process
    if waf_process is None or waf_process.poll() is not None:
        waf_process = subprocess.Popen(waf_command)
        return jsonify({"status": "started"}), 200
    return jsonify({"status": "already running"}), 409

@app.route("/stop", methods=["POST"])
def stop_waf():
    global waf_process
    if waf_process and waf_process.poll() is None:
        waf_process.terminate()
        waf_process.wait()
        waf_process = None
        return jsonify({"status": "stopped"}), 200
    return jsonify({"status": "not running"}), 409

@app.route("/restart", methods=["POST"])
def restart_waf():
    stop_waf()
    return start_waf()

@app.route("/status", methods=["GET"])
def status():
    if waf_process and waf_process.poll() is None:
        return jsonify({"running": True}), 200
    return jsonify({"running": False}), 200

if __name__ == "__main__":
    app.run(port=9000)
