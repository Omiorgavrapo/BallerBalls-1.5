'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const browser=await pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,chromiumSandbox:true});try{
 const page=await browser.newPage({viewport:{width:1366,height:900}});await page.goto(process.env.BONK_QA_URL||pathToFileURL(path.join(__dirname,'index.html')).href);await page.locator('[data-action="skins"]').click();
 const result=await page.evaluate(async()=>{const cards=Array.from(document.querySelectorAll('.skin-card')),images=cards.map(c=>c.querySelector('img'));const start=performance.now();
  for(let i=0;i<30;i++){const input=document.getElementById('skinColor');input.value='#'+((i+1)*123457).toString(16).padStart(6,'0');input.dispatchEvent(new Event('input',{bubbles:true}));}
  const colorMs=performance.now()-start,select=performance.now();for(let i=0;i<30;i++)document.querySelectorAll('.skin-card')[i%30].click();
  const selectionMs=performance.now()-select;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  return{colorMs:Math.round(colorMs),selectionMs:Math.round(selectionMs),sameCards:cards.every((c,i)=>c===document.querySelectorAll('.skin-card')[i]),sameImages:images.every((c,i)=>c===document.querySelectorAll('.skin-card img')[i])};
 });assert(result.sameCards&&result.sameImages,'Skin selection must reuse cards and images');console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

