import * as THREE from 'three';
// Cinematic camera only; never moves the simulated aircraft or customer routes.
export function createArrival(camera,controls,audio,onFinish){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const overlay=document.createElement('section');overlay.className='arrival-window';overlay.setAttribute('aria-label','Llegada a ITSE Cloud City');
 overlay.innerHTML='<div class="aircraft-rim" aria-hidden="true"></div><div class="aircraft-wing" aria-hidden="true"></div><p class="captain-subtitle" role="status" aria-live="polite"></p><button class="arrival-skip">Saltar llegada</button>';
 document.body.append(overlay);document.body.classList.add('arrival-active');controls.enabled=false;
 const subtitle=overlay.querySelector('p'),target=new THREE.Vector3(),position=new THREE.Vector3();let elapsed=0,ended=false;
 subtitle.textContent=audio.lines[0];
 const stage=document.getElementById('stage'),header=document.querySelector('.topbar');
 const previous=[stage.inert,header.inert];stage.inert=true;header.inert=true;
 overlay.querySelector('button').focus({preventScroll:true});
 const caption=e=>{subtitle.textContent=e.detail;};window.addEventListener('captain-caption',caption);
 const finish=()=>{if(ended)return;ended=true;audio.spoken=true;audio.speaking=false;window.speechSynthesis?.cancel();audio.phase='city';controls.enabled=true;stage.inert=previous[0];header.inert=previous[1];overlay.remove();document.body.classList.remove('arrival-active');window.removeEventListener('captain-caption',caption);window.removeEventListener('keydown',key);onFinish();};
 const key=e=>{if(e.key==='Escape')finish();};window.addEventListener('keydown',key);overlay.querySelector('button').onclick=finish;
 audio.phase='flight';
 return {get active(){return !ended;},dispose:finish,update(dt){
  if(ended||document.hidden)return;elapsed+=dt;
  if(!audio.speaking){const i=Math.min(audio.lines.length-1,Math.floor(elapsed/5));subtitle.textContent=audio.lines[i];}
  if(!reduced){
   if(elapsed<=20){const a=elapsed/20*Math.PI*2;position.set(340*Math.cos(a),125-30*elapsed/20,340*Math.sin(a));target.set(25,12,10);}
   else if(elapsed<27){const u=(elapsed-20)/7,f=u*u*(3-2*u);position.set(340+(252-340)*f,95+(38-95)*f,-90*f);target.set(25+(252-25)*f,12-10*f,10+45*f);}
   else{const u=Math.min(1,(elapsed-27)/7);position.set(252,38-35*u,-90+160*u);target.set(252-32*u,2+3*u,55+25*u);}
   camera.position.copy(position);controls.target.copy(target);camera.lookAt(target);
  }
  if((elapsed>34&&!audio.speaking)||elapsed>60)finish();
 }};
}
