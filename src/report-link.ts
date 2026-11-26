// Allow only the published demo briefs; saved chat history may contain older paths.
const reports = new Set(['/reports/CAPPI_Project_Brief.pdf','/reports/DRATF_Refurbishment_Brief.pdf','/reports/ASMGCS_TOR_Review_Brief.pdf']);
export const pdfUrl = (path: string) => reports.has(path) ? '.' + path : undefined;
