import * as THREE from 'three';
import { brick, roundBrick, matCache, rbox, plastic, sign, minifig } from './lego.js';

// Brick-built Art Deco landmark, with the original ITSE silhouette voxelised in 3D.
export function buildITSETower(scene, world, studs) {
  const group=new THREE.Group();group.name='ITSE · Torre del lago';scene.add(group);
  const ctx={studs,m:matCache()},windows=[];
  const block=(o)=>brick(group,{ctx,...o});
  block({w:22,d:20,h:.8,y:.3,color:'#DDD8CB',studs:false});
  block({w:20,d:18,h:.6,y:1.1,color:'#F6EBD5'});
  const staff=[],departments=[
    ['Soporte · Mesa de ayuda','#29A9DB','TICKETS'],
    ['Ciberseguridad','#22B89A','SOC · DEFENDER'],
    ['Equipo Comercial','#F4B544','CLIENTES · CRM'],
    ['C-LEVELS','#8457DE','ESTRATEGIA'],
    ['Entrenamiento','#EA8B4A','LEARNING'],
    ['Development Seniors IA','#4778D9','CODE · AI']
  ];
  function office(w,d,base,department,index){
    const [name,color,screenText]=department;
    // Open front and side bays reveal real furnished floors, not opaque facades.
    block({w,d,h:.22,y:base,color:'#A9B4C1'});
    block({w,d:.45,h:2.1,y:base,z:-d/2+.22,color:'#758393'});
    block({w:.45,d,h:2.1,y:base,x:-w/2+.22,color:'#8996A5'});
    for(const x of [-w/2+.4,w/2-.4])block({x,z:d/2-.3,y:base,w:.6,d:.6,h:2.1,color:'#D8E0E7'});
    block({w,d:.3,h:.26,y:base+2.02,z:d/2,color:color,studs:false});
    const label=sign(group,name,{w:w-1.4,h:.65,y:base+.03,z:d/2+.24,bg:'#243246',fg:'#FFFFFF'});
    label.material.emissive.set('#FFFFFF');label.material.emissiveMap=label.material.map;label.material.emissiveIntensity=.35;
    sign(group,screenText,{w:6,h:1.05,y:base+1.3,z:-d/2+.48,bg:'#132434',fg:color});
    for(let i=0;i<3;i++){
      const x=(i-1)*3.5,z=d/2-2;
      block({x,z:z+.65,y:base+.85,w:2.4,d:1.1,h:.16,color:'#E1E6EA'});
      block({x,z:z+.65,y:base+.25,w:.35,d:.45,h:.6,color:'#627080',studs:false});
      block({x,z:z+.2,y:base+1.04,w:.95,d:.12,h:.58,color:'#182332',studs:false});
      block({x,z:z+.28,y:base+1.1,w:.78,d:.04,h:.4,mat:plastic(color,{emissive:color,emissiveIntensity:.6}),studs:false});
      block({x,z:z+.8,y:base+1.02,w:.75,d:.3,h:.05,color:'#546276',studs:false});
      const person=minifig(color,'#263243');person.scale.setScalar(.57);person.position.set(x,base+.24,z-.35);group.add(person);
      staff.push({person,phase:index*1.3+i,role:index,station:i,origin:person.position.clone()});
      if(index===0){ // Headsets distinguish the help desk.
        const headset=new THREE.Mesh(new THREE.TorusGeometry(.33,.045,5,12,Math.PI),plastic('#202A38'));
        headset.position.y=2.44;person.add(headset);
      }
    }
    if(index===2||index===3){
      // Sales pipeline and executive KPIs, built as colored LEGO charts.
      for(let j=0;j<4;j++)block({x:-2+j*1.2,z:-d/2+.6,y:base+.35,w:.7,d:.12,h:.25+j*.22,color,studs:false});
    }
    if(index===4){
      block({x:4.5,z:-d/2+1,y:base+.65,w:2.1,d:.15,h:1.1,color:'#F4F5F7',studs:false});
      for(let j=0;j<3;j++)block({x:4.5,z:-d/2+1.1,y:base+.85+j*.25,w:1.5-j*.2,d:.05,h:.07,color,studs:false});
    }
    if(index===1||index===5){
      for(const x of [w/2-1.1,w/2-2.2]){
        block({x,z:-d/2+1,y:base+.22,w:.8,d:.65,h:1.7,color:'#28394C'});
        for(let j=0;j<4;j++)block({x,z:-d/2+1.35,y:base+.45+j*.3,w:.55,d:.06,h:.08,color:'#4DDBDA',studs:false});
      }
    }
  }
  let y=1.7;
  for(const [w,d,floors] of [[18,16,3],[14,12,8],[10,9,6],[6,6,3]]) {
    for(let floor=0;floor<floors;floor++) {
      const department=w===14&&floor<6?departments[floor]:null;
      if(department)office(w,d,y,department,floor);
      else block({w,d,h:2.1,y,color:floor%2?'#A9B4C1':'#CBD2DA'});
      // Narrow windows and projecting piers give the tower its Art Deco rhythm.
      for(const side of [-1,1]) {
        if(department)continue;
        for(let x=-w/2+1.4;x<w/2-1;x+=2.1) {
          windows.push([x,y+1,side*(d/2+.06),.85,1.25,.13]);
          block({x:x+.68,z:side*(d/2+.12),y,w:.3,d:.35,h:2.1,color:'#E0E5EB',studs:false});
        }
        for(let z=-d/2+1.4;z<d/2-1;z+=2.1)windows.push([side*(w/2+.06),y+1,z,.13,1.25,.85]);
      }
      y+=2.3;
    }
    block({w:w+1.2,d:d+1.2,h:.45,y,color:'#7B8999'});y+=.6;
  }
  block({w:4,d:4,h:3,y,color:'#A9B4C1'});
  block({w:2,d:2,h:3,y:y+3,color:'#CBD2DA'});
  roundBrick(group,{ctx,r:.35,h:8,y:y+6,color:'#D1D9E6',stud:false});
  const windowMaterial=plastic('#517D9F',{emissive:'#FFDB91',emissiveIntensity:0});
  const panes=new THREE.InstancedMesh(rbox(1,1,1),windowMaterial,windows.length);
  const dummy=new THREE.Object3D();
  windows.forEach(([x,y,z,w,h,d],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();panes.setMatrixAt(i,dummy.matrix);});group.add(panes);
  // Continuous raised pedestrian bridge connects the lobby to the south promenade.
  for(let z=10;z<=32;z+=2){
    block({w:4.8,d:1.94,h:.45,y:.7,z,color:'#E9DDC1'});
    if(z%4===0)for(const x of [-2.55,2.55]){
      block({w:.45,d:.45,h:1.65,x,z,y:.7,color:'#F2E7D3'});
      block({w:.25,d:4,h:.25,x,z:z+1,y:2,color:'#8D83BA',studs:false});
      block({w:.7,d:.7,h:1.1,x,z,y:-.4,color:'#B3AB97',studs:false});
    }
  }
  block({w:7,d:4,h:.45,y:.7,z:34,color:'#E9DDC1'});
  block({w:4,d:.25,h:3,x:0,z:8.06,y:1.7,color:'#5900FF',studs:false});
  // Road from the south boulevard to a six-bay forecourt, outside OneLake.
  block({w:7,d:24,h:.25,y:.08,z:71,color:'#617082',studs:false});
  block({w:19,d:26,h:.25,y:.08,z:48,color:'#CFC7B7',studs:false});
  block({w:18,d:25,h:.25,y:.12,z:48,color:'#617082',studs:false});
  for(const x of [-3.6,3.6])block({x,z:71,w:.22,d:23,h:.05,y:.34,color:'#FFF1BE',studs:false});
  for(let z=62;z<=80;z+=4)block({z,w:.2,d:1.8,h:.04,y:.35,color:'#FFF1BE',studs:false});
  for(const side of [-1,1]){
    for(const z of [38.5,45.5,52.5,59.5])block({x:side*5.6,z,w:5.8,d:.16,h:.04,y:.38,color:'#FFFFFF',studs:false});
    for(const z of [42,49,56])block({x:side*8,z,w:.35,d:2.8,h:.2,y:.37,color:'#F2C200',studs:false});
  }
  // Pedestrian frontage continues directly into the existing bridge landing.
  block({w:18,d:2.5,h:.45,y:.7,z:36,color:'#E9DDC1'});
  block({w:4.8,d:2,h:.35,y:.35,z:38.3,color:'#E9DDC1',studs:false});
  for(let x=-7;x<=7;x+=2)block({x,z:39.6,w:1.1,d:1.3,h:.04,y:.39,color:'#FFFFFF',studs:false});
  sign(group,'P · ITSE',{x:8,y:3,z:36,w:4,h:1.4,bg:'#5900FF',fg:'#FFFFFF'});
  // Freestanding LEGO logo on the upper terrace: no rectangular image backing.
  const logo=new THREE.Group();logo.position.set(0,50.7,4.2);group.add(logo);
  block({w:17,d:2,h:.6,y:50.1,z:4.2,color:'#F3E7D1'});
  const logoMaterial=plastic('#5900FF',{emissive:'#5900FF',emissiveIntensity:.35});
  const logoMesh=new THREE.InstancedMesh(rbox(.225,.225,.9),logoMaterial,72*24);logoMesh.count=0;logoMesh.castShadow=true;logo.add(logoMesh);
  const image=new Image();
  image.onload=()=>{
    const canvas=document.createElement('canvas');canvas.width=72;canvas.height=24;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    context.drawImage(image,0,0,image.width,image.height*.71,0,0,72,24);
    const pixels=context.getImageData(0,0,72,24).data,points=[];
    for(let row=0;row<24;row++)for(let col=0;col<72;col++){
      const i=(row*72+col)*4;
      if(pixels[i+3]>100&&pixels[i+2]>100)points.push([col,row]);
    }
    const mesh=logoMesh;mesh.count=points.length;
    points.forEach(([col,row],i)=>{dummy.position.set((col-35.5)*.23,(23-row)*.23,0);dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
  };
  image.src=new URL('../assets/itse-logo.png',import.meta.url).href;
  // Art Deco crown: stepped metallic LEGO ribs below the antenna.
  for(const x of [-1.5,0,1.5])block({x,y:y+1,w:.3,d:4.2,h:3.8,color:'#E0E5EB',studs:false});
  world.anims.push(t=>{
    for(const {person,phase,role,station,origin} of staff){
      const cycle=(t*.22+phase)%(Math.PI*2);
      // Alternating typing, listening and explaining, with independent timing.
      const explaining=(role===2||role===3||role===4)&&Math.sin(cycle)>.15;
      person.rotation.y=Math.sin(t*.65+phase)*(explaining?.32:.1);
      person.position.y=origin.y+Math.sin(t*1.5+phase)*.018;
      person.userData.arms.forEach((arm,i)=>{
        arm.rotation.x=explaining?-.65+Math.sin(t*2+phase+i)*.45:-.55+Math.sin(t*5.5+phase+i*1.6)*.22;
        arm.rotation.z=(i===0?1:-1)*(explaining?.35+Math.sin(t*1.6+phase)*.2:.15);
      });
      if(role===0&&station===0){person.userData.arms[0].rotation.x=-1.7+Math.sin(t+phase)*.12;}
      // Short unobstructed aisle behind the desk: step back, turn and return.
      if(station===2){
        const progress=(t+phase*3)%18;
        const retreat=progress<3?progress/3:progress<6?1:progress<9?1-(progress-6)/3:0;
        const moving=progress<3||(progress>=6&&progress<9);
        person.position.z=origin.z-retreat*.85;
        person.userData.legs.forEach((leg,i)=>{leg.rotation.x=moving?Math.sin(t*8+phase+i*Math.PI)*.3:0;});
        person.rotation.y+=retreat*.65;
      }
    }
  });
  world.itseTower={group,height:y+14,windowMaterial,logo,staff,departments:departments.map(d=>d[0])};
}
