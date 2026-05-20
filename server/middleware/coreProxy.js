const https = require('https');
const http = require('http');
const { URL } = require('url');

const CORE_API_URL = process.env.CORE_API_URL || '';
const CORE_API_SECRET = process.env.CORE_API_SECRET || '';

/**
 * Calls BOTIFY X CORE runtime API.
 * CORE must expose:
 *   POST   /runtime/:sessionId/start
 *   POST   /runtime/:sessionId/restart
 *   POST   /runtime/:sessionId/stop
 *   GET    /runtime/:sessionId/status
 *   GET    /runtime/:sessionId/logs
 *
 * Returns { ok: boolean, data: any, status: number }
 */
async function callCore(method, path, body = null) {
  if (!CORE_API_URL) {
    return { ok: false, status: 503, data: { error: 'CORE_API_URL not configured' } };
  }

  const url = new URL(path, CORE_API_URL);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      'X-Botify-Secret': CORE_API_SECRET,
    },
    timeout: 10000,
  };

  return new Promise((resolve) => {
    const req = lib.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let data;
        try { data = JSON.parse(raw); } catch { data = { raw }; }
        resolve({ ok: res.statusCode < 400, status: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, status: 502, data: { error: 'Could not reach CORE: ' + err.message } });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 504, data: { error: 'CORE request timed out' } });
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

module.exports = { callCore };
