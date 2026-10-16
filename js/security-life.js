import * as THREE from 'three';
import { brick, roundBrick, sign, minifig, drone, matCache, StudBatch, batchStaticBricks } from './lego.js';

// Fixed actors, reusable effects. Educational episodes, not real security telemetry.
export function buildSecurityLife(scene, world, customers) {
  const root=new THREE.Group();scene.add(root);
  const studs=new StudBatch(),ctx={studs,m:matCache()};
  const episodes=[];
  for(const [i,id] of ['m365','compute','dynamics'].entries()) {
    const client=customers.people.find(p=>p.district===id && !p.host) || customers.people.filter(p=>!p.host)[i];
    const bike=new THREE.Group();root.add(bike);
    brick(bike,{ctx,w:1.2,d:3.2,h:.7,y:.8,color:'#52254D'});
    for(const z of [-1.2,1.2]){const wheel=roundBrick(bike,{ctx,r:.65,h:.5,z,y:0,color:'#20232D',stud:false});wheel.rotation.z=Math.PI/2;wheel.position.y=.7;}
    const pirate=minifig('#C74951','#20232D','#20232D');pirate.position.y=1.1;bike.add(pirate);
    brick(bike,{ctx,w:.15,d:.15,h:3.5,x:.8,z:-1,color:'#20232D'});
    sign(bike,'VIRUS',{w:2.8,h:1.2,x:.8,y:3.6,z:-.9,bg:'#52254D',fg:'#FFFFFF'});
    const guardian=drone();root.add(guardian);
    guardian.children[0].material.color.set('#00A8A8');
    brick(guardian,{ctx,w:2.5,d:.3,h:2,y:-.7,z:1.2,color:i===1?'#010ED0':'#00A8A8'});
    sign(guardian,i===1?'FIREWALL':'DEFENDER',{w:5,h:1.2,y:1.2,z:1.4,bg:'#FFFFFF',fg:'#006A6A'});
    const barrier=new THREE.Group();root.add(barrier);
    for(let row=0;row<3;row++)for(let col=0;col<4;col++)brick(barrier,{ctx,w:1.1,d:.35,h:.65,x:(col-1.5)*1.2,y:row*.75,color:'#79F6F5'});
    const halo=new THREE.Mesh(new THREE.CylinderGeometry(2,2,3,16,1,true),new THREE.MeshBasicMaterial({color:'#00D9BB',transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide}));root.add(halo);
    const home=world.buildings.get(i===1?'compute':'defender').group.position.clone();home.y=20;
    episodes.push({bike,guardian,barrier,halo,client,home,cycles:0});
  }
  studs.flush(root);batchStaticBricks(root);
  world.security={root,episodes};
  world.anims.push(t=>episodes.forEach((e,i)=>{
    const p=(t+i*9)%32;e.cycles=Math.floor((t+i*9)/32);
    const target=e.client.group.position;
    // Approach stays on the customer's arrival forecourt; shield blocks before contact.
    const distance=p<10?14-p*.9:p<18?5:5+(p-18)*.8;
    e.bike.position.set(target.x+distance,.4,target.z+3);
    e.bike.rotation.y=p<18?-Math.PI/2:Math.PI/2;
    e.bike.visible=p<29;
    e.halo.position.set(target.x,target.y+1.5,target.z);e.halo.visible=p>=8&&p<24;
    e.barrier.position.set(target.x+3,1,target.z+2);e.barrier.rotation.y=Math.PI/2;e.barrier.visible=p>=10&&p<22;
    const f=p<8?p/8:p<22?1:Math.max(0,1-(p-22)/10);
    e.guardian.position.set(THREE.MathUtils.lerp(e.home.x,target.x+4,f),THREE.MathUtils.lerp(e.home.y,7,f)+Math.sin(t*3)*.25,THREE.MathUtils.lerp(e.home.z,target.z+3,f));
    e.guardian.userData.rotors.forEach(r=>r.rotation.y=t*24);
    e.guardian.userData.beam.material.opacity=p>=10&&p<18?.16:0;
    e.guardian.userData.beam.material.color.set('#00D9BB');
  }));
}
