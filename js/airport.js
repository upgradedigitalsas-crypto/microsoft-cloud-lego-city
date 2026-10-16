import * as THREE from 'three';
import { brick, tile, roundBrick, sign, matCache } from './lego.js';

// One runway, one bounded aircraft: arrivals → apron → departures → offshore circuit.
export function buildAirport(scene, world, studs) {
  const group = new THREE.Group(); scene.add(group);
  const ctx = { studs, m: matCache() };
  const block = (p, o) => brick(p, { ctx, ...o });
  const road = (a,b,width=7) => {
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const piece=tile(group,{ctx,w:width,d:length+1,h:.3,x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,y:.1,color:'#485461'});
    piece.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);
    for(let n=2;n<length;n+=6){const f=n/length;const mark=tile(group,{ctx,w:.25,d:2,h:.05,x:a[0]+(b[0]-a[0])*f,z:a[1]+(b[1]-a[1])*f,y:.42,color:'#FFFFFF'});mark.rotation.y=piece.rotation.y;}
  };
  const route=[[122,66],[154,66],[170,80],[218,80]];
  route.slice(1).forEach((p,i)=>road(route[i],p));
  tile(group,{ctx,w:20,d:22,x:220,z:80,y:.2,color:'#71808B'});
  for(let i=0;i<4;i++)tile(group,{ctx,w:5,d:.2,x:216,z:73+i*4,y:.65,color:'#FFFFFF'});
  tile(group,{ctx,w:14,d:76,x:252,z:80,y:.3,color:'#38434F'});
  for(let z=48;z<116;z+=7)tile(group,{ctx,w:.5,d:3,x:252,z,y:.75,color:'#FFFFFF'});
  for(const z of [46,114])for(let x=247;x<258;x+=2)tile(group,{ctx,w:1,d:5,x,z,y:.75,color:'#FFFFFF'});
  road([229,80],[245,80],6);
  block(group,{w:20,d:10,h:5,x:222,z:61,color:'#FFFFFF'});
  tile(group,{ctx,w:18,d:.3,h:2.8,x:222,z:66.1,y:1.5,color:'#64CEEB'});
  block(group,{w:22,d:12,h:.6,x:222,z:61,y:5,color:'#010ED0'});
  sign(group,'CLOUD GATEWAY',{w:19,h:2.3,x:222,y:4.1,z:67.2,bg:'#FFFFFF',fg:'#010ED0'});
  block(group,{w:5,d:5,h:12,x:233,z:49,color:'#E8EDF2'});
  block(group,{w:8,d:7,h:3,x:233,z:49,y:12,color:'#65CDE4'});
  block(group,{w:9,d:8,h:.6,x:233,z:49,y:15,color:'#010ED0'});
  sign(group,'DATOS · CLIENTES ↔ CLOUD',{w:24,h:3,x:226,y:3,z:96,bg:'#FFFFFF',fg:'#006A6A'});
  for(let z=44;z<=116;z+=8)for(const x of [243,261])roundBrick(group,{ctx,r:.35,h:.45,x,z,y:.4,color:'#79F6F5'});
  const plane=new THREE.Group(); group.add(plane);
  block(plane,{w:2.8,d:10,h:1.6,y:1,color:'#FFFFFF'});
  block(plane,{w:2,d:2,h:1,y:1.2,z:5.3,color:'#65CDE4'});
  block(plane,{w:12,d:2.5,h:.45,y:1.2,z:-.5,color:'#E3EBF4'});
  block(plane,{w:6,d:1.5,h:.4,y:1.8,z:-4,color:'#010ED0'});
  block(plane,{w:.6,d:2,h:2.5,y:2,z:-4,color:'#010ED0'});
  for(const x of [-3.5,3.5])block(plane,{w:1.2,d:2.6,h:1,y:.25,x,color:'#00A8A8'});
  sign(plane,'DATA',{w:2.5,h:1,x:1.42,y:2,z:0,ry:Math.PI/2,bg:'#FFFFFF',fg:'#010ED0'});
  // Linear taxi/runway phases; curved offshore route never crosses the city.
  const keys=[[0,252,32,-85],[12,252,1,47],[21,252,1,80],[27,237,1,80],[34,237,1,80],[40,252,1,80],[48,252,1,115],[60,252,36,230],[72,340,55,150],[84,340,55,-85],[96,252,32,-85]];
  const secondPlane=plane.clone(true);group.add(secondPlane);
  let cycles=0;
  world.airport={group,plane,planes:[plane,secondPlane],route,get cycles(){return cycles;}};
  world.anims.push(t=>{
    cycles=Math.floor(t/96);
    [plane,secondPlane].forEach((plane,index)=>{
    const phase=(t+index*48)%96;
    const i=keys.findIndex((k,j)=>j<keys.length-1 && phase>=k[0] && phase<keys[j+1][0]);
    const a=keys[Math.max(0,i)],b=keys[Math.max(0,i)+1],f=(phase-a[0])/(b[0]-a[0]);
    plane.position.set(THREE.MathUtils.lerp(a[1],b[1],f),THREE.MathUtils.lerp(a[2],b[2],f),THREE.MathUtils.lerp(a[3],b[3],f));
    if(a[1]!==b[1]||a[3]!==b[3])plane.rotation.y=Math.atan2(b[1]-a[1],b[3]-a[3]);
    plane.rotation.x=a[2]===b[2]?0:-Math.atan2(b[2]-a[2],Math.hypot(b[1]-a[1],b[3]-a[3]));
    });
  });
}
