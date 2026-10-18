export async function loadCaptainRecording(){
 const url=new URL('https://itse-cloud-city-voice-upgradedigitalsas-cryptos-projects.vercel.app/api/captain');
 const response=await fetch(url,{signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw new Error('No generated recording');
 const manifest=await response.json();
 if(!Array.isArray(manifest.captions)||!manifest.captions.length)throw new Error('Invalid captions');
 if(typeof manifest.audio_base64!=='string'||manifest.audio_base64.length>4000000)throw new Error('Invalid recording');
 const player=new Audio('data:audio/mpeg;base64,'+manifest.audio_base64);player.preload='auto';
 return {player,captions:manifest.captions};
}
