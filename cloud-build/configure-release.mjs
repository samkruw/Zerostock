import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const VERSION_NAME='5.0.0-rc.1';
const VERSION_CODE=2026103001;
const groovy='android/app/build.gradle';
const kotlin='android/app/build.gradle.kts';
const target=existsSync(groovy)?groovy:(existsSync(kotlin)?kotlin:null);
if(!target){
  console.error('Android Gradle-Datei fehlt. Zuerst npx cap add android ausführen.');
  process.exit(1);
}
let s=await readFile(target,'utf8');
if(target.endsWith('.kts')){
  s=s.replace(/versionCode\s*=\s*\d+/, `versionCode = ${VERSION_CODE}`);
  s=s.replace(/versionName\s*=\s*"[^"]+"/, `versionName = "${VERSION_NAME}"`);
}else{
  s=s.replace(/versionCode\s+\d+/, `versionCode ${VERSION_CODE}`);
  s=s.replace(/versionName\s+['"][^'"]+['"]/, `versionName "${VERSION_NAME}"`);
}
await writeFile(target,s);
console.log(`Android release version set: ${VERSION_NAME} (${VERSION_CODE})`);
