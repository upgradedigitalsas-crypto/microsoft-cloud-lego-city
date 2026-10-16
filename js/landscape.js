import * as THREE from 'three';
import { X_ROADS, Z_ROADS } from './data.js';
import { rbox, plastic, sign } from './lego.js';

// Voxel terrain and trees share a handful of draw calls across the whole world.
export function buildLandscape(scene, world, studs) {
  const batches = new Map();
  const add = (color, x, y, z, w, h, d) => {
    if (!batches.has(color)) batches.set(color, []);
    batches.get(color).push([x, y, z, w, h, d]);
  };
  const road = (x, z) => X_ROADS.some(r => Math.abs(x - r) < 5) || Z_ROADS.some(r => Math.abs(z - r) < 5);
  const voxelTree = (x, z, h = 4) => {
    add('#895A34', x, h / 2, z, 0.9, h, 0.9);
    add('#3B954D', x, h + 0.6, z, 4.2, 2.2, 3.8);
    add('#60B64E', x - 0.4, h + 2.1, z, 3.3, 1.3, 3.1);
    add('#85CF58', x - 0.4, h + 3.0, z, 2.2, 0.6, 2.1);
    studs.addWorld(x - 0.4, h + 3.4, z, '#85CF58');
  };
  // Open green strips preserve breathing room between service islands.
  for (let x = -102; x <= 102; x += 12) {
    if (!road(x, -78)) voxelTree(x, -78, 3.3 + (Math.abs(x) % 3));
    if (!road(x, 78)) voxelTree(x, 78, 4.3);
  }
  for (const x of [-105, 105]) for (let z = -62; z < 68; z += 14) {
    if (!road(x, z)) voxelTree(x, z, 3.5);
  }
  for (const x of [-23, 23]) for (const z of [-72, -34, 10, 56]) {
    voxelTree(x + 7, z, 3);
  }
  // A block-built OneLake-inspired data canal and connector bridges.
  add('#36ADD5', -106, 0.18, -1, 6, 0.28, 150);
  for (const z of Z_ROADS) {
    add('#E7D4A1', -106, 0.6, z, 9.5, 0.5, 6);
    add('#FAF3DD', -106, 1.35, z - 3.1, 10, 0.5, 0.4);
    add('#FAF3DD', -106, 1.35, z + 3.1, 10, 0.5, 0.4);
  }
  // Elevated voxel hills outside the service lots.
  for (const [x, z] of [[-104, -74], [103, 74]]) {
    add('#7EA454', x, 1.2, z, 11, 2.4, 11);
    add('#A5BF6A', x + 1, 3.0, z, 7, 1.2, 7);
    add('#E6D7AC', x + 1, 4.0, z, 4, 0.8, 4);
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
  const welcome = new THREE.Group(); welcome.position.set(0, 0, 78); scene.add(welcome);
  sign(welcome, 'MICROSOFT CLOUD', { w: 18, h: 2.6, y: 3.2, bg: '#FFFFFF', fg: '#17456B', logo: 'ms' });
  sign(welcome, 'UN MUNDO DE SERVICIOS', { w: 16, h: 1.2, y: 1.1, bg: '#2169B5', fg: '#FFFFFF' });
}
