import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const dir='artifacts/figma-ledger';
const assets={};
await fs.mkdir('public/figma/dean',{recursive:true});
for(const file of (await fs.readdir(dir)).filter(f=>f.startsWith('dean-context-'))){
 const result=JSON.parse(await fs.readFile(dir+'/'+file,'utf8'));
 const source=result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
 const prefix=source.match(/const assetPathPrefix = "([^"]+)"/)?.[1];
 if(!prefix)continue;
 for(const match of source.matchAll(/const (\w+) = `\$\{assetPathPrefix\}\/([^`]+\.svg)`/g)){
  const target='public/figma/dean/'+match[2];
  if(!assets[target])execFileSync('curl',['--fail','--location','--silent','--show-error',prefix+'/'+match[2],'--output',target]);
  assets[target]=prefix+'/'+match[2];
  console.log(file,match[1],'/figma/dean/'+match[2]);
 }
}
await fs.writeFile('artifacts/figma-ledger/dean-asset-manifest.json',JSON.stringify(assets,null,2));
