import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, set, get, update } from 'firebase/database';

const address=process.env.FIREBASE_DATABASE_EMULATOR_HOST || '';
assert.match(address,/^(127\.0\.0\.1|localhost):\d+$/,'Tests require a local emulator, never a production database');
const [host,port]=address.split(':');
let env;
const article=(id,kind)=>({id,article:id,name:id,location:'L1',stock:10,warn:2,min:0,...(kind?{kind}: {})});
before(async()=>{
  env=await initializeTestEnvironment({projectId:'demo-zerostock-articles',database:{host,port:Number(port),rules:fs.readFileSync('database.rules.json','utf8')}});
});
after(async()=>{await env?.cleanup();});
beforeEach(async()=>{
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async c=>set(ref(c.database()),{
    users:{admin:{name:'Admin',role:'admin',active:true},staff:{name:'Team',role:'employee',active:true},customer:{name:'Kunde',role:'customer',active:true},disabled:{name:'Gesperrt',role:'employee',active:false}},
    cartons:{C:{...article('C','container'),externalRef:'CT-C'},P:article('P','plate'),K:article('K')},
  }));
});
const db=uid=>env.authenticatedContext(uid).database();

test('staff can book stock while preserving type but cannot relabel an article or external reference',async()=>{
  await assertSucceeds(update(ref(db('staff'),'cartons/C'),{stock:7}));
  await assertFails(update(ref(db('staff'),'cartons/C'),{kind:'plate'}));
  await assertFails(update(ref(db('staff'),'cartons/C'),{externalRef:'different'}));
});
test('an explicit category cannot be removed by an old whole-record edit',async()=>{
  await assertFails(set(ref(db('admin'),'cartons/C'),article('C')));
  await assertSucceeds(set(ref(db('admin'),'cartons/N'),article('N')));
  await assertSucceeds(update(ref(db('admin'),'cartons/K'),{kind:'plate'}));
});
test('invalid categories and overlong external references are rejected for new records',async()=>{
  await assertFails(set(ref(db('admin'),'cartons/N'),article('N','unknown')));
  await assertFails(set(ref(db('admin'),'cartons/N'),{...article('N','container'),externalRef:'x'.repeat(121)}));
});
test('legacy staff stock updates remain allowed and customers cannot read internal stock',async()=>{
  await assertSucceeds(update(ref(db('staff'),'cartons/K'),{stock:8}));
  await assertFails(get(ref(db('customer'),'cartons')));
  await assertFails(get(ref(db('customer'),'movements')));
  await assertFails(update(ref(db('disabled'),'cartons/K'),{stock:8}));
});
const movement=extra=>({userId:'staff',cartonId:'C',article:'C',type:'out',qty:3,stockAfter:7,...extra});
test('new and legacy movements are accepted, bounded metadata and actor identity are enforced',async()=>{
  await assertSucceeds(set(ref(db('staff'),'movements/old'),movement({})));
  await assertSucceeds(set(ref(db('staff'),'movements/new'),movement({articleKind:'container',partner:'Kunde',reference:'REF',externalRef:'CT-C'})));
  await assertFails(set(ref(db('staff'),'movements/invalid'),movement({partner:'x'.repeat(121)})));
  await assertFails(set(ref(db('staff'),'movements/invalidKind'),movement({articleKind:'unknown'})));
  await assertFails(set(ref(db('staff'),'movements/identity'),movement({userId:'admin'})));
  await assertFails(set(ref(db('staff'),'movements/new'),movement({reference:'changed'})));
});
test('container configurations require the target once at row zero and actual plate components',async()=>{
  const cfg={id:'cfg',name:'Setup',kind:'container',containerId:'C',active:true,version:'1.0',materials:[{cartonId:'C',qty:1},{cartonId:'P',qty:4}]};
  await assertSucceeds(set(ref(db('admin'),'instructions/cfg'),cfg));
  await assertFails(set(ref(db('staff'),'instructions/staff'),{...cfg,id:'staff'}));
  await assertFails(set(ref(db('admin'),'instructions/wrong'),{...cfg,id:'wrong',materials:[{cartonId:'C',qty:1},{cartonId:'K',qty:4}]}));
  await assertFails(set(ref(db('admin'),'instructions/twice'),{...cfg,id:'twice',materials:[{cartonId:'C',qty:1},{cartonId:'C',qty:1}]}));
  await assertFails(set(ref(db('admin'),'instructions/fraction'),{...cfg,id:'fraction',materials:[{cartonId:'C',qty:1},{cartonId:'P',qty:1.5}]}));
});

test('stock assignment, state snapshots and immutable serial journals respect live roles',async()=>{
  const staff=db('staff'),unit={number:'007',status:'in',updatedAt:1},units={s303037:unit};
  await assertSucceeds(update(ref(staff,'cartons/C'),{containerUnits:units,serialStock:1}));
  await assertFails(update(ref(staff,'cartons/C'),{stock:0}));
  await assertFails(update(ref(staff,'cartons/C'),{containerUnits:null,serialStock:null}));
  await assertFails(set(ref(db('admin'),'cartons/C'),null));
  await assertFails(update(ref(staff,'cartons/P'),{containerUnits:units,serialStock:1}));
  await assertFails(update(ref(staff,'cartons/C/containerUnits/s303037'),{number:'008'}));
  await assertFails(update(ref(staff,'cartons/C/containerUnits/s303037'),{status:'whatever'}));
  await assertFails(get(ref(db('customer'),'cartons/C/containerUnits')));
  await assertSucceeds(set(ref(staff,'movements/labeled'),movement({articleKind:'container',qty:1,serialNumbers:['007']})));
  await assertFails(update(ref(staff,'movements/labeled'),{serialNumbers:['other']}));
  await assertFails(set(ref(staff,'movements/mismatch'),movement({articleKind:'container',qty:2,serialNumbers:['007']})));
  await assertFails(set(ref(staff,'movements/plate'),movement({cartonId:'P',article:'P',articleKind:'plate',qty:1,serialNumbers:['007']})));
});
