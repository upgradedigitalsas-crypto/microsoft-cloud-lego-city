import * as THREE from 'three';
import { buildCity } from '../js/city.js';
import { BOULEVARD, streetRoute, inLake } from '../js/urban.js';
import { CITY_STORIES, EXECUTIVE_ROUTES } from '../js/executive.js';
import { isIslandLand } from '../js/terrain.js';
import { PLATE, DISTRICTS } from '../js/data.js';
import { SERVICE_ROLES } from '../js/ecosystem.js';
import { Simulation } from '../js/sim.js';
import { pointerNDC } from '../js/picking.js';
import { optimization, bundle, printProposal } from '../js/proposal.js';
const output = document.getElementById('results');
const lines = [];
function assert(condition, text) {
  if (!condition) throw new Error(text);
  lines.push(`PASS ${text}`);
  output.textContent = lines.join('\n');
}
try {
  const initialCenter = pointerNDC(400, 300, { left: 0, top: 0, width: 800, height: 600 });
  const resizedCenter = pointerNDC(300, 250, { left: 100, top: 100, width: 400, height: 300 });
  assert(initialCenter.x === 0 && initialCenter.y === 0 && resizedCenter.x === 0 && resizedCenter.y === 0,
    'Picking usa rectángulo CSS tras resize y offset, independiente de DPI');
  assert(pointerNDC(0, 0, {left: 0, top: 0, width: 0, height: 0}) === null, 'Picking ignora superficies sin tamaño');
  // Deterministic repeated trips exercise every transition and dock reservation.
  let seed = 42;
  Math.random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  const scene = new THREE.Scene();
  const world = buildCity(scene);
  const sim = new Simulation(scene, world);
  assert((PLATE.maxX - PLATE.minX) * (PLATE.maxZ - PLATE.minZ) > 2 * 156 * 106, 'Mundo ampliado a más del doble de superficie');
  assert(sim.customers.people.length === 80 && sim.customers.people.filter(p => !p.host).length === 60, '60 clientes y 20 especialistas con población fija');
  assert(DISTRICTS.every(d => SERVICE_ROLES[d.id] && world.buildings.get(d.id).entrance && sim.customers.visitors(d.id).length === 3), 'Cada isla tiene un papel de Microsoft Cloud, acceso y tres clientes');
  assert(DISTRICTS.every(d => isIslandLand(d.pos[0], d.pos[1])) && !isIslandLand(185, 145) && isIslandLand(130, 0), 'Costa irregular conserva los servicios y se extiende fuera del antiguo rectángulo');
  const covered = new Set(EXECUTIVE_ROUTES.flatMap(r => r.ids));
  assert(DISTRICTS.every(d => CITY_STORIES[d.id] && covered.has(d.id)), 'Los seis recorridos ejecutivos explican los 20 edificios');
  assert(BOULEVARD.every(([x,z]) => !inLake(x,z)), 'El bulevar rodea OneLake sin atravesar el lago');
  assert(DISTRICTS.every(d => !inLake(...d.pos)), 'Los edificios conservan terreno fuera del lago');
  for (let from=0;from<BOULEVARD.length;from++) for(let to=0;to<BOULEVARD.length;to++) {
    const route=streetRoute(from,to);
    if(route[0]!==BOULEVARD[from] || route.at(-1)!==BOULEVARD[to] || route.length>BOULEVARD.length/2+1) throw new Error('Ruta urbana incorrecta');
  }
  assert(true, 'Todas las rutas del bulevar son continuas y toman el sentido más corto');
  let events = 0;
  const deliveries = new Map();
  const unsubscribe = sim.on('event', () => events++);
  sim.pushEvent('data', 'test'); unsubscribe(); sim.pushEvent('data', 'ignored');
  assert(events === 1, 'Suscripción por tipo y cancelación de eventos');
  sim.on('delivery', v => deliveries.set(v.id, (deliveries.get(v.id) || 0) + 1));
  const truckCount = sim.vehicles.filter(v => v.kind === 'truck').length;
  let nodeCount = 0; scene.traverse(() => nodeCount++);
  let maxReservations = 0;
  // 20 minutes of simulation, yielding between chunks to keep the page usable.
  for (let chunk = 0; chunk < 40; chunk++) {
    for (let step = 0; step < 600; step++) {
      const tick = chunk * 600 + step;
      sim.update(0.05, tick * 0.05);
      if (tick % 100 === 0) {
        const owners = new Set();
        for (const v of sim.vehicles) {
          if (!v._slotRef) continue;
          const key = `${v._slotRef.bid}:${v._slotRef.idx}`;
          if (owners.has(key)) throw new Error(`Muelle duplicado ${key}`);
          owners.add(key);
        }
        const busyCount = [...sim.busy.values()].reduce((sum, busy) => sum + busy.size, 0);
        if (busyCount !== owners.size) throw new Error('Reserva de muelle huérfana');
        maxReservations = Math.max(maxReservations, busyCount);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  assert(deliveries.size === truckCount && [...deliveries.values()].every(n => n >= 2), 'Todos los camiones completan múltiples entregas en 20 minutos');
  assert(maxReservations <= truckCount, 'Muelles exclusivos y sin reservas huérfanas durante toda la prueba');
  assert(sim.drones.every(d => d.done >= 2 && d.timeline.length <= 5), 'Drones completan múltiples misiones con historial acotado');
  assert(sim.customers.people.filter(p => !p.host).every(p => p.done >= 2), 'Todos los clientes completan múltiples visitas sin bloquearse');
  assert(sim.customers.people.every(p => {
    const b = world.buildings.get(p.district), pos = p.group.position;
    return Number.isFinite(pos.x) && Number.isFinite(pos.z) && Math.abs(pos.x - b.group.position.x) <= b.lot.width / 2 && Math.abs(pos.z - b.group.position.z) <= b.lot.depth / 2 + 3;
  }), 'Clientes permanecen en sus accesos y recorridos de servicio');
  sim.customers.render();
  const head = sim.customers.parts.find(p => p.name === 'head')?.mesh;
  assert(!!head && sim.customers.meshes.length < 40, '80 minifiguras articuladas comparten menos de 40 draw calls');
  const originalColors = head.instanceColor.array.slice();
  sim.customers.setFilter(p => p.district === 'fabric'); sim.customers.setFilter(() => true);
  assert(head.instanceColor.array.every((v, i) => v === originalColors[i]), 'Filtros de clientes restauran sus colores sin materiales adicionales');
  scene.updateMatrixWorld(true);
  const transform = new THREE.Matrix4(); head.getMatrixAt(0, transform);
  const center = new THREE.Vector3().setFromMatrixPosition(transform);
  const ray = new THREE.Raycaster(center.clone().add(new THREE.Vector3(0, 0, 10)), new THREE.Vector3(0, 0, -1));
  assert(ray.intersectObject(head).some(hit => hit.instanceId === 0 && hit.object.userData.customerIds[hit.instanceId] === sim.customers.people[0].id), 'Picking identifica al cliente correcto dentro de las instancias');
  const drone = sim.drones[0];
  drone.status = 'returning'; drone.from = drone.group.position.clone(); drone.to = drone.pad.clone(); drone.dur = 0.05; drone.t = 0;
  sim.updateDrone(drone, 0.05, 0);
  assert(drone.status === 'pad' && drone.group.position.equals(drone.pad), 'Retorno exacto al helipuerto');
  let finalNodes = 0; scene.traverse(o => { finalNodes++; if (o.position && ![o.position.x, o.position.y, o.position.z].every(Number.isFinite)) throw new Error('Posición no finita'); });
  assert(finalNodes === nodeCount && sim.events.length <= 40, 'Escena e historial no crecen tras 24.000 actualizaciones');
  assert(world.buildings.get('m365').meshes.some(m => m.isInstancedMesh), 'Studs instanciados incluidos en picking del edificio');
  const opt = optimization({ gross: 10000, ri: 0.72, ahb: true, macc: 5000000 });
  assert(Math.abs(opt.net - 3160) < 0.01 && opt.saving === 6840, 'Optimización: costos y ahorro usan los mismos supuestos');
  assert(optimization({ gross: 10000, ri: 0, ahb: false, macc: 0 }).net === 10000, 'Sin reserva ni AHB no se inventa ahorro');
  assert(bundle({ seats: 500, current: 61.5, e5: 57 }).saving === 2250, 'Bundling escala ahorro por puestos');
  let beachUpdates=0;
  world.beach.subscribe(()=>beachUpdates++);
  world.beach.start(); world.beach.start();
  for(let i=0;i<260;i++) world.anims.forEach(fn=>fn(i*0.05,0.05));
  assert(!world.beach.running && beachUpdates===6, 'Pedido de playa recorre cuatro etapas, evita duplicados y termina');
  world.beach.subscribe(()=>{});
  const originalPrint = window.print;
  window.print = () => {};
  printProposal({ client: '<Cliente & prueba>', title: 'Test', rows: [['Ahorro', '$2.250']] });
  assert(document.querySelector('#proposal-print h2').textContent === '<Cliente & prueba>' && !document.querySelector('#proposal-print h2').children.length, 'Tarjeta conserva nombre de cliente sin interpretar HTML');
  window.print = originalPrint;
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(640, 480);
  const camera = new THREE.PerspectiveCamera(38, 4 / 3, 1, 1000);
  camera.position.set(235, 210, 260); camera.lookAt(0, 4, 0);
  scene.add(new THREE.HemisphereLight());
  renderer.render(scene, camera);
  lines.push(`INFO ${renderer.info.render.calls} draw calls (sin sombras), ${renderer.info.render.triangles} triángulos`);
  renderer.dispose();
  output.textContent = lines.join('\n') + '\nCOMPLETADO';
} catch (error) { output.textContent = lines.join('\n') + '\nFAIL ' + error.stack; throw error; }
