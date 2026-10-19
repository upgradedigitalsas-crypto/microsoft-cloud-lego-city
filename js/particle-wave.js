import * as THREE from 'three';
// Native ES module adaptation of the supplied ParticleWave shader.
export function createParticleWave(host){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(75,1,.01,1000);
 camera.position.set(0,6,5);camera.lookAt(0,0,0);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false});
 renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
 renderer.domElement.className='welcome-wave';renderer.domElement.setAttribute('aria-hidden','true');host.prepend(renderer.domElement);
 const count=200,gap=.3,positions=new Float32Array(count*count*3),scales=new Float32Array(count*count).fill(1);
 for(let x=0;x<count;x++)for(let y=0;y<count;y++){const i=(x*count+y)*3;positions[i]=x*gap-count*gap/2;positions[i+2]=y*gap-count*gap/2;}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('scale',new THREE.BufferAttribute(scales,1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0}},vertexShader:`attribute float scale;uniform float uTime;
 void main(){vec3 p=position;float s=scale;p.y+=sin(p.x+uTime)*.5+cos(p.y+uTime)*.2;p.x+=sin(p.y+uTime)*.5;s+=sin(p.x+uTime)*.5+cos(p.y+uTime)*.2;vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_PointSize=s*15./-mvPosition.z;gl_Position=projectionMatrix*mvPosition;}`,
 fragmentShader:`void main(){gl_FragColor=vec4(1.,1.,1.,.5);}`});
 scene.add(new THREE.Points(geometry,material));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let raf=0,last=0,disposed=false;
 function resize(){const {width,height}=host.getBoundingClientRect();camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();renderer.setSize(width,height);}
 function frame(now){if(disposed)return;raf=requestAnimationFrame(frame);if(!document.hidden){if(last&&!reduced.matches)material.uniforms.uTime.value+=Math.min((now-last)/1000,.1)*3;renderer.render(scene,camera);}last=now;}
 resize();window.addEventListener('resize',resize);raf=requestAnimationFrame(frame);
 return ()=>{if(disposed)return;disposed=true;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
}
