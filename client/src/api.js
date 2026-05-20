const BASE = '/api';

function getToken() {
  return localStorage.getItem('bx_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

export const api = {
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  register: (username, password, inviteToken) => request('POST', '/auth/register', { username, password, inviteToken }),
  me: () => request('GET', '/auth/me'),

  attachSession: (sessionId) => request('POST', '/session/attach', { sessionId }),
  detachSession: () => request('DELETE', '/session/detach'),

  start: () => request('POST', '/runtime/start'),
  restart: () => request('POST', '/runtime/restart'),
  stop: () => request('POST', '/runtime/stop'),
  status: () => request('GET', '/runtime/status'),
  logs: () => request('GET', '/runtime/logs'),
  events: () => request('GET', '/runtime/events'),
};
