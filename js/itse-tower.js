import * as THREE from 'three';
import { brick, roundBrick, matCache, rbox, plastic, sign } from './lego.js';

// Brick-built Art Deco landmark, with the original ITSE silhouette voxelised in 3D.
export function buildITSETower(scene, world, studs) {
  const group=new THREE.Group();group.name='ITSE · Torre del lago';scene.add(group);
  const ctx={studs,m:matCache()},windows=[];
  const block=(o)=>brick(group,{ctx,...o});
  block({w:22,d:20,h:.8,y:.3,color:'#DDD8CB',studs:false});
  block({w:20,d:18,h:.6,y:1.1,color:'#F6EBD5'});
  let y=1.7;
  for(const [w,d,floors] of [[18,16,3],[14,12,8],[10,9,6],[6,6,3]]) {
    for(let floor=0;floor<floors;floor++) {
      block({w,d,h:2.1,y,color:floor%2?'#DDD6C3':'#EEE7D6'});
      // Narrow windows and projecting piers give the tower its Art Deco rhythm.
      for(const side of [-1,1]) {
        for(let x=-w/2+1.4;x<w/2-1;x+=2.1) {
          windows.push([x,y+1,side*(d/2+.06),.85,1.25,.13]);
          block({x:x+.68,z:side*(d/2+.12),y,w:.3,d:.35,h:2.1,color:'#F8EEDB',studs:false});
        }
        for(let z=-d/2+1.4;z<d/2-1;z+=2.1)windows.push([side*(w/2+.06),y+1,z,.13,1.25,.85]);
      }
      y+=2.3;
    }
    block({w:w+1.2,d:d+1.2,h:.45,y,color:'#C5BAA3'});y+=.6;
  }
  block({w:4,d:4,h:3,y,color:'#D7CDB9'});
  block({w:2,d:2,h:3,y:y+3,color:'#E9DFCB'});
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
  world.itseTower={group,height:y+14,windowMaterial,logo};
}
