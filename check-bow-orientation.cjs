'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const packages=path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'),sharp=require(path.join(packages,'sharp')),pw=require(path.join(packages,'playwright'));
(async()=>{
 const env={window:{}};require('node:vm').runInNewContext(fs.readFileSync(path.join(__dirname,'skin-textures.js'),'utf8'),env);
 for(const [id,layers]of Object.entries(env.window.BonkSkinLayers.bow)){
  const {data,info}=await sharp(Buffer.from(layers.primary.split(',')[1],'base64')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let weight=0,sum=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*4+3];weight+=a;sum+=x*a;}
  assert(sum/weight>env.window.BonkSkinBowAnchors[id].stringX+4,id+' limbs face the shooting direction, to the right of the string');
 }
 const browser=await pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,chromiumSandbox:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:960}});await page.goto(process.env.BONK_QA_URL||pathToFileURL(path.join(__dirname,'index.html')).href);await page.evaluate(()=>BonkSkinArt.ready);await page.locator('[data-action="skins"]').click();
  const result=await page.evaluate(async()=>{
   const area=document.createElement('section');area.style.cssText='position:fixed;inset:0;z-index:10000;overflow:auto;background:#172e38;color:#fff4df;padding:24px;font:18px Jost,sans-serif';area.innerHTML='<h1>Arcos na partida • tiro para a direita →</h1><div id="bowGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px"></div>';document.body.appendChild(area);
   const checks=[];
   for(const id of Object.keys(BonkCore.BOWS)){
    const color=BonkSkinArt.defaultColor('bow',id);await BonkSkinArt.preload('bow',id,color);await BonkSkinArt.preload('ball','face',BonkSkinArt.defaultColor('ball','face'));
    const p={x:40,y:40,radius:16,color:BonkSkinArt.defaultColor('ball','face'),skin:'face',bowSkin:id,bowColor:color,aim:0,charge:.7,cooldown:0,controls:{special:true}};
    const draws=[],clips=[],mock=new Proxy({}, {get:(t,key)=>key in t?t[key]:(...args)=>{if(key==='drawImage'&&args[0].naturalWidth===128)draws.push(args.slice(1));if(key==='rect')clips.push(args);},set:(t,key,value)=>{t[key]=value;return true;}});
    BonkRender.disc(mock,p,'arrows');
    const anchor=BonkSkinBowAnchors[id],draw=draws[0],br=Math.max(13,16*.85),tipX=16*.65+7+Math.cos(1.05)*br,tipY=Math.sin(1.05)*br;
    checks.push({id,clipLeft:clips[0][0],bodyLeft:anchor.bodyLeft,destLeft:draw[0],tipX,scale:draw[2]/128,stringX:anchor.stringX,top:anchor.top,bottom:anchor.bottom,destTop:draw[1],tipY});
    const tile=document.createElement('article');tile.style.cssText='background:#223e49;border-radius:14px;padding:12px';const label=document.createElement('div');label.textContent=BonkCore.BOWS[id];tile.appendChild(label);const canvas=document.createElement('canvas');canvas.width=460;canvas.height=230;canvas.style.width='100%';tile.appendChild(canvas);document.getElementById('bowGrid').appendChild(tile);const ctx=canvas.getContext('2d');ctx.scale(2.4,2.4);BonkRender.disc(ctx,p,'arrows');
   }
   return checks;
  });
  for(const c of result){assert(c.clipLeft>c.tipX,c.id+' baked string is clipped out, limbs face the shot');assert(Math.abs(c.destLeft+c.stringX*c.scale-c.tipX)<1e-7);assert(Math.abs(c.clipLeft-c.destLeft-c.bodyLeft*c.scale)<1e-7);assert(Math.abs(c.destTop+c.top*c.scale+c.tipY)<1e-7);assert(Math.abs(c.destTop+c.bottom*c.scale-c.tipY)<1e-7);}
  fs.mkdirSync(path.join(__dirname,'.qa'),{recursive:true});await page.screenshot({path:path.join(__dirname,'.qa/bow-orientation.png')});console.log('PASS: all 6 bows face the shot; PNG limbs align with both dynamic-string endpoints; baked string excluded; actual arena renderer preview saved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
