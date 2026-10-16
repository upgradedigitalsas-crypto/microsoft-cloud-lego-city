// ============================================================================
//  LEGO primitives: ladrillos, placas, studs instanciados, vehículos, minifigs
// ============================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const BRICK_H = 1.2;
export const PLATE_H = 0.4;
const STUD_R = 0.3;
const STUD_H = 0.18;

// ---------------------------------------------------------------------------
// Caches
// ---------------------------------------------------------------------------
const geoCache = new Map();
export function rbox(w, h, d) {
  const key = `${w.toFixed(2)}|${h.toFixed(2)}|${d.toFixed(2)}`;
  if (!geoCache.has(key)) {
    const r = Math.min(0.08, w / 4, h / 4, d / 4);
    const geometry = new RoundedBoxGeometry(w, h, d, 2, r);
    geometry.userData.primitiveKey = `rbox:${key}`;
    geoCache.set(key, geometry);
  }
  return geoCache.get(key);
}
export const studGeo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 14);
const cylCache = new Map();
export function cylGeo(r, h, seg = 20) {
  const key = `${r}|${h}|${seg}`;
  if (!cylCache.has(key)) cylCache.set(key, new THREE.CylinderGeometry(r, r, h, seg));
  return cylCache.get(key);
}

// Material "ABS plástico"
export function plastic(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.32, metalness: 0.0, ...extra,
  });
}
// Caché de materiales por "dueño" para poder atenuar edificios individualmente
export function matCache() {
  const map = new Map();
  const fn = (color, extra) => {
    const key = color + JSON.stringify(extra || {});
    if (!map.has(key)) {
      const m = plastic(color, extra);
      m.userData.base = new THREE.Color(color);
      map.set(key, m);
    }
    return map.get(key);
  };
  fn.all = () => [...map.values()];
  return fn;
}

// ---------------------------------------------------------------------------
// Studs estáticos (InstancedMesh por color) para rendimiento
// ---------------------------------------------------------------------------
export class StudBatch {
  constructor() { this.byColor = new Map(); }
  add(obj, x, y, z, color, material) {
    if (!this.byColor.has(color)) this.byColor.set(color, []);
    this.byColor.get(color).push({ obj, material, v: new THREE.Vector3(x, y, z) });
  }
  addWorld(x, y, z, color) { this.add(null, x, y, z, color); }
  flush(scene) {
    const matrix = new THREE.Matrix4();
    for (const [color, list] of this.byColor) {
      const owners = new Map();
      for (const item of list) {
        const owner = item.obj || scene;
        if (!owners.has(owner)) owners.set(owner, []);
        owners.get(owner).push(item);
      }
      for (const [owner, items] of owners) {
        const material = items[0].material || plastic(color);
        const mesh = new THREE.InstancedMesh(studGeo, material, items.length);
        items.forEach((item, i) => mesh.setMatrixAt(i, matrix.makeTranslation(item.v.x, item.v.y, item.v.z)));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        owner.add(mesh);
      }
    }
    this.byColor.clear();
  }
}

// ---------------------------------------------------------------------------
// Ladrillo genérico. (x,y,z) = centro de la base.
// studs: 'batch' (requiere ctx.studs), 'mesh' o false
// ---------------------------------------------------------------------------
export function brick(parent, o) {
  const { w = 2, d = 2, h = BRICK_H, x = 0, y = 0, z = 0, color = '#ffffff', studs = 'batch', mat, ctx } = o;
  const material = mat || (ctx?.m ? ctx.m(color) : plastic(color));
  const mesh = new THREE.Mesh(rbox(w, h, d), material);
  mesh.userData.staticBrick = true;
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (studs) {
    const nx = Math.max(1, Math.round(w)), nz = Math.max(1, Math.round(d));
    const sx = w / nx, sz = d / nz;
    const batch = studs === 'batch' && ctx?.studs ? ctx.studs : new StudBatch();
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      batch.add(parent, x - w / 2 + sx * (i + 0.5), y + h + STUD_H / 2,
        z - d / 2 + sz * (j + 0.5), '#' + material.color.getHexString(), material);
    }
    if (batch !== ctx?.studs) batch.flush(parent);
  }
  return mesh;
}
export const plate = (p, o) => brick(p, { h: PLATE_H, ...o });
export const tile = (p, o) => brick(p, { h: PLATE_H, studs: false, ...o });

export function roundBrick(parent, o) {
  const { r = 1, h = BRICK_H, x = 0, y = 0, z = 0, color = '#fff', ctx, mat, stud = true, seg = 24 } = o;
  const material = mat || (ctx?.m ? ctx.m(color) : plastic(color));
  const mesh = new THREE.Mesh(cylGeo(r, h, seg), material);
  mesh.userData.staticBrick = true;
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (stud) {
    const s = new THREE.Mesh(studGeo, material);
    s.position.set(x, y + h + STUD_H / 2, z);
    parent.add(s);
  }
  return mesh;
}

// ---------------------------------------------------------------------------
// Texturas de letreros
// ---------------------------------------------------------------------------
export function signTexture(text, { bg = '#ffffff', fg = '#1b2433', w = 512, h = 128, font = 'bold 64px Inter, Arial', logo = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  let x = w / 2;
  if (logo === 'ms') {
    const s = h * 0.22, ox = h * 0.22, oy = h / 2 - s - 3;
    const cols = ['#F25022', '#7FBA00', '#00A4EF', '#FFB900'];
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([i, j], k) => {
      g.fillStyle = cols[k]; g.fillRect(ox + i * (s + 6), oy + j * (s + 6), s, s);
    });
    x = w / 2 + h * 0.3;
  }
  g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, x, h / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export function sign(parent, text, { w = 8, h = 2, x = 0, y = 0, z = 0, ry = 0, bg, fg, logo } = {}) {
  const tex = signTexture(text, { bg, fg, logo, w: 512, h: Math.round(512 * h / w) });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  parent.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------------------
// Árbol LEGO
// ---------------------------------------------------------------------------
export function tree(parent, x, z, ctx, s = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0.4, z);
  g.scale.setScalar(s);
  roundBrick(g, { r: 0.35, h: 2.2, color: '#7A4B2A', stud: false, ctx });
  const green = ['#5DBB63', '#4CAF50', '#6CC66F'][Math.floor(Math.random() * 3)];
  const m = ctx?.m ? ctx.m(green) : plastic(green);
  const cone1 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12), m);
  cone1.position.y = 3.4; cone1.scale.y = 1.15; cone1.castShadow = true;
  g.add(cone1);
  parent.add(g);
  return g;
}

// ---------------------------------------------------------------------------
// Minifigura
// ---------------------------------------------------------------------------
export function minifig(torso = '#1E7BD8', legs = '#2B2F3A', hat = null) {
  const g = new THREE.Group();
  const yellow = plastic('#FFD02A');
  const legL = new THREE.Mesh(rbox(0.45, 0.9, 0.5), plastic(legs));
  const legR = legL.clone();
  legL.position.set(-0.24, 0.45, 0); legR.position.set(0.24, 0.45, 0);
  const hip = new THREE.Mesh(rbox(1, 0.2, 0.5), plastic(legs)); hip.position.y = 1.0;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.0, 4, 1), plastic(torso));
  body.rotation.y = Math.PI / 4; body.scale.set(1, 1, 0.55); body.position.y = 1.6;
  const head = new THREE.Mesh(cylGeo(0.3, 0.55, 16), yellow); head.position.y = 2.42;
  const stud = new THREE.Mesh(cylGeo(0.16, 0.14, 12), yellow); stud.position.y = 2.76;
  const armL = new THREE.Mesh(rbox(0.22, 0.75, 0.25), plastic(torso));
  const armR = armL.clone();
  armL.position.set(-0.55, 1.6, 0); armR.position.set(0.55, 1.6, 0);
  armL.rotation.z = 0.15; armR.rotation.z = -0.15;
  // Ojos
  const eyeM = new THREE.MeshBasicMaterial({ color: '#111' });
  const eyeG = new THREE.SphereGeometry(0.045, 6, 6);
  const e1 = new THREE.Mesh(eyeG, eyeM); e1.position.set(-0.1, 2.48, 0.29);
  const e2 = e1.clone(); e2.position.x = 0.1;
  g.add(legL, legR, hip, body, head, stud, armL, armR, e1, e2);
  if (hat) {
    const h = new THREE.Mesh(cylGeo(0.34, 0.25, 16), plastic(hat)); h.position.y = 2.8;
    g.add(h);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData.legs = [legL, legR];
  g.userData.arms = [armL, armR];
  g.scale.setScalar(0.8);
  return g;
}

// ---------------------------------------------------------------------------
// Camión LEGO (eje +X hacia adelante)
// ---------------------------------------------------------------------------
export function truck(cabColor = '#1E7BD8', cargoColor = '#ffffff', label = '') {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const dark = plastic('#3B4250');
  const ch = new THREE.Mesh(rbox(7, 0.5, 2.6), dark); ch.position.set(0, 0.85, 0); body.add(ch);
  // Cabina
  brick(body, { w: 2, d: 2.6, h: 2.2, x: 2.4, y: 1.1, color: cabColor, studs: 'mesh' });
  const glass = new THREE.Mesh(rbox(0.12, 0.9, 2.2), new THREE.MeshStandardMaterial({ color: '#9fd3ff', roughness: 0.05, transparent: true, opacity: 0.85 }));
  glass.position.set(3.42, 2.55, 0); body.add(glass);
  const side = new THREE.Mesh(rbox(1.2, 0.8, 0.06), glass.material);
  const s1 = side.clone(); s1.position.set(2.5, 2.55, 1.31);
  const s2 = side.clone(); s2.position.set(2.5, 2.55, -1.31);
  body.add(s1, s2);
  // Faros
  const lm = new THREE.MeshStandardMaterial({ color: '#fff7c2', emissive: '#ffe680', emissiveIntensity: 0.6 });
  const l1 = new THREE.Mesh(rbox(0.1, 0.3, 0.45), lm); l1.position.set(3.42, 1.5, 0.85);
  const l2 = l1.clone(); l2.position.z = -0.85; body.add(l1, l2);
  // Caja de carga
  const cargo = brick(body, { w: 4.6, d: 2.6, h: 2.6, x: -1.1, y: 1.1, color: cargoColor, studs: 'mesh' });
  const stripe = new THREE.Mesh(rbox(4.62, 0.4, 2.62), plastic(cabColor));
  stripe.position.set(-1.1, 1.6, 0); body.add(stripe);
  if (label) {
    const tex = signTexture(label, { bg: cargoColor === '#3D3D3D' ? '#3D3D3D' : '#ffffff', fg: cargoColor === '#3D3D3D' ? '#fff' : cabColor, w: 512, h: 256, font: 'bold 96px Inter, Arial' });
    const pm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.6), pm);
    p1.position.set(-1.1, 2.6, 1.32); body.add(p1);
    const p2 = p1.clone(); p2.position.z = -1.32; p2.rotation.y = Math.PI; body.add(p2);
  }
  // Ruedas
  const wheels = [];
  const tyreG = cylGeo(0.62, 0.5, 18), hubG = cylGeo(0.3, 0.52, 10);
  const tyreM = plastic('#1d1f24'), hubM = plastic('#c9ced6');
  [[2.4, 1.2], [2.4, -1.2], [-2.2, 1.2], [-2.2, -1.2], [-0.8, 1.2], [-0.8, -1.2]].forEach(([x, z]) => {
    const w = new THREE.Group();
    const t = new THREE.Mesh(tyreG, tyreM); const hb = new THREE.Mesh(hubG, hubM);
    w.add(t, hb); w.rotation.x = Math.PI / 2; w.position.set(x, 0.62, z);
    t.castShadow = true; body.add(w); wheels.push(w);
  });
  body.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { wheels, body, cargo };
  g.scale.setScalar(0.78);
  return g;
}

// Coche patrulla (Defender)
export function patrolCar() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  brick(body, { w: 4, d: 2.2, h: 0.9, y: 0.45, color: '#2FA05A', studs: false });
  brick(body, { w: 2.2, d: 2, h: 0.9, x: -0.2, y: 1.35, color: '#ffffff', studs: false });
  const glass = new THREE.Mesh(rbox(0.1, 0.6, 1.8), new THREE.MeshStandardMaterial({ color: '#9fd3ff', transparent: true, opacity: 0.85 }));
  glass.position.set(0.92, 1.8, 0); body.add(glass);
  const red = new THREE.MeshStandardMaterial({ color: '#ff3b3b', emissive: '#ff0000', emissiveIntensity: 1 });
  const blue = new THREE.MeshStandardMaterial({ color: '#3b7bff', emissive: '#0044ff', emissiveIntensity: 1 });
  const lr = new THREE.Mesh(rbox(0.5, 0.3, 0.6), red); lr.position.set(-0.2, 2.4, 0.45);
  const lb = new THREE.Mesh(rbox(0.5, 0.3, 0.6), blue); lb.position.set(-0.2, 2.4, -0.45);
  body.add(lr, lb);
  const shield = signTexture('🛡', { bg: '#2FA05A', fg: '#fff', w: 128, h: 128, font: '90px Arial' });
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshStandardMaterial({ map: shield }));
  sm.position.set(0.6, 0.9, 1.11); body.add(sm);
  const wheels = [];
  const tyreG = cylGeo(0.48, 0.4, 16), tyreM = plastic('#1d1f24');
  [[1.3, 1.05], [1.3, -1.05], [-1.3, 1.05], [-1.3, -1.05]].forEach(([x, z]) => {
    const w = new THREE.Mesh(tyreG, tyreM); w.rotation.x = Math.PI / 2; w.position.set(x, 0.48, z); body.add(w); wheels.push(w);
  });
  body.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData = { wheels, body, lights: [red, blue] };
  g.scale.setScalar(0.85);
  return g;
}

// Dron Copilot
export function drone() {
  const g = new THREE.Group();
  const purple = plastic('#9B5CD6');
  const core = new THREE.Mesh(rbox(1.6, 0.5, 1.6), purple); g.add(core);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#d9c4ff', emissive: '#a070ff', emissiveIntensity: 0.6, transparent: true, opacity: 0.9 }));
  dome.position.y = 0.25; g.add(dome);
  const rotors = [];
  const armM = plastic('#ffffff');
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([x, z]) => {
    const arm = new THREE.Mesh(rbox(1.4, 0.15, 0.2), armM);
    arm.position.set(x * 0.6, 0.1, z * 0.6); arm.rotation.y = Math.atan2(-z, x); g.add(arm);
    const hub = new THREE.Mesh(cylGeo(0.12, 0.3, 8), purple); hub.position.set(x * 1.1, 0.25, z * 1.1); g.add(hub);
    const rotor = new THREE.Mesh(rbox(1.3, 0.04, 0.16), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 }));
    rotor.position.set(x * 1.1, 0.42, z * 1.1); g.add(rotor); rotors.push(rotor);
  });
  // Haz de luz hacia abajo
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.2, 6, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#b48cff', transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.y = -3.2; g.add(beam);
  g.traverse(o => { if (o.isMesh && o !== beam) o.castShadow = true; });
  g.userData = { rotors, beam };
  return g;
}

// Montacargas
export function forklift(color = '#F2C200') {
  const g = new THREE.Group();
  brick(g, { w: 2.2, d: 1.6, h: 1, y: 0.3, color, studs: false });
  brick(g, { w: 1, d: 1.6, h: 0.3, x: -0.6, y: 1.3, color: '#3B4250', studs: false });
  const mast = new THREE.Mesh(rbox(0.2, 2.6, 1.4), plastic('#3B4250')); mast.position.set(1.2, 1.5, 0); g.add(mast);
  const fork = new THREE.Mesh(rbox(1.2, 0.1, 1.0), plastic('#555')); fork.position.set(1.8, 0.5, 0); g.add(fork);
  const fig = minifig('#F28C28', '#2B2F3A', '#F2C200'); fig.position.set(-0.3, 0.6, 0); fig.scale.setScalar(0.6); g.add(fig);
  [[0.7, 0.85], [0.7, -0.85], [-0.7, 0.85], [-0.7, -0.85]].forEach(([x, z]) => {
    const w = new THREE.Mesh(cylGeo(0.35, 0.3, 12), plastic('#1d1f24')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.35, z); g.add(w);
  });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData.fork = fork;
  return g;
}

// ---------------------------------------------------------------------------
// Corchetes de selección (estilo WareTrack)
// ---------------------------------------------------------------------------
export function brackets(color = '#2563EB') {
  const pts = [];
  const L = 0.28; // proporción del lado
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const c = [sx * 0.5, sy * 0.5, sz * 0.5];
    pts.push(...c, sx * (0.5 - L), sy * 0.5, sz * 0.5);
    pts.push(...c, sx * 0.5, sy * (0.5 - L), sz * 0.5);
    pts.push(...c, sx * 0.5, sy * 0.5, sz * (0.5 - L));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true }));
  lines.renderOrder = 999;
  return lines;
}

// Merge only explicitly static primitives; animated parents remain independent.
export function batchStaticBricks(root) {
  const parents = [];
  root.traverse(o => { if (o.children.length) parents.push(o); });
  for (const parent of parents) {
    const batches = new Map();
    for (const mesh of parent.children) {
      if (!mesh.isMesh || !mesh.userData.staticBrick || mesh.children.length) continue;
      if (!batches.has(mesh.material)) batches.set(mesh.material, []);
      batches.get(mesh.material).push(mesh);
    }
    for (const [material, meshes] of batches) {
      if (meshes.length < 2) continue;
      const copies = meshes.map(mesh => {
        mesh.updateMatrix();
        // Rounded boxes are non-indexed; cylinders are indexed. Normalize first.
        const copy = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        return copy.applyMatrix4(mesh.matrix);
      });
      const geometry = mergeGeometries(copies);
      copies.forEach(g => g.dispose());
      if (!geometry) continue;
      const merged = new THREE.Mesh(geometry, material);
      merged.castShadow = true; merged.receiveShadow = true;
      meshes.forEach(mesh => parent.remove(mesh));
      parent.add(merged);
    }
  }
}

export function disposeGeometryCaches() {
  geoCache.forEach(g => g.dispose()); geoCache.clear();
  cylCache.forEach(g => g.dispose()); cylCache.clear();
  studGeo.dispose();
}
