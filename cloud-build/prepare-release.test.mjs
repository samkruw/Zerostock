import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const cloud = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(cloud, 'prepare-release.mjs');
const archive = Buffer.from(fs.readdirSync(cloud).filter(n => /^source\.b64\.\d+$/.test(n)).sort().map(n => fs.readFileSync(path.join(cloud, n), 'utf8')).join(''), 'base64');
assert.equal(createHash('sha256').update(archive).digest('hex'), 'ece149cfe7e6d85414d82f5d6159ac452ee7faab73bc369a144c278973219ba4');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zerostock-release-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const zip = path.join(dir, 'source.zip');
  fs.writeFileSync(zip, archive);
  const root = path.join(dir, 'src');
  assert.equal(spawnSync('unzip', ['-q', zip, '-d', root]).status, 0);
  return root;
}
function prepare(root, version) {
  assert.ok(fs.existsSync(script), 'Release metadata preparation is missing');
  return spawnSync(process.execPath, [script, version], { cwd: root, encoding: 'utf8' });
}
function read(root, file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

test('Final has consistent install/update/cache version and preserves business data code', t => {
  const root = fixture(t);
  const protectedFiles = ['src/offline-core.js', 'src/native-scanner.js', 'database.rules.json', 'capacitor.config.json'];
  const before = protectedFiles.map(file => read(root, file));
  const html = read(root, 'index.html');
  const result = prepare(root, 'v5.0.0');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(read(root, 'package.json')).version, '5.0.0');
  assert.equal(read(root, 'index.html'), html.replace('content="5.0.0-rc.1"', 'content="5.0.0"'));
  assert.match(read(root, 'sw.js'), /const CACHE='zerostock-v5\.0\.0';/);
  assert.ok(!read(root, 'src/native-updates.js').includes("'5.0.0-rc.1'"));
  assert.match(read(root, 'src/native-updates.js'), /\|\|'5\.0\.0'/);
  assert.match(read(root, 'scripts/configure-version.mjs'), /\|\| '5\.0\.0'/);
  assert.deepEqual(protectedFiles.map(file => read(root, file)), before);
});

test('preparing Final twice is idempotent', t => {
  const root = fixture(t);
  assert.equal(prepare(root, '5.0.0').status, 0);
  const files = ['package.json', 'index.html', 'sw.js', 'src/native-updates.js', 'scripts/configure-version.mjs'];
  const first = files.map(file => read(root, file));
  assert.equal(prepare(root, '5.0.0').status, 0);
  assert.deepEqual(files.map(file => read(root, file)), first);
});

test('patch release upgrades Final consistently and is repeatable', t => {
  const root = fixture(t);
  assert.equal(prepare(root, '5.0.0').status, 0);
  const result = prepare(root, '5.0.1');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(read(root, 'package.json')).version, '5.0.1');
  assert.match(read(root, 'index.html'), /content="5\.0\.1"/);
  assert.match(read(root, 'sw.js'), /const CACHE='zerostock-v5\.0\.1';/);
  assert.match(read(root, 'src/native-updates.js'), /\|\|'5\.0\.1'/);
  assert.match(read(root, 'scripts/configure-version.mjs'), /\|\| '5\.0\.1'/);
  const first = read(root, 'index.html');
  assert.equal(prepare(root, '5.0.1').status, 0);
  assert.equal(read(root, 'index.html'), first);
});

test('RC1 preparation preserves its published cache and version', t => {
  const root = fixture(t);
  assert.equal(prepare(root, '5.0.0-rc.1').status, 0);
  assert.equal(JSON.parse(read(root, 'package.json')).version, '5.0.0-rc.1');
  assert.match(read(root, 'sw.js'), /const CACHE='zerostock-v5\.0-rc1';/);
});

test('invalid release versions are rejected before changing files', t => {
  const root = fixture(t);
  const before = read(root, 'package.json');
  for (const version of ['', '../5.0.0', '5.0.0\n', '5.0.0-rc.01', '5.0.01', '5.1.0']) {
    const result = prepare(root, version);
    assert.notEqual(result.status, 0, `Accepted invalid version ${JSON.stringify(version)}`);
    assert.equal(read(root, 'package.json'), before);
  }
});

test('wrong app ID cannot be relabeled as ZeroStock Final', t => {
  const root = fixture(t);
  const cap = JSON.parse(read(root, 'capacitor.config.json'));
  cap.appId = 'example.other.app';
  fs.writeFileSync(path.join(root, 'capacitor.config.json'), JSON.stringify(cap));
  assert.notEqual(prepare(root, '5.0.0').status, 0);
  assert.equal(JSON.parse(read(root, 'package.json')).version, '5.0.0-rc.1');
});

function androidFixture(t) {
  const root = fixture(t);
  fs.copyFileSync(path.join(cloud, 'configure-release.mjs'), path.join(root, 'scripts/configure-release.mjs'));
  fs.mkdirSync(path.join(root, 'android/app'), { recursive: true });
  fs.writeFileSync(path.join(root, 'android/app/build.gradle'), 'android {\n defaultConfig {\n  versionCode 1\n  versionName "1.0"\n }\n}\n');
  return root;
}

test('Android release uses the supplied increasing versionCode and Final name', t => {
  const root = androidFixture(t);
  const env = { ...process.env, ZEROSTOCK_VERSION_NAME: '5.0.0', ZEROSTOCK_VERSION_CODE: '24' };
  const result = spawnSync(process.execPath, ['scripts/configure-release.mjs'], { cwd: root, env, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(read(root, 'android/app/build.gradle'), /versionCode 24\b/);
  assert.match(read(root, 'android/app/build.gradle'), /versionName "5\.0\.0"/);
});

test('Android release refuses an absent or invalid versionCode', t => {
  const root = androidFixture(t);
  const env = { ...process.env, ZEROSTOCK_VERSION_NAME: '5.0.0' };
  delete env.ZEROSTOCK_VERSION_CODE;
  const before = read(root, 'android/app/build.gradle');
  for (const code of [undefined, '0', '2100000001']) {
    if (code === undefined) delete env.ZEROSTOCK_VERSION_CODE;
    else env.ZEROSTOCK_VERSION_CODE = code;
    const result = spawnSync(process.execPath, ['scripts/configure-release.mjs'], { cwd: root, env, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.equal(read(root, 'android/app/build.gradle'), before);
  }
});
