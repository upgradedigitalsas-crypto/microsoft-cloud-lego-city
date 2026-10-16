// ============================================================================
//  Simulación logística en tiempo real (×60: 1 s real = 1 min simulado)
// ============================================================================
import * as THREE from 'three';
import { CustomerLife } from './customers.js';
import { BOULEVARD, streetRoute } from './urban.js';
import { FLOWS, DISTRICTS, X_ROADS, Z_ROADS, CUSTOMERS, DRIVERS, COPILOT_TASKS, EVENTS } from './data.js';
import { truck, patrolCar, drone } from './lego.js';

const LANE = 1.4;
const BASE_SPEED = 9;
const rand = a => a[Math.floor(Math.random() * a.length)];
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

export const STATUS = {
  loading:    { label: 'Cargando',      tone: 'amber' },
  transit:    { label: 'En ruta',       tone: 'blue' },
  docking:    { label: 'Acoplando',     tone: 'violet' },
  unloading:  { label: 'Descargando',   tone: 'green' },
  reposition: { label: 'Regresando',    tone: 'gray' },
  patrol:     { label: 'Patrullando',   tone: 'green' },
  pad:        { label: 'En helipuerto', tone: 'gray' },
  flying:     { label: 'Volando',       tone: 'blue' },
  working:    { label: 'Ejecutando',    tone: 'violet' },
  returning:  { label: 'Regresando',    tone: 'gray' },
};

export class Simulation {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.vehicles = [];
    this.drones = [];
    this.events = [];
    this.listeners = new Set();
    this.kpi = {
      acr: 1248300, acrDelta: 0,
      seats: 48250, seatsDelta: 0,
      maccCommit: 5000000, maccUsed: 2940000,
      threats: 1842, threatsDelta: 0,
      copilot: 12480, copilotDelta: 0,
      oneLakeTB: 412.6, tbDelta: 0,
      marketplace: 186000,
    };
    this.busy = new Map(); // ocupación de muelles
    this.spawn();
    this.nextEvent = 3;
    this.customers = new CustomerLife(scene, world);
  }

  on(type, fn) {
    const listener = (eventType, payload) => { if (eventType === type) fn(payload); };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit(type, payload) { this.listeners.forEach(f => f(type, payload)); }

  B(id) { return this.world.buildings.get(id); }

  // ------------------------------------------------------------------ spawn
  spawn() {
    let n = 0;
    const usedIds = new Set();
    for (const flow of FLOWS) {
      for (let i = 0; i < flow.count; i++) {
        let id;
        do { id = `${flow.prefix}-${randi(1100, 2999)}`; } while (usedIds.has(id));
        usedIds.add(id);
        const cab = flow.type === 'telemetry' ? '#2FA05A' : flow.type === 'contract' ? '#F2C200' : flow.type === 'deal' ? '#2B2F3A' : '#1E7BD8';
        const g = truck(cab === flow.color ? '#2B2F3A' : cab, flow.color, flow.prefix);
        const v = {
          id, kind: 'truck', flow, group: g, driver: DRIVERS[n++ % DRIVERS.length],
          customer: rand(CUSTOMERS), status: 'loading', speed: 0, heading: 0,
          path: null, s: 0, total: 0, dwell: Math.random() * 4, timeline: [],
          location: rand(flow.from), job: null, slot: null,
        };
        g.traverse(o => { if (o.isMesh) o.userData.entityId = id; });
        this.scene.add(g);
        this.vehicles.push(v);
        this.newJob(v, true);
        // Arranca en el muelle de origen
        const slot = this.slotFor(v.job.from, v);
        g.position.copy(slot);
        v.slot = slot;
        g.rotation.y = this.B(v.job.from).dock.z > this.B(v.job.from).road.z ? Math.PI / 2 : -Math.PI / 2;
        v.heading = g.rotation.y;
      }
    }
    // Patrullas Defender (anillo perimetral)
    const ringA = [...BOULEVARD, BOULEVARD[0]];
    const reverse = [...BOULEVARD].reverse();
    const ringB = [...reverse, reverse[0]];
    [ringA, ringB].forEach((ring, i) => {
      const g = patrolCar();
      const id = `DEF-${700 + i * 11}`;
      g.traverse(o => { if (o.isMesh) o.userData.entityId = id; });
      this.scene.add(g);
      const pts = offsetLane(ring.map(([x, z]) => new THREE.Vector3(x, 0, z)), true);
      const v = {
        id, kind: 'patrol', group: g, driver: i ? 'Unidad Bravo' : 'Unidad Alfa', status: 'patrol',
        path: polyline(pts), s: Math.random() * 100, speed: 11, heading: 0, timeline: [],
        flow: { label: 'Patrulla Defender XDR', color: '#2FA05A', type: 'patrol' }, loop: true, scanned: 0,
      };
      this.vehicles.push(v);
    });
    // Drones Copilot
    const tower = this.B('copilot');
    const pads = tower.api.pads || [new THREE.Vector3()];
    for (let i = 0; i < 5; i++) {
      const g = drone();
      const id = `CPL-${randi(10, 99)}${i}`;
      g.traverse(o => { if (o.isMesh) o.userData.entityId = id; });
      const pad = pads[i % pads.length].clone().add(tower.group.position);
      pad.y = 1.4 + Math.floor(i / pads.length) * 1.5;
      g.position.copy(pad);
      this.scene.add(g);
      this.drones.push({ id, kind: 'drone', group: g, pad, status: 'pad', dwell: 1 + i * 1.6, task: null, target: null, from: null, to: null, t: 0, dur: 1, done: 0, flow: { label: 'Agente Copilot', color: '#9B5CD6', type: 'agent' }, timeline: [] });
    }

  }

  slotFor(bid, v) {
    const b = this.B(bid);
    const busy = this.busy.get(bid) || new Set();
    this.busy.set(bid, busy);
    let idx = [1, 0, 2].find(i => !busy.has(i));
    // Overflow bays keep reservations exclusive even during peak arrivals.
    if (idx === undefined) { idx = 3; while (busy.has(idx)) idx++; }
    busy.add(idx);
    v._slotRef = { bid, idx };
    return idx < b.slots.length ? b.slots[idx].clone()
      : b.dock.clone().add(new THREE.Vector3((idx - 2) * 5, 0, b.dock.z > b.road.z ? 5 : -5));
  }
  releaseSlot(v) {
    if (!v._slotRef) return;
    this.busy.get(v._slotRef.bid)?.delete(v._slotRef.idx);
    v._slotRef = null;
  }

  newJob(v, initial = false) {
    const f = v.flow;
    const from = f.from.includes(v.location) ? v.location : rand(f.from);
    let to = rand(f.to.filter(t => t !== from));
    const qty = f.type === 'acr' ? randi(18, 95) * 1000 : f.type === 'license' ? randi(40, 480) : f.type === 'data' ? +(Math.random() * 3 + 0.4).toFixed(1) : f.type === 'migration' ? randi(8, 60) : randi(1, 12);
    v.customer = rand(CUSTOMERS);
    v.job = { from, to, qty, id: `#SHP-${randi(70000, 79999)}` };
    const now = Date.now();
    v.timeline = [
      { label: 'Orden creada', t: now },
      { label: 'Cargado', t: null },
      { label: 'En tránsito', t: null },
      { label: 'Entregado', t: null },
      { label: 'Aplicado', t: null },
    ];
    if (!initial && v.location !== from) {
      this.releaseSlot(v);
      v.status = 'reposition';
      this.setPath(v, v.location, from);
    } else {
      v.status = 'loading';
      v.dwell = initial ? v.dwell + 2 : 3 + Math.random() * 2;
    }
  }

  setPath(v, fromId, toId) {
    this.releaseSlot(v);
    const A = this.B(fromId), Bb = this.B(toId);
    const road = streetRoute(A.roadIndex, Bb.roadIndex).map(([x,z]) => new THREE.Vector3(x,0,z));
    const clean = dedupe(road);
    const lane = clean.length > 1 ? offsetLane(clean, false) : clean;
    const start = v.group.position.clone(); start.y = 0;
    const end = this.slotFor(toId, v);
    v.slot = end;
    // Aproximación al carril
    const pts = [start, ...A.driveway.slice().reverse(), ...lane, ...Bb.driveway, end];
    v.path = polyline(dedupe(pts));
    v.s = 0;
    v.dest = toId;
  }

  // ------------------------------------------------------------------ update
  update(dt, t) {
    dt = Number.isFinite(dt) ? THREE.MathUtils.clamp(dt, 0, 0.05) : 0;
    for (const v of this.vehicles) v.kind === 'patrol' ? this.updatePatrol(v, dt, t) : this.updateTruck(v, dt, t);
    for (const d of this.drones) this.updateDrone(d, dt, t);
    this.customers.advance(dt, t);

    // ACR continuo
    const tick = dt * 9.5;
    this.kpi.acr += tick; this.kpi.acrDelta += tick;
    this.kpi.maccUsed += dt * 4;
    this.B('macc').api.setFill?.(this.kpi.maccUsed / this.kpi.maccCommit);

    this.nextEvent -= dt;
    if (this.nextEvent <= 0) {
      this.nextEvent = 7 + Math.random() * 8;
      const [cat, text] = rand(EVENTS);
      this.pushEvent(cat, text);
      if (cat === 'security') { this.kpi.threats += randi(1, 6); this.kpi.threatsDelta += 1; }
    }
  }

  pushEvent(cat, text) {
    const e = { cat, text, t: Date.now() };
    this.events.unshift(e);
    this.events.length = Math.min(this.events.length, 40);
    this.emit('event', e);
  }

  updateTruck(v, dt, t) {
    const g = v.group;
    if (v.status === 'loading' || v.status === 'unloading') {
      v.speed = 0;
      v.dwell -= dt;
      g.userData.body.position.y = Math.sin(t * 8) * 0.02;
      if (v.dwell <= 0) {
        if (v.status === 'loading') {
          v.timeline[1].t = Date.now();
          v.timeline[2].t = Date.now();
          v.status = 'transit';
          this.releaseSlot(v);
          this.setPath(v, v.job.from, v.job.to);
        } else {
          v.timeline[4].t = Date.now();
          this.applyDelivery(v);
          v.location = v.job.to;
          this.newJob(v);
        }
      }
      return;
    }
    // En movimiento
    const target = BASE_SPEED * (v.status === 'reposition' ? 1.15 : 1);
    let limit = target;
    const remaining = v.path.total - v.s;
    if (remaining < 6) limit = Math.max(2, target * remaining / 6);
    // Evitar colisiones simples
    const forwardX = Math.cos(v.heading), forwardZ = -Math.sin(v.heading);
    if (!(v.ghost > 0)) for (const o of this.vehicles) {
      if (o === v) continue;
      const dx = o.group.position.x - g.position.x, dz = o.group.position.z - g.position.z;
      const ahead = dx * forwardX + dz * forwardZ;
      if (ahead > 0 && ahead < 6.5) {
        const lateral = Math.abs(dx * forwardZ - dz * forwardX);
        if (lateral < 1.3) limit = Math.min(limit, Math.max(0, (ahead - 4.2) * 2));
      }
    }
    v.ghost = (v.ghost || 0) - dt;
    v.stuck = limit < 0.3 ? (v.stuck || 0) + dt : 0;
    if (v.stuck > 2.5) { v.ghost = 1.5; v.stuck = 0; }
    v.speed = THREE.MathUtils.lerp(v.speed, limit, Math.min(1, dt * 3));
    v.s = Math.min(v.path.total, v.s + v.speed * dt);
    const { p, dir } = samplePath(v.path, v.s);
    g.position.set(p.x, 0.32, p.z);
    if (dir.lengthSq() > 0) {
      const h = Math.atan2(-dir.z, dir.x);
      v.heading = lerpAngle(v.heading, h, Math.min(1, dt * 8));
      g.rotation.y = v.heading;
    }
    g.userData.wheels.forEach(w => { w.rotation.y += v.speed * dt * 1.5; });
    if (v.status === 'transit' && remaining < 10) v.status = 'docking';
    if (v.s >= v.path.total - 0.01) {
      if (v.status === 'reposition') {
        v.location = v.job.from;
        v.status = 'loading';
        v.dwell = 3 + Math.random() * 2;
      } else {
        v.timeline[3].t = Date.now();
        v.status = 'unloading';
        v.dwell = 3.5 + Math.random() * 2.5;
      }
    }
  }

  applyDelivery(v) {
    const k = this.kpi, q = v.job.qty;
    switch (v.flow.type) {
      case 'license': k.seats += q; k.seatsDelta += q; break;
      case 'acr': k.acr += q * 0.02; k.acrDelta += q * 0.02; k.maccUsed += q; break;
      case 'data': k.oneLakeTB += q; k.tbDelta += q; break;
      case 'telemetry': k.threats += randi(2, 9); k.threatsDelta += 1; break;
      case 'migration': k.acr += q * 35; k.acrDelta += q * 35; break;
    }
    this.emit('delivery', v);
  }

  updatePatrol(v, dt, t) {
    v.s = (v.s + v.speed * dt) % v.path.total;
    const { p, dir } = samplePath(v.path, v.s);
    v.group.position.set(p.x, 0.32, p.z);
    const h = Math.atan2(-dir.z, dir.x);
    v.heading = lerpAngle(v.heading, h, Math.min(1, dt * 8));
    v.group.rotation.y = v.heading;
    const [r, b] = v.group.userData.lights;
    const on = Math.sin(t * 10) > 0;
    r.emissiveIntensity = on ? 2 : 0.1; b.emissiveIntensity = on ? 0.1 : 2;
    v.scanned += dt * 37;
  }

  updateDrone(d, dt, t) {
    const g = d.group;
    g.userData.rotors.forEach((r, i) => r.rotation.y += dt * (d.status === 'pad' ? 4 : 40) * (i % 2 ? 1 : -1));
    const beam = g.userData.beam;
    if (d.status === 'pad') {
      d.dwell -= dt;
      beam.material.opacity = 0;
      if (d.dwell <= 0) {
        const targets = Object.keys(COPILOT_TASKS);
        d.target = rand(targets);
        d.task = rand(COPILOT_TASKS[d.target]);
        const b = this.B(d.target);
        d.from = g.position.clone();
        d.to = b.group.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 6, b.height + 4, (Math.random() - 0.5) * 3));
        d.t = 0; d.dur = d.from.distanceTo(d.to) / 14 + 0.5;
        d.status = 'flying';
        d.timeline = [{ label: 'Prompt recibido', t: Date.now() }, { label: 'Despegue', t: Date.now() }, { label: 'Ejecutando', t: null }, { label: 'Resultado', t: null }, { label: 'En base', t: null }];
      }
    } else if (d.status === 'flying' || d.status === 'returning') {
      d.t += dt / d.dur;
      const k = Math.min(1, d.t);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      g.position.lerpVectors(d.from, d.to, e);
      g.position.y += Math.sin(k * Math.PI) * 8;
      g.rotation.y = Math.atan2(d.from.z - d.to.z, d.to.x - d.from.x);
      g.rotation.z = -0.25 * Math.sin(k * Math.PI);
      if (k >= 1) {
        g.rotation.z = 0;
        if (d.status === 'flying') { d.status = 'working'; d.dwell = 3 + Math.random() * 2; d.timeline[2].t = Date.now(); }
        else { g.position.copy(d.pad); d.status = 'pad'; d.dwell = 1.5 + Math.random() * 3; d.timeline[4].t = Date.now(); }
      }
    } else if (d.status === 'working') {
      d.dwell -= dt;
      g.position.y = d.to.y + Math.sin(t * 3) * 0.08;
      beam.material.opacity = 0.18 + Math.sin(t * 8) * 0.08;
      if (d.dwell <= 0) {
        beam.material.opacity = 0;
        d.timeline[3].t = Date.now();
        d.done++;
        this.kpi.copilot += 1; this.kpi.copilotDelta += 1;
        this.emit('copilot', d);
        d.from = g.position.clone(); d.to = d.pad.clone();
        d.t = 0; d.dur = d.from.distanceTo(d.to) / 14 + 0.5;
        d.status = 'returning';
      }
    }
  }

  // ------------------------------------------------------------------ queries
  all() { return [...this.vehicles, ...this.drones, ...this.customers.people]; }
  get(id) { return this.all().find(v => v.id === id); }
  inbound(bid) { return this.vehicles.filter(v => v.kind === 'truck' && v.job?.to === bid && ['transit', 'docking', 'unloading'].includes(v.status)).length; }
  outbound(bid) { return this.vehicles.filter(v => v.kind === 'truck' && v.job?.from === bid && ['loading', 'transit'].includes(v.status)).length; }
  remaining(v) { return v.path ? Math.max(0, v.path.total - v.s) : 0; }
}

// ---------------------------------------------------------------------------
// Geometría de rutas
// ---------------------------------------------------------------------------
function dedupe(pts) {
  return pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 0.05);
}
function offsetLane(pts, closed) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[i - 1] || (closed ? pts[pts.length - 2] : null);
    const next = pts[i + 1] || (closed ? pts[1] : null);
    const n1 = prev ? rightN(prev, pts[i]) : null;
    const n2 = next ? rightN(pts[i], next) : null;
    let off;
    if (n1 && n2) off = n1.distanceTo(n2) < 0.01 ? n1.clone() : n1.clone().add(n2);
    else off = (n1 || n2).clone();
    out.push(pts[i].clone().addScaledVector(off, LANE));
  }
  return out;
}
function rightN(a, b) {
  const d = b.clone().sub(a).normalize();
  return new THREE.Vector3(-d.z, 0, d.x);
}
function polyline(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return { pts, cum, total: cum[cum.length - 1] };
}
function samplePath(path, s) {
  const { pts, cum } = path;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i];
  const seg = cum[i] - cum[i - 1] || 1;
  const k = THREE.MathUtils.clamp((s - cum[i - 1]) / seg, 0, 1);
  return { p: a.clone().lerp(b, k), dir: b.clone().sub(a).normalize() };
}
function lerpAngle(a, b, k) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}
