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
    this.trafficClock = 0;
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
          location: flow.from.find(id => (this.busy.get(id)?.size || 0) < 3) || rand(flow.from), job: null, slot: null,
        };
        g.traverse(o => { if (o.isMesh) o.userData.entityId = id; });
        this.scene.add(g);
        this.vehicles.push(v);
        this.newJob(v, true);
        // Arranca en el muelle de origen
        const slot = this.slotFor(v.job.from, v);
        g.position.copy(slot);
        v.slot = slot;
        g.rotation.y = Math.PI / 2;
        v.heading = g.rotation.y;
      }
    }
    // Patrols use marked bays and the same traffic permissions as deliveries.
    for (let i=0;i<2;i++) {
      const id=`DEF-${700+i*11}`,g=patrolCar();
      g.traverse(o=>{if(o.isMesh)o.userData.entityId=id;});this.scene.add(g);
      const v={id,kind:'patrol',group:g,driver:i?'Unidad Bravo':'Unidad Alfa',
        status:'loading',speed:0,heading:Math.PI/2,timeline:[],location:'secCopilot',
        dwell:8+i*8,flow:{label:'Patrulla Defender XDR',color:'#2FA05A',type:'patrol',from:['secCopilot'],to:['sentinel']},scanned:0};
      this.vehicles.push(v);this.newJob(v,true);
      v.slot=this.slotFor('secCopilot',v);g.position.copy(v.slot);g.rotation.y=v.heading;
    }
    // Drones Copilot
    const tower = this.B('copilot');
    const pads = tower.api.pads || [new THREE.Vector3()];
    for (let i = 0; i < 5; i++) {
      const g = drone();
      const id = `CPL-${randi(10, 99)}${i}`;
      g.traverse(o => { if (o.isMesh) o.userData.entityId = id; });
      const pad = pads[i % pads.length].clone().add(tower.group.position);
      pad.y = 1.4; // Separate marked helipads with clear vertical departure.
      g.position.copy(pad);
      this.scene.add(g);
      this.drones.push({ id, kind: 'drone', group: g, pad, flightIndex:i, status: 'pad', dwell: 1 + i * 1.6, task: null, target: null, from: null, to: null, t: 0, dur: 1, done: 0, cruise: Math.max(this.world.itseTower?.height||0,...[...this.world.buildings.values()].map(b=>b.height)) + 12 + i*4, flow: { label: 'Agente Copilot', color: '#9B5CD6', type: 'agent' }, timeline: [] });
    }

  }

  slotFor(bid, v) {
    const b = this.B(bid);
    const busy = this.busy.get(bid) || new Set();
    this.busy.set(bid, busy);
    let idx = [1, 0, 2].find(i => !busy.has(i));
    if (idx === undefined) return null;
    busy.add(idx);
    v._slotRef = { bid, idx };
    return b.slots[idx].clone();
  }

  releaseSlot(v) {
    if (!v._slotRef) return;
    this.busy.get(v._slotRef.bid)?.delete(v._slotRef.idx);
    v._slotRef = null;
  }

  newJob(v, initial = false) {
    v.pendingRoute=null;v.waitingSince=null;v.routeCache=null;
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
      v.status = 'loading';
      v.dwell = 0;
      v.repositionTo = from;
    } else {
      v.status = 'loading';
      v.dwell = initial ? v.dwell + 2 : 3 + Math.random() * 2;
    }
  }

  setPath(v, fromId, toId) {
    const A=this.B(fromId),B=this.B(toId);
    const available=[1,0,2].find(i=>!this.busy.get(toId)?.has(i));
    if(available===undefined){v.blockedBy='bay:'+toId;return false;}
    const end=B.slots[available].clone(),start=v.group.position.clone();start.y=0;
    const road=streetRoute(A.roadIndex,B.roadIndex).map(([x,z])=>new THREE.Vector3(x,0,z));
    const lane=road.length>1?offsetLane(road,false):road;
    const pts=dedupe([start,new THREE.Vector3(start.x,0,A.dock.z),...A.driveway.slice().reverse(),
      ...lane,...B.driveway,new THREE.Vector3(end.x,0,B.dock.z),end]);
    const cacheKey=`${fromId}:${toId}:${available}`;
    const route=v.routeCache?.key===cacheKey?v.routeCache.route:polyline(pts);
    route.cells ??= routeCells(route);
    v.routeCache={key:cacheKey,route};v.pendingRoute=route;
    // Acquire the complete shared corridor before leaving a bay. Never ghost through traffic.
    for(const other of this.vehicles){
      if(other===v)continue;
      if(other.pendingRoute && other.waitingSince!=null && other.waitingSince<v.waitingSince
        && other.blockedBy?.startsWith('route:') && [...route.cells].some(key=>other.pendingRoute.cells.has(key))){
        v.blockedBy='queue:'+other.id;return false;
      }
      if(other.activeRoute){if([...route.cells].some(key=>other.path.cells.has(key))){v.blockedBy='route:'+other.id;return false;}}
      else if(routeHitsParked(route,other)){v.blockedBy='parked:'+other.id;return false;}
    }
    const old=v._slotRef;
    v.slot=this.slotFor(toId,v);
    if(!v.slot)return false;
    v.departureSlot=old; // Keep the origin occupied until the manoeuvre is complete.
    v.waitingSince=null;v.pendingRoute=null;v.blockedBy=null;v.path=route;v.s=0;v.dest=toId;v.activeRoute=true;
    return true;
  }

  // ------------------------------------------------------------------ update
  update(dt, t) {
    dt = Number.isFinite(dt) ? THREE.MathUtils.clamp(dt, 0, 0.05) : 0;
    this.trafficClock += dt;
    for (const v of [...this.vehicles].sort((a,b)=>(a.waitingSince??Infinity)-(b.waitingSince??Infinity))) {
      this.updateTruck(v,dt,t);
      if(v.kind==='patrol')this.updatePatrol(v,dt,t);
    }
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
          v.waitingSince ??= this.trafficClock;
          if(t < (v.retryAt || 0))return;
          v.retryAt=t+.6;
          if(v.repositionTo && (this.busy.get(v.repositionTo)?.size||0)>=3){
            const free=v.flow.from.find(id=>id!==v.location&&(this.busy.get(id)?.size||0)<3);
            if(free){v.repositionTo=free;v.job.from=free;}
          }
          if(!v.repositionTo && (this.busy.get(v.job.to)?.size||0)>=3){
            const free=v.flow.to.find(id=>id!==v.location&&(this.busy.get(id)?.size||0)<3);
            if(free)v.job.to=free;
          }
          const destination=v.repositionTo || v.job.to;
          if(this.setPath(v,v.location,destination)){
            v.status=v.repositionTo?'reposition':'transit';v.repositionTo=null;
          }

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
    // Exclusive route reservations include the swept width of turns and parked actors.
    v.speed = Math.min(limit, THREE.MathUtils.lerp(v.speed, limit, Math.min(1, dt * 3)));
    v.s = Math.min(v.path.total, v.s + v.speed * dt);
    const { p, dir } = samplePath(v.path, v.s);
    g.position.set(p.x, 0.32, p.z);
    if (dir.lengthSq() > 0) {
      const h = Math.atan2(-dir.z, dir.x);
      v.heading = v.s < v.path.cum[1] ? Math.PI / 2 : h;
      g.rotation.y = v.heading;
    }
    g.userData.wheels.forEach(w => { w.rotation.y += v.speed * dt * 1.5; });
    if (v.status === 'transit' && remaining < 10) v.status = 'docking';
    if (v.s >= v.path.total - 0.01) {
      v.activeRoute=false;v.speed=0;v.heading=Math.PI/2;g.rotation.y=v.heading;
      if(v.departureSlot)this.busy.get(v.departureSlot.bid)?.delete(v.departureSlot.idx);
      v.departureSlot=null;
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
        d.to = b.group.position.clone().add(new THREE.Vector3(-8 + d.flightIndex * 4, b.height + 5, 0));
        d.t = 0; d.dur = d.from.distanceTo(d.to) / 14 + 0.5;
        d.status = 'flying';
        d.timeline = [{ label: 'Prompt recibido', t: Date.now() }, { label: 'Despegue', t: Date.now() }, { label: 'Ejecutando', t: null }, { label: 'Resultado', t: null }, { label: 'En base', t: null }];
      }
    } else if (d.status === 'flying' || d.status === 'returning') {
      d.t += dt / d.dur;
      const k = Math.min(1, d.t);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      // Vertical take-off, cruise above every roof, then vertical descent.
      if(k<.2)g.position.copy(d.from).setY(THREE.MathUtils.lerp(d.from.y,d.cruise,k/.2));
      else if(k<.8){g.position.lerpVectors(d.from,d.to,(k-.2)/.6);g.position.y=d.cruise;}
      else g.position.copy(d.to).setY(THREE.MathUtils.lerp(d.cruise,d.to.y,(k-.8)/.2));
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
    if (n1 && n2) off = n1.distanceTo(n2) < 0.01 ? n1.clone() : n1.clone().add(n2).normalize();
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

// Conservative swept corridor, computed only when requesting a trip.
function routeCells(route){
  const cells=new Set();
  for(let s=0;s<=route.total+1;s+=1){const {p}=samplePath(route,Math.min(s,route.total));
    for(let x=Math.floor((p.x-3.4)/4);x<=Math.floor((p.x+3.4)/4);x++)
      for(let z=Math.floor((p.z-3.4)/4);z<=Math.floor((p.z+3.4)/4);z++)cells.add(`${x},${z}`);
  }return cells;
}
function routeHitsParked(route,other){
  const q=other.group.position;
  for(let s=0;s<=route.total+1;s+=.6){const {p,dir}=samplePath(route,Math.min(s,route.total));
    const dx=Math.abs(p.x-q.x),dz=Math.abs(p.z-q.z);
    // All bays face north. Project the moving rectangle onto the parking axes.
    const halfX=Math.abs(dir.x)*3+Math.abs(dir.z)*1.15;
    const halfZ=Math.abs(dir.z)*3+Math.abs(dir.x)*1.15;
    if(dx<halfX+1.15+.15&&dz<halfZ+(other.kind==='patrol'?2:3)+.15)return true;
  }return false;
}
