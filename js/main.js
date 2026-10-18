import { createWalkMode } from './walk.js';
import { smoothNavigation } from './navigation.js';
// ============================================================================
//  CloudCity: Orquestador principal 3D + UI + Simulación en tiempo real
// ============================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  DOC, PILLARS, DISTRICTS, FLOWS, RESPONSIBILITY, BILLING, CONTRACTS,
  BUNDLE, CHECKLIST, ROLES, PLATE, X_ROADS, Z_ROADS,
} from './data.js';
import { brackets, disposeGeometryCaches } from './lego.js';
import { buildNightLighting } from './night-lighting.js';
import { buildSecurityLife } from './security-life.js';
import { buildCity } from './city.js';
import { Simulation, STATUS } from './sim.js';
import { BEACH_STEPS } from './beach.js';
import { CITY_STORIES, initExecutiveTour } from './executive.js';
import { BOULEVARD } from './urban.js';
import { SERVICE_ROLES, CUSTOMER_STATES } from './ecosystem.js';
import { pointerNDC } from './picking.js';
import { BrickAudio } from './audio.js';
import { optimization, bundle, printProposal } from './proposal.js';
const audio = new BrickAudio();
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---------------------------------------------------------------------------
// 1. Configuración Three.js
// ---------------------------------------------------------------------------
const container = document.getElementById('stage');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#DCEFFF');
scene.fog = new THREE.FogExp2('#DCEFFF', 0.0011);

const aspect = container.clientWidth / container.clientHeight;
const camera = new THREE.PerspectiveCamera(38, aspect, 1, 1000);
const DEFAULT_CAM_POS = new THREE.Vector3(315, 205, 350);
const DEFAULT_TARGET = new THREE.Vector3(40, -25, 20);
camera.position.copy(DEFAULT_CAM_POS);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.25 : 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.touches.ONE = THREE.TOUCH.ROTATE;
controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
controls.rotateSpeed = 0.65;
controls.zoomSpeed = 1.0;
controls.addEventListener('start', () => { state.camTarget = null; });
controls.dampingFactor = 0.12;
controls.target.copy(DEFAULT_TARGET);
controls.maxPolarAngle = Math.PI * .85;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.minDistance = 6;
controls.maxDistance = 600;
const navigation=smoothNavigation(camera,controls,renderer.domElement,()=>{state.camTarget=null;});

// Iluminación
const hemiLight = new THREE.HemisphereLight('#ffffff', '#cbd5e1', 0.75);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight('#ffffff', 1.35);
dirLight.position.set(120, 190, 90);
dirLight.castShadow = true;
const shadowSize = matchMedia('(pointer: coarse)').matches ? 1024 : 2048;
dirLight.shadow.mapSize.set(shadowSize, shadowSize);
dirLight.shadow.camera.near = 20;
dirLight.shadow.camera.far = 550;
const d = 140;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
dirLight.shadow.bias = -0.0003;
scene.add(dirLight);

const ambientLight = new THREE.AmbientLight('#94a3b8', 0.35);
scene.add(ambientLight);

// ---------------------------------------------------------------------------
// 2. Construcción del Mundo y Simulación
// ---------------------------------------------------------------------------
const world = buildCity(scene);
const sim = new Simulation(scene, world);
buildSecurityLife(scene, world, sim.customers);
const nightLighting=buildNightLighting(scene,world,sim);

const walk=createWalkMode(scene,world,sim,camera,controls,()=>{navigation.cancel();state.camTarget=null;setHovered(null);selectEntity(null,null);});

// Brackets de selección 3D
const selectBox = brackets('#2563EB');
selectBox.visible = false;
scene.add(selectBox);

// ---------------------------------------------------------------------------
// 3. Estado de la Aplicación
// ---------------------------------------------------------------------------
const state = {
  selected: null, // { kind: 'district' | 'truck' | 'patrol' | 'drone', id, data }
  mode: 'live',
  tab: 'customers',
  filter: 'all',
  isNight: false,
  simTime: new Date(2026, 9, 15, 9, 45),
  camTarget: null, // { pos, look, t: 0, dur }
  searchQuery: '',
};

// ---------------------------------------------------------------------------
// 4. Etiquetas 3D Proyectadas
// ---------------------------------------------------------------------------
const labelsContainer = document.createElement('div');
labelsContainer.id = 'labels-3d';
labelsContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:9;';
container.appendChild(labelsContainer);

const districtLabels = new Map();
const productIcons = {copilotStudio:'copilotStudio',copilot:'copilot',secCopilot:'secCopilot',m365:'m365',dynamics:'dynamics',power:'power',compute:'azure',azuredata:'azure',fabric:'fabric',entra:'entra',defender:'defender',sentinel:'sentinel',purview:'purview'};
const roleIcons = {csp:'▦',ea:'▤',mcae:'▤',macc:'◈',hq:'▥',lsp:'▣',gsi:'⚙'};
DISTRICTS.forEach(d => {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'blabel';
  el.setAttribute('aria-label', d.name);
  el.title = d.name;
  const pillar = PILLARS[d.pillar];
  const icon=productIcons[d.id];
  el.innerHTML = `${icon ? `<img class="product-icon" src="assets/products/${icon}.svg" alt="" width="24" height="24" />` : `<i class="role-icon" aria-hidden="true" style="color:${pillar.color}">${roleIcons[d.id] || '◇'}</i>`}<span>${d.short}</span><em id="badge-${d.id}"></em>`;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    selectEntity('district', d.id);
  });
  const leader=document.createElement('div');leader.className='label-leader';
  labelsContainer.appendChild(leader);labelsContainer.appendChild(el);
  districtLabels.set(d.id, { el, leader, width: 150, height: 36, pos: new THREE.Vector3(d.pos[0], world.buildings.get(d.id).height + 3, d.pos[1]) });
});

const itseLabel=document.createElement('button');itseLabel.type='button';itseLabel.className='blabel';itseLabel.textContent='ITSE · Equipos y servicios';itseLabel.setAttribute('aria-label','Ver torre ITSE de frente');itseLabel.addEventListener('click',focusITSETower);
const itseLeader=document.createElement('div');itseLeader.className='label-leader';labelsContainer.append(itseLeader,itseLabel);
districtLabels.set('itse-tower',{el:itseLabel,leader:itseLeader,width:190,height:36,pos:new THREE.Vector3(0,world.itseTower.height+3,0)});
function focusITSETower(){
  selectEntity(null,null);audio.click();
  const h=world.itseTower.height,halfFov=THREE.MathUtils.degToRad(camera.fov/2);
  const distance=Math.max(h/2/Math.tan(halfFov),11/(Math.tan(halfFov)*camera.aspect))*1.35+10;
  const target=new THREE.Vector3(0,h/2,0);
  flyCameraTo(new THREE.Vector3(0,h/2+distance*.08,Math.max(25,distance)),target,1);
}

// Cache label dimensions on font/viewport changes instead of measuring every frame.
const labelObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    const label=[...districtLabels.values()].find(item=>item.el===entry.target);
    if(label && entry.target.offsetWidth>0){label.width=entry.target.offsetWidth;label.height=entry.target.offsetHeight;}
  }
});
districtLabels.forEach(({el})=>labelObserver.observe(el));
window.addEventListener('pagehide',()=>labelObserver.disconnect(),{once:true});

// Etiqueta flotante del vehículo seleccionado
const vehicleTag = document.createElement('div');
vehicleTag.className = 'vtag hidden';
labelsContainer.appendChild(vehicleTag);

// ---------------------------------------------------------------------------
// 5. Animación de Cámara Suave
// ---------------------------------------------------------------------------
function flyCameraTo(targetPos, targetLook, duration = 1.0) {
  if(walk.active)walk.exit();
  navigation.cancel();
  state.camTarget = {
    startPos: camera.position.clone(),
    endPos: targetPos.clone(),
    startLook: controls.target.clone(),
    endLook: targetLook.clone(),
    t: 0,
    dur: duration,
  };
}

function updateCameraAnimation(dt) {
  if (!state.camTarget) return;
  const ct = state.camTarget;
  ct.t += dt / ct.dur;
  const k = Math.min(1, ct.t);
  const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  camera.position.lerpVectors(ct.startPos, ct.endPos, ease);
  controls.target.lerpVectors(ct.startLook, ct.endLook, ease);
  if (k >= 1) state.camTarget = null;
}

// ---------------------------------------------------------------------------
// 6. Selección de Entidades
// ---------------------------------------------------------------------------
export function selectEntity(kind, id, focusCamera = true) {
  if (!id) {
    state.selected = null;
    selectBox.visible = false;
    vehicleTag.classList.add('hidden');
    document.body.classList.add('no-detail');
    renderDetail();
    renderTracker();
    updateLabelsVisibility();
    return;
  }

  if (kind === 'district' ? !world.buildings.has(id) : !sim.get(id)) return;
  if (window.matchMedia('(max-width: 900px)').matches && state.mode !== 'live') setMode('live');
  document.body.classList.remove('fleet-open');
  document.getElementById('fleet-toggle').setAttribute('aria-expanded', 'false'); document.getElementById('fleet-toggle').textContent = 'Explorar portafolio';
  document.body.classList.remove('no-detail');
  audio.click();

  if (kind === 'district') {
    const d = DISTRICTS.find(x => x.id === id);
    const b = world.buildings.get(id);
    state.selected = { kind: 'district', id, data: d, building: b };
    selectBox.visible = true;
    selectBox.rotation.set(0, 0, 0);
    selectBox.position.set(d.pos[0], b.height / 2 + 0.2, d.pos[1]);
    selectBox.scale.set(b.size.x + 2, b.size.y + 1, b.size.z + 2);
    vehicleTag.classList.add('hidden');

    if (focusCamera) {
      const targetLook = new THREE.Vector3(d.pos[0], b.height/2, d.pos[1]);
      const halfFov=THREE.MathUtils.degToRad(camera.fov/2);
      const distance=Math.max(b.size.y/2/Math.tan(halfFov),b.size.x/2/(Math.tan(halfFov)*camera.aspect))*1.45+b.size.z/2;
      const targetPos = targetLook.clone().add(new THREE.Vector3(0, distance*.12, Math.max(25,distance)));
      flyCameraTo(targetPos, targetLook, 0.9);
    }
  } else {
    const ent = sim.get(id);
    if (!ent) return;
    state.selected = { kind: ent.kind, id, data: ent };
    selectBox.visible = true;
    vehicleTag.classList.remove('hidden');

    if (focusCamera) {
      const p = ent.group.position;
      const targetLook = new THREE.Vector3(p.x, 2, p.z);
      const targetPos = targetLook.clone().add(ent.kind === 'customer' ? new THREE.Vector3(11, 10, 14) : new THREE.Vector3(22, 22, 26));
      flyCameraTo(targetPos, targetLook, 0.8);
    }
  }

  renderDetail();
  renderTracker();
  renderFleetList();
  updateLabelsVisibility();
}

function updateLabelsVisibility() {
  districtLabels.forEach(({ el }, id) => {
    el.classList.toggle('sel', state.selected?.kind === 'district' && state.selected?.id === id);
  });
}

// ---------------------------------------------------------------------------
// 7. Raycasting / Clics en la Escena 3D
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const pickables = [...sim.customers.meshes];
world.beach.group.traverse(o => { if(o.isMesh) pickables.push(o); });
world.buildings.forEach(b => pickables.push(...b.meshes));
world.itseTower.group.traverse(o=>{if(o.isMesh){o.userData.landmark='itse-tower';pickables.push(o);}});
sim.all().forEach(v => v.group.traverse(o => {
  if (o.isMesh && o !== v.group.userData.beam) pickables.push(o);
}));
const hoverBox=brackets('#79F6F5');hoverBox.visible=false;scene.add(hoverBox);
let hoveredId=null,lastHover=0;
function setHovered(id){
  hoveredId=id;hoverBox.visible=Boolean(id)&&!walk.active;
  renderer.domElement.style.cursor=id?'pointer':'';
  labelsContainer.classList.toggle('has-hover',Boolean(id));
  districtLabels.forEach(({el,leader},key)=>{el.classList.toggle('hovered',key===id);leader.classList.toggle('hovered',key===id);});
  if(id){const b=id==='itse-tower'?{group:world.itseTower.group,height:world.itseTower.height,size:new THREE.Vector3(22,world.itseTower.height,20)}:world.buildings.get(id);hoverBox.position.set(b.group.position.x,b.height/2+.2,b.group.position.z);hoverBox.scale.set(b.size.x+2,b.size.y+1,b.size.z+2);}
}
function hoverAt(e){
  if(walk.active||e.pointerType==='touch'||e.buttons){setHovered(null);return;}
  if(performance.now()-lastHover<60)return;lastHover=performance.now();
  const ndc=pointerNDC(e.clientX,e.clientY,renderer.domElement.getBoundingClientRect());if(!ndc){setHovered(null);return;}
  mouse.set(ndc.x,ndc.y);camera.updateMatrixWorld();raycaster.setFromCamera(mouse,camera);
  const hit=raycaster.intersectObjects(pickables,false).find(h=>h.object.visible&&(h.object.material.opacity===undefined||h.object.material.opacity>.05));
  const id=hit?.object.userData.entityId;setHovered(hit?.object.userData.landmark==='itse-tower'?'itse-tower':world.buildings.has(id)?id:null);
}
renderer.domElement.addEventListener('pointerleave',e=>{if(!e.relatedTarget?.closest?.('.blabel'))setHovered(null);});
districtLabels.forEach(({el},id)=>{el.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'&&!walk.active)setHovered(id);});el.addEventListener('pointerleave',()=>setHovered(null));});
controls.addEventListener('start',()=>setHovered(null));
const pointers = new Set();
let tap = null;
renderer.domElement.addEventListener('pointerdown', e => {
  pointers.add(e.pointerId);
  if (pointers.size === 1 && e.button === 0) tap = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  else tap = null;
});
renderer.domElement.addEventListener('pointermove', e => {
  if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 6) tap.moved = true;
  hoverAt(e);
});
renderer.domElement.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); tap = null; });
renderer.domElement.addEventListener('pointerup', e => {
  pointers.delete(e.pointerId);
  const start = tap; tap = null;
  if(walk.active)return;
  if (!start || start.id !== e.pointerId || start.moved || pointers.size ||
      Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const ndc = pointerNDC(e.clientX, e.clientY, rect);
  if (!ndc) return;
  mouse.set(ndc.x, ndc.y);
  camera.updateMatrixWorld(); scene.updateMatrixWorld(true);
  raycaster.setFromCamera(mouse, camera);
  // One distance-sorted query respects occlusion across vehicles and buildings.
  const hit = raycaster.intersectObjects(pickables, false).find(h =>
    h.object.visible && (h.object.material.opacity === undefined || h.object.material.opacity > 0.05));
  if(hit?.object.userData.landmark==='itse-tower'){focusITSETower();return;}
  if (hit?.object.userData.landmark === 'beach') { openBeach(); return; }
  const id = hit?.object.userData.customerIds?.[hit.instanceId] || hit?.object.userData.entityId;
  if (id) selectEntity(world.buildings.has(id) ? 'district' : 'vehicle', id);
  else selectEntity(null, null);
});

// ---------------------------------------------------------------------------
// 8. Paneles UI: Detalle, Tracker, Flota, Minimapa
// ---------------------------------------------------------------------------
const detailEl = document.getElementById('detail');
const trackerEl = document.getElementById('tracker');

function renderDetail() {
  detailEl.inert = !state.selected;
  if (!state.selected) {
    detailEl.innerHTML = '';
    return;
  }

  const { kind, id, data } = state.selected;

  if (kind === 'district') {
    const d = data;
    const pillar = PILLARS[d.pillar];
    const inb = sim.inbound(id);
    const outb = sim.outbound(id);
    const visitors = sim.customers.visitors(id);
    const serviceRole = SERVICE_ROLES[id];
    detailEl.innerHTML = `
      <div class="d-head">
        <div class="d-ico" style="background:${pillar.color};color:${pillar.color}">🏛️</div>
        <div>
          <span class="d-kicker" style="color:${pillar.color}">${pillar.name}</span>
          <div class="d-title">${d.name}</div>
          <div class="d-sub">${d.model} · ${d.billing}</div>
        </div>
        <div class="d-actions">
          <button class="icon-btn primary" title="Enfocar" id="btn-focus-d">🎯</button>
          <button class="icon-btn" title="Cerrar" id="btn-close-d">✕</button>
        </div>
      </div>
      <div class="d-status">
        <span class="pill blue">${visitors.length} clientes LEGO</span>
        <span class="pill green">${sim.customers.totals.get(id)} visitas completadas</span>
        <span class="pill green">Operando</span>
      </div>
      <div class="customer-journey"><small>${CITY_STORIES[id][0]}</small><b>${CITY_STORIES[id][1]}</b><p>${CITY_STORIES[id][2]}</p><small>INDICADOR PARA SU EMPRESA</small><p>${CITY_STORIES[id][3]}</p></div>
      <p class="d-desc">${d.desc}</p>
      <div class="customer-journey"><small>LA VIDA EN ESTA ISLA</small><b>${serviceRole.host}</b>
        <p>${serviceRole.need} → ${serviceRole.result}</p>
        <button class="btn" id="follow-island-client">Seguir a un cliente LEGO</button></div>
      <div class="rows">
        <div class="row"><span>Pilar Estratégico</span><b>${pillar.name}</b></div>
        <div class="row"><span>Taxonomía</span><b>${d.model}</b></div>
        <div class="row"><span>Métrica Facturación</span><b>${d.billing}</b></div>
        <div class="row"><span>Ubicación Ciudad</span><b>[${d.pos[0]}, ${d.pos[1]}]</b></div>
      </div>
      <div style="margin-top:12px;font-size:11px;font-weight:700;color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em;">Servicios / Componentes</div>
      <div class="chips">
        ${d.items.map(it => `<span class="chip">${it}</span>`).join('')}
      </div>
    `;
    document.getElementById('btn-close-d')?.addEventListener('click', () => selectEntity(null, null));
    document.getElementById('btn-focus-d')?.addEventListener('click', () => selectEntity('district', id, true));
    document.getElementById('follow-island-client').addEventListener('click', () => selectEntity('customer', visitors[0].id));
  } else if (kind === 'customer') {
    const person = data;
    const district = DISTRICTS.find(d => d.id === person.district);
    detailEl.innerHTML = `
      <div class="d-head">
        <div class="customer-avatar" style="--shirt:${person.color}"><i></i><b></b></div>
        <div><span class="d-kicker" style="color:${person.flow.color}">${person.host ? 'ANFITRIÓN DE LA ISLA' : 'CLIENTE DEL ECOSISTEMA'}</span>
          <div class="d-title">${person.customer}</div><div class="d-sub">${person.role}</div></div>
        <div class="d-actions"><button class="icon-btn" id="close-client" title="Cerrar">✕</button></div>
      </div>
      <div class="d-status"><span class="pill blue" id="client-status">${CUSTOMER_STATES[person.status]}</span><span class="pill violet">${person.model}</span></div>
      <div class="customer-journey"><small>1 · LLEGA CON UNA NECESIDAD</small><p>${person.need}</p>
        <small>2 · ENTRA EN LA ISLA</small><b>${district.name}</b>
        <small>3 · SALE CON UNA SOLUCIÓN</small><p>${person.result}</p></div>
      <p class="d-desc">${person.host ? 'Recibe a los clientes y representa al especialista que opera este servicio.' : 'El ladrillo que lleva al salir representa el servicio activado para su empresa. Personaje y actividad ilustrativos.'}</p>
      <button class="btn" id="client-island">Explorar ${district.short}</button>
    `;
    document.getElementById('close-client').onclick = () => selectEntity(null, null);
    document.getElementById('client-island').onclick = () => selectEntity('district', person.district);
  } else if (kind === 'truck') {
    const v = data;
    const st = STATUS[v.status] || STATUS.transit;
    const fromB = DISTRICTS.find(x => x.id === v.job?.from)?.short || v.job?.from;
    const toB = DISTRICTS.find(x => x.id === v.job?.to)?.short || v.job?.to;
    const rem = sim.remaining(v);
    const etaMin = Math.ceil(rem / (v.speed || 1) / 2);
    detailEl.innerHTML = `
      <div class="d-head">
        <div class="d-ico" style="background:${v.flow.color};color:${v.flow.color}">🚛</div>
        <div>
          <span class="d-kicker" style="color:${v.flow.color}">${v.flow.label}</span>
          <div class="d-title">${v.id}</div>
          <div class="d-sub">${v.driver} · ${v.customer}</div>
        </div>
        <div class="d-actions">
          <button class="icon-btn primary" title="Enfocar" id="btn-focus-v">🎯</button>
          <button class="icon-btn" title="Cerrar" id="btn-close-v">✕</button>
        </div>
      </div>
      <div class="d-status">
        <span class="pill ${st.tone}">● ${st.label}</span>
        <span class="pill blue">${(v.speed * 3.6).toFixed(0)} km/h</span>
        <span class="pill gray">ETA ~${etaMin} min</span>
      </div>
      <div class="bar" style="margin-top:8px;">
        <i style="width:${v.path ? ((v.s / v.path.total) * 100).toFixed(0) : 0}%;background:${v.flow.color}"></i>
      </div>
      <div class="bar-meta"><span>${rem.toFixed(1)}m restantes</span></div>
      <div class="rows">
        <div class="row"><span>Envío</span><b>${v.job?.id || '—'}</b></div>
        <div class="row"><span>Cliente</span><b>${v.customer}</b></div>
        <div class="row"><span>Origen</span><b class="link" id="link-from">${fromB}</b></div>
        <div class="row"><span>Destino</span><b class="link" id="link-to">${toB}</b></div>
        <div class="row"><span>Carga</span><b>${typeof v.job?.qty === 'number' && v.job.qty > 1000 ? v.job.qty.toLocaleString() : v.job?.qty} ${v.flow.unit}</b></div>
        <div class="row"><span>Conductor</span><b>${v.driver}</b></div>
      </div>
    `;
    document.getElementById('btn-close-v')?.addEventListener('click', () => selectEntity(null, null));
    document.getElementById('btn-focus-v')?.addEventListener('click', () => selectEntity('vehicle', id, true));
    document.getElementById('link-from')?.addEventListener('click', () => selectEntity('district', v.job?.from));
    document.getElementById('link-to')?.addEventListener('click', () => selectEntity('district', v.job?.to));
  } else if (kind === 'drone') {
    const d = data;
    const st = STATUS[d.status] || STATUS.flying;
    const targetB = DISTRICTS.find(x => x.id === d.target)?.name || 'Central Copilot';
    detailEl.innerHTML = `
      <div class="d-head">
        <div class="d-ico" style="background:#9B5CD6;color:#9B5CD6">🤖</div>
        <div>
          <span class="d-kicker" style="color:#9B5CD6">Agente Autónomo Copilot</span>
          <div class="d-title">${d.id}</div>
          <div class="d-sub">Asistente generativo transversal</div>
        </div>
        <div class="d-actions">
          <button class="icon-btn primary" title="Enfocar" id="btn-focus-d">🎯</button>
          <button class="icon-btn" title="Cerrar" id="btn-close-d">✕</button>
        </div>
      </div>
      <div class="d-status">
        <span class="pill ${st.tone}">● ${st.label}</span>
        <span class="pill violet">${d.done} tareas completadas</span>
      </div>
      <p class="d-desc"><b>Misión actual:</b> ${d.task || 'En espera en helipuerto de la torre Copilot'}</p>
      <div class="rows">
        <div class="row"><span>Destino / Asistencia</span><b>${targetB}</b></div>
        <div class="row"><span>Tipo de Agente</span><b>Copilot Studio / M365</b></div>
        <div class="row"><span>Plano de IA</span><b>Transversal</b></div>
      </div>
    `;
    document.getElementById('btn-close-d')?.addEventListener('click', () => selectEntity(null, null));
    document.getElementById('btn-focus-d')?.addEventListener('click', () => selectEntity('vehicle', id, true));
  } else if (kind === 'patrol') {
    const p = data;
    detailEl.innerHTML = `
      <div class="d-head">
        <div class="d-ico" style="background:#2FA05A;color:#2FA05A">🛡️</div>
        <div>
          <span class="d-kicker" style="color:#2FA05A">Seguridad Perimetral</span>
          <div class="d-title">${p.id}</div>
          <div class="d-sub">${p.driver} · Defender XDR</div>
        </div>
        <div class="d-actions">
          <button class="icon-btn primary" title="Enfocar" id="btn-focus-p">🎯</button>
          <button class="icon-btn" title="Cerrar" id="btn-close-p">✕</button>
        </div>
      </div>
      <div class="d-status">
        <span class="pill green">● Patrullando</span>
        <span class="pill blue">Zero Trust</span>
      </div>
      <p class="d-desc">Inspección continua de tráfico, endpoints corporativos e identidades en tránsito entre distritos.</p>
      <div class="rows">
        <div class="row"><span>Paquetes analizados</span><b>${Math.floor(p.scanned || 1200)} K</b></div>
        <div class="row"><span>Protección</span><b>Endpoints, Identity, Cloud Apps</b></div>
        <div class="row"><span>Correlación</span><b>Sentinel SIEM en vivo</b></div>
      </div>
    `;
    document.getElementById('btn-close-p')?.addEventListener('click', () => selectEntity(null, null));
    document.getElementById('btn-focus-p')?.addEventListener('click', () => selectEntity('vehicle', id, true));
  }
}

function renderTracker() {
  const v = state.selected?.kind === 'truck' ? state.selected.data : null;
  if (!v || !v.job) {
    trackerEl.style.display = 'none';
    return;
  }
  trackerEl.style.display = 'block';
  const steps = [
    { label: 'Orden creada', done: true },
    { label: 'Cargando', done: ['transit', 'docking', 'unloading'].includes(v.status) || (v.status === 'loading' && v.dwell < 2) },
    { label: 'En tránsito', done: ['transit', 'docking', 'unloading'].includes(v.status), current: v.status === 'transit' },
    { label: 'Acoplado', done: ['docking', 'unloading'].includes(v.status), current: v.status === 'docking' },
    { label: 'Entregado', done: v.status === 'unloading' && v.dwell < 1.5 },
  ];
  const toB = DISTRICTS.find(x => x.id === v.job.to)?.short || v.job.to;

  trackerEl.innerHTML = `
    <div class="tr-head">
      <b><span>📦</span> Seguimiento de Envío · ${v.id} (${v.flow.label})</b>
      <span>Cliente: <b>${v.customer}</b> · Destino: <b>${toB}</b></span>
    </div>
    <div class="tr-body">
      <div class="steps">
        ${steps.map((st, i) => `
          <div class="step ${st.done ? 'done' : ''} ${st.current ? 'current' : ''}">
            <div class="ball">${st.done ? '✓' : i + 1}</div>
            <b>${st.label}</b>
          </div>
        `).join('')}
      </div>
      <div class="tr-card" id="tr-card-btn">
        <small>${v.job.id}</small>
        <b>${v.job.qty > 1000 ? v.job.qty.toLocaleString() : v.job.qty} ${v.flow.unit}</b>
        <small style="color:var(--blue)">Hacer clic para enfocar ➔</small>
      </div>
    </div>
  `;
  document.getElementById('tr-card-btn')?.addEventListener('click', () => selectEntity('vehicle', v.id, true));
}

// ---------------------------------------------------------------------------
// 9. Lista de Flota / Distritos / Agentes y Minimapa
// ---------------------------------------------------------------------------
const fleetListEl = document.getElementById('fleet-list');
const fleetTabsEl = document.getElementById('fleet-tabs');

fleetTabsEl.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    fleetTabsEl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tab = btn.dataset.tab;
    renderFleetList();
  });
});

function renderFleetList() {
  document.getElementById('t-districts').textContent = DISTRICTS.length;
  document.getElementById('t-trucks').textContent = sim.vehicles.length;
  document.getElementById('t-agents').textContent = sim.drones.length;
  document.getElementById('t-customers').textContent = sim.customers.people.filter(p => !p.host).length;

  if (state.tab === 'districts') {
    fleetListEl.innerHTML = DISTRICTS.map(d => {
      const p = PILLARS[d.pillar];
      const inb = sim.customers.visitors(d.id).length;
      const isSel = state.selected?.kind === 'district' && state.selected.id === d.id;
      return `
        <div class="f-row ${isSel ? 'sel' : ''}" data-kind="district" data-id="${d.id}">
          <div class="id"><b>${d.short}</b><small>${d.model}</small></div>
          <div class="where"><i style="background:${p.color}"></i><span>${p.name}</span></div>
          <div class="status"><span class="pill ${inb > 0 ? 'amber' : 'gray'}">${inb} clientes</span></div>
          <div class="meta">${d.billing.split(' ')[0]}</div>
          <div class="chev">›</div>
        </div>
      `;
    }).join('');
  } else if (state.tab === 'customers') {
    fleetListEl.innerHTML = sim.customers.people.filter(p => !p.host && (!layers[state.filter] || layers[state.filter].includes(p.district))).map(p => `
      <button class="f-row customer-row ${state.selected?.id === p.id ? 'sel' : ''}" data-kind="customer" data-id="${p.id}">
        <div class="id"><b>${p.customer}</b><small>${p.model}</small></div>
        <div class="where"><i style="background:${p.flow.color}"></i><span>${world.buildings.get(p.district).def.short}</span></div>
        <div class="status"><span class="pill ${p.status === 'using' ? 'green' : 'blue'}">${CUSTOMER_STATES[p.status]}</span></div>
        <div class="chev">›</div>
      </button>`).join('');
  } else if (state.tab === 'trucks') {
    fleetListEl.innerHTML = sim.vehicles.map(v => {
      const isSel = state.selected?.id === v.id;
      const st = STATUS[v.status] || STATUS.transit;
      const toB = v.kind === 'patrol' ? 'Ronda Zero Trust' : DISTRICTS.find(x => x.id === v.job?.to)?.short || v.job?.to;
      return `
        <div class="f-row ${isSel ? 'sel' : ''}" data-kind="${v.kind}" data-id="${v.id}">
          <div class="id"><b>${v.id}</b><small>${v.driver.split(' ')[0]}</small></div>
          <div class="where"><i style="background:${v.flow.color}"></i><span>➔ ${toB}</span></div>
          <div class="status"><span class="pill ${st.tone}">${st.label}</span></div>
          <div class="meta">${(v.speed * 3.6).toFixed(0)} km/h</div>
          <div class="chev">›</div>
        </div>
      `;
    }).join('');
  } else if (state.tab === 'agents') {
    fleetListEl.innerHTML = sim.drones.map(d => {
      const isSel = state.selected?.id === d.id;
      const st = STATUS[d.status] || STATUS.flying;
      const targetB = DISTRICTS.find(x => x.id === d.target)?.short || 'Copilot Base';
      return `
        <div class="f-row ${isSel ? 'sel' : ''}" data-kind="drone" data-id="${d.id}">
          <div class="id"><b>${d.id}</b><small>Copilot</small></div>
          <div class="where"><i style="background:#9B5CD6"></i><span>➔ ${targetB}</span></div>
          <div class="status"><span class="pill ${st.tone}">${st.label}</span></div>
          <div class="meta">${d.done} hechos</div>
          <div class="chev">›</div>
        </div>
      `;
    }).join('');
  }

  fleetListEl.querySelectorAll('.f-row').forEach(row => {
    row.addEventListener('click', () => {
      selectEntity(row.dataset.kind, row.dataset.id, true);
    });
  });
}

// Minimapa 2D en Canvas
const minimapCanvas = document.getElementById('minimap');
const mmCtx = minimapCanvas.getContext('2d');

function updateMinimap() {
  const cw = minimapCanvas.width;
  const ch = minimapCanvas.height;
  if (!mmCtx) return;
  mmCtx.clearRect(0, 0, cw, ch);

  // Mapeo coordenadas del mundo [-78..78, -52..54] a canvas [0..cw, 0..ch]
  const mapX = x => ((x - -158) / (158 - -158)) * (cw - 16) + 8;
  const mapZ = z => ((z - -130) / (130 - -130)) * (ch - 16) + 8;

  // Fondo del baseplate
  mmCtx.fillStyle = '#CBD3DE';
  mmCtx.beginPath();
  mmCtx.roundRect(4, 4, cw - 8, ch - 8, 8);
  mmCtx.fill();

  mmCtx.fillStyle = '#238DBC';
  mmCtx.beginPath(); mmCtx.ellipse(mapX(0),mapZ(0),cw*0.105,ch*0.09,0,0,Math.PI*2); mmCtx.fill();
  mmCtx.strokeStyle = '#5B6573'; mmCtx.lineWidth = 4;
  mmCtx.beginPath(); BOULEVARD.forEach(([x,z],i) => i ? mmCtx.lineTo(mapX(x),mapZ(z)) : mmCtx.moveTo(mapX(x),mapZ(z))); mmCtx.closePath(); mmCtx.stroke();

  // Edificios
  DISTRICTS.forEach(d => {
    const bx = mapX(d.pos[0]);
    const bz = mapZ(d.pos[1]);
    const p = PILLARS[d.pillar];
    mmCtx.fillStyle = p.color;
    mmCtx.beginPath();
    mmCtx.roundRect(bx - 7, bz - 5, 14, 10, 2);
    mmCtx.fill();
    if (state.selected?.kind === 'district' && state.selected.id === d.id) {
      mmCtx.strokeStyle = '#2563EB';
      mmCtx.lineWidth = 2.5;
      mmCtx.stroke();
    }
  });

  // Vehículos
  sim.vehicles.forEach(v => {
    const px = mapX(v.group.position.x);
    const pz = mapZ(v.group.position.z);
    mmCtx.fillStyle = v.kind === 'patrol' ? '#2FA05A' : v.flow.color;
    mmCtx.beginPath();
    mmCtx.arc(px, pz, v.kind === 'patrol' ? 2.5 : 3.2, 0, Math.PI * 2);
    mmCtx.fill();
    if (state.selected?.id === v.id) {
      mmCtx.strokeStyle = '#2563EB';
      mmCtx.lineWidth = 2;
      mmCtx.stroke();
    }
  });

  // Customers are the people using each island, not vehicle traffic.
  sim.customers.people.forEach(p => {
    if (p.host) return;
    mmCtx.fillStyle = p.status === 'using' ? '#FFFFFF' : '#FFD22E';
    mmCtx.fillRect(mapX(p.group.position.x) - 1.2, mapZ(p.group.position.z) - 1.2, 2.4, 2.4);
  });

  // Posición y mirada de la cámara
  const camX = mapX(camera.position.x);
  const camZ = mapZ(camera.position.z);
  const tgtX = mapX(controls.target.x);
  const tgtZ = mapZ(controls.target.z);
  mmCtx.strokeStyle = 'rgba(37,99,235,0.7)';
  mmCtx.lineWidth = 1.5;
  mmCtx.beginPath();
  mmCtx.moveTo(camX, camZ);
  mmCtx.lineTo(tgtX, tgtZ);
  mmCtx.stroke();
  mmCtx.fillStyle = '#2563EB';
  mmCtx.beginPath();
  mmCtx.arc(tgtX, tgtZ, 3.5, 0, Math.PI * 2);
  mmCtx.fill();
}

minimapCanvas.addEventListener('click', (e) => {
  const rect = minimapCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const worldX = -158 + THREE.MathUtils.clamp((x / rect.width * minimapCanvas.width - 8) / (minimapCanvas.width - 16), 0, 1) * (158 - -158);
  const worldZ = -130 + THREE.MathUtils.clamp((y / rect.height * minimapCanvas.height - 8) / (minimapCanvas.height - 16), 0, 1) * (130 - -130);
  const targetLook = new THREE.Vector3(worldX, 4, worldZ);
  const targetPos = targetLook.clone().add(new THREE.Vector3(60, 65, 75));
  flyCameraTo(targetPos, targetLook, 0.8);
});

// ---------------------------------------------------------------------------
// 10. Drawer de Modos Temáticos (Contenido Estratégico del Documento)
// ---------------------------------------------------------------------------
const modesNav = document.getElementById('modes');
const drawer = document.getElementById('drawer');
const drawerTitle = document.getElementById('drawer-title');
const drawerKicker = document.getElementById('drawer-kicker');
const drawerBody = document.getElementById('drawer-body');
const drawerClose = document.getElementById('drawer-close');

drawerClose.addEventListener('click', () => setMode('live'));

modesNav.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
  });
});

export function setMode(mode) {
  if (mode !== 'live') { document.body.classList.remove('fleet-open'); document.getElementById('fleet-toggle').setAttribute('aria-expanded', 'false'); document.getElementById('fleet-toggle').textContent = 'Explorar portafolio'; }
  drawer.inert = mode === 'live';
  state.mode = mode;
  document.body.classList.toggle('drawer-open', mode !== 'live');
  if (mode !== 'live' && window.matchMedia('(max-width: 900px)').matches) selectEntity(null, null);
  modesNav.querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  if (mode === 'live') {
    drawer.classList.remove('open');
    resetPillarHighlight();
    return;
  }

  drawer.classList.add('open');
  renderDrawerContent(mode);
}

let highlightedPillars = [];
const layers = {
  security: ['entra', 'defender', 'sentinel', 'purview'],
  data: ['fabric', 'azuredata'],
  licensing: ['ea', 'mcae', 'csp'],
};
const materialDefaults = new WeakMap();
function tint(material, lit) {
  if (!materialDefaults.has(material)) materialDefaults.set(material, {
    color: material.color?.clone(), emissive: material.emissive?.clone(),
  });
  const base = materialDefaults.get(material);
  if (base.color) material.color.copy(base.color).multiplyScalar(lit ? 1 : 0.22);
  if (base.emissive) material.emissive.copy(base.emissive).multiplyScalar(lit ? 1 : 0.08);
}
function applyFilters() {
  const allowed = layers[state.filter];
  sim.customers.setFilter(person => (!allowed || allowed.includes(person.district)) &&
    (!highlightedPillars.length || highlightedPillars.includes(world.buildings.get(person.district).def.pillar)));
  world.buildings.forEach((b, id) => {
    const lit = (!allowed || allowed.includes(id)) &&
      (!highlightedPillars.length || highlightedPillars.includes(b.def.pillar));
    b.materials.forEach(m => tint(m, lit));
    districtLabels.get(id).el.classList.toggle('dim', !lit);
  });
  sim.all().forEach(v => {
    const lit = !allowed || (state.filter === 'security' && v.kind === 'patrol') ||
      (state.filter === 'data' && v.flow.type === 'data') ||
      (state.filter === 'licensing' && v.flow.type === 'license');
    v.group.traverse(o => { if (o.isMesh) tint(o.material, lit); });
  });
}
function highlightPillars(allowedPillars = []) { highlightedPillars = allowedPillars; applyFilters(); }
function resetPillarHighlight() { highlightPillars([]); }
document.getElementById('layer-filter').addEventListener('change', e => {
  state.filter = e.target.value; applyFilters();
});
const audioButton = document.getElementById('audio-toggle');
audioButton.addEventListener('click', async () => {
  audioButton.disabled = true;
  const enabled = await audio.toggle();
  audioButton.textContent = enabled ? 'Sonido: sí' : 'Sonido: no';
  audioButton.setAttribute('aria-pressed', String(enabled));
  audioButton.disabled = false;
  if (enabled) audio.click();
});
const money = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
function proposalInputs() {
  return `<div class="field"><label for="proposal-client">Cliente</label><input id="proposal-client" maxlength="100" placeholder="Nombre de la empresa" /></div>
    <button class="btn" id="export-proposal">Imprimir resumen / Guardar PDF</button>`;
}
function exportSummary(title, rows) {
  printProposal({ client: document.getElementById('proposal-client').value || document.getElementById('search').value, title, rows });
}

function renderDrawerContent(mode) {
  switch (mode) {
    case 'arch':
      drawerKicker.textContent = '1. Mapa de Arquitectura';
      drawerTitle.textContent = 'Pilares del Portafolio Microsoft Cloud';
      drawerBody.innerHTML = `
        <p>Microsoft opera uno de los ecosistemas más integrados del mercado: desde datacenters y silicio hasta herramientas de usuario final, gobernadas por identidad, seguridad e IA transversal.</p>
        <div class="stack">
          <div class="lego layer" style="--c:#9B5CD6" data-p="ai">
            <b>Capa Transversal de Inteligencia Artificial</b>
            <small>Copilot Studio · Microsoft 365 Copilot · Security Copilot</small>
            <div class="sub-bricks">
              <span data-bid="copilotStudio">Copilot Studio</span>
              <span data-bid="copilot">M365 Copilot</span>
              <span data-bid="secCopilot">Security Copilot</span>
            </div>
          </div>
          <div class="layer-split">
            <div class="lego layer" style="--c:#F28C28" data-p="apps">
              <b>Aplicaciones (SaaS)</b>
              <small>M365 · Dynamics 365 · Power Platform</small>
              <div class="sub-bricks">
                <span data-bid="m365">M365</span>
                <span data-bid="dynamics">Dynamics</span>
                <span data-bid="power">Power</span>
              </div>
            </div>
            <div class="lego layer" style="--c:#1E7BD8" data-p="data">
              <b>Infraestructura y Datos</b>
              <small>Azure IaaS/PaaS · Microsoft Fabric</small>
              <div class="sub-bricks">
                <span data-bid="compute">Azure IaaS</span>
                <span data-bid="azuredata">PaaS & AI</span>
                <span data-bid="fabric">Fabric / OneLake</span>
              </div>
            </div>
          </div>
          <div class="lego layer" style="--c:#2FA05A" data-p="security">
            <b>Plano de Seguridad, Identidad y Gobierno</b>
            <small>Entra (IAM) · Defender (XDR) · Sentinel (SIEM) · Purview (DLP)</small>
            <div class="sub-bricks">
              <span data-bid="entra">Entra ID</span>
              <span data-bid="defender">Defender</span>
              <span data-bid="sentinel">Sentinel</span>
              <span data-bid="purview">Purview</span>
            </div>
          </div>
        </div>
        <div class="tip" style="margin-top:14px;">Haz clic en cualquier capa o ladrillo para enfocar el distrito correspondiente en la ciudad 3D.</div>
      `;
      drawerBody.querySelectorAll('.layer').forEach(l => {
        l.addEventListener('click', (e) => {
          if (e.target.dataset.bid) return;
          highlightPillars([l.dataset.p]);
        });
      });
      drawerBody.querySelectorAll('[data-bid]').forEach(s => {
        s.addEventListener('click', () => selectEntity('district', s.dataset.bid, true));
      });
      break;

    case 'resp':
      drawerKicker.textContent = '2. Taxonomía XaaS';
      drawerTitle.textContent = 'Modelo de Responsabilidad Compartida';
      drawerBody.innerHTML = `
        <p>En el ecosistema cloud, la seguridad y operación se rigen por el principio de Responsabilidad Compartida entre Microsoft y la Empresa.</p>
        <div class="seg" id="resp-seg">
          <button class="active" data-m="saas">SaaS</button>
          <button data-m="paas">PaaS</button>
          <button data-m="iaas">IaaS</button>
          <button data-m="onprem">On-Prem</button>
        </div>
        <div class="legend">
          <span><i style="background:#2563EB"></i> Empresa</span>
          <span><i style="background:#00A4EF"></i> Microsoft</span>
          <span><i style="background:#F2C200"></i> Compartido</span>
        </div>
        <div class="stack resp-stack" id="resp-stack"></div>
      `;
      const updateRespStack = (mKey) => {
        const mod = RESPONSIBILITY.models[mKey];
        const stackEl = document.getElementById('resp-stack');
        stackEl.innerHTML = RESPONSIBILITY.layers.map((layer, i) => {
          const who = mod.who[i];
          const bg = who === 'E' ? '#2563EB' : who === 'M' ? '#0078D4' : '#F2C200';
          const whoLabel = who === 'E' ? 'Responsabilidad: Empresa' : who === 'M' ? 'Gestionado por Microsoft' : 'Modelo Compartido';
          return `
            <div class="lego" style="--c:${bg}">
              <span>${layer}</span>
              <small>${whoLabel}</small>
            </div>
          `;
        }).join('');
        if (mod.buildings.length > 0) {
          selectEntity('district', mod.buildings[0], true);
        }
      };
      updateRespStack('saas');
      document.getElementById('resp-seg')?.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
          document.getElementById('resp-seg').querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
          b.classList.add('active');
          updateRespStack(b.dataset.m);
        });
      });
      break;

    case 'billing':
      drawerKicker.textContent = '2.1 Modelos de Consumo';
      drawerTitle.textContent = 'Métricas y Facturación Cloud';
      drawerBody.innerHTML = `
        <p>Microsoft estructura el cobro empresarial en tres esquemas según el nivel de abstracción del servicio:</p>
        ${BILLING.map(b => `
          <div class="card" data-bgroup="${b.id}">
            <h4><span style="color:${b.color}">● ${b.name}</span><span class="pill gray">${b.scope.split(' ')[0]}</span></h4>
            <div style="font-size:12px;color:var(--ink-2);margin-top:4px;"><b>Ámbito:</b> ${b.scope}</div>
            <div style="font-size:12px;color:var(--ink-3);margin-top:2px;"><b>Métricas:</b> ${b.metrics}</div>
            <div class="chips" style="margin-top:6px;">
              ${b.buildings.map(bid => `<span class="chip" data-bid="${bid}">${DISTRICTS.find(x => x.id === bid)?.short || bid}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      `;
      drawerBody.querySelectorAll('[data-bid]').forEach(c => {
        c.addEventListener('click', () => selectEntity('district', c.dataset.bid, true));
      });
      break;

    case 'contracts':
      drawerKicker.textContent = '3. Marcos Contractuales';
      drawerTitle.textContent = 'Rutas de Adquisición B2B';
      drawerBody.innerHTML = `
        <p>Microsoft canaliza la compra corporativa a través de tres vías contractuales principales:</p>
        ${CONTRACTS.map(c => `
          <div class="card" data-bid="${c.id}">
            <h4><span style="color:${c.color}">${c.name} · ${c.tag}</span><span class="pill" style="background:${c.color}22;color:${c.color}">Ver distrito</span></h4>
            <ul>${c.points.map(p => `<li>${p}</li>`).join('')}</ul>
          </div>
        `).join('')}
        <div class="card" style="margin-top:14px;background:#FFFDF5;border-color:#F5E6B3">
          <h4><span style="color:#D97706">Simulador True-Up Anual (EA)</span></h4>
          <p style="font-size:12px;">Durante los primeros 11 meses despliegas licencias sin OC inmediata. En el mes 12 se liquida sin penalización:</p>
          <div class="months">
            ${Array.from({ length: 12 }, (_, i) => `<div class="${i < 11 ? 'on' : 'tu'}">M${i + 1}</div>`).join('')}
          </div>
          <div style="font-size:11px;color:var(--ink-3);">Meses 1–11: Despliegue flexible libre · Mes 12: Conciliación formal True-Up</div>
        </div>
      `;
      drawerBody.querySelectorAll('[data-bid]').forEach(cd => {
        cd.addEventListener('click', () => selectEntity('district', cd.dataset.bid, true));
      });
      break;

    case 'optimize':
      drawerKicker.textContent = '3.4 Reducción de Costos';
      drawerTitle.textContent = 'MACC, Reservas y Beneficio Híbrido';
      drawerBody.innerHTML = `
        <div class="tip">La combinación adecuada de <b>MACC + Instancias Reservadas (RIs) + Azure Hybrid Benefit (AHB)</b> puede reducir la factura bruta entre un <b>40% y un 70%</b>.</div>
        <div class="field">
          <label>Compromiso MACC (Gasto mínimo 3 años): <span id="lbl-macc-val">$5,000,000 USD</span></label>
          <input type="range" id="rng-macc" min="1000000" max="20000000" step="500000" value="5000000" />
        </div>
        <div class="field">
          <label>Instancias Reservadas (RIs / Savings Plans): <span id="lbl-ri">3 años (hasta -72%)</span></label>
          <select id="sel-ri">
            <option value="0.72">3 Años Reservadas (-72% cómputo)</option>
            <option value="0.45">1 Año Reservadas (-45% cómputo)</option>
            <option value="0">Pay-As-You-Go (Sin reserva)</option>
          </select>
        </div>
        <div class="field">
          <label style="cursor:pointer;"><input type="checkbox" id="chk-ahb" checked /> Aplicar Azure Hybrid Benefit (AHB con Software Assurance activo)</label>
        </div>
        <div class="field"><label for="opt-gross">Costo bruto mensual (USD)</label><input id="opt-gross" type="number" min="0" max="1000000000" value="380000" /></div>
        ${proposalInputs()}
        <div class="result">
          <small>Ahorro Estimado Proyectado:</small>
          <div class="big" id="res-saving-pct">~58% ahorro</div>
          <div class="grid2">
            <div><small>Costo Bruto</small><b id="res-gross">$380,000/m</b></div>
            <div><small>Costo Optimizado</small><b id="res-net" style="color:#4ade80">$159,600/m</b></div>
          </div>
        </div>
        <div class="tip"><b>Efecto Palanca Marketplace:</b> Las compras de Datadog, Snowflake, Palo Alto en Azure Marketplace descuentan <b>1:1</b> de tu saldo MACC.</div>
      `;
      const calcOpt = () => {
        document.getElementById('lbl-ri').textContent = document.getElementById('sel-ri').selectedOptions[0].textContent;
        const ri = parseFloat(document.getElementById('sel-ri').value);
        const ahb = document.getElementById('chk-ahb').checked ? 0.18 : 0;
        const { discount: totalDiscount, gross, net } = optimization({ gross: Math.max(0, Number(document.getElementById('opt-gross').value) || 0), ri, ahb: ahb > 0, macc: Number(document.getElementById('rng-macc').value) });
        document.getElementById('res-saving-pct').textContent = `~${(totalDiscount * 100).toFixed(0)}% ahorro neto`;
        document.getElementById('res-gross').textContent = `$${gross.toLocaleString()}/mes`;
        document.getElementById('res-net').textContent = `$${Math.round(net).toLocaleString()}/mes`;
      };
      document.getElementById('sel-ri')?.addEventListener('change', calcOpt);
      document.getElementById('chk-ahb')?.addEventListener('change', calcOpt);
      document.getElementById('rng-macc')?.addEventListener('input', (e) => {
        document.getElementById('lbl-macc-val').textContent = `$${parseInt(e.target.value).toLocaleString()} USD`;
      });
      document.getElementById('opt-gross').addEventListener('input', calcOpt);
      document.getElementById('export-proposal').addEventListener('click', () => {
        const result = optimization({ gross: Math.max(0, Number(document.getElementById('opt-gross').value) || 0),
          ri: Number(document.getElementById('sel-ri').value), ahb: document.getElementById('chk-ahb').checked,
          macc: Number(document.getElementById('rng-macc').value) });
        exportSummary('Optimización de Azure', [
          ['Costo bruto mensual', money(result.gross)], ['Costo optimizado mensual', money(result.net)],
          ['Ahorro mensual', money(result.saving)], ['Ahorro anual', money(result.saving * 12)],
          ['Reserva', document.getElementById('sel-ri').selectedOptions[0].textContent],
          ['Beneficio híbrido', document.getElementById('chk-ahb').checked ? 'Sí (requiere elegibilidad)' : 'No'],
          ['Compromiso MACC a 3 años', money(result.macc)],
          ['Supuestos', '70% del gasto elegible para reserva + 18 puntos de AHB; descuento máximo ilustrativo del 75%'],
        ]);
      });
      calcOpt();
      if (!window.matchMedia('(max-width: 900px)').matches) selectEntity('district', 'macc', true);
      break;

    case 'bundle':
      drawerKicker.textContent = '4. Consolidación Estratégica';
      drawerTitle.textContent = 'The Bundling Play: M365 E3 vs. E5';
      drawerBody.innerHTML = `
        <p>Microsoft consolida múltiples contratos multivendor fragmentados en un único paquete unificado con reducción neta de TCO.</p>
        <div class="field"><label for="bundle-seats">Puestos</label><input id="bundle-seats" type="number" min="1" max="1000000" value="500" /></div>
        <div class="field"><label for="bundle-current">Pila actual por puesto / mes (USD)</label><input id="bundle-current" type="number" min="0" step="0.01" value="61.5" /></div>
        <div class="field"><label for="bundle-e5">E5 por puesto / mes (USD)</label><input id="bundle-e5" type="number" min="0" step="0.01" value="57" /></div>
        <p>Valores ilustrativos editables; usa los precios de tu propuesta.</p>
        ${proposalInputs()}
        <div class="bundle-wrap">
          <div class="bundle-col">
            <div class="lego" style="--c:#1E7BD8;height:38px;"><span>M365 E3 (Base)</span><b>$36</b></div>
            <div class="lego" style="--c:#2E5BFF;height:24px;"><span>Okta</span><b>$6</b></div>
            <div class="lego" style="--c:#E0453A;height:28px;"><span>CrowdStrike</span><b>$8</b></div>
            <div class="lego" style="--c:#2D8CFF;height:22px;"><span>Zoom/Webex</span><b>$4</b></div>
            <div class="lego" style="--c:#16A085;height:20px;"><span>Proofpoint</span><b>$3.5</b></div>
            <div class="lego" style="--c:#7F8C8D;height:22px;"><span>Zscaler</span><b>$4</b></div>
          </div>
          <div class="bundle-arrow">➔</div>
          <div class="bundle-col" style="justify-content:flex-end;">
            <div class="lego" style="--c:#1E7BD8;height:95px;background:linear-gradient(180deg,#2563EB,#1E3A8A);">
              <div><b>M365 E5</b><small style="display:block;opacity:.8;">Productividad + Entra P2 + Defender + Teams Phone + Purview</small></div>
              <b>$57</b>
            </div>
          </div>
        </div>
        <div class="result" style="margin-top:14px;">
          <small>Ahorro mensual total para los puestos indicados:</small>
          <div class="big" id="bundle-result" style="color:#4ade80"></div>
          <div style="font-size:12px;opacity:.85;margin-top:4px;">Ahorro directo en licenciamiento + eliminación de 6 agentes en endpoint y reducción de sobrecarga TI.</div>
        </div>
      `;
      const readBundle = () => bundle({ seats: Math.max(1, Math.floor(Number(document.getElementById('bundle-seats').value) || 1)),
        current: Math.max(0, Number(document.getElementById('bundle-current').value) || 0),
        e5: Math.max(0, Number(document.getElementById('bundle-e5').value) || 0) });
      const calcBundle = () => { document.getElementById('bundle-result').textContent = `${money(readBundle().saving)} ahorro / mes`; };
      ['bundle-seats', 'bundle-current', 'bundle-e5'].forEach(id => document.getElementById(id).addEventListener('input', calcBundle));
      document.getElementById('export-proposal').addEventListener('click', () => {
        const result = readBundle();
        exportSummary('Consolidación M365 E3 + proveedores vs E5', [
          ['Puestos', document.getElementById('bundle-seats').value],
          ['Pila actual por puesto / mes', money(Number(document.getElementById('bundle-current').value))],
          ['E5 por puesto / mes', money(Number(document.getElementById('bundle-e5').value))],
          ['Costo actual mensual', money(result.gross)], ['Costo E5 mensual', money(result.net)],
          ['Ahorro mensual', money(result.saving)], ['Ahorro anual', money(result.saving * 12)],
        ]);
      });
      calcBundle();
      if (!window.matchMedia('(max-width: 900px)').matches) selectEntity('district', 'm365', true);
      break;

    case 'team':
      drawerKicker.textContent = '5. Fuerza de Ventas y Canales';
      drawerTitle.textContent = 'Ecosistema de Cuenta y Partners';
      drawerBody.innerHTML = `
        <p>Estructura matricial especializada coordinada para garantizar la adopción y el consumo real:</p>
        ${ROLES.map(r => `
          <div class="card" data-bid="${r.target}">
            <h4><span>${r.name}</span><span class="pill blue">Ver base</span></h4>
            <p style="font-size:12px;margin:4px 0 0;">${r.text}</p>
          </div>
        `).join('')}
        <div class="tip"><b>Compensación por Consumo:</b> Los CSAs no comisionan por contratos de papel, sino por <b>Azure Consumed Revenue (ACR)</b> en producción.</div>
      `;
      drawerBody.querySelectorAll('[data-bid]').forEach(cd => {
        cd.addEventListener('click', () => selectEntity('district', cd.dataset.bid, true));
      });
      break;

    case 'check':
      drawerKicker.textContent = '6. Negociación Corporativa';
      drawerTitle.textContent = 'Checklist Estratégico de Renovación';
      drawerBody.innerHTML = `
        <p>Ciclo de evaluación crítico antes de firmar o renovar contratos corporativos con Microsoft:</p>
        <div id="check-list">
          ${CHECKLIST.map(c => `
            <div class="check" data-id="${c.id}">
              <input type="checkbox" id="chk-${c.id}" />
              <div style="flex:1;">
                <b>${c.title}</b>
                <p>${c.text}</p>
                <a data-bid="${c.target}">➔ Inspeccionar distrito en 3D</a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      drawerBody.querySelectorAll('.check input').forEach(input => {
        input.addEventListener('change', (e) => {
          e.target.closest('.check').classList.toggle('done', e.target.checked);
        });
      });
      drawerBody.querySelectorAll('[data-bid]').forEach(a => {
        a.addEventListener('click', () => selectEntity('district', a.dataset.bid, true));
      });
      break;
  }
}

// ---------------------------------------------------------------------------
// 11. Búsqueda Rápida y Notificaciones
// ---------------------------------------------------------------------------
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('search-results');

window.addEventListener('keydown', (e) => {
  if (searchInput.getClientRects().length && e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    searchResults.classList.remove('open');
    searchResults.innerHTML = '';
    return;
  }

  const results = [];
  DISTRICTS.forEach(d => {
    if (d.name.toLowerCase().includes(q) || d.short.toLowerCase().includes(q) || d.items.some(it => it.toLowerCase().includes(q))) {
      results.push({ kind: 'district', id: d.id, title: d.name, sub: `${d.model} · ${d.billing}`, color: PILLARS[d.pillar].color });
    }
  });
  sim.all().forEach(v => {
    if (v.id.toLowerCase().includes(q) || v.customer?.toLowerCase().includes(q) || v.role?.toLowerCase().includes(q) || v.driver?.toLowerCase().includes(q)) {
      results.push({ kind: v.kind, id: v.id, title: `${v.id} (${v.flow.label})`, sub: `${v.driver || ''} · ${v.customer || ''}`, color: v.flow.color });
    }
  });

  if (results.length === 0) {
    searchResults.innerHTML = `<div style="padding:10px;color:var(--ink-3);text-align:center;">No hay resultados para "${escapeHTML(q)}"</div>`;
  } else {
    searchResults.innerHTML = results.slice(0, 8).map(r => `
      <div class="sr-item" data-kind="${r.kind}" data-id="${r.id}">
        <span class="sr-dot" style="background:${r.color}"></span>
        <div><b>${r.title}</b><small>${r.sub}</small></div>
      </div>
    `).join('');
    searchResults.querySelectorAll('.sr-item').forEach(item => {
      item.addEventListener('click', () => {
        selectEntity(item.dataset.kind, item.dataset.id, true);
        searchResults.classList.remove('open');
        searchInput.value = '';
      });
    });
  }
  searchResults.classList.add('open');
});

document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.classList.remove('open');
  }
});

// News UI is hidden; do not allocate notification cards or toast timers.
function showToast() {}

// ---------------------------------------------------------------------------
// 12. Controles de Cámara (HUD Lateral)
// ---------------------------------------------------------------------------
function shiftViewHeight(direction){
  if(walk.active)return;
  navigation.cancel();state.camTarget=null;
  const step=direction*4;
  const delta=Math.max(1.2-camera.position.y,Math.min(200-camera.position.y,step));
  camera.position.y+=delta;controls.target.y+=delta;
  controls.update();
}
document.getElementById('cam-up').addEventListener('click',()=>shiftViewHeight(1));
document.getElementById('cam-down').addEventListener('click',()=>shiftViewHeight(-1));
document.getElementById('cam-zin')?.addEventListener('click', () => {
  const dir = controls.target.clone().sub(camera.position).normalize();
  camera.position.addScaledVector(dir, 18);
});
document.getElementById('cam-zout')?.addEventListener('click', () => {
  const dir = controls.target.clone().sub(camera.position).normalize();
  camera.position.addScaledVector(dir, -18);
});
document.getElementById('cam-rl')?.addEventListener('click', () => {
  rotateCameraAroundTarget(Math.PI / 6);
});
document.getElementById('cam-rr')?.addEventListener('click', () => {
  rotateCameraAroundTarget(-Math.PI / 6);
});
document.getElementById('cam-home')?.addEventListener('click', () => {
  selectEntity(null, null);
  flyCameraTo(DEFAULT_CAM_POS, DEFAULT_TARGET, 1.0);
});
document.getElementById('cam-night')?.addEventListener('click', () => {
  toggleDayNight();
});

function rotateCameraAroundTarget(angle) {
  const offset = camera.position.clone().sub(controls.target);
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  flyCameraTo(controls.target.clone().add(offset), controls.target, 0.5);
}

function toggleDayNight() {
  state.isNight = !state.isNight;
  nightLighting.set(state.isNight);
  document.getElementById('cam-night').setAttribute('aria-pressed',String(state.isNight));
  document.body.classList.toggle('night', state.isNight);
  const nightAction=state.isNight?'Activar modo diurno':'Activar modo nocturno';
  document.getElementById('cam-night').setAttribute('aria-label',nightAction);
  document.getElementById('cam-night').title=nightAction;

  if (state.isNight) {
    scene.background.set('#0E1626');
    scene.fog.color.set('#0E1626');
    dirLight.color.set('#6366f1');
    dirLight.intensity = 0.65;
    hemiLight.color.set('#8498C1');
    hemiLight.groundColor.set('#0f172a');
    world.lampMaterial.emissiveIntensity = 2.0;
  } else {
    scene.background.set('#DCEFFF');
    scene.fog.color.set('#DCEFFF');
    dirLight.color.set('#ffffff');
    dirLight.intensity = 1.35;
    hemiLight.color.set('#ffffff');
    hemiLight.groundColor.set('#cbd5e1');
    world.lampMaterial.emissiveIntensity = 0.6;
  }
}

// ---------------------------------------------------------------------------
// 13. KPIs y Reloj
// ---------------------------------------------------------------------------
const clockEl = document.getElementById('clock');
const kAcr = document.getElementById('k-acr');
const kAcrD = document.getElementById('k-acr-d');
const kSeats = document.getElementById('k-seats');
const kMacc = document.getElementById('k-macc');
const kMaccD = document.getElementById('k-macc-d');
const kThreats = document.getElementById('k-threats');
const kCopilot = document.getElementById('k-copilot');

function updateKPIs() {
  state.simTime = new Date(state.simTime.getTime() + 24000);
  clockEl.textContent = state.simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  kAcr.textContent = `$${Math.round(sim.kpi.acr).toLocaleString()} USD`;
  kAcrD.textContent = `+${Math.round(sim.kpi.acrDelta).toLocaleString()}`;
  kSeats.textContent = sim.kpi.seats.toLocaleString();
  const maccPct = (sim.kpi.maccUsed / sim.kpi.maccCommit) * 100;
  kMacc.textContent = `${maccPct.toFixed(1)}%`;
  kMaccD.textContent = `$${(sim.kpi.maccUsed / 1e6).toFixed(2)}M`;
  kThreats.textContent = sim.kpi.threats.toLocaleString();
  kCopilot.textContent = sim.kpi.copilot.toLocaleString();

  // Actualiza badges en etiquetas de edificios
  DISTRICTS.forEach(d => {
    const badge = document.getElementById(`badge-${d.id}`);
    if (badge) {
      const count = sim.customers.visitors(d.id).filter(p => p.status === 'using' || p.status === 'entering').length;
      badge.textContent = count ? `${count} clientes` : '';
    }
  });
}

// ---------------------------------------------------------------------------
// 14. Bucle Principal de Renderizado
// ---------------------------------------------------------------------------
let disposed = false;
const clock = new THREE.Clock();
let mmTimer = 0;
let kpiTimer = 0;
const tempV = new THREE.Vector3();

function animate() {
  if (disposed) return;
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (document.body.classList.contains('intro-active')) return;
  const t = clock.elapsedTime;

  // Actualizar cámara si está en transición
  updateCameraAnimation(dt);
  navigation.update(dt);
  if(!walk.active){controls.update();if(camera.position.y<1.2){camera.position.y=1.2;camera.lookAt(controls.target);}}

  // Animaciones del mundo LEGO
  world.anims.forEach(fn => fn(t, dt));

  // Simulación logística
  sim.update(dt, t);
  sim.customers.render(t);
  walk.update(dt);

  // Posicionar caja de selección si hay vehículo seleccionado
  if (state.selected && state.selected.kind !== 'district') {
    const ent = sim.get(state.selected.id);
    if (ent) {
      selectBox.position.copy(ent.group.position);
      selectBox.position.y += ent.kind === 'customer' ? 2 : 1.4;
      selectBox.rotation.y = ent.group.rotation.y;
      if (ent.kind === 'customer') selectBox.scale.set(2.8, 4.2, 2.8);
      else selectBox.scale.set(7, 3.6, 3.6);

      // Posicionar etiqueta flotante del vehículo
      tempV.copy(ent.group.position);
      tempV.y += 3.8;
      tempV.project(camera);
      vehicleTag.style.display = tempV.z > -1 && tempV.z < 1 ? 'flex' : 'none';
      if (tempV.z > -1 && tempV.z < 1) {
        const x = (tempV.x * 0.5 + 0.5) * container.clientWidth;
        const y = (-(tempV.y * 0.5) + 0.5) * container.clientHeight;
        vehicleTag.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
        const st = STATUS[ent.status] || STATUS.transit;
        vehicleTag.innerHTML = `<span>${ent.kind === 'customer' ? ent.customer : ent.id}</span> · ${CUSTOMER_STATES[ent.status] || st.label}`;
      }
    }
  }

  // Keep complete labels inside the viewport and resolve overlaps near their anchors.
  const occupied=[];
  const viewportWidth=container.clientWidth,viewportHeight=container.clientHeight;
  const topMargin=viewportWidth<640?148:104;
  districtLabels.forEach(({ el, leader, pos, width, height },id) => {
    if(document.body.classList.contains('hide-city-labels')&&id!==hoveredId){el.style.display='none';leader.style.display='none';return;}
    tempV.copy(pos).project(camera);
    if(tempV.z<=-1||tempV.z>=1||Math.abs(tempV.x)>1.1||Math.abs(tempV.y)>1.1){el.style.display='none';leader.style.display='none';return;}
    const anchorX=(tempV.x*.5+.5)*viewportWidth,anchorY=(-tempV.y*.5+.5)*viewportHeight;
    let placed=null;
    for(const dy of (id===hoveredId?[-40,-80,40,80,-120,120]:[0,-40,40,-80,80,-120,120])) {
      for(const dx of [0,-85,85]) {
        const x=Math.max(width/2+8,Math.min(viewportWidth-width/2-52,anchorX+dx));
        const y=Math.max(topMargin+height/2,Math.min(viewportHeight-height/2-12,anchorY+dy));
        const box={left:x-width/2-3,right:x+width/2+3,top:y-height/2-3,bottom:y+height/2+3};
        if(!occupied.some(b=>box.left<b.right&&box.right>b.left&&box.top<b.bottom&&box.bottom>b.top)){placed={x,y,box};break;}
      }
      if(placed)break;
    }
    el.style.display=placed?'flex':'none';leader.style.display=placed?'block':'none';
    if(placed){occupied.push(placed.box);const dx=placed.x-anchorX,dy=placed.y-anchorY;leader.style.width=`${Math.hypot(dx,dy)}px`;leader.style.transform=`translate(${anchorX}px,${anchorY}px) rotate(${Math.atan2(dy,dx)}rad)`;el.style.transform=`translate(-50%, -50%) translate(${placed.x}px, ${placed.y}px)`;}
  });

  // Tickers periódicos
  kpiTimer += dt;
  if (kpiTimer > 0.4) {
    kpiTimer = 0;
    updateKPIs();
    renderFleetList();
    if (state.selected?.kind === 'customer') {
      const status = document.getElementById('client-status');
      if (status) status.textContent = CUSTOMER_STATES[state.selected.data.status];
    }
    if (state.selected?.kind === 'truck') {
      renderDetail();
      renderTracker();
    }
  }

  mmTimer += dt;
  if (mmTimer >= 1 / 12 && minimapCanvas.getClientRects().length) {
    mmTimer = 0;
    updateMinimap();
  }

  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// 15. Resize & Inicialización
// ---------------------------------------------------------------------------
function resizeStage() {
  const width = container.clientWidth, height = container.clientHeight;
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.25 : 1.75));
  renderer.setSize(width, height);
}
const stageObserver = new ResizeObserver(resizeStage);
stageObserver.observe(container);
window.addEventListener('resize', resizeStage);
resizeStage();
window.addEventListener('pagehide', e => {
  if (e.persisted) return;
  disposed = true;
  stageObserver.disconnect(); navigation.dispose(); walk.dispose(); controls.dispose(); audio.dispose();
  const geometries = new Set(), materials = new Set(), textures = new Set();
  scene.traverse(o => {
    if (o.isInstancedMesh) o.dispose();
    if (o.geometry) geometries.add(o.geometry);
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m));
  });
  materials.forEach(m => { Object.values(m).forEach(v => { if (v?.isTexture) textures.add(v); }); m.dispose(); });
  textures.forEach(t => t.dispose()); geometries.forEach(g => g.dispose());
  disposeGeometryCaches(); dirLight.shadow.map?.dispose(); renderer.dispose();
});

// The intro bootstrap reveals the city only after initialization has completed.
document.body.classList.add('no-detail');
renderFleetList();
animate();

const fleetToggle = document.getElementById('fleet-toggle');
fleetToggle.addEventListener('click', () => {
  const open = document.body.classList.toggle('fleet-open');
  fleetToggle.setAttribute('aria-expanded', String(open));
  fleetToggle.textContent = open ? 'Cerrar explorador' : 'Explorar portafolio';
  if (open) { setMode('live'); selectEntity(null, null); }
});

let followedClient = 0;
document.getElementById('meet-client').addEventListener('click', () => {
  const services = ['m365', 'compute', 'azuredata', 'fabric', 'dynamics', 'entra'];
  const district = services[followedClient++ % services.length];
  const person = sim.customers.visitors(district).find(p => p.status === 'entering') || sim.customers.visitors(district)[0];
  selectEntity('customer', person.id);
});

initExecutiveTour(selectEntity);

function openBeach() {
  selectEntity(null,null);
  const panel=document.getElementById('executive-panel');
  panel.hidden=false; document.body.classList.add('executive-tour');
  flyCameraTo(new THREE.Vector3(-42,34,169),new THREE.Vector3(-76,2,128),1);
  panel.innerHTML=`<div class="exec-heading"><span>PLAYA LEGO AUTOMATIZADA</span><button id="beach-close" aria-label="Cerrar playa">✕</button></div><h2>Del pedido al servicio</h2><p>Un ejemplo de cómo conectar aplicaciones, agentes, automatización y datos en una experiencia de cliente.</p><ol id="beach-steps">${BEACH_STEPS.map(([title],i)=>`<li data-step="${i}">${title}</li>`).join('')}</ol><p id="beach-status" role="status"></p><button class="btn" id="beach-order">Simular un pedido</button><p><small>Demostración local. No realiza pedidos reales ni conecta servicios Microsoft. Los robots necesitan integración con sistemas físicos; las excepciones requieren atención humana.</small></p>`;
  const status=panel.querySelector('#beach-status'),button=panel.querySelector('#beach-order');
  world.beach.subscribe((phase,count)=>{
    if(!status.isConnected)return;
    status.textContent=phase<0?`${count} pedidos completados en esta sesión. Inicie una visita para ver el flujo.`:BEACH_STEPS[phase][1];
    button.disabled=phase>=0;
    panel.querySelectorAll('[data-step]').forEach(el=>el.classList.toggle('active',Number(el.dataset.step)===phase));
  });
  button.onclick=()=>world.beach.start();
  panel.querySelector('#beach-close').onclick=()=>{world.beach.subscribe(()=>{});panel.hidden=true;document.body.classList.remove('executive-tour');};
}
document.getElementById('beach-start').onclick=openBeach;

function openLivingScene(kind) {
  selectEntity(null,null);
  const airport=kind==='airport',panel=document.getElementById('executive-panel');
  panel.hidden=false;document.body.classList.add('executive-tour');
  const target=airport?new THREE.Vector3(240,2,80):world.security.episodes[0].client.group.position.clone();
  flyCameraTo(target.clone().add(airport?new THREE.Vector3(70,65,85):new THREE.Vector3(26,25,34)),target,1);
  panel.innerHTML=`<div class="exec-heading"><span>${airport?'CLOUD GATEWAY':'PROTECCIÓN MICROSOFT'}</span><button aria-label="Cerrar explicación">✕</button></div><h2>${airport?'Datos que llegan y salen':'Clientes protegidos'}</h2><p>${airport?'Los aviones representan el intercambio de datos entre los sistemas de los clientes y Microsoft Cloud. Aterrizan, descargan en la terminal y despegan con resultados.':'Las motos pirata representan amenazas. Los drones Defender ilustran detección y respuesta; el dron Firewall representa el filtrado del tráfico de red.'}</p><p>${airport?'La carretera conecta el aeropuerto con la ciudad: aplicaciones, infraestructura y plataformas de datos trabajan como un ecosistema conectado.':'Los muros y escudos muestran la contención del ataque. Entra controla identidades, Sentinel reúne señales y Purview ayuda a gobernar los datos en sus respectivos edificios.'}</p><small>Simulación ilustrativa; no muestra tráfico ni incidentes reales.</small>`;
  panel.querySelector('button').onclick=()=>{panel.hidden=true;document.body.classList.remove('executive-tour');};
}
document.getElementById('cam-airport').onclick=()=>openLivingScene('airport');
document.getElementById('cam-security').onclick=()=>openLivingScene('security');

document.getElementById('cam-itse').onclick=focusITSETower;

const labelsToggle=document.getElementById('labels-toggle');
function setLabelsHidden(hidden){
  document.body.classList.toggle('hide-city-labels',hidden);
  labelsToggle.setAttribute('aria-pressed',String(hidden));
  const label=hidden?'Mostrar etiquetas':'Ocultar etiquetas';
  labelsToggle.title=label;labelsToggle.setAttribute('aria-label',label);
}
setLabelsHidden(matchMedia('(max-width: 900px)').matches);
document.body.classList.add('labels-initialized');
labelsToggle.addEventListener('click',()=>setLabelsHidden(!document.body.classList.contains('hide-city-labels')));
const headerToggle=document.getElementById('header-toggle'),headerOptions=document.getElementById('header-options');
function setHeaderOpen(open){
  headerOptions.hidden=!open;
  headerToggle.closest('header').classList.toggle('header-collapsed',!open);
  headerToggle.setAttribute('aria-expanded',String(open));
  headerToggle.setAttribute('aria-label',open?'Ocultar opciones':'Mostrar opciones');
  headerToggle.textContent=open?'✕':'☰';
}
headerToggle.addEventListener('click',()=>setHeaderOpen(headerOptions.hidden));
headerToggle.closest('header').addEventListener('keydown',event=>{if(event.key==='Escape'){setHeaderOpen(false);headerToggle.focus();}});
