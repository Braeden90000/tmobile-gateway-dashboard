// Gateway Relay — runs on a machine that can reach the T-Mobile gateway.
// The dashboard server connects to this relay instead of the gateway directly.
// Usage: node relay.js
// Env vars:
//   GATEWAY_IP       — gateway IP (default: 192.168.12.1)
//   RELAY_PORT       — port to listen on (default: 3334)
//   RELAY_SECRET     — shared secret so only your dashboard server can use this

const http = require('http');

const GW = process.env.GATEWAY_IP || '192.168.12.1';
const PORT = process.env.RELAY_PORT || 3334;
const SECRET = process.env.RELAY_SECRET || '';

const server = http.createServer((req, res) => {
  // Check shared secret if set
  if (SECRET && req.headers['x-relay-secret'] !== SECRET) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  // Only proxy /TMI paths
  if (!req.url.startsWith('/TMI')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const options = {
    hostname: GW,
    port: 80,
    path: req.url,
    method: req.method,
    headers: {}
  };

  if (req.headers['content-type']) options.headers['Content-Type'] = req.headers['content-type'];
  if (req.headers['authorization']) options.headers['Authorization'] = req.headers['authorization'];
  options.headers['Accept'] = 'application/json';

  const proxy = http.request(options, (gwRes) => {
    const headers = { 'Content-Type': 'application/json' };
    res.writeHead(gwRes.statusCode, headers);
    gwRes.pipe(res);
  });

  proxy.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Gateway unreachable', message: e.message }));
  });

  req.pipe(proxy);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Gateway relay listening on 0.0.0.0:${PORT}`);
  console.log(`Proxying to gateway at ${GW}`);
});
