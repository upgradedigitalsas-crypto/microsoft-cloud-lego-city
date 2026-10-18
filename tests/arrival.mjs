import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
class V{set(x,y,z){Object.assign(this,{x,y,z});return this;}copy(v){return this.set(v.x,v.y,v.z);}}
const button={focus(){}},subtitle={},stage={inert:false},header={inert:false};let removed=false;
globalThis.window=new EventTarget();window.speechSynthesis={cancel(){}};globalThis.matchMedia=()=>({matches:false});
globalThis.document={hidden:false,body:{append(){},classList:{add(){},remove(){}}},getElementById:()=>stage,querySelector:()=>header,createElement:()=>({setAttribute(){},querySelector:s=>s==='p'?subtitle:button,remove(){removed=true;}})};
globalThis.arrivalTHREE={Vector3:V};
const source=(await readFile(new URL('../js/arrival.js',import.meta.url),'utf8')).replace("import * as THREE from 'three';","const THREE=globalThis.arrivalTHREE;");
const {createArrival}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const camera={position:new V(),lookAt(){}},controls={enabled:true,target:new V()},audio={lines:['uno','dos'],speaking:false};let finished=0;
const tour=createArrival(camera,controls,audio,()=>finished++);
assert.ok(stage.inert&&!controls.enabled);tour.update(10);assert.ok(camera.position.x<0);
const event=new Event('captain-caption');event.detail='Mensaje sincronizado';audio.speaking=true;window.dispatchEvent(event);tour.update(.1);assert.equal(subtitle.textContent,event.detail);
tour.update(9.9);assert.ok(camera.position.x>339);tour.update(7);assert.equal(camera.position.y,38);tour.update(7);assert.equal(camera.position.y,3);assert.ok(tour.active,'Waits for captain');audio.speaking=false;tour.update(.1);
assert.ok(removed&&controls.enabled&&!stage.inert);assert.equal(finished,1);tour.dispose();assert.equal(finished,1);
console.log('PASS orbit, descent, synchronized captions, voice wait and cleanup');
