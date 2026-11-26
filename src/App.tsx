'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUp,ArrowUpRight,Plus,MessageSquare,BookOpen,FolderOpen,Settings2,PanelLeftClose,PanelLeftOpen,ArrowRight,FileText,Mail,ListChecks,ClipboardList,Copy,Check,X,Search,Trash2,Download} from 'lucide-react';
import {prompts} from './lib/demo';
import {script,guidedReply,type GuideTopic,type GuideChartId} from './lib/guided';
import {GuidedChart} from './GuidedChart';
import {pdfUrl} from './report-link';
import {liveEnabled,pagesUrl,conversationInput,type PagesApi,type Mode,type Quota} from './lib/hosted-chat';
import {LiveReferences} from './LiveReferences';

type Message={sources?:string[];externalSourceKind?:string;guidePublicQuestion?:string;externalSources?:{title:string;url:string}[];chart?:GuideChartId;role:'user'|'assistant';content:string;demo?:boolean;guideNext?:number;guideTopic?:GuideTopic|null;pdf?:string;fileTitle?:string};
export type Chat={id:string;title:string;messages:Message[];context:string};

function safeSources(message: Message) {
  return (Array.isArray(message.externalSources) ? message.externalSources : []).filter(source => {
    try {
      const url = new URL(source.url);
      return typeof source.title === 'string' && url.protocol === 'https:' && !url.username && !url.password;
    } catch { return false; }
  });
}

function portableText(message: Message) {
  return [message.content, ...(message.sources||[]), ...safeSources(message).map(source => source.title + ' · ' + source.url)].join('\n');
}

function AnswerContent({message}: {message: Message}) {
  const references = safeSources(message);
  return <>
    <div className="message-text">{message.content.split(/(\[public source\]|\[\d+\])/g).map((part,i)=>{
      const index=part==='[public source]'?0:/^\[\d+\]$/.test(part)?Number(part.slice(1,-1))-1:-1;
      const source=index>=0?message.externalSources?.[index]:null;
      return source && references.includes(source) ? <a key={i} href={source.url} target="_blank" rel="noopener noreferrer">{part==='[public source]'?source.title:part}</a>:part;
    })}</div>
    {!!message.sources?.length&&<details className="source-details"><summary>Workspace references</summary><ul>{message.sources.map((name,i)=><li key={i}>{name}</li>)}</ul></details>}
    {!!references.length&&!message.demo&&<details className="source-details"><summary>{message.externalSourceKind==='web'?'Web sources':'Public reference'}</summary><ul>{references.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul></details>}
  </>;
}

// Recover the topic of older saved chats from the actual questions asked.
function conversationTopic(messages: Message[]): GuideTopic | null {
  const latest = messages.at(-1);
  if (latest?.role === 'assistant' && latest.guideTopic !== undefined) return latest.guideTopic;
  let topic: GuideTopic | null = null;
  for (const message of messages) {
    if (message.role === 'user') topic = guidedReply(message.content.split('\n\nReference:')[0], topic || '', 0).guideTopic;
    else if (message.guideTopic !== undefined) topic = message.guideTopic;
  }
  return topic;
}

const icons={brief:FileText,email:Mail,review:ListChecks,minutes:ClipboardList};
type WorkspaceProps = {
  live:boolean; api:PagesApi; historyCache?:{current:Chat[]}; quota?:Quota;
  onQuota:(quota:Quota)=>void; onMode:(next:Mode)=>void; onSignOut:()=>Promise<void>;
};
export default function Home({live,api,historyCache,quota,onQuota,onMode,onSignOut}:WorkspaceProps){
 const [view,setView]=useState('chat'),[sidebar,setSidebar]=useState(false),[chats,setChats]=useState<Chat[]>(()=>historyCache?.current??[]),[active,setActive]=useState(''),[input,setInput]=useState(''),[context,setContext]=useState('CAAP Works'),[busy,setBusy]=useState(false),[toast,setToast]=useState(''),[query,setQuery]=useState(''),[attachment,setAttachment]=useState<{name:string;text:string}|null>(null),[ready,setReady]=useState(false);
 const [smallViewport,setSmallViewport]=useState(()=>window.matchMedia?.('(max-width: 850px)').matches ?? window.innerWidth<=850);
 const [collapsed,setCollapsed]=useState(()=>{try{return localStorage.getItem('nnic-assist-nav-collapsed') !== 'false'}catch{return true}});
 const navigation=useRef<HTMLElement>(null), menuToggle=useRef<HTMLButtonElement>(null), closeButton=useRef<HTMLButtonElement>(null);
 const navOpen=smallViewport?sidebar:!collapsed;
 const end=useRef<HTMLDivElement>(null),file=useRef<HTMLInputElement>(null),editor=useRef<HTMLTextAreaElement>(null),controller=useRef<AbortController|null>(null);
 const current=chats.find(c=>c.id===active),messages=current?.messages||[];
 const lastGuide=[...messages].reverse().find(m=>m.guideNext!==undefined);
 const nextStep=lastGuide?.guideNext??0;
 const guideStep=lastGuide?.guideTopic===null && nextStep%3===1 ? nextStep-1 : nextStep;
 const suggestion=script[guideStep]||'What would you like to revisit?';
 useEffect(()=>{if(live){setReady(true);return;}try{const saved=JSON.parse(localStorage.getItem('nnic-assist-chats')||'[]');if(Array.isArray(saved))setChats(saved.filter(c=>typeof c.id==='string'&&typeof c.title==='string'&&Array.isArray(c.messages)&&c.messages.every((m:Message)=>['user','assistant'].includes(m.role)&&typeof m.content==='string')).slice(0,30));}catch{}setReady(true);},[]);
 useEffect(()=>{if(historyCache){historyCache.current=chats;return;}if(ready&&!live)try{localStorage.setItem('nnic-assist-chats',JSON.stringify(chats.slice(0,30)))}catch{setToast('Browser storage is full. This chat is available only while the page is open.')}},[chats,ready]);
 useEffect(()=>{(()=>{const list=end.current?.parentElement;if(list)list.scrollTo({top:list.scrollHeight,behavior:"smooth"})})()},[messages.length,busy]);
 useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(t)}},[toast]);
 useEffect(()=>()=>controller.current?.abort(),[]);
 useEffect(()=>{if(!busy&&view==='chat')editor.current?.focus()},[busy,view,active]);
 useEffect(()=>{
   const media=window.matchMedia?.('(max-width: 850px)');
   if(!media) return;
   const sync=()=>{setSmallViewport(media.matches);setSidebar(false)};
   media.addEventListener('change',sync);
   return ()=>media.removeEventListener('change',sync);
 },[]);
 useEffect(()=>{
   if(!smallViewport || !sidebar) return;
   closeButton.current?.focus();
   const onKey=(event:KeyboardEvent)=>{
     if(event.key==='Escape'){event.preventDefault();closeMobileMenu();return;}
     if(event.key!=='Tab') return;
     const buttons=navigation.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
     if(!buttons?.length) return;
     const first=buttons[0],last=buttons[buttons.length-1];
     if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
     if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
   };
   document.addEventListener('keydown',onKey);
   return ()=>{document.removeEventListener('keydown',onKey);menuToggle.current?.focus()};
 },[sidebar,smallViewport]);
 function closeMobileMenu(){
   setSidebar(false);
 }
 function toggleNavigation(){
   if(smallViewport){setSidebar(open=>!open);return;}
   setCollapsed(!collapsed);
   try{localStorage.setItem('nnic-assist-nav-collapsed',String(!collapsed));}catch{}
 }

 function newChat(){if(busy)return;setActive('');setInput('');setAttachment(null);setView('chat');setSidebar(false)}
 async function copy(text:string){try{await navigator.clipboard.writeText(text);setToast('Copied to clipboard')}catch{setToast('Clipboard unavailable. Select and copy the text manually.')}}
 async function send(value=input){if(!value.trim()||busy)return;const content=value.trim()+(attachment?`\n\nReference: ${attachment.name}\n${attachment.text}`:'');if(live&&new TextEncoder().encode(content).length>3000){setToast('Shorten your message to 3,000 bytes for the live pilot.');return;}if(content.length>14000){setToast('Please shorten the message and attachment to 14,000 characters.');return;}let id=active||(globalThis.crypto?.randomUUID?.()||('chat-'+Date.now()+'-'+Math.random().toString(36).slice(2)));const updated=[...messages,{role:'user' as const,content}];setChats(cs=>active?cs.map(c=>c.id===id?{...c,messages:updated}:c):[{id,title:value.slice(0,48),messages:updated,context},...cs].slice(0,30));setActive(id);setView('chat');setInput('');setAttachment(null);setBusy(true);
 let answer:Message;
 if(live){
   const request=new AbortController();
   controller.current=request;
   try{
     const response=await api('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:request.signal,body:JSON.stringify({messages:conversationInput(updated)})});
     const result=await response.json();
     if(result.quota)onQuota(result.quota);
     if(!response.ok||typeof result.text!=='string')throw new Error(result.error||'Live AI could not answer. Please try again.');
     answer={role:'assistant',content:result.text,sources:result.sources,externalSources:result.externalSources,externalSourceKind:result.externalSourceKind};
   }catch(reason){
     answer={role:'assistant',content:request.signal.aborted?'Response stopped.':reason instanceof TypeError?'Could not reach Live AI. Check your connection and try again.':reason instanceof Error?reason.message:'Live AI could not answer.'};
   }
 }else{
 const previousTopic=conversationTopic(messages);
 answer={role:'assistant',...guidedReply(value,previousTopic||'',guideStep,messages.at(-1)?.guidePublicQuestion),demo:true};
 controller.current=new AbortController();const signal=controller.current.signal;
 for(let n=0;n<answer.content.length;n+=55){if(signal.aborted)break;const partial={role:'assistant' as const,content:answer.content.slice(0,n+55),demo:true};setChats(cs=>cs.map(c=>c.id===id?{...c,messages:[...updated,partial]}:c));await new Promise(resolve=>setTimeout(resolve,22));}
 if(signal.aborted)answer={role:'assistant',content:'Response stopped. You can resend your question when ready.',demo:true,guideNext:guideStep,guideTopic:null};
 }
 setChats(cs=>cs.map(c=>c.id===id?{...c,messages:[...updated,answer]}:c));setBusy(false);controller.current=null;
 }
 function exportChat(){if(!current)return;const blob=new Blob([`# ${current.title}\n\n${messages.map(m=>`## ${m.role==='user'?'You':m.demo?'NNIC Assist':'NNIC Assist'}\n\n${portableText(m)}`).join('\n\n')}`],{type:'text/markdown'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nnic-assist-chat.md';a.click();URL.revokeObjectURL(a.href)}
 const composer=<><div className="composer">{attachment&&<div className="attachment"><FileText size={14}/>{attachment.name}<button aria-label="Remove attachment" onClick={()=>setAttachment(null)}><X size={14}/></button></div>}<textarea ref={editor} aria-label="Message NNIC Assist" placeholder={busy?'Preparing your response…':live?'Message NNIC Assist':suggestion} disabled={busy} aria-describedby="composer-help" value={input} maxLength={10000} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(!live&&e.key==='Tab'&&!e.shiftKey&&!input.trim()&&!busy&&guideStep<script.length){e.preventDefault();setInput(suggestion);return;}if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send()}}}/><div className="composer-bottom"><div><button className="icon-button" aria-label={live?'Open shared reference files':'Attach a text file'} title={live?'Shared reference files':'Attach .txt or .md (up to 8 KB)'} onClick={()=>live?setView('knowledge'):file.current?.click()}><Plus size={21}/></button></div><button className="send" aria-label={busy?'Stop response':'Send message'} disabled={!busy&&!input.trim()} onClick={()=>busy?controller.current?.abort():send()}>{busy?<span className="stop-square"/>:<ArrowUp size={20}/>}</button></div></div><div className="composer-caption" id="composer-help"><span>{live?(quota?quota.remaining+' live requests remaining':'Enter to send'):guideStep<script.length?'Tab to fill · Enter to send':'Enter to send'}</span>{!live&&guideStep<script.length&&<button disabled={busy} onClick={()=>{setInput(suggestion);editor.current?.focus()}}>Use suggestion <ArrowUpRight size={12}/></button>}</div></>;
 return <div className={navOpen?'app':'app nav-closed'}><input ref={file} type="file" accept=".txt,.md,text/plain,text/markdown" hidden onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;if(!/\.(txt|md)$/i.test(f.name)||f.size>8000){setToast('Choose a .txt or .md file up to 8 KB.');return;}setAttachment({name:f.name,text:await f.text()});setView('chat');setToast('Note attached to your message. Guided replies are scripted.')}}/>
 {smallViewport&&sidebar&&<div className="scrim" aria-hidden="true" onClick={closeMobileMenu}/>}
 <aside id="workspace-navigation" ref={navigation} className={sidebar?'sidebar open':'sidebar'} hidden={!navOpen} role={smallViewport&&sidebar?'dialog':undefined} aria-modal={smallViewport&&sidebar?true:undefined} aria-label="Workspace navigation"><div className="brand"><span>NNIC Assist</span><button ref={closeButton} className="mobile-close" aria-label="Close navigation" aria-controls="workspace-navigation" aria-expanded={navOpen} onClick={toggleNavigation}><PanelLeftClose size={19}/></button></div>
 <button className="new-chat" disabled={busy} onClick={newChat}><Plus size={18}/> New chat</button>
 <nav>{[{id:'chat',text:'Assistant',icon:MessageSquare},{id:'prompts',text:'Prompt library',icon:BookOpen},{id:'knowledge',text:'Reference files',icon:FolderOpen}].map(n=><button disabled={busy} key={n.id} className={view===n.id?'nav-item selected':'nav-item'} onClick={()=>{setView(n.id);setSidebar(false)}}><n.icon size={18}/>{n.text}{view===n.id&&<span className="nav-dot"/>}</button>)}</nav>
 <div className="history">{chats.length>0&&<div className="nav-label">Chats</div>}{chats.map(c=><div key={c.id} className={active===c.id?'history-row active':'history-row'}><button disabled={busy} onClick={()=>{setActive(c.id);setContext(c.context||'CAAP Works');setAttachment(null);setInput('');setView('chat');setSidebar(false)}}><MessageSquare size={14}/><span>{c.title}</span></button><button disabled={busy} title="Delete conversation" aria-label={`Delete ${c.title}`} onClick={()=>{setChats(cs=>cs.filter(x=>x.id!==c.id));if(c.id===active)setActive('')}}><Trash2 size={13}/></button></div>)}</div>
 <div className="sidebar-bottom"><button className="nav-item" onClick={()=>{setView('settings');setSidebar(false)}}><Settings2 size={17}/> Settings</button></div></aside>
 <main inert={smallViewport&&sidebar}><header><div><button ref={menuToggle} className="navigation-toggle icon-button" aria-label={navOpen?'Hide navigation':'Show navigation'} aria-controls="workspace-navigation" aria-expanded={navOpen} title={navOpen?'Hide navigation':'Show navigation'} onClick={toggleNavigation}>{navOpen?<PanelLeftClose size={20}/>:<PanelLeftOpen size={20}/>}</button><strong>NNIC Assist</strong>{liveEnabled?<button className="mode-label" disabled={busy} title={live?'Switch to guided demo':'Switch to Live AI'} aria-label={live?'Switch to guided demo':'Switch to Live AI'} onClick={()=>onMode(live?'guided':'live')}>{live?'Live AI':'Guided demo'} <span aria-hidden="true">⌄</span></button>:<span className="mode-label">Guided demo</span>}</div>{view==='chat'&&messages.length>0&&<button className="icon-button" title="New chat" aria-label="New chat" disabled={busy} onClick={newChat}><Plus size={20}/></button>}</header>
 {view==='chat'?<div className={messages.length?'chat-page has-messages':'chat-page'}>{messages.length===0?<div className="welcome"><h1>What can I help with?</h1>{composer}</div>:<><div className="conversation-top"><span>{current?.title}</span><button title="Download conversation" aria-label="Download conversation" onClick={exportChat}><Download size={17}/></button></div><div className="messages" aria-live="polite">{messages.map((m,i)=><article className={`message ${m.role}`} key={i}><div className="message-content"><div className="sr-only">{m.role==='user'?'You':'NNIC Assist'}</div><AnswerContent message={m}/>{m.chart&&<GuidedChart chart={m.chart}/>}{m.pdf&&<div className="pdf-card"><div className="pdf-icon"><FileText size={25}/><small>PDF</small></div><div><strong>{m.fileTitle}</strong><small>Formatted project brief · PDF document</small><div><a href={pdfUrl(m.pdf)} target="_blank" rel="noreferrer">Open PDF <ArrowUpRight size={13}/></a><a href={pdfUrl(m.pdf)} download={m.pdf.split('/').pop()}><Download size={13}/> Download</a></div></div></div>}{m.role==='assistant'&&!busy&&<div className="response-actions"><button className="copy-response" onClick={()=>copy(portableText(m))}><Copy size={13}/> Copy response</button></div>}</div></article>)}{busy&&<div className="thinking"><span/> Preparing a response…</div>}<div ref={end}/></div><div className="chat-composer">{composer}</div></>}</div>:<section className="content-page">
 {view==='prompts'&&<><h2>Prompt library</h2><div className="search"><Search size={18}/><input aria-label="Search prompts" placeholder="Find a prompt…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="library-grid">{prompts.filter(p=>(p.title+p.description+p.category).toLowerCase().includes(query.toLowerCase())).map(p=>{const Icon=icons[p.icon as keyof typeof icons];return <div className="library-card" key={p.id}><Icon size={23}/><small>{p.category}</small><h3>{p.title}</h3><p>{p.prompt}</p><button onClick={()=>{newChat();setInput(p.prompt)}}>Use this prompt <ArrowRight size={16}/></button></div>})}</div>{!prompts.some(p=>(p.title+p.description+p.category).toLowerCase().includes(query.toLowerCase()))&&<p>No prompts match your search.</p>}</>}
 {view==='knowledge'&&live&&<LiveReferences api={api}/>}
 {view==='knowledge'&&!live&&<><h2>Reference files</h2><div className="upload-zone"><FolderOpen size={28}/><h3>Attach a text note</h3><p>Text or Markdown, up to 8 KB. Notes stay in this browser. The scripted demo does not analyze them.</p><button className="primary-button" onClick={()=>file.current?.click()}><Plus size={16}/>Choose a file</button></div></>}
 {view==='settings'&&<><h2>Settings</h2>
 <div className="settings-card"><h3>Chat mode</h3><p>{live?'Live AI uses the shared CAAP Works references.':'Press Tab to fill the guided question, then Enter to send it.'}</p>
 {liveEnabled?<div className="mode-options"><button type="button" className="mode-switch" aria-pressed={live} disabled={busy} onClick={()=>live?setView('chat'):onMode('live')}>Live AI</button><button type="button" className="mode-switch" aria-pressed={!live} disabled={busy} onClick={()=>live?onMode('guided'):setView('chat')}>Guided demo</button></div>:<><button type="button" className="primary-button" onClick={()=>setView('chat')}>Continue guided demo</button><p><a href={pagesUrl+'?mode=live'} target="_blank" rel="noopener noreferrer">Open Live AI on GitHub Pages</a></p></>}
 {live&&<><p>{quota?quota.remaining+' shared live requests remaining.':''}</p><button disabled={busy} className="text-link" onClick={onSignOut}>Sign out</button></>}</div>
 <div className="settings-card"><h3>Conversation history</h3><p>{live?'Live conversations stay in this tab until you sign out, refresh, or close it.':'Up to 30 guided conversations are saved in this browser.'}</p><button className="danger-link" disabled={!chats.length||busy} onClick={()=>{if(window.confirm(live?'Clear live conversations from this tab?':'Delete guided conversations saved in this browser?')){setChats([]);setActive('');setToast('Conversation history cleared')}}}><Trash2 size={15}/> Clear conversation history</button></div></>}
 </section>}
 </main>{toast&&<div className="toast" role="status"><Check size={16}/>{toast}</div>}</div>
}
