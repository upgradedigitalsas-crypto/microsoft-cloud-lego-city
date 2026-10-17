import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../js/navigation.js',import.meta.url),'utf8');
const {smoothNavigation}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
class Vector {
 constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
 clone(){return new Vector(this.x,this.y,this.z);}
 copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this;}
 add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
 sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
 length(){return Math.hypot(this.x,this.y,this.z);}
 distanceTo(v){return this.clone().sub(v).length();}
 multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
}
function setup(){
 const handlers=new Map(),camera={position:new Vector(0,0,100)};
 const controls={enabled:true,enableZoom:true,minDistance:25,maxDistance:600,target:new Vector()};
 const canvas={clientHeight:800,addEventListener:(name,fn)=>handlers.set(name,fn),removeEventListener:name=>handlers.delete(name)};
 const navigation=smoothNavigation(camera,controls,canvas,()=>{});
 const wheel=(delta,mode=0,ctrl=false)=>handlers.get('wheel')({deltaY:delta,deltaMode:mode,ctrlKey:ctrl,preventDefault(){},stopImmediatePropagation(){}});
 return {camera,controls,handlers,navigation,wheel};
}
const a=setup(),b=setup();a.wheel(-60);for(let i=0;i<12;i++)b.wheel(-5);
for(let i=0;i<60;i++)a.navigation.update(1/60);
for(let i=0;i<120;i++)b.navigation.update(1/120);
assert.ok(Math.abs(a.camera.position.z-b.camera.position.z)<.01,'Event/frame rates must not change final zoom');
assert.ok(a.camera.position.z<100&&a.camera.position.z>25);
const c=setup();c.wheel(-2,1);const d=setup();d.wheel(-32);c.navigation.update(.05);d.navigation.update(.05);
assert.equal(c.camera.position.z,d.camera.position.z,'Line wheel units convert to pixels');
for(let i=0;i<100;i++)c.wheel(-240,0,true);for(let i=0;i<300;i++)c.navigation.update(1/60);
assert.ok(c.camera.position.z>=25&&c.camera.position.z<25.01,'Pinch respects near limit');
c.wheel(200);c.handlers.get('pointerdown')();const before=c.camera.position.z;c.navigation.update(.05);assert.equal(c.camera.position.z,before,'Touch cancels wheel inertia');
c.navigation.dispose();assert.equal(c.handlers.size,0,'Listeners released');
console.log('PASS continuous zoom, event/frame independence, delta units, bounds, touch cancellation and cleanup');
