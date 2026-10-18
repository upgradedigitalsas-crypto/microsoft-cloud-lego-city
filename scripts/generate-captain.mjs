// Server-side/offline generation. Secrets are read only from the process environment.
import {mkdir,writeFile} from 'node:fs/promises';
import {CAPTAIN_LINES} from '../js/captain-lines.js';
const key=process.env.ELEVENLABS_API_KEY,voice=process.env.ELEVENLABS_VOICE_ID;
if(!key||!voice){console.error('Configure ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in the secure process environment.');process.exit(1);}
const response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/with-timestamps?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({text:CAPTAIN_LINES.join(' '),model_id:'eleven_multilingual_v2',language_code:'es'}),signal:AbortSignal.timeout(60000)});
if(!response.ok)throw new Error(`ElevenLabs returned HTTP ${response.status}. No audio was published.`);
const data=await response.json(),alignment=data.alignment;
if(!data.audio_base64||!alignment?.characters?.length)throw new Error('Missing audio or timestamps.');
if(alignment.characters.join('')!==CAPTAIN_LINES.join(' '))throw new Error('Unexpected text alignment; review before publishing.');
let offset=0;
const captions=CAPTAIN_LINES.map(text=>{const start=alignment.character_start_times_seconds[offset],end=alignment.character_end_times_seconds[offset+text.length-1];offset+=text.length+1;if(!Number.isFinite(start)||!Number.isFinite(end))throw new Error('Invalid timestamps');return {text,start,end};});
const dir=new URL('../assets/audio/',import.meta.url);await mkdir(dir,{recursive:true});
await writeFile(new URL('captain.mp3',dir),Buffer.from(data.audio_base64,'base64'));
await writeFile(new URL('captain.json',dir),JSON.stringify({provider:'ElevenLabs',audio:'captain.mp3',captions},null,2));
console.log('Generated captain.mp3 and synchronized captions. Preview before publishing.');
