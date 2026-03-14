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
- **Password-protected** — login page with session cookies so you can expose it publicly
- **Auto-refresh** — polls the gateway every 5 seconds
- **Relay mode** — host the dashboard on a different network and tunnel API calls through a relay

## Requirements

- **Node.js** 18+
- **T-Mobile 5G Home Internet gateway** (tested on Arcadyan TMO-G5AR, should work on similar models using the `/TMI/v1/` API)

## Installation

```bash
git clone https://github.com/Braeden90000/tmobile-gateway-dashboard.git
cd tmobile-gateway-dashboard
npm install
cp .env.example .env
```

Edit `.env` with your values:

```env
DASHBOARD_PASSWORD=your_dashboard_password
GATEWAY_PASSWORD=your_gateway_admin_password
```

## Running (Same Network)

If the dashboard server is on the **same network** as your T-Mobile gateway:

```bash
# Linux/Mac
export $(cat .env | xargs) && node server.js

# Windows (PowerShell)
$env:DASHBOARD_PASSWORD="mypass"; $env:GATEWAY_PASSWORD="gwpass"; node server.js
```

Open **http://localhost:3333** in your browser.

## Running (Different Network — Relay Mode)

If your dashboard server is on a **different network** than the gateway (e.g. hosting it on another server), you need to run a small relay on a machine that CAN reach the gateway.

### Setup

**Step 1 — Start the relay** on a machine connected to the T-Mobile gateway's network:

```bash
git clone https://github.com/Braeden90000/tmobile-gateway-dashboard.git
cd tmobile-gateway-dashboard

# Set a shared secret so only your dashboard can use the relay
# RELAY_PORT defaults to 3334
RELAY_SECRET=your_secret_here node relay.js
```

**Step 2 — Point your dashboard server at the relay** instead of the gateway directly:

```bash
# GATEWAY_IP is the relay machine's IP:port (not the gateway IP)
DASHBOARD_PASSWORD=mypass \
GATEWAY_PASSWORD=gwpass \
GATEWAY_IP=10.x.x.x:3334 \
RELAY_SECRET=your_secret_here \
node server.js
```

That's it. The dashboard server talks to the relay, the relay forwards to the gateway.

### How it works

```
[Browser] → [Dashboard Server (any network)] → [Relay (gateway network)] → [T-Mobile Gateway 192.168.12.1]
```

The relay is a tiny Node.js proxy (~50 lines) that runs on any machine connected to the T-Mobile network. It forwards `/TMI/*` API calls to the gateway and returns the responses.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DASHBOARD_PASSWORD` | Yes | `admin` | Password for the web dashboard login |
| `GATEWAY_PASSWORD` | Yes | — | Admin password printed on the bottom of your gateway |
| `GATEWAY_IP` | No | `192.168.12.1` | Gateway IP directly, or relay address as `ip:port` |
| `RELAY_SECRET` | No | — | Shared secret between dashboard and relay |
| `PORT` | No | `3333` | Dashboard server port |

### Relay-only env vars

| Variable | Default | Description |
|---|---|---|
| `GATEWAY_IP` | `192.168.12.1` | Gateway IP (from relay's perspective) |
| `RELAY_PORT` | `3334` | Port the relay listens on |
| `RELAY_SECRET` | — | Shared secret (must match dashboard server) |

## Running with PM2 (recommended for always-on)

```bash
npm install -g pm2

# Dashboard server
DASHBOARD_PASSWORD=mypass GATEWAY_PASSWORD=gwpass GATEWAY_IP=10.x.x.x:3334 RELAY_SECRET=mysecret \
  pm2 start server.js --name tmobile-dash

# Relay (on the gateway network machine)
RELAY_SECRET=mysecret pm2 start relay.js --name tmobile-relay

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
