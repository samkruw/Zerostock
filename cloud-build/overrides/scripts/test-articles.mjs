import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const source = new URL('../src/articles.mjs', import.meta.url);
const domain = existsSync(source) ? await import(source) : null;
const api = () => { assert.ok(domain, 'Article/configuration domain module is missing'); return domain; };
const articles = () => [
  {id:'C',article:'CON-A',name:'Container A',kind:'container',location:'L1',stock:10,min:0,warn:2},
  {id:'P',article:'PL-P',name:'Plate P',kind:'plate',location:'L2',stock:30,min:0,warn:2},
  {id:'Q',article:'PL-Q',name:'Plate Q',kind:'plate',location:'L3',stock:20,min:0,warn:2},
  {id:'K',article:'ALT',name:'Alter Karton',location:'L4',stock:100,min:0,warn:2},
];
const config = () => ({id:'setup',kind:'container',containerId:'C',materials:[
  {cartonId:'C',qty:1},{cartonId:'P',qty:4},{cartonId:'Q',qty:2},
]});

test('old records are cartons; an unknown explicit category is not a valid new article', () => {
  const A=api(); assert.equal(A.articleKind(articles()[3]),'carton');
  assert.throws(()=>A.validateArticle({...articles()[0],kind:'unknown'}));
});
test('article validation normalizes text and permits first classification only', () => {
  const A=api(), record={...articles()[1],article:' PL-P ',externalRef:' CT-P '};
  assert.equal(A.validateArticle(record).article,'PL-P');
  assert.equal(A.validateArticle(record).externalRef,'CT-P');
  assert.equal(A.validateArticle({...articles()[3],kind:'plate'},articles()[3]).kind,'plate');
  assert.throws(()=>A.validateArticle({...record,kind:'container'},record));
});
test('article quantities and thresholds reject unsafe, fractional or negative values', () => {
  const A=api();
  for(const stock of [-1,.5,Infinity,NaN,Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>A.validateArticle({...articles()[0],stock}));
  assert.throws(()=>A.validateArticle({...articles()[0],min:3,warn:2}));
  assert.throws(()=>A.validateArticle({...articles()[0],externalRef:'x'.repeat(121)}));
});
test('configuration storage contains one container plus typed plate quantities', () => {
  const A=api(), rows=[{cartonId:'P',qty:4},{cartonId:'Q',qty:2}];
  assert.deepEqual(A.configurationMaterials('C',rows,articles()),config().materials);
  assert.deepEqual(rows,[{cartonId:'P',qty:4},{cartonId:'Q',qty:2}]);
});
test('invalid, duplicate, missing or inactive components cannot become a configuration', () => {
  const A=api(), db=articles();
  for(const rows of [[],[{cartonId:'P',qty:0}],[{cartonId:'P',qty:1.2}],
    [{cartonId:'P',qty:2},{cartonId:'P',qty:2}],[{cartonId:'K',qty:2}],
    [{cartonId:'missing',qty:1}],[{cartonId:'C',qty:1}]]) {
    assert.throws(()=>A.configurationMaterials('C',rows,db));
  }
  assert.throws(()=>A.configurationMaterials('P',[{cartonId:'Q',qty:2}],db));
  assert.throws(()=>A.configurationMaterials('C',[{cartonId:'P',qty:2}],db.map(c=>c.id==='P'?{...c,active:false}:c)));
});
test('10 containers and 30/20 plates at 4/2 each allow seven; eight miss two P', () => {
  const A=api(), db=articles(), setup=config(), before=structuredClone({db,setup});
  const result=A.calculateConfiguration(setup,db,8);
  assert.equal(result.capacity,7);assert.equal(result.canFulfill,false);
  assert.equal(result.lines.find(x=>x.id==='P').required,32);
  assert.equal(result.lines.find(x=>x.id==='P').missing,2);
  assert.equal(result.lines.find(x=>x.id==='C').required,8);
  assert.equal(result.bottleneck,'P');
  assert.deepEqual({db,setup},before,'planning must not alter stock or configuration');
});
test('container stock itself limits capacity and zero stock yields zero', () => {
  const A=api(), db=articles();db[0].stock=2;
  assert.equal(A.calculateConfiguration(config(),db,2).capacity,2);
  assert.equal(A.calculateConfiguration(config(),db,2).canFulfill,true);
  db[0].stock=0;assert.equal(A.calculateConfiguration(config(),db,1).capacity,0);
});
test('calculator rejects bad stored configurations and bad order quantities', () => {
  const A=api();
  for(const n of [0,-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER]) assert.throws(()=>A.calculateConfiguration(config(),articles(),n));
  assert.throws(()=>A.calculateConfiguration({...config(),materials:config().materials.slice(1)},articles(),1));
  assert.throws(()=>A.calculateConfiguration({...config(),materials:[...config().materials,{cartonId:'C',qty:1}]},articles(),1));
  assert.throws(()=>A.calculateConfiguration(config(),articles().filter(x=>x.id!=='P'),1));
});
test('legacy movement metadata stays absent, so old retry payloads remain comparable', () => {
  const A=api();assert.deepEqual(A.movementMetadata({id:'old',cartonId:'K',qty:20}),{});
});
test('new movements snapshot article type/external reference and bounded booking metadata', () => {
  const A=api(), article={...articles()[0],externalRef:'CT-A'};
  const meta=A.createMovementMetadata(article,{partner:' Ziel ',reference:' REF-12 ',serialNumbers:['001']});
  assert.deepEqual(meta,{articleKind:'container',externalRef:'CT-A',partner:'Ziel',reference:'REF-12',serialNumbers:['001'],serialOrigins:['new']});
  assert.deepEqual(A.movementMetadata({...meta,stock:999,secret:'discard'}),meta);
  assert.throws(()=>A.createMovementMetadata(article,{partner:'x'.repeat(121),serialNumbers:['001']}));
  assert.throws(()=>A.movementMetadata({articleKind:'invalid'}));
});
test('container export uses immutable snapshots, with a legacy article lookup fallback', () => {
  const A=api(); const rows=A.containerMovementRows([
    {id:'one',cartonId:'C',article:'CON-A',type:'out',qty:3,ts:1000,userName:'Team',stockAfter:7,articleKind:'container',externalRef:'OLD',partner:'=FORMULA',reference:'REF'},
    {id:'legacy',cartonId:'C',article:'CON-A',type:'in',qty:2,ts:2000,userName:'Team',stockAfter:9},
    {id:'plate',cartonId:'P',article:'PL-P',type:'out',qty:4,ts:3000,articleKind:'plate'},
  ],articles());
  assert.equal(rows.length,2);assert.equal(rows[0].externalRef,'OLD');
  assert.equal(rows[0].partner,'=FORMULA','CSV formula neutralization belongs at serialization');
  assert.equal(rows[1].id,'legacy');assert.equal(rows[0].quantity,3);
});

test('existing container labels keep their spelling and assignment only identifies current stock',()=>{
  const A=api(), c=articles()[0];
  const labels=['00a/A.1','00A/A.1','[#]$'];
  assert.deepEqual(A.parseSerialNumbers(' 00a/A.1 \r\n00A/A.1\n[#]$\n'),labels);
  const tagged=A.assignContainerUnits(c,labels,12);
  assert.equal(tagged.stock,10); assert.equal(A.unassignedStock(tagged),7);
  assert.deepEqual(Object.values(tagged.containerUnits).map(x=>x.number),labels);
  for(const key of Object.keys(tagged.containerUnits))assert.doesNotMatch(key,/[.#$\[\]/]/);
  for(const bad of [['x',' x '],['x\ny'],[123],['x'.repeat(260)]])assert.throws(()=>A.parseSerialNumbers(bad));
  assert.throws(()=>A.assignContainerUnits(tagged,['00a/A.1'],13));
  assert.throws(()=>A.assignContainerUnits({...c,stock:1},labels,13));
  assert.equal(c.containerUnits,undefined);
});
test('serial movement quantity, state, partner and legacy stock floor stay consistent',()=>{
  const A=api(), c={...articles()[0],stock:1};
  const base={id:'one',ts:10,qty:1,type:'in',partner:'Depot',serialNumbers:['0007']};
  const added=A.applyStockMovement(c,base);
  assert.equal(added.stock,2);assert.equal(A.unassignedStock(added),1);
  assert.throws(()=>A.applyStockMovement(added,base));
  assert.throws(()=>A.applyStockMovement(added,{...base,type:'out',qty:2,serialNumbers:['0007','unknown']}));
  assert.throws(()=>A.applyStockMovement(added,{...base,type:'out',qty:2,serialNumbers:undefined}));
  const sent=A.applyStockMovement(added,{...base,id:'two',type:'out',partner:'Customer'});
  assert.throws(()=>A.applyStockMovement(sent,{...base,type:'out'}));
  assert.equal(Object.values(sent.containerUnits)[0].partner,'Customer');
  const returned=A.applyStockMovement(sent,{...base,id:'three'});
  const lost=A.applyStockMovement(returned,{...base,id:'four',type:'shrink'});
  assert.equal(A.applyStockMovement(lost,{...base,id:'five'}).stock,2);
  assert.throws(()=>A.applyStockMovement(articles()[1],base));
  assert.throws(()=>A.applyStockMovement(c,{...base,qty:2}));
  const meta=A.createMovementMetadata(c,{serialNumbers:base.serialNumbers});
  assert.deepEqual(meta.serialNumbers,['0007']);
  assert.deepEqual(A.containerMovementRows([{...base,...meta,cartonId:'C'}],[c])[0].serialNumbers,['0007']);
});

test('new container commands require labels while existing quantity-only movements remain replayable',()=>{
  const A=api(),c=articles()[0];
  assert.throws(()=>A.createMovementMetadata(c,{}),/Seriennummer/);
  const old={articleKind:'container',userId:'u',qty:2,type:'out',cartonId:'C',article:c.article};
  assert.equal(A.applyStockMovement(c,A.validateMovement(old)).stock,8);
});
