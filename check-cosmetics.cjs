'use strict';
const assert=require('node:assert/strict'),Core=require('./core.js'),Maps=require('./maps.js'),Prediction=require('./prediction.js');
const map=Maps.maps[0];
for(const skin of Object.keys(Core.SKINS))for(const bowSkin of Object.keys(Core.BOWS)){
 const players=[{id:'p1',skin,bowSkin,bowColor:'#dfab62',color:'#55bbcc'},{id:'p2'}],game=Core.create(map,{players,countdownTicks:0});
 assert.equal(game.state().players[0].skin,skin);assert.equal(game.state().players[0].bowSkin,bowSkin);assert.equal(game.state().players[0].bowColor,'#dfab62');
 for(let i=0;i<20;i++)game.step({p1:{right:true}});const restored=Core.create(map,{players,countdownTicks:0});restored.restore(game.snapshot());assert.deepEqual(restored.state(),game.state());
 const initial=game.state();initial.players.forEach(p=>Object.assign(p,{inputSeq:-1,inputTicks:0}));const prediction=Prediction.create(initial,'p1');prediction.update(Core.PARAMS.dt,{right:true});const view=prediction.state(game.state());assert.equal(view.players[0].skin,skin);assert.equal(view.players[0].bowSkin,bowSkin);assert.equal(view.players[0].bowColor,'#dfab62');
}
for(const mode of Core.MODES){
 const players=[{id:'p1'},{id:'p2'}],before=Core.create({...map,mode},{players,countdownTicks:0}),after=Core.create({...map,mode},{players:players.map(p=>({...p,skin:'pilot',bowSkin:'mechanical'})),countdownTicks:0});
 for(let i=0;i<120;i++){const inputs={p1:{right:i<30,special:i<50,up:i%40<10}};before.step(inputs);after.step(inputs);for(let j=0;j<2;j++)for(const field of ['x','y','vx','vy','radius','aim','charge','cooldown','alive'])assert.equal(before.state().players[j][field],after.state().players[j][field],mode+' '+field);}
}
assert.throws(()=>Core.create(map,{players:[{id:'p1',skin:'<invalid>'}]}),/Aparência/);
assert.throws(()=>Core.create(map,{players:[{id:'p1',bowSkin:'__proto__'}]}),/Aparência/);
assert.equal(Core.create(map,{players:[{id:'p1',skin:'face'}]}).state().players[0].bowSkin,'classic');
console.log('PASS: 180 ball/bow combinations, persistence through replay and guest prediction, legacy default, invalid IDs and unchanged physics in all six modes.');


for(const skin of ['plain','stripe','star','ring','basketball','billiard','stitched']){assert(!Object.hasOwn(Core.SKINS,skin));const p=Core.create(map,{players:[{id:'p1',name:'Preserved',color:'#123456',skin}]}).state().players[0];assert.equal(p.skin,'face');assert.equal(p.bowColor,'#123456');assert.equal(p.name,'Preserved');}
assert.throws(()=>Core.create(map,{players:[{id:'p1',bowColor:'not-a-color'}]}),/Cor do arco/);
console.log('PASS: removed IDs migrate to Carinha; legacy colors and names survive; independent bow color is validated.');

