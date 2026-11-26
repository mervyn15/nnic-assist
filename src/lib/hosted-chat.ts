const apiOrigin = 'https://nnic-assist.mervyn27.chatgpt.site';
export const pagesUrl = 'https://mervyn15.github.io/nnic-assist/';
export const liveEnabled = location.origin === new URL(pagesUrl).origin &&
  location.pathname.startsWith('/nnic-assist/') && !location.pathname.endsWith('NNIC-Assist-Offline.html');

export type Mode = 'live' | 'guided';
export type Quota = {remaining:number; limit:number; budgetRemainingMicros?:number};
export type PagesApi = (path:string, options?:RequestInit) => Promise<Response>;

export function initialMode(): Mode {
  if (!liveEnabled) return 'guided';
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'live' || mode === 'guided') return mode;
  try {
    const saved = localStorage.getItem('nnic-assist-mode');
    if (saved === 'guided' || saved === 'live') return saved;
  } catch {}
  return navigator.onLine === false ? 'guided' : 'live';
}

export function saveMode(mode:Mode) {
  if (!liveEnabled) return;
  try { localStorage.setItem('nnic-assist-mode',mode); } catch {}
  const url = new URL(location.href);
  url.searchParams.set('mode',mode);
  history.replaceState(history.state,'',url);
}

export function createApi(token:string, onExpired:()=>void): PagesApi {
  return async (path,options={})=>{
    if (!liveEnabled || !/^\/api\/(?:login|logout|status|chat|reference-files)(?:[/?]|$)/.test(path)) {
      throw new Error('Live AI is available on the GitHub Pages site.');
    }
    const url=new URL(path,apiOrigin);
    if (url.origin!==apiOrigin || !url.pathname.startsWith('/api/')) throw new Error('Invalid workspace request.');
    const headers=new Headers(options.headers);
    if (token) headers.set('Authorization','Bearer '+token);
    const response=await fetch(url.href,{...options,mode:'cors',redirect:'error',credentials:'omit',cache:'no-store',headers});
    if (token && response.status===401) onExpired();
    return response;
  };
}

export function conversationInput(messages:{role:string;content:string}[]) {
  const input:{role:'user';content:string}[]=[];
  let bytes=0;
  for(let i=messages.length-1;i>=0&&input.length<12;i--){
    const m=messages[i];
    if(m.role!=='user')continue;
    bytes+=new TextEncoder().encode(m.content).length;
    if(bytes>3000)break;
    input.unshift({role:'user',content:m.content});
  }
  return input;
}
