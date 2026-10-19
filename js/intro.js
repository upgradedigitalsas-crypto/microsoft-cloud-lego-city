import { soundscape } from './soundscape.js';
// Sparkles reference adapted to native Canvas + Three.js; no React/runtime packages.
const overlay=document.getElementById('loader'),canvas=document.getElementById('intro-fx'),ctx=canvas.getContext('2d');
const stage=document.getElementById('intro-stage'),caption=document.getElementById('intro-caption'),skip=document.getElementById('intro-skip');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let entered=false;
let w=0,h=0,raf=0,film=null,started=0,ready=false,failed=false,closed=false,skipped=reduce.matches,loading=null;
const stars=Array.from({length:1200},()=>({x:Math.random(),y:Math.random(),phase:Math.random()*Math.PI*2}));

function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}
resize();window.addEventListener('resize',resize);
function finish(){if(closed||!ready||!entered)return;closed=true;cancelAnimationFrame(raf);film?.dispose();film=null;window.removeEventListener('resize',resize);reduce.removeEventListener('change',motionChange);overlay.classList.add('done');document.body.classList.remove('intro-active');document.querySelector('.topbar').inert=false;document.getElementById('stage').inert=false;soundscape.city();window.dispatchEvent(new Event('city-arrival'));setTimeout(()=>{overlay.remove();if(!document.body.classList.contains('arrival-active'))document.getElementById('executive-start')?.focus({preventScroll:true});},550);}
function say(text){if(caption.textContent!==text)caption.textContent=text;}
function loadCity(){if(loading)return loading;say('Preparando tu ecosistema cloud…');loading=import('./main.js').then(()=>{ready=true;if(skipped)finish();}).catch(()=>{failed=true;overlay.dataset.phase='error';caption.textContent='No se pudo cargar la ciudad. Comprueba tu conexión y vuelve a intentarlo.';skip.textContent='Reintentar';skip.disabled=false;});return loading;}
function motionChange(e){if(e.matches){skipped=true;film?.dispose();film=null;loadCity();}}
reduce.addEventListener('change',motionChange);
skip.addEventListener('click',()=>{if(failed){location.reload();return;}skipped=true;skip.textContent='Abriendo ciudad…';skip.disabled=true;film?.dispose();film=null;loadCity();if(ready)finish();});
document.querySelector('.topbar').inert=true;document.getElementById('stage').inert=true;
function frame(now){if(closed)return;raf=requestAnimationFrame(frame);const t=entered&&started?(now-started)/1000:0;
 ctx.clearRect(0,0,w,h);
 const tunnel=!skipped&&t>=15.5,blackout=!skipped&&((t>=8.5&&t<11)||(t>=14.3&&t<15.5));
 overlay.dataset.phase=failed?'error':skipped?'loading':tunnel?'tunnel':blackout?'blackout':t>=11?'flight':t>=5.8?'handshake':'arrival';
 const fade=t>=8.5&&t<11?Math.min(1,(t-8.5)/.4):1;
 stage.style.opacity=skipped?'0':blackout?String(1-fade):'1';
 soundscape.phase=tunnel?'tunnel':blackout?'blackout':t>=11?'flight':'intro';
 document.getElementById('intro-brand').style.opacity=blackout?'0':'1';
 if(!tunnel&&!blackout){
   const y=film?film.lineY():h*.64;
   const width=Math.min(640,w*.9),height=160,left=(w-width)/2;
   const glow=ctx.createLinearGradient(left,0,left+width,0);glow.addColorStop(0,'transparent');glow.addColorStop(.5,'#818CF8');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.shadowColor='#6366F1';ctx.shadowBlur=8;ctx.fillRect(left,y,width,2);ctx.shadowBlur=0;
   const core=ctx.createLinearGradient(w/2-width*.17,0,w/2+width*.17,0);core.addColorStop(0,'transparent');core.addColorStop(.5,'#38BDF8');core.addColorStop(1,'transparent');ctx.fillStyle=core;ctx.shadowColor='#38BDF8';ctx.shadowBlur=5;ctx.fillRect(w/2-width*.17,y,width*.34,3);ctx.shadowBlur=0;
   const seconds=reduce.matches?0:now*.001;
   for(const s of stars){
     const px=((s.x+Math.sin(seconds*.15+s.phase)*.012+1)%1)*width-width/2;
     const py=((s.y+seconds*(.003+s.x*.004))%1)*height;
     const radius=Math.hypot(px/(width*.55),py/200);
     const fade=Math.max(0,Math.min(1,(1-radius)/.8));
     const a=(.1+.9*(.5+.5*Math.sin(seconds*4+s.phase)))*fade;
     ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.beginPath();ctx.arc(w/2+px,y+py,.4+s.x*.6,0,Math.PI*2);ctx.fill();
   }
 } else if(tunnel){film?.renderTunnel(t-15.5);}

 if(entered&&!skipped&&!failed){if(!tunnel)film?.render(t);if(t>9&&!loading)loadCity();if(t>=15.5)say('Conectando posibilidades');else if(t>=11)say('Tus datos. Un mundo de posibilidades.');else if(blackout)say('');else if(t>=5.8)say('La tecnología empieza con una conexión.');if(t>=19.5){if(ready)finish();else say('La ciudad está terminando de cargar…');}}
}
const welcome=document.createElement('div');welcome.className='intro-audio-start';
welcome.innerHTML='<button type="button"><span class="start-fill" aria-hidden="true"></span><svg class="start-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg><span class="start-label">Comenzar con sonido</span></button><p>Escucha la bienvenida de nuestra capitana y el ambiente de la ciudad.</p>';
overlay.append(welcome);
welcome.querySelector('button').addEventListener('click',async()=>{
 // Unlock during this deliberate gesture, before any cinematic timer runs.
 soundscape.enabled=true;
 const unlocking=soundscape.unlock();
 welcome.querySelector('button').disabled=true;
 await unlocking;
 soundscape.start();entered=true;started=performance.now();welcome.remove();
 if(skipped&&ready)finish();
});
raf=requestAnimationFrame(frame);
if(skipped){skip.textContent='Abriendo ciudad…';skip.disabled=true;loadCity();}
else import('./intro-scene.js').then(({createIntroScene})=>{if(closed||skipped)return;try{film=createIntroScene(stage);started=performance.now();}catch{skipped=true;loadCity();}}).catch(()=>{skipped=true;loadCity();});
window.addEventListener('pagehide',e=>{cancelAnimationFrame(raf);if(!e.persisted){film?.dispose();if(!ready)soundscape.dispose();window.removeEventListener('resize',resize);}});
window.addEventListener('pageshow',e=>{if(e.persisted&&!closed)raf=requestAnimationFrame(frame);});
