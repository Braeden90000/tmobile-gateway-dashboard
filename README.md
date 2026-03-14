# T-Mobile 5G Gateway Dashboard

A full-featured monitoring and configuration dashboard for T-Mobile 5G Home Internet gateways. Built as a replacement for the stock web interface, with real-time signal analytics, WiFi management, speed testing, and more.

Tested on the **Arcadyan TMO-G5AR** — should work on other T-Mobile gateways using the `/TMI/v1/` API.

---

## Screenshots

### Signal Monitor
Real-time 5G signal quality gauge, RSRP/SINR/RSRQ/RSSI metrics, rolling signal history chart, and gateway latency monitor.

![Signal Monitor](https://cdn.ix9.ca/f/6GCGYoaV.png)

### WiFi Network Configuration
Edit your primary SSID, password, encryption, and radio band toggles. Full SSID manager supports up to 4 networks with per-band assignment and guest isolation.

![Network Config](https://cdn.ix9.ca/f/3-DNLC8W.png)

### Connected Clients
Live table of all connected devices across ethernet, WiFi 2.4/5/6 GHz — with IP, MAC, signal strength, and online/offline status. Alerts when new devices join.

![Connected Clients](https://cdn.ix9.ca/f/rfx3_BHE.png)

### Speed Test
15-second multi-stream download test via Cloudflare CDN with live-updating gauge, latency measurement, and test history.

![Speed Test](https://cdn.ix9.ca/f/G9cG4N8E.png)

### System Info
Cell tower details with clickable GPS coordinates (opens Google Maps), gateway hardware info, SIM/IMEI details, uptime, and remote reboot.

![System Info](https://cdn.ix9.ca/f/qBNaw5lQ.png)

---

## Features

**Monitoring**
- Real-time 5G signal metrics (RSRP, SINR, RSRQ, RSSI) with color-coded quality ratings
- Animated signal quality gauge with gradient arc
- Rolling 5-minute signal history chart with CSV export
- Continuous gateway latency monitor (ping graph)
- Cell tower info — gNB ID, Cell ID, ECGI, CQI, GPS coordinates
- New device connection alerts

**WiFi Management**
- Edit SSID name, password, encryption mode (WPA2/WPA3)
- Toggle radio bands independently (2.4 GHz, 5 GHz, 6 GHz WiFi 6E)
- SSID band steering — assign each SSID to specific frequencies
- **Multi-SSID support** — up to 4 SSIDs with individual band assignments
- **Guest network isolation** — create isolated guest SSIDs
- Split-band SSIDs — separate names for 2.4/5/6 GHz

**Speed Test**
- 15-second sustained download test using 4 parallel streams
- Cloudflare CDN endpoints for accurate throughput measurement
- Live-updating speed gauge during test
- Gateway latency measurement (5-ping average, drops worst)
- Test history with timestamps

**System**
- Gateway hardware details (model, firmware, MAC)
- SIM card info (IMEI, ICCID, MSISDN, status)
- Uptime tracking
- Cell tower GPS with Google Maps link
- One-click remote gateway reboot

**Security**
- Password-protected dashboard with session cookies (7-day expiry)
- Gateway admin password stored as environment variable (never in code)
- Logout support

**Design**
- Glass morphism + terminal aesthetic with animated gradient mesh background
- Sidebar navigation with 5 pages
- Frosted glass cards with monospace typography (JetBrains Mono)
- Responsive — works on desktop and mobile

---

## Requirements

- **Node.js** 18 or higher
- **T-Mobile 5G Home Internet gateway** on the same network
- Gateway admin password (printed on the bottom of the device)

---

## Quick Start

```bash
git clone https://github.com/Braeden90000/tmobile-gateway-dashboard.git
cd tmobile-gateway-dashboard
npm install
```

### Set environment variables and run

**Linux / macOS:**
```bash
DASHBOARD_PASSWORD=your_login_password \
GATEWAY_PASSWORD=your_gateway_admin_password \
node server.js
```

**Windows PowerShell:**
```powershell
$env:DASHBOARD_PASSWORD="your_login_password"
$env:GATEWAY_PASSWORD="your_gateway_admin_password"
node server.js
```

**Windows CMD:**
```cmd
set DASHBOARD_PASSWORD=your_login_password && set GATEWAY_PASSWORD=your_gateway_admin_password && node server.js
```

Then open **http://localhost:3333** and log in with your dashboard password.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DASHBOARD_PASSWORD` | Yes | `admin` | Password to log into the web dashboard |
| `GATEWAY_PASSWORD` | Yes | — | Admin password from the bottom of your T-Mobile gateway |
| `GATEWAY_IP` | No | `192.168.12.1` | IP address of your gateway |
| `PORT` | No | `3333` | Port the dashboard runs on |

---

## Running 24/7 with PM2

```bash
npm install -g pm2

DASHBOARD_PASSWORD=mypass GATEWAY_PASSWORD=gwpass pm2 start server.js --name tmobile-dash

# Auto-start on system boot
pm2 save
pm2 startup
```

---

## Architecture

```
Browser  →  Express Server (localhost:3333)  →  T-Mobile Gateway (192.168.12.1)
                 │                                        │
                 ├── /login (dashboard auth)               ├── /TMI/v1/gateway?get=all (no auth)
                 ├── /api/config (serves GW password)      ├── /TMI/v1/auth/login (get JWT)
                 ├── /TMI/* (proxy to gateway)             ├── /TMI/v1/network/telemetry?get=all
                 └── /public/* (static frontend)           ├── /TMI/v1/network/configuration/v2
                                                           └── /TMI/v1/gateway/reset?set=reboot
```

The Express server proxies all `/TMI/*` requests to the gateway, so the browser never talks to `192.168.12.1` directly. Dashboard authentication is handled via session cookies. Gateway authentication uses JWT tokens obtained from the gateway's login endpoint.

---

## Gateway API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/TMI/v1/gateway?get=all` | GET | No | Device info, signal metrics, uptime |
| `/TMI/v1/gateway?get=signal` | GET | No | 5G signal data only |
| `/TMI/v1/gateway?get=device` | GET | No | Hardware info only |
| `/TMI/v1/gateway?get=time` | GET | No | Uptime and timezone |
| `/TMI/v1/version` | GET | No | API version |
| `/TMI/v1/auth/login` | POST | No | Authenticate, returns JWT |
| `/TMI/v1/network/telemetry?get=all` | GET | Bearer | GPS, connected clients, SIM, CQI, ECGI |
| `/TMI/v1/network/configuration/v2?get=ap` | GET | Bearer | WiFi SSID/radio configuration |
| `/TMI/v1/network/configuration/v2?set=ap` | POST | Bearer | Update WiFi configuration |
| `/TMI/v1/gateway/reset?set=reboot` | POST | Bearer | Reboot the gateway |

### SSID Limits

- **Maximum 4 SSIDs** (firmware enforced)
- Each SSID can be assigned to any combination of 2.4/5/6 GHz bands
- 6 GHz band forces WPA3 encryption automatically
- SSIDs can be flagged as `guest: true` for network isolation

---

## Compatibility

| Gateway | Status |
|---|---|
| Arcadyan TMO-G5AR | Tested, fully working |
| Arcadyan KVD21 | Should work (same API) |
| Nokia / Sagemcom | Not supported (different API) |

---

## License

MIT
