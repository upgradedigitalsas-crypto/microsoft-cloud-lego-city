import * as THREE from 'three';
import { minifig } from './lego.js';
import { isIslandLand } from './terrain.js';
import { inLake } from './urban.js';

export function createWalkMode(scene,world,sim,camera,controls,onEnter){
 const avatar=minifig('#5900FF','#263A58');avatar.scale.setScalar(1.15);avatar.visible=false;scene.add(avatar);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1,.08,6,24),new THREE.MeshBasicMaterial({color:'#79F6F5'}));ring.rotation.x=Math.PI/2;ring.position.y=.1;avatar.add(ring);
 const button=document.getElementById('cam-walk'),panel=document.getElementById('walk-panel'),status=document.getElementById('walk-status');
 const controller=new AbortController(),options={signal:controller.signal},keys=new Set(),held=new Map();
 let active=false,yaw=0,pitch=-.34,phase=0,saved=null,drag=null,uiTime=0;
 const next=new THREE.Vector3(),eye=new THREE.Vector3(),look=new THREE.Vector3();
 world.walker={group:avatar,get active(){return active;}};
 const walls=[...[...world.buildings.values()].map(b=>[b.group.position.x-14.8,b.group.position.z-13.8,b.group.position.x+14.8,b.group.position.z+13.8]),[-11.8,-10.8,11.8,10.8],[211,55,233,67],[228,44,238,54]];
 const wall=(x,z)=>walls.some(([l,t,r,b])=>x>l&&x<r&&z>t&&z<b);
 function blocked(x,z){
   const bridge=Math.abs(x)<1.65&&z>=10.8&&z<=36;
   if(!isIslandLand(x,z)||wall(x,z)||(inLake(x,z)&&!bridge)||x>239)return true;
   if(sim.vehicles.some(v=>Math.hypot(x-v.group.position.x,z-v.group.position.z)<4.3))return true;
   return sim.customers.people.some(p=>Math.hypot(x-p.group.position.x,z-p.group.position.z)<1.8);
 }
 function stop(){keys.clear();held.clear();drag=null;}
 function setActive(value){
   if(active===value)return;
   active=value;stop();button.setAttribute('aria-pressed',String(active));panel.hidden=!active;document.body.classList.toggle('walking',active);
   if(active){saved={position:camera.position.clone(),target:controls.target.clone()};onEnter();controls.enabled=false;avatar.position.set(222,.75,70);yaw=0;pitch=-.34;avatar.rotation.y=yaw;avatar.visible=true;follow(1);document.getElementById('walk-exit').focus();}
   else {avatar.visible=false;controls.enabled=true;camera.position.copy(saved.position);controls.target.copy(saved.target);controls.update();button.focus();}
 }
 function follow(dt){
   look.copy(avatar.position);look.y+=2.5;
   const distance=6.5;
   eye.set(avatar.position.x-Math.sin(yaw)*distance,avatar.position.y+4.8,avatar.position.z-Math.cos(yaw)*distance);
   // Pull in the camera before it can pass behind a wall.
   for(let f=.15;f<=1;f+=.1){const x=THREE.MathUtils.lerp(look.x,eye.x,f),z=THREE.MathUtils.lerp(look.z,eye.z,f);if(wall(x,z)){eye.lerpVectors(look,eye,Math.max(.1,f-.1));break;}}
   camera.position.lerp(eye,1-Math.exp(-12*dt));
   // Look freely from the follow camera without raising the avatar off the ground.
   look.set(camera.position.x+Math.sin(yaw)*Math.cos(pitch)*10,camera.position.y+Math.sin(pitch)*10,camera.position.z+Math.cos(yaw)*Math.cos(pitch)*10);
   camera.lookAt(look);controls.target.copy(look);
 }
 button.addEventListener('click',()=>setActive(!active),options);
 document.getElementById('walk-exit').addEventListener('click',()=>setActive(false),options);
 const keyMap={ArrowUp:'forward',w:'forward',W:'forward',ArrowDown:'back',s:'back',S:'back',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
 window.addEventListener('keydown',e=>{if(!active||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='Escape'){setActive(false);return;}if(keyMap[e.key]){e.preventDefault();keys.add(keyMap[e.key]);}},options);
 window.addEventListener('keyup',e=>{if(keyMap[e.key])keys.delete(keyMap[e.key]);},options);
 window.addEventListener('blur',stop,options);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();},options);
 panel.querySelectorAll('[data-walk]').forEach(b=>{
   b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.set(e.pointerId,b.dataset.walk);},options);
   for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,e=>held.delete(e.pointerId),options);
 });
 const canvas=controls.domElement;
 canvas.addEventListener('pointerdown',e=>{if(active&&!drag){drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}},options);
 canvas.addEventListener('pointermove',e=>{if(active&&drag?.id===e.pointerId){yaw-=(e.clientX-drag.x)*.006;pitch=Math.max(-Math.PI/3,Math.min(Math.PI*4/9,pitch-(e.clientY-drag.y)*.005));drag.x=e.clientX;drag.y=e.clientY;}},options);
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{if(drag?.id===e.pointerId)drag=null;},options);
 return {get active(){return active;},exit:()=>setActive(false),
 update(dt){if(!active)return;dt=Math.min(dt,.05);
   const pressed=name=>keys.has(name)||[...held.values()].includes(name);
   yaw+=(Number(pressed('left'))-Number(pressed('right')))*dt*1.9;
   const speed=(Number(pressed('forward'))-Number(pressed('back')))*8;
   next.copy(avatar.position);next.x+=Math.sin(yaw)*speed*dt;next.z+=Math.cos(yaw)*speed*dt;
   let moved=false;
   if(!blocked(next.x,next.z)){moved=Math.abs(speed)>0;avatar.position.copy(next);}
   avatar.position.y=Math.abs(avatar.position.x)<2.5&&avatar.position.z>=10.8&&avatar.position.z<=37?1.16:.55;
   avatar.rotation.y=yaw;phase+=moved?dt*9:0;
   avatar.userData.legs.forEach((leg,i)=>leg.rotation.x=moved?Math.sin(phase+i*Math.PI)*.5:0);
   avatar.userData.arms.forEach((arm,i)=>arm.rotation.x=moved?-Math.sin(phase+i*Math.PI)*.5:0);
   follow(dt);uiTime+=dt;if(uiTime>.2){uiTime=0;status.textContent=`Cliente seleccionado · Torre ITSE a ${Math.round(Math.hypot(avatar.position.x,avatar.position.z))} m`;}
 },dispose(){controller.abort();stop();}};
}
