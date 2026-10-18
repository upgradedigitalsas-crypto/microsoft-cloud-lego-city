import { BrickAudio } from './audio.js';
// A bounded synthesized ambience: no audio downloads or per-frame audio nodes.
class Soundscape extends BrickAudio {
 constructor(){
  super();this.enabled=true;this.phase='intro';this.nodes=[];this.voices=[];this.spoken=false;
  this.welcome='Les habla su capitán. Bienvenidos a ITSE Cloud City. Bajo nosotros, cada isla representa una capacidad de Microsoft para su empresa: productividad, datos, inteligencia artificial y seguridad. Seleccionen un edificio para descubrir sus posibilidades, o recorran la ciudad a pie desde el aeropuerto. Disfruten la visita.';
  this.gesture=()=>{if(this.enabled)this.unlock().then(()=>{this.start();this.speak();});};
  window.addEventListener('pointerdown',this.gesture);window.addEventListener('keydown',this.gesture);
  this.visibility=()=>{if(document.hidden){this.context?.suspend();window.speechSynthesis?.pause();}else if(this.enabled){this.context?.resume().then(()=>{this.start();this.speak();});window.speechSynthesis?.resume();}};
  document.addEventListener('visibilitychange',this.visibility);
 }
 async toggle(){const enabled=await super.toggle();if(enabled){this.start();this.speak();}else {window.speechSynthesis?.cancel();this.speaking=false;}return enabled;}
 city(){this.phase='city';this.arrived=true;this.speak();}
 get lines(){return ['Les habla su capitán. Bienvenidos a ITSE Cloud City.','Bajo nosotros, cada isla representa una capacidad de Microsoft para su empresa.','Productividad, datos, inteligencia artificial y seguridad.','Seleccionen un edificio para descubrir sus posibilidades.','O recorran la ciudad a pie desde el aeropuerto. Disfruten la visita.'];}
 speak(){
  if(!this.arrived||this.spoken||!this.enabled||this.context?.state!=='running'||!window.speechSynthesis)return;
  this.spoken=true;this.speaking=true;let i=0;
  const next=()=>{
   if(!this.enabled||!this.speaking)return;
   if(i>=this.lines.length){this.speaking=false;return;}
   const line=this.lines[i++],speech=new SpeechSynthesisUtterance(line);speech.lang='es-CO';speech.rate=.96;speech.volume=.8;
   speech.onstart=()=>window.dispatchEvent(new CustomEvent('captain-caption',{detail:line}));
   speech.onend=next;speech.onerror=()=>{this.speaking=false;};window.speechSynthesis.speak(speech);
  };next();
 }

 start(){
  if(this.timer||this.context?.state!=='running')return;
  const c=this.context;this.master=c.createGain();this.master.gain.value=.15;this.master.connect(c.destination);this.nodes.push(this.master);
  const buffer=c.createBuffer(1,c.sampleRate*3,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  const layer=(type,freq,volume)=>{const source=type==='noise'?c.createBufferSource():c.createOscillator();if(type==='noise'){source.buffer=buffer;source.loop=true;}else{source.type=type;source.frequency.value=freq;}
   const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=type==='noise'?700:1000;const gain=c.createGain();gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start();this.nodes.push(source,filter,gain);return {source,filter,gain};};
  this.water=layer('noise',0,.2);this.engine=layer('triangle',65,.02);this.drone=layer('sawtooth',140,.008);this.factory=layer('triangle',95,.01);
  this.tick=0;this.timer=setInterval(()=>this.updateAmbience(),250);
 }
 pulse(freq,volume,duration,type='triangle'){
  if(this.voices.length>=8)return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);o.connect(g);g.connect(this.master);this.voices.push(o);o.onended=()=>{o.disconnect();g.disconnect();this.voices=this.voices.filter(v=>v!==o);};o.start();o.stop(c.currentTime+duration);
 }
 updateAmbience(){
  if(!this.enabled||document.hidden||this.context.state!=='running')return;
  const t=this.context.currentTime,city=this.phase==='city',flight=this.phase==='flight',dark=this.phase==='blackout';this.tick++;
  this.master.gain.setTargetAtTime(dark?0:this.speaking?.045:.15,t,.4);
  this.water.gain.gain.setTargetAtTime(city?.16+.07*Math.sin(t*.65):.025,t,.5);
  this.engine.gain.gain.setTargetAtTime(flight?.32:city?.035:0,t,.3);
  this.engine.source.frequency.setTargetAtTime(flight?90+45*Math.sin(t*.4):58+12*Math.sin(t*.3),t,.3);
  this.drone.gain.gain.setTargetAtTime(city?.01*(1+Math.sin(t*.8)):this.phase==='tunnel'?.045:0,t,.3);
  this.factory.gain.gain.setTargetAtTime(city?.02*(.6+.4*Math.sin(t*3)):0,t,.2);
  if(!dark&&(city||this.phase==='intro')&&this.tick%2===0)this.pulse(150+Math.random()*70,.06,.08);
  if(city&&this.tick%13===0)this.pulse(320+Math.random()*180,.025,.28,'sine');
 }
 dispose(){clearInterval(this.timer);window.removeEventListener('pointerdown',this.gesture);window.removeEventListener('keydown',this.gesture);document.removeEventListener('visibilitychange',this.visibility);window.speechSynthesis?.cancel();this.nodes.forEach(n=>{try{n.stop?.();n.disconnect();}catch{}});super.dispose();}
}
export const soundscape=new Soundscape();
