// Sparkles reference adapted to native Canvas + Three.js; no React/runtime packages.
const overlay=document.getElementById('loader'),canvas=document.getElementById('intro-fx'),ctx=canvas.getContext('2d');
const stage=document.getElementById('intro-stage'),caption=document.getElementById('intro-caption'),skip=document.getElementById('intro-skip');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let w=0,h=0,raf=0,film=null,started=0,ready=false,failed=false,closed=false,skipped=reduce.matches,loading=null;
const stars=Array.from({length:150},(_,i)=>({x:((i*73)%151)/151,y:((i*47)%149)/149,phase:i*.7}));
const colors=['#5900FF','#010ED0','#00A8A8','#79F6F5'];
function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}
resize();window.addEventListener('resize',resize);
function finish(){if(closed||!ready)return;closed=true;cancelAnimationFrame(raf);film?.dispose();film=null;window.removeEventListener('resize',resize);reduce.removeEventListener('change',motionChange);overlay.classList.add('done');document.body.classList.remove('intro-active');document.querySelector('.topbar').inert=false;document.getElementById('stage').inert=false;setTimeout(()=>{overlay.remove();document.getElementById('executive-start')?.focus({preventScroll:true});},550);}
function say(text){if(caption.textContent!==text)caption.textContent=text;}
function loadCity(){if(loading)return loading;say('Preparando tu ecosistema cloud…');loading=import('./main.js').then(()=>{ready=true;if(skipped)finish();}).catch(()=>{failed=true;overlay.dataset.phase='error';caption.textContent='No se pudo cargar la ciudad. Comprueba tu conexión y vuelve a intentarlo.';skip.textContent='Reintentar';skip.disabled=false;});return loading;}
function motionChange(e){if(e.matches){skipped=true;film?.dispose();film=null;loadCity();}}
reduce.addEventListener('change',motionChange);
skip.addEventListener('click',()=>{if(failed){location.reload();return;}skipped=true;skip.textContent='Abriendo ciudad…';skip.disabled=true;film?.dispose();film=null;loadCity();if(ready)finish();});
document.querySelector('.topbar').inert=true;document.getElementById('stage').inert=true;
function frame(now){if(closed)return;raf=requestAnimationFrame(frame);const t=started?(now-started)/1000:0;
 ctx.clearRect(0,0,w,h);
 const tunnel=!skipped&&t>=13,blackout=!skipped&&t>=11.8&&t<13;
 overlay.dataset.phase=failed?'error':skipped?'loading':tunnel?'tunnel':blackout?'blackout':t>=8.5?'flight':t>=5.8?'handshake':'arrival';
 stage.style.opacity=blackout||tunnel||skipped?'0':'1';
 document.getElementById('intro-brand').style.opacity=blackout||tunnel?'0':'1';
 if(!tunnel&&!blackout){
   const y=film?film.lineY():h*.64;
   const glow=ctx.createLinearGradient(w*.1,0,w*.9,0);glow.addColorStop(0,'transparent');glow.addColorStop(.5,'#79F6F5');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.shadowColor='#5900FF';ctx.shadowBlur=16;ctx.fillRect(w*.1,y,w*.8,2);ctx.shadowBlur=0;
   for(const s of stars){const a=.25+.55*(.5+.5*Math.sin((reduce.matches?0:now*.001)+s.phase));ctx.fillStyle=`rgba(205,231,255,${a})`;ctx.beginPath();ctx.arc(s.x*w,y+s.y*h*.3, .5+s.x,0,Math.PI*2);ctx.fill();}
 } else if(tunnel){
   const elapsed=t-13,cx=w/2,cy=h/2;
   for(let i=0;i<24;i++){const depth=((i/24+elapsed*.25)%1);const size=Math.pow(depth,2)*Math.max(w,h)*1.2;ctx.strokeStyle=colors[i%4];ctx.globalAlpha=depth*.75;ctx.lineWidth=1+depth*5;ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.sin(elapsed*.35)*.15);ctx.strokeRect(-size,-size*.62,size*2,size*1.24);ctx.restore();}ctx.globalAlpha=1;
 }
 if(!skipped&&!failed){film?.render(t);if(t>9&&!loading)loadCity();if(t>=13)say('Conectando posibilidades');else if(t>=8.5)say('Tus datos. Un mundo de posibilidades.');else if(t>=5.8)say('La tecnología empieza con una conexión.');if(t>=17){if(ready)finish();else say('La ciudad está terminando de cargar…');}}
}
raf=requestAnimationFrame(frame);
if(skipped){skip.textContent='Abriendo ciudad…';skip.disabled=true;loadCity();}
else import('./intro-scene.js').then(({createIntroScene})=>{if(closed||skipped)return;try{film=createIntroScene(stage);started=performance.now();}catch{skipped=true;loadCity();}}).catch(()=>{skipped=true;loadCity();});
window.addEventListener('pagehide',e=>{cancelAnimationFrame(raf);if(!e.persisted){film?.dispose();window.removeEventListener('resize',resize);}});
window.addEventListener('pageshow',e=>{if(e.persisted&&!closed)raf=requestAnimationFrame(frame);});
