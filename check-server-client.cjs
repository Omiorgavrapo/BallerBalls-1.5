'use strict';
const assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
const { WebSocket } = require('ws');
const { createServer } = require('./server.cjs');
const Core = require('./core.js'), Maps = require('./maps.js'), Prediction = require('./prediction.js');
const source = fs.readFileSync(require.resolve('./server-client.js'), 'utf8');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function wait(condition) { const end = Date.now() + 6000; while (!condition()) { if (Date.now() > end) throw Error('Client condition timeout'); await sleep(20); } }
function client(base, name) {
  const elements = new Map(), storage = new Map(), callbacks = { games: 0, lobby: 0, errors: [] }, sockets = [];
  function element(id) {
    if (!elements.has(id)) elements.set(id, { id, value: '', disabled: false, hidden: false, innerHTML: '', textContent: '', querySelectorAll() { return []; }, focus() {}, select() {} });
    return elements.get(id);
  }
  function BrowserSocket(url) { const ws = new WebSocket(url); sockets.push(ws); return ws; }
  const context = { console, performance, location: { protocol: 'http:', origin: base }, URL, WebSocket: BrowserSocket,
    document: { getElementById: element }, sessionStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    setInterval, clearInterval, setTimeout, clearTimeout, navigator: {}, BonkCore: Core, BonkMaps: Maps, BonkPrediction: Prediction,
    BonkOptions: { mount() { return { set() {} }; } }, BonkRender: {} };
  vm.runInNewContext(source, context);
  const room = context.BonkRoom;
  room.init({ profile: () => ({ name, color: '#82b18d', skin: 'face' }), maps: () => Maps.maps, onError: msg => callbacks.errors.push(msg),
    onLobby: () => callbacks.lobby++, onExit() {}, onEvent() {}, onGame: () => callbacks.games++ });
  return { room, element, callbacks, sockets, storage };
}
(async () => {
  const app = createServer(); await new Promise(r => app.server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + app.server.address().port;
  const host = client(base, 'Host'), guest = client(base, 'Guest');
  try {
    host.room.host(); await wait(() => host.room.isHost());
    host.element('lanInvite').onclick(); await wait(() => /^\d{8}$/.test(host.element('lanOffer').value));
    guest.room.join(); guest.element('lanOfferInput').value = host.element('lanOffer').value; guest.element('lanJoin').onclick();
    await wait(() => guest.room.playerId() === 'g1');
    host.room.start(); await wait(() => guest.room.state() && host.room.state());
    const tick = guest.room.state().tick;
    await sleep(200); assert(guest.room.state().tick > tick, 'Game advances without ANY owner render/update call');
    await wait(() => guest.room.state().phase === 'playing');
    guest.room.flushInput({ right: true }); await sleep(80);
    const actual = app.service.rooms.values().next().value.game.state().players.find(p => p.id === 'g1');
    assert(actual.controls.right, 'Immediate keys reach server without animation frames');
    guest.room.flushInput({});
    const gameBeforeResume = guest.callbacks.games;
    guest.sockets.at(-1).terminate(); await wait(() => guest.sockets.length === 2 && guest.room.transport() === 'Servidor');
    assert.equal(guest.room.playerId(), 'g1'); assert.equal(app.service.sessions.size, 2);
    assert.equal(guest.callbacks.games, gameBeforeResume, 'Reconnect preserves UI state instead of reopening match');
    host.room.end(); await wait(() => guest.room.isHost());
    const afterLeave = guest.room.state().tick; await sleep(150); assert(guest.room.state().tick > afterLeave);
    assert.equal(guest.element('lanHost').hidden, false, 'Owner controls transfer to guest');
    assert.deepEqual(host.callbacks.errors, []); assert.deepEqual(guest.callbacks.errors, []);
    guest.room.end(); await wait(() => app.service.rooms.size === 0);
    assert.equal(host.storage.size + guest.storage.size, 0, 'Explicit leave removes stored capability');
    console.log('PASS server client: owner has no authoritative physics, immediate input, automatic socket resume, no duplicated sessions, owner transfer, timer/session cleanup.');
  } finally { host.room.end(); guest.room.end(); await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
