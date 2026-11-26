import {useCallback,useEffect,useMemo,useRef,useState,type FormEvent} from 'react';
import Home,{type Chat} from './App';
import {createApi,initialMode,saveMode,type Mode,type Quota} from './lib/hosted-chat';

type Session = {token:string; expiresAt:number; history:{current:Chat[]}};

export default function PagesWorkspace(){
  const [mode,setMode]=useState<Mode>(initialMode);
  const [session,setSession]=useState<Session|null>(null);
  const [quota,setQuota]=useState<Quota>();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const sessionRef=useRef(session);
  sessionRef.current=session;
  const clear=useCallback((message:string)=>{
    setSession(null);setPassword('');setQuota(undefined);setError(message);
  },[]);
  const api=useMemo(()=>createApi(session?.token||'',()=>{
    if(sessionRef.current===session)clear('Your session expired. Sign in again to continue.');
  }),[session,clear]);
  useEffect(()=>{
    if(!session)return;
    const timer=setTimeout(()=>clear('Your session expired. Sign in again to continue.'),Math.max(0,session.expiresAt-Date.now()));
    return ()=>clearTimeout(timer);
  },[session,clear]);
  function changeMode(next:Mode){setError('');setPassword('');saveMode(next);setMode(next);}
  async function signIn(event:FormEvent){
    event.preventDefault();
    if(busy||!username.trim()||!password)return;
    setBusy(true);setError('');
    try{
      const response=await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:username.trim(),password})});
      const result=await response.json();
      if(!response.ok||!result.signedIn||typeof result.sessionToken!=='string'||!Number.isFinite(result.expiresAt))throw new Error(result.error||'Sign-in failed. Please try again.');
      setPassword('');
      const next={token:result.sessionToken,expiresAt:result.expiresAt,history:{current:[]}};
      const status=await createApi(next.token,()=>{})('/api/status');
      const info=await status.json();
      if(!status.ok||!info.signedIn||!info.live)throw new Error('Live AI is unavailable. You can still use the guided demo.');
      setQuota(info.quota);setSession(next);
    }catch(reason){setError(reason instanceof TypeError?'Could not reach Live AI. Check your connection or use the guided demo.':reason instanceof Error?reason.message:'Sign-in failed.');}
    finally{setBusy(false);}
  }
  async function signOut(){
    try{const response=await api('/api/logout',{method:'POST'});if(!response.ok&&response.status!==401)throw new Error();}
    catch{clear('Signed out of this tab. The server could not confirm revocation.');return;}
    clear('');
  }
  if(mode==='live'&&!session)return <main className="pages-login"><form onSubmit={signIn}>
    <h1>Sign in to NNIC Assist</h1><p>Use your workspace login for Live AI.</p>
    <label>Username<input autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)}/></label>
    <label>Password<input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    {error&&<p role="alert">{error}</p>}
    <button className="primary-button" disabled={busy} type="submit">{busy?'Signing in…':'Sign in'}</button>
    <button className="text-link" disabled={busy} type="button" onClick={()=>changeMode('guided')}>Use guided demo</button>
  </form></main>;
  return <Home key={mode} live={mode==='live'} api={api} historyCache={mode==='live'?session?.history:undefined} quota={quota} onQuota={setQuota} onMode={changeMode} onSignOut={signOut}/>;
}
