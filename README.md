<h1> NexusWAF</h1>

<p>
A modern Web Application Firewall (WAF) with a React-based dashboard for real-time monitoring, configuration, and security event management.
</p>

<hr />

<h2>🚀 Features</h2>
<ul>
  <li><b>WAF Proxy</b>: Intercepts and filters HTTP requests for SQLi, XSS, SSRF, and path traversal attacks.</li>
  <li><b>IP Banning</b>: Automatic and manual IP banning with persistent storage.</li>
  <li><b>Rate Limiting</b>: Protects against request floods and abuse.</li>
  <li><b>REST API</b>: Control and monitor the WAF via a Flask-based API.</li>
  <li><b>Dashboard</b>: React/TypeScript dashboard for live stats, logs, and configuration.</li>
  <li><b>Extensible</b>: Easily add new detection rules or integrate with other systems.</li>
</ul>

<hr />

<h2>🛡️ Protected Attacks</h2>
<ul>
  <li><b>SQL Injection (SQLi)</b>: Detects and blocks malicious SQL queries</li>
  <li><b>Cross-Site Scripting (XSS)</b>: Prevents script injection attacks</li>
  <li><b>Server-Side Request Forgery (SSRF)</b>: Blocks unauthorized server requests</li>
  <li><b>Path Traversal</b>: Prevents directory traversal attacks</li>
  <li><b>Rate Limiting</b>: Protects against DDoS and brute force attacks</li>
</ul>

<hr />

<h2>📁 Project Structure</h2>
<pre>
waf/
  backend_app.py         # (Optional) Flask backend app
  waf_proxy.py           # Main WAF proxy server
  waf_control_api.py     # REST API for WAF control
  flood.py               # (Utility) Flood testing script
  loop.py                # (Utility) Automation script
  banned_ips.json        # Persistent banned IPs
  requirements.txt       # Python dependencies
  dashboard/             # React dashboard (frontend)
</pre>

<hr />

<h2>🚀 Getting Started</h2>

<h3>1. Backend (Python WAF)</h3>
<b>Prerequisites</b>
<ul>
  <li>Python 3.8+</li>
  <li>pip</li>
</ul>

<b>Install dependencies</b>

<pre><code>pip install -r requirements.txt</code></pre>

<b>Run the WAF Proxy</b>

<pre><code>python waf_proxy.py</code></pre>

<b>Run the Control API (optional, for dashboard integration)</b>

<pre><code>python waf_control_api.py</code></pre>

<hr />

<h3>2. Frontend (Dashboard)</h3>
<b>Prerequisites</b>
<ul>
  <li>Node.js (v18+ recommended)</li>
  <li>npm</li>
</ul>

<b>Install dependencies</b>

<pre><code>cd dashboard
npm install</code></pre>

<b>Start the development server</b>

<pre><code>npm run dev</code></pre>

<p>
The dashboard will be available at <a href="http://localhost:5173">http://localhost:5173</a>.
</p>

<hr />

<h2>📖 Usage</h2>
<ul>
  <li>Access the dashboard to view WAF status, logs, banned IPs, and configuration.</li>
  <li>The WAF proxy listens on port 8080 by default and forwards requests to your backend.</li>
  <li>Security events (SQLi, XSS, SSRF, etc.) are logged and can trigger IP bans.</li>
</ul>

<hr />

<h2>💻 Development</h2>
<ul>
  <li><b>Backend</b>: Python (Flask, requests, colorama, etc.)</li>
  <li><b>Frontend</b>: React, TypeScript, TailwindCSS, Vite</li>
</ul>

<hr />

<h2>👨‍💻 Author</h2>
<p>Built with ❤️ by the Saad Sai El Haq</p>

<hr />

<h2>🤝 Contributing</h2>
<p>Contributions are welcome! Please feel free to submit a Pull Request.</p>

<hr />
