import assert from 'node:assert/strict';
import {DISTRICTS} from '../js/data.js';
import {PRODUCT_BRIEFS} from '../js/product-briefs.js';
const official=url=>{const u=new URL(url);return u.protocol==='https:'&&(u.hostname==='microsoft.com'||u.hostname.endsWith('.microsoft.com'));};
for(const d of DISTRICTS){
 const b=PRODUCT_BRIEFS[d.id];assert.ok(b,d.id);
 for(const key of ['summary','value','decision','metrics'])assert.ok(b[key].length>40,`${d.id}: ${key}`);
 assert.ok(b.useCases.length>=2);assert.ok(official(b.source));
 if(b.video){assert.ok(official(b.video.src));assert.ok(official(b.video.source));assert.ok(b.video.title);}
}
assert.equal(Object.keys(PRODUCT_BRIEFS).length,DISTRICTS.length);
console.log(`PASS ${DISTRICTS.length} complete executive briefs, official source URLs and video provenance`);
