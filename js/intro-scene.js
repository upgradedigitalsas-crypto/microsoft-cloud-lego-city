import * as THREE from 'three';
import { createIntroTunnel } from './intro-tunnel.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Independent geometry/material ownership: disposing this short film never touches the city.
export function createIntroScene(container) {
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,180);
  camera.position.set(0,3.1,20);camera.lookAt(0,1.1,0);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;container.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#EAF6FF','#3D086D',2.4));
  const key=new THREE.DirectionalLight('#FFFFFF',3.2);key.position.set(-5,9,10);scene.add(key);
  const rim=new THREE.DirectionalLight('#00E7E0',3);rim.position.set(6,4,-5);scene.add(rim);
  const tunnel=createIntroTunnel(renderer);
  const materials=new Map(),geometries=new Map();
  const material=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.27}));return materials.get(color);};
  function box(parent,w,h,d,x,y,z,color){const k=[w,h,d].join('|');if(!geometries.has(k))geometries.set(k,new RoundedBoxGeometry(w,h,d,2,Math.min(.045,w/5,h/5,d/5)));const m=new THREE.Mesh(geometries.get(k),material(color));m.position.set(x,y,z);parent.add(m);return m;}
  function cylinder(parent,r,h,x,y,z,color){const k=`c${r}|${h}`;if(!geometries.has(k))geometries.set(k,new THREE.CylinderGeometry(r,r,h,24));const m=new THREE.Mesh(geometries.get(k),material(color));m.position.set(x,y,z);parent.add(m);return m;}
  const logo=new THREE.TextureLoader().load('assets/itse-logo.png');logo.colorSpace=THREE.SRGBColorSpace;
  function figure(host){
    const root=new THREE.Group();scene.add(root);const torso=host?'#5900F5':'#00A8A8';
    const legs=[],arms=[];
    for(const side of [-1,1]){
      const leg=new THREE.Group();leg.position.set(side*.26,.95,0);root.add(leg);
      box(leg,.45,.8,.45,0,-.4,0,'#20283E');box(leg,.45,.25,.64,0,-.83,.09,'#20283E');legs.push(leg);
      const arm=new THREE.Group();arm.position.set(side*.65,1.92,0);root.add(arm);
      box(arm,.32,.7,.4,0,-.32,0,torso);cylinder(arm,.19,.3,0,-.8,.02,'#FFD044');arms.push(arm);
    }
    box(root,1.1,.24,.58,0,.98,0,'#20283E');
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.55,.7,1,4),material(torso));body.rotation.y=Math.PI/4;body.scale.z=.65;body.position.y=1.6;root.add(body);
    cylinder(root,.21,.2,0,2.17,0,'#FFD044');cylinder(root,.4,.64,0,2.57,0,'#FFD044');cylinder(root,.2,.15,0,2.96,0,'#FFD044');
    for(const x of [-.14,.14])box(root,.075,.09,.025,x,2.65,.395,'#172033');
    box(root,.2,.04,.025,0,2.43,.4,'#172033');
    if(host){
      cylinder(root,.42,.16,0,2.9,0,'#25304D');
      const badge=new THREE.Mesh(new THREE.PlaneGeometry(.82,.39),new THREE.MeshBasicMaterial({map:logo,transparent:true,depthWrite:false}));
      // White shirt patch preserves the original purple ITSE artwork.
      box(root,.88,.44,.025,0,1.75,.49,'#FFFFFF');badge.position.set(0,1.75,.51);root.add(badge);
    } else {box(root,.34,.38,.03,0,1.75,.35,'#FFFFFF');box(root,.24,.04,.04,0,1.75,.37,'#00A8A8');}
    return {root,legs,arms};
  }
  const visitor=figure(false),host=figure(true);
  const line=new THREE.Mesh(new THREE.BoxGeometry(25,.025,.06),new THREE.MeshBasicMaterial({color:'#7DDFFF',toneMapped:false}));line.position.y=-.03;line.visible=false;scene.add(line);
  const plane=new THREE.Group();scene.add(plane);
  box(plane,1.3,.7,5,0,0,0,'#F1F5FF');box(plane,.95,.6,1.1,0,.1,2.8,'#67D9F5');
  box(plane,7,.22,1.5,0,-.1,-.1,'#F1F5FF');box(plane,3,.22,1,0,.2,-2,'#5900F5');box(plane,.2,1.3,1,0,.7,-2,'#5900F5');
  for(const x of [-2,2])box(plane,.6,.6,1.4,x,-.45,.1,'#00A8A8');
  for(const z of [-1.5,-.5,.5,1.5])cylinder(plane,.15,.12,0,.41,z,'#F1F5FF');
  plane.rotation.y=Math.PI;
  const ease=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
  function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=w/h<1?32:20;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function render(t){
    const walk=ease(t/4),arrival=ease((t-3)/2.8),shake=t>=6&&t<8.4;
    visitor.root.position.set(THREE.MathUtils.lerp(-5,-1.13,walk),t<4?Math.abs(Math.sin(t*8))*.065:0,0);
    visitor.root.visible=t<8.5;host.root.visible=t>=3&&t<8.5;
    host.root.position.set(THREE.MathUtils.lerp(5,1.13,arrival),(t>3&&t<5.8?Math.abs(Math.sin(t*8))*.065:0),0);
    visitor.root.rotation.y=t<4?.5:shake?.28:0;host.root.rotation.y=t<5.8?-.5:shake?-.28:0;
    for(const [fig,moving] of [[visitor,t<4],[host,t>3&&t<5.8]]){
      fig.legs.forEach((leg,i)=>leg.rotation.x=moving?Math.sin(t*8+i*Math.PI)*.55:0);
      fig.arms.forEach((arm,i)=>{arm.rotation.x=moving?Math.sin(t*8+i*Math.PI)*.4:0;arm.rotation.z=0;});
    }
    const reach=ease((t-5.8)/.5)*(1-ease((t-8)/.5));
    visitor.arms[1].rotation.z=reach*(.65+Math.sin(t*13)*.04);host.arms[0].rotation.z=-reach*(.65+Math.sin(t*13)*.04);
    visitor.arms[1].rotation.x=-reach*.16;host.arms[0].rotation.x=-reach*.16;
    if(t>=11&&t<15.5){const f=ease((t-11)/3.7);plane.visible=true;plane.position.set(0,-8+f*11,8-f*55);plane.rotation.x=-.25+f*.25;}else plane.visible=false;
    renderer.render(scene,camera);
  }
  function dispose(){tunnel.dispose();observer.disconnect();const gs=new Set(),ms=new Set(),ts=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});ms.forEach(m=>{if(m.map)ts.add(m.map);m.dispose();});gs.forEach(g=>g.dispose());ts.add(logo);ts.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();}
  const anchor=new THREE.Vector3();
  return {render,renderTunnel:tunnel.render,dispose,lineY:()=>{anchor.set(0,0,0).project(camera);return (-anchor.y*.5+.5)*container.clientHeight;}};
}
