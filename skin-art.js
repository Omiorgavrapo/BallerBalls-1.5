/* Tint PNG alpha masks, preserving the generated detail colors. No Canvas. */
(function(root){'use strict';
var sources=root.BonkSkinTextures,layers=root.BonkSkinLayers,palettes=root.BonkSkinPalettes,cache=new Map(),base={},LIMIT=96;
if(!sources||!layers||!palettes)throw Error('Extraia a pasta inteira, incluindo skin-textures.js.');
function color(value){return /^#[0-9a-f]{6}$/i.test(value||'')?value.toLowerCase():'#dc7885';}
function defaultColor(kind,id){return palettes[kind]&&palettes[kind][id]?palettes[kind][id][0]:'#dc7885';}
function tones(value,kind,id){var own=palettes[kind]&&palettes[kind][id],c=color(value||defaultColor(kind,id)),rgb=[1,3,5].map(function(i){return parseInt(c.slice(i,i+2),16);}),shade=own&&c===own[0]? [1,3,5].map(function(i){return parseInt(own[1].slice(i,i+2),16);}):rgb.map(function(n){return Math.round(n*.86);});return [rgb,shade].map(function(v){return '0 0 0 0 '+v[0]/255+' 0 0 0 0 '+v[1]/255+' 0 0 0 0 '+v[2]/255+' 0 0 0 1 0';});}
function filterMarkup(prefix,kind,id,value){
 var item=kind&&layers[kind]&&layers[kind][id],matrix=tones(value,kind,id);
 function input(layer,result){return '<feImage data-layer="'+layer+'"'+(item?' href="'+item[layer]+'"':'')+' x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid meet" result="'+result+'"/>';}
 return '<filter id="'+prefix+'" x="0" y="0" width="100%" height="100%" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">'+input('primary','primary')+'<feColorMatrix data-tone="primary" in="primary" values="'+matrix[0]+'" result="p"/>'+input('shade','shade')+'<feColorMatrix data-tone="shade" in="shade" values="'+matrix[1]+'" result="s"/><feComposite in="p" in2="s" operator="arithmetic" k2="1" k3="1" result="paint"/>'+input('details','details')+'<feComposite in="paint" in2="details" operator="arithmetic" k2="1" k3="1"/></filter>';
}
function updateFilter(filter,kind,id,value){
 var changed=filter.dataset.skin!==id;
 if(changed){var item=layers[kind][id];['primary','shade','details'].forEach(function(layer){filter.querySelector('[data-layer="'+layer+'"]').setAttribute('href',item[layer]);});filter.dataset.skin=id;}
 var c=color(value||defaultColor(kind,id));if(changed||filter.dataset.color!==c){var matrix=tones(c,kind,id);['primary','shade'].forEach(function(tone,i){filter.querySelector('[data-tone="'+tone+'"]').setAttribute('values',matrix[i]);});filter.dataset.color=c;}
}
function uri(kind,id,value){
 var png=sources[kind]&&sources[kind][id];if(!png)return '';
 var width=kind==='bow'?128:256;
 var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="256" viewBox="0 0 '+width+' 256"><defs>'+filterMarkup('t',kind,id,value)+'</defs><image width="100%" height="100%" href="'+png+'" filter="url(#t)"/></svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function load(source){var image=new Image();var promise=new Promise(function(resolve,reject){image.onload=function(){resolve(image);};image.onerror=function(){reject(Error('Não foi possível carregar uma textura de skin.'));};});image.src=source;return {image:image,promise:promise,loaded:false};}
function entry(kind,id,value){
 value=value||defaultColor(kind,id);var key=kind+':'+id+':'+color(value),found=cache.get(key);if(found){cache.delete(key);cache.set(key,found);return found;}
 var source=uri(kind,id,value);if(!source)return null;
 var item=load(source);item.promise.then(function(){item.loaded=true;}).catch(function(){cache.delete(key);});cache.set(key,item);
 if(cache.size>LIMIT)cache.delete(cache.keys().next().value);return item;
}
function sprite(kind,id,value){var item=entry(kind,id,value);return item&&item.loaded?item.image:base[kind+':'+id]||null;}
function preload(kind,id,value){var item=entry(kind,id,value);return item?item.promise:Promise.reject(Error('Skin não encontrada.'));}
var ready=Promise.all(Object.keys(sources).map(function(kind){return Promise.all(Object.keys(sources[kind]).map(function(id){var item=load(sources[kind][id]);return item.promise.then(function(image){base[kind+':'+id]=image;});}));})).then(function(){
 return Promise.all([['ball','face'],['ball','pilot'],['bow','classic']].map(function(v){return preload(v[0],v[1],defaultColor(v[0],v[1]));}));
});
root.BonkSkinArt={ready:ready,sprite:sprite,url:uri,preload:preload,filterMarkup:filterMarkup,updateFilter:updateFilter,defaultColor:defaultColor,cacheSize:function(){return cache.size;},kind:'generated-png'};
}(typeof globalThis!=='undefined'?globalThis:this));
