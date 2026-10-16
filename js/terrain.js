import * as THREE from 'three';
import { inLake } from './urban.js';
import { PLATE, X_ROADS, Z_ROADS } from './data.js';

export const ISLAND_STEP = 4;
// Preserve every service lot inside an asymmetric, block-stepped coastline.
export function isIslandLand(x, z) {
  if (Math.hypot((x + 76) / 28, (z - 128) / 19) < 1) return true;
  if (x >= PLATE.minX && x <= PLATE.maxX && z >= PLATE.minZ && z <= PLATE.maxZ) return true;
  const angle = Math.atan2(z / 133, x / 168);
  const coast = 1 + 0.085 * Math.sin(3 * angle + 0.5) + 0.055 * Math.cos(5 * angle - 0.7);
  return Math.hypot(x / 168, z / 133) < coast;
}

export function buildIslandTerrain(scene, studs, world) {
  const groups = new Map();
  const add = (color, x, y, z, h) => {
    if (!groups.has(color)) groups.set(color, []);
    groups.get(color).push([x, y, z, h]);
  };
  const neighbors = [[4, 0], [-4, 0], [0, 4], [0, -4]];
  for (let x = -192; x <= 192; x += ISLAND_STEP) {
    for (let z = -156; z <= 156; z += ISLAND_STEP) {
      const land = isIslandLand(x, z);
      const edge = land && neighbors.some(([dx, dz]) => !isIslandLand(x + dx, z + dz));
      if (land) {
        add('#946944', x, -3.6, z, 4.8);
        add(edge ? '#E5CF90' : '#91BD68', x, edge ? -0.85 : -0.6, z, edge ? 0.7 : 1.2);
        if (!edge && !inLake(x, z) && !X_ROADS.some(r => Math.abs(x - r) < 4) && !Z_ROADS.some(r => Math.abs(z - r) < 4)) studs.addWorld(x, 0.09, z, '#91BD68');
      }
    }
  }
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), scale = new THREE.Vector3(), rotation = new THREE.Quaternion();
  for (const [color, cells] of groups) {
    const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.65 }), cells.length);
    cells.forEach(([x, y, z, h], i) => mesh.setMatrixAt(i, matrix.compose(position.set(x, y, z), rotation, scale.set(4, h, 4))));
    mesh.receiveShadow = true; mesh.castShadow = true; scene.add(mesh);
  }
  // Exposed inverted island: progressively narrower strata end in a single earth tip.
  const strata = [
    [1.00, -6, -13, '#9B704C'], [0.94, -13, -23, '#876044'],
    [0.83, -23, -34, '#A27A53'], [0.69, -34, -46, '#79604C'],
    [0.53, -46, -58, '#8B6A4B'], [0.36, -58, -69, '#66564C'],
    [0.20, -69, -79, '#795C43'], [0.08, -79, -86, '#564A40'],
  ];
  for (const [factor, rawTop, rawBottom, color] of strata) {
    const top = rawTop === -6 ? -6 : rawTop * 1.7, bottom = rawBottom * 1.7;
    const cells = [];
    for (let x = -192; x <= 192; x += 8) for (let z = -156; z <= 156; z += 8) {
      if (isIslandLand(x / factor, z / factor)) cells.push([x, z]);
    }
    const rock = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.95 }), cells.length);
    cells.forEach(([x, z], i) => rock.setMatrixAt(i, matrix.compose(position.set(x, (top + bottom) / 2, z), rotation, scale.set(8, top - bottom, 8))));
    rock.castShadow = true; rock.receiveShadow = true; scene.add(rock);
  }
  const tip = new THREE.Mesh(new THREE.ConeGeometry(11, 29, 4), new THREE.MeshStandardMaterial({ color: '#564A40', roughness: 0.95 }));
  tip.rotation.z = Math.PI; tip.position.set(0, -156, 0); scene.add(tip);

  // Ocean shader: a fixed grid and time uniform animate waves without reallocating geometry.
  const time = { value: 0 };
  const seaMaterial = new THREE.MeshStandardMaterial({ color: '#278DB9', roughness: 0.32, metalness: 0.12 });
  seaMaterial.onBeforeCompile = shader => {
    shader.uniforms.oceanTime = time;
    shader.vertexShader = 'uniform float oceanTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      transformed.z += sin(position.x * 0.045 + oceanTime * 0.8) * 1.2
        + cos(position.y * 0.065 - oceanTime * 0.65) * 0.8;
    `);
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
      #include <beginnormal_vertex>
      objectNormal = normalize(vec3(-0.054 * cos(position.x * 0.045 + oceanTime * 0.8),
        0.052 * sin(position.y * 0.065 - oceanTime * 0.65), 1.0));
    `);
  };
  seaMaterial.customProgramCacheKey = () => 'cloudcity-ocean-v1';
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 220, 220), seaMaterial);
  sea.rotation.x = -Math.PI / 2; sea.position.y = -188;
  sea.receiveShadow = true; scene.add(sea);
  world.anims.push(t => { time.value = t; });
}
