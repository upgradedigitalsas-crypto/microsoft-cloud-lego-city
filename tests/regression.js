import * as THREE from 'three';
import { buildCity } from '../js/city.js';
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
  const originalPrint = window.print;
  window.print = () => {};
  printProposal({ client: '<Cliente & prueba>', title: 'Test', rows: [['Ahorro', '$2.250']] });
  assert(document.querySelector('#proposal-print h2').textContent === '<Cliente & prueba>' && !document.querySelector('#proposal-print h2').children.length, 'Tarjeta conserva nombre de cliente sin interpretar HTML');
  window.print = originalPrint;
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(640, 480);
  const camera = new THREE.PerspectiveCamera(38, 4 / 3, 1, 1000);
  camera.position.set(120, 115, 135); camera.lookAt(0, 4, 0);
  scene.add(new THREE.HemisphereLight());
  renderer.render(scene, camera);
  lines.push(`INFO ${renderer.info.render.calls} draw calls (sin sombras), ${renderer.info.render.triangles} triángulos`);
  renderer.dispose();
  output.textContent = lines.join('\n') + '\nCOMPLETADO';
} catch (error) { output.textContent = lines.join('\n') + '\nFAIL ' + error.stack; throw error; }
