// The standalone build supplies the report bytes. Pages serves the same files by relative URL.
declare const NNIC_EMBEDDED_REPORTS: Record<string,string> | undefined;
const reports = new Set(['/reports/CAPPI_Project_Brief.pdf','/reports/DRATF_Refurbishment_Brief.pdf','/reports/ASMGCS_TOR_Review_Brief.pdf']);
const localUrls = new Map<string,string>();

export function pdfUrl(path: string) {
  if (!reports.has(path)) return undefined;
  if (typeof NNIC_EMBEDDED_REPORTS === 'undefined') return '.' + path;
  if (!localUrls.has(path)) {
    const data = Uint8Array.from(atob(NNIC_EMBEDDED_REPORTS[path]), char => char.charCodeAt(0));
    localUrls.set(path, URL.createObjectURL(new Blob([data], {type:'application/pdf'})));
  }
  return localUrls.get(path);
}
