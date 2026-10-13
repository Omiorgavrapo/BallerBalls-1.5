'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const { createServer } = require('./server.cjs');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
(async () => {
  const app = createServer(); await new Promise(r => app.server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + app.server.address().port;
  const browser = await playwright.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, chromiumSandbox: true });
  const errors = [], external = [], contexts = [], pages = [];
  const qa = path.join(__dirname, '.qa'); fs.mkdirSync(qa, { recursive: true });
  try {
    for (let i = 0; i < 5; i++) {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } }); contexts.push(context);
      const page = await context.newPage(); pages.push(page);
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (!request.url().startsWith(base) && !/^(data|blob):/.test(request.url())) external.push(request.url()); });
      await page.goto(base); await page.locator('[data-action="lan-host"]').waitFor();
    }
    const host = pages[0];
    await host.locator('[data-action="lan-host"]').click();
    await host.waitForFunction(() => BonkRoom.isHost());
    await host.reload(); await host.waitForFunction(() => BonkRoom.isHost());
    await host.locator('#lanLobby.active').waitFor();
    assert.equal(app.service.sessions.size, 1, 'Reload while in lobby also restores its visible screen and slot');
    await host.locator('#lanHumans').fill('5'); await host.locator('#lanHumans').dispatchEvent('change');
    await host.waitForFunction(() => document.getElementById('lanBots').value === '0');
    for (let i = 1; i < 5; i++) {
      await host.locator('#lanInvite').click();
      await host.waitForFunction(() => !document.getElementById('lanCopy').disabled);
      const pin = await host.locator('#lanOffer').inputValue();
      await pages[i].locator('[data-action="lan-join"]').click(); await pages[i].locator('#lanOfferInput').fill(pin);
      await pages[i].locator('#lanJoin').click(); await pages[i].waitForFunction(() => BonkRoom.playerId() !== null);
      await host.waitForFunction(count => document.getElementById('lanSummary').textContent === count + '/5 humanos', i + 1);
    }
    await host.locator('#lanStart').click();
    await Promise.all(pages.map(page => page.waitForFunction(() => BonkRoom.state() && BonkRoom.state().phase === 'playing')));
    await pages[1].keyboard.down('ArrowRight');
    await pages[1].waitForFunction(() => BonkRoom.state().players.find(p => p.id === 'g1').controls.right);
    await pages[1].keyboard.up('ArrowRight');
    const initial = await pages[1].evaluate(() => BonkRoom.state().tick);
    await contexts[0].setOffline(true);
    await pages[1].waitForFunction(tick => BonkRoom.state().tick > tick + 80, initial);
    await contexts[0].setOffline(false);
    await host.reload(); await host.waitForFunction(() => BonkRoom.playerId() === 'h1' && BonkRoom.state());
    assert.equal(app.service.sessions.size, 5, 'Reload recovers the owner instead of allocating another session');
    const metrics = await pages[1].evaluate(async () => {
      const begin = performance.now(); let frames = 0;
      await new Promise(resolve => { function sample(at) { frames++; if (at - begin >= 1500) resolve(); else requestAnimationFrame(sample); } requestAnimationFrame(sample); });
      return { fps: Math.round(frames * 1000 / (performance.now() - begin)), tick: BonkRoom.state().tick, transport: BonkRoom.transport(), players: BonkRoom.state().players.length };
    });
    await pages[1].screenshot({ path: path.join(qa, 'server-five-players.png') });
    await host.locator('#pauseButton').click(); await host.locator('#lanEnd').click();
    await pages[1].waitForFunction(() => BonkRoom.isHost());
    const continued = await pages[1].evaluate(() => BonkRoom.state().tick);
    await pages[1].waitForFunction(tick => BonkRoom.state().tick > tick + 20, continued);
    for (let i = 1; i < 5; i++) await pages[i].evaluate(() => BonkRoom.end());
    await pages[1].waitForFunction(() => !BonkRoom.active());
    // The offline entry point still plays without any compute URL.
    const local = await browser.newPage(); await local.goto('file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/'));
    await local.locator('[data-action="quick"]').click(); await local.locator('.mode-card').first().click();
    await local.locator('#startButton').click();
    await local.locator('#gameHud.active').waitFor();
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    fs.writeFileSync(path.join(qa, 'server-browser-results.json'), JSON.stringify({ ...metrics, errors, external, simulatedHours: 3, productionDeployed: false }, null, 2));
    console.log('PASS Chrome: five players, real keys, disconnected owner does not stop match, owner reload resumes, owner Leave transfers controls, local offline game, no Firebase/network dependencies or page errors.');
    console.log(JSON.stringify(metrics));
  } finally { await browser.close(); await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
