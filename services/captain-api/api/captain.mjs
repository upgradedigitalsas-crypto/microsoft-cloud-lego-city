import {CAPTAIN_LINES} from '../lib/lines.mjs';
let cached=null,pending=null;
export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','https://upgradedigitalsas-crypto.github.io');
 res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='OPTIONS')return res.status(204).end();
 if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
 const key=process.env.ELEVENLABS_API_KEY,voice=process.env.ELEVENLABS_VOICE_ID;
 if(!key||!voice){res.setHeader('Cache-Control','no-store');return res.status(503).json({error:'voice_not_configured'});}
 try{
  if(!cached||cached.expires<Date.now()){
   pending ||= (async()=>{
    const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/with-timestamps?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({text:CAPTAIN_LINES.join(' '),model_id:'eleven_multilingual_v2',language_code:'es'}),signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw new Error('upstream');const data=await r.json(),a=data.alignment;
    if(!data.audio_base64||a?.characters?.join('')!==CAPTAIN_LINES.join(' '))throw new Error('alignment');
    let index=0;const captions=CAPTAIN_LINES.map(text=>{const start=a.character_start_times_seconds[index],end=a.character_end_times_seconds[index+text.length-1];index+=text.length+1;if(!Number.isFinite(start)||!Number.isFinite(end))throw new Error('alignment');return {text,start,end};});
    cached={expires:Date.now()+86400000,body:{provider:'ElevenLabs',audio_base64:data.audio_base64,captions}};
   })().finally(()=>{pending=null;});await pending;
  }
  res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');return res.status(200).json(cached.body);
 }catch{res.setHeader('Cache-Control','no-store');return res.status(502).json({error:'voice_temporarily_unavailable'});}
}
