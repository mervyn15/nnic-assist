import {useEffect, useRef, useState} from 'react';

type Api = (path: string, options?: RequestInit) => Promise<Response>;
interface Reference {id:string; name:string; passageCount:number; size:number}
const endpoint='/api/reference-files';

async function checked(response:Response) {
  if (!response.ok) {
    const detail=await response.json().catch(()=>null);
    throw Error(detail?.error || 'The shared reference request failed. Please try again.');
  }
  return response;
}
async function list(api:Api, signal?:AbortSignal): Promise<Reference[]> {
  const response=await checked(await api(endpoint,{cache:'no-store',signal}));
  return (await response.json()).files;
}
const message=(error:unknown) => error instanceof Error ? error.message : 'The reference file request failed.';

export function LiveReferences({api, refreshKey=0}:{api:Api; refreshKey?:number}) {
  const [files,setFiles]=useState<Reference[]>([]);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  const picker=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true); setError('');
    list(api,controller.signal).then(items=>{
      if(!controller.signal.aborted) setFiles(items);
    }).catch(e=>{
      if(!controller.signal.aborted) setError(message(e));
    }).finally(()=>{
      if(!controller.signal.aborted) setLoading(false);
    });
    return ()=>controller.abort();
  },[api,refreshKey,revision]);

  async function run(action:()=>Promise<void>) {
    if(working) return;
    setWorking(true); setNotice(''); setError('');
    try { await action(); }
    catch(e) { setNotice(''); setError(message(e)); }
    finally { setWorking(false); }
  }
  async function upload(file:File) {
    if(files.some(item=>item.name.toLowerCase()===file.name.toLowerCase()) &&
      !window.confirm('Replace the shared reference “'+file.name+'” for everyone in this workspace?')) return;
    await run(async()=>{
      setNotice('Preparing '+file.name+'…');
      // Load the parser only on upload. Local code handles document text before
      // the authenticated upload; the page does not send files to a parsing service.
      const engineUrl=new URL('./reference-engine/indexer.mjs',document.baseURI);
      const {indexFile}=await import(engineUrl.href);
      const source=await indexFile(file);
      const data=new FormData();
      data.set('file',file);
      data.set('index',new Blob([JSON.stringify(source)],{type:'application/json'}),'index.json');
      setNotice('Saving '+file.name+'…');
      await checked(await api(endpoint+'?name='+encodeURIComponent(file.name),{method:'PUT',body:data}));
      setNotice('Saved '+file.name+' to the shared references.');
      setRevision(n=>n+1);
    });
  }
  async function download(file:Reference) {
    await run(async()=>{
      const response=await checked(await api(endpoint+'/'+encodeURIComponent(file.id),{cache:'no-store'}));
      const url=URL.createObjectURL(await response.blob());
      const a=document.createElement('a');
      a.href=url; a.download=file.name; document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1500);
    });
  }
  async function remove(file:Reference) {
    if(!window.confirm('Remove “'+file.name+'” from shared references for everyone in this workspace?')) return;
    await run(async()=>{
      await checked(await api(endpoint+'/'+encodeURIComponent(file.id),{method:'DELETE'}));
      setNotice('Removed '+file.name+'.');
      setRevision(n=>n+1);
    });
  }
  return <>
    <h2>Reference files</h2>
    <p className="page-lead">Live AI uses these shared files to answer project questions.</p>
    <input hidden type="file" ref={picker} accept=".pdf,.docx,.pptx,.xlsx,.txt,.md" onChange={e=>{
      const selected=e.currentTarget.files?.[0];e.currentTarget.value='';
      if(selected) void upload(selected);
    }}/>
    <button className="primary-button" disabled={working||loading||!!error&&!files.length} onClick={()=>picker.current?.click()}>Upload a reference</button>
    <p className="page-lead">PDF, Word, PowerPoint, Excel, text or Markdown, up to 32 MiB per file.</p>
    {error&&<p role="alert">{error} <button className="text-link" disabled={working||loading} onClick={()=>setRevision(n=>n+1)}>Retry</button></p>}
    {notice&&<p role="status">{notice}</p>}
    {loading?<p role="status">Loading shared references…</p>:!files.length&&!error?<p>No shared references yet.</p>:null}
    {files.map(file=><div className="settings-card" key={file.id}>
      <h3 style={{overflowWrap:'anywhere'}}>{file.name}</h3>
      <p>{file.passageCount.toLocaleString()} searchable {file.passageCount===1?'passage':'passages'}</p>
      <div><button className="text-link" disabled={working} onClick={()=>void download(file)}>Download</button>
      <button className="danger-link" disabled={working} onClick={()=>void remove(file)}>Remove</button></div>
    </div>)}
  </>;
}
export default LiveReferences;
