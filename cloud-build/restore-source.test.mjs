import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cloud=path.dirname(fileURLToPath(import.meta.url));
test('a GitHub v5.1.0 tag restores feature source with consistent metadata and new assets',t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'zerostock-restoration-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  const dest=path.join(temp,'src');
  const run=spawnSync(process.execPath,[path.join(cloud,'restore-source.mjs'),dest,'v5.1.0'],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const pkg=JSON.parse(fs.readFileSync(path.join(dest,'package.json'),'utf8'));
  assert.equal(pkg.version,'5.1.0');assert.equal(pkg.dependencies['@capacitor/app'],'8.1.2');
  const html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
  assert.match(html,/content="5\.1\.0"/);assert.match(html,/id="cKind"/);assert.match(html,/src="\.\/articles.js"/);
  assert.match(fs.readFileSync(path.join(dest,'sw.js'),'utf8'),/'\.\/articles.js'/);
  assert.ok(pkg.scripts['test:all'].includes('test:offline-articles'));
});
test('restoration refuses to overwrite an existing development directory',t=>{
  const dest=fs.mkdtempSync(path.join(os.tmpdir(),'zerostock-preserved-'));t.after(()=>fs.rmSync(dest,{recursive:true,force:true}));
  fs.writeFileSync(path.join(dest,'user.txt'),'preserve');
  const run=spawnSync(process.execPath,[path.join(cloud,'restore-source.mjs'),dest,'5.1.0'],{encoding:'utf8'});
  assert.notEqual(run.status,0);assert.equal(fs.readFileSync(path.join(dest,'user.txt'),'utf8'),'preserve');
});
