import {build,transform} from 'esbuild';
import {readFile,writeFile,readdir} from 'node:fs/promises';
// Embed the PDFs and all application code: no CDN or local server needed.
const pdfs={};for(const file of await readdir('reports')){if(file.endsWith('.pdf'))pdfs['/reports/'+file]=(await readFile('reports/'+file)).toString('base64');}
await writeFile('src/pdf-assets.ts',`const pdfs:Record<string,string>=${JSON.stringify(pdfs)};const urls:Record<string,string>={};export function pdfUrl(path:string){if(urls[path])return urls[path];if(!pdfs[path])return '';const raw=atob(pdfs[path]);const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));return urls[path]=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));}`);
const r=await build({entryPoints:['src/main.tsx'],bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
const js=r.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const css=(await readFile('src/fonts.css','utf8'))+'\n'+await readFile('src/styles.css','utf8');
// Fail the export if CSS is malformed instead of silently shipping an unstyled page.
const cssCheck=await transform(css,{loader:'css',logLevel:'silent'});
if(cssCheck.warnings.length)throw new Error(cssCheck.warnings.map(w=>w.text).join('\n'));
if(/@import\s|url\([\"\']?https?:/i.test(css))throw new Error('Offline styles must embed all dependencies');
await writeFile('NNIC-Assist-Offline.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NNIC Assist | Your work, connected.</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`);
console.log('Built NNIC-Assist-Offline.html with embedded PDFs.');

await writeFile('index.html', await readFile('NNIC-Assist-Offline.html'));
console.log('Built index.html for GitHub Pages.');
