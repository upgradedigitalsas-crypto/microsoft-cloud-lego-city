import { DISTRICTS } from './data.js';
// Shared street plan: rendered roads, patrols, deliveries and minimap use one ring.
export const BOULEVARD = Array.from({ length: 32 }, (_, i) => {
  const a = i * Math.PI * 2 / 32;
  return [Math.cos(a) * 96, Math.sin(a) * (Math.sin(a)>0?82:73)];
});
const accessCache=new Map();
const obstacles=DISTRICTS.flatMap(d=>{
  const [x,z]=d.pos;
  return [[x-17,z-16,x+17,z+16],[x-12,z+13.5,x+12,z+26.5]];
});
function crosses(a,b,r){
  let lo=0,hi=1;
  for(let axis=0;axis<2;axis++){
    const delta=b[axis]-a[axis];
    if(Math.abs(delta)<1e-8){if(a[axis]<=r[axis]||a[axis]>=r[axis+2])return false;}
    else {const t1=(r[axis]-a[axis])/delta,t2=(r[axis+2]-a[axis])/delta;
      lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>=hi)return false;}
  }return hi>0&&lo<1;
}
function clear(a,b){
  if(obstacles.some(r=>crosses(a,b,r)))return false;
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  for(let t=0;t<=length;t+=2)if(inLake(a[0]+(b[0]-a[0])*t/(length||1),a[1]+(b[1]-a[1])*t/(length||1)))return false;
  return true;
}
const corners=obstacles.flatMap(([l,t,r,b])=>[[l-.5,t-.5],[r+.5,t-.5],[l-.5,b+.5],[r+.5,b+.5]])
  .filter(p=>clear(p,p));
// Visibility graph routes around whole lots and parked vehicles, not just building centres.
export function roadAccess(x,z){
  const key=`${x},${z}`;if(accessCache.has(key))return accessCache.get(key);
  const dock=[x,z+28],nodes=[...BOULEVARD,...corners,dock],goal=nodes.length-1;
  const costs=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),origin=nodes.map(()=>-1),visited=new Set();
  BOULEVARD.forEach((p,i)=>{if(clear(p,p)){costs[i]=0;origin[i]=i;}});
  while(visited.size<nodes.length){
    let current=-1;
    for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(current<0||costs[i]<costs[current]))current=i;
    if(current<0||!Number.isFinite(costs[current]))break;
    if(current===goal)break;
    visited.add(current);
    for(let next=0;next<nodes.length;next++){
      if(visited.has(next))continue;
      const cost=costs[current]+Math.hypot(nodes[next][0]-nodes[current][0],nodes[next][1]-nodes[current][1]);
      if(cost<costs[next]&&clear(nodes[current],nodes[next])){costs[next]=cost;previous[next]=current;origin[next]=origin[current];}
    }
  }
  if(!Number.isFinite(costs[goal]))throw new Error(`No safe street access for ${key}`);
  const driveway=[];for(let i=goal;i>=0;i=previous[i])driveway.unshift(nodes[i]);
  const result={index:origin[goal],point:BOULEVARD[origin[goal]],dock,driveway};accessCache.set(key,result);return result;
}
export function streetRoute(from, to) {
  const n = BOULEVARD.length, forward = (to - from + n) % n;
  const direction = forward <= n / 2 ? 1 : -1;
  const result = [BOULEVARD[from]];
  while (from !== to) { from = (from + direction + n) % n; result.push(BOULEVARD[from]); }
  return result;
}
export function inLake(x, z) { return Math.hypot(x / 31, z / 24) < 1 + 0.08 * Math.sin(Math.atan2(z, x) * 3); }
