'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const packages=path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const pw=require(path.join(packages,'playwright')),sharp=require(path.join(packages,'sharp'));
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'assets/skins/manifest.json')));
 assert.equal(Object.keys(manifest.balls).length,30);assert.equal(Object.keys(manifest.bows).length,6);
 for(const asset of manifest.assets){
  const {data,info}=await sharp(path.join(__dirname,'assets/skins',asset.texture)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.channels,4);let transparent=0,opaque=0;
  for(let i=0;i<data.length;i+=4){if(data[i+3]>8){assert.equal(data[i],data[i+1]);assert.equal(data[i+1],data[i+2]);}if(data[i+3]<8)transparent++;if(data[i+3]>240)opaque++;}
  assert(transparent>100&&opaque>1000,asset.id+' needs true transparency and visible pixels');
 }
 const code=fs.readFileSync(path.join(__dirname,'skin-art.js'),'utf8');assert(!/getContext|createElement\(['"]canvas|<path|<circle/.test(code),'Skin module filters real PNGs; no procedural or Canvas artwork');
 const browser=await pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,chromiumSandbox:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[],remote=[];
  const target=process.env.BONK_QA_URL||pathToFileURL(path.join(__dirname,'index.html')).href;
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!/^(file|data|blob):/.test(r.url())&&!(process.env.BONK_QA_URL&&r.url().startsWith(process.env.BONK_QA_URL)))remote.push(r.url());});
  await page.goto(target);await page.evaluate(()=>BonkSkinArt.ready);
  await page.locator('[data-action="skins"]').click();assert.equal(await page.locator('.skin-card').count(),30);
  assert.equal(await page.locator('.appearance-layout canvas').count(),0,'Appearance previews are images, never Canvas');
  await page.locator('[data-skin="fox"]').click();await page.locator('#skinColor').fill('#e65b37');await page.locator('#skinColor').dispatchEvent('input');
  await page.waitForFunction(()=>document.getElementById('outfitBall').complete&&document.getElementById('outfitBall').naturalWidth>0);
  const red=await page.locator('#outfitBall').screenshot();
  await page.locator('#skinColor').fill('#378fdf');await page.locator('#skinColor').dispatchEvent('input');
  await page.waitForFunction(()=>document.getElementById('outfitBall').complete&&document.getElementById('outfitBall').naturalWidth>0);
  const blue=await page.locator('#outfitBall').screenshot();
  const stats=await Promise.all([red,blue].map(image=>sharp(image).stats()));
  assert(stats[0].channels[0].mean>stats[1].channels[0].mean+15,'Tint must actually change rendered red channel');
  assert(stats[1].channels[2].mean>stats[0].channels[2].mean+15,'Tint must actually change rendered blue channel');
  await page.locator('#bowSkinsTab').click();assert.equal(await page.locator('.skin-card').count(),6);
  await page.locator('[data-skin="drake"]').click();await page.locator('#bowColor').fill('#83be69');await page.locator('#bowColor').dispatchEvent('input');
  await page.locator('#skinsDone').click();await page.reload();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bonk-local-settings')).p1);
  assert.equal(saved.skin,'fox');assert.equal(saved.color,'#378fdf');assert.equal(saved.bowSkin,'drake');assert.equal(saved.bowColor,'#83be69');
  const checks=await page.evaluate(async()=>{
   let canvas=0;const create=document.createElement.bind(document);document.createElement=function(name,...args){if(name==='canvas')canvas++;return create(name,...args);};
   try{for(const kind of ['ball','bow'])for(const id of Object.keys(BonkSkinTextures[kind]))for(const color of ['#151b24','#e8e6df','#c4779a'])await BonkSkinArt.preload(kind,id,color);
    for(let i=0;i<100;i++)await BonkSkinArt.preload('ball','face','#'+(i*100123%16777215).toString(16).padStart(6,'0'));
    const img=BonkSkinArt.sprite('ball','face','#f6ae37');return{canvas,cache:BonkSkinArt.cacheSize(),image:img instanceof HTMLImageElement};
   }finally{document.createElement=create;}
  });assert.equal(checks.canvas,0);assert(checks.cache<=96);assert(checks.image);
  await page.locator('[data-action="skins"]').click();await page.locator('#ballSkinsTab').click();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.skin-card img')).every(i=>i.complete&&i.naturalWidth>0));
  fs.mkdirSync(path.join(__dirname,'.qa'),{recursive:true});await page.screenshot({path:path.join(__dirname,process.env.BONK_QA_URL?'.qa/generated-skins-live.png':'.qa/generated-skins-ui.png')});
  await page.setViewportSize({width:390,height:844});assert(await page.locator('.appearance-layout').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  console.log('PASS: 30 generated grayscale PNG balls + 6 bows; real alpha; actual red/blue tint; 108 color variants; zero Canvas creation in skin engine/previews; offline; persistence; bounded 96-image cache; mobile layout.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
