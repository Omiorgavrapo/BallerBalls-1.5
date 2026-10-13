'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { WebSocketServer, WebSocket } = require('ws');
const { createService, VERSION } = require('./server-room.cjs');
const MAX_BUFFER = 128 * 1024;
const publicFiles = new Set(['index.html', 'style.css', 'theme.css', 'editor.css', 'lan.css', 'maps.js', 'historical-maps.js',
  'core.js', 'prediction.js', 'skin-textures.js', 'skin-art.js', 'render.js', 'options-ui.js', 'editor.js', 'online-config.js', 'server-client.js', 'app.js',
  'vendor/planck.min.js', 'assets/jost-400.ttf', 'assets/jost-700.ttf', 'assets/jost-900.ttf']);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.ttf': 'font/ttf' };
function createServer(options = {}) {
  if (options.maxRooms == null && process.env.MAX_ROOMS) options.maxRooms = Math.max(1, Math.min(24, Number(process.env.MAX_ROOMS) || 4));
  const service = createService(options), origins = options.origins || (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
  const server = http.createServer((request, response) => {
    let file;
    try { file = decodeURIComponent(new URL(request.url, 'http://local').pathname).slice(1) || 'index.html'; }
    catch (_) { response.writeHead(400).end(); return; }
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
    if (file === 'healthz') { response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify({ ok: true, version: VERSION })); return; }
    if (!publicFiles.has(file)) { response.writeHead(404).end('Não encontrado.'); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
    if (request.method === 'HEAD') { response.end(); return; }
    const stream = fs.createReadStream(path.join(__dirname, file));
    stream.on('error', () => response.destroy()); stream.pipe(response);
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 512 * 1024, perMessageDeflate: false });
  const connections = new Set();
  server.on('upgrade', (request, socket, head) => {
    const origin = request.headers.origin;
    let sameOrigin = false;
    try { sameOrigin = !!origin && /^https?:\/\//.test(origin) && new URL(origin).host === request.headers.host; } catch (_) {}
    if (request.url !== '/play' || connections.size >= (options.maxConnections || 160) || origin && origin !== 'null' && !sameOrigin && !origins.includes(origin)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws));
  });
  wss.on('connection', ws => {
    const connection = { member: null, alive: true, opened: performance.now(), rateAt: performance.now(), count: 0, slowAt: null,
      send(value, transient = false) {
        if (ws.readyState !== WebSocket.OPEN) return false;
        if (ws.bufferedAmount > MAX_BUFFER) {
          if (connection.slowAt == null) connection.slowAt = performance.now();
          if (!transient || performance.now() - connection.slowAt > 5000) ws.terminate();
          return false;
        }
        connection.slowAt = null; ws.send(JSON.stringify(value), error => { if (error) ws.terminate(); }); return true;
      }, close() { ws.close(); }, ws };
    connections.add(connection);
    ws.on('pong', () => { connection.alive = true; });
    ws.on('error', () => ws.terminate());
    ws.on('close', () => { connections.delete(connection); service.disconnect(connection); });
    ws.on('message', (data, binary) => {
      const at = performance.now();
      if (at - connection.rateAt >= 1000) { connection.rateAt = at; connection.count = 0; }
      if (binary || ++connection.count > 120) { ws.close(1008, 'Limite de mensagens.'); return; }
      try { service.handle(connection, JSON.parse(data.toString())); }
      catch (error) { connection.send({ type: 'error', reason: String(error.message).slice(0, 180) }); }
    });
  });
  const timer = setInterval(() => service.tick(), 1000 / 60);
  const heartbeat = setInterval(() => {
    for (const connection of connections) {
      if (!connection.alive || !connection.member && performance.now() - connection.opened > 30000) { connection.ws.terminate(); continue; }
      connection.alive = false; connection.ws.ping();
    }
  }, 10000);
  async function close() {
    clearInterval(timer); clearInterval(heartbeat); service.stop();
    for (const connection of connections) connection.ws.terminate();
    await new Promise(resolve => wss.close(resolve));
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
  return { server, service, connections, close };
}
if (require.main === module) {
  const app = createServer(); const port = Number(process.env.PORT || 8080);
  app.server.listen(port, '0.0.0.0', () => console.log('Baller Balls server listening on port ' + port));
  const shutdown = async () => { await app.close(); process.exit(0); };
  process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
}
module.exports = { createServer, MAX_BUFFER };
