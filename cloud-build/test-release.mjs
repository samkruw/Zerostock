import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = (process.env.ZEROSTOCK_RELEASE_VERSION || pkg.version).replace(/^v/, '');
const html = fs.readFileSync('index.html', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const src = fs.readFileSync('src/native-updates.js', 'utf8');
const bundle = fs.readFileSync('native-updates.js', 'utf8');
const checks = [];
function ok(name, condition) {
  if (!condition) throw new Error(`FAIL: ${name}`);
  checks.push(name);
}
ok('package matches selected release', /^5\.0\.(?:0|[1-9]\d*)(?:-rc\.[1-9]\d*)?$/.test(version) && pkg.version === version);
const htmlVersion = html.match(/meta name="app-version" content="([^"]+)"/)?.[1];
ok('web app version matches selected release', htmlVersion === version);
const cache = version === '5.0.0-rc.1' ? 'zerostock-v5.0-rc1' : `zerostock-v${version}`;
ok('service worker cache matches selected release', sw.includes(`const CACHE='${cache}';`));

const helper = path.resolve('scripts/configure-release.mjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'zerostock-version-gates-'));
const results = [];
let codesValid = true;
try {
  for (const extension of ['gradle', 'gradle.kts']) {
    const root = path.join(temp, extension);
    fs.mkdirSync(path.join(root, 'android/app'), { recursive: true });
    const file = path.join(root, `android/app/build.${extension}`);
    const equals = extension === 'gradle.kts' ? '= ' : '';
    fs.writeFileSync(file, `android {\n defaultConfig {\n versionCode ${equals}1\n versionName ${equals}"1.0"\n }\n}\n`);
    const env = { ...process.env, ZEROSTOCK_VERSION_NAME: version, ZEROSTOCK_VERSION_CODE: '24' };
    const run = () => spawnSync(process.execPath, [helper], { cwd: root, env, encoding: 'utf8' });
    const configured = run();
    if (configured.status !== 0) throw new Error(configured.stderr);
    const actual = fs.readFileSync(file, 'utf8');
    results.push(actual.match(/versionName\s*(?:=\s*)?"([^"]+)"/)?.[1]);
    codesValid &&= /versionCode\s*(?:=\s*)?24\b/.test(actual);
    env.ZEROSTOCK_VERSION_CODE = '25';
    codesValid &&= run().status === 0 && /versionCode\s*(?:=\s*)?25\b/.test(fs.readFileSync(file, 'utf8'));
    const beforeInvalid = fs.readFileSync(file, 'utf8');
    env.ZEROSTOCK_VERSION_CODE = '0';
    codesValid &&= run().status !== 0 && fs.readFileSync(file, 'utf8') === beforeInvalid;
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
ok('Android versionName follows release for Groovy and Kotlin', results.length === 2 && results.every(name => name === version));
ok('Android versionCode increases and rejects invalid input', codesValid);
ok('native updater retains prerelease support', src.includes('compareSemver') && src.includes('parseSemver'));

let meta = { content: htmlVersion };
const context = vm.createContext({
  console, URL, setTimeout, clearTimeout, window: {},
  document: { querySelector: () => meta },
  localStorage: { getItem: () => null, setItem() {} },
});
vm.runInContext(bundle, context);
const updates = context.ZeroStockUpdates;
const withMeta = await updates.currentVersion();
meta = null;
ok('built updater reports release with and without HTML metadata', withMeta === version && await updates.currentVersion() === version);
ok('final 5.0.0 is newer than RC1', updates.isNewer('5.0.0', '5.0.0-rc.1'));
ok('RC2 is newer than RC1', updates.isNewer('5.0.0-rc.2', '5.0.0-rc.1'));
ok('older patch is not newer', !updates.isNewer('4.9.9', '5.0.0-rc.1'));
console.log(`Release tests OK (${checks.length}):\n- ${checks.join('\n- ')}`);
