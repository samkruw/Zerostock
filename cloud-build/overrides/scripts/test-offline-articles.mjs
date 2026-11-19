import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { createMovementMetadata, movementMetadata, validateMovement } from '../src/articles.mjs';

const source = fs.readFileSync(new URL('../src/offline-core.js',import.meta.url),'utf8')
  .replace(/^import[^\n]*\n/gm,'');
const plain = value => JSON.parse(JSON.stringify(value));
function fixture(t) {
  const db = new DatabaseSync(':memory:'); t.after(()=>db.close());
  const state = {failQueue:false};
  const sqlite = {
    async createConnection(){}, async open(){},
    async execute({statements}){ db.exec(statements); },
    async run({statement,values=[]}){
      if(state.failQueue && statement.includes('INSERT INTO sync_queue')) throw Error('TEST_IO_FAILURE');
      const result=db.prepare(statement).run(...values);
      return {changes:{changes:Number(result.changes),lastId:Number(result.lastInsertRowid)}};
    },
    async query({statement,values=[]}){return {values:db.prepare(statement).all(...values)};},
    async beginTransaction(){db.exec('BEGIN TRANSACTION');},
    async commitTransaction(){db.exec('COMMIT');},
    async rollbackTransaction(){db.exec('ROLLBACK');},
  };
  function load() {
    const context=vm.createContext({console,window:{},crypto:{randomUUID},
      Capacitor:{isNativePlatform:()=>true},CapacitorSQLite:sqlite,createMovementMetadata,movementMetadata,validateMovement});
    vm.runInContext(source,context);
    return context.window.ZeroStockOffline;
  }
  return {db,state,load,offline:load()};
}
const articles = [
  {id:'C',article:'CON-A',name:'Container',kind:'container',externalRef:'CT-A',stock:10,min:0,warn:2,location:'L1'},
  {id:'P',article:'PL-P',name:'Plate',kind:'plate',stock:30,min:0,warn:2,location:'L2'},
  {id:'K',article:'ALT',name:'Alter Karton',stock:100,min:0,warn:2,location:'L3'},
];

test('typed articles and configurations survive real SQLite cache/reload',async t=>{
  const f=fixture(t); await f.offline.cacheCartons(articles);
  await f.offline.cacheInstructions([{id:'cfg',name:'Setup',kind:'container',containerId:'C',active:true,materials:[{cartonId:'C',qty:1},{cartonId:'P',qty:4}]}]);
  const restarted=f.load(); await restarted.init();
  assert.equal((await restarted.getCartons()).find(x=>x.id==='C').externalRef,'CT-A');
  assert.equal((await restarted.getInstructions())[0].kind,'container');
  await restarted.cacheInstructions([]);
  assert.equal((await restarted.getInstructions()).length,0);
});
test('container exit changes only its stock and preserves metadata in all queue views',async t=>{
  const f=fixture(t); await f.offline.cacheCartons(articles);
  const move=await f.offline.recordMovement({cartonId:'C',type:'out',qty:3,userId:'u',userName:'Team',partner:'Kunde',reference:'REF-3'});
  const stock=await f.offline.getCartons();
  assert.equal(stock.find(x=>x.id==='C').stock,7);assert.equal(stock.find(x=>x.id==='P').stock,30);
  for(const m of [move,(await f.offline.getMovements())[0],(await f.offline.getSyncBatch())[0],(await f.offline.getPendingMovements())[0]]) {
    assert.equal(m.articleKind,'container'); assert.equal(m.externalRef,'CT-A');
    assert.equal(m.partner,'Kunde'); assert.equal(m.reference,'REF-3');
  }
  await f.offline.markSyncing(move.id);
  const restarted=f.load(); await restarted.init();
  assert.equal((await restarted.getSyncBatch())[0].reference,'REF-3');
  await restarted.markRetry(move.id,'NETWORK',0);
  assert.equal((await restarted.getSyncBatch())[0].partner,'Kunde');
});
test('plate receipt and legacy carton booking snapshot the correct categories',async t=>{
  const f=fixture(t); await f.offline.cacheCartons(articles);
  const p=await f.offline.recordMovement({cartonId:'P',type:'in',qty:4,userId:'u'});
  const k=await f.offline.recordMovement({cartonId:'K',type:'out',qty:20,userId:'u'});
  assert.equal(p.articleKind,'plate');assert.equal(k.articleKind,'carton');
  const rows=await f.offline.getCartons();assert.equal(rows.find(x=>x.id==='P').stock,34);assert.equal(rows.find(x=>x.id==='K').stock,80);
});
test('pre-upgrade pending movements keep absent metadata through sync batching',async t=>{
  const f=fixture(t); await f.offline.cacheCartons(articles);
  const payload={id:'legacy',cartonId:'K',article:'ALT',type:'out',qty:20,userId:'u',userName:'Team',stockBefore:100,stockAfter:80,ts:1};
  f.db.prepare(`INSERT INTO movements(id,ts,user_id,user_name,carton_id,article,type,qty,stock_before,stock_after,sync_status,created_at,updated_at,payload_json)
    VALUES('legacy',1,'u','Team','K','ALT','out',20,100,80,'PENDING',1,1,?)`).run(JSON.stringify(payload));
  f.db.prepare(`INSERT INTO sync_queue(id,entity_type,entity_id,operation,payload_json,status,created_at,updated_at)
    VALUES('legacy','movement','legacy','CREATE',?,'PENDING',1,1)`).run(JSON.stringify(payload));
  const move=plain((await f.offline.getSyncBatch())[0]);
  assert.equal(move.qty,20); assert.equal('articleKind' in move,false);assert.equal('externalRef' in move,false);
});
test('invalid metadata and fractional quantities cannot cause partial stock changes',async t=>{
  const f=fixture(t); await f.offline.cacheCartons(articles);
  await assert.rejects(()=>f.offline.recordMovement({cartonId:'C',type:'out',qty:1,partner:'x'.repeat(121)}));
  await assert.rejects(()=>f.offline.recordMovement({cartonId:'C',type:'out',qty:1.5}));
  assert.equal((await f.offline.getCartons()).find(x=>x.id==='C').stock,10);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM movements').get().n,0);
});
test('a queue write failure rolls back real SQLite stock and movement writes',async t=>{
  const f=fixture(t); await f.offline.cacheCartons(articles);f.state.failQueue=true;
  await assert.rejects(()=>f.offline.recordMovement({cartonId:'C',type:'out',qty:1,userId:'u',partner:'Kunde'}),/TEST_IO_FAILURE/);
  assert.equal((await f.offline.getCartons()).find(x=>x.id==='C').stock,10);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM movements').get().n,0);
});
test('a receipt that would overflow a safe stock count is rejected before writing',async t=>{
  const f=fixture(t);await f.offline.cacheCartons([{...articles[0],stock:Number.MAX_SAFE_INTEGER}]);
  await assert.rejects(()=>f.offline.recordMovement({cartonId:'C',type:'in',qty:1,userId:'u'}));
  assert.equal((await f.offline.getCartons())[0].stock,Number.MAX_SAFE_INTEGER);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM movements').get().n,0);
});
test('authoritative snapshots remove missing articles while retaining queued movement history',async t=>{
  const f=fixture(t);await f.offline.cacheCartons(articles);
  const move=await f.offline.recordMovement({cartonId:'P',type:'out',qty:1,userId:'a'});
  const refreshed=await f.offline.cacheCartons(articles.filter(c=>c.id!=='P'));
  assert.equal(refreshed.some(c=>c.id==='P'),false);
  assert.equal((await f.offline.getSyncBatch(20,'a'))[0].id,move.id);
  await f.offline.cacheCartons([]);assert.equal((await f.offline.getCartons()).length,0);
});
test('sync batches select only the authenticated actor without consuming another actor queue',async t=>{
  const f=fixture(t);await f.offline.cacheCartons(articles);
  const a=await f.offline.recordMovement({cartonId:'C',type:'out',qty:1,userId:'a'});
  const b=await f.offline.recordMovement({cartonId:'C',type:'out',qty:1,userId:'b'});
  assert.deepEqual(plain(await f.offline.getSyncBatch(20,'b')).map(m=>m.id),[b.id]);
  assert.deepEqual(plain(await f.offline.getSyncBatch(20,'a')).map(m=>m.id),[a.id]);
});
test('journal text rejected by Firebase cannot enter the local stock transaction',async t=>{
  const f=fixture(t);await f.offline.cacheCartons(articles);
  await assert.rejects(()=>f.offline.recordMovement({cartonId:'C',type:'out',qty:1,userId:'a',note:'x'.repeat(1001)}));
  await assert.rejects(()=>f.offline.recordMovement({cartonId:'C',type:'out',qty:1,userId:'a',reason:'x'.repeat(501)}));
  assert.equal((await f.offline.getCartons()).find(c=>c.id==='C').stock,10);
  assert.equal((await f.offline.getSyncBatch()).length,0);
});
test('server-applied pending movements are not subtracted a second time in cached stock',async t=>{
  const f=fixture(t);await f.offline.cacheCartons(articles);
  const first=await f.offline.recordMovement({cartonId:'C',type:'out',qty:2,userId:'a'});
  const snapshot={...articles[0],stock:8,_zsApplied:{[first.id]:{stockAfter:8,userId:'a'}}};
  assert.equal((await f.offline.cacheCartons([snapshot])).find(c=>c.id==='C').stock,8);
  await f.offline.recordMovement({cartonId:'C',type:'out',qty:1,userId:'b'});
  assert.equal((await f.offline.cacheCartons([snapshot])).find(c=>c.id==='C').stock,7);
});
