/* Recolor real grayscale PNGs with a browser image filter; no Canvas artwork. */
(function(root){'use strict';
var sources=root.BonkSkinTextures,cache=new Map(),base={},LIMIT=96;
if(!sources)throw Error('Extraia a pasta inteira, incluindo skin-textures.js.');
function color(value){return /^#[0-9a-f]{6}$/i.test(value||'')?value.toLowerCase():'#dc7885';}
function uri(kind,id,value){
 var png=sources[kind]&&sources[kind][id];if(!png)return '';
 var c=color(value),rgb=[1,3,5].map(function(offset){return parseInt(c.slice(offset,offset+2),16)/255;}),width=kind==='bow'?64:128;
 var transfer=rgb.map(function(channel,i){return '<feFunc'+['R','G','B'][i]+' type="table" tableValues="0 '+channel.toFixed(5)+' 1"/>';}).join('');
 var svg='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+width+'" height="128" viewBox="0 0 '+width+' 128"><defs><filter id="t" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feComponentTransfer>'+transfer+'</feComponentTransfer></filter></defs><image width="100%" height="100%" xlink:href="'+png+'" filter="url(#t)"/></svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function load(source){var image=new Image();var promise=new Promise(function(resolve,reject){image.onload=function(){resolve(image);};image.onerror=function(){reject(Error('Não foi possível carregar uma textura de skin.'));};});image.src=source;return {image:image,promise:promise,loaded:false};}
function entry(kind,id,value){
 var key=kind+':'+id+':'+color(value),found=cache.get(key);if(found){cache.delete(key);cache.set(key,found);return found;}
 var source=uri(kind,id,value);if(!source)return null;
 var item=load(source);item.promise.then(function(){item.loaded=true;}).catch(function(){cache.delete(key);});cache.set(key,item);
 if(cache.size>LIMIT)cache.delete(cache.keys().next().value);return item;
}
function sprite(kind,id,value){var item=entry(kind,id,value);return item&&item.loaded?item.image:base[kind+':'+id]||null;}
function preload(kind,id,value){var item=entry(kind,id,value);return item?item.promise:Promise.reject(Error('Skin não encontrada.'));}
var ready=Promise.all(Object.keys(sources).map(function(kind){return Promise.all(Object.keys(sources[kind]).map(function(id){var item=load(sources[kind][id]);return item.promise.then(function(image){base[kind+':'+id]=image;});}));})).then(function(){
 return Promise.all([['ball','face','#dc7885'],['ball','pilot','#6b9ccf'],['bow','classic','#dc7885']].map(function(v){return preload(v[0],v[1],v[2]);}));
});
root.BonkSkinArt={ready:ready,sprite:sprite,url:uri,preload:preload,cacheSize:function(){return cache.size;},kind:'generated-png'};
}(typeof globalThis!=='undefined'?globalThis:this));
