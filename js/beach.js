import * as THREE from 'three';
import { brick, sign, matCache, minifig, plastic } from './lego.js';

export const BEACH_STEPS = [
  ['Solicitud recibida', 'Un visitante pide una bebida en el kiosco. Power Apps registra la solicitud.'],
  ['Agente de atención', 'Un agente de Copilot Studio interpreta la solicitud y confirma las opciones disponibles.'],
  ['Servicio coordinado', 'Power Automate coordina la orden; el robot LEGO representa el sistema de reparto conectado.'],
  ['Resultado visible', 'Fabric y Power BI muestran pedidos y tiempos. Entra controla acceso y Purview protege los datos.'],
];
export function buildBeach(scene, world, studs) {
  const group = new THREE.Group(); group.position.set(-76,0,128); scene.add(group);
  const ctx={m:matCache(),studs,color:'#F2C200'};
  // Sand is a LEGO baseplate; the beach remains part of the island.
  for(let x=-20;x<=20;x+=4) for(let z=-10;z<=10;z+=4) {
    brick(group,{x,z,y:0,w:3.95,d:3.95,h:0.5,color:(x+z)%8?'#F4D995':'#E8C67B',ctx});
  }
  for(const x of [-14,14]) {
    brick(group,{x,z:3,y:0.5,w:0.8,d:0.8,h:5,color:'#FFFFFF',ctx});
    brick(group,{x,z:3,y:5.5,w:6,d:6,h:0.6,color:x<0?'#F28C28':'#1E7BD8',ctx});
    for(let i=0;i<2;i++) brick(group,{x:x-1.5+i*3,z:5,y:0.5,w:2,d:4,h:0.5,color:'#FFFFFF',ctx});
  }
  brick(group,{x:0,z:-4,y:0.5,w:9,d:5,h:3,color:'#FFFFFF',ctx});
  brick(group,{x:0,z:-4,y:3.5,w:10,d:6,h:0.7,color:'#9B5CD6',ctx});
  sign(group,'PLAYA AUTOMATIZADA',{x:0,z:-0.9,y:3.6,w:15,h:1.7,bg:'#9B5CD6',fg:'#FFFFFF'});
  sign(group,'PEDIDOS · AGENTES · FLUJOS · DATOS',{x:0,z:-0.85,y:1.4,w:11,h:0.8,bg:'#FFFFFF',fg:'#17456B'});
  for(let i=0;i<3;i++) {
    brick(group,{x:13+i*2.1,z:-6,y:0.5,w:1.8,d:1.8,h:2,color:['#2FA05A','#1E7BD8','#F2C200'][i],ctx});
  }
  sign(group,'RECICLAJE',{x:15,z:-4.8,y:3.4,w:6,h:1,bg:'#2FA05A',fg:'#FFFFFF'});
  const visitor=minifig('#F28C28'); visitor.position.set(-4,0.6,1); group.add(visitor);
  const host=minifig('#9B5CD6'); host.position.set(2,0.6,-0.8); group.add(host);
  const robot=new THREE.Group(); group.add(robot);
  // Dynamic robot studs belong to its own group, so they move with the machine.
  brick(robot,{x:0,z:0,y:0.65,w:2.6,d:3,h:1.3,color:'#FFFFFF',ctx});
  brick(robot,{x:0,z:0,y:1.95,w:2,d:2,h:0.65,color:'#1E7BD8',ctx});
  for(const x of [-1.3,1.3]) for(const z of [-1,1]) brick(robot,{x,z,y:0.25,w:0.5,d:0.8,h:0.7,color:'#273E5B',ctx,studs:false});
  sign(robot,'BOT',{x:0,z:1.55,y:1.3,w:1.7,h:0.6,bg:'#1E7BD8',fg:'#FFFFFF'});
  // Terraced sand meets the sea; swimmers stay beyond the land silhouette.
  for(let i=0;i<4;i++) brick(group,{x:0,z:13+i*3,y:-i*1.25,w:24-i*2,d:3,h:0.55,color:'#E8C67B',ctx});
  const swimmers=[];
  for(let i=0;i<5;i++) {
    const swimmer=new THREE.Group(),body=minifig(['#F4513C','#1D8DD8','#F2C72C','#9B5CD6','#2BAE80'][i]);
    body.rotation.x=Math.PI/2; body.position.set(0,0.3,-1.2); swimmer.add(body);
    swimmer.scale.setScalar(1.4); scene.add(swimmer);
    swimmers.push({swimmer,body,x:-92+i*9,z:158+(i%2)*7});
    if(i%2===0){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,0.23,8,16),plastic(i?'#F2C200':'#F28C28'));ring.rotation.x=Math.PI/2;ring.position.y=0.2;swimmer.add(ring);}
  }
  world.anims.push(t=>swimmers.forEach(({swimmer,body,x,z},i)=>{
    const sx=x+Math.sin(t*0.22+i)*2,sz=z+Math.cos(t*0.18+i)*2;
    const wave=Math.sin(sx*0.045+t*0.8)*1.2+Math.cos(-sz*0.065-t*0.65)*0.8;
    swimmer.position.set(sx,-4.7+wave,sz);swimmer.rotation.y=Math.sin(t*0.12+i)*0.35;
    const arms=body.userData.arms; if(arms){arms[0].rotation.x=Math.sin(t*2+i)*0.8;arms[1].rotation.x=-Math.sin(t*2+i)*0.8;}
  }));
  let phase=-1, elapsed=0, completed=0, listener=()=>{};
  const api={group, start(){if(phase>=0)return;phase=0;elapsed=0;listener(phase,completed);}, subscribe(fn){listener=fn;fn(phase,completed);}, get running(){return phase>=0;}};
  world.beach=api;
  group.traverse(o=>{if(o.isMesh)o.userData.landmark='beach';});
  world.anims.push((t,dt=0)=>{
    if(phase>=0){elapsed+=dt;if(elapsed>=3){elapsed-=3;phase++;if(phase===4){phase=-1;completed++;}listener(phase,completed);}}
    const p=phase===2?elapsed/3:phase===3?1-elapsed/3:0;
    robot.position.set(8-p*14,0,5); robot.rotation.y=phase===3?Math.PI:0;
  });
  return api;
}
