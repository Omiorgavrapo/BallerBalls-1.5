'use strict';
const assert = require('node:assert/strict');
const { WebSocket } = require('ws');
const { createService, VERSION } = require('./server-room.cjs');
const { createServer, MAX_BUFFER } = require('./server.cjs');
const Maps = require('./maps.js'), Core = require('./core.js');
const profile = { name: 'Test', color: '#82b18d', skin: 'face', bowSkin: 'classic' };
const copy = value => JSON.parse(JSON.stringify(value));
function unitChecks() {
  let time = 1000;
  const service = createService({ now: () => time, maxRooms: 5 });
  function client() { return { member: null, messages: new Map(), count: 0, send(value) { this.messages.set(value.type, copy(value)); this.count++; return true; }, close() { this.closed = true; } }; }
  const host = client(), guest = client();
  service.handle(host, { type: 'create', version: VERSION, profile });
  const room = host.member.room;
  service.handle(host, { type: 'configure', humans: 3, bots: 0, rounds: 20, mapId: Maps.maps.find(m => m.mode === 'football').id, rules: { gravity: 1 } });
  service.handle(host, { type: 'invite' }); const pin = host.messages.get('invite').pin;
  assert.match(pin, /^\d{8}$/);
  service.handle(guest, { type: 'join', version: VERSION, profile, pin });
  assert.throws(() => service.handle(client(), { type: 'join', version: VERSION, profile, pin }), /PIN/);
  assert.throws(() => service.handle(guest, { type: 'configure', humans: 3, bots: 0, rounds: 1, mapId: room.map.id }), /dono/);
  service.handle(host, { type: 'start' });
  const initialTick = guest.messages.get('start').state.tick;
  // No client callbacks or rendering drive these ticks. Simulate three real hours.
  const before = performance.now();
  for (let i = 0; i < 3 * 60 * 60 * 60; i++) { time += 1000 / 60; service.tick(); }
  assert(room.game.state().tick > initialTick + 45 * 60 * 60, 'No 45-minute expiration');
  assert(service.rooms.has(room.id));
  assert.throws(() => room.game.snapshot(), /disabled/, 'Dedicated simulation must not retain a replay command log');
  const longRunMs = Math.round(performance.now() - before);
  const tick = room.game.state().tick;
  time += 100000; service.tick();
  assert(room.game.state().tick - tick <= 6, 'Catch-up work is bounded after a process stall');
  service.handle(guest, { type: 'input', match: room.match, seq: 1, mask: 2 });
  service.handle(guest, { type: 'input', match: room.match, seq: 0, mask: 1 });
  assert.equal(guest.member.mask, 2, 'Stale commands cannot overwrite newer ones');
  assert.throws(() => service.handle(guest, { type: 'state', state: { scores: { g1: 20 } } }), /reconhecida/, 'Clients cannot invent wins');
  assert.throws(() => service.handle(guest, { type: 'input', match: room.match, seq: 2, mask: 64 }), /Comando/);
  time += 800; service.tick();
  assert.equal(room.game.state().players.find(p => p.id === 'g1').controls.right, false, 'Lost input releases movement');
  const oldId = host.member.id, resumeToken = host.member.token;
  service.disconnect(host); const tickWithoutHost = room.game.state().tick;
  for (let i = 0; i < 120; i++) { time += 1000 / 60; service.tick(); }
  assert(room.game.state().tick >= tickWithoutHost + 119, 'Owner disconnection cannot freeze guests');
  const reconnected = client(); service.handle(reconnected, { type: 'resume', version: VERSION, token: resumeToken });
  assert.equal(reconnected.member.id, oldId); assert.equal(reconnected.messages.get('welcome').resumed, true);
  assert(reconnected.messages.has('start')); assert.equal(service.sessions.size, 2);
  service.disconnect(host); assert.equal(reconnected.member.connection, reconnected, 'Old socket cannot disconnect a replacement');
  service.handle(reconnected, { type: 'invite' });
  const late = client(); service.handle(late, { type: 'join', version: VERSION, profile, pin: reconnected.messages.get('invite').pin });
  assert(!late.messages.get('start').state.players.some(p => p.id === late.member.id), 'Mid-match join watches until next game');
  service.handle(reconnected, { type: 'leave' });
  assert.equal(room.ownerId, 'g1'); assert(room.game, 'Owner leaving does not delete the match');
  service.disconnect(guest); service.disconnect(late); time += 60001; service.tick();
  assert.deepEqual(service.stats(), { rooms: 0, sessions: 0, pins: 0 });
  const broken = client(), healthy = client();
  for (const c of [broken, healthy]) { service.handle(c, { type: 'create', version: VERSION, profile }); service.handle(c, { type: 'start' }); }
  broken.member.room.game.step = () => { throw Error('Fixture physics failure'); };
  time += 50; service.tick();
  assert.equal(broken.member.room.game, null, 'Failing map returns its room to lobby');
  assert(broken.messages.get('lobby').reason); assert(healthy.member.room.game.state().tick > 0, 'Other rooms continue');
  for (const c of [broken, healthy]) service.handle(c, { type: 'leave' });
  for (let i = 0; i < 50; i++) {
    const c = client(); service.handle(c, { type: 'create', version: VERSION, profile }); service.handle(c, { type: 'invite' });
    service.handle(c, { type: 'leave' }); assert.deepEqual(service.stats(), { rooms: 0, sessions: 0, pins: 0 });
  }
  const expiry = client(); service.handle(expiry, { type: 'create', version: VERSION, profile }); service.handle(expiry, { type: 'invite' });
  const expiredPin = expiry.messages.get('invite').pin; time += 300001; service.tick();
  assert.throws(() => service.handle(client(), { type: 'join', version: VERSION, profile, pin: expiredPin }), /PIN/);
  const expiredToken = expiry.member.token; service.disconnect(expiry); time += 60001; service.tick();
  const cannotResume = client(); service.handle(cannotResume, { type: 'resume', version: VERSION, token: expiredToken });
  assert(cannotResume.messages.has('expired'));
  for (const mode of Core.MODES) {
    const c = client(); service.handle(c, { type: 'create', version: VERSION, profile });
    service.handle(c, { type: 'configure', humans: 1, bots: 4, rounds: 20, mapId: Maps.maps.find(m => m.mode === mode).id, rules: {} });
    service.handle(c, { type: 'start' });
    for (let i = 0; i < 900; i++) { time += 1000 / 60; service.tick(); }
    const state = c.messages.get('state').state;
    assert.equal(state.mode, mode); state.players.forEach(p => assert(Number.isFinite(p.x) && Number.isFinite(p.y)));
    service.handle(c, { type: 'leave' });
  }
  assert.deepEqual(service.stats(), { rooms: 0, sessions: 0, pins: 0 });
  console.log('PASS service: 3 simulated hours (' + longRunMs + ' ms), 6 modes, authority, input expiry, reconnection, owner handover, single-use PINs, bounded catch-up, 50 room cleanup cycles.');
}
async function socketChecks() {
  const app = createServer(); await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + app.server.address().port, sockets = [];
  async function client() {
    const ws = new WebSocket(base.replace('http:', 'ws:') + '/play'); sockets.push(ws);
    const messages = [];
    ws.on('message', data => messages.push(JSON.parse(data)));
    await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
    return { ws, messages, send: value => ws.send(JSON.stringify(value)),
      async wait(type) {
        const deadline = Date.now() + 4000;
        while (Date.now() < deadline) { const i = messages.findIndex(m => m.type === type); if (i >= 0) return messages.splice(i, 1)[0]; await new Promise(r => setTimeout(r, 10)); }
        throw Error('Missing ' + type);
      } };
  }
  try {
    assert.equal((await fetch(base + '/healthz')).status, 200);
    const invalidOrigin = new WebSocket(base.replace('http:', 'ws:') + '/play', { origin: 'http://[' }); sockets.push(invalidOrigin);
    await new Promise(resolve => invalidOrigin.once('error', error => { assert.match(error.message, /403/); resolve(); }));
    assert.equal((await fetch(base + '/healthz')).status, 200, 'Malformed Origin cannot crash the server');
    for (const file of ['/server.cjs', '/package.json', '/.qa/test', '/firebase.rules.json']) assert.equal((await fetch(base + file)).status, 404);
    const host = await client(); host.send({ type: 'create', version: VERSION, profile }); const welcome = await host.wait('welcome');
    host.send({ type: 'invite' }); const pin = (await host.wait('invite')).pin;
    const guest = await client(); guest.send({ type: 'join', version: VERSION, profile, pin }); await guest.wait('welcome');
    host.send({ type: 'start' }); await host.wait('start'); await guest.wait('start');
    const first = await guest.wait('state'); host.ws.terminate();
    await new Promise(r => setTimeout(r, 120)); const next = await guest.wait('state'); assert(next.state.tick > first.state.tick);
    const resumed = await client(); resumed.send({ type: 'resume', version: VERSION, token: welcome.token });
    assert.equal((await resumed.wait('welcome')).id, 'h1'); await resumed.wait('start');
    const conn = [...app.connections].find(c => c.member && c.member.id === 'h1');
    Object.defineProperty(conn.ws, 'bufferedAmount', { configurable: true, get: () => MAX_BUFFER + 1 });
    assert.equal(conn.send({ type: 'state' }, true), false, 'Drop transient state when socket is backed up');
    assert.equal(conn.send({ type: 'room' }), false, 'Close blocked socket before losing reliable control');
    await new Promise(r => setTimeout(r, 30));
    assert.equal(conn.member, null, 'Slow client disconnected for automatic resume');
    console.log('PASS WebSocket: independent server ticks, real two-player room, reconnect token, HTTP file allowlist, bounded network buffer.');
  } finally { sockets.forEach(ws => ws.terminate()); await app.close(); }
}
(async () => { unitChecks(); await socketChecks(); })().catch(error => { console.error(error); process.exitCode = 1; });
