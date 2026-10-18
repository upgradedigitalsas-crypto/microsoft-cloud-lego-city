import * as THREE from 'three';
import { CUSTOMERS, DISTRICTS, PILLARS } from './data.js';
import { SERVICE_ROLES, CUSTOMER_STATES } from './ecosystem.js';
import { rbox, cylGeo, plastic } from './lego.js';

const YELLOW = '#FFD22E';
const CUSTOMER_COUNT = 3;
const FIGURE_SCALE = 1.25;

function path(points) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  return { points, lengths, length: lengths.at(-1) };
}
function sample(route, fraction, out) {
  const s = Math.min(1, Math.max(0, fraction)) * route.length;
  let i = 1;
  while (i < route.lengths.length - 1 && route.lengths[i] < s) i++;
  const a = route.points[i - 1], b = route.points[i];
  const f = (s - route.lengths[i - 1]) / (route.lengths[i] - route.lengths[i - 1] || 1);
  out.set(a[0] + (b[0] - a[0]) * f, 0.55, a[1] + (b[1] - a[1]) * f);
  return Math.atan2(b[0] - a[0], b[1] - a[1]);
}

export class CustomerLife {
  constructor(scene, world) {
    this.world = world;
    this.people = [];
    this.meshes = [];
    this.time = 0;
    this.material = plastic('#FFFFFF', { roughness: 0.27 });
    this.matrix = new THREE.Matrix4();
    this.color = new THREE.Color();
    this.filter = () => true;
    this.totals = new Map(DISTRICTS.map(d => [d.id, 0]));
    for (const [districtIndex, def] of DISTRICTS.entries()) {
      const b = world.buildings.get(def.id), e = b.entrance, roles = SERVICE_ROLES[def.id];
      for (let i = 0; i < CUSTOMER_COUNT + 1; i++) {
        const host = i === CUSTOMER_COUNT;
        const person = {
          id: `${host ? 'HOST' : 'CLI'}-${def.id}-${i + 1}`, kind: 'customer', host,
          customer: host ? 'Microsoft Cloud / Partner' : CUSTOMERS[(districtIndex + i) % CUSTOMERS.length],
          role: host ? roles.host : roles.role, need: roles.need, result: roles.result,
          district: def.id, model: roles.model, group: new THREE.Object3D(),
          status: host ? 'welcoming' : 'arriving', done: 0, phase: i * 2.1,
          flow: { type: 'customer', color: PILLARS[def.pillar].color, label: host ? roles.host : roles.role },
          color: host ? '#FFFFFF' : ['#F4513C', '#1D8DD8', '#F2C72C', '#9B5CD6', '#2BAE80'][(districtIndex + i) % 5],
          stages: [], clock: 0,
        };
        if (host) {
          person.group.position.copy(e.host).add(b.group.position);
          person.group.rotation.y = Math.PI / 2;
        } else {
          // One-way promenade: entry on the right, separate exit on the left.
          // Identical speed and evenly staggered visits preserve personal space.
          const stages = [
            ['arriving', [[-10.5,14.5],[5.5,14.5]]],
            ['entering', [[5.5,14.5],[5.5,9.6],[-3,9.6]]],
            ['using', [[-3,9.6],[-3,9.6]]],
            ['leaving', [[-3,9.6],[-10.5,9.6],[-10.5,14.5]]],
            ['strolling', [[-10.5,14.5],[-10.5,14.5]]],
          ];
          let elapsed = 0;
          person.stages = stages.map(([status, points]) => {
            const route = path(points);
            const duration = status === 'using' ? 3 : Math.max(.01, route.length / 1.7);
            const stage = { status, route, duration, start: elapsed }; elapsed += duration;
            return stage;
          });
          person.duration = elapsed;
          person.clock = i / CUSTOMER_COUNT * elapsed;
        }
        this.people.push(person);
      }
    }
    this.byId = new Map(this.people.map(p => [p.id, p]));
    this.createRig();
    this.createBatches(scene);
    this.advance(0, 0);
    this.render(0);
  }

  createRig() {
    this.rig = new THREE.Group();
    this.parts = [];
    const part = (name, parent, geometry, color, x, y, z) => {
      const pivot = new THREE.Object3D(); pivot.position.set(x, y, z); parent.add(pivot);
      this.parts.push({ name, pivot, geometry, color });
      return pivot;
    };
    // Trapezoid torso and cylindrical yellow head create the classic minifigure silhouette.
    const shape = new THREE.Shape();
    shape.moveTo(-0.61, 0); shape.lineTo(0.61, 0); shape.lineTo(0.43, 1.06); shape.lineTo(-0.43, 1.06); shape.closePath();
    const torso = new THREE.ExtrudeGeometry(shape, { depth: 0.64, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.035, bevelThickness: 0.035 });
    torso.translate(0, 0, -0.32);
    part('torso', this.rig, torso, 'shirt', 0, 1.08, 0);
    part('hip', this.rig, rbox(1.06, 0.22, 0.62), '#273E5B', 0, 1.04, 0);
    part('head', this.rig, cylGeo(0.38, 0.66, 16), YELLOW, 0, 2.54, 0);
    part('neck', this.rig, cylGeo(0.18, 0.17, 12), YELLOW, 0, 2.16, 0);
    part('stud', this.rig, cylGeo(0.22, 0.18, 12), YELLOW, 0, 2.96, 0);
    part('cap', this.rig, rbox(0.88, 0.18, 0.88), 'accent', 0, 2.87, 0.08);
    part('badge', this.rig, rbox(0.3, 0.28, 0.035), '#FFFFFF', -0.21, 1.78, 0.36);
    part('zip', this.rig, rbox(0.035, 0.7, 0.035), '#273E5B', 0, 1.62, 0.36);
    const eye = new THREE.SphereGeometry(0.055, 6, 4);
    part('eye-left', this.rig, eye, '#1D2430', -0.14, 2.61, 0.35);
    part('eye-right', this.rig, eye, '#1D2430', 0.14, 2.61, 0.35);
    const smile = new THREE.TorusGeometry(0.14, 0.025, 4, 10, Math.PI);
    const mouth = part('smile', this.rig, smile, '#1D2430', 0, 2.48, 0.36); mouth.rotation.z = Math.PI;
    this.legs = []; this.arms = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(side * 0.29, 1.0, 0); this.rig.add(leg); this.legs.push(leg);
      part(`leg-${side}`, leg, rbox(0.51, 0.82, 0.55), '#294A70', 0, -0.4, 0);
      part(`foot-${side}`, leg, rbox(0.53, 0.25, 0.75), '#253347', 0, -0.86, 0.11);
      const arm = new THREE.Group(); arm.position.set(side * 0.66, 1.96, 0); this.rig.add(arm); this.arms.push(arm);
      part(`arm-${side}`, arm, rbox(0.29, 0.72, 0.37), 'shirt', 0, -0.3, 0);
      const hand = part(`hand-${side}`, arm, new THREE.TorusGeometry(0.18, 0.07, 6, 10, Math.PI * 1.65), YELLOW, 0, -0.77, 0.04);
      hand.rotation.z = side * 0.3;
    }
    const bag = part('briefcase', this.arms[0], rbox(0.65, 0.55, 0.32), '#78543B', -0.15, -1.1, 0.05);
    part('handle', bag, new THREE.TorusGeometry(0.12, 0.035, 4, 8, Math.PI), '#3F3024', 0, 0.32, 0);
    this.solution = part('solution', this.rig, rbox(0.95, 0.55, 0.7), 'accent', 0, 1.5, 0.75);
    part('solution-stud-a', this.solution, cylGeo(0.14, 0.13, 10), 'accent', -0.25, 0.34, 0);
    part('solution-stud-b', this.solution, cylGeo(0.14, 0.13, 10), 'accent', 0.25, 0.34, 0);
  }

  createBatches(scene) {
    // One draw per body part for all 80 people, including articulated limbs.
    for (const part of this.parts) {
      const mesh = new THREE.InstancedMesh(part.geometry, this.material, this.people.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.castShadow = true; mesh.receiveShadow = true;
      // The same instance index always identifies the same person, even under filters.
      mesh.userData.customerIds = this.people.map(p => p.id);
      mesh.frustumCulled = false;
      part.mesh = mesh; this.meshes.push(mesh); scene.add(mesh);
    }
    this.setFilter(() => true);
  }

  setFilter(matches) {
    this.filter = matches;
    for (const part of this.parts) {
      this.people.forEach((person, i) => {
        const base = part.color === 'shirt' ? person.color : part.color === 'accent' ? person.flow.color : part.color;
        this.color.set(base).multiplyScalar(matches(person) ? 1 : 0.28);
        part.mesh.setColorAt(i, this.color);
      });
      part.mesh.instanceColor.needsUpdate = true;
    }
  }

  advance(dt, time) {
    this.time = time;
    for (const person of this.people) {
      const b = this.world.buildings.get(person.district);
      if (!person.host) {
        if(this.world.walker?.active && person.group.position.distanceTo(this.world.walker.group.position)<2.4)continue;
        const oldCycles = Math.floor(person.clock / person.duration);
        person.clock += dt;
        const cycles = Math.floor(person.clock / person.duration);
        if (cycles > oldCycles) {
          person.done += cycles - oldCycles;
          this.totals.set(person.district, this.totals.get(person.district) + cycles - oldCycles);
        }
        const phase = person.clock % person.duration;
        const stage = person.stages.find(s => phase < s.start + s.duration) || person.stages.at(-1);
        person.status = stage.status;
        const heading = sample(stage.route, (phase - stage.start) / stage.duration, person.group.position);
        person.group.position.add(b.group.position);
        person.group.rotation.y = stage.status === 'using' ? -Math.PI / 2 : heading;
      }
    }
  }

  render(time = this.time) {
    for (const [i, person] of this.people.entries()) {
      const moving = !person.host && person.status !== 'using';
      const stride = moving ? Math.sin(time * 7 + person.phase) * 0.55 : 0;
      this.rig.position.copy(person.group.position);
      this.rig.position.y += moving ? Math.abs(Math.sin(time * 7 + person.phase)) * 0.07 : 0;
      this.rig.rotation.y = person.group.rotation.y;
      this.rig.scale.setScalar(FIGURE_SCALE);
      this.legs[0].rotation.x = stride; this.legs[1].rotation.x = -stride;
      this.arms[0].rotation.set(-stride * 0.75, 0, 0.1);
      this.arms[1].rotation.set(stride * 0.75, 0, -0.1);
      if (person.host || person.status === 'using') this.arms[1].rotation.z = -1.4 + Math.sin(time * 2.5 + i) * 0.3;
      const carrying = person.status === 'leaving' || person.status === 'strolling';
      this.solution.scale.setScalar(carrying ? 1 : 0);
      if (carrying) { this.arms[0].rotation.x = -0.7; this.arms[1].rotation.x = -0.7; }
      this.rig.updateMatrixWorld(true);
      for (const part of this.parts) part.mesh.setMatrixAt(i, part.pivot.matrixWorld);
    }
    for (const mesh of this.meshes) {
      mesh.instanceMatrix.needsUpdate = true;
      // Raycasting needs current bounds after instances walk to another part of the island.
      mesh.computeBoundingSphere();
    }
  }
  get(id) { return this.byId.get(id); }
  visitors(id) { return this.people.filter(p => p.district === id && !p.host); }
  label(person) { return CUSTOMER_STATES[person.status]; }
}
