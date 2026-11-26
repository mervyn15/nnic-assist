import { unzipSync, type Unzipped } from 'fflate';
interface Passage {location:string; text:string; primary:string}
type LocalSource = {name:string; passages: Passage[]};

const utf8 = new TextEncoder();
const originalLimit = 32 * 1024 * 1024;
const indexLimit = 4 * 1024 * 1024;
const passageLimit = 20000;
const sectionSize = 800;
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const noText = 'No searchable text was found. For scans or image-only slides, upload a copy with OCR text.';

function formatCell(value: unknown): string {
  if (value == null) return '';
  return clean(value instanceof Date ? value.toISOString().slice(0,10) : String(value));
}

// Split at a word when possible, preserving the original sentence and citation label.
function splitText(value: string): string[] {
  let text = clean(value);
  const parts = [];
  while (text.length > sectionSize) {
    const wordEnd = text.lastIndexOf(' ', sectionSize);
    const end = wordEnd > sectionSize / 2 ? wordEnd : sectionSize;
    parts.push(text.slice(0, end));
    text = text.slice(end).trimStart();
  }
  if (text) parts.push(text);
  return parts;
}

type Add = (location: string, text: string, primary?: string) => void;

function readArchive(data: Uint8Array, keep: (name: string) => boolean): Unzipped {
  let count = 0, size = 0;
  return unzipSync(data, {filter(entry) {
    if (++count > 10000) throw Error('This file has too many internal parts.');
    if (!keep(entry.name)) return false;
    size += entry.originalSize;
    if (size > 64 * 1024 * 1024) throw Error('The expanded document is too large to index.');
    return true;
  }});
}

async function workbook(data: Uint8Array<ArrayBuffer>, add: Add) {
  // The workbook reader expands its own archive. Inspect the archive directory before handing it over.
  let expanded = 0, entries = 0;
  unzipSync(data, {filter(entry) {
    expanded += entry.originalSize;
    if (++entries > 10000 || expanded > 64 * 1024 * 1024) throw Error('The expanded workbook is too large to index.');
    return false;
  }});
  const {default: readWorkbook} = await import('read-excel-file/universal');
  for (const {sheet, data: rows} of await readWorkbook(data.buffer)) {
    const header = rows.slice(0,8).findIndex(row => row.filter(v => typeof v === 'string' && v.trim()).length >= 3);
    const labels = header < 0 ? [] : rows[header].map(formatCell);
    rows.forEach((row, index) => {
      if (index === header) return;
      const cells = row.map(formatCell);
      const text = cells.map((value,col) => {
        if (!value) return '';
        const label = index > header && labels[col];
        return label ? label + ': ' + value : value;
      }).filter(Boolean).join(' | ');
      // Preserve most register rows whole so all status and source columns remain available.
      const parts = text.length <= 1600 ? [text] : splitText(text);
      for (const part of parts) add(sheet + ', row ' + (index+1), part, cells.find(Boolean) ?? '');
    });
  }
}

async function office(data: Uint8Array, type: 'docx'|'pptx', add: Add) {
  const parts = readArchive(data, type === 'docx' ? name => name === 'word/document.xml' :
    name => /^(?:ppt\/presentation\.xml|ppt\/_rels\/presentation\.xml\.rels|ppt\/slides\/slide\d+\.xml)$/.test(name));
  function xml(name: string) {
    if (!parts[name]) throw Error('This Office document is missing a required part.');
    const source = new TextDecoder().decode(parts[name]);
    if (/<!DOCTYPE/i.test(source)) throw Error('Document XML with a DTD cannot be indexed.');
    const document = new DOMParser().parseFromString(source, 'application/xml');
    if (document.querySelector('parsererror')) throw Error('This Office document contains invalid XML.');
    return document;
  }
  function paragraphs(name: string) {
    return Array.from(xml(name).getElementsByTagNameNS('*', 'p'), paragraph => {
      const tokens = Array.from(paragraph.getElementsByTagName('*'));
      return clean(tokens.map(t => t.localName === 't' ? t.textContent : ['tab','br','cr'].includes(t.localName ?? '') ? ' ' : '').join(''));
    });
  }
  if (type === 'docx') {
    let group: string[] = [], start = 0, end = 0, length = 0;
    const flush = () => {
      if (!group.length) return;
      const label = start === end ? 'paragraph ' + start : 'paragraphs ' + start + '–' + end;
      for (const piece of splitText(group.join(' '))) add(label, piece);
      group = [];
      length = 0;
    };
    paragraphs('word/document.xml').forEach((text, idx) => {
      if (!text) return;
      if (length + text.length > sectionSize) flush();
      if (!group.length) start = idx + 1;
      group.push(text);
      length += text.length + 1;
      end = idx + 1;
    });
    flush();
  } else {
    // Slide file numbers need not match presentation order after slides have been rearranged.
    const targets = new Map(Array.from(xml('ppt/_rels/presentation.xml.rels').getElementsByTagNameNS('*','Relationship'),
      element => [element.getAttribute('Id'), element.getAttribute('Target')]));
    const order = Array.from(xml('ppt/presentation.xml').getElementsByTagNameNS('*','sldId'));
    order.forEach((slide, index) => {
      const ref = Array.from(slide.attributes).find(attr => attr.localName === 'id' && !!attr.namespaceURI);
      const target = targets.get(ref?.value ?? '');
      if (!target) throw Error('The slide order could not be read.');
      const path = target.startsWith('/') ? target.slice(1) : 'ppt/' + target.replace(/^\.\//, '');
      for (const piece of splitText(paragraphs(path).join(' '))) add('slide ' + (index + 1), piece);
    });
  }
}

async function pdf(data: Uint8Array<ArrayBuffer>, add: Add) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./pdf.worker.mjs', import.meta.url).href;
  }
  const loading = pdfjs.getDocument({data, isEvalSupported: false, disableFontFace: true, useWorkerFetch: false, useSystemFonts: false});
  try {
    const document = await loading.promise;
    if (document.numPages > 3000) throw Error('This PDF has more than 3,000 pages.');
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      const text = content.items.map(item => 'str' in item ? item.str : '').join(' ');
      for (const piece of splitText(text)) add('page ' + number, piece);
      page.cleanup();
    }
  } finally {
    await loading.destroy();
  }
}

export async function indexFile(file: File): Promise<LocalSource> {
  const type = file.name.split('.').at(-1)?.toLowerCase();
  if (!type || !['pdf','docx','pptx','xlsx','md','txt'].includes(type)) throw Error('Choose a PDF, Word, PowerPoint, Excel, text, or Markdown file.');
  if (file.size > originalLimit) throw Error('Choose a file of 32 MB or less.');
  const passages: Passage[] = [];
  let bytes = utf8.encode(JSON.stringify({name:file.name, passages:[]})).length;
  const add: Add = (location, text, primary = '') => {
    if (!text) return;
    const passage = {location, text, primary};
    bytes += utf8.encode(JSON.stringify(passage)).length + (passages.length ? 1 : 0);
    if (bytes > indexLimit || passages.length >= passageLimit) throw Error('The searchable text exceeds the per-file limit. Split the document and try again.');
    passages.push(passage);
  };
  if (type === 'txt' || type === 'md') {
    const lines = (await file.text()).split(/\r?\n/);
    lines.forEach((line,i) => splitText(line).forEach(part => add('line ' + (i+1), part)));
  } else {
    const data = new Uint8Array(await file.arrayBuffer());
    if (type === 'xlsx') await workbook(data, add);
    else if (type === 'docx' || type === 'pptx') await office(data, type, add);
    else await pdf(data, add);
  }
  if (!passages.length) throw Error(noText);
  return {name:file.name, passages};
}
