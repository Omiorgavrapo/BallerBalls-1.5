'use strict';
const assert=require('node:assert/strict'),{WebSocket}=require('ws'),{VERSION}=require('./server-room.cjs');
const base=process.env.BONK_SERVER_URL||'https://baller-balls.onrender.com';
const profile=i=>({name:'QA '+i,color:'#82b18d',skin:i===0?'fox':i===1?'astronaut':'crystal',bowSkin:'drake',bowColor:'#d7ab53'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function client(){
 const ws=new WebSocket(base.replace(/^http/,'ws')+'/play'),queue=[];let states=0,previousTick=-1,regressions=0;
 ws.on('error',()=>{});ws.on('message',data=>{const m=JSON.parse(data);if(m.type==='state'){states++;if(m.state.tick<previousTick)regressions++;previousTick=m.state.tick;}queue.push(m);if(queue.length>200)queue.shift();});
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Online WebSocket timed out')),20000);ws.once('open',()=>{clearTimeout(t);resolve();});ws.once('error',reject);});
 return{ws,send:m=>ws.send(JSON.stringify(m)),stats:()=>({states,previousTick,regressions}),async wait(type){for(let n=0;n<500;n++){const i=queue.findIndex(m=>m.type===type);if(i>=0)return queue.splice(i,1)[0];await sleep(20);}throw Error('Missing '+type);}};
}
(async()=>{
 const health=await(await fetch(base+'/healthz')).json();assert.equal(health.version,VERSION);
 const html=await(await fetch(base)).text();assert(html.includes('skin-textures.js'));assert(html.includes('server-client.js'));assert(!html.includes('<script src="online.js"'));
 const textures=await(await fetch(base+'/skin-textures.js')).text();assert(textures.includes('"fox":'));assert(textures.includes('"drake":'));
 const clients=[];
 try{
  const host=await client();clients.push(host);host.send({type:'create',version:VERSION,profile:profile(0)});const welcome=await host.wait('welcome'),room=await host.wait('room');
  host.send({type:'configure',humans:5,bots:0,rounds:20,mapId:room.mapId,rules:room.rules});await host.wait('room');
  for(let i=1;i<5;i++){host.send({type:'invite'});const pin=(await host.wait('invite')).pin;const guest=await client();clients.push(guest);guest.send({type:'join',version:VERSION,pin,profile:profile(i)});assert.equal((await guest.wait('welcome')).id,'g'+i);}
  host.send({type:'start'});const starts=await Promise.all(clients.map(c=>c.wait('start')));assert.equal(starts[0].state.players.length,5);assert.equal(starts[0].state.players[0].skin,'fox');
  const rtt=[];for(let i=0;i<5;i++){const at=performance.now();clients[1].send({type:'ping',time:at});await clients[1].wait('pong');rtt.push(Math.round(performance.now()-at));}
  await sleep(4000);const before=clients[1].stats().previousTick;
  host.ws.terminate();await sleep(1500);assert(clients[1].stats().previousTick>before+50,'Owner disconnected; server still runs');
  const resume=await client();clients.push(resume);resume.send({type:'resume',version:VERSION,token:welcome.token});assert.equal((await resume.wait('welcome')).id,'h1');await resume.wait('start');
  clients.slice(1,5).forEach(c=>assert.equal(c.stats().regressions,0));
  console.log('PASS production: HTTPS frontend and generated textures, 5 players, new skins synchronized, independent server physics, owner disconnect/resume, ordered states.');
  console.log(JSON.stringify({url:base,version:health.version,rttMs:rtt,guest:clients[1].stats()}));
 }finally{for(const c of clients){if(c.ws.readyState===1)c.send({type:'leave'});c.ws.close();}await sleep(250);clients.forEach(c=>c.ws.terminate());}
})().catch(e=>{console.error(e);process.exitCode=1;});
