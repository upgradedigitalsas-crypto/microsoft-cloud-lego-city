import * as THREE from 'three';
import { CAPTAIN_LINES } from './captain-lines.js';
// Cinematic camera only; never moves the simulated aircraft or customer routes.
export function createArrival(camera,controls,audio,onFinish){
 const lines=audio.lines || CAPTAIN_LINES;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const overlay=document.createElement('section');overlay.className='arrival-window';overlay.setAttribute('aria-label','Llegada a ITSE Cloud City');
 overlay.innerHTML='<div class="aircraft-cabin" aria-hidden="true"></div><div class="aircraft-rim" aria-hidden="true"></div><div class="aircraft-wing" aria-hidden="true"></div><p class="captain-subtitle" role="status" aria-live="polite"></p><button class="arrival-skip">Saltar llegada</button>';
 document.body.append(overlay);document.body.classList.add('arrival-active');controls.enabled=false;
 const subtitle=overlay.querySelector('p'),target=new THREE.Vector3(),position=new THREE.Vector3();let elapsed=0,ended=false,heardCaptain=Boolean(audio.speaking);
 subtitle.textContent=lines[0];
 const stage=document.getElementById('stage'),header=document.querySelector('.topbar');
 const previous=[stage.inert,header.inert];stage.inert=true;header.inert=true;
 overlay.querySelector('button').focus({preventScroll:true});
 const caption=e=>{subtitle.textContent=e.detail;};window.addEventListener('captain-caption',caption);
 const finish=()=>{if(ended)return;ended=true;audio.stopCaptain?.();audio.spoken=true;audio.speaking=false;window.speechSynthesis?.cancel();audio.phase='city';controls.enabled=true;stage.inert=previous[0];header.inert=previous[1];overlay.remove();document.body.classList.remove('arrival-active');window.removeEventListener('captain-caption',caption);window.removeEventListener('keydown',key);onFinish();};
 const key=e=>{if(e.key==='Escape')finish();};window.addEventListener('keydown',key);overlay.querySelector('button').onclick=finish;
 audio.phase='flight';
 return {get active(){return !ended;},dispose:finish,update(dt){
  if(ended||document.hidden)return;elapsed+=dt;
  if(!audio.speaking||!audio.captionStarted){const i=Math.min(lines.length-1,Math.floor(elapsed/5));subtitle.textContent=lines[i];}
  heardCaptain ||= Boolean(audio.speaking);
  // Keep flying throughout the narration, including longer synthesized voices.
  // Reduced motion uses a gentle arc instead of freezing the window view.
  const angle=elapsed*(reduced?.012:Math.PI*2/30);
  position.set(25+340*Math.cos(angle),115+8*Math.sin(angle*.5),10+340*Math.sin(angle));
  target.set(25,12,10);
  camera.position.copy(position);controls.target.copy(target);camera.lookAt(target);
  const silentDuration=Math.max(10,lines.length*5);
  if((heardCaptain&&!audio.speaking&&elapsed>=3)||(!heardCaptain&&elapsed>=silentDuration)||elapsed>=90)finish();
 }};
}
