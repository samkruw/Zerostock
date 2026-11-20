import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { createMovementMetadata, movementMetadata, validateMovement, applyStockMovement, sameMovementIdentity, serialDependencies } from './articles.mjs';

const DB='zerostock';
const DB_VERSION=3;
let ready=false;

function native(){ return Capacitor.isNativePlatform(); }
function now(){ return Date.now(); }
function uuid(){ return globalThis.crypto?.randomUUID?.() || `zs-${now()}-${Math.random().toString(16).slice(2)}`; }

async function run(statement, values=[]){
  return CapacitorSQLite.run({database:DB,statement,values,transaction:false});
}
async function query(statement, values=[]){
  const out=await CapacitorSQLite.query({database:DB,statement,values});
  return out?.values || [];
}
async function execute(statements){
  return CapacitorSQLite.execute({database:DB,statements,transaction:true});
}

async function init(){
  if(!native()) return {available:false,reason:'web'};
  if(ready) return {available:true};
  try{
    await CapacitorSQLite.createConnection({database:DB,version:DB_VERSION,encrypted:false,mode:'no-encryption',readonly:false});
  }catch(e){
    // Hot reload / repeated init can leave an existing connection. Opening it is safe.
    if(!/already|exist|connection/i.test(String(e?.message||e))) throw e;
  }
  await CapacitorSQLite.open({database:DB});
  await execute(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cartons (
      id TEXT PRIMARY KEY NOT NULL,
      article TEXT NOT NULL,
      name TEXT,
      location TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 0,
      warn_stock INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      server_updated_at INTEGER NOT NULL DEFAULT 0,
      local_updated_at INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_cartons_article ON cartons(article);
    CREATE TABLE IF NOT EXISTS instructions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY NOT NULL,
      server_id TEXT,
      ts INTEGER NOT NULL,
      user_id TEXT,
      user_name TEXT,
      carton_id TEXT NOT NULL,
      article TEXT,
      type TEXT NOT NULL,
      qty INTEGER NOT NULL,
      reason TEXT,
      note TEXT,
      stock_before INTEGER,
      stock_after INTEGER,
      sync_status TEXT NOT NULL DEFAULT 'PENDING',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      payload_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_movements_ts ON movements(ts DESC);
    CREATE INDEX IF NOT EXISTS idx_movements_sync ON movements(sync_status);
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      next_retry_at INTEGER NOT NULL DEFAULT 0,
      last_attempt_at INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, next_retry_at, created_at);
    CREATE TABLE IF NOT EXISTS users_cache (
      uid TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      email TEXT,
      role TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      cached_at INTEGER NOT NULL,
      payload_json TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      source_key TEXT UNIQUE,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      status TEXT NOT NULL DEFAULT 'OPEN',
      reference_id TEXT,
      title TEXT NOT NULL,
      detail TEXT,
      action TEXT,
      icon TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      resolved_at INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status,priority,updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category,status);
  `);
  // Schema v2 migration for databases created by Phase 6. SQLite has no ADD COLUMN IF NOT EXISTS,
  // therefore each migration is intentionally best-effort and idempotent.
  for(const stmt of [
    `ALTER TABLE sync_queue ADD COLUMN next_retry_at INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE sync_queue ADD COLUMN last_attempt_at INTEGER NOT NULL DEFAULT 0`
  ]){ try{ await run(stmt); }catch(e){ if(!/duplicate column/i.test(String(e?.message||e))) console.warn('ZeroStock migration',e); } }
  // A killed app may leave rows in SYNCING. On next start they become retryable again.
  await run(`UPDATE sync_queue SET status='PENDING',updated_at=? WHERE status='SYNCING'`,[now()]);
  await run(`UPDATE movements SET sync_status='PENDING',updated_at=? WHERE sync_status='SYNCING'`,[now()]);
  await run(`INSERT OR REPLACE INTO metadata(key,value,updated_at) VALUES(?,?,?)`,['schema_version',String(DB_VERSION),now()]);
  ready=true;
  return {available:true};
}

// Keep remote snapshot projection and a native booking from interleaving on the same SQLite connection.
let stockWrites=Promise.resolve();
function serializeStockWrite(operation){
  const result=stockWrites.then(operation);
  stockWrites=result.catch(()=>{});
  return result;
}

async function cacheCartons(cartons=[]){
  return serializeStockWrite(()=>cacheCartonSnapshot(cartons));
}
async function cacheCartonSnapshot(cartons){
  await init();
  const rows=await query(`SELECT id,carton_id,type,qty,payload_json FROM movements
    WHERE sync_status IN ('PENDING','SYNCING','FAILED') ORDER BY created_at,rowid`);
  const pending=new Map();
  for(const row of rows){
    const list=pending.get(row.carton_id)||[];
    list.push({...safeJson(row.payload_json), id:row.id,type:row.type,qty:row.qty});
    pending.set(row.carton_id,list);
  }
  for(const server of cartons){
    const id=String(server.id||''); if(!id)continue;
    let c=server;
    for(const move of pending.get(id)||[]){
      if(server._zsApplied?.[move.id])continue;
      try{c=applyStockMovement(c,move);}
      catch(error){
        // A different device may already have dispatched this label. The sync engine
        // checks the live transaction and records the authoritative conflict.
        if(error.code!=='INVALID_CONTAINER_SERIAL'&&!/INSUFFICIENT_STOCK|INVALID_STOCK/.test(error.message))throw error;
      }
    }
    await run(`INSERT INTO cartons(id,article,name,location,stock,min_stock,warn_stock,active,server_updated_at,local_updated_at,payload_json)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET article=excluded.article,name=excluded.name,location=excluded.location,
      stock=excluded.stock,min_stock=excluded.min_stock,warn_stock=excluded.warn_stock,active=excluded.active,
      server_updated_at=excluded.server_updated_at,local_updated_at=excluded.local_updated_at,payload_json=excluded.payload_json`,
      [id,String(c.article||id),String(c.name||''),String(c.location||''),c.stock,Number(c.min)||0,Number(c.warn)||0,c.active===false?0:1,Number(c.updatedAt)||0,now(),JSON.stringify(c)]);
  }
  // This API receives the complete onValue snapshot, including an empty snapshot.
  // Movement/queue history is independent and remains available for recovery.
  const present=new Set(cartons.map(c=>String(c.id)));
  for(const row of await query('SELECT id FROM cartons')){
    if(!present.has(String(row.id)))await run('DELETE FROM cartons WHERE id=?',[row.id]);
  }
  await run(`INSERT OR REPLACE INTO metadata(key,value,updated_at) VALUES(?,?,?)`,['cartons_cached_at',String(now()),now()]);
  return getCartons();
}

async function getCartons(){
  await init();
  const rows=await query(`SELECT * FROM cartons ORDER BY article COLLATE NOCASE`);
  return rows.map(r=>({
    ...(safeJson(r.payload_json)||{}), id:r.id, article:r.article, name:r.name||'', location:r.location||'',
    stock:Number(r.stock)||0, min:Number(r.min_stock)||0, warn:Number(r.warn_stock)||0, active:Number(r.active)!==0,
    updatedAt:Number(r.server_updated_at)||0
  }));
}

async function cacheInstructions(items=[]){
  await init();
  for(const i of items){
    const id=String(i.id||''); if(!id) continue;
    await run(`INSERT INTO instructions(id,name,active,updated_at,payload_json) VALUES(?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name,active=excluded.active,updated_at=excluded.updated_at,payload_json=excluded.payload_json`,
      [id,String(i.name||''),i.active===false?0:1,Number(i.updatedAt)||now(),JSON.stringify(i)]);
  }
  const present=new Set(items.map(i=>String(i.id)));
  for(const row of await query('SELECT id FROM instructions')){
    if(!present.has(String(row.id)))await run('DELETE FROM instructions WHERE id=?',[row.id]);
  }
  return getInstructions();
}

async function getInstructions(){
  await init();
  const rows=await query(`SELECT payload_json,id,name,active,updated_at FROM instructions ORDER BY name COLLATE NOCASE`);
  return rows.map(r=>({...safeJson(r.payload_json),id:r.id,name:r.name||'',active:Number(r.active)!==0,updatedAt:Number(r.updated_at)||0}));
}

function cacheMovements(items=[]){return serializeStockWrite(()=>cacheMovementSnapshot(items));}
async function cacheMovementSnapshot(items){
  await init();
  for(const m of items){
    const sid=String(m.id||''); if(!sid) continue;
    // Phase 7 uses the local UUID as the Firebase movement key. If the same UUID exists
    // locally, reconcile that row instead of creating a duplicate `server:` row.
    const existing=await query(`SELECT id,payload_json FROM movements WHERE id=? LIMIT 1`,[sid]);
    if(existing.length&&!sameMovementIdentity(safeJson(existing[0].payload_json),m)){
      await markConflict(sid,'ID_COLLISION_OR_MOVEMENT_MISMATCH');
      existing.length=0;
    }
    const localId=existing.length?sid:`server:${sid}`;
    await run(`INSERT INTO movements(id,server_id,ts,user_id,user_name,carton_id,article,type,qty,reason,note,stock_before,stock_after,sync_status,created_at,updated_at,payload_json)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'SYNCED',?,?,?)
      ON CONFLICT(id) DO UPDATE SET server_id=excluded.server_id,ts=excluded.ts,user_id=excluded.user_id,user_name=excluded.user_name,carton_id=excluded.carton_id,
      article=excluded.article,type=excluded.type,qty=excluded.qty,reason=excluded.reason,note=excluded.note,stock_after=excluded.stock_after,
      sync_status='SYNCED',updated_at=excluded.updated_at,payload_json=excluded.payload_json`,
      [localId,sid,Number(m.ts)||now(),String(m.userId||''),String(m.userName||''),String(m.cartonId||''),String(m.article||''),String(m.type||''),Number(m.qty)||0,String(m.reason||''),String(m.note||''),null,Number(m.stockAfter)||0,now(),now(),JSON.stringify(m)]);
    if(existing.length){
      await run(`UPDATE sync_queue SET status='SYNCED',last_error=NULL,updated_at=? WHERE id=?`,[now(),sid]);
    }
  }
  return getMovements();
}

async function getMovements(limit=200){
  await init();
  const rows=await query(`SELECT * FROM movements ORDER BY ts DESC LIMIT ?`,[Number(limit)||200]);
  return rows.map(r=>({
    ...(safeJson(r.payload_json)||{}),id:r.id,serverId:r.server_id||undefined,ts:Number(r.ts)||0,userId:r.user_id||'',userName:r.user_name||'',
    cartonId:r.carton_id,article:r.article||'',type:r.type,qty:Number(r.qty)||0,reason:r.reason||'',note:r.note||'',stockBefore:r.stock_before==null?undefined:Number(r.stock_before),stockAfter:Number(r.stock_after)||0,syncStatus:r.sync_status
  }));
}

function recordMovement(input){
  return serializeStockWrite(()=>recordLocalMovement(input));
}
async function recordLocalMovement({cartonId,type,qty,reason='',note='',userId='',userName='',partner='',reference='',serialNumbers}){
  await init();
  await CapacitorSQLite.beginTransaction({database:DB});
  try{
    const rows=await query('SELECT * FROM cartons WHERE id=? LIMIT 1',[String(cartonId)]);
    const c=rows[0]; if(!c)throw Error('CARTON_NOT_FOUND_OFFLINE');
    const before=Number(c.stock),article={...safeJson(c.payload_json),stock:before};
    const id=uuid(),ts=now();
    const metadata=createMovementMetadata(article,{partner,reference,serialNumbers});
    const payload=validateMovement({id,ts,cartonId:String(cartonId),article:c.article,type,qty,reason,note,userId,userName,stockBefore:before,syncStatus:'PENDING',...metadata});
    const updated=applyStockMovement(article,payload),after=updated.stock,q=payload.qty;
    payload.stockAfter=after;
    await run('UPDATE cartons SET stock=?,payload_json=?,local_updated_at=? WHERE id=?',[after,JSON.stringify(updated),ts,String(cartonId)]);
    await run(`INSERT INTO movements(id,ts,user_id,user_name,carton_id,article,type,qty,reason,note,stock_before,stock_after,sync_status,created_at,updated_at,payload_json)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[id,ts,userId,userName,String(cartonId),c.article,type,q,reason,note,before,after,'PENDING',ts,ts,JSON.stringify(payload)]);
    await run(`INSERT INTO sync_queue(id,entity_type,entity_id,operation,payload_json,status,attempts,created_at,updated_at)
      VALUES(?,?,?,?,?,'PENDING',0,?,?)`,[id,'movement',id,'CREATE',JSON.stringify(payload),ts,ts]);
    await CapacitorSQLite.commitTransaction({database:DB});
    return payload;
  }catch(e){
    try{await CapacitorSQLite.rollbackTransaction({database:DB});}catch{}
    throw e;
  }
}

async function getPendingMovements(){
  await init();
  return getMovementsByStatus(['PENDING','FAILED','CONFLICT']);
}
async function getMovementsByStatus(statuses=[]){
  if(!statuses.length)return [];
  const marks=statuses.map(()=>'?').join(',');
  const rows=await query(`SELECT * FROM movements WHERE sync_status IN (${marks}) ORDER BY created_at,rowid`,statuses);
  return rows.map(r=>({...movementMetadata(safeJson(r.payload_json)||{}),id:r.id,ts:Number(r.ts)||0,userId:r.user_id||'',userName:r.user_name||'',cartonId:r.carton_id,article:r.article||'',type:r.type,qty:Number(r.qty)||0,reason:r.reason||'',note:r.note||'',stockBefore:Number(r.stock_before)||0,stockAfter:Number(r.stock_after)||0,syncStatus:r.sync_status}));
}

async function getSyncBatch(limit=20,userId=null){
  await init();
  const t=now();
  const rows=await query(`SELECT q.*,m.ts,m.user_id,m.user_name,m.carton_id,m.article,m.type,m.qty,m.reason,m.note,m.stock_before,m.stock_after,m.sync_status
    FROM sync_queue q JOIN movements m ON m.id=q.entity_id
    WHERE q.entity_type='movement' AND q.status IN ('PENDING','FAILED','SYNCING') ORDER BY q.created_at,q.rowid`);
  const blocked=new Set(),batch=[];
  for(const r of rows){
    const metadata=movementMetadata(safeJson(r.payload_json)||{});
    const labels=serialDependencies({...metadata,cartonId:r.carton_id});
    if(r.status==='SYNCING'||Number(r.next_retry_at)>t||(userId!==null&&r.user_id!==userId)||labels.some(key=>blocked.has(key))){
      for(const key of labels)blocked.add(key);
      continue;
    }
    batch.push({...metadata,id:r.id,entityId:r.entity_id,status:r.status,attempts:Number(r.attempts)||0,ts:Number(r.ts)||0,userId:r.user_id||'',userName:r.user_name||'',cartonId:r.carton_id,article:r.article||'',type:r.type,qty:Number(r.qty)||0,reason:r.reason||'',note:r.note||'',stockBefore:Number(r.stock_before)||0,stockAfter:Number(r.stock_after)||0,syncStatus:r.sync_status});
    if(batch.length>=(Number(limit)||20))break;
  }
  return batch;
}

async function markSyncing(id){
  await init(); const t=now();
  await run(`UPDATE sync_queue SET status='SYNCING',attempts=attempts+1,last_attempt_at=?,updated_at=? WHERE id=?`,[t,t,String(id)]);
  await run(`UPDATE movements SET sync_status='SYNCING',updated_at=? WHERE id=?`,[t,String(id)]);
}
async function markSynced(id,{serverId=id,stockAfter}={}){
  await init(); const t=now();
  await run(`UPDATE sync_queue SET status='SYNCED',last_error=NULL,next_retry_at=0,updated_at=? WHERE id=?`,[t,String(id)]);
  await run(`UPDATE movements SET server_id=?,sync_status='SYNCED',stock_after=COALESCE(?,stock_after),updated_at=? WHERE id=?`,[String(serverId),stockAfter==null?null:Number(stockAfter),t,String(id)]);
}
async function markRetry(id,error,nextRetryAt){
  await init(); const t=now();
  await run(`UPDATE sync_queue SET status='FAILED',last_error=?,next_retry_at=?,updated_at=? WHERE id=?`,[String(error||'SYNC_FAILED').slice(0,500),Number(nextRetryAt)||t,t,String(id)]);
  await run(`UPDATE movements SET sync_status='FAILED',updated_at=? WHERE id=?`,[t,String(id)]);
}
async function markConflict(id,error){
  await init(); const t=now();
  await run(`UPDATE sync_queue SET status='CONFLICT',last_error=?,next_retry_at=0,updated_at=? WHERE id=?`,[String(error||'CONFLICT').slice(0,500),t,String(id)]);
  await run(`UPDATE movements SET sync_status='CONFLICT',updated_at=? WHERE id=?`,[t,String(id)]);
}
async function applyServerStock(cartonId,stock,serverUpdatedAt=0){
  await init();
  await run(`UPDATE cartons SET stock=?,server_updated_at=?,local_updated_at=? WHERE id=?`,[Number(stock)||0,Number(serverUpdatedAt)||now(),now(),String(cartonId)]);
}
async function queueDetails(limit=100){
  await init();
  return query(`SELECT id,entity_type,entity_id,status,attempts,last_error,created_at,updated_at,next_retry_at,last_attempt_at FROM sync_queue ORDER BY created_at DESC LIMIT ?`,[Number(limit)||100]);
}

async function cacheUser(user={}){
  await init(); if(!user.uid)return;
  // Role/profile are security-relevant and are stored in Android secure storage when available.
  // SQLite keeps only a non-sensitive marker for migration/diagnostics.
  if(globalThis.ZeroStockSecure?.isNative?.()){
    await globalThis.ZeroStockSecure.setUser(user);
    await run(`INSERT INTO users_cache(uid,name,email,role,active,cached_at,payload_json) VALUES(?,?,?,?,?,?,?)
      ON CONFLICT(uid) DO UPDATE SET name=excluded.name,email=excluded.email,role=excluded.role,active=excluded.active,cached_at=excluded.cached_at,payload_json=excluded.payload_json`,
      [String(user.uid),'','','',user.active===false?0:1,now(),'{}']);
    return;
  }
  await run(`INSERT INTO users_cache(uid,name,email,role,active,cached_at,payload_json) VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(uid) DO UPDATE SET name=excluded.name,email=excluded.email,role=excluded.role,active=excluded.active,cached_at=excluded.cached_at,payload_json=excluded.payload_json`,
    [String(user.uid),String(user.name||''),String(user.email||''),String(user.role||''),user.active===false?0:1,now(),JSON.stringify(user)]);
}
async function getCachedUser(uid){
  await init();
  if(globalThis.ZeroStockSecure?.isNative?.()){
    const secure=await globalThis.ZeroStockSecure.getUser(uid);
    if(secure)return secure;
  }
  const rows=await query(`SELECT * FROM users_cache WHERE uid=? LIMIT 1`,[String(uid||'')]); const r=rows[0];
  const legacy=r?{...(safeJson(r.payload_json)||{}),uid:r.uid,name:r.name||'',email:r.email||'',role:r.role||'',active:Number(r.active)!==0,cachedAt:Number(r.cached_at)||0}:null;
  if(legacy?.role&&globalThis.ZeroStockSecure?.isNative?.()){try{await globalThis.ZeroStockSecure.setUser(legacy);await run(`UPDATE users_cache SET name='',email='',role='',payload_json='{}' WHERE uid=?`,[String(uid)])}catch{}}
  return legacy;
}



async function upsertTask(task={}){
  await init();const t=now();const sourceKey=String(task.sourceKey||task.source_key||task.id||uuid());
  const id=String(task.id||sourceKey);const payload={...task,id,sourceKey};
  await run(`INSERT INTO tasks(id,source_key,type,category,priority,status,reference_id,title,detail,action,icon,created_at,updated_at,resolved_at,payload_json)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,0,?)
    ON CONFLICT(source_key) DO UPDATE SET type=excluded.type,category=excluded.category,priority=excluded.priority,status='OPEN',reference_id=excluded.reference_id,title=excluded.title,detail=excluded.detail,action=excluded.action,icon=excluded.icon,updated_at=excluded.updated_at,resolved_at=0,payload_json=excluded.payload_json`,
    [id,sourceKey,String(task.type||'TASK'),String(task.category||'OTHER'),String(task.priority||'MEDIUM'),'OPEN',String(task.referenceId||''),String(task.title||task.type||'Task'),String(task.detail||''),String(task.action||''),String(task.icon||''),Number(task.createdAt)||t,t,JSON.stringify(payload)]);
  return id;
}
async function resolveTaskBySource(sourceKey){
  await init();const t=now();await run(`UPDATE tasks SET status='RESOLVED',resolved_at=?,updated_at=? WHERE source_key=? AND status='OPEN'`,[t,t,String(sourceKey)]);return true;
}
async function reconcileSystemTasks(activeTasks=[]){
  await init();const active=new Set(activeTasks.map(x=>String(x.sourceKey||x.id)).filter(Boolean));
  for(const task of activeTasks)await upsertTask(task);
  const rows=await query(`SELECT source_key FROM tasks WHERE status='OPEN' AND (source_key LIKE 'stock:%' OR source_key LIKE 'sync:%')`);
  for(const r of rows)if(!active.has(String(r.source_key)))await resolveTaskBySource(r.source_key);
  return getTasks('OPEN',250);
}
async function getTasks(status='OPEN',limit=250){
  await init();let rows;
  if(status==='ALL') rows=await query(`SELECT * FROM tasks ORDER BY updated_at DESC LIMIT ?`,[Number(limit)||250]);
  else rows=await query(`SELECT * FROM tasks WHERE status=? ORDER BY CASE priority WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, updated_at DESC LIMIT ?`,[String(status),Number(limit)||250]);
  return rows.map(r=>({...(safeJson(r.payload_json)||{}),id:r.id,sourceKey:r.source_key,type:r.type,category:r.category,priority:r.priority,status:r.status,referenceId:r.reference_id||'',title:r.title,detail:r.detail||'',action:r.action||'',icon:r.icon||'',createdAt:Number(r.created_at)||0,updatedAt:Number(r.updated_at)||0,resolvedAt:Number(r.resolved_at)||0}));
}
async function createTask(task={}){
  const id=task.id||uuid();return upsertTask({...task,id,sourceKey:task.sourceKey||`manual:${id}`});
}

async function getSetting(key, fallback=null){
  await init();
  const rows=await query(`SELECT value FROM settings WHERE key=? LIMIT 1`,[String(key)]);
  if(!rows.length)return fallback;
  const raw=rows[0].value;
  try{return JSON.parse(raw)}catch{return raw}
}
async function setSetting(key,value){
  await init();
  const raw=typeof value==='string'?value:JSON.stringify(value);
  await run(`INSERT INTO settings(key,value,updated_at) VALUES(?,?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`,[String(key),String(raw),now()]);
  return true;
}

async function stats(){
  await init();
  const pending=await query(`SELECT COUNT(*) AS n FROM sync_queue WHERE status IN ('PENDING','SYNCING','FAILED','CONFLICT')`);
  const cartons=await query(`SELECT COUNT(*) AS n FROM cartons`);
  const moves=await query(`SELECT COUNT(*) AS n FROM movements`);
  const conflicts=await query(`SELECT COUNT(*) AS n FROM sync_queue WHERE status='CONFLICT'`);
  const failed=await query(`SELECT COUNT(*) AS n FROM sync_queue WHERE status='FAILED'`);
  const syncing=await query(`SELECT COUNT(*) AS n FROM sync_queue WHERE status='SYNCING'`);
  const tasks=await query(`SELECT COUNT(*) AS n FROM tasks WHERE status='OPEN'`);
  return {pending:Number(pending[0]?.n)||0,conflicts:Number(conflicts[0]?.n)||0,failed:Number(failed[0]?.n)||0,syncing:Number(syncing[0]?.n)||0,cartons:Number(cartons[0]?.n)||0,movements:Number(moves[0]?.n)||0,tasks:Number(tasks[0]?.n)||0};
}

function safeJson(v){ try{return v?JSON.parse(v):{};}catch{return{};} }

window.ZeroStockOffline={
  isNativeAvailable:native,
  init,cacheCartons,getCartons,cacheInstructions,getInstructions,cacheMovements,getMovements,recordMovement,getPendingMovements,getSyncBatch,markSyncing,markSynced,markRetry,markConflict,applyServerStock,queueDetails,cacheUser,getCachedUser,upsertTask,resolveTaskBySource,reconcileSystemTasks,getTasks,createTask,getSetting,setSetting,stats,
  schemaVersion:DB_VERSION,database:DB
};
