import fs from 'node:fs';

const input = process.argv[2] ?? process.env.ZEROSTOCK_RELEASE_VERSION ?? '';
const version = input.startsWith('v') ? input.slice(1) : input;
const valid = value => value === value.trim() && /^5\.0\.0(?:-rc\.[1-9]\d*)?$/.test(value);
if (!valid(version)) throw new Error('Expected a 5.0.0 release or 5.0.0-rc.N version.');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const cap = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));
if (pkg.name !== 'zerostock-v5' || cap.appId !== 'ch.zerogen.zerostock' || !valid(pkg.version)) {
  throw new Error('Unexpected ZeroStock source or application ID.');
}
const current = pkg.version;
const cache = value => value === '5.0.0-rc.1' ? 'zerostock-v5.0-rc1' : `zerostock-v${value}`;
const html = fs.readFileSync('index.html', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const updater = fs.readFileSync('src/native-updates.js', 'utf8');
const androidVersion = fs.readFileSync('scripts/configure-version.mjs', 'utf8');
if (!html.includes(`content="${current}"`) || !sw.includes(`const CACHE='${cache(current)}';`) ||
    !updater.includes(`'${current}'`) || !androidVersion.includes(`|| '${current}'`)) {
  throw new Error('Inconsistent source version metadata; no files were changed.');
}

pkg.version = version;
pkg.description = pkg.description.replace(/Release Candidate \d+|Final/, version.includes('-rc.') ? `Release Candidate ${version.split('.').at(-1)}` : 'Final');
const updates = {
  'package.json': JSON.stringify(pkg, null, 2) + '\n',
  'index.html': html.replace(`content="${current}"`, `content="${version}"`),
  'sw.js': sw.replace(`const CACHE='${cache(current)}';`, `const CACHE='${cache(version)}';`),
  'src/native-updates.js': updater.replaceAll(`'${current}'`, `'${version}'`),
  'scripts/configure-version.mjs': androidVersion.replace(`|| '${current}'`, `|| '${version}'`),
};
for (const [file, contents] of Object.entries(updates)) fs.writeFileSync(file, contents);
console.log(`Prepared ZeroStock ${version}; service-worker cache ${cache(version)}.`);
