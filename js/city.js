// ============================================================================
//  Ciudad LEGO: baseplate, calles y distritos del portafolio Microsoft Cloud
// ============================================================================
import * as THREE from 'three';
import { buildBeach } from './beach.js';
import { BOULEVARD, roadAccess } from './urban.js';
import { SERVICE_ROLES } from './ecosystem.js';
import { buildIslandTerrain } from './terrain.js';
import { buildLandscape } from './landscape.js';
import { DISTRICTS, PILLARS, X_ROADS, Z_ROADS, PLATE } from './data.js';
import {
  brick, plate, tile, roundBrick, sign, tree, matCache, StudBatch, minifig, forklift,
  rbox, cylGeo, signTexture, BRICK_H, PLATE_H, batchStaticBricks,
} from './lego.js';

const ROAD_W = 6;
const WHITE = '#F7F8FA';
const LGRAY = '#C9D0DA';
const DGRAY = '#4A5260';

export function buildCity(scene) {
  const studs = new StudBatch();
  const world = { buildings: new Map(), anims: [], studs };

  buildIslandTerrain(scene, studs, world);
  buildRoads(scene);

  for (const def of DISTRICTS) {
    const b = buildDistrict(scene, def, studs);
    world.buildings.set(def.id, b);
    world.anims.push(...b.anims);
  }
  decorate(scene, studs, world);
  buildLandscape(scene, world, studs);
  buildBeach(scene, world, studs);
  studs.flush(scene);
  batchStaticBricks(scene);
  world.beach.group.traverse(o => { if(o.isMesh) o.userData.landmark = 'beach'; });
  // Include batched studs and sign materials in owner picking/filter lists.
  world.buildings.forEach(b => {
    b.meshes = [];
    const materials = new Set();
    b.group.traverse(o => {
      if (!o.isMesh) return;
      o.userData.entityId = b.def.id;
      b.meshes.push(o);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m));
    });
    b.materials = [...materials];
  });
  return world;
}

// ---------------------------------------------------------------------------
// Suelo y calles
// ---------------------------------------------------------------------------
function onRoad(x, z, pad = 0) {
  const hw = ROAD_W / 2 + pad;
  return X_ROADS.some(r => Math.abs(x - r) < hw) || Z_ROADS.some(r => Math.abs(z - r) < hw);
}

function buildRoads(scene) {
  const asphalt = new THREE.MeshStandardMaterial({ color: '#617082', roughness: 0.8 });
  const curb = new THREE.MeshStandardMaterial({ color: '#E4D5B4' });
  const paint = new THREE.MeshStandardMaterial({ color: '#FFF1BE' });
  const segments = [];
  BOULEVARD.forEach((a, i) => segments.push([a, BOULEVARD[(i + 1) % BOULEVARD.length], 7]));
  for (const d of DISTRICTS) {
    const access = roadAccess(...d.pos);
    segments.push([access.point, access.dock, 5]);
  }
  const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion(), position = new THREE.Vector3(), scale = new THREE.Vector3();
  for (const [material, extra, height] of [[curb, 2, 0.18], [asphalt, 0, 0.24]]) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, segments.length);
    segments.forEach(([a, b, width], i) => {
      quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(b[0] - a[0], b[1] - a[1]));
      mesh.setMatrixAt(i, matrix.compose(position.set((a[0]+b[0])/2, height/2, (a[1]+b[1])/2), quaternion, scale.set(width+extra, height, Math.hypot(b[0]-a[0],b[1]-a[1])+0.5)));
    });
    mesh.receiveShadow = true; scene.add(mesh);
  }
  const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.04, 2), paint, BOULEVARD.length * 3);
  BOULEVARD.forEach((a, i) => {
    const b = BOULEVARD[(i+1)%BOULEVARD.length];
    quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.atan2(b[0]-a[0],b[1]-a[1]));
    for (let j=0;j<3;j++) { const f=(j+0.5)/3; marks.setMatrixAt(i*3+j,matrix.compose(position.set(a[0]+(b[0]-a[0])*f,0.27,a[1]+(b[1]-a[1])*f),quaternion,scale.set(1,1,1))); }
  });
  scene.add(marks);
}

// ---------------------------------------------------------------------------
// Distritos
// ---------------------------------------------------------------------------
function buildDistrict(scene, def, studs) {
  const g = new THREE.Group();
  const [bx, bz] = def.pos;
  g.position.set(bx, 0, bz);
  scene.add(g);
  const m = matCache();
  const ctx = { m, studs, color: PILLARS[def.pillar].color, def };

  // Lote: placa clara con borde de color del pilar
  const lotW = 28;
  const lotD = 26;
  plate(g, { w: lotW, d: lotD, color: '#F1F4F8', ctx, studs: false });
  tile(g, { w: lotW, d: 0.8, z: lotD / 2 - 0.4, y: 0.01, color: ctx.color, ctx, h: 0.42 });
  tile(g, { w: lotW, d: 0.8, z: -lotD / 2 + 0.4, y: 0.01, color: ctx.color, ctx, h: 0.42 });

  const builder = BUILDERS[def.kind] || BUILDERS.officeTower;
  const res = builder(g, ctx) || {};
  const height = res.height || 8;

  const access = roadAccess(bx, bz);
  const [rx, rz] = access.point, [dx, dz] = access.dock;
  const dock = new THREE.Group(); g.add(dock);
  for (let i = -1; i <= 1; i++) tile(dock, { w: 3.8, d: 0.25, x: dx-bx+i*5, z: dz-bz, y: 0.3, color: '#F2C200', ctx, h: 0.06 });
  const entrance = buildServiceEntrance(g, ctx, lotW, lotD);
  // Recolecta meshes para picking y atenuado
  const meshes = [];
  g.traverse(o => { if (o.isMesh) { o.userData.entityId = def.id; meshes.push(o); } });

  return {
    def, group: g, height, anims: res.anims || [], api: res.api || {}, entrance,
    lot: { width: lotW, depth: lotD },
    roadIndex: access.index, road: new THREE.Vector3(rx, 0, rz),
    dock: new THREE.Vector3(dx, 0, dz),
    slots: [-5, 0, 5].map(o => new THREE.Vector3(dx + o, 0, dz)),
    materials: m.all(), meshes,
    size: new THREE.Vector3(res.w || 14, height, res.d || 12),
  };
}

// --------------- utilidades de construcción ---------------
const glassOf = ctx => ctx.m('#9fd3ff', { transparent: true, opacity: 0.78, roughness: 0.05 });

function floors(g, ctx, { w, d, n, color, x = 0, z = 0, y = PLATE_H, accent = WHITE }) {
  let yy = y;
  for (let i = 0; i < n; i++) {
    brick(g, { w, d, h: PLATE_H, x, z, y: yy, color: i % 2 ? color : accent, ctx, studs: false });
    yy += PLATE_H;
    const glass = new THREE.Mesh(rbox(w - 0.3, BRICK_H, d - 0.3), glassOf(ctx));
    glass.position.set(x, yy + BRICK_H / 2, z); g.add(glass);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      brick(g, { w: 0.8, d: 0.8, h: BRICK_H, x: x + sx * (w / 2 - 0.4), z: z + sz * (d / 2 - 0.4), y: yy, color, ctx, studs: false });
    }
    yy += BRICK_H;
  }
  brick(g, { w, d, h: PLATE_H, x, z, y: yy, color, ctx });
  return yy + PLATE_H;
}
function frontSign(g, text, { w, y, z, bg = '#ffffff', fg = '#1b2433', logo, x = 0 }) {
  sign(g, text, { w, h: w / 4, x, y, z: z + 0.02, bg, fg, logo });
}

// --------------- builders por tipo ---------------
const BUILDERS = {
  // Microsoft 365: dos torres de oficinas
  officeTower(g, ctx) {
    const top = floors(g, ctx, { w: 10, d: 8, n: 7, color: ctx.color, x: -3, z: -2 });
    const top2 = floors(g, ctx, { w: 7, d: 6, n: 4, color: '#D83B01', x: 6, z: 0 });
    frontSign(g, 'Microsoft 365', { w: 8, y: top - 2, z: 2.05, x: -3, logo: 'ms' });
    // Iconos de apps en la azotea
    const apps = [['#185ABD', 'W'], ['#107C41', 'X'], ['#C43E1C', 'P'], ['#5B5FC7', 'T'], ['#0078D4', 'O']];
    apps.forEach(([c, l], i) => {
      const b = brick(g, { w: 1.6, d: 1.6, h: 1.6, x: -6.5 + i * 1.8, z: -2, y: top, color: c, ctx, studs: 'mesh' });
      const t = signTexture(l, { bg: c, fg: '#fff', w: 128, h: 128, font: 'bold 90px Arial' });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshStandardMaterial({ map: t }));
      p.position.set(-6.5 + i * 1.8, top + 0.8, -1.18); g.add(p);
    });
    const antenna = roundBrick(g, { r: 0.15, h: 3, x: 6, z: 0, y: top2, color: LGRAY, ctx });
    const blink = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshStandardMaterial({ color: '#ff4040', emissive: '#ff0000', emissiveIntensity: 1 }));
    blink.position.set(6, top2 + 3.3, 0); g.add(blink);
    return { height: top + 2, w: 20, d: 10, anims: [t => { blink.material.emissiveIntensity = (Math.sin(t * 4) > 0) ? 1.5 : 0.1; }] };
  },

  // Copilot Tower
  copilotTower(g, ctx) {
    let y = PLATE_H;
    const radii = [4.2, 3.9, 3.6, 3.3, 3.0, 2.8, 2.6, 2.4, 2.2, 2.0];
    radii.forEach((r, i) => {
      const color = i % 2 ? '#C9A6F5' : ctx.color;
      roundBrick(g, { r, h: BRICK_H, y, color, ctx, stud: false, seg: 32 });
      y += BRICK_H;
      if (i % 3 === 1) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.05, r + 0.05, 0.5, 32, 1, true), glassOf(ctx));
        ring.position.y = y - 0.6; g.add(ring);
      }
    });
    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3, 24), ctx.m('#ffffff'));
    tip.position.y = y + 1.5; tip.castShadow = true; g.add(tip);
    // Anillo de IA giratorio
    const ringM = new THREE.MeshStandardMaterial({ color: '#c79bff', emissive: '#8a3ffc', emissiveIntensity: 0.9, roughness: 0.2 });
    const halo = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.28, 12, 64), ringM);
    halo.position.y = y + 1; halo.rotation.x = Math.PI / 2; g.add(halo);
    const halo2 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.2, 12, 64), new THREE.MeshStandardMaterial({ color: '#7fdcff', emissive: '#38bdf8', emissiveIntensity: 0.9 }));
    halo2.position.y = y + 2.2; g.add(halo2);
    // Helipuertos de drones
    const pads = [];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const px = Math.cos(a) * 7.5, pz = Math.sin(a) * 4.6;
      roundBrick(g, { r: 1.4, h: PLATE_H, x: px, z: pz, y: PLATE_H, color: '#E9DDFB', ctx, stud: false });
      pads.push(new THREE.Vector3(px, 0, pz));
    }
    frontSign(g, 'COPILOT', { w: 5, y: 3.2, z: 4.25, bg: '#ffffff', fg: '#7b3fe4' });
    return {
      height: y + 4, w: 12, d: 10, api: { pads },
      anims: [t => {
        halo.rotation.z = t * 0.8; halo.position.y = y + 1 + Math.sin(t * 2) * 0.3;
        halo2.rotation.x = Math.PI / 2 + Math.sin(t) * 0.4; halo2.rotation.y = t * 1.3;
        ringM.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.3;
      }],
    };
  },

  // Copilot Studio: laboratorio con cúpula
  lab(g, ctx) {
    const top = floors(g, ctx, { w: 14, d: 8, n: 2, color: ctx.color });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), ctx.m('#d9c4ff', { transparent: true, opacity: 0.8, roughness: 0.1 }));
    dome.position.set(-2, top, 0); g.add(dome);
    // Nodos de agente orbitando
    const nodes = [];
    for (let i = 0; i < 3; i++) {
      const n = new THREE.Mesh(rbox(0.8, 0.8, 0.8), ctx.m(['#F2C200', '#1E7BD8', '#2FA05A'][i]));
      g.add(n); nodes.push(n);
    }
    for (let i = 0; i < 3; i++) brick(g, { w: 1.2, d: 1.2, h: 1.2 * (i + 1), x: 4 + i * 1.4, z: 0, y: top, color: i === 1 ? WHITE : ctx.color, ctx });
    frontSign(g, 'Copilot Studio', { w: 7, y: 2.1, z: 4.05 });
    return {
      height: top + 4, w: 14, d: 8,
      anims: [t => nodes.forEach((n, i) => {
        const a = t * 1.2 + i * 2.09;
        n.position.set(-2 + Math.cos(a) * 4.4, top + 2 + Math.sin(t * 2 + i) * 0.6, Math.sin(a) * 3);
        n.rotation.y = t * 2;
      })],
    };
  },

  // Security Copilot
  lab2(g, ctx) {
    const top = floors(g, ctx, { w: 12, d: 8, n: 3, color: ctx.color, accent: '#2FA05A' });
    roundBrick(g, { r: 0.3, h: 3, x: 3, y: top, color: LGRAY, ctx });
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1.8, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.6), ctx.m(WHITE, { side: THREE.DoubleSide }));
    dish.position.set(3, top + 3.2, 0); dish.rotation.x = Math.PI * 0.75; g.add(dish);
    const shield = signTexture('🛡️', { bg: '#ffffff', fg: '#2FA05A', w: 128, h: 128, font: '96px Arial' });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshStandardMaterial({ map: shield, transparent: true }));
    s.position.set(-3, top + 1.4, 0); g.add(s);
    frontSign(g, 'Security Copilot', { w: 7, y: 2.1, z: 4.05 });
    return { height: top + 5, w: 12, d: 8, anims: [t => { dish.rotation.z = Math.sin(t * 0.7) * 0.8; s.rotation.y = t; }] };
  },

  // Dynamics 365: fábrica con techo dentado
  factory(g, ctx) {
    brick(g, { w: 18, d: 10, h: 4.8, y: PLATE_H, color: WHITE, ctx, studs: false, z: -1 });
    tile(g, { w: 18.1, d: 10.1, h: 0.6, y: 2.2, z: -1, color: ctx.color, ctx });
    const roofM = ctx.m('#1F6FB2');
    const glassM = glassOf(ctx);
    for (let i = 0; i < 6; i++) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0); shape.lineTo(3, 0); shape.lineTo(0, 2); shape.lineTo(0, 0);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 10, bevelEnabled: false });
      const saw = new THREE.Mesh(geo, i % 2 ? roofM : ctx.m('#0B53A0'));
      saw.position.set(-9 + i * 3, 5.2, -6); saw.castShadow = true; g.add(saw);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.9), glassM);
      gl.rotation.y = Math.PI / 2; gl.position.set(-9 + i * 3 + 0.02, 6.15, -1); g.add(gl);
    }
    // Chimenea con "datos" saliendo
    roundBrick(g, { r: 0.9, h: 6, x: 7, z: -4, y: 5.2, color: '#E0453A', ctx, stud: false });
    const puffs = [];
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(rbox(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }));
      g.add(p); puffs.push(p);
    }
    // Puertas de muelle
    for (let i = -1; i <= 1; i++) {
      tile(g, { w: 3.2, d: 0.2, h: 3, x: i * 5, z: 4.05, y: PLATE_H, color: '#9AA5B4', ctx });
    }
    frontSign(g, 'Dynamics 365', { w: 6, y: 4.3, z: 4.1, x: 0, bg: '#0B53A0', fg: '#fff' });
    const fl = forklift('#F2C200'); fl.position.set(0, PLATE_H, 6); g.add(fl);
    return {
      height: 9, w: 18, d: 10,
      anims: [t => {
        puffs.forEach((p, i) => { const k = (t * 0.5 + i / 5) % 1; p.position.set(7 + Math.sin(k * 6 + i) * 0.4, 11.4 + k * 5, -4); p.material.opacity = 0.8 * (1 - k); p.scale.setScalar(0.6 + k); });
        fl.position.x = Math.sin(t * 0.6) * 8; fl.rotation.y = Math.cos(t * 0.6) > 0 ? 0 : Math.PI;
      }],
    };
  },

  // Power Platform: planta con turbinas + franjas de productos
  powerPlant(g, ctx) {
    const cols = [['#F2C811', 'BI'], ['#742774', 'Apps'], ['#0066FF', 'Automate']];
    cols.forEach(([c, l], i) => {
      const x = -6 + i * 4.2;
      const h = 4 + i * 1.6;
      brick(g, { w: 3.6, d: 6, h, x, z: -2, y: PLATE_H, color: c, ctx });
      sign(g, l, { w: 3.2, h: 1, x, y: h - 0.6, z: 1.03, bg: '#ffffff', fg: c });
    });
    // A workshop conveyor represents app-driven processes, not electricity generation.
    brick(g,{x:6.5,z:0,y:0.8,w:4,d:9,h:0.8,color:'#34455B',ctx,studs:false});
    const jobs=[];
    for(let i=0;i<3;i++) {
      const job=new THREE.Group();g.add(job);
      brick(job,{y:1.6,w:1.5,d:1.5,h:0.8,color:['#742774','#0066FF','#F2C811'][i],ctx});
      jobs.push(job);
    }
    sign(g,'TALLER DE AUTOMATIZACIÓN',{x:0,z:-5,y:10,w:16,h:1.5,bg:'#742774',fg:'#FFFFFF'});
    // Dataverse: plataforma base
    tile(g, { w: 13, d: 1.4, h: 0.5, x: -1.8, z: 2.6, y: PLATE_H, color: '#2D7D9A', ctx });
    sign(g, 'Dataverse', { w: 6, h: 0.5, x: -1.8, y: 0.66, z: 3.32, bg: '#2D7D9A', fg: '#fff' });
    return { height: 11, w: 20, d: 10, anims: [t => jobs.forEach((job,i) => job.position.set(6.5,0,((t*1.1+i*2.7)%8)-4))] };
  },

  // Azure IaaS: datacenter con racks parpadeantes
  datacenter(g, ctx) {
    brick(g, { w: 18, d: 12, h: 4.8, y: PLATE_H, color: '#3E4756', ctx, studs: false, z: -1 });
    brick(g, { w: 18, d: 12, h: PLATE_H, y: 5.2, z: -1, color: ctx.color, ctx });
    // Frente de racks
    const leds = [];
    const ledMs = [0, 1, 2].map(i => new THREE.MeshStandardMaterial({ color: ['#4ade80', '#38bdf8', '#facc15'][i], emissive: ['#22c55e', '#0ea5e9', '#eab308'][i], emissiveIntensity: 1 }));
    for (let r = 0; r < 6; r++) {
      const x = -7.5 + r * 3;
      tile(g, { w: 2.4, d: 0.2, h: 4, x, z: 5.05, y: 0.8, color: '#1E2430', ctx });
      for (let k = 0; k < 6; k++) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.08), ledMs[(r + k) % 3].clone());
        led.position.set(x - 0.6 + (k % 3) * 0.6, 1.6 + Math.floor(k / 3) * 1.6 + (r % 2) * 0.4, 5.2);
        g.add(led); leds.push(led);
      }
    }
    // Ventiladores en el techo
    const fans = [];
    for (let i = 0; i < 4; i++) {
      const x = -6 + i * 4;
      roundBrick(g, { r: 1.4, h: 0.8, x, z: -2, y: 5.6, color: LGRAY, ctx, stud: false });
      const fan = new THREE.Group(); fan.position.set(x, 6.45, -2); g.add(fan);
      for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(rbox(2.2, 0.06, 0.4), ctx.m('#2B2F3A')); b.rotation.y = k * Math.PI / 4; fan.add(b); }
      fans.push(fan);
    }
    frontSign(g, 'Azure', { w: 5, y: 4.2, z: 5.1, x: 0, bg: '#0078D4', fg: '#fff' });
    return {
      height: 8, w: 18, d: 12,
      anims: [t => {
        fans.forEach((f, i) => { f.rotation.y = t * (6 + i); });
        leds.forEach((l, i) => { l.material.emissiveIntensity = Math.sin(t * 6 + i * 1.7) > 0.2 ? 1.4 : 0.05; });
      }],
    };
  },

  // Azure PaaS & AI Foundry
  aiCampus(g, ctx) {
    const top = floors(g, ctx, { w: 9, d: 8, n: 4, color: ctx.color, x: -5, z: -2 });
    frontSign(g, 'AI Foundry', { w: 6, y: top - 1.8, z: 2.05, x: -5 });
    // Núcleo de IA
    const coreM = new THREE.MeshStandardMaterial({ color: '#a5f3fc', emissive: '#06b6d4', emissiveIntensity: 0.8, transparent: true, opacity: 0.9, roughness: 0.1 });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 1), coreM);
    core.position.set(-5, top + 2.6, -2); g.add(core);
    // Bases de datos (SQL y Cosmos)
    [['#0078D4', 'SQL', 3, -3], ['#5C2D91', 'Cosmos', 7.5, -3], ['#326CE5', 'AKS', 5.2, 2.5]].forEach(([c, l, x, z]) => {
      for (let i = 0; i < 3; i++) roundBrick(g, { r: 1.6, h: 1.2, x, z, y: PLATE_H + i * 1.3, color: i % 2 ? WHITE : c, ctx, stud: i === 2 });
      const lbl = sign(g, l, { w: 2.6, h: 0.65, x, y: PLATE_H + 4.4, z, bg: c, fg: '#fff' });
      lbl.userData.billboard = true;
    });
    return { height: top + 5, w: 20, d: 12, anims: [t => { core.rotation.y = t; core.rotation.x = t * 0.6; coreM.emissiveIntensity = 0.6 + Math.sin(t * 2.5) * 0.4; }] };
  },

  // Fabric / OneLake
  lakehouse(g, ctx) {
    // Lago
    const waterM = new THREE.MeshStandardMaterial({ color: '#4FB3FF', transparent: true, opacity: 0.85, roughness: 0.05, metalness: 0.1 });
    const lake = new THREE.Mesh(rbox(11, 0.5, 10), waterM); lake.position.set(-5.5, 0.55, -2); g.add(lake);
    const waves = [];
    for (let i = 0; i < 10; i++) {
      const w = new THREE.Mesh(rbox(0.9, 0.12, 0.9), new THREE.MeshStandardMaterial({ color: '#c7ecff', transparent: true, opacity: 0.9 }));
      w.position.set(-10 + (i % 5) * 2.2, 0.85, -6 + Math.floor(i / 5) * 5); g.add(w); waves.push(w);
    }
    sign(g, 'OneLake', { w: 4.5, h: 1.1, x: -5.5, y: 0.82, z: -2, bg: '#4FB3FF', fg: '#fff' }).rotation.x = -Math.PI / 2;
    // Lakehouse
    const top = floors(g, ctx, { w: 9, d: 9, n: 3, color: '#117865', x: 5.5, z: -1.5, accent: '#E3F7F2' });
    frontSign(g, 'Fabric', { w: 5, y: top - 1.6, z: 3.05, x: 5.5, bg: '#117865', fg: '#fff' });
    // Tubos de ingesta
    const pipeM = ctx.m('#C9D0DA');
    const pipe = new THREE.Mesh(cylGeo(0.35, 4, 12), pipeM); pipe.rotation.z = Math.PI / 2; pipe.position.set(-0.2, 1.4, -2); g.add(pipe);
    // Capas Delta Parquet en la azotea
    ['#F2C200', '#1E7BD8', '#2FA05A'].forEach((c, i) => brick(g, { w: 6 - i * 1.2, d: 6 - i * 1.2, h: PLATE_H, x: 5.5, z: -1.5, y: top + i * PLATE_H, color: c, ctx }));
    return { height: top + 2, w: 20, d: 12, anims: [t => waves.forEach((w, i) => { w.position.y = 0.85 + Math.sin(t * 2 + i) * 0.08; w.position.x += Math.sin(t + i) * 0.003; })] };
  },

  // Entra: puerta de la ciudad
  gate(g, ctx) {
    const top = floors(g, ctx, { w: 4, d: 4, n: 4, color: ctx.color, x: -6, z: -1 });
    floors(g, ctx, { w: 4, d: 4, n: 4, color: ctx.color, x: 6, z: -1 });
    brick(g, { w: 16, d: 4, h: 1.6, y: top, z: -1, color: WHITE, ctx });
    sign(g, '🔑  Entra ID', { w: 8, h: 1.4, y: top + 0.8, z: 1.03, bg: '#ffffff', fg: '#2FA05A' });
    sign(g, '🔑  Entra ID', { w: 8, h: 1.4, y: top + 0.8, z: -3.03, ry: Math.PI, bg: '#ffffff', fg: '#2FA05A' });
    // Barrera
    const pivot = new THREE.Group(); pivot.position.set(-3.8, 1.8, 1.4); g.add(pivot);
    const bar = new THREE.Mesh(rbox(7.4, 0.35, 0.35), ctx.m('#E0453A')); bar.position.x = 3.7; pivot.add(bar);
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(rbox(0.8, 0.37, 0.37), ctx.m(WHITE)); s.position.x = 0.9 + i * 1.8; pivot.add(s); }
    brick(g, { w: 0.8, d: 0.8, h: 1.6, x: -3.8, z: 1.4, y: PLATE_H, color: '#F2C200', ctx });
    // Torniquetes / MFA
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#7ED957', emissive: '#22c55e', emissiveIntensity: 1 }));
    scan.position.set(-6, 3, 1.03); g.add(scan);
    return {
      height: top + 3, w: 16, d: 6,
      api: { open: 0 },
      anims: [(t, dt, api) => {
        const open = Math.sin(t * 0.8) > 0.3 ? 1 : 0;
        pivot.rotation.z = THREE.MathUtils.lerp(pivot.rotation.z, open * Math.PI / 2.3, 0.08);
        scan.material.emissiveIntensity = open ? 1.5 : 0.2;
      }],
    };
  },

  // Defender: cuartel con escudo gigante
  shieldHQ(g, ctx) {
    const top = floors(g, ctx, { w: 14, d: 7, n: 3, color: ctx.color, z: -2 });
    const shape = new THREE.Shape();
    shape.moveTo(0, 2.4); shape.quadraticCurveTo(1.6, 2.2, 2, 1.8); shape.lineTo(2, 0.2);
    shape.quadraticCurveTo(1.8, -1.6, 0, -2.6); shape.quadraticCurveTo(-1.8, -1.6, -2, 0.2);
    shape.lineTo(-2, 1.8); shape.quadraticCurveTo(-1.6, 2.2, 0, 2.4);
    const sh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15 }), ctx.m('#2FA05A'));
    sh.position.set(0, top + 3, -2); sh.castShadow = true; g.add(sh);
    const check = signTexture('✓', { bg: '#2FA05A', fg: '#ffffff', w: 128, h: 128, font: 'bold 110px Arial' });
    const cm = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshStandardMaterial({ map: check }));
    cm.position.set(0, 0, 0.8); sh.add(cm);
    frontSign(g, 'Defender XDR', { w: 6, y: 2.1, z: 1.55 });
    return { height: top + 6, w: 14, d: 8, anims: [t => { sh.rotation.y = Math.sin(t * 0.8) * 0.5; sh.position.y = top + 3 + Math.sin(t * 1.5) * 0.25; }] };
  },

  // Sentinel: radar
  radar(g, ctx) {
    const top = floors(g, ctx, { w: 10, d: 7, n: 2, color: ctx.color, x: -3, z: -2 });
    frontSign(g, 'Sentinel', { w: 5, y: 2.1, z: 1.55, x: -3 });
    roundBrick(g, { r: 1, h: 9, x: 6, z: -2, y: PLATE_H, color: WHITE, ctx, stud: false });
    const head = new THREE.Group(); head.position.set(6, 9.8, -2); g.add(head);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3), ctx.m(LGRAY, { side: THREE.DoubleSide }));
    dish.rotation.x = -Math.PI / 2.4; dish.position.y = 1; head.add(dish);
    const sweepM = new THREE.MeshBasicMaterial({ color: '#4ade80', transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
    const sweep = new THREE.Mesh(new THREE.CircleGeometry(14, 32, 0, 0.5), sweepM);
    sweep.rotation.x = -Math.PI / 2; sweep.position.set(6, 0.6, -2); g.add(sweep);
    // Monitores SOC
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), new THREE.MeshStandardMaterial({ color: '#0f172a', emissive: ['#22c55e', '#ef4444', '#38bdf8'][i], emissiveIntensity: 0.35 }));
      s.position.set(-6 + i * 3, top + 1, -2); g.add(s);
      brick(g, { w: 0.4, d: 0.4, h: 0.4, x: -6 + i * 3, z: -2, y: top, color: DGRAY, ctx, studs: false });
    }
    return { height: 13, w: 18, d: 8, anims: [t => { head.rotation.y = t * 1.2; sweep.rotation.z = t * 1.2; }] };
  },

  // Purview: archivo/biblioteca con columnas
  archive(g, ctx) {
    brick(g, { w: 14, d: 7, h: PLATE_H, y: PLATE_H, z: -2, color: WHITE, ctx, studs: false });
    for (let i = 0; i < 6; i++) roundBrick(g, { r: 0.45, h: 4.4, x: -6 + i * 2.4, z: 1, y: 0.8, color: WHITE, ctx, stud: false });
    brick(g, { w: 12, d: 6, h: 4.4, y: 0.8, z: -3, color: ctx.color, ctx, studs: false });
    brick(g, { w: 15, d: 8, h: 0.8, y: 5.2, z: -2, color: WHITE, ctx, studs: false });
    const shape = new THREE.Shape(); shape.moveTo(-7.5, 0); shape.lineTo(7.5, 0); shape.lineTo(0, 2.4); shape.lineTo(-7.5, 0);
    const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false }), ctx.m(WHITE));
    ped.position.set(0, 6, -6); ped.castShadow = true; g.add(ped);
    sign(g, 'Purview', { w: 5, h: 1, y: 5.6, z: 2.03, bg: '#ffffff', fg: '#1b5e3a' });
    // Etiquetas de sensibilidad flotando
    const tags = ['#E0453A', '#F2C200', '#2FA05A'].map((c, i) => {
      const t = new THREE.Mesh(rbox(1.6, 0.9, 0.2), ctx.m(c)); t.position.set(-3 + i * 3, 10, -2); g.add(t); return t;
    });
    return { height: 10, w: 15, d: 8, anims: [t => tags.forEach((tg, i) => { tg.position.y = 9.6 + Math.sin(t * 1.6 + i) * 0.5; tg.rotation.y = t + i; })] };
  },

  // CSP: tienda con toldo
  shop(g, ctx) {
    brick(g, { w: 12, d: 7, h: 4.8, y: PLATE_H, color: WHITE, ctx, studs: false, z: -2 });
    brick(g, { w: 12, d: 7, h: PLATE_H, y: 5.2, z: -2, color: ctx.color, ctx });
    for (let i = 0; i < 6; i++) {
      const aw = new THREE.Mesh(rbox(2, 0.2, 2), ctx.m(i % 2 ? '#2FA05A' : WHITE));
      aw.position.set(-5 + i * 2, 4, 2.2); aw.rotation.x = 0.35; g.add(aw);
    }
    const win = new THREE.Mesh(rbox(8, 2.4, 0.15), glassOf(ctx)); win.position.set(0, 2.2, 1.55); g.add(win);
    sign(g, 'CSP · NCE', { w: 6, h: 1.3, y: 6.5, z: 1.55, bg: '#2FA05A', fg: '#fff' });
    const box = brick(g, { w: 1.4, d: 1.4, h: 1.4, x: 4, z: 0, y: 5.6, color: '#C69C6D', ctx });
    return { height: 8, w: 12, d: 8 };
  },

  // EA: banco clásico
  bank(g, ctx) {
    brick(g, { w: 14, d: 9, h: 0.8, y: PLATE_H, z: -1.5, color: WHITE, ctx, studs: false });
    brick(g, { w: 12, d: 6, h: 5, y: 1.2, z: -2.5, color: '#F6E7A6', ctx, studs: false });
    for (let i = 0; i < 6; i++) roundBrick(g, { r: 0.45, h: 5, x: -5.5 + i * 2.2, z: 1.8, y: 1.2, color: WHITE, ctx, stud: false });
    brick(g, { w: 14, d: 9, h: 0.8, y: 6.2, z: -1.5, color: ctx.color, ctx, studs: false });
    const shape = new THREE.Shape(); shape.moveTo(-7, 0); shape.lineTo(7, 0); shape.lineTo(0, 2.8); shape.lineTo(-7, 0);
    const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 9, bevelEnabled: false }), ctx.m(WHITE));
    ped.position.set(0, 7, -6); ped.castShadow = true; g.add(ped);
    sign(g, 'ENTERPRISE AGREEMENT', { w: 9, h: 0.75, y: 6.6, z: 3.02, bg: '#F2C200', fg: '#3b2f00' });
    // Calendario de 3 años (3 bloques)
    for (let i = 0; i < 3; i++) brick(g, { w: 1.4, d: 1, h: 1.2, x: -1.8 + i * 1.8, z: 2.6, y: 1.2, color: ['#F2C200', '#F28C28', '#E0453A'][i], ctx });
    return { height: 10, w: 14, d: 9 };
  },

  // MCA-E: oficina moderna de cristal
  modernOffice(g, ctx) {
    const top = floors(g, ctx, { w: 8, d: 8, n: 6, color: '#1E7BD8', x: -3, z: -1 });
    const top2 = floors(g, ctx, { w: 6, d: 6, n: 3, color: ctx.color, x: 5, z: 0 });
    frontSign(g, 'MCA-E', { w: 4.5, y: top - 1.8, z: 3.05, x: -3, bg: '#1E7BD8', fg: '#fff' });
    // "Contrato digital" flotando
    const doc = new THREE.Mesh(rbox(1.6, 2.1, 0.12), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#93c5fd', emissiveIntensity: 0.4 }));
    doc.position.set(-3, top + 2, -1); g.add(doc);
    return { height: top + 3.5, w: 14, d: 9, anims: [t => { doc.rotation.y = t * 1.5; doc.position.y = top + 2 + Math.sin(t * 2) * 0.3; }] };
  },

  // MACC: bóveda con lingotes que se llenan con el consumo
  vault(g, ctx) {
    roundBrick(g, { r: 5.2, h: 6.2, y: PLATE_H, z: -1.5, color: ctx.color, ctx, stud: false, seg: 36 });
    roundBrick(g, { r: 5.5, h: 0.6, y: 6.6, z: -1.5, color: WHITE, ctx, stud: false, seg: 36 });
    const door = new THREE.Mesh(cylGeo(2.2, 0.5, 32), ctx.m('#B8BEC8')); door.rotation.x = Math.PI / 2; door.position.set(0, 3.4, 3.8); g.add(door);
    const wheel = new THREE.Group(); wheel.position.set(0, 3.4, 4.1); g.add(wheel);
    for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(rbox(3, 0.25, 0.25), ctx.m('#5B6573')); s.rotation.z = k * Math.PI / 3; wheel.add(s); }
    sign(g, 'MACC', { w: 3.6, h: 0.9, y: 6.2, z: 3.85, bg: '#3b2f00', fg: '#F2C200' });
    // Lingotes en la azotea (crecen con consumo)
    const bars = [];
    const goldM = new THREE.MeshStandardMaterial({ color: '#FFC83D', metalness: 0.6, roughness: 0.25, emissive: '#5a3c00', emissiveIntensity: 0.2 });
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(rbox(1.4, 0.6, 0.7), goldM);
      const layer = Math.floor(i / 8), k = i % 8;
      b.position.set(-2.1 + (k % 4) * 1.5, 7.5 + layer * 0.62, -2.5 + Math.floor(k / 4) * 1.6);
      b.visible = false; b.castShadow = true; g.add(b); bars.push(b);
    }
    const api = { setFill(p) { const n = Math.round(p * bars.length); bars.forEach((b, i) => b.visible = i < n); } };
    return { height: 10, w: 11, d: 11, api, anims: [t => { wheel.rotation.z = t * 0.6; }] };
  },

  // Account Team HQ: torre con logo Microsoft
  hq(g, ctx) {
    const top = floors(g, ctx, { w: 9, d: 8, n: 9, color: '#2B2F3A', x: -2, z: -1, accent: '#E9EDF3' });
    const logo = signTexture('', { bg: '#ffffff', w: 256, h: 256, logo: null });
    // Logo de 4 colores en azotea
    [['#F25022', -1, -1], ['#7FBA00', 1, -1], ['#00A4EF', -1, 1], ['#FFB900', 1, 1]].forEach(([c, i, j]) => {
      brick(g, { w: 2.6, d: 2.6, h: 0.8, x: -2 + i * 1.5, z: -1 + j * 1.5, y: top, color: c, ctx });
    });
    frontSign(g, 'Microsoft', { w: 7, y: top - 2, z: 3.05, x: -2, logo: 'ms' });
    brick(g, { w: 6, d: 6, h: 3, x: 6.5, z: 0, y: PLATE_H, color: ctx.color, ctx });
    sign(g, 'ACR', { w: 3, h: 1, y: 2.4, z: 3.03, x: 6.5, bg: '#ffffff', fg: '#E0453A' });
    return { height: top + 2, w: 16, d: 9 };
  },

  // LSP: almacén de licencias
  warehouse(g, ctx) {
    brick(g, { w: 16, d: 8, h: 5.2, y: PLATE_H, z: -2, color: '#E9EDF3', ctx, studs: false });
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 16, 24, 1, false, 0, Math.PI), ctx.m(ctx.color));
    roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.rotation.x = 0;
    roof.position.set(0, 5.6, -2); roof.scale.set(1, 1, 0.6); roof.castShadow = true;
    roof.rotation.set(0, 0, Math.PI / 2); g.add(roof);
    for (let i = -1; i <= 1; i++) tile(g, { w: 3.4, d: 0.2, h: 3.4, x: i * 5, z: 2.05, y: PLATE_H, color: '#9AA5B4', ctx });
    sign(g, 'LSP · Licencias', { w: 7, h: 1.1, y: 4.6, z: 2.07, bg: '#ffffff', fg: '#E0453A' });
    const pallets = [];
    for (let i = 0; i < 4; i++) {
      brick(g, { w: 1.6, d: 1.6, h: 0.3, x: -6 + i * 2.2, z: 4.5, y: PLATE_H, color: '#A0703C', ctx, studs: false });
      brick(g, { w: 1.4, d: 1.4, h: 1.2, x: -6 + i * 2.2, z: 4.5, y: 0.7, color: '#C69C6D', ctx });
    }
    const fl = forklift('#E0453A'); fl.position.set(5, PLATE_H, 4.5); g.add(fl);
    return { height: 10, w: 16, d: 10, anims: [t => { fl.position.x = 4 + Math.sin(t * 0.8) * 2.5; fl.userData.fork.position.y = 0.5 + Math.max(0, Math.sin(t * 1.6)) * 1.2; }] };
  },

  // GSI: obra en construcción con grúa (migraciones)
  construction(g, ctx) {
    floors(g, ctx, { w: 9, d: 8, n: 3, color: ctx.color, x: -4, z: -1 });
    // Andamios
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const p = new THREE.Mesh(rbox(0.2, 2, 0.2), ctx.m('#F2C200')); p.position.set(-8.5 + i * 3, 6 + j * 2, 3.3); g.add(p);
    }
    const crane = new THREE.Group(); crane.position.set(5.5, 0, -1); g.add(crane);
    for (let i = 0; i < 10; i++) brick(crane, { w: 1, d: 1, h: BRICK_H, y: PLATE_H + i * BRICK_H, color: '#F2C200', ctx, studs: false });
    const jib = new THREE.Group(); jib.position.y = 12.5; crane.add(jib);
    const arm = new THREE.Mesh(rbox(14, 0.6, 0.6), ctx.m('#F2C200')); arm.position.x = -3; jib.add(arm);
    const cab = new THREE.Mesh(rbox(1.4, 1.2, 1.4), ctx.m('#E0453A')); cab.position.set(0, -0.6, 0); jib.add(cab);
    const counter = new THREE.Mesh(rbox(1.6, 1.2, 1.2), ctx.m(DGRAY)); counter.position.set(3.4, -0.6, 0); jib.add(counter);
    const cable = new THREE.Mesh(new THREE.BoxGeometry(0.06, 5, 0.06), ctx.m('#222')); cable.position.set(-8, -2.8, 0); jib.add(cable);
    const load = new THREE.Mesh(rbox(1.6, 1, 1.6), ctx.m('#1E7BD8')); load.position.set(-8, -5.6, 0); jib.add(load);
    sign(g, 'GSI · Migración', { w: 7, h: 1.1, y: 2.4, z: 3.05, x: -4, bg: '#ffffff', fg: '#E0453A' });
    return { height: 14, w: 18, d: 10, anims: [t => { jib.rotation.y = Math.sin(t * 0.35) * 1.2; load.position.y = -5.6 + Math.sin(t * 0.9) * 1.5; }] };
  },
};

// ---------------------------------------------------------------------------
// Decoración: árboles, farolas, peatones
// ---------------------------------------------------------------------------
function decorate(scene, studs, world) {
  const ctx = { studs, m: matCache() };
  // Árboles y farolas junto a las calles
  const lampM = new THREE.MeshStandardMaterial({ color: '#fff7d6', emissive: '#ffe9a0', emissiveIntensity: 0.6 });
  for (const [rx, rz] of BOULEVARD) {
    const x = rx * 1.06, z = rz * 1.06;
    const pole = new THREE.Mesh(cylGeo(0.12, 4, 8), new THREE.MeshStandardMaterial({ color: '#8B95A3' }));
    pole.position.set(x, 2, z + ROAD_W / 2 + 0.8); pole.castShadow = true; scene.add(pole);
    const lamp = new THREE.Mesh(rbox(0.9, 0.3, 0.5), lampM); lamp.position.set(x, 4, z + ROAD_W / 2 + 0.4); scene.add(lamp);
  }
  world.lampMaterial = lampM;
}

// Every island has a real front entrance, a reception area and service outputs.
function buildServiceEntrance(group, ctx, width, depth) {
  const front = depth / 2, x = 5.5, z = front - 1;
  const color = ctx.color, role = SERVICE_ROLES[ctx.def.id];
  // Segmented colorful rims expose the brick seams and top studs.
  for (let bx = -width / 2 + 1; bx < width / 2; bx += 2) {
    if (Math.abs(bx - x) > 2.8) brick(group, { x: bx, y: 0.4, z: front - 0.5, w: 1.92, d: 0.9, h: 0.55, color, ctx });
    brick(group, { x: bx, y: 0.4, z: -front + 0.5, w: 1.92, d: 0.9, h: 0.55, color, ctx });
  }
  // A smooth path lets articulated clients walk through without clipping studs.
  tile(group, { x: 0, y: 0.4, z: front - 4, w: width - 3, d: 3.5, h: 0.12, color: '#F7E8C9', ctx });
  tile(group, { x, y: 0.4, z: front - 0.8, w: 4.4, d: 5.8, h: 0.12, color: '#F7E8C9', ctx });
  for (const side of [-1, 1]) {
    for (let level = 0; level < 4; level++) brick(group, {
      x: x + side * 2.45, y: 0.4 + level * 1.15, z, w: 1.05, d: 1.6, h: 1.1,
      color: level === 1 ? '#FFFFFF' : color, ctx,
    });
  }
  brick(group, { x, y: 5.0, z, w: 6.1, d: 1.9, h: 0.9, color, ctx });
  sign(group, role.model, { x, y: 5.45, z: z + 0.97, w: 4.1, h: 0.72, bg: color, fg: '#FFFFFF' });
  // Reception console: the host turns a customer need into a service brick.
  brick(group, { x: -6.5, y: 0.4, z: front - 5.7, w: 3, d: 1.2, h: 1.2, color, ctx });
  sign(group, 'CLIENTES', { x: -6.5, y: 1.15, z: front - 5.08, w: 2.5, h: 0.5, bg: '#FFFFFF', fg: '#17456B' });
  // Output shelf links the animation to the as-a-service metaphor.
  for (let i = 0; i < 3; i++) brick(group, { x: -10.1 + i * 1.1, y: 0.4, z: front - 6.1,
    w: 0.95, d: 0.95, h: 0.85, color: i === 1 ? '#FFD12B' : color, ctx });
  return { x, z, front, host: new THREE.Vector3(-6.5, 0.55, front - 4.1),
    service: new THREE.Vector3(-3.7, 0.55, front - 4.1), model: role.model };
}
