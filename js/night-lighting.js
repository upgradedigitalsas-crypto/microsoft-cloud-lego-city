import * as THREE from 'three';

// Fixed, instanced emissive fittings and soft light pools: no per-lamp shadow maps.
export function buildNightLighting(scene, world, sim) {
  const roots=[],blinkers=[],facades=[];
  const geometry=new THREE.SphereGeometry(1,8,6);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion();
  const materials=new Map();
  function bulbs(parent,points,color,r=.25,blink=false) {
    const key=color+blink;
    if(!materials.has(key))materials.set(key,new THREE.MeshBasicMaterial({color,toneMapped:false}));
    const mesh=new THREE.InstancedMesh(geometry,materials.get(key),points.length);
    points.forEach((p,i)=>mesh.setMatrixAt(i,matrix.compose(position.set(...p),rotation,scale.setScalar(r))));
    parent.add(mesh);mesh.visible=false;roots.push(mesh);
    if(blink)blinkers.push(mesh);
    return mesh;
  }
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(255,255,255,.8)');gradient.addColorStop(.35,'rgba(255,255,255,.35)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const texture=new THREE.CanvasTexture(canvas),poolGeometry=new THREE.PlaneGeometry(1,1);
  const poolMaterials=new Map();
  function pool(parent,x,y,z,w,d,color) {
    if(!poolMaterials.has(color))poolMaterials.set(color,new THREE.MeshBasicMaterial({map:texture,color,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    const mesh=new THREE.Mesh(poolGeometry,poolMaterials.get(color));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.scale.set(w,d,1);parent.add(mesh);mesh.visible=false;roots.push(mesh);
  }
  // Add illuminated overlays without changing originals or pillar-filter materials.
  function windows(parent) {
    const originals=[];
    parent.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.material?.transparent&&o.material.roughness<=.1)originals.push(o);});
    const material=new THREE.MeshBasicMaterial({color:'#FFE7B5',transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
    for(const original of originals){const glow=new THREE.Mesh(original.geometry,material);glow.scale.setScalar(1.005);original.add(glow);glow.visible=false;roots.push(glow);}
    if(!originals.length)material.dispose();
  }
  world.buildings.forEach(b=>{
    windows(b.group);
    bulbs(b.group,[[0,b.height+.25,0]],'#FF6C62',.35,true);
    bulbs(b.group,[[-8,.8,13],[8,.8,13]],'#FFE5A1',.3);
    pool(b.group,0,.52,12,28,16,'#FFE0A0');
    pool(b.group,0,.34,-8,26,20,'#91CFFF');
    for(const material of b.materials){
      if(material.emissive && !material.transparent)facades.push({material,color:material.emissive.clone(),intensity:material.emissiveIntensity});
    }

  });
  for(const v of sim.vehicles){
    const front=v.kind==='truck'?3.48:2.05,back=v.kind==='truck'?-3.5:-2.05;
    bulbs(v.group,[[front,1.5,.85],[front,1.5,-.85]],'#FFF2BE',.24);
    bulbs(v.group,[[back,1.2,.85],[back,1.2,-.85]],'#FF4242',.18);
    pool(v.group,front+3,.13,0,9,4,'#FFE9B3');
  }
  const drones=[...sim.drones.map(d=>d.group),...world.security.episodes.map(e=>e.guardian)];
  for(const d of drones){bulbs(d,[[-1.1,.4,1.1],[-1.1,.4,-1.1]],'#FF5353',.16);bulbs(d,[[1.1,.4,1.1],[1.1,.4,-1.1]],'#52FFD4',.16);bulbs(d,[[0,.8,0]],'#FFFFFF',.2,true);}
  for(const e of world.security.episodes){bulbs(e.bike,[[0,1.2,1.6]],'#FFE6A0',.24);bulbs(e.bike,[[0,1,-1.65]],'#FF4242',.18);}
  for(const p of world.airport.planes){
    bulbs(p,[[-5.9,1.6,-.5]],'#FF4848',.22);bulbs(p,[[5.9,1.6,-.5]],'#52FFAF',.22);
    bulbs(p,[[0,4.5,-4]],'#FF5555',.24,true);bulbs(p,[[-1,1.6,5.5],[1,1.6,5.5]],'#FFFFFF',.24);
    bulbs(p,[[-5.7,1.7,-.6],[5.7,1.7,-.6]],'#FFFFFF',.18,true);
  }
  const airport=world.airport.group,edges=[],center=[],threshold=[],ends=[],taxi=[];
  for(let z=44;z<=116;z+=4){edges.push([244,.95,z],[260,.95,z]);center.push([252,.96,z]);}
  for(let x=246;x<=258;x+=2){threshold.push([x,.96,43]);ends.push([x,.96,117]);}
  for(let x=230;x<=243;x+=3)taxi.push([x,.9,77],[x,.9,83]);
  bulbs(airport,edges,'#81BFFF',.3);bulbs(airport,center,'#FFF4CB',.2);
  bulbs(airport,threshold,'#52FFAF',.32);bulbs(airport,ends,'#FF5555',.32);bulbs(airport,taxi,'#52FFDE',.22);
  bulbs(airport,[[233,16,49]],'#FF6464',.4,true);
  bulbs(airport,[[214,5.9,66],[230,5.9,66]],'#FFE9B0',.4);
  pool(airport,222,.68,78,30,25,'#A7CFFF');
  const terminalGlow=new THREE.Mesh(new THREE.BoxGeometry(18,2.8,.04),new THREE.MeshBasicMaterial({color:'#9ADFFF',toneMapped:false}));
  terminalGlow.position.set(222,2.9,66.27);airport.add(terminalGlow);terminalGlow.visible=false;roots.push(terminalGlow);
  const towerGlow=new THREE.Mesh(new THREE.BoxGeometry(8.02,2,7.02),new THREE.MeshBasicMaterial({color:'#B0DCFF',transparent:true,opacity:.55,depthWrite:false,toneMapped:false}));
  towerGlow.position.set(233,13.5,49);airport.add(towerGlow);towerGlow.visible=false;roots.push(towerGlow);
  const strips=[];for(let z=48;z<116;z+=7)strips.push([252,z,.5,3]);
  for(const z of [46,114])for(let x=247;x<258;x+=2)strips.push([x,z,1,5]);
  const marking=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.03,1),new THREE.MeshBasicMaterial({color:'#DDEEFF',toneMapped:false}),strips.length);
  strips.forEach(([x,z,w,d],i)=>marking.setMatrixAt(i,matrix.compose(position.set(x,1.166,z),rotation,scale.set(w,1,d))));
  airport.add(marking);marking.visible=false;roots.push(marking);
  if(world.itseTower){bulbs(world.itseTower.group,[[0,world.itseTower.height,0]],'#FF7167',.4,true);pool(world.itseTower.group,0,1.72,8,20,12,'#FFE0A0');}
  let enabled=false;
  const lighting={roots,blinkers,set(on){enabled=Boolean(on);if(world.itseTower)world.itseTower.windowMaterial.emissiveIntensity=enabled?1.6:0;roots.forEach(o=>o.visible=enabled);facades.forEach(({material,color,intensity})=>{material.emissive.copy(enabled?material.color:color);material.emissiveIntensity=enabled?Math.max(.28,intensity*.4):intensity;});},get enabled(){return enabled;}};
  world.anims.push(t=>{if(enabled)blinkers.forEach((mesh,i)=>mesh.visible=(t+i*.17)%1.6<.22);});
  return lighting;
}
