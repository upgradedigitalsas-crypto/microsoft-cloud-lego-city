import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
class V {constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){Object.assign(this,{x,y,z});return this;}clone(){return new V(this.x,this.y,this.z);}copy(v){return this.set(v.x,v.y,v.z);}lerp(v,t){return this.set(this.x+(v.x-this.x)*t,this.y+(v.y-this.y)*t,this.z+(v.z-this.z)*t);}lerpVectors(a,b,t){return this.copy(a).lerp(b,t);}}
class Group {constructor(){this.position=new V();this.rotation={x:0,y:0,z:0};this.scale={setScalar(){}};this.children=[];this.userData={};}add(o){this.children.push(o);}}
class El extends EventTarget {constructor(){super();this.hidden=true;this.attrs={};this.textContent='';this.dataset={};}setAttribute(k,v){this.attrs[k]=v;}setPointerCapture(){}focus(){}querySelectorAll(){return pads;}}
const ids=['cam-walk','walk-panel','walk-status','walk-exit'],els=Object.fromEntries(ids.map(id=>[id,new El()]));
const pads=['forward','left','back','right'].map(name=>{const e=new El();e.dataset.walk=name;return e;});
const bodyClasses=new Set();
globalThis.window=new EventTarget();globalThis.document=new EventTarget();document.hidden=false;
document.getElementById=id=>els[id];document.body={classList:{toggle(k,v){v?bodyClasses.add(k):bodyClasses.delete(k);}}};
const THREE={Vector3:V,Mesh:Group,TorusGeometry:class{},MeshBasicMaterial:class{},MathUtils:{lerp:(a,b,t)=>a+(b-a)*t}};
const minifig=()=>{const g=new Group();g.userData={legs:[{rotation:{}},{rotation:{}}],arms:[{rotation:{}},{rotation:{}}]};return g;};
globalThis.walkTestDeps={THREE,minifig,isIslandLand:(x,z)=>x>=-180&&x<=290&&z>=-140&&z<=150,inLake:(x,z)=>Math.hypot(x/31,z/24)<1};
let source=await readFile(new URL('../js/walk.js',import.meta.url),'utf8');source=source.replace(/^import .*;\n/gm,'');
const {createWalkMode}=await import('data:text/javascript;base64,'+Buffer.from('const {THREE,minifig,isIslandLand,inLake}=globalThis.walkTestDeps;\n'+source).toString('base64'));
const scene=new Group(),world={buildings:new Map()},sim={vehicles:[],customers:{people:[]}},camera={position:new V(315,205,350),lookAt(){}};
const controls={domElement:new El(),enabled:true,target:new V(40,-25,20),update(){}};
const walk=createWalkMode(scene,world,sim,camera,controls,()=>{});
const emit=(target,type,data={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,data);target.dispatchEvent(e);};
const click=id=>emit(els[id],'click');
click('cam-walk');assert.ok(walk.active&&!controls.enabled);assert.equal(world.walker.group.position.z,70);
emit(window,'keydown',{key:'ArrowUp'});for(let i=0;i<20;i++)walk.update(.05);assert.ok(world.walker.group.position.z>77.9);
emit(window,'blur');const z=world.walker.group.position.z;walk.update(.05);assert.equal(world.walker.group.position.z,z,'Blur must stop movement');
click('walk-exit');assert.deepEqual(camera.position,new V(315,205,350));assert.ok(controls.enabled);
click('cam-walk');emit(window,'keydown',{key:'ArrowDown'});for(let i=0;i<100;i++)walk.update(.05);assert.ok(world.walker.group.position.z>=67,'Terminal wall blocks backwards movement');emit(window,'keyup',{key:'ArrowDown'});
emit(pads[0],'pointerdown',{pointerId:1});walk.update(.05);const touchZ=world.walker.group.position.z;emit(pads[0],'pointercancel',{pointerId:1});walk.update(.05);assert.equal(world.walker.group.position.z,touchZ,'Cancelled touch stops movement');
world.walker.group.position.set(8,.55,20);emit(window,'keydown',{key:'ArrowUp'});walk.update(.05);assert.equal(world.walker.group.position.z,20,'Lake blocks movement outside bridge');emit(window,'keyup',{key:'ArrowUp'});
emit(window,'keydown',{key:'Escape'});assert.equal(walk.active,false);
for(let i=0;i<100;i++){click('cam-walk');click('walk-exit');}assert.equal(scene.children.length,1,'Repeated entry reuses one client');

click('cam-walk');
const beforeLook=world.walker.group.position.clone();
emit(controls.domElement,'pointerdown',{pointerId:9,clientX:100,clientY:100});
emit(controls.domElement,'pointermove',{pointerId:9,clientX:150,clientY:-1000});walk.update(.05);
assert.ok(controls.target.y>camera.position.y,'Upward drag looks at upper buildings');
assert.ok(controls.target.x<camera.position.x,'Horizontal drag changes viewing direction');
assert.equal(world.walker.group.position.x,beforeLook.x);assert.equal(world.walker.group.position.z,beforeLook.z);
assert.ok(Math.hypot(controls.target.x-camera.position.x,controls.target.z-camera.position.z)>1,'Pitch limit avoids flipping');
emit(controls.domElement,'pointermove',{pointerId:9,clientX:150,clientY:2000});walk.update(.05);
assert.ok(controls.target.y<camera.position.y,'Downward drag looks down');
emit(controls.domElement,'lostpointercapture',{pointerId:9});
const directionY=controls.target.y-camera.position.y;
emit(controls.domElement,'pointermove',{pointerId:9,clientX:150,clientY:-5000});walk.update(.05);
assert.ok(Math.abs(controls.target.y-camera.position.y-directionY)<1e-9,'Capture loss ends looking');
click('walk-exit');
walk.dispose();click('cam-walk');assert.equal(walk.active,false,'Disposal removes input listeners');
console.log('PASS airport spawn, keyboard/touch controls, wall/water bounds, blur/cancel, Escape, camera restore, reuse and cleanup');
