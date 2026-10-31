import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
const scanner=fs.readFileSync('src/native-scanner.js','utf8');
const offline=fs.readFileSync('src/offline-core.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const checks=[];
function ok(name,cond){ if(!cond) throw new Error(`FAIL: ${name}`); checks.push(name); }
ok('booking double-tap lock', /bookSubmitting/.test(html) && /if\(S\.bookSubmitting\)return/.test(html));
ok('scan de-duplication lock', /scanLock/.test(html) && /lastScanValue/.test(html));
ok('native scanner event lock', /detectionLocked/.test(scanner));
ok('sync timeout watchdog', /withTimeout\(syncOneMovement\(move\),20000,'SYNC_TIMEOUT'\)/.test(html));
ok('online recovery listener', /addEventListener\('online'/.test(html));
ok('offline state listener', /addEventListener\('offline'/.test(html));
ok('foreground sync recovery', /visibilitychange/.test(html));
ok('crash recovery resets SYNCING', /status='PENDING'.*status='SYNCING'/.test(offline));
ok('idempotent UUID movement primary key', /CREATE TABLE IF NOT EXISTS movements[\s\S]*id TEXT PRIMARY KEY/.test(offline));
ok('sync queue durable primary key', /CREATE TABLE IF NOT EXISTS sync_queue[\s\S]*id TEXT PRIMARY KEY/.test(offline));
ok('android package present', fs.existsSync('capacitor.config.json'));
ok('phase version 5.0.x family', /^5\.0\.(?:0|[1-9]\d*)(?:-rc\.[1-9]\d*)?$/.test(pkg.version));
// Pure logic simulation: same event id must only alter stock once.
function apply(state,m){ if(state.applied.has(m.id)) return state.stock; if(m.type!=='in'&&m.qty>state.stock) throw Error('INSUFFICIENT'); state.stock=Math.max(0,state.stock+(m.type==='in'?m.qty:-m.qty)); state.applied.add(m.id); return state.stock; }
const state={stock:100,applied:new Set()}; apply(state,{id:'u1',type:'out',qty:10}); apply(state,{id:'u1',type:'out',qty:10}); ok('idempotency simulation',state.stock===90);
let blocked=false; try{apply({stock:3,applied:new Set()},{id:'u2',type:'out',qty:4})}catch{blocked=true} ok('insufficient stock simulation',blocked);
console.log(`Phase 12 tests OK (${checks.length}):\n- ${checks.join('\n- ')}`);
