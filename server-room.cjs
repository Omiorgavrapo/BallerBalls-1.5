'use strict';
const crypto = require('node:crypto');
const Core = require('./core.js');
const Maps = require('./maps.js');
require('./historical-maps.js');
const VERSION = 9, DT = Core.PARAMS.dt;
const actions = ['left', 'right', 'up', 'down', 'heavy', 'special'];
const clone = value => JSON.parse(JSON.stringify(value));
function profile(raw, id) {
  if (!raw || typeof raw.name !== 'string' || !/^#[0-9a-f]{6}$/i.test(raw.color || '') ||
      !Object.hasOwn(Core.SKINS, Core.skinId(raw.skin)) || !Object.hasOwn(Core.BOWS, raw.bowSkin || 'classic') ||
      raw.bowColor != null && !/^#[0-9a-f]{6}$/i.test(raw.bowColor)) throw Error('Perfil inválido.');
  return { id, name: raw.name.trim().slice(0, 24) || 'Player', color: raw.color, skin: Core.skinId(raw.skin),
    bowSkin: raw.bowSkin || 'classic', bowColor: raw.bowColor || raw.color, team: id === 'h1' ? 1 : Number(id.slice(1)) % 2 + 1, bot: false };
}
function createService(options = {}) {
  const rooms = new Map(), sessions = new Map(), pins = new Map();
  const now = options.now || (() => performance.now());
  const grace = options.graceMs ?? 60000, pinLifetime = options.pinMs ?? 300000;
  const maxRooms = options.maxRooms ?? 24;
  const token = () => crypto.randomBytes(24).toString('hex');
  function send(member, value, transient = false) {
    if (member.connection) member.connection.send(value, transient);
  }
  function broadcast(room, value, transient = false) { room.members.forEach(member => send(member, value, transient)); }
  function packet(room) {
    return { type: 'room', ownerId: room.ownerId, humans: room.humans, bots: room.bots, rounds: room.rounds, rules: room.rules,
      mapId: room.map.id, map: room.map, players: [...room.members.values()].map(m => ({ ...m.profile, connected: !!m.connection })),
      catalogue: room.maps.map(m => ({ id: m.id, name: m.name, author: m.author, mode: m.mode })), running: !!room.game };
  }
  function publish(room) { broadcast(room, packet(room)); }
  function wireState(room) {
    const state = room.game.state(); delete state.map; state.events = [];
    state.bodies = state.bodies.map(b => ({ id: b.id, x: b.x, y: b.y, angle: b.angle, vx: b.vx, vy: b.vy, spin: b.spin }));
    state.players = state.players.map(p => {
      const m = room.members.get(p.id);
      return { ...p, inputSeq: m ? m.seq : -1, inputTicks: m ? m.inputTicks : 0 };
    });
    return state;
  }
  function welcome(member, resumed = false) {
    const room = member.room;
    send(member, { type: 'welcome', version: VERSION, id: member.id, token: member.token, resumed });
    send(member, packet(room));
    if (room.game) send(member, { type: 'start', match: room.match, map: room.map, state: wireState(room) });
  }
  function attach(connection, member) {
    const previous = member.connection;
    member.connection = connection; connection.member = member; member.disconnectedAt = null;
    member.mask = 0; member.lastInput = now();
    if (previous && previous !== connection) { previous.member = null; previous.close(); }
  }
  function invalidatePins(room) {
    for (const [pin, invitation] of pins) if (invitation.room === room) pins.delete(pin);
  }
  function remove(member) {
    const room = member.room;
    sessions.delete(member.token); room.members.delete(member.id);
    if (member.connection) { member.connection.member = null; member.connection.close(); member.connection = null; }
    if (!room.members.size) { invalidatePins(room); room.game = null; rooms.delete(room.id); return; }
    if (room.ownerId === member.id) {
      room.ownerId = ([...room.members.values()].find(m => m.connection) || [...room.members.values()][0]).id;
      invalidatePins(room);
    }
    publish(room);
  }
  function addMember(connection, room, raw, id) {
    const member = { id, profile: profile(raw, id), token: token(), room, connection: null, seq: -1, inputTicks: 0,
      mask: 0, lastInput: now(), disconnectedAt: null };
    room.members.set(id, member); sessions.set(member.token, member); attach(connection, member);
    return member;
  }
  function owner(connection) {
    const m = connection.member;
    if (!m || m.id !== m.room.ownerId) throw Error('Somente o dono pode configurar a sala.');
    if (m.room.game && m.room.game.phase() !== 'matchover') throw Error('Aguarde a partida terminar.');
    return m.room;
  }
  function configure(room, message) {
    const { humans, bots, rounds } = message;
    if (!Number.isInteger(humans) || humans < room.members.size || humans > 5 ||
        !Number.isInteger(bots) || bots < 0 || humans + bots > 5 ||
        !Number.isInteger(rounds) || rounds < 1 || rounds > 20) throw Error('Escolha até 5 participantes e de 1 a 20 vitórias.');
    const map = room.maps.find(m => m.id === message.mapId);
    if (!map) throw Error('Mapa não encontrado.');
    room.humans = humans; room.bots = bots; room.rounds = rounds; room.rules = Core.normalizeRules(message.rules); room.map = map;
    if (room.game) { room.game = null; broadcast(room, { type: 'lobby', reason: '' }); }
    invalidatePins(room); publish(room);
  }
  function start(room) {
    const roster = [...room.members.values()].map(m => m.profile), colors = ['#82b18d', '#d1ab6f', '#9e88ba', '#71adb6'];
    for (let i = 0; i < room.bots; i++) roster.push({ id: 'b' + (i + 1), name: 'Bot ' + (i + 1), color: colors[i], skin: 'face', team: i % 2 + 1, bot: true });
    room.game = Core.create(room.map, { players: roster, seed: crypto.randomBytes(4).readUInt32LE(), roundsToWin: room.rounds,
      rules: room.rules, recordHistory: false });
    room.match++; room.accumulator = room.sendClock = 0; room.lastTick = now(); room.stateSeq = 0;
    room.members.forEach(m => { m.mask = 0; m.seq = -1; m.inputTicks = 0; });
    broadcast(room, { type: 'start', match: room.match, map: room.map, state: wireState(room) }); publish(room);
  }
  function handle(connection, message) {
    if (!message || typeof message !== 'object' || Array.isArray(message) || typeof message.type !== 'string') throw Error('Mensagem inválida.');
    if (message.type === 'ping') { connection.send({ type: 'pong', time: message.time }); return; }
    if (['create', 'join', 'resume'].includes(message.type)) {
      if (message.version !== VERSION) throw Error('Atualize a pasta inteira do jogo.');
      if (connection.member) throw Error('Você já está em uma sala.');
      if (message.type === 'resume') {
        const member = sessions.get(message.token);
        if (!member || member.disconnectedAt != null && now() - member.disconnectedAt >= grace) {
          connection.send({ type: 'expired', reason: 'Sua vaga expirou ou o servidor reiniciou. Entre com um novo PIN.' }); return;
        }
        attach(connection, member); welcome(member, true); publish(member.room); return;
      }
      if (message.type === 'create') {
        if (rooms.size >= maxRooms) throw Error('Servidor cheio. Tente novamente em alguns minutos.');
        profile(message.profile, 'h1');
        const maps = message.maps == null ? Maps.maps : message.maps;
        if (!Array.isArray(maps) || !maps.length || maps.length > 200) throw Error('Catálogo inválido.');
        const checked = maps.map(Maps.validate), ids = new Set();
        // Bound geometry work and reject ambiguous catalogue IDs before allocating a room.
        checked.forEach(map => {
          if (ids.has(map.id) || map.bodies.length > 150 || (map.joints || []).length > 150 ||
              map.bodies.reduce((sum, b) => sum + (b.points || []).length, 0) > 2000) throw Error('Mapa grande demais para online ou ID repetido.');
          ids.add(map.id);
        });
        const room = { id: token(), ownerId: 'h1', members: new Map(), maps: checked, map: checked[0], humans: 3, bots: 2,
          rounds: 3, rules: Core.normalizeRules(), game: null, match: 0, stateSeq: 0, accumulator: 0, sendClock: 0, lastTick: now() };
        rooms.set(room.id, room); const member = addMember(connection, room, message.profile, 'h1'); welcome(member); return;
      }
      const invitation = typeof message.pin === 'string' && pins.get(message.pin);
      if (!invitation || invitation.expires <= now()) throw Error('PIN inválido, usado ou expirado.');
      const room = invitation.room;
      if (room.members.size >= room.humans) throw Error('Sala sem vagas.');
      const occupied = new Set([...room.members.keys(), ...(room.game ? room.game.state().players.map(p => p.id) : [])]);
      const id = ['g1', 'g2', 'g3', 'g4'].find(id => !occupied.has(id));
      if (!id) throw Error('Aguarde a próxima partida para entrar.');
      const member = addMember(connection, room, message.profile, id); pins.delete(message.pin); welcome(member); publish(room); return;
    }
    const member = connection.member;
    if (!member) throw Error('Crie ou entre em uma sala primeiro.');
    const room = member.room;
    if (message.type === 'input') {
      if (message.match !== room.match || !room.game) return;
      if (!Number.isInteger(message.mask) || message.mask < 0 || message.mask > 63 || !Number.isSafeInteger(message.seq) || message.seq < 0) throw Error('Comando inválido.');
      if (message.seq <= member.seq) return;
      member.seq = message.seq; member.inputTicks = 0; member.mask = message.mask; member.lastInput = now(); return;
    }
    if (message.type === 'leave') { remove(member); return; }
    if (message.type === 'invite') {
      if (member.id !== room.ownerId) throw Error('Somente o dono pode convidar.');
      if (room.members.size >= room.humans) throw Error('Sala sem vagas.');
      invalidatePins(room); let pin;
      do { pin = String(crypto.randomInt(100000000)).padStart(8, '0'); } while (pins.has(pin));
      pins.set(pin, { room, expires: now() + pinLifetime }); send(member, { type: 'invite', pin }); return;
    }
    if (message.type === 'configure') { configure(owner(connection), message); return; }
    if (message.type === 'start') { start(owner(connection)); return; }
    throw Error('Mensagem não reconhecida.');
  }
  function disconnect(connection) {
    const member = connection.member; connection.member = null;
    if (!member || member.connection !== connection) return;
    member.connection = null; member.mask = 0; member.disconnectedAt = now(); publish(member.room);
  }
  function tick(at = now()) {
    for (const [pin, invitation] of pins) if (invitation.expires <= at) pins.delete(pin);
    for (const member of sessions.values()) if (member.disconnectedAt != null && at - member.disconnectedAt >= grace) remove(member);
    for (const room of rooms.values()) {
      try {
      const elapsed = Math.max(0, (at - room.lastTick) / 1000); room.lastTick = at;
      if (!room.game || room.game.phase() === 'matchover' || ![...room.members.values()].some(m => m.connection)) continue;
      room.accumulator += Math.min(.1, elapsed); room.sendClock += elapsed;
      // At most six catch-up steps; never let a delayed room starve all other rooms.
      let steps = 0;
      while (room.accumulator + 1e-9 >= DT && steps++ < 6) {
        const inputs = {};
        room.members.forEach(m => {
          const active = m.connection && at - m.lastInput < 750;
          const commands = {}; actions.forEach((a, i) => { commands[a] = !!(active && m.mask & (1 << i)); });
          inputs[m.id] = commands;
          if (active && room.game.phase() === 'playing') m.inputTicks++;
        });
        room.game.step(inputs); room.accumulator -= DT;
        if (room.game.events().length) broadcast(room, { type: 'events', match: room.match, events: room.game.events() });
        if (room.game.phase() === 'matchover') break;
      }
      if (room.sendClock >= .05 || room.game.phase() === 'matchover') {
        room.sendClock %= .05; broadcast(room, { type: 'state', match: room.match, seq: room.stateSeq++, state: wireState(room) }, true);
        if (room.game.phase() === 'matchover') publish(room);
      }
      } catch (_) {
        // A bad custom map cannot take down other rooms in the process.
        room.game = null; room.accumulator = room.sendClock = 0;
        broadcast(room, { type: 'lobby', reason: 'A física deste mapa falhou. Escolha outro mapa e inicie novamente.' });
        publish(room);
      }
    }
  }
  function stop() {
    for (const member of sessions.values()) { send(member, { type: 'closed', reason: 'Servidor reiniciando. Entre novamente em alguns instantes.' }); if (member.connection) member.connection.close(); }
    rooms.clear(); sessions.clear(); pins.clear();
  }
  return { handle, disconnect, tick, stop, rooms, sessions, pins, stats: () => ({ rooms: rooms.size, sessions: sessions.size, pins: pins.size }) };
}
module.exports = { createService, VERSION, profile };
