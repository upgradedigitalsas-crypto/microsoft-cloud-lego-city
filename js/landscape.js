import * as THREE from 'three';
import { DISTRICTS } from './data.js';
import { inLake, BOULEVARD } from './urban.js';
import { isIslandLand } from './terrain.js';
import { rbox, plastic, sign } from './lego.js';

// Voxel terrain and trees share a handful of draw calls across the whole world.
export function buildLandscape(scene, world, studs) {
  const batches = new Map();
  const add = (color, x, y, z, w, h, d) => {
    if (!batches.has(color)) batches.set(color, []);
    batches.get(color).push([x, y, z, w, h, d]);
  };
  const occupied = (x,z) => DISTRICTS.some(d => Math.abs(x-d.pos[0])<18 && Math.abs(z-d.pos[1])<20) || BOULEVARD.some(p => Math.hypot(x-p[0],z-p[1])<9);
  const voxelTree = (x, z, h = 4) => {
    add('#895A34', x, h / 2, z, 0.9, h, 0.9);
    add('#3B954D', x, h + 0.6, z, 4.2, 2.2, 3.8);
    add('#60B64E', x - 0.4, h + 2.1, z, 3.3, 1.3, 3.1);
    add('#85CF58', x - 0.4, h + 3.0, z, 2.2, 0.6, 2.1);
    studs.addWorld(x - 0.4, h + 3.4, z, '#85CF58');
  };
  // OneLake is the civic center: a lake built from blue LEGO tiles, not a road grid.
  for (let x=-36;x<=36;x+=2) for (let z=-30;z<=30;z+=2) {
    if (inLake(x,z)) add((x+z)%6===0?'#32B6D5':'#238DBC',x,0.34,z,2,0.25,2);
    else if (inLake(x*0.9,z*0.9)) { add('#EBD9AD',x,0.28,z,2,0.4,2); studs.addWorld(x,0.56,z,'#EBD9AD'); }
  }
  // Waterfront promenade, benches and green belts follow the island, not a rectangle.
  for (let i=0;i<110;i++) {
    const a=i*Math.PI*2/110, x=Math.cos(a)*40,z=Math.sin(a)*31;
    if (!occupied(x,z)) add('#EADCC0',x,0.34,z,3.1,0.3,3.1);
  }
  for (let i=0;i<80;i++) {
    const a=i*Math.PI*2/80, x=Math.cos(a)*143,z=Math.sin(a)*113;
    if (isIslandLand(x,z) && !occupied(x,z)) voxelTree(x,z,3+(i%3));
  }
  for (const [x,z] of [[-39,-6],[-32,30],[40,8],[-10,-33]]) {
    if (!occupied(x,z)) { voxelTree(x,z,3); add('#9C653F',x+4,0.9,z,3,0.35,1); add('#9C653F',x+4,1.65,z-0.5,3,1,0.25); }
  }
  // A timber data pier joins the Fabric lakehouse to OneLake.
  for(let z=20;z<=32;z+=2) add('#C4965F',24,0.8,z,5,0.5,1.9);
  const lakeSign = new THREE.Group(); lakeSign.position.set(-19,0,9); scene.add(lakeSign);
  sign(lakeSign,'OneLake', {x:0,y:2.5,z:0,w:15,h:3,bg:'#126F9F',fg:'#FFFFFF'});
  sign(lakeSign,'DATOS COMPARTIDOS DEL NEGOCIO', {x:0,y:0.95,z:0,w:20,h:1.4,bg:'#FFFFFF',fg:'#126F9F'});
  // Park pavilions make the shared public space legible at street level.
  for (const [x,z,color] of [[-12,20,'#F2C200'],[12,-20,'#9B5CD6']]) {
    add('#F5F0DA',x,0.6,z,6,1,4); add(color,x,3.2,z,7,0.6,5);
    for(const dx of [-2.5,2.5]) add('#FFFFFF',x+dx,1.9,z,0.6,2.5,0.6);
    studs.addWorld(x,3.65,z,color);
  }
  const matrix = new THREE.Matrix4(), q = new THREE.Quaternion();
  const p = new THREE.Vector3(), scale = new THREE.Vector3();
  for (const [color, blocks] of batches) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), plastic(color), blocks.length);
    blocks.forEach(([x, y, z, w, h, d], i) => mesh.setMatrixAt(i, matrix.compose(p.set(x, y, z), q, scale.set(w, h, d))));
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);
  }
  // Gentle drifting clouds, built from large toy blocks.
  const cloudMat = plastic('#FFFFFF', { roughness: 0.85 });
  for (let i = 0; i < 4; i++) {
    const cloud = new THREE.Group();
    const x = -90 + i * 58, z = -82 + (i % 2) * 145;
    [[0, 0, 0, 11, 2, 5], [-4, 1.2, 0, 5, 2, 4], [3, 1.8, -1, 6, 3, 5]].forEach(([cx, cy, cz, w, h, d]) => {
      const mesh = new THREE.Mesh(rbox(w, h, d), cloudMat);
      mesh.position.set(cx, cy, cz); cloud.add(mesh);
    });
    cloud.position.set(x, 29 + i * 3, z); scene.add(cloud);
    world.anims.push(t => { cloud.position.x = x + Math.sin(t * 0.025 + i) * 6; });
  }
  const welcome = new THREE.Group(); welcome.position.set(6, 0, 125); scene.add(welcome);
  sign(welcome, 'MICROSOFT CLOUD', { w: 18, h: 2.6, y: 3.2, bg: '#FFFFFF', fg: '#17456B', logo: 'ms' });
  sign(welcome, 'UN MUNDO DE SERVICIOS', { w: 16, h: 1.2, y: 1.1, bg: '#2169B5', fg: '#FFFFFF' });
}
