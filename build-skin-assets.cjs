'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
let sharp;
try { sharp = require('sharp'); } catch (_) { sharp = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')); }
const balls = {
  face:'Carinha', pilot:'Piloto', sentinel:'Sentinela', miner:'Garimpeiro', racer:'Grid', football:'Camisa 10', tennis:'Match Point', wizard:'Arcano', dragon:'Draco', robot:'Autômato',
  cat:'Gato', panda:'Panda', fox:'Raposa', owl:'Coruja', shark:'Tubarão', penguin:'Pinguim', frog:'Sapo', bear:'Urso', ghost:'Fantasminha', astronaut:'Astronauta', ninja:'Ninja', samurai:'Samurai', pirate:'Pirata', alien:'Alien', crown:'Coroa', crystal:'Cristal', moon:'Lua', lava:'Magma', cloud:'Nuvem', slime:'Slime'
};
const bows = { classic:'Madeira', sport:'Recurvo', mechanical:'Mecânico', crescent:'Meia-lua', pixel:'Blocos', drake:'Espinha de dragão' };
const palette=['#c7b9ed','#aa9bd4','#fff2da','#efb6c4','#4d5267'];
const paletteRGB=palette.map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));
const root = __dirname, source = path.join(root, 'assets/skins/pastel-generated'), output = path.join(root, 'assets/skins/textures');
async function build() {
  fs.mkdirSync(output, { recursive:true });
  const textures = { ball:{}, bow:{} }, layers={ball:{},bow:{}}, manifest = [];
  for (const [kind, catalogue] of Object.entries({ ball:balls, bow:bows })) for (const [id, label] of Object.entries(catalogue)) {
    const name = kind === 'bow' ? 'bow-' + id : id, file = path.join(source, name + '.png');
    if (!fs.existsSync(file)) throw Error('Missing generated image: ' + name);
    const original = fs.readFileSync(file), {data, info} = await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const rows = new Uint32Array(info.height), columns = new Uint32Array(info.width);
    for (let y=0; y<info.height; y++) for (let x=0; x<info.width; x++) if (data[(y*info.width+x)*4+3]>220) { rows[y]++; columns[x]++; }
    // Ignore isolated alpha flecks left by generation when measuring the sprite.
    const minRow = Math.max(3, Math.floor(info.width * .01)), minColumn = Math.max(3, Math.floor(info.height * .01));
    let left=0, right=info.width-1, top=0, bottom=info.height-1;
    while (left<right && columns[left]<minColumn) left++;
    while (right>left && columns[right]<minColumn) right--;
    while (top<bottom && rows[top]<minRow) top++;
    while (bottom>top && rows[bottom]<minRow) bottom--;
    const width=right-left+1, height=bottom-top+1;
    if (width<50 || height<50) throw Error('Empty generated sprite: ' + name);
    let image = sharp(original).extract({left,top,width,height}).toColourspace('srgb').ensureAlpha();
    if (kind === 'ball') image = image.resize(256,256,{fit:'fill'});
    else image = image.resize(128,256,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}});
    let normalized = await image.raw().toBuffer({resolveWithObject:true});
    if (normalized.info.channels !== 4) throw Error('RGBA conversion failed: '+name);
    // Palette RGB below is straight alpha, even when Sharp premultiplied during resizing.
    normalized.info.premultiplied=false;
    // Enforce the five flat colors while retaining the generated shapes and edge alpha.
    const usage=new Array(palette.length).fill(0);
    const allowed=id==='tennis'?[0,2]:[0,1,2,3,4];
    for (let offset=0;offset<normalized.data.length;offset+=4) {
      let best=0,distance=Infinity;
      allowed.forEach(index=>{const rgb=paletteRGB[index];
        const value=rgb.reduce((sum,channel,i)=>sum+(normalized.data[offset+i]-channel)**2,0);
        if(value<distance){distance=value;best=index;}
      });
      paletteRGB[best].forEach((channel,i)=>{normalized.data[offset+i]=channel;});
      if(normalized.data[offset+3]>220)normalized.data[offset+3]=255;
      if(normalized.data[offset+3]>220)usage[best]++;
    }
    if (kind === 'ball') {
      // The physics is a disc: clip only the outside edge, keeping all generated interior pixels.
      const {data: pixels, info: size} = normalized, radius=127.5;
      for (let y=0;y<size.height;y++) for(let x=0;x<size.width;x++) {
        const distance=Math.hypot(x-127.5,y-127.5), coverage=Math.max(0,Math.min(1,radius+.5-distance));
        // Tennis has two colors and unwanted interior transparency in the native output.
        const offset=(y*size.width+x)*4+3; pixels[offset]=Math.round((id==='tennis'?255:pixels[offset])*coverage);
      }
    }
    const png = await sharp(normalized.data,{raw:normalized.info}).png({compressionLevel:9}).toBuffer();
    fs.writeFileSync(path.join(output,name+'.png'),png);
    textures[kind][id] = 'data:image/png;base64,'+png.toString('base64');
    const separated={primary:Buffer.alloc(normalized.data.length),shade:Buffer.alloc(normalized.data.length),details:Buffer.alloc(normalized.data.length)};
    for(let offset=0;offset<normalized.data.length;offset+=4){
      const layer=normalized.data[offset]===paletteRGB[0][0]?'primary':normalized.data[offset]===paletteRGB[1][0]?'shade':'details';
      const target=separated[layer];for(let i=0;i<3;i++)target[offset+i]=layer==='details'?normalized.data[offset+i]:255;
      target[offset+3]=normalized.data[offset+3];
    }
    layers[kind][id]={};const layerFiles={};
    for(const [layer,data] of Object.entries(separated)){
      const image=await sharp(data,{raw:normalized.info}).png({compressionLevel:9}).toBuffer();
      fs.writeFileSync(path.join(output,name+'-'+layer+'.png'),image);
      layers[kind][id][layer]='data:image/png;base64,'+image.toString('base64');
      layerFiles[layer]={texture:'textures/'+name+'-'+layer+'.png',bytes:image.length,sha256:crypto.createHash('sha256').update(image).digest('hex')};
    }
    manifest.push({kind,id,label,source:'pastel-generated/'+name+'.png',texture:'textures/'+name+'.png',layers:layerFiles,width:normalized.info.width,height:normalized.info.height,paletteUsage:usage,adaptation:id==='tennis'?'two-color-quantization-solid-disc-alpha':'five-color-quantization',bytes:png.length,sha256:crypto.createHash('sha256').update(png).digest('hex')});
  }
  fs.writeFileSync(path.join(root,'skin-textures.js'),'/* Generated flat pastel PNGs and color masks, embedded for offline play. */\nwindow.BonkSkinPalette='+JSON.stringify(palette)+';\nwindow.BonkSkinTextures='+JSON.stringify(textures)+';\nwindow.BonkSkinLayers='+JSON.stringify(layers)+';\n');
  fs.writeFileSync(path.join(root,'assets/skins/manifest.json'),JSON.stringify({generator:'Built-in image_gen',style:'flat-pastel-five-colors',palette,balls,bows,assets:manifest},null,2));
  console.log('PASS: '+Object.keys(balls).length+' generated ball PNGs + '+Object.keys(bows).length+' generated bow PNGs; '+manifest.reduce((sum,m)=>sum+m.bytes+Object.values(m.layers).reduce((s,l)=>s+l.bytes,0),0)+' bytes including color masks. Originals preserved.');
}
if(require.main===module)build().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={balls,bows,build};
