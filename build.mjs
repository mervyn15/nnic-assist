import {build, transform} from 'esbuild';
import {readFile, readdir, writeFile} from 'node:fs/promises';

const css = await readFile('src/styles.css','utf8');
const check = await transform(css,{loader:'css',logLevel:'silent'});
if (check.warnings.length) throw new Error(check.warnings.map(w=>w.text).join('\n'));
if (/@import\s|url\(["']?https?:/i.test(css)) throw new Error('The demo must work without a CDN');

async function buildPage(filename, styles, reports) {
  const define = {'process.env.NODE_ENV':'"production"'};
  if (reports) define.NNIC_EMBEDDED_REPORTS = JSON.stringify(reports);
  const bundle = await build({
    entryPoints:['src/main.tsx'], bundle:true, write:false, format:'iife',
    platform:'browser', jsx:'automatic', minify:true, define,
  });
  const js = bundle.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
  await writeFile(filename,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><title>NNIC Assist | Guided demo</title><style>${styles}</style></head><body><div id="root"></div><script>${js}</script></body></html>`);
}

await buildPage('index.html',css);
const reports = {};
for (const name of (await readdir('reports')).filter(f=>f.endsWith('.pdf'))) {
  reports['/reports/'+name] = (await readFile('reports/'+name)).toString('base64');
}
const fonts = await readFile('src/fonts.css','utf8');
await buildPage('NNIC-Assist-Offline.html',fonts+'\n'+css,reports);
