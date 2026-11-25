import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const cloud = path.dirname(fileURLToPath(import.meta.url));
const repository = path.dirname(cloud);
const destination = path.resolve(process.argv[2] || '');
const version = (process.argv[3] || '5.1.0').replace(/^v/, '');
if (!process.argv[2] || destination === repository ||
    (fs.existsSync(destination) && fs.readdirSync(destination).length)) {
  throw new Error('Supply a new or empty build directory; existing source is never overwritten.');
}
if (!/^5\.(?:[1-9]\d*)\.(?:0|[1-9]\d*)(?:-rc\.[1-9]\d*)?$/.test(version)) {
  throw new Error('Feature source requires a 5.1.0-or-later 5.x release.');
}
const data = Buffer.from(fs.readdirSync(cloud).filter(n => /^source\.b64\.\d+$/.test(n))
  .sort().map(n => fs.readFileSync(path.join(cloud,n),'utf8')).join(''), 'base64');
if (createHash('sha256').update(data).digest('hex') !== 'ece149cfe7e6d85414d82f5d6159ac452ee7faab73bc369a144c278973219ba4') {
  throw new Error('Original source archive checksum mismatch.');
}
function run(command, args, options = {}) {
  const result = spawnSync(command,args,{encoding:'utf8',maxBuffer:8*1024*1024,...options});
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || result.error?.message);
  if (result.stdout) process.stdout.write(result.stdout);
}
const temporary = fs.mkdtempSync(path.join(os.tmpdir(),'zerostock-source-'));
try {
  const archive = path.join(temporary,'source.zip'); fs.writeFileSync(archive,data);
  fs.mkdirSync(destination,{recursive:true}); run('unzip',['-q',archive,'-d',destination]);
  for (const name of ['configure-release.mjs','prepare-release.mjs','test-phase12.mjs']) {
    fs.copyFileSync(path.join(cloud,name),path.join(destination,'scripts',name));
  }
  fs.copyFileSync(path.join(cloud,'test-release.mjs'),path.join(destination,'scripts/test-rc.mjs'));
  for (const name of fs.readdirSync(cloud).filter(n => /^RELEASE-NOTES-v.*\.md$/.test(n))) {
    fs.copyFileSync(path.join(cloud,name),path.join(destination,name));
  }
  run('patch',['--batch','--fuzz=0','-p1','-d',destination],{input:fs.readFileSync(path.join(cloud,'ui-readability.patch'),'utf8')});
  run(process.execPath,[path.join(destination,'scripts/prepare-release.mjs'),version],{cwd:destination});
  fs.cpSync(path.join(cloud,'overrides'),destination,{recursive:true});
  const htmlFile = path.join(destination,'index.html');
  const html = fs.readFileSync(htmlFile,'utf8');
  const ui = path.join(cloud,'ui');
  const styles = ['workspace.css','scanner.css'].map(file => fs.readFileSync(path.join(ui,file),'utf8')).join('\n');
  const types = {'.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'};
  const embedded = styles.replace(/url\("\.\/([^"/]+)"\)/g,(_,file) => {
    const type = types[path.extname(file)];
    if (!type) throw new Error('Unsupported workspace asset: '+file);
    return 'url("data:'+type+';base64,'+fs.readFileSync(path.join(ui,file)).toString('base64')+'")';
  });
  const license = fs.readFileSync(path.join(ui,'Inter-OFL.txt'),'utf8');
  const themed = html.replace(/<link rel="stylesheet" href="\.\.\/ui\/workspace\.css">\s*<link rel="stylesheet" href="\.\.\/ui\/scanner\.css">/,
    () => '<style>\n/* '+license+' */\n'+embedded+'\n</style>');
  if (themed === html) throw new Error('Workspace stylesheet insertion point missing.');
  fs.writeFileSync(htmlFile,themed.replace(/(<meta name="app-version" content=")5\.1\.0("\s*\/?>)/,`$1${version}$2`));
  const pkgFile = path.join(destination,'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgFile,'utf8'));
  pkg.dependencies['@capacitor/app']='8.1.2';
  pkg.scripts['web:build']='esbuild src/articles.mjs --bundle --format=iife --global-name=ZeroStockArticles --target=es2022 --outfile=articles.js && '+pkg.scripts['web:build'];
  pkg.scripts['assets:android'] += ' --iconBackgroundColor "#ace9c3" --iconBackgroundColorDark "#ace9c3" --splashBackgroundColor "#ace9c3" --splashBackgroundColorDark "#ace9c3"';
  pkg.scripts['test:articles']='node --test scripts/test-articles.mjs';
  pkg.scripts['test:all']+=' && npm run test:articles';
  if (fs.existsSync(path.join(destination,'scripts/test-offline-articles.mjs'))) {
    pkg.scripts['test:offline-articles']='node --experimental-sqlite --test scripts/test-offline-articles.mjs';
    pkg.scripts['test:all']+=' && npm run test:offline-articles';
  }
  fs.writeFileSync(pkgFile,JSON.stringify(pkg,null,2)+'\n');
  const copyFile = path.join(destination,'scripts/copy-web-assets.mjs');
  fs.writeFileSync(copyFile,fs.readFileSync(copyFile,'utf8').replace('const files=[',"const files=['articles.js',"));
  const swFile = path.join(destination,'sw.js');
  fs.writeFileSync(swFile,fs.readFileSync(swFile,'utf8').replace('const CORE=[',"const CORE=['./articles.js',"));
  fs.writeFileSync(path.join(destination,'.zerostock-build-source'),version+'\n');
  console.log(`Verified source restored for ${version}: ${destination}`);
} finally {
  fs.rmSync(temporary,{recursive:true,force:true});
}
