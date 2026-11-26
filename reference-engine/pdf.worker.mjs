// Loads the packaged Mozilla PDF.js worker. See NOTICES.txt.
const response=await fetch(new URL('./pdf.worker.pack',import.meta.url),{credentials:'omit',redirect:'error'});
if(!response.ok||!response.body)throw new Error('Could not load the document reader.');
const bytes=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
if(hash!=="7fc442c268d107d656755252cf38c422a88e825b7f0caaac6a5f58364dff4179")throw new Error('Document reader integrity check failed.');
const url=URL.createObjectURL(new Blob([bytes],{type:'text/javascript'}));
let worker;
try{worker=await import(url);}finally{URL.revokeObjectURL(url);}
export const WorkerMessageHandler=worker.WorkerMessageHandler;
