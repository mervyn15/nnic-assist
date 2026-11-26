export const script = [
 'What is the current status of CAPPI?',
 'Can you show the CAPPI coordination checklist as a bar chart?',
 'Prepare a CAPPI summary in PDF.',
 'How is the DRATF site refurbishment progressing?',
 'What should we focus on in the BOQ review?',
 'Create a DRATF refurbishment summary in PDF.',
 'Walk me through the A-SMGCS TOR review.',
 'What evidence should we request from the vendor?',
 'Prepare the A-SMGCS review brief in PDF.'
];
export type GuideTopic = 'cappi' | 'dratf' | 'asmgcs';
export type GuideChartId = 'cappi-checklist';
export const cappiChecklist = [
 {label:'Data',items:['format','coverage','height layers','update interval']},
 {label:'Network',items:['route','firewall rules','bandwidth','redundancy']},
 {label:'Display',items:['current data','stale data','missing data']},
 {label:'Acceptance',items:['test cases','expected results','sign-off responsibilities']},
] as const;
export type GuidedResult = {chart?:GuideChartId;content:string;guideNext:number;guideTopic:GuideTopic | null;pdf?:string;fileTitle?:string};
const files={cappi:'/reports/CAPPI_Project_Brief.pdf',dratf:'/reports/DRATF_Refurbishment_Brief.pdf',asmgcs:'/reports/ASMGCS_TOR_Review_Brief.pdf'};

const projects: [GuideTopic, RegExp][] = [
 ['cappi', /\bcappi\b/i],
 ['dratf', /\bdratf\b/i],
 ['asmgcs', /\ba[\s‐‑–-]*smgcs\b|\badvanced surface movement guidance and control system\b/i],
];
const guidedWords = new Set((
 'a about actions action an and any are approach as ask at be before brief can check checklist '+
 'compare comparison concerns coordination could create current details do document download '+
 'evidence file focus for from generate get give go going help how in into is it its key latest '+
 'main make me my need needs next of on open or our pdf please prepare priorities proceed '+
 'progress progressing project projects provide put ready report request requirements '+
 'resolve resolved review risks risk scope should short site steps status summarise summarize summary '+
 'technical tell that the their them these this through to us update vendor walk we what whats '+
 'which with would write you your boq refurbishment tor items unresolved issues more give me elaborate progress overview latest am i agenda workshop meeting'
).split(/\s+/));

function namedTopics(text:string) {
 return projects.filter(([,pattern])=>pattern.test(text)).map(([key])=>key);
}

export function guidedReply(question:string,previous:string,step:number):GuidedResult {
 const q=question.toLowerCase().replace(/\bwhat['’]s\b/g,'what is').replace(/\bhow['’]s\b/g,'how is').replace(/['’]s\b/g,'').trim();
 const named=namedTopics(q);
 const prior=namedTopics(previous);
 if (/^(?:ok[, ]+)?(?:thank you|thanks)(?: very much)?[.!\s]*$/.test(q)) {
   return {content:'You’re welcome.',guideNext:step,guideTopic:prior.length===1?prior[0]:null};
 }
 // Restrict the prepared chart to this checklist. A question about measured progress,
 // money or any other metric should not receive a graph of checklist counts.
 const chartTopic = named.length===1 ? named[0] : named.length===0 && prior.length===1 ? prior[0] : null;
 const chartWords = q.match(/[\p{L}\p{N}]+/gu) ?? [];
 const checklistChart = /\b(?:chart|graph|plot|visuali[sz]e)\b/.test(q) &&
   chartWords.every(word=>['a','an','as','bar','bars','breakdown','by','can','cappi','category','chart','checklist','coordination','could','count','counts','display','draw','for','generate','give','graph','in','item','items','it','make','me','of','on','our','please','plot','review','show','that','the','these','this','those','topic','topics','us','visualise','visualize','with','you'].includes(word));
 if(chartTopic==='cappi' && checklistChart){
   const groups=cappiChecklist.map(group=>group.label.toLowerCase()+' ('+group.items.length+')').join(', ');
   const total=cappiChecklist.reduce((sum,group)=>sum+group.items.length,0);
   return {guideTopic:'cappi',guideNext:2,chart:'cappi-checklist',content:
     'The demo checklist covers '+total+' items: '+groups+'. Data and network have the most items to discuss. These counts describe the checklist, not project completion or open issues.'};
 }
 const intentText = projects.reduce((text,[,pattern]) => text.replace(pattern,' '),q);
 const words = intentText.match(/[\p{L}\p{N}]+/gu) ?? [];
 const knownWording=words.every(word=>guidedWords.has(word));
 const document=/\b(?:pdf|summar(?:y|ize|ise)|brief|report|document|file)\b/.test(q);
 const detail=/\b(?:resolve[d]?|before|next|actions?|concerns?|risks?|focus|boq|evidence|vendor|clarifications?|needs?|open items|elaborate|tell me more|issues|unresolved|agenda|workshop)\b/.test(q);
 const overview=/\b(?:status|update|progress(?:ing)?|going|overview|review|check|walk|approach|scope|priorities|tell|details)\b/.test(q);
 const hasIntent=document || detail || overview;
 const impliedTopic = /\b(?:boq|refurbishment)\b/.test(q) ? 'dratf' : null;
 const continuesPrior = prior.length===1 && (!impliedTopic || impliedTopic===prior[0]);
 const topic=knownWording && named.length<=1 && (hasIntent || named.length===1)
   ? (named[0] || (hasIntent && continuesPrior ? prior[0] : null))
   : null;
 if (!topic) {
   const clarify=knownWording && hasIntent && named.length===0 && prior.length===0;
   return {
     content:clarify
       ? 'Which project do you mean? The guided topics are CAPPI, DRATF site refurbishment, and the A-SMGCS TOR.'
       : 'I don’t have a guided answer for that question. To check the project records, switch to Live AI and ask about the project or document by name.',
     guideNext:step,guideTopic:null,
   };
 }
 const base=topic==='cappi'?0:topic==='dratf'?3:6;
 if(document){const title=topic==='cappi'?'CAPPI project brief':topic==='dratf'?'DRATF refurbishment brief':'A-SMGCS TOR review brief';return {guideTopic:topic,content:`The ${title} is ready. It brings together the scope, review priorities, open items, and next steps in a formatted PDF.\n\nYou can open it below or download a copy for the presentation.${topic==='cappi'?'\n\nShall we move on to the DRATF site refurbishment?':topic==='dratf'?'\n\nWe can look at the A-SMGCS TOR review next.':'\n\nThat completes the three-project walkthrough. You can revisit any project or start a new conversation.'}`,pdf:files[topic],fileTitle:title,guideNext:base+3};}
 if(topic==='cappi')return {guideTopic:topic,content:detail?'The main task is to close the interface and acceptance questions. I would organize the discussion around four decisions:\n\n1. Data: confirm the format, coverage, height layers, and update interval.\n2. Network: confirm the route, firewall rules, bandwidth, and redundancy.\n3. Display: agree how current, stale, and missing weather data will appear.\n4. Acceptance: define the test cases, expected results, and sign-off responsibilities.\n\nThe next coordination session should leave each open item with an owner and an agreed target date. I can put this into a short PDF brief.':'CAPPI is at the technical coordination stage in this walkthrough. The focus is on getting the weather-data interface, network path, and acceptance requirements aligned before implementation.\n\nThe key dependency is agreement between the data provider, system integrator, and operational users on what will be exchanged and how it will be displayed.\n\nWould you like to see the coordination checklist as a chart?',guideNext:detail?2:1};
 if(topic==='dratf')return {guideTopic:topic,content:detail?'Start with BOQ completeness, then examine the technical differences.\n\nFor the completeness check:\n• Pass: the item is included. Record differences in quantity, specification, or scope in Remarks.\n• Fail: the item is missing or marked N/A. State the missing requirement in Remarks.\n\nKeep completeness and technical acceptance separate. An included item can still require clarification before it is technically acceptable.\n\nFor refurbishment, pay particular attention to power, earthing, cooling, cable routes, access, and handover requirements. I can consolidate these points into a PDF.':'The refurbishment discussion is centered on technical evaluation and site readiness. The immediate priorities are to complete the BOQ comparison, resolve scope differences, and confirm the facility interfaces.\n\nThe key coordination areas are power, cooling, earthing, cable routes, and work access. Refurbishment completion also needs to be distinguished from equipment commissioning and operational approval.\n\nWould you like to go through the BOQ review approach?',guideNext:detail?5:4};
 return {guideTopic:topic,content:detail?'Ask for evidence that can be traced to each requirement:\n\n• The offered configuration and a clause-by-clause compliance matrix\n• Coverage and performance substantiation\n• Interface control documents and responsibility boundaries\n• Availability, redundancy, and recovery design\n• Operational scenarios and human-machine interface details\n• Proposed verification methods and acceptance test procedures\n\nA broad compliance statement should not replace project-specific evidence. Numeric thresholds must come from the approved TOR, and operational criteria need review by the appropriate specialists.\n\nI can organize this into a PDF review brief.':'I would structure the A-SMGCS review around six areas:\n\n1. Required services and operating scope\n2. Surveillance coverage and performance\n3. System interfaces and responsibilities\n4. Displays, alerts, and operational scenarios\n5. Power, network, resilience, and recovery\n6. Verification, acceptance, and training\n\nFor each requirement, record the TOR clause, vendor response, evidence, review result, and any clarification. This walkthrough uses a review framework; the approved TOR remains the basis for actual acceptance.\n\nWould you like the evidence checklist for the vendor?',guideNext:detail?8:7};
}
