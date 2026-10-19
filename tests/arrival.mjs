import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
class V{set(x,y,z){Object.assign(this,{x,y,z});return this;}copy(v){return this.set(v.x,v.y,v.z);}}
const button={focus(){}},subtitle={},stage={inert:false},header={inert:false};let removed=false;
globalThis.window=new EventTarget();window.speechSynthesis={cancel(){}};globalThis.matchMedia=()=>({matches:false});
globalThis.document={hidden:false,body:{append(){},classList:{add(){},remove(){}}},getElementById:()=>stage,querySelector:()=>header,createElement:()=>({setAttribute(){},querySelector:s=>s==='p'?subtitle:button,remove(){removed=true;}})};
globalThis.arrivalTHREE={Vector3:V};
const source=(await readFile(new URL('../js/arrival.js',import.meta.url),'utf8')).replace("import * as THREE from 'three';","const THREE=globalThis.arrivalTHREE;");
const mainSource=await readFile(new URL('../js/main.js',import.meta.url),'utf8');
assert.match(mainSource,/import \{ soundscape as audio \} from/);
assert.doesNotMatch(mainSource,/new BrickAudio/);
const {createArrival}=await import('data:text/javascript;base64,'+Buffer.from(source.replace("import { CAPTAIN_LINES } from './captain-lines.js';", "const CAPTAIN_LINES=['uno','dos'];")).toString('base64'));
const camera={position:new V(),lookAt(){}},controls={enabled:true,target:new V()},audio={lines:['uno','dos'],speaking:true,captionStarted:true};let finished=0;
const tour=createArrival(camera,controls,audio,()=>finished++);
assert.ok(stage.inert&&!controls.enabled);tour.update(1);assert.ok(camera.position.z<10,'Flight direction is reversed for the left window');tour.update(9);assert.ok(camera.position.x<0);
const event=new Event('captain-caption');event.detail='Mensaje sincronizado';window.dispatchEvent(event);tour.update(.1);assert.equal(subtitle.textContent,event.detail);
tour.update(30);const before={...camera.position};tour.update(1);assert.notDeepEqual(camera.position,before);assert.ok(tour.active,'Keeps flying after the former 34-second stop');
audio.speaking=false;tour.update(.1);
assert.ok(removed&&controls.enabled&&!stage.inert);assert.equal(finished,1);tour.dispose();assert.equal(finished,1);
globalThis.matchMedia=()=>({matches:true});audio.speaking=true;
const gentle=createArrival(camera,controls,audio,()=>finished++);gentle.update(1);const first={...camera.position};gentle.update(1);assert.notEqual(camera.position.z,first.z,'Reduced motion still has gentle movement');
document.hidden=true;const hidden={...camera.position};gentle.update(100);assert.equal(camera.position.z,hidden.z);assert.ok(gentle.active);document.hidden=false;gentle.dispose();
audio.speaking=false;const silent=createArrival(camera,controls,audio,()=>finished++);silent.update(5);assert.equal(subtitle.textContent,'dos');silent.update(5);assert.ok(!silent.active,'Silent captions finish without hanging');
console.log('PASS continuous flight, captions, narration completion, reduced motion, hidden tab and silent fallback');

const legacy=createArrival(camera,controls,{speaking:false},()=>{});assert.ok(legacy.active);button.onclick();assert.ok(!legacy.active,'Skip works even without audio lines');
