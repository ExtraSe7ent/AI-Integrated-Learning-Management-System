import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const manifest={};fs.mkdirSync('public/figma/course-leader',{recursive:true});
for(const file of fs.readdirSync('artifacts/figma-ledger').filter(f=>f.startsWith('course-leader-context-'))){
 const r=JSON.parse(fs.readFileSync('artifacts/figma-ledger/'+file,'utf8'));
 const source=r.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
 const prefix=source.match(/const assetPathPrefix = "([^"]+)"/)?.[1];if(!prefix)continue;
 for(const m of source.matchAll(/const (\w+) = `\$\{assetPathPrefix\}\/([^`]+\.svg)`/g)){
  const existing='public/figma/dean/'+m[2],target=fs.existsSync(existing)?existing:'public/figma/course-leader/'+m[2];
  if(!fs.existsSync(target))execFileSync('curl',['-fLsS',prefix+'/'+m[2],'-o',target]);
  manifest[m[2]]={path:target,source:prefix+'/'+m[2],reused:target===existing};
 }
}
fs.writeFileSync('artifacts/figma-ledger/course-leader-assets.json',JSON.stringify(manifest,null,2));console.log(manifest);
