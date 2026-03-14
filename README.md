# T-Mobile 5G Gateway Dashboard

A real-time monitoring and configuration dashboard for T-Mobile 5G Home Internet gateways (Arcadyan TMO-G5AR and similar models). Replaces the limited stock web interface with a single-page NOC-style dashboard.

![Dashboard](https://img.shields.io/badge/status-active-00e676?style=flat-square) ![Node](https://img.shields.io/badge/node-18%2B-00d4ff?style=flat-square)

## Features

- **Real-time 5G signal monitoring** — RSRP, SINR, RSRQ, RSSI with color-coded quality ratings
- **Rolling signal history chart** — 5-minute canvas chart tracking signal changes
- **Cell tower info** — GPS coordinates, gNB ID, Cell ID, ECGI, CQI
- **Gateway details** — uptime, firmware, MAC, SIM/IMEI info
- **WiFi configuration** — edit SSID, password, encryption, toggle radio bands (2.4/5/6 GHz)
- **Connected clients** — all devices with IP, MAC, signal strength, online/offline status
- **Gateway reboot** — one-click remote reboot
- **Password-protected** — login page with session cookies so you can expose it on a network safely
- **Auto-refresh** — polls the gateway every 5 seconds

## Requirements

- **Node.js** 18+
- **T-Mobile 5G Home Internet gateway** (tested on Arcadyan TMO-G5AR, should work on similar models using the `/TMI/v1/` API)
- The machine running this dashboard must be on the same network as the gateway (or able to reach `192.168.12.1`)

## Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/tmobile-gateway-dashboard.git
cd tmobile-gateway-dashboard

# Install dependencies
npm install

# Copy the example env file and fill in your passwords
cp .env.example .env
```

Edit `.env` with your values:

```env
# Password you'll use to log into the dashboard
DASHBOARD_PASSWORD=your_dashboard_password

# Admin password from the bottom of your T-Mobile gateway
GATEWAY_PASSWORD=your_gateway_admin_password
```

## Running

```bash
# With .env file (install dotenv or export manually)
export $(cat .env | xargs) && node server.js

# Or set env vars inline
DASHBOARD_PASSWORD=mypass GATEWAY_PASSWORD=gwpass node server.js

# Or on Windows (PowerShell)
$env:DASHBOARD_PASSWORD="mypass"; $env:GATEWAY_PASSWORD="gwpass"; node server.js
```

Open **http://localhost:3333** in your browser.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DASHBOARD_PASSWORD` | Yes | `admin` | Password for the web dashboard login |
| `GATEWAY_PASSWORD` | Yes | — | Admin password printed on the bottom of your gateway |
| `GATEWAY_IP` | No | `192.168.12.1` | IP address of your T-Mobile gateway |
| `PORT` | No | `3333` | Port the dashboard server listens on |

## Running with PM2 (recommended for always-on)

```bash
npm install -g pm2

# Start with env vars
DASHBOARD_PASSWORD=mypass GATEWAY_PASSWORD=gwpass pm2 start server.js --name tmobile-dash

# Auto-start on boot
pm2 save
pm2 startup
```

## Gateway API Endpoints

These are the T-Mobile gateway endpoints this dashboard uses:

| Endpoint | Auth | Description |
|---|---|---|
| `GET /TMI/v1/gateway?get=all` | No | Device info, signal, uptime |
| `GET /TMI/v1/gateway?get=signal` | No | 5G signal metrics |
| `GET /TMI/v1/version` | No | API version |
| `POST /TMI/v1/auth/login` | No | Get auth token |
| `GET /TMI/v1/network/telemetry?get=all` | Yes | GPS, clients, SIM, CQI |
| `GET /TMI/v1/network/configuration/v2?get=ap` | Yes | WiFi config |
| `POST /TMI/v1/network/configuration/v2?set=ap` | Yes | Update WiFi config |
| `POST /TMI/v1/gateway/reset?set=reboot` | Yes | Reboot gateway |

## Compatibility

Tested on:
- **Arcadyan TMO-G5AR** (firmware 1.00.02)

Should also work on other T-Mobile Home Internet gateways that use the `/TMI/v1/` API (Arcadyan KVD21, etc.). Nokia/Sagemcom gateways use a different API and are not supported.

## License

MIT
