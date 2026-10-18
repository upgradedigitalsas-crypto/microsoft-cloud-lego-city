import assert from 'node:assert/strict';
import handler from '../services/captain-api/api/captain.mjs';
import {CAPTAIN_LINES} from '../js/captain-lines.js';
import {CAPTAIN_LINES as serverLines} from '../services/captain-api/lib/lines.mjs';
assert.deepEqual(serverLines,CAPTAIN_LINES);
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;return this;},end(){return this;}});
const savedKey=process.env.ELEVENLABS_API_KEY,savedVoice=process.env.ELEVENLABS_VOICE_ID,originalFetch=globalThis.fetch;
try{
 delete process.env.ELEVENLABS_API_KEY;delete process.env.ELEVENLABS_VOICE_ID;
 let r=response();await handler({method:'POST'},r);assert.equal(r.code,405);
 r=response();await handler({method:'GET'},r);assert.equal(r.code,503);
 process.env.ELEVENLABS_API_KEY='test-key';process.env.ELEVENLABS_VOICE_ID='test-voice';let calls=0;
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(JSON.parse(options.body).text,CAPTAIN_LINES.join(' '));const text=CAPTAIN_LINES.join(' ');return {ok:true,json:async()=>({audio_base64:'YWJj',alignment:{characters:[...text],character_start_times_seconds:[...text].map((_,i)=>i*.05),character_end_times_seconds:[...text].map((_,i)=>(i+1)*.05)}})};};
 r=response();await handler({method:'GET',query:{text:'not allowed'}},r);assert.equal(r.code,200);assert.equal(r.data.captions.length,5);assert.ok(!JSON.stringify(r.data).includes('test-key'));
 await handler({method:'GET'},response());assert.equal(calls,1,'Reuse generated narration');
 console.log('PASS fixed narration, method checks, missing configuration, timing and cache');
}finally{globalThis.fetch=originalFetch;if(savedKey===undefined)delete process.env.ELEVENLABS_API_KEY;else process.env.ELEVENLABS_API_KEY=savedKey;if(savedVoice===undefined)delete process.env.ELEVENLABS_VOICE_ID;else process.env.ELEVENLABS_VOICE_ID=savedVoice;}
