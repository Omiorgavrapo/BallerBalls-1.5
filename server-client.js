/* All online clients, including the room owner, talk to the authoritative server. */
(function (global) {
  'use strict';
  var VERSION = 9, options, room = null, current = null, previous = null, prediction = null, socket = null;
  var generation = 0, timer = null, retry = null, connectTimeout = null, retries = 0, reconnectSince = 0;
  var match = 0, lastSequence = -1, sequence = 0, mask = 0, lastMask = -1, inputAt = 0, heardAt = 0, pingAt = 0;
  var receivedAt = 0, smoothTime = 50, rulesUI, token = null, url = '', initialRequest = null, connected = false;
  var initialSince = 0;
  var actions = ['left', 'right', 'up', 'down', 'heavy', 'special'];
  function $(id) { return document.getElementById(id); }
  function now() { return performance.now(); }
  function escape(value) { return String(value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fail(reason) { options.onError(String(reason).slice(0, 200)); }
  function endpoint() {
    var configured = global.BonkOnlineConfig && global.BonkOnlineConfig.serverURL;
    var base = configured || (/^https?:$/.test(location.protocol) ? location.origin : '');
    if (!base) throw Error('O servidor online ainda precisa ser publicado. O modo local continua disponível.');
    var target = new URL(base); if (!/^https?:$/.test(target.protocol)) throw Error('Endereço de servidor inválido.');
    target.protocol = target.protocol === 'https:' ? 'wss:' : 'ws:'; target.pathname = '/play'; target.search = target.hash = ''; return target.href;
  }
  function saveToken() { try { if (token) sessionStorage.setItem('baller-server-session', JSON.stringify({ url: url, token: token })); else sessionStorage.removeItem('baller-server-session'); } catch (_) {} }
  function owner() { return !!room && !!room.id && room.id === (room.info && room.info.ownerId); }
  function send(value) {
    if (!socket || socket.readyState !== 1 || !connected && value.type !== 'ping') return false;
    if (socket.bufferedAmount > 65536) return false;
    socket.send(JSON.stringify(value)); return true;
  }
  function command(value) { if (!send(value)) fail('A conexão está se recuperando. Tente novamente em alguns instantes.'); }
  function render(value) {
    if (room.memberCount !== value.players.length || room.lastOwner !== value.ownerId) {
      $('lanOffer').value = ''; $('lanCopy').disabled = true;
      room.memberCount = value.players.length; room.lastOwner = value.ownerId;
    }
    var slots = value.players.map(function (p) {
      return '<li><canvas class="lan-avatar" width="64" height="64" data-player="' + p.id + '" aria-hidden="true"></canvas><div><strong>' + escape(p.name) + '</strong><small>' + (p.id === value.ownerId ? 'Dono da sala' : p.connected ? 'Conectado' : 'Reconectando…') + '</small></div><span class="lan-player-tag">' + (p.id === room.id ? 'VOCÊ' : p.connected ? 'PRONTO' : 'AGUARDE') + '</span></li>';
    });
    for (var i = value.players.length; i < value.humans; i++) slots.push('<li class="lan-empty"><span class="lan-dot">+</span><div><strong>Vaga livre</strong><small>Aguardando um jogador</small></div></li>');
    for (var b = 0; b < value.bots; b++) slots.push('<li class="lan-bot"><span class="lan-dot">B</span><div><strong>Bot ' + (b + 1) + '</strong><small>Entra na partida</small></div><span class="lan-player-tag">BOT</span></li>');
    $('lanPlayers').innerHTML = slots.join('');
    $('lanPlayers').querySelectorAll('.lan-avatar').forEach(function (canvas) {
      var p = value.players.find(function (p) { return p.id === canvas.dataset.player; });
      BonkRender.disc(canvas.getContext('2d'), { x: 32, y: 32, radius: 23, color: p.color, skin: p.skin }, 'classic');
    });
    $('lanSummary').textContent = value.players.length + '/' + value.humans + ' humanos';
    $('lanMap').innerHTML = value.catalogue.map(function (m) { return '<option value="' + escape(m.id) + '">' + escape(m.name) + ' · ' + escape(m.author) + '</option>'; }).join('');
    $('lanMap').value = value.mapId; $('lanHumans').value = value.humans; $('lanBots').value = value.bots; $('lanRounds').value = value.rounds;
    var mine = owner(), locked = !mine || !connected || value.running && (!current || current.phase !== 'matchover');
    $('lanHost').hidden = !mine; $('lanGuest').hidden = true; $('lanDetails').hidden = false; $('lanStart').hidden = !mine;
    $('onlineChooseMap').disabled = locked; rulesUI.set(value.rules, locked);
    ['lanHumans', 'lanBots', 'lanRounds', 'lanMap'].forEach(function (id) { $(id).disabled = locked; });
    $('lanInvite').disabled = !mine || !connected || value.players.length >= value.humans;
    $('lanStart').disabled = locked; $('lanStart').textContent = value.running ? 'Nova partida →' : 'Iniciar partida →';
    $('lanReturn').hidden = !current; $('lanTitle').textContent = mine ? 'Sua sala' : 'Você está na sala';
    if (options.onPreview) options.onPreview(value.map);
  }
  function validState(state, map) {
    if (!state || !Number.isSafeInteger(state.tick) || state.tick < 0 || !Array.isArray(state.players) || state.players.length > 5 || !Array.isArray(state.bodies) || state.bodies.length !== map.bodies.length || !Array.isArray(state.projectiles) || state.projectiles.length > 300 || !state.scores || !state.teamScores || !Array.isArray(state.events)) throw Error('Estado online inválido.');
    state.rules = BonkCore.normalizeRules(state.rules);
    [state.players, state.bodies, state.projectiles, state.ball ? [state.ball] : []].forEach(function (list) { list.forEach(function (p) {
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.angle != null && !Number.isFinite(p.angle)) throw Error('Posição online inválida.');
    }); });
    state.bodies = state.bodies.map(function (body, i) {
      if (body.id !== map.bodies[i].id) throw Error('Corpo online inválido.');
      return Object.assign({}, map.bodies[i], body);
    });
    if (['countdown', 'playing', 'roundover', 'matchover'].indexOf(state.phase) < 0 || state.mode !== map.mode) throw Error('Partida online inválida.');
    state.map = map; return state;
  }
  function receive(message) {
    heardAt = now();
    if (!room) return;
    if (message.type === 'welcome') {
      if (message.version !== VERSION || !/^(h1|g[1-4])$/.test(message.id) || !/^[a-f0-9]{48}$/.test(message.token)) throw Error('Servidor incompatível.');
      connected = true; room.id = message.id; token = message.token; initialRequest = null; saveToken();
      reconnectSince = 0; retries = 0; clearTimeout(connectTimeout); lastMask = -1;
      $('lanJoin').disabled = true; $('lanOfferInput').disabled = true;
      $('lanStatus').textContent = message.resumed ? 'Conexão recuperada. A partida continua no servidor.' : 'Conectado ao servidor. Convide os amigos e inicie a partida.';
      if (!current) options.onLobby();
    } else if (message.type === 'room') {
      if (!Array.isArray(message.players) || message.players.length > 5 || !Array.isArray(message.catalogue) || message.catalogue.length > 200 || !Number.isInteger(message.humans) || message.humans < 1 || message.humans > 5 || !Number.isInteger(message.bots) || message.bots < 0 || message.humans + message.bots > 5 || !Number.isInteger(message.rounds) || message.rounds < 1 || message.rounds > 20) throw Error('Configuração inválida.');
      message.map = BonkMaps.validate(message.map); message.rules = BonkCore.normalizeRules(message.rules); room.info = message; render(message);
    } else if (message.type === 'invite') {
      if (!/^\d{8}$/.test(message.pin)) throw Error('PIN inválido.');
      $('lanOffer').value = message.pin; $('lanCopy').disabled = false;
      $('lanStatus').textContent = 'PIN pronto. Válido por 5 minutos, para uma pessoa.';
    } else if (message.type === 'start') {
      if (!Number.isSafeInteger(message.match) || message.match < 1) throw Error('Partida inválida.');
      var wasPlaying = !!current && match === message.match, map = BonkMaps.validate(message.map);
      current = validState(message.state, map); match = message.match; previous = null; lastSequence = -1; receivedAt = now();
      var own = current.players.find(function (p) { return p.id === room.id; });
      sequence = own ? Math.max(0, own.inputSeq + 1) : 0; lastMask = -1; mask = 0;
      prediction = BonkPrediction.create(current, room.id, { maxFrames: 30 });
      if (!wasPlaying) options.onGame(current);
    } else if (message.type === 'state' && current && message.match === match) {
      if (!Number.isSafeInteger(message.seq) || message.seq <= lastSequence) return;
      var next = validState(message.state, current.map); if (next.tick < current.tick) return;
      previous = current; smoothTime = Math.max(33, Math.min(100, (next.tick - current.tick) * BonkCore.PARAMS.dt * 1000));
      if (prediction) prediction.reconcile(next);
      current = next; receivedAt = now(); lastSequence = message.seq;
    } else if (message.type === 'events' && message.match === match && Array.isArray(message.events) && message.events.length <= 30) {
      message.events.forEach(function (e) { if (e && ['hit', 'shoot', 'goal', 'eliminate', 'round', 'start', 'grapple'].indexOf(e.type) >= 0) options.onEvent(e.type, Number.isFinite(e.intensity) ? Math.max(0, Math.min(1, e.intensity)) : 1); });
    } else if (message.type === 'lobby') {
      current = previous = prediction = null; options.onLobby();
      if (message.reason) fail(message.reason);
    } else if (message.type === 'error') {
      fail(message.reason || 'Não foi possível completar a ação.');
      if (room.info) render(room.info);
      if (!token) end();
    } else if (message.type === 'expired' || message.type === 'closed') end(message.reason);
  }
  function open() {
    if (!room) return;
    var attempt = ++generation; connected = false;
    socket = new WebSocket(url); var activeSocket = socket;
    connectTimeout = setTimeout(function () { if (attempt === generation) activeSocket.close(); }, 15000);
    activeSocket.onopen = function () {
      if (attempt !== generation || !room) return;
      heardAt = now(); activeSocket.send(JSON.stringify(token ? { type: 'resume', version: VERSION, token: token } : initialRequest));
    };
    activeSocket.onmessage = function (event) {
      if (attempt !== generation || !room) return;
      try { receive(JSON.parse(event.data)); } catch (error) { end('Dados incompatíveis recebidos do servidor.'); }
    };
    activeSocket.onerror = function () {};
    activeSocket.onclose = function () {
      if (attempt !== generation || !room) return;
      clearTimeout(connectTimeout); connected = false; mask = 0;
      if (!token) {
        if (initialRequest && now() - initialSince < 90000) {
          $('lanStatus').textContent = 'Aguardando o servidor gratuito iniciar… Isso pode levar cerca de 1 minuto.';
          retry = setTimeout(open, Math.min(5000, 1000 * Math.pow(2, retries++))); return;
        }
        end('O servidor não respondeu. Confira sua internet e tente novamente em um minuto.'); return;
      }
      if (!reconnectSince) reconnectSince = now();
      $('lanStatus').textContent = 'Reconectando ao servidor… Sua vaga fica reservada por 1 minuto.';
      if (room.info) render(room.info);
      retry = setTimeout(open, Math.min(5000, 500 * Math.pow(2, retries++)));
    };
  }
  function network() {
    if (!room) return;
    if (reconnectSince && now() - reconnectSince > 55000) { end('A reconexão não respondeu. Entre novamente com um PIN.'); return; }
    if (!connected) return;
    if (now() - heardAt > 12000) { socket.close(); return; }
    if (now() - pingAt > 2000) { pingAt = now(); send({ type: 'ping', time: pingAt }); }
    flushInput();
  }
  function flushInput(commands) {
    if (commands) { mask = 0; actions.forEach(function (a, i) { if (commands[a]) mask |= 1 << i; }); }
    if (!current || !connected) return;
    if (mask === lastMask && now() - inputAt < 100) return;
    if (send({ type: 'input', match: match, mask: mask, seq: sequence })) { sequence++; lastMask = mask; inputAt = now(); }
  }
  function begin(request) {
    if (room) end();
    try { url = endpoint(); } catch (error) { fail(error.message); return; }
    room = { id: null, info: null }; token = null; initialRequest = request; sequence = 0; lastMask = -1; mask = 0; saveToken();
    initialSince = now(); retries = 0;
    $('lanTitle').textContent = request.type === 'create' ? 'Criando sua sala' : 'Entrando na sala';
    $('lanStatus').textContent = 'Conectando ao servidor…'; $('lanDetails').hidden = true; $('lanGuest').hidden = request.type === 'create';
    $('lanHost').hidden = request.type !== 'create'; $('lanStart').hidden = true; $('lanReturn').hidden = true; $('lanInvite').disabled = true;
    $('lanOffer').value = ''; $('lanCopy').disabled = true; $('lanJoin').disabled = true;
    options.onLobby(); timer = setInterval(network, 50); open();
  }
  function host() { begin({ type: 'create', version: VERSION, profile: options.profile(), maps: options.maps().slice(0, 200) }); }
  function join() {
    if (room) end();
    $('lanTitle').textContent = 'Entre na sala'; $('lanStatus').textContent = 'Digite o PIN de 8 dígitos.';
    $('lanHost').hidden = true; $('lanGuest').hidden = false; $('lanDetails').hidden = true;
    $('lanStart').hidden = true; $('lanReturn').hidden = true; $('lanJoin').disabled = false; $('lanOfferInput').disabled = false; $('lanOfferInput').value = '';
    options.onLobby();
  }
  function answer(event) {
    if (event) event.preventDefault();
    var pin = $('lanOfferInput').value.trim(); if (!/^\d{8}$/.test(pin)) { fail('Digite os 8 números do PIN.'); return; }
    begin({ type: 'join', version: VERSION, profile: options.profile(), pin: pin });
  }
  function configure(event, rules) {
    if (!owner() || !room.info) return;
    var humans = Number($('lanHumans').value), bots = Number($('lanBots').value), rounds = Number($('lanRounds').value);
    if (humans + bots > 5) { if (event && event.target.id === 'lanHumans') bots = 5 - humans; else humans = 5 - bots; }
    command({ type: 'configure', humans: humans, bots: bots, rounds: rounds, mapId: $('lanMap').value, rules: rules || room.info.rules });
  }
  function start() { if (owner()) command({ type: 'start' }); }
  function end(reason) {
    if (socket && connected) send({ type: 'leave' });
    generation++; clearInterval(timer); clearTimeout(retry); clearTimeout(connectTimeout);
    var old = socket; socket = null; if (old) old.close();
    room = current = previous = prediction = token = initialRequest = null; connected = false; reconnectSince = retries = 0; mask = 0; saveToken();
    $('lanJoin').disabled = false; $('lanOfferInput').disabled = false; options.onExit(); if (reason) fail(reason);
  }
  function update(delta, commands) {
    if (!room) return;
    flushInput(commands || {});
    if (prediction && connected) prediction.update(delta, commands || {}, sequence - 1);
  }
  function state() {
    if (!current) return null;
    if (!previous || previous.round !== current.round || previous.phase !== current.phase) return prediction ? prediction.state(current) : current;
    var alpha = Math.max(0, Math.min(1, (now() - receivedAt) / smoothTime)), view = Object.assign({}, current);
    ['players', 'bodies', 'projectiles'].forEach(function (key) {
      var older = {}; previous[key].forEach(function (p) { older[p.id] = p; });
      view[key] = current[key].map(function (p) {
        var before = older[p.id]; if (!before || before.alive !== p.alive) return p;
        var value = Object.assign({}, p);
        ['x', 'y', 'angle', 'aim', 'charge', 'cooldown'].forEach(function (k) {
          if (!Number.isFinite(before[k]) || !Number.isFinite(p[k]) || k === 'cooldown' && p[k] > before[k]) return;
          value[k] = k === 'aim' || key === 'projectiles' && k === 'angle' ? before[k] + Math.atan2(Math.sin(p[k] - before[k]), Math.cos(p[k] - before[k])) * alpha : before[k] + (p[k] - before[k]) * alpha;
        }); return value;
      });
    });
    if (previous.ball && current.ball) view.ball = Object.assign({}, current.ball, { x: previous.ball.x + (current.ball.x - previous.ball.x) * alpha, y: previous.ball.y + (current.ball.y - previous.ball.y) * alpha });
    return prediction ? prediction.state(view) : view;
  }
  function init(value) {
    options = value;
    rulesUI = BonkOptions.mount($('onlinePhysics'), 'online', function (rules) { configure(null, rules); }, options.onError);
    $('lanInvite').onclick = function () {
      $('lanOffer').value = ''; $('lanCopy').disabled = true;
      $('lanStatus').textContent = 'Gerando um novo PIN…'; command({ type: 'invite' });
    };
    $('lanStart').onclick = start; $('lanEnd').onclick = function () { if (room) end(); else options.onExit(); };
    $('lanJoin').onclick = answer; $('lanJoinForm').onsubmit = answer;
    $('lanOfferInput').oninput = function () { this.value = this.value.replace(/[^0-9]/g, '').slice(0, 8); };
    $('lanOffer').onclick = function () { this.select(); };
    $('lanCopy').onclick = async function () {
      $('lanOffer').focus(); $('lanOffer').select();
      try { await navigator.clipboard.writeText($('lanOffer').value); $('lanStatus').textContent = 'PIN copiado. Mande para seu amigo.'; }
      catch (_) { $('lanStatus').textContent = 'PIN selecionado. Pressione Ctrl+C para copiar.'; }
    };
    $('lanReturn').onclick = function () { if (current) options.onGame(state()); };
    ['lanHumans', 'lanBots', 'lanRounds', 'lanMap'].forEach(function (id) { $(id).onchange = configure; });
    $('onlineChooseMap').onclick = function () {
      if (!owner() || $('onlineChooseMap').disabled) return;
      options.onChooseMap({ maps: options.maps(), selected: room.info.map, onSelect: function (map) { $('lanMap').value = map.id; configure({ target: $('lanMap') }); } });
    };
    // Reload reconnects with the same capability; explicit Leave always releases the slot.
    try {
      var saved = JSON.parse(sessionStorage.getItem('baller-server-session'));
      if (saved && saved.url === endpoint() && /^[a-f0-9]{48}$/.test(saved.token)) {
        url = saved.url; token = saved.token; room = { id: null, info: null }; options.onLobby(); timer = setInterval(network, 50); open();
      }
    } catch (_) {}
  }
  global.BonkRoom = { init: init, host: host, join: join, start: start, update: update, state: state, flushInput: flushInput,
    transport: function () { return connected ? 'Servidor' : 'Reconectando'; }, active: function () { return !!room; }, isHost: owner,
    playerId: function () { return room && room.id; }, showLobby: function () { if (room) options.onLobby(); }, end: end };
}(typeof globalThis !== 'undefined' ? globalThis : this));
