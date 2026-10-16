import { DISTRICTS } from './data.js';
// Shared street plan: rendered roads, patrols, deliveries and minimap use one ring.
export const BOULEVARD = Array.from({ length: 32 }, (_, i) => {
  const a = i * Math.PI * 2 / 32;
  return [Math.cos(a) * 96, Math.sin(a) * 73];
});
export function roadAccess(x, z) {
  let best = 0, distance = Infinity;
  BOULEVARD.forEach(([rx, rz], i) => { const d = Math.hypot(rx - x, rz - z); if (d < distance) { distance = d; best = i; } });
  const point = BOULEVARD[best];
  const dock = [x, z + 21];
  const candidates = [-1,1].map(sign=>{const side=x+sign*20;return [point,[side,point[1]],[side,z+21],dock];});
  if(point[1]>=z+17)candidates.unshift([point,dock]);
  const score=path=>path.slice(1).reduce((total,b,i)=>{
    const a=path[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    let penalty=0;
    for(let s=0;s<=length;s+=1){const t=length?s/length:0,px=a[0]+(b[0]-a[0])*t,pz=a[1]+(b[1]-a[1])*t;
      if(inLake(px,pz)||DISTRICTS.some(d=>Math.abs(px-d.pos[0])<17 && Math.abs(pz-d.pos[1])<16))penalty+=1000;
    }
    return total+length+penalty;
  },0);
  const driveway=candidates.sort((a,b)=>score(a)-score(b))[0];
  return { index: best, point, dock, driveway: driveway.filter((p,i,a)=>!i||Math.hypot(p[0]-a[i-1][0],p[1]-a[i-1][1])>0.01) };
}
export function streetRoute(from, to) {
  const n = BOULEVARD.length, forward = (to - from + n) % n;
  const direction = forward <= n / 2 ? 1 : -1;
  const result = [BOULEVARD[from]];
  while (from !== to) { from = (from + direction + n) % n; result.push(BOULEVARD[from]); }
  return result;
}
export function inLake(x, z) { return Math.hypot(x / 31, z / 24) < 1 + 0.08 * Math.sin(Math.atan2(z, x) * 3); }
