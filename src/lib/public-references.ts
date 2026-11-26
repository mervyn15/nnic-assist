// Reviewed public definitions. Match the entire question so that a project, comparison,
// or requirement that happens to mention the same term still uses document retrieval.
interface PublicDefinition {
  terms: string[];
  answer: string;
  source: { title: string; url: string };
}

const glossary: PublicDefinition[] = [
  {
    terms: ['cappi', 'constant altitude plan position indicator'],
    answer: 'CAPPI stands for Constant Altitude Plan Position Indicator. A weather radar combines measurements from several scan angles to show echoes at approximately one altitude. A single scan angle would sample progressively higher air farther from the radar.',
    source: {
      title: 'Environment and Climate Change Canada, Weather Radar: CAPPI',
      url: 'https://wis2-gdc.weather.gc.ca/collections/wis2-discovery-metadata/items/urn:wmo:md:ca-eccc-msc:aae10768-0c0c-4670-807e-8e893680887e?f=html',
    },
  },
  {
    terms: ['a smgcs', 'asmgcs', 'advanced surface movement guidance and control system'],
    answer: 'A-SMGCS stands for Advanced Surface Movement Guidance and Control System. EUROCONTROL describes four services for managing movements on the airport surface: surveillance, airport safety support, routing and guidance. The airport’s needs and applicable mandates determine which services it implements.',
    source: {
      title: 'EUROCONTROL Specification for A-SMGCS Services, edition 2.0',
      url: 'https://www.eurocontrol.int/publication/eurocontrol-specification-smgcs-services',
    },
  },
  {
    terms: ['a cdm', 'acdm', 'airport cdm', 'airport collaborative decision making'],
    answer: 'A-CDM stands for Airport Collaborative Decision Making. Airport operators, airlines, ground handlers and air navigation service providers share flight progress during turnaround and before departure. For example, a milestone on the inbound flight can trigger an updated take-off estimate for the outbound flight.',
    source: {
      title: 'EUROCONTROL Specification for Airport Collaborative Decision Making, edition 1.0',
      url: 'https://www.eurocontrol.int/publication/eurocontrol-specification-airport-collaborative-decision-making-cdm',
    },
  },
  {
    terms: ['atis', 'automatic terminal information service'],
    answer: 'ATIS stands for Automatic Terminal Information Service. It repeatedly provides arriving and departing pilots with routine airport information, such as the weather and runway in use. This reduces the need for a controller to repeat the same details to each aircraft.',
    source: {
      title: 'FAA Pilot/Controller Glossary, Automatic Terminal Information Service',
      url: 'https://www.faa.gov/air_traffic/publications/atpubs/pcg_html/glossary-a.html',
    },
  },
  {
    terms: ['d atis', 'datis', 'digital atis', 'data link atis', 'digital automatic terminal information service', 'data link automatic terminal information service'],
    answer: 'D-ATIS delivers Automatic Terminal Information Service (ATIS) information to the cockpit as a text message over a data link. The FAA glossary calls it Digital ATIS and lists the ICAO term as Data Link Automatic Terminal Information Service.',
    source: {
      title: 'FAA Pilot/Controller Glossary, D-ATIS',
      url: 'https://www.faa.gov/air_traffic/publications/atpubs/pcg_html/glossary-d.html',
    },
  },
  {
    terms: ['awos', 'automated weather observing system'],
    answer: 'AWOS stands for Automated Weather Observing System. It uses sensors to measure and report local weather. The installed sensors determine what it can report. For example, the FAA describes configurations that report wind and temperature, and others that also report visibility.',
    source: {
      title: 'FAA Advisory Circular 150/5220-16E, section 1.2: Weather Sensors',
      url: 'https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_150_5220-16E_w-chg1.pdf',
    },
  },
];

const definitionQuestions = [
  /^(?:what is|define|explain|give me (?:a|the) definition of) (.+)$/,
  /^what does (.+) (?:stand for|mean)$/,
  /^(?:what is the (?:meaning|purpose|definition) of|what is meant by) (.+)$/,
  /^(?:what is (.+) used for|what does (.+) do)$/,
  /^(.+) (?:meaning|definition)$/,
];

function normalizeQuestion(question: string) {
  return question.normalize('NFKC').toLowerCase().trim()
    .replace(/[’']/gu, "'").replace(/^what's\b/, 'what is')
    .replace(/[-‐‑‒–—]/gu, ' ').replace(/&/gu, ' and ')
    .replace(/[?.!]+$/u, '').replace(/^(?:can|could) you (?:please )?/u, '')
    .replace(/^please /u, '').replace(/,? please$/u, '')
    .replace(/ (?:in simple terms|in plain (?:english|language)|in aviation)$/u, '')
    .replace(/\s+/gu, ' ').trim();
}

// CAAP topics are public background. Match the full request so an approval, bid or
// project status involving CAAP can never be answered with an agency overview.
const caapTopics = {
  overview: {
    answer: 'CAAP is the Civil Aviation Authority of the Philippines. It sets rules for aircraft inspections and registration, and it operates and maintains air navigation facilities. [public source]\n\nWould you like to hear about air navigation or pilot licensing?',
    source: {title:'CAAP, Mandates and Functions',url:'https://www.caap.gov.ph/mandates-and-functions/'},
  },
  navigation: {
    answer: 'CAAP publishes the rules for air navigation services. For example, its regulations cover the radios used for voice communication, the radar used for surveillance, and how those systems are maintained. [public source]',
    source: {title:'CAAP, Civil Aviation Regulations on Air Navigation Services, Parts 8 to 10',url:'https://www.caap.gov.ph/civil-aviation-regulations-air-navigation-services/'},
  },
  licensing: {
    answer: 'CAAP’s Licensing and Certification Department oversees personnel licensing. For pilots, its work includes issuing and renewing licenses and ratings. It also oversees approvals for aviation training organizations. [public source]',
    source: {title:'CAAP Licensing and Certification Department, Divisions',url:'https://lcd.caap.gov.ph/divisions.html'},
  },
  history: {
    answer: 'Republic Act No. 9497 created CAAP in 2008. The law gave the agency responsibility for regulating civil aviation and promoting safe and efficient air transport in the Philippines. [public source]',
    source: {title:'CAAP, Civil Aviation Authority Act of 2008',url:'https://caap.gov.ph/wp-content/uploads/2024/12/Civil-Aviation-Authority-Act-of-2008.pdf'},
  },
};

type CaapTopic = keyof typeof caapTopics;
function caapTopic(question: string, previousTopic?: CaapTopic): CaapTopic | null {
  const text = normalizeQuestion(question).replace(/\bcivil aviation authority of the philippines\b/g,'caap');
  if (/^(?:(?:what(?: else)? (?:do you know|can you (?:tell me|share)) about|tell me (?:more )?about|what (?:is|about)|who (?:is|are)|explain|describe|give me (?:an overview|some background) (?:of|on)) (?:the )?caap|(?:the )?caap|what does caap (?:do|stand for|mean)|what(?: is| are) caap's? (?:role|functions|responsibilities|mandate))$/.test(text)) return 'overview';
  if (/^(?:(?:what (?:does|did) caap do (?:for|in)|(?:tell me|what) about|explain) (?:caap's? )?air navigation(?: services)?|what (?:is caap's? role|role does caap play) in air navigation)$/.test(text) && /\bcaap\b/.test(text)) return 'navigation';
  if (/^(?:how does caap (?:handle|manage|oversee) (?:pilot|personnel) licensing|does caap (?:license pilots|issue pilot licen[sc]es)|(?:tell me about|explain) caap(?:'s)? (?:pilot|personnel) licensing)$/.test(text)) return 'licensing';
  if (/^(?:when was caap (?:created|founded|established)|(?:tell me about|explain) caap's history|what law created caap)$/.test(text)) return 'history';
  if (!previousTopic) return null;
  if (/^(?:(?:tell me (?:more )?about|what about|and|explain) )?(?:its |the )?air navigation(?: services)?$|^what does it do (?:for|in) air navigation$/.test(text)) return 'navigation';
  if (/^(?:(?:tell me (?:more )?about|what about|and|explain) )?(?:its |the )?(?:pilot|personnel) licensing$|^how does it (?:handle|manage|oversee) pilot licensing$/.test(text)) return 'licensing';
  if (/^when was it (?:created|founded|established)$/.test(text)) return 'history';
  if (/^(?:what else|tell me more|go on|what else do you know(?: about (?:it|them))?)$/.test(text)) return previousTopic === 'history' ? 'navigation' : 'history';
  return null;
}

export function publicCaapAnswer(question: string, previousQuestion = '') {
  const previousTopic = previousQuestion ? caapTopic(previousQuestion) : null;
  const topic = caapTopic(question, previousTopic ?? undefined);
  if (!topic) return null;
  const entry = caapTopics[topic];
  return {answer:entry.answer,externalSources:[{...entry.source}]};
}

export function publicDefinitionAnswer(question: string, previousQuestion = '') {
  const caap = publicCaapAnswer(question,previousQuestion);
  if (caap) return caap;
  const normalized = normalizeQuestion(question);
  for (const pattern of definitionQuestions) {
    const match = normalized.match(pattern);
    const term = match?.slice(1).find(Boolean);
    if (!term) continue;
    const withoutArticle = term.replace(/^(?:the|a|an) /, '');
    const entry = glossary.find(item => item.terms.includes(term) || item.terms.includes(withoutArticle));
    if (entry) return {answer: entry.answer + ' [public source]', externalSources: [{...entry.source}]};
  }
  return null;
}
