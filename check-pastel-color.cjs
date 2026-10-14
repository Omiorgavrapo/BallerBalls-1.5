'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const packages=path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const sharp=require(path.join(packages,'sharp')),pw=require(path.join(packages,'playwright'));
(async()=>{
 const palette=['#c7b9ed','#aa9bd4','#fff2da','#efb6c4','#4d5267'];
 const rgb=palette.map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));
 // Five uniform stripes are a filter fixture, never shipped as artwork.
 const pixels=Buffer.alloc(256*256*4),masks={primary:Buffer.alloc(pixels.length),shade:Buffer.alloc(pixels.length),details:Buffer.alloc(pixels.length)};
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const p=(y*256+x)*4,index=Math.min(4,Math.floor(x/52)),layer=index===0?'primary':index===1?'shade':'details';rgb[index].forEach((c,i)=>{pixels[p+i]=c;masks[layer][p+i]=layer==='details'?c:255;});pixels[p+3]=masks[layer][p+3]=255;}
 const encode=async data=>'data:image/png;base64,'+(await sharp(data,{raw:{width:256,height:256,channels:4}}).png().toBuffer()).toString('base64');
 const png=await encode(pixels),layers={};for(const [key,data]of Object.entries(masks))layers[key]=await encode(data);
 const browser=await pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,chromiumSandbox:true});
 try{
  const page=await browser.newPage();
  await page.evaluate(({palette,png,layers})=>{window.BonkSkinPalette=palette;window.BonkSkinTextures={ball:{face:png,pilot:png},bow:{classic:png}};window.BonkSkinLayers={ball:{face:layers,pilot:layers},bow:{classic:layers}};},{palette,png,layers});
  await page.addScriptTag({path:path.join(__dirname,'skin-art.js')});await page.evaluate(()=>BonkSkinArt.ready);
  for(const color of ['#e65b37','#378fdf','#000000','#ffffff','#c7b9ed']){
   const actual=await page.evaluate(async color=>{const img=await BonkSkinArt.preload('ball','face',color),c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,128,128);return {samples:[13,39,65,91,117].map(x=>Array.from(ctx.getImageData(x,64,1,1).data)),edges:Array.from({length:50},(_,x)=>Array.from(ctx.getImageData(x,64,1,1).data))};},color);
   const primary=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
   const expected=[primary,primary.map(c=>Math.round(c*.86)),...rgb.slice(2)];
   actual.samples.forEach((pixel,index)=>{assert.equal(pixel[3],255);expected[index].forEach((c,i)=>assert(Math.abs(c-pixel[i])<=1,`${color}: palette ${index} channel ${i}: ${pixel[i]} != ${c}`));});
   for(const p of actual.edges){assert(p[3]>=254,'Scaled seams stay opaque');if(color==='#e65b37')assert(p[0]>p[2]+20,'Red seams have no original lavender fringe');if(color==='#378fdf')assert(p[2]>p[0]+20,'Blue seams have no original lavender fringe');}
  }
  console.log('PASS: actual browser rendering changes only primary/shadow; cream, rose and ink stay identical for red, blue, black, white and lavender.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
