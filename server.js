const express = require('express');
const crypto = require('crypto');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const GW = process.env.GATEWAY_IP || '192.168.12.1';
const DASH_PASS = process.env.DASHBOARD_PASSWORD || 'admin';
const GW_PASS = process.env.GATEWAY_PASSWORD || '';
const SESSION_SECRET = crypto.randomBytes(32).toString('hex');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

function makeToken() {
  const payload = Date.now().toString();
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex') + '.' + payload;
}

function verifyToken(token) {
  if (!token) return false;
  const [sig, payload] = token.split('.');
  if (!sig || !payload) return false;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  if (sig !== expected) return false;
  const age = Date.now() - parseInt(payload, 10);
  return age < 7 * 24 * 60 * 60 * 1000; // 7 days
}

// Login page
app.get('/login', (req, res) => {
  if (verifyToken(req.cookies?.session)) return res.redirect('/');
  res.send(loginHTML(req.query.error === '1'));
});

app.post('/login', (req, res) => {
  if (req.body.password === DASH_PASS) {
    res.cookie('session', makeToken(), { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    return res.redirect('/');
  }
  res.redirect('/login?error=1');
});

app.get('/logout', (req, res) => {
  res.clearCookie('session');
  res.redirect('/login');
});

// Auth middleware for everything except /login
app.use((req, res, next) => {
  if (req.path === '/login') return next();
  if (!verifyToken(req.cookies?.session)) return res.redirect('/login');
  next();
});

// Serve gateway password to authenticated frontend
app.get('/api/config', (req, res) => {
  res.json({ gatewayPassword: GW_PASS, gatewayIp: GW });
});

// Static files (protected)
app.use(express.static(path.join(__dirname, 'public')));

// Proxy /TMI to gateway
app.use('/TMI', (req, res) => {
  const options = {
    hostname: GW,
    port: 80,
    path: '/TMI' + req.url,
    method: req.method,
    headers: {}
  };

  if (req.headers['content-type']) options.headers['Content-Type'] = req.headers['content-type'];
  if (req.headers['authorization']) options.headers['Authorization'] = req.headers['authorization'];
  options.headers['Accept'] = 'application/json';

  const proxy = http.request(options, (gwRes) => {
    res.status(gwRes.statusCode);
    Object.entries(gwRes.headers).forEach(([k, v]) => {
      if (!['transfer-encoding', 'connection'].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });
    gwRes.pipe(res);
  });

  proxy.on('error', (e) => {
    res.status(502).json({ error: 'Gateway unreachable', message: e.message });
  });

  req.pipe(proxy);
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`T-Mobile Dashboard running at http://localhost:${PORT}`);
  console.log(`Dashboard password: ${DASH_PASS === 'admin' ? 'admin (set DASHBOARD_PASSWORD env var to change)' : '(set via env)'}`);
  if (!GW_PASS) console.log('WARNING: GATEWAY_PASSWORD not set — gateway auth will fail');
});

function loginHTML(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gateway Login</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#06060a;font-family:'Space Grotesk',sans-serif;color:#e8e8f0;overflow:hidden}
  body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 0%,#e2007410 0%,transparent 60%);pointer-events:none}
  .noise{position:fixed;inset:0;opacity:0.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none}
  .card{background:#0c0c14;border:1px solid #1a1a2e;border-radius:20px;padding:48px 40px;width:380px;position:relative;overflow:hidden}
  .card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#e20074,transparent)}
  h1{font-size:22px;font-weight:700;margin-bottom:6px;letter-spacing:-0.5px}
  .sub{font-size:13px;color:#6b6b80;margin-bottom:32px}
  label{font-size:11px;color:#6b6b80;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px;font-family:'JetBrains Mono',monospace}
  input{width:100%;padding:14px 16px;background:#0a0a12;border:1px solid #1a1a2e;border-radius:10px;color:#e8e8f0;font-size:15px;font-family:'JetBrains Mono',monospace;outline:none;transition:border-color 0.2s}
  input:focus{border-color:#e20074}
  input::placeholder{color:#333}
  .err{color:#ff1744;font-size:12px;margin-bottom:16px;font-family:'JetBrains Mono',monospace}
  button{width:100%;padding:14px;background:linear-gradient(135deg,#e20074,#b8005e);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;margin-top:20px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.5px;transition:transform 0.15s,box-shadow 0.15s}
  button:hover{transform:translateY(-1px);box-shadow:0 8px 30px #e2007444}
  button:active{transform:translateY(0)}
</style>
</head>
<body>
<div class="noise"></div>
<div class="card">
  <h1>Gateway Dashboard</h1>
  <div class="sub">T-Mobile 5G Home Internet</div>
  ${error ? '<div class="err">// INCORRECT PASSWORD</div>' : ''}
  <form method="POST" action="/login">
    <label>Password</label>
    <input type="password" name="password" placeholder="Enter dashboard password..." autofocus required>
    <button type="submit">Authenticate</button>
  </form>
</div>
</body>
</html>`;
}
