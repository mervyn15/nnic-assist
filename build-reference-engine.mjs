import {build} from 'esbuild';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const directory = 'reference-engine';
await mkdir(directory, {recursive:true});
const result = await build({
  entryPoints:['src/lib/index-reference.ts'], platform:'browser', format:'esm',
  bundle:true, minify:true, legalComments:'inline', metafile:true,
  outfile:join(directory,'indexer.mjs'), target:'es2022',
});
const source = await readFile(require.resolve('pdfjs-dist/legacy/build/pdf.worker.min.mjs'));
const digest = createHash('sha256').update(source).digest('hex');
await writeFile(join(directory,'pdf.worker.pack'),gzipSync(source,{level:9}));
await writeFile(join(directory,'pdf.worker.mjs'),`// Loads the packaged Mozilla PDF.js worker. See NOTICES.txt.
const response=await fetch(new URL('./pdf.worker.pack',import.meta.url),{credentials:'omit',redirect:'error'});
if(!response.ok||!response.body)throw new Error('Could not load the document reader.');
const bytes=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
if(hash!==${JSON.stringify(digest)})throw new Error('Document reader integrity check failed.');
const url=URL.createObjectURL(new Blob([bytes],{type:'text/javascript'}));
let worker;
try{worker=await import(url);}finally{URL.revokeObjectURL(url);}
export const WorkerMessageHandler=worker.WorkerMessageHandler;
`);
// Keep the upstream notices with the distributed parser. Realpath resolution also
// works with scoped packages and npm installations that use symlinks.
const notices = new Map();
for (const input of Object.keys(result.metafile.inputs)) {
  if (!input.includes('node_modules/')) continue;
  let dir=dirname(input);
  while (dir!==dirname(dir)) {
    let pkg;
    try { pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8')); } catch {}
    if (pkg?.name && pkg?.version) {
      if (!notices.has(pkg.name)) {
        let terms;
        for (const file of ['LICENSE','LICENSE.md','LICENSE.txt','LICENSE-MIT','COPYING']) {
          try { terms=await readFile(join(dir,file),'utf8'); break; } catch {}
        }
        if (!terms && pkg.name.includes('/') && !pkg.name.startsWith('@')) { dir=dirname(dir); continue; }
        if (!terms) throw Error('Missing license for '+pkg.name);
        notices.set(pkg.name,pkg.name+' '+pkg.version+'\n\n'+terms.trim());
      }
      break;
    }
    dir=dirname(dir);
  }
}
await writeFile(join(directory,'NOTICES.txt'),[...notices.values()].sort().join('\n\n'+ '='.repeat(60)+'\n\n')+'\n');
